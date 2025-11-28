// src/pages/Dashboard.js (UPDATED to use DeletePatientFlow for combined modal+notification)

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import api from "../api/api";
import Navbar2 from "../components/SignInNavbar";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoePrints, faThermometerHalf, faSearch, faUser,
  faCalendarAlt, faHeartbeat, faMicrochip,
  faPlus, faEdit, faTrash
  // Removed faCheckCircle, faTimesCircle, faInfoCircle as DeletePatientFlow handles them
} from '@fortawesome/free-solid-svg-icons';

import AddPatientModal from '../components/AddPatientModal';
import EditPatientModal from '../components/EditPatientModal';
import DeletePatientFlow from '../components/DeletePatientFlow'; // Corrected import to the combined component


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

  // --- State for the combined DeletePatientFlow component ---
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [patientForDeleteFlow, setPatientForDeleteFlow] = useState(null); // Stores the full patient object for the flow


  const MAX_KNEE_ANGLE = 120;

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAccel = (value) => `${value.toFixed(2)} m/s²`;
  const formatGyro = (value) => `${value.toFixed(1)}°/s`;
  const formatDegrees = (value) => {
    let degrees = value;
    if (value >= 0 && value <= 1) {
      degrees = value * MAX_KNEE_ANGLE;
    }
    return degrees % 1 === 0 ? `${degrees}°` : `${degrees.toFixed(1)}°`;
  };
  const formatTemp = (value) => `${value.toFixed(2)} °C`;

  // Removed showNotification and clearNotification functions as DeletePatientFlow handles notifications

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients:", err);
      if (err.response?.status === 401) {
        // No alert here, assuming DeletePatientFlow or another global handler would eventually manage session expiry notifications
        logout();
      }
    }
  }, [logout]);

  const fetchData = useCallback(async (patientId) => {
    if (!patientId) {
      setData([]);
      setSteps(0);
      setEnvTemp(0);
      return;
    }
    try {
      const res = await api.get(`/api/sensor-data?patientId=${patientId}`);
      const allData = res.data;
      const lastPoints = allData.slice(-600).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setData(lastPoints);

      const magnitudes = lastPoints.map((d) => {
        const upperMag = Math.sqrt(
          (d.avg_upper?.ax || 0) ** 2 + (d.avg_upper?.ay || 0) ** 2 + (d.avg_upper?.az || 0) ** 2
        );
        const lowerMag = Math.sqrt(
          (d.avg_lower?.ax || 0) ** 2 + (d.avg_lower?.ay || 0) ** 2 + (d.avg_lower?.az || 0) ** 2
        );
        const gyroMag =
          Math.sqrt(
            (d.avg_upper?.gx || 0) ** 2 + (d.avg_upper?.gy || 0) ** 2 + (d.avg_upper?.gz || 0) ** 2
          ) +
          Math.sqrt(
            (d.avg_lower?.gx || 0) ** 2 + (d.avg_lower?.gy || 0) ** 2 + (d.avg_lower?.gz || 0) ** 2
          );
        return upperMag + lowerMag + 0.5 * gyroMag;
      });

      let stepCount = 0;
      if (magnitudes.length > 0) {
        const smoothMagnitudes = magnitudes.map((val, i, arr) => {
          const windowSize = 5;
          const start = Math.max(0, i - windowSize + 1);
          const window = arr.slice(start, i + 1);
          return window.reduce((sum, v) => sum + v, 0) / window.length;
        });

        const threshold = 1.5;
        for (let i = 1; i < smoothMagnitudes.length - 1; i++) {
          if (
            smoothMagnitudes[i] > threshold &&
            smoothMagnitudes[i] > smoothMagnitudes[i - 1] &&
            smoothMagnitudes[i] > smoothMagnitudes[i + 1]
          ) {
            stepCount++;
          }
        }
      }
      setSteps(stepCount);

      if (lastPoints.length > 0 && lastPoints[lastPoints.length - 1].avg_temperature?.ambient != null) {
        setEnvTemp(lastPoints[lastPoints.length - 1].avg_temperature.ambient);
      } else {
        setEnvTemp(0);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        // No alert here either
        logout();
      } else if (err.response?.status === 404 && err.response?.data?.error?.includes("no device associated")) {
        console.warn(`No device data for patient ${patientId}:`, err.response.data.error);
        // Alert removed, would be handled by a more generic notification or the specific flow.
        setData([]);
        setSteps(0);
        setEnvTemp(0);
      } else {
        console.error("Sensor data fetch error:", err);
        // Alert removed
        setData([]);
        setSteps(0);
        setEnvTemp(0);
      }
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
      // Alert removed
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredPatients([]);
      if (selectedPatientId && !patients.some(p => p.id === selectedPatientId)) {
        setSelectedPatientId(null);
        setSelectedPatientDetails(null);
      }
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const newFilteredPatients = patients.filter((p) => {
        const patientName = p.name?.toLowerCase() || "";
        const patientId = p.id?.toLowerCase() || "";
        const patientDeviceId = p.device_id?.toLowerCase() || "";

        return (
          patientName.includes(lowerCaseSearchTerm) ||
          patientId.includes(lowerCaseSearchTerm) ||
          patientDeviceId.includes(lowerCaseSearchTerm)
        );
      });
      setFilteredPatients(newFilteredPatients);

      if (newFilteredPatients.length === 1 && selectedPatientId !== newFilteredPatients[0].id) {
        setSelectedPatientId(newFilteredPatients[0].id);
      } else if (
        selectedPatientId &&
        !newFilteredPatients.some(p => p.id === selectedPatientId)
      ) {
        setSelectedPatientId(null);
        setSelectedPatientDetails(null);
      } else if (newFilteredPatients.length === 0) {
          setSelectedPatientId(null);
          setSelectedPatientDetails(null);
      }
    }
  }, [searchTerm, patients, selectedPatientId]);

  useEffect(() => {
    fetchData(selectedPatientId);
    fetchPatientDetails(selectedPatientId);
    const interval = setInterval(() => {
      if (selectedPatientId) {
        fetchData(selectedPatientId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPatientId, fetchData, fetchPatientDetails]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handlePatientSelect = (patientId) => {
    setSelectedPatientId(patientId);
  };

  // --- CRUD Handlers ---

  const handleAddPatientSuccess = () => {
    setShowAddPatientModal(false);
    fetchPatients();
    // No alert or notification call here, assuming a separate notification system for add/edit.
  };

  const handleEditPatient = (patient) => {
    setPatientToEdit(patient);
    setShowEditPatientModal(true);
  };

  const handleEditPatientSuccess = () => {
    setShowEditPatientModal(false);
    setPatientToEdit(null);
    fetchPatients();
    if (selectedPatientId) {
      fetchPatientDetails(selectedPatientId);
    }
    // No alert or notification call here.
  };

  // Function to open the combined DeletePatientFlow modal/notification
  const openDeletePatientFlow = (patient) => {
    setPatientForDeleteFlow(patient); // Pass the full patient object
    setShowDeleteFlow(true);
  };

  // Callback from DeletePatientFlow when deletion is successful
  const handleDeletionFlowSuccess = (deletedPatientId) => {
    fetchPatients(); // Re-fetch all patients to update the list
    if (selectedPatientId === deletedPatientId) {
      setSelectedPatientId(null);
      setSelectedPatientDetails(null);
      setData([]);
      setSteps(0);
      setEnvTemp(0);
    }
    // DeletePatientFlow handles its own success notification internally.
  };

  // Callback from DeletePatientFlow when it closes (either cancelled or notification faded)
  const handleDeletionFlowClose = () => {
    setShowDeleteFlow(false);
    setPatientForDeleteFlow(null); // Clear patient data
  };


  // --- Tailwind CSS Classes for consistency ---
  const pageBg = "min-h-screen bg-gradient-to-br from-blue-50 to-white font-sans text-gray-800";
  const containerPadding = "p-4 md:p-6 lg:p-20";
  const dashboardTitleClasses = "text-xl lg:text-2xl font-bold text-gray-800 mb-0 relative mt-[-5]";
  const summaryMetricCardClasses = "flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-blue-100";
  const chartCardClasses = "bg-white rounded-lg shadow-md p-4 lg:p-6 flex-1 m-1 min-w-[360px] lg:min-w-[calc(33.333%-8px)] h-[250px] transition-all";
  const chartTitleClasses = "text-lg md:text-base font-semibold text-gray-700 mb-3";
  const chartAxisLabelStyle = { fontSize: '0.6rem', fill: '#6b7280' };

  const patientSidebarClasses = "bg-white rounded-xl shadow-md p-6 lg:p-6 col-span-1 relative top-[-100px]";
  const patientDetailItemClasses = "flex items-center text-gray-700 text-sm mb-2";


  return (
    <div className={pageBg}>
      <Navbar2 logout={logout} />
      <br />
      <div className={containerPadding}>
        <h1 className={dashboardTitleClasses}>
          Knee Monitor Dashboard
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-2 justify-center relative top-[-15]">
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faShoePrints} className="text-blue-500 mr-3 text-lg" />
            <span className="text-base font-medium">
              Step Count: <span className="text-blue-600 font-bold">{steps}</span>
            </span>
          </div>
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faThermometerHalf} className="text-red-500 mr-3 text-lg" />
            <span className="text-base font-medium">
              Environment Temperature: <span className="text-red-600 font-bold">{envTemp.toFixed(2)} °C</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Chart components remain the same */}
              {/* Upper Leg Motion */}
              <div className={chartCardClasses}>
                <h3 className={chartTitleClasses}>Upper Leg Motion (m/s²)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                    <YAxis tickFormatter={formatAccel} style={chartAxisLabelStyle} />
                    <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '0px' }} />
                    <Line type="monotone" dataKey="avg_upper.ax" stroke="#ef4444" dot={false} name="Upper Ax" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_upper.ay" stroke="#3b82f6" dot={false} name="Upper Ay" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_upper.az" stroke="#22c55e" dot={false} name="Upper Az" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Upper Leg Rotation */}
              <div className={chartCardClasses}>
                <h3 className={chartTitleClasses}>Upper Leg Rotation (°/s)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                    <YAxis tickFormatter={formatGyro} style={chartAxisLabelStyle} />
                    <Tooltip labelFormatter={formatTime} formatter={formatGyro} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="avg_upper.gx" stroke="#f97316" dot={false} name="Upper Gx" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_upper.gy" stroke="#8b5cf6" dot={false} name="Upper Gy" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_upper.gz" stroke="#a16207" dot={false} name="Upper Gz" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Lower Leg Motion */}
              <div className={chartCardClasses}>
                <h3 className={chartTitleClasses}>Lower Leg Motion (m/s²)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                    <YAxis tickFormatter={formatAccel} style={chartAxisLabelStyle} />
                    <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="avg_lower.ax" stroke="#ef4444" dot={false} name="Lower Ax" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_lower.ay" stroke="#3b82f6" dot={false} name="Lower Ay" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_lower.az" stroke="#22c55e" dot={false} name="Lower Az" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Lower Leg Rotation */}
              <div className={chartCardClasses}>
                <h3 className={chartTitleClasses}>Lower Leg Rotation (°/s)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                    <YAxis tickFormatter={formatGyro} style={chartAxisLabelStyle} />
                    <Tooltip labelFormatter={formatTime} formatter={formatGyro} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="avg_lower.gx" stroke="#f97316" dot={false} name="Lower Gx" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_lower.gy" stroke="#8b5cf6" dot={false} name="Lower Gy" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_lower.gz" stroke="#a16207" dot={false} name="Lower Gz" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Knee Angle Chart */}
              <div className={chartCardClasses}>
                <h3 className={chartTitleClasses}>Knee Angle (°)</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                    <YAxis tickFormatter={formatDegrees} style={chartAxisLabelStyle} />
                    <Tooltip labelFormatter={formatTime} formatter={(v) => formatDegrees(v)} />
                    <Area type="monotone" dataKey="avg_knee_angle" stroke="#f97316" fill="#f9731640" dot={false} name="Knee Angle" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Knee Temperature Chart */}
              <div className={chartCardClasses}>
                <h3 className={chartTitleClasses}>Knee Temperature (°C)</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                    <YAxis tickFormatter={formatTemp} style={chartAxisLabelStyle} />
                    <Tooltip labelFormatter={formatTime} formatter={(v) => formatTemp(v)} />
                    <Area
                      type="monotone"
                      dataKey="avg_temperature.object"
                      stroke="#3b82f6"
                      fill="#3b82f640"
                      dot={false}
                      name="Object Temp"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Piezo Data Chart - NEW */}
              <div className={chartCardClasses}>
                <h3 className={chartTitleClasses}>Piezo/VAG Data</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="createdAt" tickFormatter={formatTime} style={chartAxisLabelStyle} />
                    <YAxis style={chartAxisLabelStyle} />
                    <Tooltip labelFormatter={formatTime} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="avg_piezo.raw" stroke="#ff7300" dot={false} name="Piezo Raw Avg" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_piezo.voltage" stroke="#8884d8" dot={false} name="Piezo Voltage Avg" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg_piezo.trigger_rate" stroke="#82ca9d" dot={false} name="Trigger Rate Avg" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>

          <div className="lg:col-span-1">
            <div className={patientSidebarClasses}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Patient Management</h2>

              {/* Patient Search Bar */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search patients by name, ID, or Device ID..."
                  className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Add Patient Button */}
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-colors mb-4"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add New Patient
              </button>

              {/* Patient List */}
              <div className="max-h-60 overflow-y-auto mb-6 border rounded-lg border-gray-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    patient.id && (
                      <div
                        key={patient.id}
                        className={`cursor-pointer p-3 border-b border-gray-100 hover:bg-blue-50 flex justify-between items-center ${
                          selectedPatientId === patient.id ? "bg-blue-100 font-semibold" : ""
                        }`}
                        onClick={() => handlePatientSelect(patient.id)}
                      >
                        <div>
                          {patient.name || "Unknown Name"} ({patient.id})
                          {patient.device_id && <div className="text-xs text-gray-500">Device: {patient.device_id}</div>}
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Edit Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEditPatient(patient); }}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-200 transition-colors"
                                title="Edit Patient"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            {/* Delete Button - Now opens the combined DeletePatientFlow */}
                            <button
                                onClick={(e) => { e.stopPropagation(); openDeletePatientFlow(patient); }}
                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-200 transition-colors"
                                title="Delete Patient"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  <p className="p-3 text-gray-500 text-sm">
                    {searchTerm ? "No matching patients found." : "Enter a search term to find patients."}
                  </p>
                )}
              </div>

              {/* Selected Patient Details Card */}
              <div className="bg-blue-50 rounded-lg p-4 shadow-inner border border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-3">
                  {selectedPatientDetails ? selectedPatientDetails.name : "No Patient Selected"}
                </h3>
                {selectedPatientDetails ? (
                  <>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                      ID: {selectedPatientDetails.id || "N/A"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faMicrochip} className="text-gray-500 mr-2" />
                      Device ID: {selectedPatientDetails.device_id || "None"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                      Age: {selectedPatientDetails.age || "N/A"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                      Gender: {selectedPatientDetails.gender || "N/A"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faHeartbeat} className="text-red-500 mr-2" />
                      Severity: {selectedPatientDetails.severityLevel || "N/A"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-green-500 mr-2" />
                      Last Clinic: {selectedPatientDetails.lastClinicDate ? new Date(selectedPatientDetails.lastClinicDate).toLocaleDateString() : "N/A"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-orange-500 mr-2" />
                      Next Clinic: {selectedPatientDetails.nextClinicDate ? new Date(selectedPatientDetails.nextClinicDate).toLocaleDateString() : "N/A"}
                    </div>
                     <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faUser} className="text-purple-500 mr-2" />
                      Doctor Reg No: {selectedPatientDetails.doctorRegNo || "N/A"}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Select a patient from the list above to view their details.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modals for Add/Edit Patient --- */}
      <AddPatientModal
        show={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onSuccess={handleAddPatientSuccess}
      />

      {patientToEdit && (
        <EditPatientModal
          show={showEditPatientModal}
          onClose={() => { setShowEditPatientModal(false); setPatientToEdit(null); }}
          patient={patientToEdit}
          onSuccess={handleEditPatientSuccess}
        />
      )}

      {/* --- Render the combined DeletePatientFlow component --- */}
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