import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoePrints,
  faCloudSun,
  faHeartbeat,
  faCircleDot,
} from "@fortawesome/free-solid-svg-icons";

const severityTone = (sev) => {
  const s = (sev || "").toLowerCase();
  if (s.includes("severe")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (s.includes("moderate")) return "bg-amber-50 text-amber-800 border-amber-200";
  if (s.includes("mild")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  return "bg-sky-50 text-sky-800 border-sky-200";
};

export default function HeaderKpis({
  rangeOptions,
  dataRange,
  setDataRange,
  steps,
  envTemp,
  severity,
}) {
  const chip =
    "bg-white/80 backdrop-blur border rounded-full px-3 py-1.5 shadow-sm flex items-center gap-2";

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-1 mt-1">
      <div className="flex flex-wrap gap-1">
        <div className={`${chip} border-sky-100`}>
          <span className="text-xs font-bold text-slate-500">Period</span>
          <div className="flex gap-1">
            {rangeOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => setDataRange(o.value)}
                type="button"
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition ${
                  dataRange === o.value
                    ? "bg-sky-600 text-white"
                    : "bg-sky-50 hover:bg-sky-100 text-sky-800"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${chip} border-sky-100`}>
          <FontAwesomeIcon icon={faShoePrints} className="text-sky-700" />
          <span className="text-sm">
            Steps: <span className="font-extrabold">{steps}</span>
          </span>
        </div>

        <div className={`${chip} border-emerald-100`}>
          <FontAwesomeIcon icon={faCloudSun} className="text-emerald-700" />
          <span className="text-sm">
            Temp:{" "}
            <span className="font-extrabold">
              {Number(envTemp || 0).toFixed(2)}°C
            </span>
          </span>
        </div>

        <div className={`${chip} ${severityTone(severity)}`}>
          <FontAwesomeIcon icon={faHeartbeat} />
          <span className="text-sm">
            Severity: <span className="font-extrabold">{severity || "N/A"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}