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

  const severityMap = {
    KL0: "Normal",
    KL1: "Doubtful",
    KL2: "Mild",
    KL3: "Moderate",
    KL4: "Severe",
  };

  const getSeverityName = (kl) => severityMap[kl] || "Unknown";


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
    <div className="max-w-12xl mx-auto pb-0 mb-0">
      <div className="rounded-xl shadow-md pb-0 mb-0">

        <form onSubmit={submit} className="mt-0 space-y-4">
          {/* X-ray Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            {/* Upload */}
            <div>
              <div className="font-bold text-slate-700 mb-2">X-ray Image &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <input
                  type="file"
                  accept="image/*"
                  className="font-sans text-sm"
                  onChange={(e) => setXray(e.target.files?.[0] || null)}
                /></div>

              {xray && (
                <div className="text-sm text-slate-500 mt-2">
                  Selected: {xray.name}
                </div>
              )}
            </div>

            {/* Preview */}
            {xray && (
              <div className="relative -left-[180px] -top-4">
                <div className="  bg-white">
                  <img
                    src={URL.createObjectURL(xray)}
                    alt="X-ray Preview"
                    className="w-48 h-32 rounded-xl border"
                  />
                </div>
              </div>
            )}
          </div>


          {result && (
            <div className="absolute top-12 right-64 flex justify-center">
              <div
                className={`
                    px-4 py-1
                    rounded-full
                    font-extrabold text-sm
                    shadow-lg
                    border
                    flex items-center gap-3
        ${result?.fusion?.pred_label === "KL0"
                    ? "bg-green-500 border-green-600"
                    : result?.fusion?.pred_label === "KL1"
                      ? "bg-yellow-400 border-yellow-500"
                      : result?.fusion?.pred_label === "KL2"
                        ? "bg-orange-400 border-orange-500"
                        : result?.fusion?.pred_label === "KL3"
                          ? "bg-orange-600 border-orange-700"
                          : "bg-red-600 border-red-700"
                  }
        text-white
      `}
              >
                <span className="uppercase tracking-wide text-sm opacity-90">
                  Severity Level -
                </span>
                <span className="text-sm">
                  {getSeverityName(result?.fusion?.pred_label)}
                </span>
              </div>
            </div>
          )}

          {/* Tabular Fields */}
          <div className="rounded-xl p-4 relative -top-12 mb-0">
            <div className="font-bold text-slate-700 mb-3">
              Clinical / Biomarker Inputs
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
            className="relative w-96 rounded-3xl -top-32 left-[700px] bg-blue-600 text-white py-2 font-bold hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Predicting..." : "Predict Severity Level"}
          </button>
        </form>
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
        className="mt-0 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
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


