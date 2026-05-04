import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

/* =========================
   CONFIG
========================= */

const OPTIONS = {
  gender: ["", "Male", "Female"],
  yesNo: ["", "No", "Yes"],
  occupation: ["", "No", "Yes"],
  physical_activity_level: ["", "Low", "Moderate", "High"],
  stiffness: ["", "never", "occasionally", "frequently", "always"],
};

const DIFFICULTY_ACTIVITIES = [
  "Climbing stairs",
  "Walking long distances",
  "Squatting",
  "Standing long periods",
];

const TABS = [
  { key: "xray", label: "X-ray" },
  { key: "demo", label: "Demographics" },
  { key: "symp", label: "Symptoms & History" },
  { key: "bio", label: "Biomarkers & Other" },
];

const PLAN_ORDER = {
  Preventive_SelfCare: 1,
  Physio_Lifestyle: 2,
  Conservative_Clinical: 3,
  Surgical_Consult_Referral: 4,
};

const PLAN_LABELS = {
  Preventive_SelfCare: "Preventive / Self-care",
  Physio_Lifestyle: "Physiotherapy + Lifestyle Management",
  Conservative_Clinical: "Conservative Clinical Management",
  Surgical_Consult_Referral: "Surgical / Specialist Referral",
};

/* =========================
   FIELD KEYS
========================= */

const PREV_INJURY_KEY =
  "have_you_had_any_previous_knee_injuries_(acl_tear,_meniscus_tear,_fracture,_etc.)";

const DIFFICULTY_KEY =
  "do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)";

const OTHER_RISK_KEY =
  "does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis";

const TREATMENT_KEY =
  "what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition";

/* =========================
   HELPERS
========================= */

function calcBMI(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w) return "";
  const bmi = w / ((h / 100) ** 2);
  return bmi.toFixed(2);
}

function toFloatSafe(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
}

function encodeYesNo(val) {
  return String(val).toLowerCase() === "yes" ? 1 : 0;
}

function encodeStiffness(val) {
  const s = String(val).toLowerCase();
  if (s.includes("occasion")) return 1;
  if (s.includes("frequent")) return 2;
  if (s.includes("always")) return 3;
  return 0;
}

function difficultyCount(val) {
  return val ? val.split(",").length : 0;
}

function mapSeverity(kl) {
  const map = { KL0: 0, KL1: 1, KL2: 2, KL3: 3, KL4: 4 };
  return map[kl] ?? 0;
}

/* =========================
   COMPONENT
========================= */

export default function KOAFusionPredictForm({ patientId, deviceId }) {
  const [activeTab, setActiveTab] = useState("xray");
  const [xray, setXray] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({});

  /* =========================
     HANDLE INPUT
  ========================= */

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     BMI AUTO UPDATE
  ========================= */

  useEffect(() => {
    const bmi = calcBMI(form.height, form.weight);
    setForm((p) => ({ ...p, bmi }));
  }, [form.height, form.weight]);

  /* =========================
     SUBMIT
  ========================= */

  const submit = async (e) => {
    e.preventDefault();
    if (!xray) return alert("Upload X-ray first");

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("xray", xray);
      fd.append("patientId", patientId || "");
      fd.append("deviceId", deviceId || "");
      fd.append("tabular", JSON.stringify(form));

      const res = await api.post("/api/fusion/ml/fusion", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="max-w-6xl mx-auto p-4">
      <form onSubmit={submit} className="bg-white rounded-xl p-4 shadow">

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded ${
                activeTab === t.key ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* X-ray */}
        {activeTab === "xray" && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setXray(e.target.files[0])}
          />
        )}

        {/* Demo */}
        {activeTab === "demo" && (
          <div className="grid grid-cols-2 gap-3">
            <input name="age" placeholder="Age" onChange={onChange} />
            <input name="height" placeholder="Height" onChange={onChange} />
            <input name="weight" placeholder="Weight" onChange={onChange} />
            <input name="bmi" value={form.bmi || ""} readOnly />
          </div>
        )}

        {/* Symptoms */}
        {activeTab === "symp" && (
          <div className="grid grid-cols-2 gap-3">
            <input name="pain_score" placeholder="Pain Score" onChange={onChange} />
            <select name="stiffness" onChange={onChange}>
              {OPTIONS.stiffness.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        )}

        {/* Biomarkers */}
        {activeTab === "bio" && (
          <div className="grid grid-cols-2 gap-3">
            <input name="fbs" placeholder="FBS" onChange={onChange} />
            <input name="cholesterol" placeholder="Cholesterol" onChange={onChange} />
            <input name="crp" placeholder="CRP" onChange={onChange} />
            <input name="esr" placeholder="ESR" onChange={onChange} />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold">Result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}