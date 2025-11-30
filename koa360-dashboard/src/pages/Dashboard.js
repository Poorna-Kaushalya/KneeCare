import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import api from "../api/api";
import Navbar2 from "../components/SignInNavbar";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoePrints, faCloudSun, faSearch, faUser,
  faCalendarAlt, faHeartbeat, faMicrochip,
  faPlus, faEdit, faTrash,
  faPhone, faPills, faPrint
} from '@fortawesome/free-solid-svg-icons';

import AddPatientModal from '../components/AddPatientModal';
import EditPatientModal from '../components/EditPatientModal';
// 1. IMPORT THE NEW MEDICATION MODAL
import EditMedicationModal from '../components/EditMedicationModal'; 
import DeletePatientFlow from '../components/DeletePatientFlow';


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

  // NEW STATE: to control the context of the edit modal (full or medication only)
  const [editMode, setEditMode] = useState(null);

  // --- State for the combined DeletePatientFlow component ---
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [patientForDeleteFlow, setPatientForDeleteFlow] = useState(null);

  // State for data range selection 
  const [dataRange, setDataRange] = useState(7);

  const MAX_KNEE_ANGLE = 120;

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Format month and day
  const formatMonthDay = (timestamp) =>
    new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "2-digit",
    });

  const formatAccel = (value) => `${value.toFixed(2)} m/s²`;
  const formatDegrees = (value) => {
    let degrees = value;
    if (value >= 0 && value <= 1) {
      degrees = value * MAX_KNEE_ANGLE;
    }
    return degrees % 1 === 0 ? `${degrees}°` : `${degrees.toFixed(1)}°`;
  };
  const formatTemp = (value) => `${value.toFixed(1)}`;

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Error fetching patients:", err);
      if (err.response?.status === 401) {
        logout();
      }
    }
  }, [logout]);

  // Refactored fetchData to pre-calculate acceleration
  const fetchData = useCallback(async (patientId) => {
    if (!patientId) {
      setData([]);
      setSteps(0);
      setEnvTemp(0);
      return;
    }
    const patient = patients.find(p => p.id === patientId);
    const deviceId = patient?.device_id;
    try {
      const res = await api.get(`/api/sensor-datas?deviceId=${deviceId}&range=${dataRange}`);
      const allData = res.data;
      const lastPoints = allData.slice(-600).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const enrichedData = lastPoints.map(d => {
        const upperAccelMag = Math.sqrt(
          (d.avg_upper?.ax || 0) ** 2 + (d.avg_upper?.ay || 0) ** 2 + (d.avg_upper?.az || 0) ** 2
        );
        const lowerAccelMag = Math.sqrt(
          (d.avg_lower?.ax || 0) ** 2 + (d.avg_lower?.ay || 0) ** 2 + (d.avg_lower?.az || 0) ** 2
        );

        // Calculate a combined magnitude
        const gyroMag =
          Math.sqrt(
            (d.avg_upper?.gx || 0) ** 2 + (d.avg_upper?.gy || 0) ** 2 + (d.avg_upper?.gz || 0) ** 2
          ) +
          Math.sqrt(
            (d.avg_lower?.gx || 0) ** 2 + (d.avg_lower?.gy || 0) ** 2 + (d.avg_lower?.gz || 0) ** 2
          );
        const totalAccelGyroMag = upperAccelMag + lowerAccelMag + 0.5 * gyroMag;


        return {
          ...d,
          upperAccelMag: upperAccelMag,
          lowerAccelMag: lowerAccelMag,
          totalAccelGyroMag: totalAccelGyroMag
        };
      });

      setData(enrichedData);

      const stepMagnitudes = enrichedData.map(d => d.totalAccelGyroMag);

      let stepCount = 0;
      if (stepMagnitudes.length > 0) {
        const smoothMagnitudes = stepMagnitudes.map((val, i, arr) => {
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

      if (enrichedData.length > 0 && enrichedData[enrichedData.length - 1].avg_temperature?.ambient != null) {
        setEnvTemp(enrichedData[enrichedData.length - 1].avg_temperature.ambient);
      } else {
        setEnvTemp(0);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      } else if (err.response?.status === 404 && err.response?.data?.error?.includes("no device associated")) {
        console.warn(`No device data for patient ${patientId}:`, err.response.data.error);
        setData([]);
        setSteps(0);
        setEnvTemp(0);
      } else {
        console.error("Sensor data fetch error:", err);
        setData([]);
        setSteps(0);
        setEnvTemp(0);
      }
    }
  }, [logout, patients, dataRange]);

  // Data range 
  const rangeOptions = [
    { label: "Last 3 Days", value: 3 },
    { label: "Last Week", value: 7 },
  ];

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
  };

  // MODIFIED: Added optional 'mode' parameter, defaulting to 'full'
  const handleEditPatient = (patient, mode = 'full') => {
    setPatientToEdit(patient);
    setEditMode(mode); // Set the mode
    setShowEditPatientModal(true);
  };

  const handleEditPatientSuccess = () => {
    setShowEditPatientModal(false);
    setPatientToEdit(null);
    setEditMode(null); // Reset mode on success
    fetchPatients();
    if (selectedPatientId) {
      fetchPatientDetails(selectedPatientId);
    }
  };

  const openDeletePatientFlow = (patient) => {
    setPatientForDeleteFlow(patient);
    setShowDeleteFlow(true);
  };

  const handleDeletionFlowSuccess = (deletedPatientId) => {
    fetchPatients();
    if (selectedPatientId === deletedPatientId) {
      setSelectedPatientId(null);
      setSelectedPatientDetails(null);
      setData([]);
      setSteps(0);
      setEnvTemp(0);
    }
  };

  const handleDeletionFlowClose = () => {
    setShowDeleteFlow(false);
    setPatientForDeleteFlow(null);
  };
  
  // 2. DEFINE A COMMON CLOSE HANDLER FOR EDIT MODALS
  const handleCloseEditModal = () => {
    setShowEditPatientModal(false);
    setPatientToEdit(null);
    setEditMode(null);
  };


  // --- Tailwind CSS Classes for consistency ---
  const pageBg = "min-h-screen bg-gradient-to-br from-blue-50 to-white font-sans text-gray-800";
  const containerPadding = "p-4 md:p-6 lg:p-20";
  const dashboardTitleClasses = "text-xl lg:text-2xl font-bold text-gray-800 mb-0 relative mt-[-5]";
  const summaryMetricCardClasses = "flex items-center bg-white rounded-full px-2 py-1.5 shadow-xs border border-blue-100 md-0";
  const chartCardClasses = "bg-white rounded-lg shadow-md p-4 lg:p-6 h-[250px] transition-all";
  const chartTitleClasses = "text-lg md:text-base font-semibold text-gray-700 mb-3";
  const chartAxisLabelStyle = { fontSize: '0.6rem', fill: '#6b7280' };
  const patientSidebarClasses = "bg-white rounded-xl shadow-md p-6 lg:p-6 col-span-1 relative top-[-100px]";
  const patientDetailItemClasses = "flex items-center text-gray-700 text-xs mb-2";


  return (
    <div className={pageBg}>
      <Navbar2 logout={logout} />
      <br />
      <div className={containerPadding}>
        <h1 className={dashboardTitleClasses}>
          Knee Monitor Dashboard
        </h1>

        <div className="flex flex-wrap items-center gap-2 mb-1 relative top-4">
          <div className={summaryMetricCardClasses}>
            <span className="text-base text-sm mr-2">Period :</span>
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDataRange(option.value)}
                className={`px-2 py-1 rounded-full text-xs mr-1 font-semibold transition-colors ${dataRange === option.value
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faShoePrints} className="text-blue-400 mr-1 text-sm" />
            <span className="text-base text-sm">
              Step Count: &nbsp;<span className="text-black-600 font-bold">{steps}</span>
            </span>
          </div>
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faCloudSun} className="text-yellow-500 mr-1 text-sm" />
            <span className="text-base text-sm">
              Temperature: &nbsp;<span className="text-black-600 font-bold">{envTemp.toFixed(2)} °C</span>
            </span>
          </div>
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faHeartbeat} className="text-red-500 mr-1 text-sm" />
            <span className="text-base text-sm">
              Current Severity Level: &nbsp;<span className="text-red-700 font-bold text-sm">{selectedPatientDetails?.severityLevel || "N/A"} </span>
            </span>
          </div>
          <div className={summaryMetricCardClasses}>
            <FontAwesomeIcon icon={faMicrochip} className="text-gray-500 mr-1 text-sm" />
            <span className="text-base text-sm">
              Device ID: &nbsp;<span className="text-blue-600 font-bold text-sm">{selectedPatientDetails?.device_id || "N/A"} </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          <div className="lg:col-span-3">
            {!selectedPatientId ? (
              <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center justify-center text-center col-span-full min-h-[500px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Patient Selected</h3>
                <p className="text-gray-500 max-w-md">
                  Please select a patient from the list on the right to view their real-time knee monitoring data, detailed medical information, and activity insights.
                </p>
              </div>
            ) : (

              <>
                {/* Sensor data charts using a simplified 2x2 grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={chartCardClasses}>
                    <h3 className={chartTitleClasses}>Knee Motion ( m/s² )</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
                        <YAxis tickFormatter={formatAccel} style={chartAxisLabelStyle} />
                        <Tooltip labelFormatter={formatTime} formatter={formatAccel} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '0px' }} />
                        <Line type="monotone" dataKey="upperAccelMag" stroke="#ef4444" dot={false} name="Upper Leg Accel. Mag" strokeWidth={2} />
                        <Line type="monotone" dataKey="lowerAccelMag" stroke="#3b82f6" dot={false} name="Lower Leg Accel. Mag" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={chartCardClasses}>
                    <h3 className={chartTitleClasses}>Knee Angle (degrees)</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
                        <YAxis tickFormatter={formatDegrees} style={chartAxisLabelStyle} />
                        <Tooltip labelFormatter={formatTime} formatter={(v) => formatDegrees(v)} />
                        <Area type="monotone" dataKey="avg_knee_angle" stroke="#f97316" fill="#f9731640" dot={false} name="Knee Angle" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={chartCardClasses}>
                    <h3 className={chartTitleClasses}>Knee Temperature (°C)</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
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

                  <div className={chartCardClasses}>
                    <h3 className={chartTitleClasses}>Vibroarthrography (VAG)</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                        <XAxis dataKey="createdAt" tickFormatter={formatMonthDay} style={chartAxisLabelStyle} />
                        <YAxis style={chartAxisLabelStyle} />
                        <Tooltip labelFormatter={formatTime} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="avg_piezo.raw" stroke="#ff7300" dot={false} name="Piezo Raw Avg" strokeWidth={2} />
                        <Line type="monotone" dataKey="avg_piezo.voltage" stroke="#8884d8" dot={false} name="Piezo Voltage Avg" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* --- Current Medication Card (Moved & Updated with Edit Button) --- */}
                {selectedPatientDetails && (
                  <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mt-4">
                    <h3 className="text-lg md:text-base font-semibold text-gray-700 mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faPills} className="text-orange-500 mr-2" />
                        Current Medication
                      </div>
                      <button
                        // UPDATED: Pass 'medication' mode to handler
                        onClick={() => handleEditPatient(selectedPatientDetails, 'medication')}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-full transition-colors flex items-center shadow-md"
                        title="Update Medication"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" /> Update
                      </button>
                    </h3>
                    {selectedPatientDetails.medicationList && selectedPatientDetails.medicationList.length > 0 ? (
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {selectedPatientDetails.medicationList.map((med, index) => (
                          <li key={index}>{med}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No active medication listed. Click 'Update' to add medication.</p>
                    )}
                  </div>
                )}
              </>
            )}<br/><br/><br/><br/>
          </div>

          <div className="lg:col-span-1  mt-[-16px] relative top-0">
            <div className={patientSidebarClasses}>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Search Patients</h2>

              {/* Patient Search Bar */}
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search patients by name, ID, or Device ID..."
                  className="w-full pl-10 pr-4 py-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Add Patient Button */}
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-1 rounded-full flex items-center justify-center transition-colors mb-2"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add New Patient
              </button>

              {/* Patient List */}
              <div className="max-h-30 overflow-y-auto mb-2 border rounded-lg border-gray-200 text-sm">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    patient.id && (
                      <div
                        key={patient.id}
                        className={`cursor-pointer p-3 border-b border-gray-100 hover:bg-blue-50 flex justify-between items-center ${selectedPatientId === patient.id ? "bg-blue-100 font-semibold" : ""
                          }`}
                        onClick={() => handlePatientSelect(patient.id)}
                      >
                        <div>
                          {patient.name || "Unknown Name"} ({patient.id})
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            // UPDATED: Pass 'full' mode explicitly
                            onClick={(e) => { e.stopPropagation(); handleEditPatient(patient, 'full'); }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-200 transition-colors"
                            title="Edit Patient"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
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
              <div className="bg-blue-50 rounded-lg p-4 shadow-inner border border-blue-200 text-sm">
                <p className="text-lg font-bold text-blue-800 mb-3 "><center>
                  {selectedPatientDetails ? selectedPatientDetails.name : "No Patient Selected"}</center>
                </p>
                {selectedPatientDetails ? (
                  <>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                      ID: {selectedPatientDetails.id || "N/A"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                      Age: {selectedPatientDetails.age || "N/A"}
                    </div>
                    <div className={patientDetailItemClasses}>
                      <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                      Gender: {selectedPatientDetails.gender || "N/A"}
                    </div>
                    {selectedPatientDetails.contact && (
                      <div className={patientDetailItemClasses}>
                        <FontAwesomeIcon icon={faPhone} className="text-green-500 mr-2" />
                        Contact: {selectedPatientDetails.contact}
                      </div>
                    )}
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
                    {selectedPatientDetails.assignedDoctorName && (
                      <div className={patientDetailItemClasses}>
                        <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                        Assigned Doctor: {selectedPatientDetails.assignedDoctorName}
                      </div>
                    )}

                    {/* --- Print/Export Patient Report Button --- */}
                    <button
                      onClick={() => alert("Print/Export functionality coming soon!")}
                      className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-colors"
                    >
                      <FontAwesomeIcon icon={faPrint} className="mr-2" />
                      Print / Export Report
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Select a patient from the list above to view their details.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Add/Edit Patient --- */}
      <AddPatientModal
        show={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onSuccess={handleAddPatientSuccess}
      />

      {/* 3. CONDITIONAL RENDERING FOR EDIT MODALS */}

      {/* Renders the full patient edit modal only when editMode is 'full' */}
      {patientToEdit && editMode === 'full' && (
        <EditPatientModal
          show={showEditPatientModal}
          onClose={handleCloseEditModal}
          patient={patientToEdit}
          onSuccess={handleEditPatientSuccess}
          // The 'editMode' prop is no longer strictly necessary here if EditPatientModal is now ONLY for full edits,
          // but leaving it in or removing it depends on how EditPatientModal is structured. 
          // For a clean split, you can remove it if EditPatientModal no longer handles the 'medication' case.
        />
      )}

      {/* Renders the new medication-only edit modal when editMode is 'medication' */}
      {patientToEdit && editMode === 'medication' && (
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