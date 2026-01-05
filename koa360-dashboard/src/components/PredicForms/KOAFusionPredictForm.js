import { useState } from "react";
import api from "../../api/api";

const OPTIONS = {
  gender: ["", "Male", "Female"],
  living_environment: ["", "Urban", "Rural"],
  occupation: ["", "No", "Office worker", "Labour", "Housewife", "Retired", "Other"],
  yesNo: ["", "No", "Yes"],
  physical_activity_level: ["", "Low", "Moderate", "High"],
};

export default function KOAFusionPredictForm() {
  const [xray, setXray] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    occupation: "",
    physical_activity_level: "",
    living_environment: "",

    knee_pain: "",
    knee_pain_in_past_week: "",
    stifness_after_resting: "",
    knee_injuries: "",
    swelling: "",
    difficulty_in_performing: "",
    family_history: "",
    obesity: "",
    diabetes: "",
    hypertension: "",
    vitaminD_deficiency: "",
    rheumatoid_arthritis: "",

    pain_score: "",
    fbs: "",
    wbc: "",
    platelets: "",
    cs: "",
    cholesterol: "",
    crp: "",
    esr: "",
    rf: "",
    fbc: "",
    bmi: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!xray) {
      alert("Please upload an X-ray image.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("xray", xray);

      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v ?? "");
      });

      // ✅ IMPORTANT: use axios instance (baseURL -> http://localhost:5000)
      const resp = await api.post("/api/fusion/predict", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(resp.data);
    } catch (err) {
      // Axios error handling
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        err?.message ||
        "Request failed";
      console.error("Fusion predict error:", err);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-2xl shadow-md bg-white p-6">
        <div className="text-xl font-extrabold text-slate-800">
          Fusion Prediction (X-ray + Clinical)
        </div>

        <div className="text-sm text-slate-500 mt-1">
          Upload X-ray + fill clinical/biomarker fields → get X-ray, Tabular, and Final Fusion severity.
        </div>

        <form onSubmit={submit} className="mt-6 space-y-6">
          {/* X-ray Upload */}
          <div className="rounded-xl border p-4">
            <div className="font-bold text-slate-700">X-ray Image</div>
            <input
              type="file"
              accept="image/*"
              className="mt-2"
              onChange={(e) => setXray(e.target.files?.[0] || null)}
            />
            {xray && (
              <div className="text-xs text-slate-500 mt-2">
                Selected: {xray.name}
              </div>
            )}
          </div>

          {/* Tabular Fields */}
          <div className="rounded-xl border p-4">
            <div className="font-bold text-slate-700 mb-3">
              Clinical / Biomarker Inputs
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Age" name="age" value={form.age} onChange={onChange} />
              <Select label="Gender" name="gender" value={form.gender} onChange={onChange} options={OPTIONS.gender} />
              <Input label="Height" name="height" value={form.height} onChange={onChange} />
              <Input label="Weight" name="weight" value={form.weight} onChange={onChange} />

              <Select label="Occupation" name="occupation" value={form.occupation} onChange={onChange} options={OPTIONS.occupation} />
              <Select label="Physical Activity Level" name="physical_activity_level" value={form.physical_activity_level} onChange={onChange} options={OPTIONS.physical_activity_level} />
              <Select label="Living Environment" name="living_environment" value={form.living_environment} onChange={onChange} options={OPTIONS.living_environment} />

              <Select label="Knee pain" name="knee_pain" value={form.knee_pain} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Pain past week" name="knee_pain_in_past_week" value={form.knee_pain_in_past_week} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Stiffness after rest" name="stifness_after_resting" value={form.stifness_after_resting} onChange={onChange} options={OPTIONS.yesNo} />

              <Select label="Knee injuries" name="knee_injuries" value={form.knee_injuries} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Swelling" name="swelling" value={form.swelling} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Difficulty performing" name="difficulty_in_performing" value={form.difficulty_in_performing} onChange={onChange} options={OPTIONS.yesNo} />

              <Select label="Family history" name="family_history" value={form.family_history} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Obesity" name="obesity" value={form.obesity} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Diabetes" name="diabetes" value={form.diabetes} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Hypertension" name="hypertension" value={form.hypertension} onChange={onChange} options={OPTIONS.yesNo} />

              <Select label="Vitamin D deficiency" name="vitaminD_deficiency" value={form.vitaminD_deficiency} onChange={onChange} options={OPTIONS.yesNo} />
              <Select label="Rheumatoid arthritis" name="rheumatoid_arthritis" value={form.rheumatoid_arthritis} onChange={onChange} options={OPTIONS.yesNo} />

              <Input label="Pain Score" name="pain_score" value={form.pain_score} onChange={onChange} />
              <Input label="FBS" name="fbs" value={form.fbs} onChange={onChange} />
              <Input label="WBC" name="wbc" value={form.wbc} onChange={onChange} />
              <Input label="Platelets" name="platelets" value={form.platelets} onChange={onChange} />
              <Input label="CS" name="cs" value={form.cs} onChange={onChange} />
              <Input label="Cholesterol" name="cholesterol" value={form.cholesterol} onChange={onChange} />
              <Input label="CRP" name="crp" value={form.crp} onChange={onChange} />
              <Input label="ESR" name="esr" value={form.esr} onChange={onChange} />
              <Input label="RF" name="rf" value={form.rf} onChange={onChange} />
              <Input label="FBC" name="fbc" value={form.fbc} onChange={onChange} />
              <Input label="BMI" name="bmi" value={form.bmi} onChange={onChange} />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 text-white py-3 font-bold hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Predicting..." : "Predict (Fusion)"}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 rounded-2xl border p-4 bg-slate-50">
            <div className="text-lg font-extrabold text-slate-800">Result</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <ResultBox title="X-ray Model" label={result?.xray?.pred_label} probs={result?.xray?.probs} />
              <ResultBox title="Tabular Model" label={result?.tabular?.pred_label} probs={result?.tabular?.probs} />
              <ResultBox title="Fusion (Final)" label={result?.fusion?.pred_label} probs={result?.fusion?.probs} highlight />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        placeholder={label}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 bg-white"
      >
        {options.map((v) => (
          <option key={`${name}-${v}`} value={v}>
            {v === "" ? "Select" : v}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultBox({ title, label, probs, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "border-slate-900 bg-white" : "bg-white"}`}>
      <div className="text-sm font-bold text-slate-700">{title}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{label}</div>

      {Array.isArray(probs) && (
        <div className="mt-3 text-xs text-slate-600">
          {probs.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>Class {i}</span>
              <span>{Number(p).toFixed(4)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
