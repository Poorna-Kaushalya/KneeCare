import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoePrints,
  faCloudSun,
  faHeartbeat,
} from "@fortawesome/free-solid-svg-icons";

export default function HeaderKpis({
  rangeOptions,
  dataRange,
  setDataRange,
  steps,
  envTemp,
  severity,
}) {
  const chip =
    "bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm flex items-center gap-2";

  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 relative top-16">

      <div className="flex flex-wrap gap-2">
        <div className={chip}>
          <span className="text-xs font-bold text-slate-500">Period</span>
          <div className="flex gap-1">
            {rangeOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => setDataRange(o.value)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition ${
                  dataRange === o.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className={chip}>
          <FontAwesomeIcon icon={faShoePrints} className="text-blue-600" />
          <span className="text-sm">
            Steps: <span className="font-extrabold">{steps}</span>
          </span>
        </div>

        <div className={chip}>
          <FontAwesomeIcon icon={faCloudSun} className="text-amber-500" />
          <span className="text-sm">
            Temp: <span className="font-extrabold">{envTemp.toFixed(2)}°C</span>
          </span>
        </div>

        <div className={chip}>
          <FontAwesomeIcon icon={faHeartbeat} className="text-rose-500" />
          <span className="text-sm">
            Severity:{" "}
            <span className="font-extrabold text-rose-700">{severity || "N/A"}</span>
          </span>
        </div>

      </div>
    </div>
  );
}
