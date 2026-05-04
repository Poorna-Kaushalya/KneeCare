import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

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

const PREV_INJURY_KEY =
  "have_you_had_any_previous_knee_injuries_(acl_tear,_meniscus_tear,_fracture,_etc.)";

const DIFFICULTY_KEY =
  "do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)";

const OTHER_RISK_KEY =
  "does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis";

const TREATMENT_KEY =
  "what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition";

function calcBMI(heightCm, weightKg) {
  const h = parseFloat(String(heightCm ?? "").trim());
  const w = parseFloat(String(weightKg ?? "").trim());
  if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return "";
  const m = h / 100.0;
  const bmi = w / (m * m);
  if (!isFinite(bmi)) return "";
  return bmi.toFixed(2);
}

function toFloatSafe(val) {
  const n = parseFloat(String(val ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function encodeYesNo(val) {
  return String(val ?? "").trim().toLowerCase() === "yes" ? 1 : 0;
}

function encodeStiffness(val) {
  const s = String(val ?? "").trim().toLowerCase();
  if (s.includes("occasion")) return 1;
  if (s.includes("frequent")) return 2;
  if (s.includes("always")) return 3;
  return 0;
}

function difficultyCount(val) {
  const s = String(val ?? "").trim();
  if (!s) return 0;
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean).length;
}

function mapSeverity(kl) {
  const s = String(kl ?? "").trim().toUpperCase();
  if (s === "KL0") return 0;
  if (s === "KL1") return 1;
  if (s === "KL2") return 2;
  if (s === "KL3") return 3;
  if (s === "KL4") return 4;
  return 0;
}

function upgrade(currentPlan, minimumPlan) {
  return PLAN_ORDER[currentPlan] >= PLAN_ORDER[minimumPlan]
    ? currentPlan
    : minimumPlan;
}

function basePlan(severity) {
  if (severity <= 0) return "Preventive_SelfCare";
  if (severity === 1 || severity === 2) return "Physio_Lifestyle";
  if (severity === 3) return "Conservative_Clinical";
  return "Surgical_Consult_Referral";
}

function biomarkerFlags({ fbs, cholesterol, esr, crp, rf }) {
  const fbsVal = toFloatSafe(fbs);
  const cholVal = toFloatSafe(cholesterol);
  const esrVal = toFloatSafe(esr);
  const crpVal = toFloatSafe(crp);
  const rfVal = toFloatSafe(rf);

  return {
    high_fbs: fbsVal !== null && fbsVal >= 126 ? 1 : 0,
    high_cholesterol: cholVal !== null && cholVal >= 240 ? 1 : 0,
    borderline_cholesterol:
      cholVal !== null && cholVal >= 200 && cholVal < 240 ? 1 : 0,
    high_esr: esrVal !== null && esrVal > 20 ? 1 : 0,
    high_crp: crpVal !== null && crpVal > 5 ? 1 : 0,
    positive_rf: rfVal !== null && rfVal > 14 ? 1 : 0,
  };
}

function determineFollowup(severity, pain, swelling, flags) {
  if (severity === 4) return 2;
  if (severity >= 3 && pain >= 7) return 4;
  if (swelling === 1) return 6;
  if (flags.high_esr || flags.high_crp) return 6;
  if (severity === 2 && pain >= 6) return 8;
  return 12;
}

function buildLifestyleMessages({
  bmi,
  heightM,
  weightKg,
  pain,
  diabetes,
  hypertension,
  obesity,
  cholesterol,
  difficulty,
  physicalActivity,
}) {
  const messages = [];

  if (bmi !== null && bmi >= 25) {
    const targetWeight = 24.9 * heightM ** 2;
    const loss5 = weightKg * 0.05;
    const loss10 = weightKg * 0.1;

    messages.push(`BMI is ${bmi.toFixed(1)}, which is above the healthy range.`);
    messages.push(
      `Healthy weight for this height is about ${targetWeight.toFixed(1)} kg.`
    );
    messages.push(
      `Try to reduce about ${loss5.toFixed(1)}–${loss10.toFixed(1)} kg initially.`
    );
  }

  if (obesity === 1 && bmi === null) {
    messages.push("Obesity risk detected. Weight management advised.");
  }

  if (pain >= 6) {
    messages.push(
      "Use low-impact exercises (walking, light strengthening exercises)."
    );
  }

  if (difficulty >= 2) {
    messages.push("Reduce knee-straining activities and begin physiotherapy.");
  }

  if (String(physicalActivity ?? "").toLowerCase() === "low") {
    messages.push("Increase daily activity with light exercises.");
  }

  if (diabetes === 1) {
    messages.push("Maintain good blood sugar with balanced meals.");
  }

  if (hypertension === 1) {
    messages.push("Follow a low-salt diet and monitor blood pressure regularly.");
  }

  const chol = toFloatSafe(cholesterol);
  if (chol !== null) {
    if (chol >= 240) {
      messages.push(
        "High cholesterol. Reduce fatty foods and eat more vegetables, fruits, and fiber-rich foods."
      );
    } else if (chol >= 200) {
      messages.push("Borderline cholesterol. Improve diet and monitor.");
    }
  }

  return messages;
}


function normalizeYesNoForSelect(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (s === "yes" || s === "1" || s === "true") return "Yes";
  if (s === "no" || s === "0" || s === "false") return "No";
  return "";
}

function getFrontendTreatmentRecommendation(form, predLabel) {
  const severity = mapSeverity(predLabel);
  const age = parseInt(form.age || "0", 10) || 0;
  const heightCm = toFloatSafe(form.height);
  const weightKg = toFloatSafe(form.weight);
  const heightM = heightCm ? heightCm / 100 : null;
  const bmi = heightM && weightKg ? weightKg / (heightM * heightM) : null;

  const pain = Math.max(0, Math.min(10, toFloatSafe(form.pain_score) ?? 0));
  const stiffness = encodeStiffness(form.stiffness);
  const swelling = encodeYesNo(form.do_you_experience_swelling_in_your_knees);
  const prevInjury = encodeYesNo(form[PREV_INJURY_KEY]);
  const difficulty = difficultyCount(form[DIFFICULTY_KEY]);
  const diabetes = encodeYesNo(form.does_the_patient_has_diabetes);
  const hypertension = encodeYesNo(form.does_the_patient_has_hypertension);
  const obesity = encodeYesNo(form.does_the_patient_has_obesity);

  const flags = biomarkerFlags({
    fbs: form.fbs,
    cholesterol: form.cholesterol,
    esr: form.esr,
    crp: form.crp,
    rf: form.rf,
  });

  let plan = basePlan(severity);
  const notes = [`Base plan selected from predicted severity grade ${severity}.`];

  if (severity >= 2 && pain >= 7) {
    plan = upgrade(plan, "Conservative_Clinical");
    notes.push("High pain increased treatment level.");
  }

  if (severity >= 2 && difficulty >= 3) {
    plan = upgrade(plan, "Conservative_Clinical");
    notes.push("Activity difficulty increased treatment level.");
  }

  if (severity >= 2 && stiffness >= 2) {
    plan = upgrade(plan, "Conservative_Clinical");
    notes.push("Frequent stiffness supported stronger treatment.");
  }

  if (swelling === 1 && severity >= 2) {
    plan = upgrade(plan, "Conservative_Clinical");
    notes.push("Swelling increased treatment.");
  }

  if (bmi !== null && bmi >= 30) {
    plan = upgrade(plan, "Conservative_Clinical");
    notes.push("High BMI increases knee joint loading.");
  }

  if (prevInjury === 1) {
    notes.push("Previous knee injury reported.");
  }

  if (flags.high_fbs) {
    notes.push("FBS is high; diabetic control should be optimized.");
  }

  if (flags.high_cholesterol) {
    notes.push("High cholesterol detected.");
  } else if (flags.borderline_cholesterol) {
    notes.push("Borderline cholesterol detected.");
  }

  if (severity === 4) {
    plan = "Surgical_Consult_Referral";
    notes.push("Severe grade indicates specialist or surgical evaluation.");
  }

  if (age >= 65 && severity >= 3) {
    notes.push("Older age with advanced severity supports closer monitoring.");
  }

  const otherRisk = String(form[OTHER_RISK_KEY] ?? "").trim();
  if (otherRisk) {
    notes.push(`Other reported risk factors: ${otherRisk}`);
  }

  const ongoing = String(form[TREATMENT_KEY] ?? "").trim();
  if (ongoing) {
    notes.push(`Current or ongoing treatments: ${ongoing}`);
  }

  const lifestyle_modifications = buildLifestyleMessages({
    bmi,
    heightM: heightM ?? 0,
    weightKg: weightKg ?? 0,
    pain,
    diabetes,
    hypertension,
    obesity,
    cholesterol: form.cholesterol,
    difficulty,
    physicalActivity: form.physical_activity_level,
  });

  const followup_weeks = determineFollowup(severity, pain, swelling, flags);

  return {
    plan,
    plan_label: PLAN_LABELS[plan],
    bmi: bmi !== null ? Number(bmi.toFixed(2)) : null,
    followup_weeks,
    lifestyle_modifications,
    notes,
  };
}

export default function KOAFusionPredictForm({ patientId, deviceId }) {
  const [activeTab, setActiveTab] = useState("xray");
  const [xray, setXray] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const [form, setForm] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    bmi: "",
    occupation: "",
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
    [PREV_INJURY_KEY]: "",
    [DIFFICULTY_KEY]: "",

    does_the_patient_has_obesity: "",
    does_the_patient_has_diabetes: "",
    does_the_patient_has_hypertension: "",

    [OTHER_RISK_KEY]: "",
    [TREATMENT_KEY]: "",
  });

  useEffect(() => {
    console.log("KOAFusionPredictForm patientId:", patientId);
    console.log("KOAFusionPredictForm deviceId:", deviceId);
  }, [patientId, deviceId]);

  useEffect(() => {
    const bmi = calcBMI(form.height, form.weight);
    setForm((p) => {
      if ((p.bmi ?? "") === bmi) return p;
      return { ...p, bmi };
    });
  }, [form.height, form.weight]);

  useEffect(() => {
    if (!patientId) return;

    const fetchPatientFormData = async () => {
      try {
        setPrefillLoading(true);

        const res = await api.get(`/api/patients/${patientId}`);
        console.log("Fetched patient data:", res.data);

        const p = res.data || {};

        const nextForm = {
          age: p.age ?? "",
          gender: p.gender ?? "",
          height: p.heightCm ?? "",
          weight: p.weightKg ?? "",
          bmi: calcBMI(p.heightCm ?? "", p.weightKg ?? ""),

          occupation: normalizeYesNoForSelect(p.occupation),
          physical_activity_level: p.physical_activity_level ?? "",
          pain_score: p.pain_score ?? "",
          stiffness: p.stiffness ?? "",

          fbs: p.fbs ?? "",
          wbc: p.wbc ?? "",
          platelets: p.platelets ?? "",
          cs: p.cs ?? p.sugar ?? "",
          cholesterol: p.cholesterol ?? "",
          crp: p.crp ?? "",
          esr: p.esr ?? "",
          rf: p.rf ?? "",

          do_you_currently_experience_knee_pain: normalizeYesNoForSelect(
            p.do_you_currently_experience_knee_pain
          ),
          do_you_experience_swelling_in_your_knees: normalizeYesNoForSelect(
            p.do_you_experience_swelling_in_your_knees
          ),
          [PREV_INJURY_KEY]: normalizeYesNoForSelect(p.previousKneeInjury),
          [DIFFICULTY_KEY]: p[DIFFICULTY_KEY] ?? "",

          does_the_patient_has_obesity: normalizeYesNoForSelect(
            p.does_the_patient_has_obesity
          ),
          does_the_patient_has_diabetes: normalizeYesNoForSelect(
            p.does_the_patient_has_diabetes
          ),
          does_the_patient_has_hypertension: normalizeYesNoForSelect(
            p.does_the_patient_has_hypertension
          ),

          [OTHER_RISK_KEY]: p[OTHER_RISK_KEY] ?? "",
          [TREATMENT_KEY]: p[TREATMENT_KEY] ?? "",
        };

        console.log("Mapped form data:", nextForm);
        setForm(nextForm);
      } catch (err) {
        console.error("Failed to fetch patient form data:", err);
      } finally {
        setPrefillLoading(false);
      }
    };

    fetchPatientFormData();
  }, [patientId]);

  const previewUrl = useMemo(() => {
    if (!xray) return "";
    return URL.createObjectURL(xray);
  }, [xray]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const setDifficulty = (newValue) => {
    setForm((p) => ({
      ...p,
      [DIFFICULTY_KEY]: newValue,
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
      PREV_INJURY_KEY,
      DIFFICULTY_KEY,
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
      OTHER_RISK_KEY,
      TREATMENT_KEY,
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
      fd.append("xray", file);
      fd.append("patientId", patientId || "");
      fd.append("deviceId", deviceId || "");

      fd.append("tabular", JSON.stringify(form));

      const resp = await api.post("/api/ml/fusion", fd);

      const serverData = resp.data || {};
      const predLabel =
        serverData?.fusion?.pred_label || serverData?.pred_label || "";

      const frontendTreatment = getFrontendTreatmentRecommendation(form, predLabel);

      setResult({
        ...serverData,
        fusion: {
          ...(serverData.fusion || {}),
          pred_label: predLabel,
        },
        treatment: frontendTreatment,
      });
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

  const treatment = result?.treatment || null;
  const predLabel = result?.fusion?.pred_label || "";
  const severityText = getSeverityName(predLabel);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-xl bg-white">
        <div className="px-5 pt-4">
          <div className="flex flex-wrap gap-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-6 py-3 rounded-full text-sm font-bold border transition ${
                  activeTab === t.key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
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

          {prefillLoading && (
            <div className="mt-3 text-sm text-slate-500">
              Loading patient medical data...
            </div>
          )}
        </div>

        <form onSubmit={submit}>
          <div className="p-5">
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
                      src={previewUrl}
                      alt="X-ray Preview"
                      className="w-full max-w-sm h-52 object-contain rounded-xl border bg-white"
                    />
                  ) : (
                    <div className="text-sm text-slate-500">Preview will appear here</div>
                  )}
                </div>
              </div>
            )}

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
                  name={PREV_INJURY_KEY}
                  value={form[PREV_INJURY_KEY]}
                  onChange={onChange}
                  options={OPTIONS.yesNo}
                />

                <DifficultyCheckboxGroup
                  label="Difficulty in performing activities (check all that apply)"
                  name={DIFFICULTY_KEY}
                  options={DIFFICULTY_ACTIVITIES}
                  value={form[DIFFICULTY_KEY]}
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
                  name={OTHER_RISK_KEY}
                  value={form[OTHER_RISK_KEY]}
                  onChange={onChange}
                />

                <Input
                  label="Treatments"
                  name={TREATMENT_KEY}
                  value={form[TREATMENT_KEY]}
                  onChange={onChange}
                />
              </div>
            )}
          </div>

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

        <h1 className="text-2xl font-bold text-slate-800 mb-3 px-5">
          Treatment Suggestion Plan
        </h1>

        {result && (
          <div className="p-5 border-t bg-slate-50 rounded-b-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Predicted Severity
                </div>

                <div
                  className={`mt-3 inline-flex px-4 py-2 rounded-full font-extrabold text-sm shadow border text-white ${
                    predLabel === "KL0"
                      ? "bg-green-500 border-green-600"
                      : predLabel === "KL1"
                      ? "bg-yellow-400 border-yellow-500"
                      : predLabel === "KL2"
                      ? "bg-orange-400 border-orange-500"
                      : predLabel === "KL3"
                      ? "bg-orange-600 border-orange-700"
                      : "bg-red-600 border-red-700"
                  }`}
                >
                  {severityText} {predLabel ? `(${predLabel})` : ""}
                </div>

                {treatment?.plan_label && (
                  <>
                    <div className="mt-5 text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                      Recommended Plan
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-800">
                      {treatment.plan_label}
                    </div>
                  </>
                )}

                {treatment?.followup_weeks && (
                  <>
                    <div className="mt-5 text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                      Follow-up
                    </div>
                    <div className="mt-2 text-sm text-slate-800">
                      Review again in <span className="font-bold">{treatment.followup_weeks} weeks</span>
                    </div>
                  </>
                )}

                {treatment?.bmi && (
                  <>
                    <div className="mt-5 text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                      BMI
                    </div>
                    <div className="mt-2 text-sm text-slate-800">{treatment.bmi}</div>
                  </>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-5 lg:col-span-2">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3">
                  Lifestyle Modifications
                </div>

                {Array.isArray(treatment?.lifestyle_modifications) &&
                treatment.lifestyle_modifications.length > 0 ? (
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                    {treatment.lifestyle_modifications.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No lifestyle advice available.</div>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-5 lg:col-span-3">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3">
                  Notes
                </div>

                {Array.isArray(treatment?.notes) && treatment.notes.length > 0 ? (
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                    {treatment.notes.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">No notes available.</div>
                )}
              </div>
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
  const selected = value
    ? value.split(",").map((v) => v.trim()).filter(Boolean)
    : [];

  const toggle = (opt) => {
    let next;
    if (selected.includes(opt)) {
      next = selected.filter((v) => v !== opt);
    } else {
      next = [...selected, opt];
    }
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