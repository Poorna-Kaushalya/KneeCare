import KOAFusionPredictForm from "../PredicForms/KOAFusionPredictForm";

export default function KOAFusionPredictPage({
  open,
  onClose,
  patientId,
  deviceId,
}) {
  if (!open) return null;

  console.log("KOAFusionPredictPage patientId:", patientId);
  console.log("KOAFusionPredictPage deviceId:", deviceId);

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between gap-4 px-6 py-5 border-b">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Severity Prediction
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span>
                  Patient ID: <b>{patientId || "-"}</b>
                </span>
                <span>|</span>
                <span>
                  Device ID: <b>{deviceId || "-"}</b>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="p-6">
            <KOAFusionPredictForm patientId={patientId} deviceId={deviceId} />
          </div>
        </div>
      </div>
    </div>
  );
}