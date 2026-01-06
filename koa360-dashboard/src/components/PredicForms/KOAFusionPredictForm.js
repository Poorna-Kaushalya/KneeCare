// =======================================================
// COMPLETE TABS FORM (COPY-PASTE)
// ✅ Occupation = Yes/No
// ✅ BMI AUTO-CALCULATED from Height + Weight (cm, kg)
// ✅ Difficulty Activities = CHECKBOX multi-select
//    -> stored/sent as comma-separated string
// =======================================================

import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

const OPTIONS = {
  gender: ["", "Male", "Female"],
  yesNo: ["", "No", "Yes"],
  occupation: ["", "No", "Yes"], // ✅ occupation as Yes/No
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

function calcBMI(heightCm, weightKg) {
  const h = parseFloat(String(heightCm ?? "").trim());
  const w = parseFloat(String(weightKg ?? "").trim());
  if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return "";
  const m = h / 100.0;
  const bmi = w / (m * m);
  if (!isFinite(bmi)) return "";
  return bmi.toFixed(2);
}

export default function KOAFusionPredictForm() {
  const [activeTab, setActiveTab] = useState("xray");

  const [xray, setXray] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // ✅ State (BMI auto)
  const [form, setForm] = useState({
    age: "",
    gender: "",
    height: "", // cm
    weight: "", // kg
    bmi: "", // auto

    occupation: "", // Yes/No
    physical_activity_level: "",

    pain_score: "",
    stiffness: "",

    fbs: "",
    wbc: "",
    platelets: "",
    cs: "",
    cholesterol: "",
    crp: "",
    esr: "",
    rf: "",

    do_you_currently_experience_knee_pain: "",
    do_you_experience_swelling_in_your_knees: "",
    "have_you_had_any_previous_knee_injuries_(acl_tear,_meniscus_tear,_fracture,_etc.)": "",
    "do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)": "",

    does_the_patient_has_obesity: "",
    does_the_patient_has_diabetes: "",
    does_the_patient_has_hypertension: "",

    "does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis":
      "",
    "what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition":
      "",
  });

  //  Auto-calc BMI whenever height/weight change
  useEffect(() => {
    const bmi = calcBMI(form.height, form.weight);
    setForm((p) => {
      if ((p.bmi ?? "") === bmi) return p;
      return { ...p, bmi };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.height, form.weight]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const setDifficulty = (newValue) => {
    setForm((p) => ({
      ...p,
      "do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)":
        newValue,
    }));
  };

  const severityMap = {
    KL0: "Normal",
    KL1: "Doubtful",
    KL2: "Mild",
    KL3: "Moderate",
    KL4: "Severe",
  };

  const getSeverityName = (kl) => severityMap[kl] || "Unknown";

  // Optional: completion per tab
  const completion = useMemo(() => {
    const filled = (k) => String(form[k] ?? "").trim() !== "";
    const count = (keys) => keys.reduce((acc, k) => acc + (filled(k) ? 1 : 0), 0);

    const demoKeys = [
      "age",
      "gender",
      "height",
      "weight",
      "bmi",
      "occupation",
      "physical_activity_level",
    ];
    const sympKeys = [
      "do_you_currently_experience_knee_pain",
      "do_you_experience_swelling_in_your_knees",
      "have_you_had_any_previous_knee_injuries_(acl_tear,_meniscus_tear,_fracture,_etc.)",
      "do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)",
      "pain_score",
      "stiffness",
      "does_the_patient_has_obesity",
      "does_the_patient_has_diabetes",
      "does_the_patient_has_hypertension",
    ];
    const bioKeys = [
      "fbs",
      "wbc",
      "platelets",
      "cs",
      "cholesterol",
      "crp",
      "esr",
      "rf",
      "does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis",
      "what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition",
    ];

    return {
      demo: `${count(demoKeys)}/${demoKeys.length}`,
      symp: `${count(sympKeys)}/${sympKeys.length}`,
      bio: `${count(bioKeys)}/${bioKeys.length}`,
    };
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!xray) {
      setActiveTab("xray");
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

  const goNext = () => {
    const idx = TABS.findIndex((t) => t.key === activeTab);
    const next = TABS[Math.min(idx + 1, TABS.length - 1)]?.key;
    setActiveTab(next);
  };

  const goPrev = () => {
    const idx = TABS.findIndex((t) => t.key === activeTab);
    const prev = TABS[Math.max(idx - 1, 0)]?.key;
    setActiveTab(prev);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="rounded-xl ">
        {/* Header */}
        <div className="p-5 absolute top-18 right-64 border-b  items-start justify-between gap-8">

          {/* Result badge */}
          {result && (
            <div
              className={`
                px-4 py-2 rounded-full font-extrabold text-sm shadow border items-center gap-2
                ${
                  result?.fusion?.pred_label === "KL0"
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
              <span className="uppercase tracking-wide opacity-90">Severity &nbsp;&nbsp;</span>
              <span>{getSeverityName(result?.fusion?.pred_label)}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="flex flex-wrap gap-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`
                  px-4 py-2 rounded-full text-sm font-bold border transition
                  ${
                    activeTab === t.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }
                `}
              >
                {t.label}
                {t.key === "demo" && (
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      activeTab === t.key ? "bg-white/20" : "bg-slate-100"
                    }`}
                  >
                    {completion.demo}
                  </span>
                )}
                {t.key === "symp" && (
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      activeTab === t.key ? "bg-white/20" : "bg-slate-100"
                    }`}
                  >
                    {completion.symp}
                  </span>
                )}
                {t.key === "bio" && (
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      activeTab === t.key ? "bg-white/20" : "bg-slate-100"
                    }`}
                  >
                    {completion.bio}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit}>
          {/* Content */}
          <div className="p-5">
            {/* TAB 1: XRAY */}
            {activeTab === "xray" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border p-4">
                  <div className="font-bold text-slate-700 mb-2">Upload X-ray</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="font-sans text-sm"
                    onChange={(e) => setXray(e.target.files?.[0] || null)}
                  />
                  {xray && (
                    <div className="text-sm text-slate-500 mt-2">
                      Selected: {xray.name}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border p-4 flex items-center justify-center bg-slate-50">
                  {xray ? (
                    <img
                      src={URL.createObjectURL(xray)}
                      alt="X-ray Preview"
                      className="w-full max-w-sm h-52 object-contain rounded-xl border bg-white"
                    />
                  ) : (
                    <div className="text-sm text-slate-500">Preview will appear here</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DEMOGRAPHICS */}
            {activeTab === "demo" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="Age" name="age" value={form.age} onChange={onChange} />
                <Select
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  options={OPTIONS.gender}
                />
                <Input label="Height (cm)" name="height" value={form.height} onChange={onChange} />
                <Input label="Weight (kg)" name="weight" value={form.weight} onChange={onChange} />

                {/* ✅ BMI auto */}
                <InputReadOnly label="BMI (auto)" name="bmi" value={form.bmi} />

                <Select
                  label="Occupation (Yes/No)"
                  name="occupation"
                  value={form.occupation}
                  onChange={onChange}
                  options={OPTIONS.occupation}
                />

                <Select
                  label="Physical Activity"
                  name="physical_activity_level"
                  value={form.physical_activity_level}
                  onChange={onChange}
                  options={OPTIONS.physical_activity_level}
                />
              </div>
            )}

            {/* TAB 3: SYMPTOMS & HISTORY */}
            {activeTab === "symp" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="Pain Score" name="pain_score" value={form.pain_score} onChange={onChange} />

                <Select
                  label="Stiffness"
                  name="stiffness"
                  value={form.stiffness}
                  onChange={onChange}
                  options={OPTIONS.stiffness}
                />

                <Select
                  label="Currently Knee Pain?"
                  name="do_you_currently_experience_knee_pain"
                  value={form.do_you_currently_experience_knee_pain}
                  onChange={onChange}
                  options={OPTIONS.yesNo}
                />

                <Select
                  label="Swelling in Knees?"
                  name="do_you_experience_swelling_in_your_knees"
                  value={form.do_you_experience_swelling_in_your_knees}
                  onChange={onChange}
                  options={OPTIONS.yesNo}
                />

                <Select
                  label="Previous Knee Injury?"
                  name="have_you_had_any_previous_knee_injuries_(acl_tear,_meniscus_tear,_fracture,_etc.)"
                  value={form["have_you_had_any_previous_knee_injuries_(acl_tear,_meniscus_tear,_fracture,_etc.)"]}
                  onChange={onChange}
                  options={OPTIONS.yesNo}
                />

                {/* ✅ UPDATED: Checkbox multi-select */}
                <DifficultyCheckboxGroup
                  label="Difficulty in performing activities (check all that apply)"
                  name="do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)"
                  options={DIFFICULTY_ACTIVITIES}
                  value={form["do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)"]}
                  onChange={setDifficulty}
                />

                <Select
                  label="Obesity"
                  name="does_the_patient_has_obesity"
                  value={form.does_the_patient_has_obesity}
                  onChange={onChange}
                  options={OPTIONS.yesNo}
                />
                <Select
                  label="Diabetes"
                  name="does_the_patient_has_diabetes"
                  value={form.does_the_patient_has_diabetes}
                  onChange={onChange}
                  options={OPTIONS.yesNo}
                />
                <Select
                  label="Hypertension"
                  name="does_the_patient_has_hypertension"
                  value={form.does_the_patient_has_hypertension}
                  onChange={onChange}
                  options={OPTIONS.yesNo}
                />
              </div>
            )}

            {/* TAB 4: BIOMARKERS & OTHER */}
            {activeTab === "bio" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="FBS" name="fbs" value={form.fbs} onChange={onChange} />
                <Input label="WBC" name="wbc" value={form.wbc} onChange={onChange} />
                <Input label="Platelets" name="platelets" value={form.platelets} onChange={onChange} />
                <Input label="CS" name="cs" value={form.cs} onChange={onChange} />

                <Input label="Cholesterol" name="cholesterol" value={form.cholesterol} onChange={onChange} />
                <Input label="CRP" name="crp" value={form.crp} onChange={onChange} />
                <Input label="ESR" name="esr" value={form.esr} onChange={onChange} />
                <Input label="RF" name="rf" value={form.rf} onChange={onChange} />

                <Input
                  label="Other Risk Factors"
                  name="does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis"
                  value={
                    form["does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis"]
                  }
                  onChange={onChange}
                />

                <Input
                  label="Treatments"
                  name="what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition"
                  value={form["what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition"]}
                  onChange={onChange}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="px-4 py-2 rounded-xl border font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={activeTab === "xray"}
            >
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goNext}
                className="px-4 py-2 rounded-xl border font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                disabled={activeTab === "bio"}
              >
                Next
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-extrabold hover:opacity-95 disabled:opacity-50"
              >
                {loading ? "Predicting..." : "Predict Severity Level"}
              </button>
            </div>
          </div>
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
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        placeholder={label}
      />
    </div>
  );
}

function InputReadOnly({ label, name, value }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <input
        name={name}
        value={value}
        readOnly
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none bg-slate-50 text-slate-700"
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

function DifficultyCheckboxGroup({ label, name, options, value, onChange }) {
  // value stored as comma-separated string
  const selected = value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];

  const toggle = (opt) => {
    let next;
    if (selected.includes(opt)) next = selected.filter((v) => v !== opt);
    else next = [...selected, opt];
    onChange(next.join(", "));
  };

  return (
    <div className="md:col-span-2">
      <div className="text-xs font-bold text-slate-600 mb-2">{label}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <label
            key={`${name}-${opt}`}
            className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="rounded border-slate-300 focus:ring-slate-400"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
