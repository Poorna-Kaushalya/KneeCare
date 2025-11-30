import { useState, useEffect } from 'react'; 
import api from '../api/api';

const AddPatientModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    age: '',
    gender: '',
    severityLevel: '',
    lastClinicDate: '',
    nextClinicDate: '',
    username: '',
    password: '',
    doctorRegNo: '',
    device_id: '',
    assignedDoctorName: '', 
    contact: '',           
    medicationList: '',   
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Updated severity level options
  const severityOptions = [
    { value: '', label: 'Select Severity Level' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Mild', label: 'Mild' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Severe', label: 'Severe' },
    { value: 'Critical', label: 'Critical' },
  ];

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!show) {
      resetForm();
    }
  }, [show]); // Run when 'show' prop changes

  const resetForm = () => {
    setFormData({
      id: '', name: '', age: '', gender: '', severityLevel: '',
      lastClinicDate: '', nextClinicDate: '', username: '', password: '',
      doctorRegNo: '', device_id: '', assignedDoctorName: '', contact: '',
      medicationList: '', // Reset medicationList as empty string
    });
    setError('');
    setSuccess('');
    setActiveTab('general'); // Reset active tab to default
  };

  if (!show) {
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
      // Perform basic client-side validation for required fields
      if (!formData.id || !formData.name || !formData.username || !formData.password) {
        throw new Error("Patient ID, Name, Username, and Password are required.");
      }

      // Create a copy of formData to modify before sending
      const dataToSubmit = { ...formData };

      // Convert medicationList string from textarea back to an array
      if (typeof dataToSubmit.medicationList === 'string') {
        dataToSubmit.medicationList = dataToSubmit.medicationList
          .split('\n')
          .map(item => item.trim())
          .filter(item => item !== ''); 
      } else {
        dataToSubmit.medicationList = []; 
      }

      await api.post('/api/patients', dataToSubmit); 
      setSuccess('Patient added successfully!');
      setTimeout(() => {
        onSuccess(); 
      }, 1500); 
    } catch (err) {
      console.error('Error adding patient:', err);
      setError(err.response?.data?.error || err.message || 'Failed to add patient.');
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

  const tabContentStyle = "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"; 

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl overflow-y-auto"> 
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Patient</h2>

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
              {/* Patient ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                  {severityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
              onClick={() => { onClose(); resetForm(); }}
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
              {loading ? 'Adding...' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;