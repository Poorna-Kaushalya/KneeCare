// src/pages/Dashboard.js

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart 
} from "recharts";
import api from "../api/api"; 
import Navbar2 from "../components/SignInNavbar"; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoePrints, faThermometerHalf } from '@fortawesome/free-solid-svg-icons';

function Dashboard({ logout }) {
  const [data, setData] = useState([]);
  const [steps, setSteps] = useState(0);
  const [envTemp, setEnvTemp] = useState(0);

  const MAX_KNEE_ANGLE = 120;

  // --- Data Formatting Functions ---
  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAccel = (value) => `${value.toFixed(2)} m/s²`;
  const formatGyro = (value) => `${value.toFixed(1)}°/s`;
  const formatDegrees = (value) => {
    let degrees = value;
    if (value >= 0 && value <= 1) {
      degrees = value * MAX_KNEE_ANGLE;
    }
    return degrees % 1 === 0 ? `${degrees}°` : `${degrees.toFixed(1)}°`;
  };
  const formatTemp = (value) => `${value.toFixed(2)} °C`;

  // --- Data Fetching and Processing Logic ---
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/api/sensor-data");
      const allData = res.data;
      const lastPoints = allData.slice(-600).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setData(lastPoints);

      // --- Step Count Calculation ---
      const magnitudes = lastPoints.map((d) => {
        const upperMag = Math.sqrt(
          (d.avg_upper?.ax || 0) ** 2 + (d.avg_upper?.ay || 0) ** 2 + (d.avg_upper?.az || 0) ** 2
        );
        const lowerMag = Math.sqrt(
          (d.avg_lower?.ax || 0) ** 2 + (d.avg_lower?.ay || 0) ** 2 + (d.avg_lower?.az || 0) ** 2
        );
        const gyroMag =
          Math.sqrt(
            (d.avg_upper?.gx || 0) ** 2 + (d.avg_upper?.gy || 0) ** 2 + (d.avg_upper?.gz || 0) ** 2
          ) +
          Math.sqrt(
            (d.avg_lower?.gx || 0) ** 2 + (d.avg_lower?.gy || 0) ** 2 + (d.avg_lower?.gz || 0) ** 2
          );
        return upperMag + lowerMag + 0.5 * gyroMag;
      });

      const smoothMagnitudes = magnitudes.map((val, i, arr) => {
        const windowSize = 5;
        const start = Math.max(0, i - windowSize + 1);
        const window = arr.slice(start, i + 1);
        return window.reduce((sum, v) => sum + v, 0) / window.length;
      });

      let stepCount = 0;
      const threshold = 1.5;
      for (let i = 1; i < smoothMagnitudes.length - 1; i++) {
        if (
          smoothMagnitudes[i] > threshold &&
          smoothMagnitudes[i] > smoothMagnitudes[i - 1] &&
          smoothMagnitudes[i] > smoothMagnitudes[i + 1]
        ) {
          stepCount++;
        }
      }
      setSteps(stepCount);

      // --- Environment Temperature ---
      if (lastPoints.length > 0 && lastPoints[lastPoints.length - 1].avg_temperature?.ambient != null) {
        setEnvTemp(lastPoints[lastPoints.length - 1].avg_temperature.ambient);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        logout();
      } else {
        console.error("Data fetch error:", err);
      }
    }
  }, [logout]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Fetch data every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

const pageBg = "min-h-screen bg-gradient-to-br from-blue-50 to-white font-sans text-gray-800";
  const containerPadding = "p-4 md:p-6 lg:p-20"; 
  const dashboardTitleClasses = "text-xl lg:text-2xl font-bold text-gray-800 mb-0 relative mt-[-5]"; 
  const summaryMetricCardClasses = "flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-blue-100";
  const chartCardClasses = "bg-white rounded-lg shadow-md p-4 lg:p-6 flex-1 m-1 min-w-[360px] lg:min-w-[calc(33.333%-8px)] h-[270px] transition-all";
  const chartTitleClasses = "text-lg md:text-base font-semibold text-gray-700 mb-3";
  const chartAxisLabelStyle = { fontSize: '0.6rem', fill: '#6b7280' };

  return (
    <div className={pageBg}>
      <Navbar2 logout={logout} />
      <br />
      <div className={containerPadding}>
        <h1 className={dashboardTitleClasses}>
          Knee Monitor Dashboard
        </h1>

        {/* --- Top Summary Metrics Section --- */}
        <div className="flex flex-wrap items-center gap-4 mb-2 justify-center relative top-[-15]">
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faShoePrints} className="text-blue-500 mr-3 text-lg" />
            <span className="text-base font-medium">
              Step Count: <span className="text-blue-600 font-bold">{steps}</span>
            </span>
          </div>
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faThermometerHalf} className="text-red-500 mr-3 text-lg" />
            <span className="text-base font-medium">
              Environment Tempurature: <span className="text-red-600 font-bold">{envTemp.toFixed(2)} °C</span>
            </span>
          </div>
        </div>

        {/* --- Charts Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Upper Leg Motion */}
          <div className={chartCardClasses}>
            <h3 className={chartTitleClasses}>Upper Leg Motion (m/s²)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                <YAxis tickFormatter={formatAccel} style={chartAxisLabelStyle} />
                <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avg_upper.ax" stroke="#ef4444" dot={false} name="Upper Ax" strokeWidth={2} /> {/* Red */}
                <Line type="monotone" dataKey="avg_upper.ay" stroke="#3b82f6" dot={false} name="Upper Ay" strokeWidth={2} /> {/* Blue */}
                <Line type="monotone" dataKey="avg_upper.az" stroke="#22c55e" dot={false} name="Upper Az" strokeWidth={2} /> {/* Green */}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Upper Leg Rotation */}
          <div className={chartCardClasses}>
            <h3 className={chartTitleClasses}>Upper Leg Rotation (°/s)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                <YAxis tickFormatter={formatGyro} style={chartAxisLabelStyle} />
                <Tooltip labelFormatter={formatTime} formatter={formatGyro} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avg_upper.gx" stroke="#f97316" dot={false} name="Upper Gx" strokeWidth={2} /> {/* Orange */}
                <Line type="monotone" dataKey="avg_upper.gy" stroke="#8b5cf6" dot={false} name="Upper Gy" strokeWidth={2} /> {/* Violet */}
                <Line type="monotone" dataKey="avg_upper.gz" stroke="#a16207" dot={false} name="Upper Gz" strokeWidth={2} /> {/* Amber-700 */}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lower Leg Motion */}
          <div className={chartCardClasses}>
            <h3 className={chartTitleClasses}>Lower Leg Motion (m/s²)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                <YAxis tickFormatter={formatAccel} style={chartAxisLabelStyle} />
                <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avg_lower.ax" stroke="#ef4444" dot={false} name="Lower Ax" strokeWidth={2} />
                <Line type="monotone" dataKey="avg_lower.ay" stroke="#3b82f6" dot={false} name="Lower Ay" strokeWidth={2} />
                <Line type="monotone" dataKey="avg_lower.az" stroke="#22c55e" dot={false} name="Lower Az" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lower Leg Rotation */}
          <div className={chartCardClasses}>
            <h3 className={chartTitleClasses}>Lower Leg Rotation (°/s)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                <YAxis tickFormatter={formatGyro} style={chartAxisLabelStyle} />
                <Tooltip labelFormatter={formatTime} formatter={formatGyro} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avg_lower.gx" stroke="#f97316" dot={false} name="Lower Gx" strokeWidth={2} />
                <Line type="monotone" dataKey="avg_lower.gy" stroke="#8b5cf6" dot={false} name="Lower Gy" strokeWidth={2} />
                <Line type="monotone" dataKey="avg_lower.gz" stroke="#a16207" dot={false} name="Lower Gz" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Knee Angle Chart */}
          <div className={chartCardClasses}>
            <h3 className={chartTitleClasses}>Knee Angle (°)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                <YAxis tickFormatter={formatDegrees} style={chartAxisLabelStyle} />
                <Tooltip labelFormatter={formatTime} formatter={(v) => formatDegrees(v)} />
                {/* Orange line with a subtle orange area fill */}
                <Area type="monotone" dataKey="avg_knee_angle" stroke="#f97316" fill="#f9731640" dot={false} name="Knee Angle" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Knee Temperature Chart  */}
          <div className={chartCardClasses}>
            <h3 className={chartTitleClasses}>Knee Temperature (°C)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                <YAxis tickFormatter={formatTemp} style={chartAxisLabelStyle} />
                <Tooltip labelFormatter={formatTime} formatter={(v) => formatTemp(v)} />
                {/* Blue line with a subtle blue area fill */}
                <Area
                  type="monotone"
                  dataKey="avg_temperature.object"
                  stroke="#3b82f6"
                  fill="#3b82f640"
                  dot={false}
                  name="Object Temp"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;