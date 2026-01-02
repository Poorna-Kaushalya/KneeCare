import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEdit,
  faTrash,
  faUser,
  faMicrochip,
  faUserDoctor,
  faPhone,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function PatientsSidebar({
  patients,
  filteredPatients,
  searchTerm,
  setSearchTerm,
  selectedPatientId,
  onSelect,
  onClear,
  onAdd,
  onEdit,
  onDelete,
  selectedPatientDetails,
}) {
  const card = "bg-white border border-slate-200  shadow-sm";
  const iconBadge =
    "w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600";

  return (
    <div className={`${card} p-4 md:p-5 relative top-[60px]`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold tracking-tight">Patients</h2>

        {selectedPatientId && (
          <button
            onClick={onClear}
            className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1"
            title="Clear selection"
          >
            <FontAwesomeIcon icon={faXmark} />
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search by name, ID, device..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {/* Add */}
      <button
        onClick={onAdd}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-xl flex items-center justify-center gap-2 transition"
      >
        <FontAwesomeIcon icon={faPlus} />
        Add New Patient
      </button>

      {/* List */}
      <div className="mt-4">
        <div className="text-xs text-slate-500 mb-2">
          Total: {patients.length} {searchTerm ? `| Showing: ${filteredPatients.length}` : ""}
        </div>

        <div className="max-h-[420px] overflow-y-auto border border-slate-200 rounded-xl bg-white">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((p) => (
              <div
                key={p.id}
                className={`p-3 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition ${
                  selectedPatientId === p.id ? "bg-blue-50" : ""
                }`}
                onClick={() => onSelect(p.id)}
              >
                <div>
                  <div
                    className={`font-bold text-sm ${
                      selectedPatientId === p.id ? "text-blue-700" : "text-slate-800"
                    }`}
                  >
                    {p.name || "Unknown Name"}
                  </div>
                  <div className="text-xs text-slate-500">
                    ID: {p.id} {p.device_id ? `• Device: ${p.device_id}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(p, "full");
                    }}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-blue-600"
                    title="Edit Patient"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p);
                    }}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-red-600"
                    title="Delete Patient"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-slate-500">No matching patients.</div>
          )}
        </div>
      </div>

      {/* Selected mini info */}
      <div className="mt-4 p-4 rounded-2xl bg-slate-100 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className={iconBadge}>
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Selected</div>
            <div className="font-extrabold">{selectedPatientDetails?.name || "None"}</div>
          </div>
        </div>

        {selectedPatientDetails ? (
          <div className="mt-3 text-sm text-slate-700 space-y-1">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faMicrochip} className="text-slate-500" />
              <span className="text-slate-500">Id:</span>
              <span className="font-bold">{selectedPatientDetails.id || "N/A"}</span>
            </div>
            {selectedPatientDetails.contact && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="text-emerald-600" />
                <span className="text-slate-500">Contact:</span>
                <span className="font-bold">{selectedPatientDetails.contact}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUserDoctor} className="text-slate-500" />
              <span className="text-slate-500">Doctor:</span>
              <span className="font-bold">
                {selectedPatientDetails.assignedDoctorName || "N/A"}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-600">Pick a patient to start monitoring.</div>
        )}
      </div>
    </div>
  );
}
