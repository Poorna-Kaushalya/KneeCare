import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../api/api";
import Navbar2 from "../components/SignInNavbar";

import AddPatientModal from "../components/AddPatientModal";
import EditPatientModal from "../components/EditPatientModal";
import EditMedicationModal from "../components/EditMedicationModal";
import DeletePatientFlow from "../components/DeletePatientFlow";

import PatientsSidebar from "../components/dashboard/PatientsSidebar";
import ChartsTabs from "../components/dashboard/ChartsTabs";
import PatientPanel from "../components/dashboard/PatientPanel";
import EmptyState from "../components/dashboard/EmptyState";

import PredictionButtons from "../components/dashboard/Buttons";
import XRayPredictCard from "../components/PredicForms/XRayPredictCard";
import KOAFusionPredictPage from "../components/dashboard/KOAFusionPredictPage";
import KOAClinicalPredictCard from "../components/PredicForms/KOAClinicalPredictCard";

import MedicalDataUpdateModal from "../components/dashboard/MedicalDataUpdateModal";

function PatientPickerModal({
  show,
  onClose,
  patientsCount,
  filteredPatients,
  searchTerm,
  setSearchTerm,
  onSelect,
  onAdd,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-sky-100 overflow-hidden">
          <div className="p-5 border-b bg-gradient-to-r from-sky-50 to-emerald-50 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Select a Patient
              </h3>
              <p className="text-sm text-slate-600">
                Search and pick a patient to load monitoring charts. (Total:{" "}
                <b>{patientsCount}</b>)
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-sky-100 text-slate-700 hover:bg-white transition font-bold text-sm"
              type="button"
            >
              Close
            </button>
          </div>

          <div className="p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-600">
                  Search
                </label>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, device..."
                  className="mt-1 w-full rounded-2xl border border-sky-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                />
              </div>

              <div className="sm:self-end">
                <button
                  onClick={onAdd}
                  className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm shadow-sm"
                  type="button"
                >
                  + Add New Patient
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-[380px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center">
                  <p className="font-bold text-slate-800">No matches found</p>
                  <p className="text-sm text-slate-600">
                    Try another keyword or add a new patient.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p.id)}
                      type="button"
                      className="text-left rounded-3xl border border-sky-100 bg-white hover:bg-sky-50/40 hover:border-sky-200 transition p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {p.name || "Unnamed Patient"}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            <span className="font-bold">ID:</span> {p.id ?? "-"}
                          </div>
                          <div className="text-xs text-slate-600">
                            <span className="font-bold">Device:</span>{" "}
                            {p.device_id ?? "-"}
                          </div>
                        </div>

                        <span className="text-xs font-extrabold px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                          Select
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Tip: Selecting a patient will automatically load motion, angle,
              temperature and PLOS charts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ logout }) {
  const [data, setData] = useState([]);

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);

  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);

  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [editMode, setEditMode] = useState(null);

  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [patientForDeleteFlow, setPatientForDeleteFlow] = useState(null);

  const [dataRange] = useState(7);
  const [activeTab, setActiveTab] = useState("motion");

  const [showPatientPicker, setShowPatientPicker] = useState(true);

  const [showXrayModal, setShowXrayModal] = useState(false);
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [showClinicalModal, setShowClinicalModal] = useState(false);

  const [showMedicalModal, setShowMedicalModal] = useState(false);

  const isPatientMatch = useCallback(
    (patient) => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      const name = patient.name?.toLowerCase() || "";
      const id = String(patient.id || "").toLowerCase();
      const device = String(patient.device_id || "").toLowerCase();
      return name.includes(s) || id.includes(s) || device.includes(s);
    },
    [searchTerm]
  );

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [selectedPatientId, patients]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
      if (err.response?.status === 401) logout();
    }
  }, [logout]);

  const fetchPatientDetails = useCallback(async (patientId) => {
    if (!patientId) {
      setSelectedPatientDetails(null);
      return;
    }
    try {
      const res = await api.get(`/api/patients/${patientId}`);
      setSelectedPatientDetails(res.data);
    } catch (err) {
      console.error("Error fetching patient details:", err);
      setSelectedPatientDetails(null);
    }
  }, []);

  const fetchData = useCallback(
    async (patientId) => {
      if (!patientId) {
        setData([]);
        return;
      }

      const patient = patients.find((p) => p.id === patientId);
      const deviceId = patient?.device_id;

      if (!deviceId) {
        setData([]);
        return;
      }

      try {
        const res = await api.get(
          `/api/sensor-datas?deviceId=${deviceId}&range=${dataRange}`
        );

        const allData = res.data || [];
        const lastPoints = allData
          .slice(-600)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const enriched = lastPoints.map((d) => {
          const upperAccelMag = Math.sqrt(
            (d.avg_upper?.ax || 0) ** 2 +
              (d.avg_upper?.ay || 0) ** 2 +
              (d.avg_upper?.az || 0) ** 2
          );

          const lowerAccelMag = Math.sqrt(
            (d.avg_lower?.ax || 0) ** 2 +
              (d.avg_lower?.ay || 0) ** 2 +
              (d.avg_lower?.az || 0) ** 2
          );

          const gyroMag =
            Math.sqrt(
              (d.avg_upper?.gx || 0) ** 2 +
                (d.avg_upper?.gy || 0) ** 2 +
                (d.avg_upper?.gz || 0) ** 2
            ) +
            Math.sqrt(
              (d.avg_lower?.gx || 0) ** 2 +
                (d.avg_lower?.gy || 0) ** 2 +
                (d.avg_lower?.gz || 0) ** 2
            );

          const totalAccelGyroMag = upperAccelMag + lowerAccelMag + 0.5 * gyroMag;

          return { ...d, upperAccelMag, lowerAccelMag, totalAccelGyroMag };
        });

        setData(enriched);
      } catch (err) {
        if (err.response?.status === 401) logout();
        console.error("Sensor data fetch error:", err);
        setData([]);
      }
    },
    [patients, dataRange, logout]
  );

  // ✅ VERY IMPORTANT: after medical save, update BOTH states
  const handleMedicalSaved = useCallback(
    async (updatedPatient) => {
      // 1) Update right panel immediately
      setSelectedPatientDetails(updatedPatient);

      // 2) Update sidebar list without needing refresh
      setPatients((prev) =>
        prev.map((p) => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p))
      );

      // 3) Optional: re-fetch from backend to guarantee consistency
      await fetchPatients();
      if (selectedPatientId) await fetchPatientDetails(selectedPatientId);
    },
    [fetchPatients, fetchPatientDetails, selectedPatientId]
  );

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    setFilteredPatients(patients.filter(isPatientMatch));
  }, [patients, isPatientMatch]);

  useEffect(() => {
    fetchData(selectedPatientId);
    fetchPatientDetails(selectedPatientId);

    const interval = setInterval(() => {
      if (selectedPatientId) fetchData(selectedPatientId);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPatientId, fetchData, fetchPatientDetails]);

  useEffect(() => {
    if (!selectedPatientId) setShowPatientPicker(true);
  }, [selectedPatientId]);

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
    setActiveTab("motion");
    setShowPatientPicker(false);
  };

  const handleClearSelection = () => {
    setSelectedPatientId(null);
    setSelectedPatientDetails(null);
    setData([]);
  };

  const handleAddPatientSuccess = () => {
    setShowAddPatientModal(false);
    fetchPatients();
  };

  const handleEditPatient = (patient, mode = "full") => {
    setPatientToEdit(patient);
    setEditMode(mode);
    setShowEditPatientModal(true);
  };

  const handleEditPatientSuccess = () => {
    setShowEditPatientModal(false);
    setPatientToEdit(null);
    setEditMode(null);
    fetchPatients();
    if (selectedPatientId) fetchPatientDetails(selectedPatientId);
  };

  const openDeletePatientFlow = (patient) => {
    setPatientForDeleteFlow(patient);
    setShowDeleteFlow(true);
  };

  const handleDeletionFlowSuccess = (deletedId) => {
    fetchPatients();
    if (selectedPatientId === deletedId) handleClearSelection();
  };

  const handleDeletionFlowClose = () => {
    setShowDeleteFlow(false);
    setPatientForDeleteFlow(null);
  };

  const handleCloseEditModal = () => {
    setShowEditPatientModal(false);
    setPatientToEdit(null);
    setEditMode(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 text-slate-800">
      <div className="sticky top-0 z-[50] bg-white/90 backdrop-blur border-b border-sky-100">
        <Navbar2 logout={logout} />
      </div>

      <br />
      <br />
      <br />

      <PatientPickerModal
        show={showPatientPicker && !selectedPatientId}
        onClose={() => setShowPatientPicker(false)}
        patientsCount={patients.length}
        filteredPatients={filteredPatients}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSelect={handlePatientSelect}
        onAdd={() => setShowAddPatientModal(true)}
      />

      <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <aside className="lg:col-span-3">
            <PatientsSidebar
              patients={patients}
              filteredPatients={filteredPatients}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedPatientId={selectedPatientId}
              onSelect={handlePatientSelect}
              onClear={handleClearSelection}
              onAdd={() => setShowAddPatientModal(true)}
              onEdit={handleEditPatient}
              onDelete={openDeletePatientFlow}
              selectedPatientDetails={selectedPatientDetails}
            />
          </aside>

          <main className="lg:col-span-9 space-y-4">
            {!selectedPatientId ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <section className="xl:col-span-8 space-y-4">
                  <PredictionButtons
                    patientId={selectedPatientId}
                    deviceId={selectedPatientDetails?.device_id}
                    disabled={!selectedPatientId}
                    onXrayClick={() => setShowXrayModal(true)}
                    onFusionClick={() => setShowFusionModal(true)}
                    onClinicalClick={() => setShowClinicalModal(true)}
                  />

                  <ChartsTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    data={data}
                    deviceId={selectedPatientDetails?.device_id}
                  />
                </section>

                <aside className="xl:col-span-4">
                  <PatientPanel
                    selectedPatientDetails={selectedPatientDetails}
                    selectedPatient={selectedPatient}
                    onEditFull={() =>
                      selectedPatientDetails &&
                      handleEditPatient(selectedPatientDetails, "full")
                    }
                    onDelete={() =>
                      selectedPatient && openDeletePatientFlow(selectedPatient)
                    }
                    onEditMedication={() =>
                      selectedPatientDetails &&
                      handleEditPatient(selectedPatientDetails, "medication")
                    }
                    //  Add this button inside PatientPanel and call this prop
                    onEditMedical={() => setShowMedicalModal(true)}
                  />
                </aside>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        show={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onSuccess={handleAddPatientSuccess}
      />

      {patientToEdit && editMode === "full" && (
        <EditPatientModal
          show={showEditPatientModal}
          onClose={handleCloseEditModal}
          patient={patientToEdit}
          onSuccess={handleEditPatientSuccess}
        />
      )}

      {patientToEdit && editMode === "medication" && (
        <EditMedicationModal
          show={showEditPatientModal}
          onClose={handleCloseEditModal}
          patient={patientToEdit}
          onSuccess={handleEditPatientSuccess}
        />
      )}

      {showDeleteFlow && patientForDeleteFlow && (
        <DeletePatientFlow
          show={showDeleteFlow}
          patient={patientForDeleteFlow}
          onClose={handleDeletionFlowClose}
          onDeletionSuccess={handleDeletionFlowSuccess}
        />
      )}

      <XRayPredictCard
        open={showXrayModal}
        onClose={() => setShowXrayModal(false)}
        patientId={selectedPatientId}
        deviceId={selectedPatientDetails?.device_id}
      />

      <KOAFusionPredictPage
        open={showFusionModal}
        onClose={() => setShowFusionModal(false)}
        patientId={selectedPatientId}
        deviceId={selectedPatientDetails?.device_id}
      />

      <KOAClinicalPredictCard
        open={showClinicalModal}
        onClose={() => setShowClinicalModal(false)}
      />

      {/* ✅ Medical update modal */}
      <MedicalDataUpdateModal
        open={showMedicalModal}
        onClose={() => setShowMedicalModal(false)}
        details={selectedPatientDetails}
        onSaved={handleMedicalSaved}
      />
    </div>
  );
}

export default Dashboard;