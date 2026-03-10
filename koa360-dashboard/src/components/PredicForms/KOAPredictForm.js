import { useMemo, useState, useCallback, useEffect } from "react";
import api from "../../api/api";

/** Required fields per tab */
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

/** Display label mapping (Normal / Osteoarthritis) */
function displayDiagnosis(pred) {
  const v = String(pred ?? "").trim().toUpperCase();

  if (v === "0") return "Normal";
  if (v === "1") return "Osteoarthritis";

  if (v === "KL0") return "Normal";
  if (["KL1", "KL2", "KL3", "KL4"].includes(v)) return "Osteoarthritis";

  if (["2", "3", "4"].includes(v)) return "Osteoarthritis";
  if (v === "1") return "Osteoarthritis";

  return String(pred ?? "");
}

/** Optional severity name */
function displaySeverity(pred) {
  const v = String(pred ?? "").trim().toUpperCase();
  const map = {
    "0": "Normal",
    "1": "Doubtful",
    "2": "Mild",
    "3": "Moderate",
    "4": "Severe",
    KL0: "Normal",
    KL1: "Doubtful",
    KL2: "Mild",
    KL3: "Moderate",
    KL4: "Severe",
  };
  return map[v] || String(pred ?? "");
}

export default function KOAPredictForm({
  patientId = "",
  patientName = "",
  deviceId = "",
  onSaved,
}) {
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
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  /** =========================
   * Fetch patient data from DB
   * ========================= */
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;

      setFetchingPatient(true);
      try {
        const res = await api.get(`/api/patients/${patientId}`);
        const p = res.data;

        setFormData((prev) => ({
          ...prev,

          // tab 0
          age: p?.age ?? "",
          gender: p?.gender || "Male",
          height_cm: p?.heightCm ?? "",
          weight: p?.weightKg ?? "",

          // keep defaults if not in DB
          occupation: prev.occupation || "Yes",
          physical_activity_level: prev.physical_activity_level || "Moderate",
          living_environment: prev.living_environment || "Urban",

          // tab 1
          knee_injuries:
            p?.previousKneeInjury === true
              ? "Yes"
              : p?.previousKneeInjury === false
              ? "No"
              : prev.knee_injuries,

          // not available in schema, keep current/defaults
          knee_pain: prev.knee_pain,
          knee_pain_in_past_week: prev.knee_pain_in_past_week,
          stifness_after_resting: prev.stifness_after_resting,
          difficulty_in_performing: prev.difficulty_in_performing,
          swelling: prev.swelling,
          family_history: prev.family_history,
          obesity: prev.obesity,
          diabetes: prev.diabetes,
          hypertension: prev.hypertension,
          vitaminD_deficiency: prev.vitaminD_deficiency,
          rheumatoid_arthritis: prev.rheumatoid_arthritis,

          // tab 2
          fbs: p?.fbs ?? "",
          wbc: p?.wbc ?? "",
          platelets: p?.platelets ?? "",
          cs: p?.sugar ?? "", // form cs -> db sugar
          cholesterol: p?.cholesterol ?? "",
          crp: p?.crp ?? "",
          esr: p?.esr ?? "",
          rf: p?.rf ?? "",
          fbc: p?.fbcValue ?? "",
        }));
      } catch (err) {
        console.error("Error fetching patient form data:", err);
      } finally {
        setFetchingPatient(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

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

  // ===== Encoders =====
  const mapGender = (v) => (v === "Male" ? 1 : 0);
  const mapYesNo = (v) => (v === "Yes" ? 1 : 0);
  const mapLiving = (v) => (v === "Urban" ? 1 : 0);

  const mapStiffness = (v) => {
    const val = String(v).toLowerCase();
    const map = { always: 0, frequently: 1, never: 2, occasionally: 3 };
    return map[val] ?? 2;
  };

  const mapDifficulty = (v) => {
    const val = String(v).toLowerCase();
    const map = { mild: 0, moderate: 1, none: 2, severe: 3 };
    return map[val] ?? 2;
  };

  const makeActivityDummies = (level) => ({
    physical_activity_level_Low: level === "Low" ? 1 : 0,
    physical_activity_level_Moderate: level === "Moderate" ? 1 : 0,
  });

  // ===== Validation =====
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

  /** =========================
   * Save updated patient values
   * ========================= */
  const updatePatientData = async (predictionResult) => {
    if (!patientId) return null;

    const severityToSave =
      predictionResult?.severity ||
      predictionResult?.diagnosis ||
      "";

    const payload = {
      age: formData.age !== "" ? Number(formData.age) : undefined,
      gender: formData.gender,
      device_id: deviceId || undefined,

      // medical/basic fields mapped to schema
      heightCm: formData.height_cm !== "" ? Number(formData.height_cm) : undefined,
      weightKg: formData.weight !== "" ? Number(formData.weight) : undefined,
      previousKneeInjury: formData.knee_injuries === "Yes",
      crp: formData.crp !== "" ? Number(formData.crp) : undefined,
      esr: formData.esr !== "" ? Number(formData.esr) : undefined,
      rf: formData.rf !== "" ? Number(formData.rf) : undefined,
      cholesterol:
        formData.cholesterol !== "" ? Number(formData.cholesterol) : undefined,
      wbc: formData.wbc !== "" ? Number(formData.wbc) : undefined,
      platelets:
        formData.platelets !== "" ? Number(formData.platelets) : undefined,
      fbs: formData.fbs !== "" ? Number(formData.fbs) : undefined,
      sugar: formData.cs !== "" ? Number(formData.cs) : undefined, // cs -> sugar
      fbcValue: formData.fbc !== "" ? Number(formData.fbc) : undefined,
      severityLevel: severityToSave || undefined,
    };

    const res = await api.put(`/api/patients/${patientId}`, payload);
    return res.data;
  };

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

      for (const [k, v] of Object.entries(features)) {
        if (!Number.isFinite(v)) {
          throw new Error(`Invalid value for ${k}. Please check your inputs.`);
        }
      }

      // 1) prediction
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, patientName, deviceId, features }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");

      const rawPred =
        data?.prediction ??
        data?.pred ??
        data?.result ??
        data?.class ??
        data?.label;

      const finalResult = {
        ...data,
        _rawPred: rawPred,
        diagnosis: displayDiagnosis(rawPred),
        severity: displaySeverity(rawPred),
      };

      setResult(finalResult);

      // 2) auto save latest form values to patient
      const updatedPatient = await updatePatientData(finalResult);

      if (typeof onSaved === "function") {
        onSaved(updatedPatient || finalResult);
      }
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
          {/* Patient info */}
          <div className="px-4 pt-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoBox label="Patient ID" value={patientId || "-"} />
                <InfoBox label="Patient Name" value={patientName || "-"} />
                <InfoBox label="Device ID" value={deviceId || "-"} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex sticky top-0 bg-white mt-3">
            <TabButton index={0} label="Personal & Lifestyle" />
            <TabButton index={1} label="Symptoms & History" />
            <TabButton index={2} label="Clinical Markers" />
          </div>

          <form onSubmit={handleSubmit} className="p-4">
            {fetchingPatient && (
              <div className="mb-4 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-700 font-medium">
                Loading patient data...
              </div>
            )}

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
                className="w-full md:w-56 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!allTabsComplete ? "Complete all tabs to enable prediction" : ""}
              >
                {loading ? "Analyzing + Saving..." : "Generate Prediction"}
              </button>

              {activeTab < 2 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="mt-1 text-blue-600 text-sm font-medium hover:underline"
                >
                  Next Section →
                </button>
              )}

              {!allTabsComplete && (
                <div className="mt-1 text-xs text-slate-500 text-center">
                  Fill all required fields in <b>all tabs</b> to enable prediction.
                </div>
              )}
            </div>

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

                    <p className="text-slate-700 mt-1">
                      Patient Name:{" "}
                      <span className="font-extrabold">{patientName || "-"}</span>
                    </p>
                    <p className="text-slate-700">
                      Patient ID:{" "}
                      <span className="font-extrabold">{patientId || "-"}</span>
                    </p>

                    <p className="text-blue-700 mt-2">
                      Diagnosis:{" "}
                      <span className="font-extrabold">{result.diagnosis}</span>
                    </p>

                    <p className="text-blue-700">
                      Severity:{" "}
                      <span className="font-extrabold">{result.severity}</span>
                    </p>

                    <p className="text-emerald-700 text-sm font-semibold mt-2">
                      Patient record updated successfully.
                    </p>
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
        {label}
      </p>
      <p className="text-sm font-extrabold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

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