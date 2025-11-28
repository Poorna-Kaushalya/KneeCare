// src/components/EditPatientModal.js

import { useState, useEffect } from 'react';
import api from '../api/api'; // Assuming your API client is here

const EditPatientModal = ({ show, onClose, onSuccess, patient }) => {
  const [formData, setFormData] = useState(patient || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update form data when the 'patient' prop changes
  useEffect(() => {
    if (patient) {
      // Format dates for input[type="date"]
      setFormData({
        ...patient,
        lastClinicDate: patient.lastClinicDate ? new Date(patient.lastClinicDate).toISOString().split('T')[0] : '',
        nextClinicDate: patient.nextClinicDate ? new Date(patient.nextClinicDate).toISOString().split('T')[0] : '',
        // Don't pre-fill password for security reasons
        password: '',
      });
      setError('');
      setSuccess('');
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
      // Remove empty password field if not updated
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Patient: {patient.name}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {/* Severity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Severity Level</label>
            <input
              type="text"
              name="severityLevel"
              value={formData.severityLevel}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
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

          <div className="md:col-span-2 flex justify-end items-center mt-4 space-x-3">
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