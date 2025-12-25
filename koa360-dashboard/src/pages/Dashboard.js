import { useState, useEffect, useCallback, useMemo } from "react";
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

  // -------------------------
  // Options
  // -------------------------
  const rangeOptions = useMemo(
    () => [
      { label: "Last 3 Days", value: 3 },
      { label: "Last Week", value: 7 },
    ],
    []
  );

  // -------------------------
  // Helpers
  // -------------------------
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

  // -------------------------
  // API Calls
  // -------------------------
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
            if (smooth[i] > threshold && smooth[i] > smooth[i - 1] && smooth[i] > smooth[i + 1]) {
              stepCount++;
            }
          }
        }

        setSteps(stepCount);

        if (enriched.length > 0 && enriched[enriched.length - 1].avg_temperature?.ambient != null) {
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

  // -------------------------
  // Effects
  // -------------------------
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

  // -------------------------
  // Handlers
  // -------------------------
  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
    setActiveTab("motion");
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

      <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
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

          {/* Main */}
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
                  <ChartsTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    data={data}
                  />
                </section>

                <aside className="xl:col-span-4">
                  <PatientPanel
                    selectedPatientDetails={selectedPatientDetails}
                    selectedPatient={selectedPatient}
                    onEditFull={() =>
                      selectedPatientDetails && handleEditPatient(selectedPatientDetails, "full")
                    }
                    onDelete={() => selectedPatient && openDeletePatientFlow(selectedPatient)}
                    onEditMedication={() =>
                      selectedPatientDetails && handleEditPatient(selectedPatientDetails, "medication")
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
    </div>
  );
}

export default Dashboard;
