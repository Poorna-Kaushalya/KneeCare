import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import api from "../../api/api";

const SCORE_TO_LABEL = {
  1: "Normal",
  2: "Mild",
  3: "Moderate",
  4: "Severe",
};

function normalizeLabel(label) {
  const map = {
    Normal: "Normal",
    Mild: "Mild",
    Moderate: "Moderate",
    Severe: "Severe",
    KL0: "Normal",
    KL1: "Mild",
    KL2: "Moderate",
    KL3: "Severe",
    KL4: "Severe",
    "0": "Normal",
    "1": "Mild",
    "2": "Moderate",
    "3": "Severe",
    "4": "Severe",
  };

  return map[String(label ?? "").trim()] || label || "Unknown";
}

function labelToScore(label, rawScore) {
  const normalized = normalizeLabel(label);

  if (normalized === "Normal") return 1;
  if (normalized === "Mild") return 2;
  if (normalized === "Moderate") return 3;
  if (normalized === "Severe") return 4;

  const n = Number(rawScore);
  if ([1, 2, 3, 4].includes(n)) return n;

  return 1;
}

function formatShortMonth(year, month) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString([], {
    month: "short",
    year: "2-digit",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSeverityColor(score) {
  const s = Number(score ?? 1);

  if (s === 1) return "#22c55e";
  if (s === 2) return "#eab308";
  if (s === 3) return "#f97316";
  if (s === 4) return "#ef4444";

  return "#94a3b8";
}

function trendText(rows) {
  if (!rows || rows.length < 2) return "Not enough months to detect trend";

  const prev = rows[rows.length - 2]?.severityScore ?? 1;
  const curr = rows[rows.length - 1]?.severityScore ?? 1;

  if (curr > prev) return "Severity increased from previous month";
  if (curr < prev) return "Severity reduced from previous month";
  return "Severity stayed stable from previous month";
}

function SeverityDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;

  const color = getSeverityColor(payload.severityScore);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
    />
  );
}

function ActiveSeverityDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;

  const color = getSeverityColor(payload.severityScore);

  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.18} />
      <circle
        cx={cx}
        cy={cy}
        r={7}
        fill={color}
        stroke="#ffffff"
        strokeWidth={3}
      />
    </g>
  );
}

function GradientStops({ rows = [] }) {
  if (!rows.length) return null;

  if (rows.length === 1) {
    const color = getSeverityColor(rows[0].severityScore);
    return (
      <>
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor={color} />
      </>
    );
  }

  return rows.map((row, index) => {
    const offset = `${(index / (rows.length - 1)) * 100}%`;
    return (
      <stop
        key={`${row.monthLabel}-${index}`}
        offset={offset}
        stopColor={getSeverityColor(row.severityScore)}
      />
    );
  });
}

function FeatureItem({ label, value, digits = 2 }) {
  const display =
    value === null || value === undefined || Number.isNaN(Number(value))
      ? "—"
      : Number(value).toFixed(digits);

  const explanations = {
    "RMS Amplitude":
      "Higher vibration strength may indicate stronger joint friction.",
    "Spectral Entropy":
      "Irregular vibration patterns can reflect abnormal knee movement.",
    "Zero Crossing Rate":
      "Frequent signal direction changes may suggest unstable joint motion.",
    "Mean Frequency":
      "Changes in average vibration frequency may indicate joint condition variation.",
    "Knee Temperature":
      "Higher temperature can signal inflammation or stress in the knee joint.",
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 min-h-[120px] flex flex-col justify-between">

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>

        <div className="mt-1 text-sm font-bold text-slate-900">
          {display}
        </div>
      </div>

      <div className="mt-2 text-[11px] leading-snug text-slate-500">
        {explanations[label] || "Feature used by the model for prediction."}
      </div>

    </div>
  );
}

export default function KOASensorSeverity({ deviceId }) {
  const [rows, setRows] = useState([]);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("monthly");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [monthlyRes, latestRes] = await Promise.allSettled([
          api.get(`/api/monthly-severity/${deviceId}`),
          api.get(`/api/latest-avg-severity/${deviceId}`),
        ]);

        if (!mounted) return;

        let monthlyRows = [];
        let latestRow = null;
        let errorMessages = [];

        if (monthlyRes.status === "fulfilled") {
          const predictions = monthlyRes.value?.data?.predictions || [];

          monthlyRows = predictions
            .map((item) => {
              const severityLevel = normalizeLabel(item.severity_level);
              const severityScore = labelToScore(
                item.severity_level,
                item.severity_score
              );

              return {
                ...item,
                monthLabel:
                  item.month_label ||
                  `${item.year}-${String(item.month).padStart(2, "0")}`,
                shortMonthLabel: formatShortMonth(item.year, item.month),
                severityLevel,
                severityScore,
                confidencePct:
                  item.confidence !== null && item.confidence !== undefined
                    ? Number(item.confidence) * 100
                    : null,
              };
            })
            .sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              return a.month - b.month;
            });
        } else {
          const msg =
            monthlyRes.reason?.response?.data?.error ||
            monthlyRes.reason?.message ||
            "Failed to load monthly severity predictions";
          errorMessages.push(msg);
        }

        if (latestRes.status === "fulfilled") {
          const latest = latestRes.value?.data?.prediction || null;

          latestRow = latest
            ? {
              ...latest,
              severityLevel: normalizeLabel(latest.severity_level),
              severityScore: labelToScore(
                latest.severity_level,
                latest.severity_score
              ),
              confidencePct:
                latest.confidence !== null && latest.confidence !== undefined
                  ? Number(latest.confidence) * 100
                  : null,
            }
            : null;
        } else {
          const msg =
            latestRes.reason?.response?.data?.error ||
            latestRes.reason?.message ||
            "Failed to load latest AvgSensorData prediction";
          errorMessages.push(msg);
        }

        setRows(monthlyRows);
        setLatestPrediction(latestRow);

        if (monthlyRows.length > 0) {
          setActiveView("monthly");
        } else if (latestRow) {
          setActiveView("latest");
        }

        if (!monthlyRows.length && !latestRow && errorMessages.length) {
          setError(errorMessages[0]);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || e?.message || "Failed to load data");
      } finally {
        if (mounted) {
          setLoading(false);
          window.dispatchEvent(new Event("koa_severity_ready"));
        }
      }
    }

    if (deviceId) {
      loadData();
    } else {
      setRows([]);
      setLatestPrediction(null);
      setLoading(false);
      window.dispatchEvent(new Event("koa_severity_ready"));
    }

    return () => {
      mounted = false;
    };
  }, [deviceId]);

 // const latestMonth = useMemo(() => { if (!rows.length) return null; return rows[rows.length - 1]; }, [rows]);

 // const insight = useMemo(() => trendText(rows), [rows]);

  const chartData = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      monthLabel: row.monthLabel,
      shortMonthLabel: row.shortMonthLabel,
      severityLevel: row.severityLevel,
      severityScore: row.severityScore,
      confidencePct: row.confidencePct,
    }));
  }, [rows]);

  const latestFeatures = latestPrediction?.features_used || {};

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500">
        Loading knee sensor severity data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4">
        <div className="text-sm font-bold text-rose-700">Severity data error</div>
        <div className="mt-1 text-sm text-rose-600">{error}</div>
      </div>
    );
  }

  if (!rows.length && !latestPrediction) {
    return (
      <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="text-sm font-bold text-slate-700">
          No severity data found
        </div>
        <div className="mt-1 text-sm text-slate-500">
          Monthly data comes from MonthlySeverityPrediction and latest data comes from AvgSensorData.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 relative -top-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveView("monthly")}
          disabled={!rows.length}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeView === "monthly"
              ? "bg-slate-900 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            } ${!rows.length ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Monthly Progress
        </button>

        <button
          type="button"
          onClick={() => setActiveView("latest")}
          disabled={!latestPrediction}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeView === "latest"
              ? "bg-slate-900 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            } ${!latestPrediction ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Latest
        </button>
      </div>

      {activeView === "latest" && latestPrediction && (
        <div className=" bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-bold text-slate-800">
                  Latest AvgSensorData Prediction
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Created: {formatDateTime(latestPrediction.createdAt)}
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <div className="rounded-lg  border-sky-100 bg-sky-50 px-3 py-2">
                <div className="text-[10px] font-semibold text-sky-700">
                  Severity
                </div>
                <div className="text-sm font-bold text-slate-900 leading-tight">
                  {latestPrediction.severityLevel}
                </div>
              </div>

              <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
                <div className="text-[10px] font-semibold text-violet-700">
                  Confidence
                </div>
                <div className="text-sm font-bold text-slate-900 leading-tight">
                  {latestPrediction.confidencePct != null
                    ? `${latestPrediction.confidencePct.toFixed(1)}%`
                    : "—"}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-800">
                Features used for latest prediction
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-3">

                <FeatureItem
                  label="RMS Amplitude"
                  value={latestFeatures.rms_amplitude}
                />

                <FeatureItem
                  label="Spectral Entropy"
                  value={latestFeatures.spectral_entropy}
                />

                <FeatureItem
                  label="Mean Frequency"
                  value={latestFeatures.mean_frequency}
                />

                <FeatureItem
                  label="Knee Temperature"
                  value={latestFeatures.knee_tempurarture}
                />

              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === "monthly" && rows.length > 0 && (
        <>


          <div className="rounded-xl bg-white px-4 py-3 border border-slate-200 min-h-[280px]">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="120%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="mainSeverityGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <GradientStops rows={chartData} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={[1, 4]}
                    ticks={[1, 2, 3, 4]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => SCORE_TO_LABEL[v] || v}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (name === "severityScore") {
                        return [props?.payload?.severityLevel, "Severity"];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="severityScore"
                    stroke="url(#mainSeverityGradient)"
                    strokeWidth={4}
                    dot={(props) => <SeverityDot {...props} />}
                    activeDot={(props) => <ActiveSeverityDot {...props} />}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}