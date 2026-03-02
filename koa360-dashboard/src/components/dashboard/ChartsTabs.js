import { useMemo, useState, useEffect } from "react";
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

export default function ChartsTabs({ activeTab, setActiveTab, data, deviceId }) {
  const MAX_KNEE_ANGLE = 120;
  const [vagTab, setVagTab] = useState("rms");

  // ✅ Show Vibrations tab first whenever device changes
  useEffect(() => {
    setActiveTab("vag");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatMonthDay = (timestamp) =>
    new Date(timestamp).toLocaleDateString([], { month: "short", day: "2-digit" });

  const formatAccel = (value) => `${Math.round(Number(value) || 0)} m/s²`;
  const formatTemp = (value) => `${Math.round(Number(value) || 0)}°C`;

  const formatDegrees = (value) => {
    let degrees = Number(value) || 0;
    if (degrees >= 0 && degrees <= 1) degrees *= MAX_KNEE_ANGLE;
    return `${Math.round(degrees)}°`;
  };

  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((row) => {
      const createdAt = row?.createdAt;

      const axU = Number(row?.avg_upper?.ax ?? row?.upper?.ax ?? 0);
      const ayU = Number(row?.avg_upper?.ay ?? row?.upper?.ay ?? 0);
      const azU = Number(row?.avg_upper?.az ?? row?.upper?.az ?? 0);

      const axL = Number(row?.avg_lower?.ax ?? row?.lower?.ax ?? 0);
      const ayL = Number(row?.avg_lower?.ay ?? row?.lower?.ay ?? 0);
      const azL = Number(row?.avg_lower?.az ?? row?.lower?.az ?? 0);

      const upperAccelMag =
        typeof row?.upperAccelMag === "number"
          ? row.upperAccelMag
          : Math.sqrt(axU * axU + ayU * ayU + azU * azU);

      const lowerAccelMag =
        typeof row?.lowerAccelMag === "number"
          ? row.lowerAccelMag
          : Math.sqrt(axL * axL + ayL * ayL + azL * azL);

      // ✅ temps
      const tempObject = Number(row?.avg_temperature?.object ?? row?.temperature?.object ?? 0);
      const tempAmbient = Number(row?.avg_temperature?.ambient ?? row?.temperature?.ambient ?? 0);

      // ✅ knee surface temperature (your DB field)
      const kneeTemp = Number(row?.avg_knee_tempurarture ?? row?.knee_tempurarture ?? 0);

      const kneeAngle = Number(row?.avg_knee_angle ?? row?.knee_angle ?? 0);

      const micAlignedRms = Number(row?.avg_microphone_features_aligned?.rms_amplitude ?? 0);
      const micAlignedPeakFreq = Number(row?.avg_microphone_features_aligned?.peak_frequency ?? 0);
      const micAlignedEntropy = Number(row?.avg_microphone_features_aligned?.spectral_entropy ?? 0);
      const micAlignedMeanFreq = Number(row?.avg_microphone_features_aligned?.mean_frequency ?? 0);

      return {
        ...row,
        createdAt,
        upperAccelMag,
        lowerAccelMag,
        kneeAngle,

        // temp series
        tempObject,
        tempAmbient,
        kneeTemp,

        // vibration series
        micAlignedRms,
        micAlignedPeakFreq,
        micAlignedEntropy,
        micAlignedMeanFreq,
      };
    });
  }, [data]);

  const latest = useMemo(() => {
    if (!chartData.length) return null;
    return chartData[chartData.length - 1];
  }, [chartData]);

  const TabButton = ({ id, icon, label, activeColor }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        type="button"
        className={`px-4 py-2 rounded-full text-sm font-extrabold border transition flex items-center gap-2
          ${
            active
              ? `${activeColor} text-white border-transparent shadow-sm`
              : "bg-white text-slate-700 border-sky-100 hover:bg-sky-50"
          }`}
      >
        <FontAwesomeIcon icon={icon} />
        {label}
      </button>
    );
  };

  return (
    <div className="rounded-1xl border border-sky-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 bg-gradient-to-r from-sky-50 to-emerald-50 border-b border-sky-100">
        <div className="flex items-center justify-between gap-1">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Sensor Analytics</div>
          </div>

          <div className="text-xs text-slate-500">
            Last updated:{" "}
            {latest?.createdAt ? new Date(latest.createdAt).toLocaleTimeString() : "—"}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-2 pb-2">
          <TabButton id="severity" icon={faHeartbeat} label="Progress" activeColor="bg-emerald-600" />
          <TabButton id="vag" icon={faWaveSquare} label="Vibrations" activeColor="bg-teal-600" />
          <TabButton id="motion" icon={faArrowsRotate} label="Motion" activeColor="bg-sky-600" />
          <TabButton id="angle" icon={faAngleRight} label="Angle" activeColor="bg-violet-600" />
          <TabButton id="temp" icon={faTemperatureHigh} label="Temperature" activeColor="bg-amber-500" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="h-[320px] md:h-[360px]">
          {activeTab === "severity" && <KOASensorSeverity deviceId={deviceId} />}

          {activeTab === "motion" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatAccel} tick={{ fontSize: 12 }} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip labelFormatter={formatTime} />
                <Legend />
                <Line name="Upper Accel Mag" dataKey="upperAccelMag" stroke="#ef4444" strokeWidth={2} dot={false} type="monotone" />
                <Line name="Lower Accel Mag" dataKey="lowerAccelMag" stroke="#0284c7" strokeWidth={2} dot={false} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === "angle" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatDegrees} tick={{ fontSize: 12 }} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip labelFormatter={formatTime} />
                <Area
                  name="Knee Angle"
                  dataKey="kneeAngle"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fillOpacity={0.12}
                  fill="#7c3aed"
                  dot={false}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* ✅ UPDATED TEMP TAB: shows Knee Temp + Ambient Temp */}
          {activeTab === "temp" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatTemp} tick={{ fontSize: 12 }} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip labelFormatter={formatTime} />
                <Legend />

                <Line
                  name="Knee Temp (Surface)"
                  dataKey="kneeTemp"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
                <Line
                  name="Ambient Temp"
                  dataKey="tempAmbient"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === "vag" && (
            <div className="h-full flex flex-col gap-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 relative -mt-3">
                <MetricCard title="RMS Amplitude" value={latest?.micAlignedRms?.toFixed?.(4) ?? "-"} tint="sky" />
                <MetricCard title="Peak Frequency" value={`${latest?.micAlignedPeakFreq?.toFixed?.(2) ?? "-"} Hz`} tint="teal" />
                <MetricCard title="Spectral Entropy" value={latest?.micAlignedEntropy?.toFixed?.(2) ?? "-"} tint="violet" />
                <MetricCard title="Mean Frequency" value={`${latest?.micAlignedMeanFreq?.toFixed?.(2) ?? "-"} Hz`} tint="emerald" />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "rms", label: "RMS" },
                  { id: "peak", label: "Peak Freq" },
                  { id: "entropy", label: "Entropy" },
                  { id: "mean", label: "Mean Freq" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setVagTab(t.id)}
                    type="button"
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border transition ${
                      vagTab === t.id
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-700 border-sky-100 hover:bg-sky-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.75} />
                    <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} tick={{ fontSize: 12 }} />
                    <Tooltip labelFormatter={formatTime} />
                    <Legend />

                    {vagTab === "rms" && (
                      <>
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => Number(v).toFixed(2)} domain={["dataMin - 0.1", "dataMax + 0.1"]} />
                        <Line name="RMS Amplitude" dataKey="micAlignedRms" stroke="#0ea5e9" strokeWidth={2} dot={false} type="monotone" />
                      </>
                    )}

                    {vagTab === "peak" && (
                      <>
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Number(v).toFixed()} Hz`} domain={["dataMin - 10", "dataMax + 10"]} />
                        <Line name="Peak Frequency" dataKey="micAlignedPeakFreq" stroke="#14b8a6" strokeWidth={2} dot={false} type="monotone" />
                      </>
                    )}

                    {vagTab === "entropy" && (
                      <>
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => Number(v).toFixed(2)} domain={["dataMin - 0.1", "dataMax + 0.1"]} />
                        <Line name="Spectral Entropy" dataKey="micAlignedEntropy" stroke="#7c3aed" strokeWidth={2} dot={false} type="monotone" />
                      </>
                    )}

                    {vagTab === "mean" && (
                      <>
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => Number(v).toFixed()} domain={["dataMin - 10", "dataMax + 10"]} />
                        <Line name="Mean Frequency" dataKey="micAlignedMeanFreq" stroke="#10b981" strokeWidth={2} dot={false} type="monotone" />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, tint = "sky" }) {
  const map = {
    sky: "bg-sky-50 border-sky-100 text-sky-800",
    teal: "bg-teal-50 border-teal-100 text-teal-800",
    violet: "bg-violet-50 border-violet-100 text-violet-800",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
  };

  return (
    <div className={`rounded-xl border p-3 ${map[tint] || map.sky}`}>
      <div className="text-xs font-semibold opacity-80">{title}</div>
      <div className="text-lg text-center font-extrabold mt-0.5">{value}</div>
    </div>
  );
}