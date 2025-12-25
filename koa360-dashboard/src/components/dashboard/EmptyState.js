import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";

export default function EmptyState() {
  const card = "bg-white border border-slate-200 rounded-2xl shadow-sm";

  return (
    <div className={`${card} p-8 md:p-10 relative top-16`}>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
          <FontAwesomeIcon icon={faChartLine} className="text-3xl" />
        </div>
        <h2 className="text-2xl font-extrabold mb-2">
          Select a patient to display data
        </h2>
        <p className="text-slate-600 max-w-xl">
          Use the patient list on the left to choose a patient. Once selected,
          you’ll see motion, angle, temperature, and VAG charts.
        </p>
      </div>
    </div>
  );
}
