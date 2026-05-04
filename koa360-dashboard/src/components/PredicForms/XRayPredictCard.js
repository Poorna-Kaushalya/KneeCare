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

  // reset when open
  useEffect(() => {
    if (!open) return;

    setMode("xray");
    setFile(null);
    setPreviewUrl("");
    setLoading(false);
    setResult(null);
    setError("");
  }, [open]);

  // cleanup preview
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

  const changeMode = (next) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setMode(next);
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

    if (t.includes("normal")) return "bg-emerald-50 border-emerald-200 text-emerald-800";
    if (t.includes("osteo") || t.includes("abnormal")) return "bg-rose-50 border-rose-200 text-rose-800";
    if (t.includes("invalid")) return "bg-amber-50 border-amber-200 text-amber-800";

    return "bg-slate-50 border-slate-200 text-slate-800";
  };

  const onSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      if (!file) {
        setError("Please upload an image first.");
        return;
      }

      const fd = new FormData();

      // ✅ IMPORTANT: MUST MATCH BACKEND
      fd.append("image", file);

      fd.append("patientId", patientId || "");
      fd.append("deviceId", deviceId || "");
      fd.append("modality", mode);

      const endpoint =
        mode === "xray"
          ? "/api/ml/xray"
          : "/api/ml/mri";

      const res = await api.post(endpoint, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res?.data;

      if (!data) {
        setError("Empty response from server");
        return;
      }

      if (data.ok === false) {
        setError(data.error || "Prediction failed");
        return;
      }

      setResult(data);
      setFile(null);
      setPreviewUrl("");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        err?.message ||
        "Network error";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={!loading ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 border-b flex justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold">Medical Image Prediction</h2>
            <p className="text-sm text-gray-600">
              Upload knee X-ray or MRI for AI analysis
            </p>
            <p className="text-xs text-gray-500">
              Patient: {patientId || "N/A"} • Device: {deviceId || "N/A"}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-2 border rounded-lg"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* MODE */}
          <div className="flex gap-2">
            <button
              onClick={() => changeMode("xray")}
              className={`px-4 py-2 border rounded-lg ${
                mode === "xray" ? "bg-blue-600 text-white" : ""
              }`}
            >
              X-ray
            </button>

            <button
              onClick={() => changeMode("mri")}
              className={`px-4 py-2 border rounded-lg ${
                mode === "mri" ? "bg-blue-600 text-white" : ""
              }`}
            >
              MRI
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* UPLOAD */}
            <div className="border rounded-xl p-4">
              <input type="file" accept="image/*" onChange={pickFile} />

              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? "Predicting..." : "Submit & Predict"}
              </button>
            </div>

            {/* PREVIEW */}
            <div className="border rounded-xl p-4">
              <div className="h-48 flex items-center justify-center border rounded-lg">
                {previewUrl ? (
                  <img src={previewUrl} className="h-full object-contain" />
                ) : (
                  <span className="text-gray-400">No image selected</span>
                )}
              </div>

              <div className="mt-4">
                <h3 className="font-bold">Result</h3>

                {result ? (
                  <div className="mt-2">
                    <div
                      className={`inline-block px-3 py-1 rounded-full border ${badgeClass(
                        result.label
                      )}`}
                    >
                      {result.label}
                    </div>

                    {result.confidence != null && (
                      <p className="text-sm mt-2">
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
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}