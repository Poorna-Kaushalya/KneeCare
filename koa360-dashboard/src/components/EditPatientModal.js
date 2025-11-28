import { useState, useEffect } from 'react';
import api from '../api/api'; // Assuming your API client is here

const EditPatientModal = ({ show, onClose, onSuccess, patient }) => {
  const [formData, setFormData] = useState(patient || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general'); // State for active tab

  // Update form data when the 'patient' prop changes
  useEffect(() => {
    if (patient) {
      // Format dates for input[type="date"]
      setFormData({
        ...patient,
        lastClinicDate: patient.lastClinicDate ? new Date(patient.lastClinicDate).toISOString().split('T')[0] : '',
        nextClinicDate: patient.nextClinicDate ? new Date(patient.nextClinicDate).toISOString().split('T')[0] : '',
        // Convert medicationList array to a string for textarea
        medicationList: Array.isArray(patient.medicationList) ? patient.medicationList.join('\n') : '',
        // Don't pre-fill password for security reasons
        password: '',
      });
      setError('');
      setSuccess('');
      setActiveTab('general'); // Reset to default tab when a new patient is loaded
    }
  }, [patient]);

  if (!show || !patient) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create a copy of formData to modify before sending
      const dataToSubmit = { ...formData };

      // Remove empty password field if not updated
      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }

      // Convert medicationList string from textarea back to an array
      if (typeof dataToSubmit.medicationList === 'string') {
        dataToSubmit.medicationList = dataToSubmit.medicationList
          .split('\n')
          .map(item => item.trim())
          .filter(item => item !== ''); // Remove empty strings
      } else {
        dataToSubmit.medicationList = []; // Ensure it's an array if not provided
      }


      await api.put(`/api/patients/${patient.id}`, dataToSubmit);
      setSuccess('Patient updated successfully!');
      setTimeout(() => {
        onSuccess(); // Call the parent's success handler
      }, 1500);
    } catch (err) {
      console.error('Error updating patient:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update patient.');
    } finally {
      setLoading(false);
    }
  };

  const tabButtonStyle = (tabName) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200
     ${activeTab === tabName
      ? 'bg-blue-600 text-white'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;

  const tabContentStyle = "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"; // A consistent grid for tab content

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl overflow-y-auto"> {/* Increased width to max-w-3xl */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Patient: {patient.name}</h2>

        {/* Tab Navigation */}
        <div className="mb-4 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px">
            <li>
              <button
                type="button"
                className={tabButtonStyle('general')}
                onClick={() => setActiveTab('general')}
              >
                General Info
              </button>
            </li>
            <li>
              <button
                type="button"
                className={tabButtonStyle('medical')}
                onClick={() => setActiveTab('medical')}
              >
                Medical Details
              </button>
            </li>
            <li>
              <button
                type="button"
                className={tabButtonStyle('account')}
                onClick={() => setActiveTab('account')}
              >
                Account & Device
              </button>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          {/* General Info Tab Content */}
          {activeTab === 'general' && (
            <div className={tabContentStyle}>
              {/* Patient ID (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
                  readOnly
                />
              </div>
              {/* Patient Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {/* Contact Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Assigned Doctor/Therapist Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Doctor Name</label>
                <input
                  type="text"
                  name="assignedDoctorName"
                  value={formData.assignedDoctorName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Doctor Registration Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Doctor Reg No.</label>
                <input
                  type="text"
                  name="doctorRegNo"
                  value={formData.doctorRegNo}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Medical Details Tab Content */}
          {activeTab === 'medical' && (
            <div className={tabContentStyle}>
              {/* Severity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Severity Level</label>
                <select
                  name="severityLevel"
                  value={formData.severityLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Severity</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              {/* Last Clinic Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Clinic Date</label>
                <input
                  type="date"
                  name="lastClinicDate"
                  value={formData.lastClinicDate}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Next Clinic Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Clinic Date</label>
                <input
                  type="date"
                  name="nextClinicDate"
                  value={formData.nextClinicDate}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Medication List (Textarea) */}
              <div className="md:col-span-2"> {/* This field spans both columns */}
                <label className="block text-sm font-medium text-gray-700">Medication List (one per line)</label>
                <textarea
                  name="medicationList"
                  value={formData.medicationList}
                  onChange={handleChange}
                  rows="6" // Increased rows for more space
                  placeholder="Enter medications, one per line (e.g., Ibuprofen, Paracetamol)"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
          )}

          {/* Account & Device Tab Content */}
          {activeTab === 'account' && (
            <div className={tabContentStyle}>
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {/* Password (Optional, only change if new password is provided) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Device ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Device ID</label>
                <input
                  type="text"
                  name="device_id"
                  value={formData.device_id}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Buttons and messages - Always visible */}
          <div className="flex justify-end items-center mt-6 space-x-3 pt-4 border-t border-gray-200">
            {error && <p className="text-red-600 text-sm mr-auto">{error}</p>}
            {success && <p className="text-green-600 text-sm mr-auto">{success}</p>}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;