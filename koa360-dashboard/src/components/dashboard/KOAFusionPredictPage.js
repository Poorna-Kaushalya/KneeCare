import { useEffect } from "react";
import KOAFusionPredictForm from "../PredicForms/KOAFusionPredictForm";

export default function KOAFusionPredictCard({
  open,
  onClose,
  patientId,
  deviceId,
}) {

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          
          {/* Header */}
          <div className="p-5 border-b bg-slate-50 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Severity Prediction
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Patient ID:{" "}
                <span className="font-bold">{patientId || "-"}</span>&nbsp;&nbsp;&nbsp;&nbsp;
                {"     "} | {"     "}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                Device ID:{" "}
                <span className="font-bold">{deviceId || "-"}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white transition font-bold text-sm"
            >
              Close
            </button>
          </div>

          {/* Body */}
          <div className="p-5 bg-white max-h-[80vh] overflow-y-auto">
            <KOAFusionPredictForm />
          </div>
        </div>
      </div>
    </div>
  );
}
