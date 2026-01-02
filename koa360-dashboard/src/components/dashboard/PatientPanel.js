import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faPhone,
  faCalendarAlt,
  faPills,
  faIdBadge,
  faUserDoctor,
  faMars,
  faVenus,
  faGenderless,
  faBirthdayCake,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";

import PatientReportModal from "./PatientReportModal";

export default function PatientPanel({
  selectedPatientDetails,
  selectedPatient,
  onEditFull,
  onDelete,
  onEditMedication,
}) {
  const [showReport, setShowReport] = useState(false);
  const details = selectedPatientDetails || selectedPatient || null;

  const card = "bg-white border border-slate-200  shadow-sm";

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB");
  };

  const getGenderIcon = (g) => {
    const gender = (g || "").toLowerCase();
    if (gender === "male") return faMars;
    if (gender === "female") return faVenus;
    return faGenderless;
  };

  const getGenderIconClass = (g) => {
    const gender = (g || "").toLowerCase();
    if (gender === "male") return "text-blue-600";
    if (gender === "female") return "text-pink-600";
    return "text-slate-500";
  };

  const InfoRow = ({ icon, iconClass = "text-slate-500", label, value }) => (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <FontAwesomeIcon icon={icon} className={iconClass} />
        <span className="text-slate-600 text-sm font-medium">{label}</span>
      </div>
      <span className="text-slate-900 text-sm font-extrabold truncate max-w-[55%] text-right">
        {value ?? "N/A"}
      </span>
    </div>
  );

  if (!details) {
    return (
      <div className={`${card} p-5 text-slate-600`}>
        Select a patient to view details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PATIENT DETAILS CARD */}
      <div className={`${card} p-4 md:p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Patient</div>
            <div className="text-lg font-extrabold text-slate-900 truncate">
              {details?.name || "N/A"}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onEditFull}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-blue-600"
              title="Edit patient"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>

            <button
              onClick={onDelete}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-red-600"
              title="Delete patient"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>

            <button
              onClick={() => setShowReport(true)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-purple-600"
              title="Generate Report"
            >
              <FontAwesomeIcon icon={faFilePdf} />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <InfoRow icon={faIdBadge} label="ID" value={details?.id} />
          <InfoRow icon={faBirthdayCake} label="Age" value={details?.age} />
          <InfoRow
            icon={getGenderIcon(details?.gender)}
            label="Gender"
            value={details?.gender}
            iconClass={getGenderIconClass(details?.gender)}
          />
          <InfoRow icon={faPhone} label="Contact" value={details?.contact} />
        </div>

        <div className="my-4 border-t border-slate-200" />

        <div>
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide text-center">
            Clinical Data
          </div>
          <div className="mt-2">
            <InfoRow icon={faUserDoctor} label="Dr Name" value={details?.assignedDoctorName} />
            <InfoRow icon={faIdBadge} label="Dr Reg No" value={details?.doctorRegNo} />
            <InfoRow icon={faCalendarAlt} label="Last Clinic" value={formatDate(details?.lastClinicDate)} />
            <InfoRow icon={faCalendarAlt} label="Next Clinic" value={formatDate(details?.nextClinicDate)} />
          </div>
        </div>
      </div>

      {/* MEDICATION CARD */}
      <div className={`${card} p-4 md:p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPills} className="text-orange-500" />
            <h3 className="font-extrabold text-slate-900">Current Medication</h3>
          </div>
          <button
            onClick={onEditMedication}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-2"
            title="Update Medication"
          >
            <FontAwesomeIcon icon={faEdit} />
            Update
          </button>
        </div>

        <div className="mt-3">
          {details.medicationList?.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {details.medicationList.map((med, idx) => (
                <li key={idx}>{med}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No active medication listed. Click “Update” to add medication.
            </p>
          )}
        </div>
      </div>

      {/* REPORT MODAL */}
      <PatientReportModal
        open={showReport}
        details={details}
        formatDate={formatDate}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}
