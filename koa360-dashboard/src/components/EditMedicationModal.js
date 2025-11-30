import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPills, faPlus, faTrash, faSave } from '@fortawesome/free-solid-svg-icons';

/**
 * Modal component for updating only the patient's medication list.
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {Function} props.onClose - Function to close the modal.
 * @param {object} props.patient - The patient data to edit.
 * @param {Function} props.onSuccess - Function to call after a successful update.
 */
function EditMedicationModal({ show, onClose, patient, onSuccess }) {
  const [medicationList, setMedicationList] = useState([]);
  const [newMedication, setNewMedication] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to initialize the medication list when the modal opens or patient changes
  useEffect(() => {
    if (show && patient) {
      setMedicationList(patient.medicationList || []);
      setNewMedication('');
      setError('');
    }
  }, [show, patient]);

  if (!show) {
    return null;
  }

  const handleAddMedication = () => {
    const trimmedMedication = newMedication.trim();
    if (trimmedMedication) {
      setMedicationList([...medicationList, trimmedMedication]);
      setNewMedication('');
    }
  };

  const handleRemoveMedication = (index) => {
    setMedicationList(medicationList.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/api/patients/${patient.id}`, {
        medicationList: medicationList,
      });
      onSuccess();
    } catch (err) {
      console.error('Error updating medication:', err);
      setError(`Update failed. Server response: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faPills} className="text-orange-500 mr-3" />
              Update Medication for {patient.name}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave}>
            {/* Input to Add New Medication */}
            <div className="mb-4">
              <label htmlFor="newMed" className="block text-sm font-medium text-gray-700 mb-1">
                Add New Medicine
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="newMed"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="e.g., Ibuprofen 200mg, 3x daily"
                  className="flex-grow border border-gray-300 rounded-l-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-r-md transition-colors text-sm flex items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add
                </button>
              </div>
            </div>

            {/* Current Medication List */}
            <div className="mb-6 max-h-auto overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50 relative">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current List:</h4>
              {medicationList.length > 0 ? (
                <ul className="space-y-1">
                  {medicationList.map((med, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm text-xs"
                    >
                      <span className="text-gray-700 flex-1">{med}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                        title="Remove"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No medication listed.</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white rounded-full transition-colors flex items-center ${
                  loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600 shadow-md'
                }`}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {loading ? 'Saving...' : 'Save Medication'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditMedicationModal;