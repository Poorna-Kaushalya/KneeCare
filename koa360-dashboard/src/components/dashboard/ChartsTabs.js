import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faAngleRight,
  faTemperatureHigh,
  faWaveSquare,
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

export default function ChartsTabs({ activeTab, setActiveTab, data }) {
  const card = "bg-white border border-slate-200 rounded-2xl shadow-sm";
  const chartAxisLabelStyle = { fontSize: "0.7rem", fill: "#64748b" };
  const MAX_KNEE_ANGLE = 120;

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatMonthDay = (timestamp) =>
    new Date(timestamp).toLocaleDateString([], { month: "short", day: "2-digit" });

  const formatAccel = (value) => `${Math.round(Number(value) || 0)} m/s²`;

  const formatDegrees = (value) => {
    let degrees = Number(value) || 0;
    if (degrees >= 0 && degrees <= 1) degrees = degrees * MAX_KNEE_ANGLE;
    return `${Math.round(degrees)}°`;
  };

  const formatTemp = (value) => `${Math.round(Number(value) || 0)}`;

  const TabButton = ({ id, icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-xl text-sm font-extrabold border transition flex items-center gap-2 ${
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
    <>
      <div className={`${card} p-4 md:p-12 relative top-16`}>
        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-4">
          <TabButton id="motion" icon={faArrowsRotate} label="Motion" />
          <TabButton id="angle" icon={faAngleRight} label="Angle" />
          <TabButton id="temp" icon={faTemperatureHigh} label="Temperature" />
          <TabButton id="vag" icon={faWaveSquare} label="VAG" />
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          {activeTab === "motion" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-800">Knee Motion (m/s²)</h3>
                <span className="text-xs text-slate-500">Upper vs Lower magnitude</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
                  <YAxis
                    tickFormatter={formatAccel}
                    style={chartAxisLabelStyle}
                    allowDecimals={false}  
                  />
                  <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "0.75rem" }} />
                  <Line type="linear" dataKey="upperAccelMag" stroke="#ef4444" dot={false} name="Upper" strokeWidth={2} />
                  <Line type="linear" dataKey="lowerAccelMag" stroke="#3b82f6" dot={false} name="Lower" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          {activeTab === "angle" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-800">Knee Angle (degrees)</h3>
                <span className="text-xs text-slate-500">Avg knee angle</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
                  <YAxis
                    tickFormatter={formatDegrees}
                    style={chartAxisLabelStyle}
                    allowDecimals={false}   // ✅ integer ticks
                  />
                  <Tooltip labelFormatter={formatTime} formatter={(v) => formatDegrees(v)} />
                  <Area type="linear" dataKey="avg_knee_angle" stroke="#f97316" fill="#f9731620" dot={false} name="Angle" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

          {activeTab === "temp" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-800">Knee Temperature (°C)</h3>
                <span className="text-xs text-slate-500">Object temp</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
                  <YAxis
                    tickFormatter={formatTemp}
                    style={chartAxisLabelStyle}
                    allowDecimals={false}   // ✅ integer ticks
                  />
                  <Tooltip labelFormatter={formatTime} formatter={(v) => formatTemp(v)} />
                  <Area type="linear" dataKey="avg_temperature.object" stroke="#3b82f6" fill="#3b82f620" dot={false} name="Object Temp" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

          {activeTab === "vag" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-800">Vibroarthrography (VAG)</h3>
                <span className="text-xs text-slate-500">Piezo signals</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
                  <YAxis style={chartAxisLabelStyle} allowDecimals={false} />
                  <Tooltip labelFormatter={formatTime} formatter={(v) => Math.round(Number(v) || 0)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "0.75rem" }} />
                  <Line type="linear" dataKey="avg_piezo.raw" stroke="#ff7300" dot={false} name="Raw" strokeWidth={2} />
                  <Line type="linear" dataKey="avg_piezo.voltage" stroke="#8884d8" dot={false} name="Voltage" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </>
  );
}
