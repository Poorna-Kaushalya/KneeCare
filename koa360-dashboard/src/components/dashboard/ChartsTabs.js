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

import api from "../../api/api";
import KOASensorSeverity from "../PredicForms/KOASensorSeverity";

export default function ChartsTabs({ activeTab, setActiveTab, data, deviceId }) {
  const MAX_KNEE_ANGLE = 120;
  const [vagTab, setVagTab] = useState("rms");
  const [severityLoading, setSeverityLoading] = useState(false);

  // local history data loaded directly from backend
  const [sensorRows, setSensorRows] = useState([]);
  const [sensorLoading, setSensorLoading] = useState(false);

  useEffect(() => {
    setActiveTab("severity");
  }, [deviceId, setActiveTab]);

  useEffect(() => {
    let mounted = true;

    async function loadSensorHistory() {
      if (!deviceId) {
        setSensorRows([]);
        return;
      }

      try {
        setSensorLoading(true);

        const res = await api.get(
          `/api/sensor-datas?deviceId=${deviceId}&range=30`
        );

        if (!mounted) return;

        const rows = Array.isArray(res?.data) ? res.data : [];
        setSensorRows(rows);
      } catch (err) {
        if (!mounted) return;
        console.error(
          "Failed to load sensor history:",
          err?.response?.data?.error || err.message
        );
        setSensorRows([]);
      } finally {
        if (mounted) setSensorLoading(false);
      }
    }

    loadSensorHistory();

    return () => {
      mounted = false;
    };
  }, [deviceId]);

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

  // use backend-loaded sensor history if available, otherwise fallback to parent data
  const sourceRows = useMemo(() => {
    if (Array.isArray(sensorRows) && sensorRows.length > 0) return sensorRows;
    if (Array.isArray(data) && data.length > 0) return data;
    return [];
  }, [sensorRows, data]);

  const chartData = useMemo(() => {
    if (!Array.isArray(sourceRows)) return [];

    return sourceRows.map((row) => {
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

      const tempObject = Number(
        row?.avg_temperature?.object ?? row?.temperature?.object ?? 0
      );
      const tempAmbient = Number(
        row?.avg_temperature?.ambient ?? row?.temperature?.ambient ?? 0
      );
      const kneeTemp = Number(
        row?.avg_knee_tempurarture ?? row?.knee_tempurarture ?? 0
      );

      const kneeAngle = Number(row?.avg_knee_angle ?? row?.knee_angle ?? 0);

      const micAlignedRms = Number(
        row?.avg_microphone_features_aligned?.rms_amplitude ?? 0
      );
      const micAlignedPeakFreq = Number(
        row?.avg_microphone_features_aligned?.peak_frequency ?? 0
      );
      const micAlignedEntropy = Number(
        row?.avg_microphone_features_aligned?.spectral_entropy ?? 0
      );
      const micAlignedMeanFreq = Number(
        row?.avg_microphone_features_aligned?.mean_frequency ?? 0
      );

      return {
        ...row,
        createdAt,
        upperAccelMag,
        lowerAccelMag,
        kneeAngle,
        tempObject,
        tempAmbient,
        kneeTemp,
        micAlignedRms,
        micAlignedPeakFreq,
        micAlignedEntropy,
        micAlignedMeanFreq,
      };
    });
  }, [sourceRows]);

  const vibrationChartData = useMemo(() => {
    return chartData.slice(-10);
  }, [chartData]);

  const latest = useMemo(() => {
    if (!chartData.length) return null;
    return chartData[chartData.length - 1];
  }, [chartData]);

  useEffect(() => {
    if (activeTab !== "severity") return;

    setSeverityLoading(true);
    const t = setTimeout(() => setSeverityLoading(false), 3500);
    return () => clearTimeout(t);
  }, [activeTab, deviceId]);

  useEffect(() => {
    const onReady = () => setSeverityLoading(false);
    window.addEventListener("koa_severity_ready", onReady);
    return () => window.removeEventListener("koa_severity_ready", onReady);
  }, []);

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
    <div className="rounded-lg border border-sky-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 pt-3 bg-gradient-to-r from-sky-100 to-emerald-100 border-b border-sky-100">
        <div className="flex items-center justify-between gap-1">
          <div className="text-lg font-extrabold text-slate-900">
            Sensor Analytics
          </div>

          <div className="text-xs text-slate-500">
            Last updated:{" "}
            {latest?.createdAt
              ? new Date(latest.createdAt).toLocaleTimeString()
              : "—"}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 pb-3">
          <TabButton
            id="severity"
            icon={faHeartbeat}
            label="Progress"
            activeColor="bg-emerald-600"
          />
          <TabButton
            id="vag"
            icon={faWaveSquare}
            label="Vibrations"
            activeColor="bg-teal-600"
          />
          <TabButton
            id="motion"
            icon={faArrowsRotate}
            label="Motion"
            activeColor="bg-sky-600"
          />
          <TabButton
            id="angle"
            icon={faAngleRight}
            label="Angle"
            activeColor="bg-violet-600"
          />
          <TabButton
            id="temp"
            icon={faTemperatureHigh}
            label="Temperature"
            activeColor="bg-amber-500"
          />
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="h-[280px] md:h-[325px]">
          {activeTab === "severity" && (
            <div className="relative h-full">
              <div
                className={
                  severityLoading
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }
              >
                <KOASensorSeverity deviceId={deviceId} />
              </div>

              {severityLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50">
                  <div className="text-center px-6">
                    <div className="flex items-center justify-center gap-3">
                      <Spinner />
                      <div className="text-lg font-extrabold text-slate-900">
                        Waiting for prediction...
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Please wait while we calculate KOA sensor severity.
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <PulseDot delay="0ms" />
                      <PulseDot delay="150ms" />
                      <PulseDot delay="300ms" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "motion" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={formatMonthDay}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={formatAccel}
                  tick={{ fontSize: 12 }}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <Tooltip labelFormatter={formatTime} />
                <Legend />
                <Line
                  name="Upper Accel Mag"
                  dataKey="upperAccelMag"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
                <Line
                  name="Lower Accel Mag"
                  dataKey="lowerAccelMag"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === "angle" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={formatMonthDay}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={formatDegrees}
                  tick={{ fontSize: 12 }}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
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

          {activeTab === "temp" && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={formatMonthDay}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={formatTemp}
                  tick={{ fontSize: 12 }}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
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
                <MetricButton
                  active={vagTab === "rms"}
                  onClick={() => setVagTab("rms")}
                  title="RMS Amplitude"
                  value={latest?.micAlignedRms?.toFixed?.(4) ?? "-"}
                  tint="sky"
                />
                <MetricButton
                  active={vagTab === "peak"}
                  onClick={() => setVagTab("peak")}
                  title="Peak Frequency"
                  value={`${latest?.micAlignedPeakFreq?.toFixed?.(2) ?? "-"} Hz`}
                  tint="teal"
                />
                <MetricButton
                  active={vagTab === "entropy"}
                  onClick={() => setVagTab("entropy")}
                  title="Spectral Entropy"
                  value={latest?.micAlignedEntropy?.toFixed?.(2) ?? "-"}
                  tint="violet"
                />
                <MetricButton
                  active={vagTab === "mean"}
                  onClick={() => setVagTab("mean")}
                  title="Mean Frequency"
                  value={`${latest?.micAlignedMeanFreq?.toFixed?.(2) ?? "-"} Hz`}
                  tint="emerald"
                />
              </div>

              <div className="flex-1 min-h-0">
                {sensorLoading ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    Loading vibration history...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={vibrationChartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.75} />
                      <XAxis
                        dataKey="createdAt"
                        tickFormatter={formatTime}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip labelFormatter={formatTime} />

                      {vagTab === "rms" && (
                        <>
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => Number(v).toFixed(2)}
                            domain={["dataMin - 0.1", "dataMax + 0.1"]}
                          />
                          <Line
                            name="RMS Amplitude"
                            dataKey="micAlignedRms"
                            stroke="#0ea5e9"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            type="monotone"
                          />
                        </>
                      )}

                      {vagTab === "peak" && (
                        <>
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => `${Number(v).toFixed()} Hz`}
                            domain={["dataMin - 10", "dataMax + 10"]}
                          />
                          <Line
                            name="Peak Frequency"
                            dataKey="micAlignedPeakFreq"
                            stroke="#14b8a6"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            type="monotone"
                          />
                        </>
                      )}

                      {vagTab === "entropy" && (
                        <>
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => Number(v).toFixed(2)}
                            domain={["dataMin - 0.1", "dataMax + 0.1"]}
                          />
                          <Line
                            name="Spectral Entropy"
                            dataKey="micAlignedEntropy"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            type="monotone"
                          />
                        </>
                      )}

                      {vagTab === "mean" && (
                        <>
                          <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => Number(v).toFixed()}
                            domain={["dataMin - 10", "dataMax + 10"]}
                          />
                          <Line
                            name="Mean Frequency"
                            dataKey="micAlignedMeanFreq"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            type="monotone"
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricButton({ title, value, tint = "sky", active, onClick }) {
  const map = {
    sky: "bg-sky-50 border-sky-100 text-sky-800",
    teal: "bg-teal-50 border-teal-100 text-teal-800",
    violet: "bg-violet-50 border-violet-100 text-violet-800",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-2 text-left transition w-full
        ${map[tint] || map.sky}
        ${
          active
            ? "ring-2 ring-slate-900/10 shadow-sm scale-[1.01]"
            : "hover:shadow-sm hover:scale-[1.01]"
        }`}
      title={`Show chart: ${title}`}
    >
      <div className="text-xs font-semibold opacity-80">{title}</div>
      <div className="text-lg text-center font-extrabold mt-0.5">{value}</div>
    </button>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin" />
  );
}

function PulseDot({ delay = "0ms" }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-bounce inline-block"
      style={{ animationDelay: delay }}
    />
  );
}
