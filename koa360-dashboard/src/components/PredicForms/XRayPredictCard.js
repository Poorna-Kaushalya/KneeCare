import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api"; 

export default function XRayPredictCard({ open, onClose, patientId, deviceId }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null); // { ok,type,label,confidence,... }
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreviewUrl("");
    setLoading(false);
    setResult(null);
    setError("");
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const canSubmit = useMemo(() => !!file && !loading, [file, loading]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    setError("");
    setResult(null);

    if (!f) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const badgeClass = (label) => {
    const t = String(label || "").toLowerCase();
    if (t.includes("severe") || t.includes("critical"))
      return "bg-rose-50 border-rose-200 text-rose-800";
    if (t.includes("moderate"))
      return "bg-amber-50 border-amber-200 text-amber-800";
    if (t.includes("mild"))
      return "bg-emerald-50 border-emerald-200 text-emerald-800";
    return "bg-slate-50 border-slate-200 text-slate-800";
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      if (!file) {
        setError("Please select an X-ray image first.");
        return;
      }

      const fd = new FormData();
      fd.append("image", file);

      const res = await api.post("/api/predict/xray", fd);

      if (!res?.data) {
        setError("Empty response from server.");
        return;
      }

      if (res.data.ok === false) {
        setError(res.data.error || "Prediction failed");
        return;
      }

      setResult(res.data);
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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={!loading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* card */}
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900">
              X-ray Prediction
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Upload knee X-ray and get KOA severity prediction.
            </p>
            <div className="mt-2 text-[11px] text-slate-500">
              Patient: <span className="font-extrabold">{patientId || "N/A"}</span>
              {"  "}• Device:{" "}
              <span className="font-extrabold">{deviceId || "N/A"}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-extrabold hover:bg-white disabled:opacity-60"
          >
            Close
          </button>
        </div>

        {/* body */}
        <div className="p-5 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Upload */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-slate-900">
                  Upload X-ray
                </div>
                <div className="text-xs text-slate-500 font-bold">JPG/PNG/WEBP</div>
              </div>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={pickFile}
                disabled={loading}
                className="mt-3 block w-full text-sm"
              />

              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="mt-4 w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold disabled:opacity-60"
              >
                {loading ? "Predicting..." : "Submit & Predict"}
              </button>

              <p className="mt-2 text-xs text-slate-500">
                Tip: Use clear knee X-ray images for better accuracy.
              </p>
            </div>

            {/* Preview + Result */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-extrabold text-slate-900">Preview</div>

              <div className="mt-3 h-52 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="X-ray preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-slate-500">No image selected</span>
                )}
              </div>

              <div className="mt-4">
                <div className="text-sm font-extrabold text-slate-900">
                  Prediction Result
                </div>

                {result ? (
                  <div className="mt-2 space-y-2">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-extrabold ${badgeClass(
                        result.label
                      )}`}
                    >
                      <span>{result.label}</span>
                      {typeof result.confidence === "number" ? (
                        <span className="text-[11px] opacity-80">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      ) : null}
                    </div>

                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">
                    Result will appear after prediction.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-extrabold hover:bg-white disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
