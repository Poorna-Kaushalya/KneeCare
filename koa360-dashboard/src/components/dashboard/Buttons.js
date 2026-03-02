import { useNavigate } from "react-router-dom";

const tone = {
  clinical: {
    ring: "hover:border-sky-200",
    bar: "bg-sky-500",
    iconBg: "bg-sky-50",
    icon: "text-sky-700",
    badge: "bg-sky-50 text-sky-700 border-sky-100",
  },
  xray: {
    ring: "hover:border-violet-200",
    bar: "bg-violet-500",
    iconBg: "bg-violet-50",
    icon: "text-violet-700",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
  },
  fusion: {
    ring: "hover:border-emerald-200",
    bar: "bg-emerald-500",
    iconBg: "bg-emerald-50",
    icon: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  sensor: {
    ring: "hover:border-amber-200",
    bar: "bg-amber-500",
    iconBg: "bg-amber-50",
    icon: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
  },
};

function ActionCard({ kind, badge, onClick, disabled }) {
  const t = tone[kind];

  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`group w-full rounded-2xl border bg-white p-3 text-left transition shadow-sm
        ${disabled ? "opacity-50 cursor-not-allowed" : `hover:-translate-y-[1px] hover:shadow-md ${t.ring}`}
        border-sky-100`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-1.5 h-7 rounded-full ${t.bar}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {badge && (
              <span className={`text-[14px] font-extrabold px-2 py-1 rounded-full border ${t.badge}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function PredictionButtons({
  patientId,
  deviceId,
  disabled,
  onXrayClick,
  onFusionClick,
  onClinicalClick,
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
    <div className="mb-1 relative -mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        <ActionCard
          kind="clinical"
          badge="Lab + History"
          onClick={() => (onClinicalClick ? onClinicalClick() : go("/koa-predict/clinical"))}
          disabled={disabled}
        />

        <ActionCard
          kind="xray"
          badge="Medical Images"
          onClick={() => (onXrayClick ? onXrayClick() : go("/koa-predict/xray"))}
          disabled={disabled}
        />

        <ActionCard
          kind="fusion"
          badge="Clinical + X-ray"
          onClick={() => (onFusionClick ? onFusionClick() : go("/koa-predict/combined"))}
          disabled={disabled}
        />

        <ActionCard
          kind="sensor"
          badge="Wearable Data"
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