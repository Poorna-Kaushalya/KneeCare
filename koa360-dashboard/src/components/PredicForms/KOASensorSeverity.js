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
  };

  return map[label] || label || "Unknown";
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

function getSeverityColor(score) {
  const s = Number(score ?? 1);

  if (s === 1) return "#22c55e"; // green
  if (s === 2) return "#eab308"; // yellow
  if (s === 3) return "#f97316"; // orange
  if (s === 4) return "#ef4444"; // red

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

export default function KOASensorSeverity({ deviceId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMonthlySeverity() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/api/vag/severity/monthly/${deviceId}`);
        const predictions = res?.data?.predictions || [];

        if (!mounted) return;

        const formatted = predictions
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

        setRows(formatted);
      } catch (e) {
        if (!mounted) return;
        setError(
          e?.response?.data?.error ||
            e?.message ||
            "Failed to load monthly severity"
        );
      } finally {
        if (mounted) {
          setLoading(false);
          window.dispatchEvent(new Event("koa_severity_ready"));
        }
      }
    }

    if (deviceId) {
      loadMonthlySeverity();
    } else {
      setRows([]);
      setLoading(false);
      window.dispatchEvent(new Event("koa_severity_ready"));
    }

    return () => {
      mounted = false;
    };
  }, [deviceId]);

  const latest = useMemo(() => {
    if (!rows.length) return null;
    return rows[rows.length - 1];
  }, [rows]);

  const insight = useMemo(() => trendText(rows), [rows]);

  const chartData = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      shortMonthLabel: row.shortMonthLabel,
      monthLabel: row.monthLabel,
      severityScore: row.severityScore,
      severityLevel: row.severityLevel,
      confidencePct: row.confidencePct,
    }));
  }, [rows]);

  if (loading) return null;

  if (error) {
    return (
      <div className="h-full rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4">
        <div className="text-sm font-bold text-rose-700">Monthly severity error</div>
        <div className="mt-1 text-sm text-rose-600">{error}</div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="text-sm font-bold text-slate-700">
          No monthly predictions found
        </div>
        <div className="mt-1 text-sm text-slate-500">
          Save AvgSensorData for this device first, then monthly prediction will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 relative -top-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="text-xs font-semibold text-emerald-700">Latest Month</div>
          <div className="mt-0 text-lg font-extrabold text-slate-900">
            {latest?.monthLabel}
          </div>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
          <div className="text-xs font-semibold text-sky-700">Predicted Severity</div>
          <div className="mt-0 text-lg font-extrabold text-slate-900">
            {latest?.severityLevel || "—"}
          </div>
        </div>

        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <div className="text-xs font-semibold text-violet-700">Model Confidence</div>
          <div className="mt-0 text-lg font-extrabold text-slate-900">
            {latest?.confidencePct != null
              ? `${latest.confidencePct.toFixed(1)}%`
              : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl  bg-white px-4">
        <div className="text-sm font-bold text-slate-800">Monthly Progress</div>

        <div className="mt-4 h-[180px]">
          <ResponsiveContainer width="100%" height="130%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="miniSeverityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <GradientStops rows={chartData} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="shortMonthLabel" tick={{ fontSize: 12 }} />
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
                labelFormatter={(label, payload) => {
                  const full = payload?.[0]?.payload?.monthLabel;
                  return `Month: ${full || label}`;
                }}
              />
              <Line
                type="monotone"
                dataKey="severityScore"
                stroke="url(#miniSeverityGradient)"
                strokeWidth={3}
                dot={(props) => <SeverityDot {...props} />}
                activeDot={(props) => <ActiveSeverityDot {...props} />}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="mainSeverityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((row) => (
          <div
            key={`${row.device_id}-${row.year}-${row.month}`}
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-800">{row.monthLabel}</div>
              <div className="text-xs font-semibold text-slate-500">
                {row.records_used} records
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: getSeverityColor(row.severityScore) }}
              />
              <div className="text-base font-extrabold text-slate-900">
                {row.severityLevel}
              </div>
            </div>

            <div className="mt-1 text-sm text-slate-600">
              Confidence:{" "}
              {row.confidencePct != null ? `${row.confidencePct.toFixed(1)}%` : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}