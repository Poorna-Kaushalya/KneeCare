import { useState, useEffect } from "react";
import api from "../api/api";

const AddPatientModal = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    age: "",
    gender: "",
    severityLevel: "",
    lastClinicDate: "",
    nextClinicDate: "",
    username: "",
    password: "",
    doctorRegNo: "",
    device_id: "",
    assignedDoctorName: "",
    contact: "",
    medicationList: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  const severityOptions = [
    { value: "", label: "Select Severity Level" },
    { value: "Normal", label: "Normal" },
    { value: "Mild", label: "Mild" },
    { value: "Moderate", label: "Moderate" },
    { value: "Severe", label: "Severe" },
    { value: "Critical", label: "Critical" },
  ];

  useEffect(() => {
    if (!show) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      age: "",
      gender: "",
      severityLevel: "",
      lastClinicDate: "",
      nextClinicDate: "",
      username: "",
      password: "",
      doctorRegNo: "",
      device_id: "",
      assignedDoctorName: "",
      contact: "",
      medicationList: "",
    });
    setError("");
    setSuccess("");
    setActiveTab("general");
  };

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.id || !formData.name || !formData.username || !formData.password) {
        throw new Error("Patient ID, Name, Username, and Password are required.");
      }

      const dataToSubmit = { ...formData };

      // Convert medicationList textarea (string) -> array
      if (typeof dataToSubmit.medicationList === "string") {
        dataToSubmit.medicationList = dataToSubmit.medicationList
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
      } else {
        dataToSubmit.medicationList = [];
      }

      await api.post("/api/patients", dataToSubmit);

      setSuccess("Patient added successfully!");
      setTimeout(() => onSuccess(), 900);
    } catch (err) {
      console.error("Error adding patient:", err);
      setError(err.response?.data?.error || err.message || "Failed to add patient.");
    } finally {
      setLoading(false);
    }
  };

  // styles
  const card =
    "bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl";
  const input =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition";
  const label = "block text-sm font-extrabold text-slate-700";
  const helper = "text-xs text-slate-500 mt-1";
  const tabBase =
    "px-4 py-2 text-sm font-extrabold rounded-xl transition border";
  const tabActive = "bg-blue-600 text-white border-blue-600 shadow";
  const tabIdle = "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!loading) {
            onClose();
            resetForm();
          }
        }}
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={card}>
          {/* header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-50/80 to-white rounded-t-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Add New Patient
                </h2>
                <p className="text-sm text-slate-600">
                  Fill patient details and account info. Fields marked{" "}
                  <span className="text-rose-600 font-extrabold">*</span> are required.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!loading) {
                    onClose();
                    resetForm();
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white transition font-extrabold text-sm"
                disabled={loading}
              >
                Close
              </button>
            </div>

            {/* tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`${tabBase} ${activeTab === "general" ? tabActive : tabIdle}`}
                onClick={() => setActiveTab("general")}
                disabled={loading}
              >
                General Info
              </button>
              <button
                type="button"
                className={`${tabBase} ${activeTab === "medical" ? tabActive : tabIdle}`}
                onClick={() => setActiveTab("medical")}
                disabled={loading}
              >
                Medical Details
              </button>
              <button
                type="button"
                className={`${tabBase} ${activeTab === "account" ? tabActive : tabIdle}`}
                onClick={() => setActiveTab("account")}
                disabled={loading}
              >
                Account & Device
              </button>
            </div>
          </div>

          {/* content */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {/* alerts */}
            {(error || success) && (
              <div
                className={`mb-4 rounded-xl border p-3 text-sm font-semibold ${
                  error
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {error || success}
              </div>
            )}

            {/* General */}
            {activeTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>
                    Patient ID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    className={input}
                    required
                  />
                  <p className={helper}>Use NIC / hospital ID / internal ID.</p>
                </div>

                <div>
                  <label className={label}>
                    Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={input}
                    required
                  />
                </div>

                <div>
                  <label className={label}>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={input}
                    min="0"
                  />
                </div>

                <div>
                  <label className={label}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={input}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={label}>Contact</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className={input}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className={label}>Assigned Doctor Name</label>
                  <input
                    type="text"
                    name="assignedDoctorName"
                    value={formData.assignedDoctorName}
                    onChange={handleChange}
                    className={input}
                    placeholder="Dr. ..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={label}>Doctor Reg No.</label>
                  <input
                    type="text"
                    name="doctorRegNo"
                    value={formData.doctorRegNo}
                    onChange={handleChange}
                    className={input}
                    placeholder="SLMC / registration number"
                  />
                </div>
              </div>
            )}

            {/* Medical */}
            {activeTab === "medical" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Severity Level</label>
                  <select
                    name="severityLevel"
                    value={formData.severityLevel}
                    onChange={handleChange}
                    className={input}
                  >
                    {severityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={label}>Last Clinic Date</label>
                  <input
                    type="date"
                    name="lastClinicDate"
                    value={formData.lastClinicDate}
                    onChange={handleChange}
                    className={input}
                  />
                </div>

                <div>
                  <label className={label}>Next Clinic Date</label>
                  <input
                    type="date"
                    name="nextClinicDate"
                    value={formData.nextClinicDate}
                    onChange={handleChange}
                    className={input}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={label}>Medication List (one per line)</label>
                  <textarea
                    name="medicationList"
                    value={formData.medicationList}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Ibuprofen 200mg\nParacetamol 500mg\n..."
                    className={`${input} font-mono`}
                  />
                  <p className={helper}>
                    Press Enter for a new medication. We will save it as an array.
                  </p>
                </div>
              </div>
            )}

            {/* Account */}
            {activeTab === "account" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>
                    Username <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={input}
                    required
                  />
                </div>

                <div>
                  <label className={label}>
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={input}
                    required
                  />
                  <p className={helper}>Minimum 6–8 characters recommended.</p>
                </div>

                <div className="md:col-span-2">
                  <label className={label}>Device ID</label>
                  <input
                    type="text"
                    name="device_id"
                    value={formData.device_id}
                    onChange={handleChange}
                    className={input}
                    placeholder="KOA360-001"
                  />
                </div>
              </div>
            )}

            {/* footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!loading) {
                    onClose();
                    resetForm();
                  }
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-extrabold text-sm"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 rounded-xl font-extrabold text-sm text-white shadow transition ${
                  loading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Adding..." : "Add Patient"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
