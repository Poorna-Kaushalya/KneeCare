import React, { useEffect, useState } from "react";
import api from "../../api/api";

const severityStyles = {
  Normal: "bg-green-100 text-green-800 border-green-300",
  Mild: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Moderate: "bg-orange-100 text-orange-800 border-orange-300",
  Severe: "bg-red-100 text-red-800 border-red-300",
};

export default function KOASensorSeverity({ deviceId }) {
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState(null);
 // const [confidence, setConfidence] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) return;

    const fetchSeverity = async () => {
      try {
        setLoading(true);
        setError(null);
        setSeverity(null);
       // setConfidence(null);
        setMeta(null);

        const res = await api.get(`/api/koa-severity?deviceId=${deviceId}&days=14&source=piezo`);

        setSeverity(res.data.severity);
       // setConfidence(res.data.confidence);
        setMeta({
          windowDays: res.data.windowDays,
          from: res.data.from,
          to: res.data.to,
          source: res.data.source,
        });
      } catch (err) {
        console.error("KOA Severity API Error:", err);
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Prediction unavailable";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchSeverity();
  }, [deviceId]);

  const fromText = meta?.from ? new Date(meta.from).toLocaleDateString() : "-";
  const toText = meta?.to ? new Date(meta.to).toLocaleDateString() : "-";
  const windowDays = meta?.windowDays ?? 14;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-extrabold text-slate-800 mb-3">
        KOA Sensor Severity
      </h3>

      {!deviceId && (
        <p className="text-sm text-slate-500">Select a patient to view prediction.</p>
      )}

      {deviceId && loading && (
        <p className="text-sm text-slate-500">Analyzing last {windowDays} days data…</p>
      )}

      {deviceId && error && (
        <p className="text-sm text-red-600 font-semibold">{error}</p>
      )}

      {!loading && !error && severity && (
        <>
          <div
            className={`inline-flex items-center px-4 py-2 rounded-xl border font-extrabold text-lg ${
              severityStyles[severity] || "bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            {severity}
          </div>

         {/* 
         {confidence !== null && confidence !== undefined && (
            <p className="text-xs text-slate-600 mt-2">
              Confidence: <b>{(Number(confidence) * 100).toFixed(1)}%</b>
            </p>
          )}
          */}

          <p className="text-xs text-slate-500 mt-3">
            Based on Vibroarthrography (VAG) and knee temperature trends over the last{" "}
            {windowDays} days.
          </p>

          <p className="text-[11px] text-slate-500 mt-1">
            Window: {fromText} → {toText}
          </p>
        </>
      )}
    </div>
  );
}
