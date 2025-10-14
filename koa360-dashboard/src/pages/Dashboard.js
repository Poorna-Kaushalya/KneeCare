import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api/api";
import Navbar2 from "../components/SignInNavbar";

function Dashboard({ logout }) {
  const [data, setData] = useState([]);
  const [steps, setSteps] = useState(0);

  const MAX_KNEE_ANGLE = 120;

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatAccel = (value) => `${value.toFixed(2)} m/s²`;
  const formatGyro = (value) => `${value.toFixed(1)}°/s`;
  const formatDegrees = (value) => {
    let degrees = value;
    if (value < 10) degrees = value * MAX_KNEE_ANGLE;
    return degrees % 1 === 0 ? `${degrees}°` : `${degrees.toFixed(1)}°`;
  };
  const formatTemp = (value) => `${value.toFixed(2)} °C`;

  // Fetch Sensor Data
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/api/sensor-data");
      const allData = res.data;
      const lastPoints = allData.slice(-600).reverse();
      setData(lastPoints);

      // Step count calculation
      const magnitudes = lastPoints.map((d) => {
        const upperMag = Math.sqrt(
          d.avg_upper.ax ** 2 + d.avg_upper.ay ** 2 + d.avg_upper.az ** 2
        );
        const lowerMag = Math.sqrt(
          d.avg_lower.ax ** 2 + d.avg_lower.ay ** 2 + d.avg_lower.az ** 2
        );
        const gyroMag =
          Math.sqrt(
            d.avg_upper.gx ** 2 + d.avg_upper.gy ** 2 + d.avg_upper.gz ** 2
          ) +
          Math.sqrt(
            d.avg_lower.gx ** 2 + d.avg_lower.gy ** 2 + d.avg_lower.gz ** 2
          );
        return upperMag + lowerMag + 0.5 * gyroMag;
      });

      // Moving average smoothing
      const smoothMagnitudes = magnitudes.map((val, i, arr) => {
        const windowSize = 5;
        const start = Math.max(0, i - windowSize + 1);
        const window = arr.slice(start, i + 1);
        return window.reduce((sum, v) => sum + v, 0) / window.length;
      });

      // Peak detection
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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div>
      <Navbar2 logout={logout} />
      <div className="p-8">
        <div className="mt-16 mb-4">
          <h2 className="text-xl font-bold">
            <br />
            Step Count: <span className="text-blue-500">{steps}</span>
          </h2>
        </div>
        <hr className="w-full border-t-2 border-blue-400 my-4" />

        {/*  Upper & Lower Leg Charts */}
        <div className="flex flex-wrap">
          {/* Upper Acceleration */}
          <div className="flex-1 min-w-[350px]">
            <h3 className="mb-2 font-semibold">Upper Leg Motion (m/s²)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" horizontal={false} />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} />
                <YAxis domain={["auto", "auto"]} tickFormatter={formatAccel} />
                <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                <Line
                  type="monotone"
                  dataKey="avg_upper.ax"
                  stroke="red"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_upper.ay"
                  stroke="blue"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_upper.az"
                  stroke="green"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Upper Gyroscope */}
          <div className="flex-1 min-w-[350px]">
            <h3 className="mb-2 font-semibold">Upper Leg Rotation (°/s)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" horizontal={false} />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} />
                <YAxis domain={["auto", "auto"]} tickFormatter={formatGyro} />
                <Tooltip labelFormatter={formatTime} formatter={formatGyro} />
                <Line
                  type="monotone"
                  dataKey="avg_upper.gx"
                  stroke="orange"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_upper.gy"
                  stroke="purple"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_upper.gz"
                  stroke="brown"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lower Acceleration */}
          <div className="flex-1 min-w-[350px]">
            <h3 className="mb-2 font-semibold">Lower Leg Motion (m/s²)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" horizontal={false} />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} />
                <YAxis domain={["auto", "auto"]} tickFormatter={formatAccel} />
                <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                <Line
                  type="monotone"
                  dataKey="avg_lower.ax"
                  stroke="red"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_lower.ay"
                  stroke="blue"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_lower.az"
                  stroke="green"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Lower Gyroscope */}
          <div className="flex-1 min-w-[350px]">
            <h3 className="mb-2 font-semibold">Lower Leg Rotation (°/s)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" horizontal={false} />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} />
                <YAxis domain={["auto", "auto"]} tickFormatter={formatGyro} />
                <Tooltip labelFormatter={formatTime} formatter={formatGyro} />
                <Line
                  type="monotone"
                  dataKey="avg_lower.gx"
                  stroke="orange"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_lower.gy"
                  stroke="purple"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="avg_lower.gz"
                  stroke="brown"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <br />
        <br />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Knee Angle Chart */}
          <div>
            <h3 className="mb-2 font-semibold">Knee Angle (°)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" horizontal={false} />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={formatDegrees}
                />
                <Tooltip
                  labelFormatter={formatTime}
                  formatter={(v) => formatDegrees(v)}
                />
                <Line
                  type="monotone"
                  dataKey="avg_knee_angle"
                  stroke="orange"
                  dot={false}
                  name="Knee Angle"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Object Temperature Chart */}
          <div>
            <h3 className="mb-2 font-semibold">Temperature (°C)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" horizontal={false} />
                <XAxis dataKey="createdAt" tickFormatter={formatTime} />
                <YAxis domain={["auto", "auto"]} tickFormatter={formatTemp} />
                <Tooltip
                  labelFormatter={formatTime}
                  formatter={(v) => formatTemp(v)}
                />
                <Line
                  type="monotone"
                  dataKey="avg_temperature.object"
                  stroke="#1e90ff"
                  dot={false}
                  name="Object Temp"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
