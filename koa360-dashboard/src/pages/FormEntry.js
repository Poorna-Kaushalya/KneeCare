import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Play, Clock, Cpu, ActivitySquare, Wifi, Save } from "lucide-react";
import api from "../api/api";
import SignInNavbar from "../components/SignInNavbar";

function FormEntry({ logout }) {
  const DEFAULT_DEVICE = "KOA360-001";
  const WINDOW_SECONDS = 300; // 5 minutes

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

  const progressPct = useMemo(() => {
    if (!isCollecting) return 0;
    return Math.max(
      0,
      Math.min(100, ((WINDOW_SECONDS - secondsLeft) / WINDOW_SECONDS) * 100)
    );
  }, [isCollecting, secondsLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  const resetFeatures = () =>
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

  // stable fetch to satisfy eslint deps
  const fetchFeatures = useCallback(async () => {
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
  }, [deviceId]);

  // countdown effect
  useEffect(() => {
    if (!isCollecting) return;

    if (secondsLeft <= 0) {
      clearInterval(timerRef.current);
      setIsCollecting(false);
      fetchFeatures(); // pull features after the window
      return;
    }

    timerRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [isCollecting, secondsLeft, fetchFeatures]);

  // controls
  const startCollection = () => {
    if (isCollecting) return;
    resetFeatures();
    setSecondsLeft(WINDOW_SECONDS);
    setIsCollecting(true);
  };

  const cancelCollection = () => {
    clearInterval(timerRef.current);
    setIsCollecting(false);
    setSecondsLeft(0);
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
    if (
      !form.knee_condition ||
      !form.severity_level ||
      !form.treatment_advised
    ) {
      alert("Please fill the clinical selections.");
      return;
    }
    try {
      const payload = {
        device_id: deviceId,
        windowStart: features.windowStart,
        windowEnd: features.windowEnd,
        sampleRateHz: features.sampleRateHz,
        rms_amplitude: features.rms_amplitude,
        peak_frequency: features.peak_frequency,
        spectral_entropy: features.spectral_entropy,
        zero_crossing_rate: features.zero_crossing_rate,
        mean_frequency: features.mean_frequency,
        knee_condition: form.knee_condition,
        severity_level: form.severity_level,
        treatment_advised: form.treatment_advised,
        notes: form.notes,
      };

      const res = await api.post("/api/formdata", payload);
      if (res.data?.ok) alert("✅ Form data saved successfully!");
      else alert("❌ Failed to save form data.");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save form data.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SignInNavbar logout={logout} /><br /><br /><br />

      <main className="w-full max-w-none px-4 sm:px-6 lg:px-20 pt-10 pb-8 mt-0">
        <div className="grid grid-cols-1 md:[grid-template-columns:25%_74%] gap-4">
          {/* LEFT: Data Collection Panel */}
          <section className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-blue-300 p-6 transition-shadow">
            <header className="flex items-center gap-3 mb-4">
              <ActivitySquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-700">
                Data Collection
              </h2>
            </header>

            {/* Device + network */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Stat
                label="Device"
                value={deviceId}
                icon={<Cpu className="w-4 h-4 text-sm" />}
              />
              <Stat
                label="Status"
                value={isCollecting ? "Collecting…" : "Idle"}
                icon={
                  <Wifi
                    className={`w-6 h-6 ${isCollecting ? "text-green-600" : "text-gray-900"
                      }`}
                    strokeWidth={2.5}
                  />
                }
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={startCollection}
                disabled={isCollecting}
                className={`inline-flex items-center justify-center gap-2 px-4 py-1 rounded-lg font-semibold text-white text-sm ${isCollecting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                <Play className="w-4 h-4" />
                Start
              </button>
              <button
                onClick={cancelCollection}
                disabled={!isCollecting}
                className="inline-flex items-center justify-center gap-4 px-16 py-1 rounded-lg font-bold bg-gray-200 hover:bg-gray-300 text-red-500"
              >
                Cancel
              </button>
            </div><br />

            {/* Timer + circular progress */}
            <div className="flex items-center justify-center mb-2">
              <CircleProgress
                value={progressPct}
                size={150}
                stroke={15}
                color={isCollecting ? "text-blue-600" : "text-gray-400"}
                bg="text-gray-300"
                label={
                  <div className="text-center">
                    <div className="font-mono text-xl font-bold">
                      {isCollecting ? formatTime(secondsLeft) : "00:00"}
                    </div>
                    <div className="text-[15px] text-gray-500 mt-0 flex items-center justify-center gap-1 text-bold">
                      <Clock className="w-4 h-4" /> {Math.round(progressPct)}%
                    </div>
                  </div>
                }
              />
            </div><br />

            {/* Tip */}
            <p className="text-xs text-gray-500 mt-4">
              Tip: Keep the device steady or perform the instructed movement
              during the window. Make sure the device clock is synced to avoid
              timing drift.
            </p>
          </section>

          {/* RIGHT: Clinical Form */}
          <section className="bg-white  shadow-lg hover:shadow-xl border border-blue-300 p-6 transition-shadow">
            <h2 className="text-xl font-bold text-blue-700 mb-4">
              Clinical Form
            </h2>

            {/* Device entry (mirrors left) */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Device ID
              </label>
              <input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                disabled={isCollecting}
              />
            </div>

            {/* Computed (read-only) */}
            <fieldset
              className="border p-4 rounded-lg mb-6 text-sm"
              disabled={isCollecting}
            >
              <legend className="text-sm font-semibold text-gray-800">
                Computed Sensor Features
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoRow label="Window Start" value={features.windowStart} />
                <InfoRow label="Window End" value={features.windowEnd} />
                <InfoRow
                  label="Sample Rate (Hz)"
                  value={features.sampleRateHz}
                />
                <InfoRow label="RMS Amplitude" value={features.rms_amplitude} />
                <InfoRow
                  label="Peak Frequency (Hz)"
                  value={features.peak_frequency}
                />
                <InfoRow
                  label="Mean Frequency (Hz)"
                  value={features.mean_frequency}
                />
                <InfoRow
                  label="Spectral Entropy (0–1)"
                  value={features.spectral_entropy}
                />
                <InfoRow
                  label="Zero Crossing Rate (/s)"
                  value={features.zero_crossing_rate}
                />
              </div>
            </fieldset>

            {/* Clinical selections */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Clinical Inputs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
              <Select
                label="Knee Condition"
                value={form.knee_condition}
                onChange={(v) => setForm({ ...form, knee_condition: v })}
                options={[
                  ["", "Select"],
                  ["normal", "Normal"],
                  ["osteoarthritis", "Osteoarthritis"],
                  ["ligament_injury", "Ligament Injury"],
                ]}
                disabled={isCollecting}
              />
              <Select
                label="Severity Level"
                value={form.severity_level}
                onChange={(v) => setForm({ ...form, severity_level: v })}
                options={[
                  ["", "Select"],
                  ["None", "None"],
                  ["Mild", "Mild"],
                  ["Moderate", "Moderate"],
                  ["Severe", "Severe"],
                ]}
                disabled={isCollecting}
              />
              <Select
                label="Treatment Advised"
                value={form.treatment_advised}
                onChange={(v) => setForm({ ...form, treatment_advised: v })}
                options={[
                  ["", "Select"],
                  ["No Treatment", "No Treatment"],
                  ["Physiotherapy", "Physiotherapy"],
                  ["Surgery", "Surgery"],
                ]}
                disabled={isCollecting}
              />
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg p-3 mb-2 text-sm"
              rows={2}
              placeholder="Any observations..."
              disabled={isCollecting}
            />

            <button
              onClick={saveFormData}
              disabled={isCollecting}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              Save Form Data
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

/* --- Reusable bits --- */

function Stat({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50">
      <div className="text-gray-600">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-gray-500">
          {label}
        </div>
        <div className="text-sm font-semibold">{String(value || "-")}</div>
      </div>
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

function Select({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        disabled={disabled}
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Circular progress ring */
function CircleProgress({
  value = 0,    // 0..100
  size = 112,  // px
  stroke = 10, // px
  color = "text-blue-600",
  bg = "text-gray-200",
  label,
}) {
  const r = (size - stroke) / 2; // radius
  const c = 2 * Math.PI * r;     // circumference
  const dash = Math.max(0, Math.min(100, value)) / 100 * c;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Collection progress ${Math.round(value)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={bg}
          strokeWidth={stroke}
          stroke="currentColor"
          opacity="0.3"
        />
        {/* progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - dash}
          stroke="currentColor"
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
      </svg>
      {/* center content */}
      <div className="absolute inset-0 grid place-items-center">{label}</div>
    </div>
  );
}

export default FormEntry;
