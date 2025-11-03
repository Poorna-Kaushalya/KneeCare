import { useState, useEffect } from "react";
import api from "../api/api"; 

function FormEntry() {
  const [collecting, setCollecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [features, setFeatures] = useState(null);
  const [formData, setFormData] = useState({
    knee_condition: "",
    severity_level: "",
    treatment_advised: "",
    notes: "",
  });

  const deviceId = "KOA360-001";

  // Countdown timer effect
  useEffect(() => {
    if (!collecting || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [collecting, timeLeft]);

  // When timer reaches zero → fetch features
  useEffect(() => {
    if (collecting && timeLeft === 0) {
      setCollecting(false);
      fetchFeatures();
    }
  }, [timeLeft, collecting]);

  // === Handlers ===
  const startCollection = () => {
    setFeatures(null);
    setCollecting(true);
    setTimeLeft(5 * 60); // 5 minutes (in seconds)
  };

  const fetchFeatures = async () => {
    try {
      const res = await api.get("/api/features", { params: { device_id: deviceId } });
      if (res.data.ok && res.data.hasData) {
        setFeatures(res.data);
      } else {
        alert("No sensor data found in last 5 minutes.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch features.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!features) {
      alert("Please collect data first!");
      return;
    }

    try {
      const res = await api.post("/api/formdata", {
        device_id: deviceId,
        ...features,
        knee_condition: formData.knee_condition,
        severity_level: formData.severity_level,
        treatment_advised: formData.treatment_advised,
        notes: formData.notes,
      });
      alert("✅ Form data saved successfully!");
      setFormData({ knee_condition: "", severity_level: "", treatment_advised: "", notes: "" });
      setFeatures(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save form data.");
    }
  };

  // === UI ===
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Sensor Form (5-Minute Data)</h1>

      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={startCollection}
          disabled={collecting}
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            collecting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {collecting ? "Collecting..." : "Start 5-Minute Collection"}
        </button>

        {collecting && (
          <div className="text-xl font-semibold text-blue-700">
            ⏳ Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>
        )}
      </div>

      {!collecting && features && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Auto-filled Sensor Data</h2>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>Window Start: <b>{new Date(features.windowStart).toLocaleString()}</b></div>
            <div>Window End: <b>{new Date(features.windowEnd).toLocaleString()}</b></div>
            <div>Sample Rate (Hz): <b>{features.sampleRateHz}</b></div>
            <div>RMS Amplitude: <b>{features.rms_amplitude.toFixed(4)}</b></div>
            <div>Peak Frequency (Hz): <b>{features.peak_frequency}</b></div>
            <div>Mean Frequency (Hz): <b>{features.mean_frequency}</b></div>
            <div>Spectral Entropy: <b>{features.spectral_entropy}</b></div>
            <div>Zero Crossing Rate: <b>{features.zero_crossing_rate}</b></div>
          </div>

          <h2 className="text-xl font-bold text-gray-700 mt-6">Clinical Selections</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Knee Condition</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.knee_condition}
                onChange={(e) => setFormData({ ...formData, knee_condition: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="normal">Normal</option>
                <option value="osteoarthritis">Osteoarthritis</option>
                <option value="ligament_injury">Ligament Injury</option>
              </select>
            </div>

            <div>
              <label className="font-semibold">Severity Level</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.severity_level}
                onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="None">None</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>

            <div>
              <label className="font-semibold">Treatment Advised</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.treatment_advised}
                onChange={(e) => setFormData({ ...formData, treatment_advised: e.target.value })}
                required
              >
                <option value="">Select</option>
                <option value="No Treatment">No Treatment</option>
                <option value="Physiotherapy">Physiotherapy</option>
                <option value="Surgery">Surgery</option>
              </select>
            </div>

            <div>
              <label className="font-semibold">Notes (optional)</label>
              <textarea
                className="w-full border rounded-lg p-2"
                placeholder="Any observations..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Save Form Data
          </button>
        </form>
      )}
    </div>
  );
}

export default FormEntry;
