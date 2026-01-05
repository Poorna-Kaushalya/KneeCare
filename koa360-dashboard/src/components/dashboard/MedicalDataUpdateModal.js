import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

export default function MedicalDataUpdateModal({ open, onClose, details, onSaved }) {
  const patientId = details?.id;

  const initialForm = useMemo(
    () => ({
      heightCm: details?.heightCm ?? "",
      weightKg: details?.weightKg ?? "",
      previousKneeInjury:
        details?.previousKneeInjury === true
          ? "true"
          : details?.previousKneeInjury === false
          ? "false"
          : "",
      crp: details?.crp ?? "",
      esr: details?.esr ?? "",
      rf: details?.rf ?? "",
      cholesterol: details?.cholesterol ?? "",
      wbc: details?.wbc ?? "",
      platelets: details?.platelets ?? "",
      fbs: details?.fbs ?? "",
      sugar: details?.sugar ?? "",
      fbcValue: details?.fbcValue ?? "",
    }),
    [details]
  );

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError("");
    }
  }, [open, initialForm]);

  if (!open) return null;

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const numOrUndef = (v) => (v === "" ? undefined : Number(v));
  const boolOrUndef = (v) => {
    if (v === "true") return true;
    if (v === "false") return false;
    return undefined;
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setError("");

      if (!patientId) {
        setError("Patient ID not found.");
        return;
      }

      const payload = {
        heightCm: numOrUndef(form.heightCm),
        weightKg: numOrUndef(form.weightKg),
        previousKneeInjury: boolOrUndef(form.previousKneeInjury),
        crp: numOrUndef(form.crp),
        esr: numOrUndef(form.esr),
        rf: numOrUndef(form.rf),
        cholesterol: numOrUndef(form.cholesterol),
        wbc: numOrUndef(form.wbc),
        platelets: numOrUndef(form.platelets),
        fbs: numOrUndef(form.fbs),
        sugar: numOrUndef(form.sugar),
        fbcValue: numOrUndef(form.fbcValue),
      };

      // ✅ IMPORTANT: uses axios baseURL (backend 5000)
      const res = await api.put(`/api/patients/${patientId}`, payload);

      onSaved?.(res.data);
      onClose();
    } catch (err) {
      console.error("Update medical data error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update medical data."
      );
    } finally {
      setSaving(false);
    }
  };

  const Input = ({ label, value, onChange, type = "number" }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-extrabold text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-[95%] max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-slate-900 font-extrabold text-lg">
              Update Medical Data
            </h3>
            <p className="text-xs text-slate-500">
              {details?.name} (ID:{" "}
              <span className="font-bold">{patientId}</span>)
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-extrabold hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm font-bold">
              {error}
            </div>
          )}

          <div>
            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
              Anthropometrics
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Height (cm)"
                value={form.heightCm}
                onChange={(v) => setField("heightCm", v)}
              />
              <Input
                label="Weight (kg)"
                value={form.weightKg}
                onChange={(v) => setField("weightKg", v)}
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-extrabold text-slate-600">
                  Previous Knee Injury
                </label>
                <select
                  value={form.previousKneeInjury}
                  onChange={(e) =>
                    setField("previousKneeInjury", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">N/A</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
              Lab Values
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input label="CRP" value={form.crp} onChange={(v) => setField("crp", v)} />
              <Input label="ESR" value={form.esr} onChange={(v) => setField("esr", v)} />
              <Input label="RF" value={form.rf} onChange={(v) => setField("rf", v)} />
              <Input
                label="Cholesterol"
                value={form.cholesterol}
                onChange={(v) => setField("cholesterol", v)}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input label="WBC" value={form.wbc} onChange={(v) => setField("wbc", v)} />
              <Input
                label="Platelets"
                value={form.platelets}
                onChange={(v) => setField("platelets", v)}
              />
              <Input label="FBS" value={form.fbs} onChange={(v) => setField("fbs", v)} />
              <Input label="Sugar" value={form.sugar} onChange={(v) => setField("sugar", v)} />
              <Input label="FBC" value={form.fbcValue} onChange={(v) => setField("fbcValue", v)} />
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-extrabold hover:bg-slate-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Updates"}
          </button>
        </div>
      </div>
    </div>
  );
}
