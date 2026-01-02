import React, { useMemo, useState } from "react";

const KOAPredictForm = () => {
  const API_URL = "http://localhost:5000/api/predict";

  const [formData, setFormData] = useState({
    age: "",
    gender: "Male", // match dataset casing
    height_cm: "",  // UI uses cm; we will convert to meters for model
    weight: "",
    occupation: "Yes", // dataset occupation is Yes/No

    physical_activity_level: "Moderate", // UI as single select (High/Low/Moderate)
    living_environment: "Urban",

    knee_pain: "No",
    knee_pain_in_past_week: 0,
    stifness_after_resting: "never", // dataset values are lowercase in your preview
    knee_injuries: "No",
    swelling: "No",
    difficulty_in_performing: "none",

    family_history: "No",
    obesity: "No",
    diabetes: "No",
    hypertension: "No",
    vitaminD_deficiency: "No",
    rheumatoid_arthritis: "No",

    fbs: "",
    wbc: "",
    platelets: "",
    cs: "",
    cholesterol: "",
    crp: "",
    esr: "",
    rf: "",
    fbc: "" // note: in your training fbc is numeric lab value, not "normal/abnormal"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Convert cm -> meters (your training height is in meters like 1.66)
  const height_m = useMemo(() => {
    const hcm = Number(formData.height_cm);
    if (!hcm) return "";
    const hm = hcm / 100;
    return Number.isFinite(hm) ? hm : "";
  }, [formData.height_cm]);

  // BMI in training: weight / (height_m^2)
  const computedBMI = useMemo(() => {
    const wKg = Number(formData.weight);
    const hM = Number(height_m);
    if (!wKg || !hM) return "";
    const bmi = wKg / (hM * hM);
    return Number.isFinite(bmi) ? bmi.toFixed(6) : "";
  }, [formData.weight, height_m]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toNumberOrThrow = (v, fieldName) => {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`Invalid number for ${fieldName}`);
    return n;
  };

  // LabelEncoder-like mapping (alphabetical order)
  const mapGender = (v) => (v === "Male" ? 1 : 0); // Female=0, Male=1
  const mapYesNo = (v) => (v === "Yes" ? 1 : 0);   // No=0, Yes=1
  const mapLiving = (v) => (v === "Urban" ? 1 : 0); // Rural=0, Urban=1

  // stifness_after_resting: always=0, frequently=1, never=2, occasionally=3
  const mapStiffness = (v) => {
    const val = String(v).toLowerCase();
    if (val === "always") return 0;
    if (val === "frequently") return 1;
    if (val === "never") return 2;
    if (val === "occasionally") return 3;
    return 2; // default -> never
  };

  // difficulty_in_performing alphabetical: mild=0, moderate=1, none=2, severe=3
  const mapDifficulty = (v) => {
    const val = String(v).toLowerCase();
    if (val === "mild") return 0;
    if (val === "moderate") return 1;
    if (val === "none") return 2;
    if (val === "severe") return 3;
    return 2; // default -> none
  };

  // get_dummies(drop_first=True) on ["High","Low","Moderate"] -> keep Low & Moderate
  const makeActivityDummies = (level) => {
    const v = String(level);
    return {
      physical_activity_level_Low: v === "Low" ? 1 : 0,
      physical_activity_level_Moderate: v === "Moderate" ? 1 : 0
      // High => both 0
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // Basic required validation
      if (formData.age === "" || formData.height_cm === "" || formData.weight === "") {
        throw new Error("Please fill required fields: age, height, weight");
      }
      if (height_m === "") throw new Error("Invalid height");

      const activity = makeActivityDummies(formData.physical_activity_level);

      // Build the EXACT features your model expects (numeric only)
      const features = {
        age: toNumberOrThrow(formData.age, "age"),
        gender: mapGender(formData.gender),
        height: toNumberOrThrow(height_m, "height(meters)"),
        weight: toNumberOrThrow(formData.weight, "weight"),
        occupation: mapYesNo(formData.occupation),

        living_environment: mapLiving(formData.living_environment),
        knee_pain: mapYesNo(formData.knee_pain),
        knee_pain_in_past_week: toNumberOrThrow(formData.knee_pain_in_past_week, "knee_pain_in_past_week"),

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

        fbs: toNumberOrThrow(formData.fbs || 0, "fbs"),
        wbc: toNumberOrThrow(formData.wbc || 0, "wbc"),
        platelets: toNumberOrThrow(formData.platelets || 0, "platelets"),
        cs: toNumberOrThrow(formData.cs || 0, "cs"),
        cholesterol: toNumberOrThrow(formData.cholesterol || 0, "cholesterol"),
        crp: toNumberOrThrow(formData.crp || 0, "crp"),
        esr: toNumberOrThrow(formData.esr || 0, "esr"),
        rf: toNumberOrThrow(formData.rf || 0, "rf"),
        fbc: toNumberOrThrow(formData.fbc || 0, "fbc"),

        ...activity,

        BMI: toNumberOrThrow(computedBMI || 0, "BMI")
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, name, type = "number", disabled = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none
          ${disabled ? "bg-gray-100 border-gray-200 text-gray-600" : "border-gray-300"}`}
      />
    </div>
  );

  const renderSelect = (label, name, options) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">KOA Prediction </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-6 rounded-xl shadow-md">
        {/* DEMOGRAPHICS */}
        {renderInput("Age", "age")}
        {renderSelect("Gender", "gender", ["Male", "Female"])}

        {renderInput("Height (cm)", "height_cm")}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (meters - auto)</label>
          <input
            type="text"
            value={height_m === "" ? "" : String(height_m)}
            disabled
            className="w-full rounded-lg border px-3 py-2 bg-gray-100 border-gray-200 text-gray-600"
          />
        </div>

        {renderInput("Weight (kg)", "weight")}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BMI (auto)</label>
          <input
            type="text"
            value={computedBMI}
            disabled
            className="w-full rounded-lg border px-3 py-2 bg-gray-100 border-gray-200 text-gray-600"
          />
        </div>

        {renderSelect("Occupation (in dataset)", "occupation", ["Yes", "No"])}

        {renderSelect("Physical Activity Level", "physical_activity_level", ["High", "Moderate", "Low"])}

        {renderSelect("Living Environment", "living_environment", ["Urban", "Rural"])}

        {/* SYMPTOMS */}
        {renderSelect("Knee Pain", "knee_pain", ["Yes", "No"])}
        {renderInput("Knee Pain (Past Week 0–5)", "knee_pain_in_past_week")}
        {renderSelect("Stiffness After Resting", "stifness_after_resting", ["always", "frequently", "never", "occasionally"])}
        {renderSelect("Knee Injuries", "knee_injuries", ["Yes", "No"])}
        {renderSelect("Swelling", "swelling", ["Yes", "No"])}
        {renderSelect("Difficulty in Performing", "difficulty_in_performing", ["none", "mild", "moderate", "severe"])}

        {/* HISTORY */}
        {renderSelect("Family History", "family_history", ["Yes", "No"])}
        {renderSelect("Obesity", "obesity", ["Yes", "No"])}
        {renderSelect("Diabetes", "diabetes", ["Yes", "No"])}
        {renderSelect("Hypertension", "hypertension", ["Yes", "No"])}
        {renderSelect("Vitamin D Deficiency", "vitaminD_deficiency", ["Yes", "No"])}
        {renderSelect("Rheumatoid Arthritis", "rheumatoid_arthritis", ["Yes", "No"])}

        {/* LABS (numeric like your training) */}
        {renderInput("FBS", "fbs")}
        {renderInput("WBC", "wbc")}
        {renderInput("Platelets", "platelets")}
        {renderInput("CS", "cs")}
        {renderInput("Cholesterol", "cholesterol")}
        {renderInput("CRP", "crp")}
        {renderInput("ESR", "esr")}
        {renderInput("RF", "rf")}
        {renderInput("FBC (numeric lab value)", "fbc")}

        <div className="md:col-span-3 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60"
          >
            {loading ? "Predicting..." : "Predict KOA"}
          </button>
        </div>
      </form>

      {error && <div className="mt-4 text-red-600 font-medium">❌ {error}</div>}

      {result && (
        <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Prediction Result</h3>
          <p><b>Model:</b> {result.model}</p>
          <p><b>Prediction:</b> {result.prediction}</p>
          {result.confidence !== null && result.confidence !== undefined && (
            <p><b>Confidence:</b> {(Number(result.confidence) * 100).toFixed(2)}%</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KOAPredictForm;
