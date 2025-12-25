import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faUser,
  faPhone,
  faCalendarAlt,
  faPills,
} from "@fortawesome/free-solid-svg-icons";

export default function PatientPanel({
  selectedPatientDetails,
  selectedPatient,
  onEditFull,
  onDelete,
  onEditMedication,
}) {
  const card = "bg-white border border-slate-200 rounded-2xl shadow-sm";

  return (
    <div className="space-y-6">
      {/* Patient details */}
      <div className={`${card} p-4 md:p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Patient</div>
            <div className="text-lg font-extrabold">
              {selectedPatientDetails?.name || selectedPatient?.name || "N/A"}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onEditFull}
              disabled={!selectedPatientDetails}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-blue-600 disabled:opacity-50"
              title="Edit patient"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              onClick={onDelete}
              disabled={!selectedPatient}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-red-600 disabled:opacity-50"
              title="Delete patient"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-slate-500" />
            <span className="text-slate-500">ID:</span>
            <span className="font-bold">{selectedPatientDetails?.id || "N/A"}</span>
          </div>

          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-slate-500" />
            <span className="text-slate-500">Age:</span>
            <span className="font-bold">{selectedPatientDetails?.age || "N/A"}</span>
          </div>

          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-slate-500" />
            <span className="text-slate-500">Gender:</span>
            <span className="font-bold">{selectedPatientDetails?.gender || "N/A"}</span>
          </div>

          {selectedPatientDetails?.contact && (
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faPhone} className="text-emerald-600" />
              <span className="text-slate-500">Contact:</span>
              <span className="font-bold">{selectedPatientDetails.contact}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-emerald-600" />
            <span className="text-slate-500">Last Clinic:</span>
            <span className="font-bold">
              {selectedPatientDetails?.lastClinicDate
                ? new Date(selectedPatientDetails.lastClinicDate).toLocaleDateString()
                : "N/A"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-orange-500" />
            <span className="text-slate-500">Next Clinic:</span>
            <span className="font-bold">
              {selectedPatientDetails?.nextClinicDate
                ? new Date(selectedPatientDetails.nextClinicDate).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Medication */}
      {selectedPatientDetails && (
        <div className={`${card} p-4 md:p-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faPills} className="text-orange-500" />
              <h3 className="font-extrabold">Current Medication</h3>
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
            {selectedPatientDetails.medicationList?.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                {selectedPatientDetails.medicationList.map((med, idx) => (
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
      )}
    </div>
  );
}
