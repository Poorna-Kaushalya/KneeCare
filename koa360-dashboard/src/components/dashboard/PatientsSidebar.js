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

  const card = "bg-white border border-slate-200 shadow-sm";
  const hasSearch = searchTerm.trim().length > 0;

  const show = (v) => (v === undefined || v === null || v === "" ? "N/A" : v);

  // Same style formatter as your PatientPanel
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB");
  };

  const doctorName =
    selectedPatientDetails?.assignedDoctorName ||
    selectedPatientDetails?.doctorName;

  const handleEditSelected = () => {
    if (!selectedPatientDetails) return;
    onEdit(selectedPatientDetails, "full");
  };

  const handleDeleteSelected = () => {
    if (!selectedPatientDetails) return;
    onDelete(selectedPatientDetails);
  };

  const handlePdfSelected = () => {
    if (!selectedPatientDetails) return;
    setShowReport(true); // OPEN PDF MODAL
  };

  return (
    <div className={`${card} p-4 md:p-5 relative top-[60px]`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold tracking-tight">Search Patients</h2>

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
          className="w-full pl-10 pr-4 py-1 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {/* Add */}
      <center>
        <button
          onClick={onAdd}
          className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-1 rounded-xl flex items-center justify-center gap-2 transition"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add New Patient
        </button>
      </center>

      {/* List */}
      <div className="mt-2">
        <div className="text-xs text-slate-500 mb-2">
          Total: {patients.length}
          {hasSearch ? ` | Showing: ${filteredPatients.length}` : ""}
        </div>

        <div className="max-h-[420px] overflow-y-auto border border-slate-200 rounded-xl bg-white">
          {!hasSearch ? (
            <div className="p-2 text-xs text-slate-500">
              Start typing to search patients.
            </div>
          ) : filteredPatients.length > 0 ? (
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
                    ID: {p.id}
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
            <div className="p-0 text-sm text-slate-500">No matching patients.</div>
          )}
        </div>
      </div>

      {/* Selected mini info */}
      <div className="mt-2 p-4 rounded-2xl bg-slate-100 border border-slate-200">
        <center>
              <div className="font-extrabold truncate">
                  {selectedPatientDetails?.name || "None"}
              </div>
        </center> 

        {selectedPatientDetails ? (
          <>
            <div className="mt-3 text-sm text-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faIdCard} className="text-slate-500" />
                  Patient's ID
                </span>
                <span className="font-bold">{show(selectedPatientDetails.id)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClipboardList} className="text-slate-500" />
                  Age
                </span>
                <span className="font-bold">{show(selectedPatientDetails.age)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faVenusMars} className="text-slate-500" />
                  Gender
                </span>
                <span className="font-bold">{show(selectedPatientDetails.gender)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} className="text-emerald-600" />
                  Contact
                </span>
                <span className="font-bold">{show(selectedPatientDetails.contact)}</span>
              </div>

              <div className="pt-2">
                <div className="text-slate-600 text-center font-extrabold">
                  Clinical Data
                </div>
                <div className="h-px bg-slate-200 mt-2" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserDoctor} className="text-slate-500" />
                  Dr Name
                </span>
                <span className="font-bold">{show(doctorName)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  <FontAwesomeIcon icon={faIdBadge} className="text-slate-500" /> &nbsp;Dr Reg No</span>
                <span className="font-bold">{show(selectedPatientDetails.doctorRegNo)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-slate-500" />
                  Last Clinic
                </span>
                <span className="font-bold">
                  {formatDate(
                    selectedPatientDetails.lastClinicDate || selectedPatientDetails.lastClinic
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-slate-500" />
                  Next Clinic
                </span>
                <span className="font-bold">
                  {formatDate(
                    selectedPatientDetails.nextClinicDate || selectedPatientDetails.nextClinic
                  )}
                </span>
              </div>
            </div>

            {/* Bottom action buttons */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={handleEditSelected}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-2 text-blue-700 font-extrabold text-xs"
                title="Edit selected patient"
              >
                <FontAwesomeIcon icon={faEdit} />
                Edit
              </button>

              <button
                onClick={handleDeleteSelected}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-2 text-red-700 font-extrabold text-xs"
                title="Delete selected patient"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </button>

              <button
                onClick={handlePdfSelected}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-2 text-purple-700 font-extrabold text-xs"
                title="Generate PDF Report"
              >
                <FontAwesomeIcon icon={faFilePdf} />
                PDF
              </button>
            </div>
          </>
        ) : (
          <div className="mt-3 text-sm text-slate-600">
            Pick a patient to start monitoring.
          </div>
        )}
      </div>

      {/* PDF REPORT MODAL (same as PatientPanel) */}
      <PatientReportModal
        open={showReport}
        details={selectedPatientDetails}
        formatDate={formatDate}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}
