import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEdit,
  faTrash,
  faUserDoctor,
  faPhone,
  faXmark,
  faCalendarDays,
  faVenusMars,
  faIdCard,
  faClipboardList,
  faFilePdf,
  faIdBadge,
} from "@fortawesome/free-solid-svg-icons";

import PatientReportModal from "./PatientReportModal";

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
  const [showReport, setShowReport] = useState(false);
  const hasSearch = searchTerm.trim().length > 0;

  const show = (v) => (v === undefined || v === null || v === "" ? "N/A" : v);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB");
  };

  const doctorName =
    selectedPatientDetails?.assignedDoctorName || selectedPatientDetails?.doctorName;

  const handleEditSelected = () => selectedPatientDetails && onEdit(selectedPatientDetails, "full");
  const handleDeleteSelected = () => selectedPatientDetails && onDelete(selectedPatientDetails);
  const handlePdfSelected = () => selectedPatientDetails && setShowReport(true);

  return (
    <div className="rounded-3xl border border-sky-100 bg-white shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          Patients
        </h2>

        {selectedPatientId && (
          <button
            onClick={onClear}
            className="text-xs font-extrabold px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-100 transition flex items-center gap-1 text-sky-800"
            title="Clear selection"
            type="button"
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
          className="w-full pl-10 pr-4 py-2 rounded-2xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white"
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
        type="button"
        className="w-full rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm py-2 flex items-center justify-center gap-2 transition shadow-sm"
      >
        <FontAwesomeIcon icon={faPlus} />
        Add New Patient
      </button>

      {/* List */}
      <div className="mt-3">
        <div className="text-xs text-slate-500 mb-2">
          Total: {patients.length}
          {hasSearch ? ` | Showing: ${filteredPatients.length}` : ""}
        </div>

        <div className="max-h-[420px] overflow-y-auto border border-sky-100 rounded-2xl bg-white">
          {!hasSearch ? (
            <div className="p-3 text-xs text-slate-500">
              Start typing to search patients.
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((p) => {
              const selected = selectedPatientId === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-3 border-b border-sky-50 flex items-center justify-between cursor-pointer transition
                    ${selected ? "bg-sky-50" : "hover:bg-sky-50/40"}`}
                  onClick={() => onSelect(p.id)}
                >
                  <div className="min-w-0">
                    <div className={`font-extrabold text-sm truncate ${selected ? "text-sky-700" : "text-slate-800"}`}>
                      {p.name || "Unknown Name"}
                    </div>
                    <div className="text-xs text-slate-500">ID: {p.id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(p, "full");
                      }}
                      className="w-9 h-9 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-100 transition flex items-center justify-center text-sky-700"
                      title="Edit Patient"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(p);
                      }}
                      className="w-9 h-9 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-100 transition flex items-center justify-center text-rose-700"
                      title="Delete Patient"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-sm text-slate-500">No matching patients.</div>
          )}
        </div>
      </div>

      {/* Selected patient quick view */}
      <div className="mt-4 p-4 rounded-3xl bg-gradient-to-br from-sky-50 to-emerald-50 border border-sky-100">
        <div className="text-center font-extrabold truncate text-slate-900">
          {selectedPatientDetails?.name || "No patient selected"}
        </div>

        {selectedPatientDetails ? (
          <>
            <div className="mt-3 text-sm text-slate-700 space-y-2">
              <Row icon={faIdCard} label="Patient ID" value={show(selectedPatientDetails.id)} />
              <Row icon={faClipboardList} label="Age" value={show(selectedPatientDetails.age)} />
              <Row icon={faVenusMars} label="Gender" value={show(selectedPatientDetails.gender)} />
              <Row icon={faPhone} label="Contact" value={show(selectedPatientDetails.contact)} iconClass="text-emerald-700" />

              <div className="pt-2">
                <div className="text-slate-700 text-center font-extrabold">
                  Clinical Data
                </div>
                <div className="h-px bg-sky-100 mt-2" />
              </div>

              <Row icon={faUserDoctor} label="Doctor" value={show(doctorName)} />
              <Row icon={faIdBadge} label="Reg No" value={show(selectedPatientDetails.doctorRegNo)} />
              <Row
                icon={faCalendarDays}
                label="Last Clinic"
                value={formatDate(selectedPatientDetails.lastClinicDate || selectedPatientDetails.lastClinic)}
              />
              <Row
                icon={faCalendarDays}
                label="Next Clinic"
                value={formatDate(selectedPatientDetails.nextClinicDate || selectedPatientDetails.nextClinic)}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleEditSelected}
                className="flex-1 px-3 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 transition flex items-center justify-center gap-2 text-white font-extrabold text-xs shadow-sm"
              >
                <FontAwesomeIcon icon={faEdit} />
                Edit
              </button>

              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex-1 px-3 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center gap-2 text-white font-extrabold text-xs shadow-sm"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </button>

              <button
                type="button"
                onClick={handlePdfSelected}
                className="flex-1 px-3 py-2 rounded-2xl bg-violet-600 hover:bg-violet-700 transition flex items-center justify-center gap-2 text-white font-extrabold text-xs shadow-sm"
              >
                <FontAwesomeIcon icon={faFilePdf} />
                PDF
              </button>
            </div>
          </>
        ) : (
          <div className="mt-3 text-sm text-slate-600 text-center">
            Pick a patient to start monitoring.
          </div>
        )}
      </div>

      <PatientReportModal
        open={showReport}
        details={selectedPatientDetails}
        formatDate={formatDate}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}

function Row({ icon, label, value, iconClass = "text-slate-500" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600 flex items-center gap-2">
        <FontAwesomeIcon icon={icon} className={iconClass} />
        {label}
      </span>
      <span className="font-extrabold text-slate-900">{value}</span>
    </div>
  );
}