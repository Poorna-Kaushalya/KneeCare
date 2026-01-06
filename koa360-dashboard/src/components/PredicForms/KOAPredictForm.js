import { useMemo, useState, useCallback } from "react";

/** Stable (prevents eslint deps warnings) */
const REQUIRED_BY_TAB = {
  0: [
    "age",
    "gender",
    "height_cm",
    "weight",
    "occupation",
    "physical_activity_level",
    "living_environment",
  ],
  1: [
    "knee_pain",
    "knee_pain_in_past_week",
    "stifness_after_resting",
    "difficulty_in_performing",
    "knee_injuries",
    "swelling",
    "family_history",
    "obesity",
    "diabetes",
    "hypertension",
    "vitaminD_deficiency",
    "rheumatoid_arthritis",
  ],
  2: ["fbs", "wbc", "platelets", "cs", "cholesterol", "crp", "esr", "rf", "fbc"],
};

export default function KOAPredictForm() {
  const API_URL = "http://localhost:5000/api/predict";
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState({
    // TAB 0 (Personal & Lifestyle)
    age: "",
    gender: "Male",
    height_cm: "",
    weight: "",
    occupation: "Yes",
    physical_activity_level: "Moderate",
    living_environment: "Urban",

    // TAB 1 (Symptoms & History)
    knee_pain: "No",
    knee_pain_in_past_week: "",
    stifness_after_resting: "never",
    difficulty_in_performing: "none",
    knee_injuries: "No",
    swelling: "No",
    family_history: "No",
    obesity: "No",
    diabetes: "No",
    hypertension: "No",
    vitaminD_deficiency: "No",
    rheumatoid_arthritis: "No",

    // TAB 2 (Clinical Markers)
    fbs: "",
    wbc: "",
    platelets: "",
    cs: "",
    cholesterol: "",
    crp: "",
    esr: "",
    rf: "",
    fbc: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // ===== Derived values =====
  const height_m = useMemo(() => {
    const hcm = Number(formData.height_cm);
    if (!Number.isFinite(hcm) || hcm <= 0) return "";
    return +(hcm / 100).toFixed(2);
  }, [formData.height_cm]);

  const computedBMI = useMemo(() => {
    const wKg = Number(formData.weight);
    const hM = Number(height_m);
    if (!Number.isFinite(wKg) || wKg <= 0) return "";
    if (!Number.isFinite(hM) || hM <= 0) return "";
    return +(wKg / (hM * hM)).toFixed(2);
  }, [formData.weight, height_m]);

  // ===== Change handler =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== Encoders (same as training) =====
  const mapGender = (v) => (v === "Male" ? 1 : 0); // Female=0, Male=1
  const mapYesNo = (v) => (v === "Yes" ? 1 : 0); // No=0, Yes=1
  const mapLiving = (v) => (v === "Urban" ? 1 : 0); // Rural=0, Urban=1

  // always=0, frequently=1, never=2, occasionally=3
  const mapStiffness = (v) => {
    const val = String(v).toLowerCase();
    const map = { always: 0, frequently: 1, never: 2, occasionally: 3 };
    return map[val] ?? 2;
  };

  // mild=0, moderate=1, none=2, severe=3
  const mapDifficulty = (v) => {
    const val = String(v).toLowerCase();
    const map = { mild: 0, moderate: 1, none: 2, severe: 3 };
    return map[val] ?? 2;
  };

  // get_dummies(drop_first=True) => keep Low & Moderate
  const makeActivityDummies = (level) => ({
    physical_activity_level_Low: level === "Low" ? 1 : 0,
    physical_activity_level_Moderate: level === "Moderate" ? 1 : 0,
  });

  // ===== Must fill all tabs before prediction =====
  const isFilled = useCallback(
    (name) => {
      const v = formData[name];
      if (v === null || v === undefined) return false;
      if (typeof v === "string") return v.trim() !== "";
      return true;
    },
    [formData]
  );

  const getFirstMissingTab = useCallback(() => {
    // derived checks
    if (!isFilled("age")) return 0;
    if (!isFilled("height_cm") || height_m === "") return 0;
    if (!isFilled("weight") || computedBMI === "") return 0;

    for (const tabIndex of [0, 1, 2]) {
      for (const field of REQUIRED_BY_TAB[tabIndex]) {
        if (!isFilled(field)) return tabIndex;
      }
    }
    return null;
  }, [isFilled, height_m, computedBMI]);

  const allTabsComplete = useMemo(
    () => getFirstMissingTab() === null,
    [getFirstMissingTab]
  );

  // ===== Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const missingTab = getFirstMissingTab();
    if (missingTab !== null) {
      setActiveTab(missingTab);
      setError(
        "Please complete all required fields in all tabs before generating prediction."
      );
      return;
    }

    setLoading(true);

    try {
      const activity = makeActivityDummies(formData.physical_activity_level);

      const features = {
        age: Number(formData.age),
        gender: mapGender(formData.gender),
        height: Number(height_m),
        weight: Number(formData.weight),
        occupation: mapYesNo(formData.occupation),
        living_environment: mapLiving(formData.living_environment),

        knee_pain: mapYesNo(formData.knee_pain),
        knee_pain_in_past_week: Number(formData.knee_pain_in_past_week),
        stifness_after_resting: mapStiffness(formData.stifness_after_resting),
        knee_injuries: mapYesNo(formData.knee_injuries),
        swelling: mapYesNo(formData.swelling),
        difficulty_in_performing: mapDifficulty(formData.difficulty_in_performing),

        family_history: mapYesNo(formData.family_history),
        obesity: mapYesNo(formData.obesity),
        diabetes: mapYesNo(formData.diabetes),
        hypertension: mapYesNo(formData.hypertension),
        vitaminD_deficiency: mapYesNo(formData.vitaminD_deficiency),
        rheumatoid_arthritis: mapYesNo(formData.rheumatoid_arthritis),

        fbs: Number(formData.fbs),
        wbc: Number(formData.wbc),
        platelets: Number(formData.platelets),
        cs: Number(formData.cs),
        cholesterol: Number(formData.cholesterol),
        crp: Number(formData.crp),
        esr: Number(formData.esr),
        rf: Number(formData.rf),
        fbc: Number(formData.fbc),

        ...activity,
        BMI: Number(computedBMI),
      };

      // numeric sanity
      for (const [k, v] of Object.entries(features)) {
        if (!Number.isFinite(v)) {
          throw new Error(`Invalid value for ${k}. Please check your inputs.`);
        }
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setResult(data);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => setActiveTab((t) => Math.min(2, t + 1));

  const TabButton = ({ index, label }) => (
    <button
      type="button"
      onClick={() => setActiveTab(index)}
      className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
        activeTab === index
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-400 hover:text-gray-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="py-0">
      <div className="max-w-4xl mx-auto">
        <div className="overflow-hidden">
          {/* Tabs */}
          <div className="flex sticky top-0 bg-white">
            <TabButton index={0} label="Personal & Lifestyle" />
            <TabButton index={1} label="Symptoms & History" />
            <TabButton index={2} label="Clinical Markers" />
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            {/* TAB 0 */}
            {activeTab === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <Input label="Age" name="age" value={formData.age} onChange={handleChange} />
                <Select
                  label="Gender"
                  name="gender"
                  options={["Male", "Female"]}
                  value={formData.gender}
                  onChange={handleChange}
                />
                <Input label="Height (cm)" name="height_cm" value={formData.height_cm} onChange={handleChange} />
                <Input label="Weight (kg)" name="weight" value={formData.weight} onChange={handleChange} />
                <ReadOnly label="Height (meters - auto)" value={height_m === "" ? "--" : String(height_m)} />
                <ReadOnly label="Calculated BMI (auto)" value={computedBMI === "" ? "--" : String(computedBMI)} />
                <Select
                  label="Occupation"
                  name="occupation"
                  options={["Yes", "No"]}
                  value={formData.occupation}
                  onChange={handleChange}
                />
                <Select
                  label="Activity Level"
                  name="physical_activity_level"
                  options={["High", "Moderate", "Low"]}
                  value={formData.physical_activity_level}
                  onChange={handleChange}
                />
                <Select
                  label="Living Environment"
                  name="living_environment"
                  options={["Urban", "Rural"]}
                  value={formData.living_environment}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* TAB 1 */}
            {activeTab === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                <Select
                  label="Knee Pain"
                  name="knee_pain"
                  options={["Yes", "No"]}
                  value={formData.knee_pain}
                  onChange={handleChange}
                />
                <Input
                  label="Pain Level (0-5)"
                  name="knee_pain_in_past_week"
                  type="number"
                  value={formData.knee_pain_in_past_week}
                  onChange={handleChange}
                />
                <Select
                  label="Stiffness"
                  name="stifness_after_resting"
                  options={["never", "occasionally", "frequently", "always"]}
                  value={formData.stifness_after_resting}
                  onChange={handleChange}
                />
                <Select
                  label="Difficulty in Movement"
                  name="difficulty_in_performing"
                  options={["none", "mild", "moderate", "severe"]}
                  value={formData.difficulty_in_performing}
                  onChange={handleChange}
                />

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Medical History
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      "knee_injuries",
                      "swelling",
                      "family_history",
                      "obesity",
                      "diabetes",
                      "hypertension",
                      "vitaminD_deficiency",
                      "rheumatoid_arthritis",
                    ].map((field) => (
                      <CheckboxSelect
                        key={field}
                        label={field.replaceAll("_", " ")}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2 */}
            {activeTab === 2 && (
              <div className="animate-fadeIn">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {["fbs", "wbc", "platelets", "cs", "cholesterol", "crp", "esr", "rf", "fbc"].map((lab) => (
                    <Input
                      key={lab}
                      label={lab.toUpperCase()}
                      name={lab}
                      value={formData[lab]}
                      onChange={handleChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-4 flex flex-col items-center">
              <button
                type="submit"
                disabled={loading || !allTabsComplete}
                className="w-full md:w-48 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!allTabsComplete ? "Complete all tabs to enable prediction" : ""}
              >
                {loading ? "Analyzing Data..." : "Generate Prediction"}
              </button>

              {activeTab < 2 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="mt-0 text-blue-600 text-sm font-medium hover:underline"
                >
                  Next Section →
                </button>
              )}

              {!allTabsComplete && (
                <div className="mt-0 text-xs text-slate-500 text-center">
                  Fill all required fields in <b>all tabs</b> to enable prediction.
                </div>
              )}
            </div>

            {/* keep form compact (remove extra bottom whitespace) */}
            <div className="h-0" />
          </form>

          {/* Results */}
          {(result || error) && (
            <div className={`p-6 border-t ${error ? "bg-red-50" : "bg-blue-50"}`}>
              {error && <p className="text-red-600 font-medium">⚠️ {error}</p>}

              {result && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-blue-900 text-xl font-bold">Analysis Complete</h3>
                    <p className="text-blue-700">
                      The model indicates:{" "}
                      <span className="font-extrabold">{result.prediction}</span>
                    </p>
                  </div>

                  <div className="text-center bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
                    <div className="text-3xl font-black text-blue-600">
                      {result.confidence == null
                        ? "--"
                        : `${(Number(result.confidence) * 100).toFixed(1)}%`}
                    </div>
                    <div className="text-xs uppercase tracking-widest font-bold text-gray-400">
                      Confidence
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Subcomponents ===== */

function Input({ label, name, type = "number", value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-1 py-2 transition-all outline-none"
      />
    </div>
  );
}

function Select({ label, name, options, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-1 py-2 transition-all outline-none"
      >
        {options.map((opt) => (
          <option key={`${name}-${opt}`} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxSelect({ label, name, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange({
          target: { name, value: value === "Yes" ? "No" : "Yes" },
        })
      }
      className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
        value === "Yes"
          ? "bg-blue-100 border-blue-600 text-blue-700"
          : "bg-white border-gray-200 text-gray-400"
      }`}
    >
      {label}
    </button>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
        {label}
      </label>
      <div className="w-full bg-slate-100 border-b-2 border-slate-200 px-1 py-2 text-gray-500 font-medium">
        {value || "--"}
      </div>
    </div>
  );
}
