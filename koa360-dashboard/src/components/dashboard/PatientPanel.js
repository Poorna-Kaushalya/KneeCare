import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faPills,
  faWeightScale,
  faHeartPulse,
  faVial,
  faDroplet,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import PatientReportModal from "./PatientReportModal";

function MedicalDataUpdateModal({ open, onClose, details, onSaved }) {
  const [form, setForm] = useState({
    heightCm: "",
    weightKg: "",
    previousKneeInjury: "",
    crp: "",
    esr: "",
    rf: "",
    cholesterol: "",
    wbc: "",
    platelets: "",
    fbs: "",
    sugar: "",
    fbcValue: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setError("");
    setForm({
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
    });
  }, [open, details]);

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

      if (!details?.id) {
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

      const res = await fetch(`/api/patients/${details.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to update medical data.");
        return;
      }

      onSaved?.(data); 
      onClose();
    } catch (e) {
      setError(e?.message || "Something went wrong.");
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-[95%] max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-slate-900 font-extrabold text-lg">
              Update Medical Data
            </h3>
            <p className="text-xs text-slate-500">
              {details?.name} (ID: <span className="font-bold">{details?.id}</span>)
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
                  onChange={(e) => setField("previousKneeInjury", e.target.value)}
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
              <Input
                label="FBC"
                value={form.fbcValue}
                onChange={(v) => setField("fbcValue", v)}
              />
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

export default function PatientPanel({
  selectedPatientDetails,
  selectedPatient,
  onEditMedication,
}) {
  const [showReport, setShowReport] = useState(false);
  const [showMedicalUpdate, setShowMedicalUpdate] = useState(false);

  const [localDetails, setLocalDetails] = useState(null);

  const incoming = selectedPatientDetails || selectedPatient || null;
  const details = localDetails || incoming;

  // reset localDetails when switching patients
  useEffect(() => {
    setLocalDetails(null);
  }, [incoming?.id]);

  const card = "bg-white border border-slate-200 shadow-sm mt-2";

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB");
  };

  const show = (v) => (v === undefined || v === null || v === "" ? "N/A" : v);

  const InfoRow = ({ icon, iconClass = "text-slate-500", label, value }) => (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <FontAwesomeIcon icon={icon} className={iconClass} />
        <span className="text-slate-600 text-sm font-medium">{label}</span>
      </div>
      <span className="text-slate-900 text-sm font-extrabold truncate max-w-[55%] text-right">
        {value ?? "N/A"}
      </span>
    </div>
  );

  if (!details) {
    return (
      <div className={`${card} p-5 text-slate-600`}>
        Select a patient to view details.
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      <div className={`${card} p-4 md:p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faHeartPulse} className="text-rose-600" />
            <h3 className="font-extrabold text-slate-900">Medical Data</h3>
          </div>

          <div className="flex items-center gap-2">
            {/*  NEW UPDATE BUTTON */}
            <button
              onClick={() => setShowMedicalUpdate(true)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-2"
              title="Update Medical Data"
            >
              <FontAwesomeIcon icon={faEdit} />
              Update
            </button>

            {(!details?.heightCm ||
              !details?.weightKg ||
              (!details?.crp && !details?.esr && !details?.rf)) && (
              <div className="text-[11px] px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-extrabold flex items-center gap-1">
                <FontAwesomeIcon icon={faTriangleExclamation} />
                Incomplete
              </div>
            )}
          </div>
        </div>

        {/* Anthropometrics */}
        <div className="mt-4">
          <div className="mt-2">
            <InfoRow
              icon={faWeightScale}
              label="Weight (kg)"
              value={show(details?.weightKg)}
            />
            <InfoRow
              icon={faTriangleExclamation}
              label="Previous Knee Injury"
              value={
                details?.previousKneeInjury === true
                  ? "Yes"
                  : details?.previousKneeInjury === false
                  ? "No"
                  : "N/A"
              }
              iconClass="text-slate-500"
            />
          </div>
        </div>

        <div className="my-4 border-t border-slate-200" />

        {/* Lab Values */}
        <div>
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">
            Lab Values
          </div>

          <div className="mt-2">
            <InfoRow icon={faVial} label="CRP" value={show(details?.crp)} />
            <InfoRow icon={faVial} label="ESR" value={show(details?.esr)} />
            <InfoRow icon={faVial} label="RF" value={show(details?.rf)} />
            <InfoRow
              icon={faVial}
              label="Cholesterol"
              value={show(details?.cholesterol)}
            />

            <div className="my-3 border-t border-slate-200" />

            <InfoRow icon={faDroplet} label="WBC" value={show(details?.wbc)} />
            <InfoRow
              icon={faDroplet}
              label="Platelets"
              value={show(details?.platelets)}
            />
            <InfoRow icon={faDroplet} label="FBS" value={show(details?.fbs)} />
            <InfoRow icon={faDroplet} label="Sugar" value={show(details?.sugar)} />
            <InfoRow icon={faDroplet} label="FBC" value={show(details?.fbcValue)} />
          </div>
        </div>
      </div>

      <div className={`${card} p-4 md:p-5`}>
        <div className="flex items-center justify-between -mt-2">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPills} className="text-orange-500" />
            <h3 className="font-extrabold text-slate-900">Current Medication</h3>
          </div>

          <button
            onClick={onEditMedication}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-2"
            title="Update Medication"
          >
            <FontAwesomeIcon icon={faEdit} />
            Update
          </button>
        </div>

        <div className="mt-2">
          {details.medicationList?.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {details.medicationList.map((med, idx) => (
                <li key={idx}>{med}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No active medication listed. Click “Update” to add medication.
            </p>
          )}
        </div>
      </div>

      {/* Medical Update Modal */}
      <MedicalDataUpdateModal
        open={showMedicalUpdate}
        details={details}
        onClose={() => setShowMedicalUpdate(false)}
        onSaved={(updated) => setLocalDetails(updated)}
      />

      {/* Report Modal */}
      <PatientReportModal
        open={showReport}
        details={details}
        formatDate={formatDate}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}
