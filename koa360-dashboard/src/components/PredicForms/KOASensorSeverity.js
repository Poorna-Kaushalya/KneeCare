import React, { useEffect, useState } from "react";
import api from "../../api/api";

const severityStyles = {
  Normal: "bg-green-100 text-green-800 border-green-300",
  Mild: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Moderate: "bg-orange-100 text-orange-800 border-orange-300",
  Severe: "bg-red-100 text-red-800 border-red-300",
};

const fmt = (v, digits = 3) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(digits);
};

export default function KOASensorSeverity({ deviceId }) {
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [meta, setMeta] = useState(null);
  const [features, setFeatures] = useState(null);
  const [error, setError] = useState(null);

  const fetchSeverity = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      setError(null);

      // ✅ NEW API: always latest DB record
      const res = await api.get(`/api/vag/severity/latest/${deviceId}`);

      setSeverity(res.data?.severity_level || null);
      setConfidence(
        typeof res.data?.confidence === "number" ? res.data.confidence : null
      );

      setMeta({
        latestCreatedAt: res.data?.latest_createdAt || null,
        latestRecordId: res.data?.latest_record_id || null,
        deviceId: res.data?.device_id || deviceId,
      });

      setFeatures(res.data?.features_used || null);
    } catch (err) {
      console.error("KOA Severity API Error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Prediction unavailable";
      setError(msg);
      setSeverity(null);
      setConfidence(null);
      setMeta(null);
      setFeatures(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeverity();

    // Optional auto-refresh (every 60s)
    const t = setInterval(fetchSeverity, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const createdText = meta?.latestCreatedAt
    ? new Date(meta.latestCreatedAt).toLocaleString()
    : "-";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-extrabold text-slate-800">
          KOA Sensor Severity (Latest)
        </h3>

        <button
          type="button"
          onClick={fetchSeverity}
          className="px-3 py-1.5 rounded-xl border border-sky-100 bg-white hover:bg-sky-50 text-slate-700 text-xs font-extrabold"
          disabled={loading || !deviceId}
          title="Refresh latest prediction"
        >
          Refresh
        </button>
      </div>

      {!deviceId && (
        <p className="text-sm text-slate-500 mt-2">
          Select a patient to view prediction.
        </p>
      )}

      {deviceId && loading && (
        <p className="text-sm text-slate-500 mt-2">
          Fetching latest sensor record…
        </p>
      )}

      {deviceId && error && (
        <p className="text-sm text-red-600 font-semibold mt-2">{error}</p>
      )}

      {!loading && !error && severity && (
        <>
          <div
            className={`inline-flex items-center px-4 py-2 rounded-xl border font-extrabold text-lg mt-3 ${
              severityStyles[severity] ||
              "bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            {severity}
          </div>

          {confidence !== null && (
            <p className="text-xs text-slate-600 mt-2">
              Confidence: <b>{(Number(confidence) * 100).toFixed(1)}%</b>
            </p>
          )}

          <div className="mt-3 text-[11px] text-slate-500">
            Latest record time: <b className="text-slate-700">{createdText}</b>
          </div>

          {/* ✅ Compact cards with sentence lines */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <FeatureCard
              title="RMS"
              value={fmt(features?.rms_amplitude, 4)}
              sentence1="Overall vibration strength."
              sentence2="Higher → more joint friction."
            />

            <FeatureCard
              title="Entropy"
              value={fmt(features?.spectral_entropy, 2)}
              sentence1="Movement irregularity level."
              sentence2="Higher → uneven joint motion."
            />

            <FeatureCard
              title="ZCR"
              value={fmt(features?.zero_crossing_rate, 4)}
              sentence1="Rapid vibration changes."
              sentence2="Higher → sharper micro-motions."
            />

            <FeatureCard
              title="Mean Freq"
              value={fmt(features?.mean_frequency, 2)}
              suffix=" Hz"
              sentence1="Main vibration frequency."
              sentence2="Shift → altered mechanics."
            />

            <FeatureCard
              title="Knee Temp"
              value={fmt(features?.knee_tempurarture, 2)}
              suffix=" °C"
              sentence1="Surface knee temperature."
              sentence2="Higher → possible inflammation."
            />
          </div>
        </>
      )}
    </div>
  );
}

function FeatureCard({ title, value, suffix = "", sentence1, sentence2 }) {
  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 min-h-[95px] flex flex-col justify-between">
      <div className="text-[11px] font-semibold text-slate-600">{title}</div>

      <div className="text-base font-extrabold text-slate-900">
        {value}
        {value !== "-" ? suffix : ""}
      </div>

      <div className="text-[10px] text-slate-500 leading-tight mt-1 space-y-0.5">
        <div>{sentence1}</div>
        <div>{sentence2}</div>
      </div>
    </div>
  );
}