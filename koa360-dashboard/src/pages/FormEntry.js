import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Play, Clock, Cpu, ActivitySquare, Wifi, Save } from "lucide-react";
import api from "../api/api";
import SignInNavbar from "../components/SignInNavbar";
import formbg from "../images/formbg.png";

function FormEntry({ logout }) {
  const DEFAULT_DEVICE = "KOA360-001";
  const WINDOW_SECONDS = 300;

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
    temperature: "",
  });

  // clinical form (notes removed)
  const [form, setForm] = useState({
    knee_condition: "",
    severity_level: "",
    treatment_advised: "",
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
      temperature: "",
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
        temperature: d.temperature ?? "",
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
      fetchFeatures();
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
        temperature: features.temperature,
        knee_condition: form.knee_condition,
        severity_level: form.severity_level,
        treatment_advised: form.treatment_advised,
      };

      const res = await api.post("/api/formdata", payload);
      if (res.data?.ok) alert("✅ Form data saved successfully!");
      else alert("❌ Failed to save form data.");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save form data.");
    }
  };

  // design classes (no layout/width changes)
  const pageOverlay =
    "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:via-white/20 before:to-blue-50/30 before:backdrop-blur-[1px] before:content-['']";
  const glassCard =
    "bg-white/75 backdrop-blur-md rounded-2xl shadow-lg border border-blue-200/70";
  const sectionTitle = "text-xl font-extrabold text-blue-700 tracking-tight";
  const subText = "text-xs text-slate-500";
  const inputBase =
    "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition";
  const selectBase =
    "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition";

  return (
    <div
      className={`h-screen overflow-hidden bg-fixed bg-cover bg-center relative ${pageOverlay}`}
      style={{ backgroundImage: `url(${formbg})` }}
    >
      <SignInNavbar logout={logout} />

      {/* spacer for fixed navbar (prevents hidden top) */}
      <div className="h-[88px]" />

      {/* KEEP YOUR WIDTH + GRID EXACTLY (no card width changes) */}
      <main className="w-full max-w-none px-4 sm:px-6 lg:px-20 pt-4 pb-6 overflow-hidden relative">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sensor Collection & Clinical Form
          </h1>
        </div>

        <div className="grid grid-cols-1 md:[grid-template-columns:25%_74%] gap-4">
          {/* LEFT: Data Collection Panel */}
          <section className={`${glassCard} p-6`}>
            <header className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 grid place-items-center">
                  <ActivitySquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className={sectionTitle}>Data Collection</h2>
                  <p className={subText}>5-minute rolling window</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isCollecting
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {isCollecting ? "Collecting…" : "Idle"}
              </span>
            </header>

            {/* Device + network */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <Stat
                label="Device"
                value={deviceId}
                icon={<Cpu className="w-4 h-4" />}
              />
              <Stat
                label="Status"
                value={isCollecting ? "Collecting…" : "Idle"}
                icon={
                  <Wifi
                    className={`w-6 h-6 ${
                      isCollecting ? "text-green-600" : "text-slate-700"
                    }`}
                    strokeWidth={2.5}
                  />
                }
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button
                onClick={startCollection}
                disabled={isCollecting}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-white text-sm transition ${
                  isCollecting
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md"
                }`}
              >
                <Play className="w-4 h-4" />
                Start
              </button>

              <button
                onClick={cancelCollection}
                disabled={!isCollecting}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition ${
                  !isCollecting
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-100 hover:bg-slate-200 text-red-600 border border-red-200"
                }`}
              >
                Cancel
              </button>
            </div>

            {/* Timer + circular progress */}
            <div className="flex items-center justify-center mb-4">
              <CircleProgress
                value={progressPct}
                size={160}
                stroke={14}
                color={isCollecting ? "text-blue-600" : "text-slate-400"}
                bg="text-slate-300"
                label={
                  <div className="text-center">
                    <div className="font-mono text-2xl font-extrabold text-slate-900">
                      {isCollecting ? formatTime(secondsLeft) : "00:00"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1 font-bold">
                      <Clock className="w-4 h-4" /> {Math.round(progressPct)}%
                    </div>
                  </div>
                }
              />
            </div>

            {/* Tip */}
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
              <p className="text-xs text-blue-800">
                <b>Tip:</b> Keep the device steady or perform the instructed
                movement during the window. Ensure the device clock is synced to
                avoid timing drift.
              </p>
            </div>
          </section>

          {/* RIGHT: Clinical Form */}
          <section className={`${glassCard} p-6`}>
            {/* Title row + READY + SAVE (top right) */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className={sectionTitle}>Clinical Form</h2>
                <p className={subText}>
                  Fields marked{" "}
                  <span className="text-rose-600 font-bold">*</span> are required
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isCollecting
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {isCollecting ? "Collecting…" : "Ready"}
                </span>

                <button
                  onClick={saveFormData}
                  disabled={isCollecting}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-extrabold transition ${
                    isCollecting
                      ? "bg-emerald-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-md"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Device entry */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Device ID
              </label>
              <input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className={inputBase}
                disabled={isCollecting}
              />
            </div>

            {/* Computed (read-only) */}
            <fieldset
              className="border border-slate-200 bg-white/60 rounded-2xl mb-6 p-4"
              disabled={isCollecting}
            >
              <legend className="px-2 text-sm font-extrabold text-slate-800">
                Computed Sensor Features
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 mt-2">
                <InfoRow label="Window Start" value={features.windowStart} />
                <InfoRow label="Window End" value={features.windowEnd} />
                <InfoRow label="Sample Rate (Hz) *" value={features.sampleRateHz} />
                <InfoRow label="RMS Amplitude" value={features.rms_amplitude} />
                <InfoRow label="Peak Frequency (Hz)" value={features.peak_frequency} />
                <InfoRow label="Mean Frequency (Hz)" value={features.mean_frequency} />
                <InfoRow label="Spectral Entropy (0–1)" value={features.spectral_entropy} />
                <InfoRow label="Zero Crossing Rate (/s)" value={features.zero_crossing_rate} />
                <InfoRow label="Temperature (°C)" value={features.temperature ?? "N/A"} />
              </div>
            </fieldset>

            {/* Clinical selections */}
            <div className="mb-2">
              <h3 className="text-sm font-extrabold text-slate-700">
                Clinical Inputs
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 text-sm">
              <Select
                label="Knee Condition *"
                value={form.knee_condition}
                onChange={(v) => setForm({ ...form, knee_condition: v })}
                options={[
                  ["", "Select"],
                  ["normal", "Normal"],
                  ["osteoarthritis", "Osteoarthritis"],
                  ["ligament_injury", "Ligament Injury"],
                ]}
                disabled={isCollecting}
                className={selectBase}
              />
              <Select
                label="Severity Level *"
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
                className={selectBase}
              />
              <Select
                label="Treatment Advised *"
                value={form.treatment_advised}
                onChange={(v) => setForm({ ...form, treatment_advised: v })}
                options={[
                  ["", "Select"],
                  ["No Treatment", "No Treatment"],
                  ["Physiotherapy", "Physiotherapy"],
                  ["Surgery", "Surgery"],
                ]}
                disabled={isCollecting}
                className={selectBase}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* --- Reusable bits --- */

function Stat({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white/70 shadow-sm">
      <div className="text-slate-600">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
          {label}
        </div>
        <div className="text-sm font-extrabold text-slate-800">
          {String(value || "-")}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100">
      <span className="text-sm text-slate-600 font-semibold">{label}</span>
      <span className="text-sm font-mono text-slate-900">
        {String(value || "")}
      </span>
    </div>
  );
}

function Select({ label, value, onChange, options, disabled, className }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className || "w-full border rounded-lg px-3 py-2"}
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
  value = 0,
  size = 112,
  stroke = 10,
  color = "text-blue-600",
  bg = "text-gray-200",
  label,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * c;

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Collection progress ${Math.round(value)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={bg}
          strokeWidth={stroke}
          stroke="currentColor"
          opacity="0.28"
        />
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
      <div className="absolute inset-0 grid place-items-center">{label}</div>
    </div>
  );
}

export default FormEntry;
