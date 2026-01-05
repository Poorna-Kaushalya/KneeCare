import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../api/api";
import Navbar2 from "../components/SignInNavbar";

import AddPatientModal from "../components/AddPatientModal";
import EditPatientModal from "../components/EditPatientModal";
import EditMedicationModal from "../components/EditMedicationModal";
import DeletePatientFlow from "../components/DeletePatientFlow";

import PatientsSidebar from "../components/dashboard/PatientsSidebar";
import HeaderKpis from "../components/dashboard/HeaderKpis";
import ChartsTabs from "../components/dashboard/ChartsTabs";
import PatientPanel from "../components/dashboard/PatientPanel";
import EmptyState from "../components/dashboard/EmptyState";

import PredictionButtons from "../components/dashboard/Buttons";
import XRayPredictCard from "../components/PredicForms/XRayPredictCard";

// Popup Picker Modal
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
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b bg-slate-50 flex items-start justify-between gap-3">
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
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white transition font-bold text-sm"
              type="button"
            >
              Close
            </button>
          </div>

          <div className="p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-600">Search</label>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, device..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>

              <div className="sm:self-end">
                <button
                  onClick={onAdd}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow"
                  type="button"
                >
                  + Add New Patient
                </button>
              </div>
            </div>

            <div className="mt-4 max-h-[380px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
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
                      className="text-left rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-200 transition p-4 shadow-sm"
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

                        <span className="text-xs font-extrabold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
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
              temperature and VAG charts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ logout }) {
  const [data, setData] = useState([]);
  const [steps, setSteps] = useState(0);
  const [envTemp, setEnvTemp] = useState(0);

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

  const [dataRange, setDataRange] = useState(7);
  const [activeTab, setActiveTab] = useState("motion");

  const [showPatientPicker, setShowPatientPicker] = useState(true);

  // ✅ X-ray modal state
  const [showXrayModal, setShowXrayModal] = useState(false);

  const rangeOptions = useMemo(
    () => [
      { label: "Last 3 Days", value: 3 },
      { label: "Last Week", value: 7 },
    ],
    []
  );

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
        setSteps(0);
        setEnvTemp(0);
        return;
      }

      const patient = patients.find((p) => p.id === patientId);
      const deviceId = patient?.device_id;

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

        // Step count
        const mags = enriched.map((d) => d.totalAccelGyroMag);
        let stepCount = 0;

        if (mags.length > 0) {
          const smooth = mags.map((val, i, arr) => {
            const windowSize = 5;
            const start = Math.max(0, i - windowSize + 1);
            const w = arr.slice(start, i + 1);
            return w.reduce((sum, v) => sum + v, 0) / w.length;
          });

          const threshold = 1.5;
          for (let i = 1; i < smooth.length - 1; i++) {
            if (
              smooth[i] > threshold &&
              smooth[i] > smooth[i - 1] &&
              smooth[i] > smooth[i + 1]
            ) {
              stepCount++;
            }
          }
        }

        setSteps(stepCount);

        if (
          enriched.length > 0 &&
          enriched[enriched.length - 1].avg_temperature?.ambient != null
        ) {
          setEnvTemp(enriched[enriched.length - 1].avg_temperature.ambient);
        } else {
          setEnvTemp(0);
        }
      } catch (err) {
        if (err.response?.status === 401) logout();
        console.error("Sensor data fetch error:", err);
        setData([]);
        setSteps(0);
        setEnvTemp(0);
      }
    },
    [patients, dataRange, logout]
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
    setSteps(0);
    setEnvTemp(0);
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="sticky top-0 z-[50] bg-white border-b">
        <Navbar2 logout={logout} />
      </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

          <main className="lg:col-span-9">
            <HeaderKpis
              rangeOptions={rangeOptions}
              dataRange={dataRange}
              setDataRange={setDataRange}
              steps={steps}
              envTemp={envTemp}
              severity={selectedPatientDetails?.severityLevel}
              deviceId={selectedPatientDetails?.device_id}
            />

            {!selectedPatientId ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <section className="xl:col-span-8">
                  <PredictionButtons
                    patientId={selectedPatientId}
                    deviceId={selectedPatientDetails?.device_id}
                    disabled={!selectedPatientId}
                    onXrayClick={() => setShowXrayModal(true)} // ✅ open modal
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

      {/* X-ray Predict Modal */}
      <XRayPredictCard
        open={showXrayModal}
        onClose={() => setShowXrayModal(false)}
        patientId={selectedPatientId}
        deviceId={selectedPatientDetails?.device_id}
      />
    </div>
  );
}

export default Dashboard;
