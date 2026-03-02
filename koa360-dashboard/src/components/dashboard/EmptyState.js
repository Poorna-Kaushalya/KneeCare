import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine, faUserCheck } from "@fortawesome/free-solid-svg-icons";

export default function EmptyState() {
  return (
    <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-10">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center text-sky-700 mb-4">
          <FontAwesomeIcon icon={faChartLine} className="text-3xl" />
        </div>

        <h2 className="text-xl font-extrabold mb-2 text-slate-900">
          Select a patient to view KOA monitoring
        </h2>

        <p className="text-slate-600 max-w-xl text-sm">
          Choose a patient from the left panel. You will see motion, angle,
          temperature and PLOS analytics.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-100 text-sky-800 text-sm font-extrabold">
          <FontAwesomeIcon icon={faUserCheck} />
          Ready for doctor review
        </div>
      </div>
    </div>
  );
}