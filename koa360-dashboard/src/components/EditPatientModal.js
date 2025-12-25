import { useState, useEffect, useRef } from "react";
import api from "../api/api";

const EditPatientModal = ({ show, onClose, onSuccess, patient }) => {
  const [formData, setFormData] = useState(patient || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("general"); 

  const modalCardRef = useRef(null);
  useEffect(() => {
    if (!show) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [show, onClose]);

  useEffect(() => {
    if (!show) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  useEffect(() => {
    if (patient) {
      setFormData({
        ...patient,
        lastClinicDate: patient.lastClinicDate
          ? new Date(patient.lastClinicDate).toISOString().split("T")[0]
          : "",
        nextClinicDate: patient.nextClinicDate
          ? new Date(patient.nextClinicDate).toISOString().split("T")[0]
          : "",
        medicationList: Array.isArray(patient.medicationList)
          ? patient.medicationList.join("\n")
          : "",
        password: "",
      });
      setError("");
      setSuccess("");
      setActiveTab("general");
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
    setError("");
    setSuccess("");

    try {
      const dataToSubmit = { ...formData };

      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }

      if (typeof dataToSubmit.medicationList === "string") {
        dataToSubmit.medicationList = dataToSubmit.medicationList
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      } else {
        dataToSubmit.medicationList = [];
      }

      await api.put(`/api/patients/${patient.id}`, dataToSubmit);
      setSuccess("Patient updated successfully!");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Error updating patient:", err);
      setError(
        err.response?.data?.error || err.message || "Failed to update patient."
      );
    } finally {
      setLoading(false);
    }
  };


  const tabButtonStyle = (tabName) =>
    `px-4 py-2 text-sm font-extrabold rounded-full transition-all border
     ${
       activeTab === tabName
         ? "bg-blue-600 text-white border-blue-600 shadow-sm"
         : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
     }`;

  const inputBase =
    "mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 caret-slate-900";

  const inputReadOnly =
    "mt-1 block w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600 shadow-sm cursor-not-allowed";

  const labelBase = "block text-sm font-semibold text-slate-700";

  const tabContentStyle = "grid grid-cols-1 md:grid-cols-2 gap-4 mt-5";

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onMouseDown={!loading ? onClose : undefined}
      />

      {/* Modal Wrapper */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* Card */}
        <div
          ref={modalCardRef}
          className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                  Edit Patient
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Update details and save changes.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Patient badge */}
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-slate-500">Patient</span>
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold">
                {patient.name}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                ID: {patient.id}
              </span>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={tabButtonStyle("general")}
                onClick={() => setActiveTab("general")}
              >
                General Info
              </button>
              <button
                type="button"
                className={tabButtonStyle("medical")}
                onClick={() => setActiveTab("medical")}
              >
                Medical Details
              </button>
              <button
                type="button"
                className={tabButtonStyle("account")}
                onClick={() => setActiveTab("account")}
              >
                Account & Device
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {activeTab === "general" && (
                <div className={tabContentStyle}>
                  <div>
                    <label className={labelBase}>Patient ID</label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      className={inputReadOnly}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className={labelBase}>
                      Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputBase}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={inputBase}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelBase}>Contact</label>
                    <input
                      type="text"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Assigned Doctor Name</label>
                    <input
                      type="text"
                      name="assignedDoctorName"
                      value={formData.assignedDoctorName}
                      onChange={handleChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Doctor Reg No.</label>
                    <input
                      type="text"
                      name="doctorRegNo"
                      value={formData.doctorRegNo}
                      onChange={handleChange}
                      className={inputBase}
                    />
                  </div>
                </div>
              )}

              {/* Medical Details */}
              {activeTab === "medical" && (
                <div className={tabContentStyle}>
                  <div>
                    <label className={labelBase}>Severity Level</label>
                    <select
                      name="severityLevel"
                      value={formData.severityLevel}
                      onChange={handleChange}
                      className={inputBase}
                    >
                      <option value="">Select Severity</option>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelBase}>Last Clinic Date</label>
                    <input
                      type="date"
                      name="lastClinicDate"
                      value={formData.lastClinicDate}
                      onChange={handleChange}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Next Clinic Date</label>
                    <input
                      type="date"
                      name="nextClinicDate"
                      value={formData.nextClinicDate}
                      onChange={handleChange}
                      className={inputBase}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelBase}>
                      Medication List (one per line)
                    </label>
                    <textarea
                      name="medicationList"
                      value={formData.medicationList}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Enter medications, one per line (e.g., Ibuprofen, Paracetamol)"
                      className={inputBase}
                    />
                  </div>
                </div>
              )}

              {/* Account & Device */}
              {activeTab === "account" && (
                <div className={tabContentStyle}>
                  <div>
                    <label className={labelBase}>
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={inputBase}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelBase}>New Password (optional)</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Device ID</label>
                    <input
                      type="text"
                      name="device_id"
                      value={formData.device_id}
                      onChange={handleChange}
                      className={inputBase}
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 font-semibold">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 font-semibold">
                      {success}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3">
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
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold transition disabled:opacity-60 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Bottom strip */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            Make sure to click “Save Changes” to apply updates.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;
