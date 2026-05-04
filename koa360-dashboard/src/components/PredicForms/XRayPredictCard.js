import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

export default function XRayPredictCard({
  open,
  onClose,
  patientId,
  deviceId,
}) {
  const [mode, setMode] = useState("xray");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (!open) return;

    setMode("xray");
    setFile(null);
    setPreviewUrl("");
    setLoading(false);
    setResult(null);
    setError("");
  }, [open]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canSubmit = useMemo(() => {
    return !!file && !loading;
  }, [file, loading]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];

    setError("");
    setResult(null);

    if (!f) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const changeMode = (nextMode) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setMode(nextMode);
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");
  };

  const fmtPct = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return `${(n * 100).toFixed(1)}%`;
  };

  const badgeClass = (label) => {
    const t = String(label || "").toLowerCase();

    if (t.includes("osteoarthritis") || t.includes("abnormal") || t.includes("oa")) {
      return "bg-rose-50 border-rose-200 text-rose-800";
    }

    if (t.includes("normal")) {
      return "bg-emerald-50 border-emerald-200 text-emerald-800";
    }

    if (t.includes("invalid") || t.includes("wrong")) {
      return "bg-amber-50 border-amber-200 text-amber-800";
    }

    return "bg-slate-50 border-slate-200 text-slate-800";
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      if (!file) {
        setError(
          `Please select a ${
            mode === "xray" ? "knee X-ray" : "knee MRI"
          } image first.`
        );
        return;
      }

      const fd = new FormData();
      fd.append("image", file);
      fd.append("patientId", patientId || "");
      fd.append("deviceId", deviceId || "");
      fd.append("modality", mode);

      const endpoint =
        mode === "xray" ? "/api/predict/xray" : "/api/predict/mri";

      // ❌ DO NOT set Content-Type manually
      const res = await api.post(endpoint, fd);

      if (!res?.data) {
        setError("Empty response from server.");
        return;
      }

      if (res.data.ok === false) {
        setError(res.data.error || "Prediction failed");
        return;
      }

      setResult(res.data);

      // optional cleanup after success
      setFile(null);
      setPreviewUrl("");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.details ||
        e?.message ||
        "Network error";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-white flex justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Medical Image Prediction
            </h2>
            <p className="text-xs text-slate-600">
              Upload knee X-ray or MRI for AI analysis
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Patient: {patientId || "N/A"} • Device: {deviceId || "N/A"}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-2 text-sm font-bold border rounded-xl"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-semibold">
              {error}
            </div>
          )}

          {/* MODE */}
          <div className="flex gap-2">
            <button
              onClick={() => changeMode("xray")}
              className={`px-4 py-2 rounded-xl border font-bold ${
                mode === "xray"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              X-ray
            </button>

            <button
              onClick={() => changeMode("mri")}
              className={`px-4 py-2 rounded-xl border font-bold ${
                mode === "mri"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              MRI
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* UPLOAD */}
            <div className="border rounded-2xl p-4">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={pickFile}
              />

              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "Predicting..." : "Submit & Predict"}
              </button>
            </div>

            {/* PREVIEW + RESULT */}
            <div className="border rounded-2xl p-4">
              <div className="h-48 flex items-center justify-center border rounded-xl overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    className="h-full object-contain"
                    alt="preview"
                  />
                ) : (
                  <span className="text-gray-400">No image selected</span>
                )}
              </div>

              <div className="mt-4">
                <h3 className="font-bold">Result</h3>

                {result ? (
                  <div className="mt-2 space-y-2">
                    <div
                      className={`inline-block px-3 py-1 rounded-full border font-bold ${badgeClass(
                        result.label
                      )}`}
                    >
                      {result.label}
                    </div>

                    {result.confidence != null && (
                      <p className="text-sm">
                        Confidence: {fmtPct(result.confidence)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">
                    Prediction will appear here
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-xl font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}