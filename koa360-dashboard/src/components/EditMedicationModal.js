import React, { useState, useEffect } from "react";
import api from "../api/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPills,
  faPlus,
  faTrash,
  faSave,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

function EditMedicationModal({ show, onClose, patient, onSuccess }) {
  const [medicationList, setMedicationList] = useState([]);
  const [newMedication, setNewMedication] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show && patient) {
      setMedicationList(patient.medicationList || []);
      setNewMedication("");
      setError("");
    }
  }, [show, patient]);

  if (!show) {
    return null;
  }

  const handleAddMedication = () => {
    const trimmedMedication = newMedication.trim();
    if (trimmedMedication) {
      setMedicationList([...medicationList, trimmedMedication]);
      setNewMedication("");
    }
  };

  const handleRemoveMedication = (index) => {
    setMedicationList(medicationList.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.put(`/api/patients/${patient.id}`, {
        medicationList: medicationList,
      });
      onSuccess();
    } catch (err) {
      console.error("Error updating medication:", err);
      setError(
        `Update failed. Server response: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 caret-slate-900";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onMouseDown={!loading ? onClose : undefined}
      />

      {/* Modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faPills}
                    className="text-orange-600 text-lg"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-extrabold text-slate-800">
                    Update Medication
                  </h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Patient:{" "}
                    <span className="font-bold text-slate-800">
                      {patient?.name}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                title="Close"
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Quick hint */}
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <FontAwesomeIcon
                icon={faInfoCircle}
                className="text-blue-600 mt-0.5"
              />
              <p className="text-sm text-blue-900">
                Add medicines one by one. You can remove any item before saving.
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            <form onSubmit={handleSave}>
              {/* Add New Medication */}
              <div className="mb-4">
                <label
                  htmlFor="newMed"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Add New Medicine
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    id="newMed"
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="e.g., Ibuprofen 200mg, 3x daily"
                    className={inputBase}
                  />

                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold transition shadow-sm flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add
                  </button>
                </div>
              </div>

              {/* Current Medication List */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-extrabold text-slate-700">
                    Current List
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    Items: {medicationList.length}
                  </span>
                </div>

                <div className="max-h-[260px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {medicationList.length > 0 ? (
                    <ul className="space-y-2">
                      {medicationList.map((med, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm"
                        >
                          <span className="text-sm text-slate-800 flex-1">
                            {med}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(index)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                            title="Remove"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      No medication listed.
                    </p>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-extrabold hover:bg-slate-50 transition disabled:opacity-60"
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-extrabold transition shadow-sm flex items-center justify-center ${
                    loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {loading ? "Saving..." : "Save Medication"}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            Changes will be saved to the patient profile immediately.
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditMedicationModal;
