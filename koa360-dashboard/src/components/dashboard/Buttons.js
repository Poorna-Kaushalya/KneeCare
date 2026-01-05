import { useNavigate } from "react-router-dom";

import clinicalBg from "../../images/clinic.jpg";
import xrayBg from "../../images/xray.jpg";
import fusionBg from "../../images/fusion.jpg";
import sensorBg from "../../images/sensor.jpg";

function PredictionCard({ image, title, subtitle, onClick, disabled }) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative h-20 rounded-2xl shadow-md transition
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"}`}
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center">
        <div className="mt-0 font-extrabold text-lg drop-shadow">{title}</div>
        <div className="text-sm opacity-90 drop-shadow">{subtitle}</div>
      </div>
    </div>
  );
}

export default function PredictionButtons({
  patientId,
  deviceId,
  disabled,
  onXrayClick, // ✅ new prop
}) {
  const navigate = useNavigate();

  const go = (path) => {
    if (disabled) return;

    const qs = new URLSearchParams({
      patientId: patientId || "",
      deviceId: deviceId || "",
    }).toString();

    navigate(`${path}?${qs}`);
  };

  return (
    <div className="mt-16 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PredictionCard
          image={clinicalBg}
          title="Clinical"
          subtitle="Data Prediction"
          onClick={() => go("/koa-predict/clinical")}
          disabled={disabled}
        />

        <PredictionCard
          image={xrayBg}
          title="X-ray"
          subtitle="Prediction"
          onClick={() => (onXrayClick ? onXrayClick() : go("/koa-predict/xray"))}
          disabled={disabled}
        />

        <PredictionCard
          image={fusionBg}
          title="Fusion"
          subtitle="AI Model"
          onClick={() => go("/koa-predict/combined")}
          disabled={disabled}
        />

        <PredictionCard
          image={sensorBg}
          title="Sensor"
          subtitle="Prediction"
          onClick={() => go("/form")}
          disabled={disabled}
        />
      </div>

      {disabled && (
        <p className="mt-3 text-xs text-slate-500 text-center">
          Select a patient to enable prediction modules
        </p>
      )}
    </div>
  );
}
