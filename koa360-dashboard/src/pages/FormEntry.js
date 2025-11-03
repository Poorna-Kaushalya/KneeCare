import { useEffect, useRef, useState } from "react";
import api from "../api/api";                // ✅ your axios instance
import SignInNavbar from "../components/SignInNavbar"; // optional, remove if not needed

function FormEntry({ logout }) {
  const DEFAULT_DEVICE = "KOA360-001";

  // device + session state
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE);
  const [isCollecting, setIsCollecting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  // computed features
  const [features, setFeatures] = useState({
    windowStart: "",
    windowEnd: "",
    sampleRateHz: "",
    rms_amplitude: "",
    peak_frequency: "",
    mean_frequency: "",
    spectral_entropy: "",
    zero_crossing_rate: "",
  });

  // clinical form
  const [form, setForm] = useState({
    knee_condition: "",
    severity_level: "",
    treatment_advised: "",
    notes: "",
  });

  // countdown effect
  useEffect(() => {
    if (!isCollecting) return;

    if (secondsLeft <= 0) {
      clearInterval(timerRef.current);
      setIsCollecting(false);
      fetchFeatures(); // after 5 mins, pull features
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isCollecting, secondsLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  // start 5-min session
  const startCollection = () => {
    if (isCollecting) return;
    // clear visible features while collecting
    setFeatures({
      windowStart: "",
      windowEnd: "",
      sampleRateHz: "",
      rms_amplitude: "",
      peak_frequency: "",
      mean_frequency: "",
      spectral_entropy: "",
      zero_crossing_rate: "",
    });
    setSecondsLeft(300); // 5 minutes
    setIsCollecting(true);
  };

  const cancelCollection = () => {
    clearInterval(timerRef.current);
    setIsCollecting(false);
    setSecondsLeft(0);
    // keep form inputs; features remain blank
  };

  const fetchFeatures = async () => {
    try {
      const res = await api.get(`/api/features`, {
        params: { device_id: deviceId },
      });
      const d = res.data;
      if (!d?.hasData) {
        alert("No raw data captured in the last 5 minutes. Try again.");
        return;
      }
      setFeatures({
        windowStart: new Date(d.windowStart).toLocaleString(),
        windowEnd: new Date(d.windowEnd).toLocaleString(),
        sampleRateHz: d.sampleRateHz ?? "",
        rms_amplitude: d.rms_amplitude ?? "",
        peak_frequency: d.peak_frequency ?? "",
        mean_frequency: d.mean_frequency ?? "",
        spectral_entropy: d.spectral_entropy ?? "",
        zero_crossing_rate: d.zero_crossing_rate ?? "",
      });
    } catch (err) {
      console.error("Failed to fetch features:", err);
      alert("Failed to fetch features. Please try again.");
    }
  };

  const saveFormData = async () => {
    if (isCollecting) {
      alert("Please wait until the collection finishes or cancel it.");
      return;
    }
    if (!features.windowStart || !features.windowEnd) {
      alert("No computed features available. Run a 5-minute collection first.");
      return;
    }
    if (!form.knee_condition || !form.severity_level || !form.treatment_advised) {
      alert("Please fill the clinical selections.");
      return;
    }
    try {
      const payload = {
        device_id: deviceId,
        // backend expects exact keys: windowStart/windowEnd/sampleRateHz + features
        windowStart: features.windowStart,
        windowEnd: features.windowEnd,
        sampleRateHz: features.sampleRateHz,
        rms_amplitude: features.rms_amplitude,
        peak_frequency: features.peak_frequency,
        spectral_entropy: features.spectral_entropy,
        zero_crossing_rate: features.zero_crossing_rate,
        mean_frequency: features.mean_frequency,
        // clinical
        knee_condition: form.knee_condition,
        severity_level: form.severity_level,
        treatment_advised: form.treatment_advised,
        notes: form.notes,
      };

      const res = await api.post("/api/formdata", payload);
      if (res.data?.ok) {
        alert("✅ Form data saved successfully!");
      } else {
        alert("❌ Failed to save form data.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save form data.");
    }
  };

  return (
    <div>
      {/* Optional top navbar */}
      <SignInNavbar logout={logout} /><br/><br/><br/><br/><br/><br/>

      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">
          Sensor Form (5-Minute Data)
        </h2>

        {/* Device + Start controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Device ID
            </label>
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={isCollecting}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={startCollection}
              disabled={isCollecting}
              className={`w-full px-4 py-3 rounded-lg font-semibold text-white ${
                isCollecting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              ▶ Start 5-Minute Collection
            </button>
          </div>
        </div>

        {/* Computed (auto-filled) */}
        <fieldset className="border p-4 rounded-lg mb-6" disabled={isCollecting}>
          <legend className="text-lg font-semibold text-gray-800">
           Computed Sensor Features
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Window Start" value={features.windowStart} />
            <InfoRow label="Window End" value={features.windowEnd} />
            <InfoRow label="Sample Rate (Hz)" value={features.sampleRateHz} />
            <InfoRow label="RMS Amplitude" value={features.rms_amplitude} />
            <InfoRow label="Peak Frequency (Hz)" value={features.peak_frequency} />
            <InfoRow label="Mean Frequency (Hz)" value={features.mean_frequency} />
            <InfoRow label="Spectral Entropy (0–1)" value={features.spectral_entropy} />
            <InfoRow label="Zero Crossing Rate (/s)" value={features.zero_crossing_rate} />
          </div>
        </fieldset>

        {/* Clinical selections */}
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Clinical Inputs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Knee Condition
            </label>
            <select
              value={form.knee_condition}
              onChange={(e) => setForm({ ...form, knee_condition: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              disabled={isCollecting}
            >
              <option value="">Select</option>
              <option value="normal">Normal</option>
              <option value="osteoarthritis">Osteoarthritis</option>
              <option value="ligament_injury">Ligament Injury</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Severity Level
            </label>
            <select
              value={form.severity_level}
              onChange={(e) => setForm({ ...form, severity_level: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              disabled={isCollecting}
            >
              <option value="">Select</option>
              <option value="None">None</option>
              <option value="Mild">Mild</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Treatment Advised
            </label>
            <select
              value={form.treatment_advised}
              onChange={(e) => setForm({ ...form, treatment_advised: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              disabled={isCollecting}
            >
              <option value="">Select</option>
              <option value="No Treatment">No Treatment</option>
              <option value="Physiotherapy">Physiotherapy</option>
              <option value="Surgery">Surgery</option>
            </select>
          </div>
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full border rounded-lg p-3 mb-6"
          rows={3}
          placeholder="Any observations..."
          disabled={isCollecting}
        />

        <button
          onClick={saveFormData}
          disabled={isCollecting}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-60"
        >
          💾 Save Form Data
        </button>
      </div>

      {/* Overlay during collection */}
      {isCollecting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-[90%] max-w-md text-center">
            <h4 className="text-xl font-bold mb-2 text-blue-700">Collecting 5-Minute Window</h4>
            <p className="text-gray-600 mb-6">Please wait while the device streams raw data.</p>
            <div className="text-5xl font-mono font-bold mb-6">{formatTime(secondsLeft)}</div>
            <div className="flex gap-3 justify-center">
              <button
                className="px-5 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 font-semibold"
                onClick={cancelCollection}
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              Tip: Keep the device steady or perform the instructed movement during the window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-mono">{String(value || "")}</span>
    </div>
  );
}

export default FormEntry;
