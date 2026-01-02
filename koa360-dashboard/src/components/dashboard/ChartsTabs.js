import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faAngleRight,
  faTemperatureHigh,
  faWaveSquare,
  faHeartbeat,
} from "@fortawesome/free-solid-svg-icons";

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
  AreaChart,
} from "recharts";

import KOASensorSeverity from "../PredicForms/KOASensorSeverity";

export default function ChartsTabs({
  activeTab,
  setActiveTab,
  data,
  deviceId,
}) {
  const card = "bg-white border border-slate-200 rounded-2xl shadow-sm";
  const MAX_KNEE_ANGLE = 120;

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatMonthDay = (timestamp) =>
    new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "2-digit",
    });

  const formatAccel = (value) => `${Math.round(Number(value) || 0)} m/s²`;
  const formatTemp = (value) => `${Math.round(Number(value) || 0)}°C`;

  const formatDegrees = (value) => {
    let degrees = Number(value) || 0;
    if (degrees >= 0 && degrees <= 1) degrees *= MAX_KNEE_ANGLE;
    return `${Math.round(degrees)}°`;
  };

  const TabButton = ({ id, icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-1 rounded-xl text-sm font-extrabold border transition flex items-center gap-2 ${
        activeTab === id
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
    </button>
  );

  return (
    <div className={`${card} p-4 md:p-12 relative top-16`}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-4">
        <TabButton id="severity" icon={faHeartbeat} label="Progress" />
        <TabButton id="motion" icon={faArrowsRotate} label="Motion" />
        <TabButton id="angle" icon={faAngleRight} label="Angle" />
        <TabButton id="temp" icon={faTemperatureHigh} label="Temperature" />
        <TabButton id="vag" icon={faWaveSquare} label="VAG" />
      </div>

      {/* Content */}
      <div className="h-[300px]">
        {activeTab === "severity" && (
          <KOASensorSeverity deviceId={deviceId} />
        )}

        {activeTab === "motion" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} />
              <YAxis tickFormatter={formatAccel} />
              <Tooltip labelFormatter={formatTime} />
              <Legend />
              <Line dataKey="upperAccelMag" stroke="#ef4444" dot={false} />
              <Line dataKey="lowerAccelMag" stroke="#3b82f6" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === "angle" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} />
              <YAxis tickFormatter={formatDegrees} />
              <Tooltip labelFormatter={formatTime} />
              <Area
                dataKey="avg_knee_angle"
                stroke="#f97316"
                fill="#f9731620"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "temp" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} />
              <YAxis tickFormatter={formatTemp} />
              <Tooltip labelFormatter={formatTime} />
              <Area
                dataKey="avg_temperature.object"
                stroke="#3b82f6"
                fill="#3b82f620"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "vag" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} />
              <YAxis />
              <Tooltip labelFormatter={formatTime} />
              <Legend />
              <Line dataKey="avg_piezo.raw" stroke="#ff7300" dot={false} />
              <Line
                dataKey="avg_piezo.voltage"
                stroke="#8884d8"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
