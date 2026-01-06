import React from "react";
import KOAPredictForm from "../PredicForms/KOAPredictForm";

export default function KOAClinicalPredictCard({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="
            w-full max-w-6xl max-h-[88vh] overflow-y-auto
            rounded-2xl bg-white shadow-2xl
            border border-slate-200
          "
          style={{ borderTop: "4px solid #2563eb" }} // ✅ only top blue border line
        >
          {/* header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-4 border-b bg-slate-50">
            <div>
              <div className="text-lg font-extrabold text-slate-900">
                Clinical Prediction
              </div>
              <div className="text-sm text-slate-600">
                Fill clinical/biomarker data and predict KOA grade.
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-white transition font-bold text-sm"
            >
              Close
            </button>
          </div>

          {/* body (no extra padding so no empty space) */}
          <div className="p-0">
            <KOAPredictForm />
          </div>
        </div>
      </div>
    </div>
  );
}
