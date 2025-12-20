import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import api from "../api/api";
import Navbar2 from "../components/SignInNavbar";
import LoginBG from "../images/LoginBG.jpg"; 

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoePrints, faCloudSun, faSearch, faUser,
  faCalendarAlt, faHeartbeat, faMicrochip,
  faPlus, faEdit, faTrash, faTimes,
  faPhone, faPills, faPrint, faChartLine 
} from '@fortawesome/free-solid-svg-icons';

import AddPatientModal from '../components/AddPatientModal';
import EditPatientModal from '../components/EditPatientModal';
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

  // State to control the context of the edit modal (full or medication only)
  const [editMode, setEditMode] = useState(null);

  // State for the combined DeletePatientFlow component
  const [showDeleteFlow, setShowDeleteFlow] = useState(false);
  const [patientForDeleteFlow, setPatientForDeleteFlow] = useState(null);

  // State for data range selection
  const [dataRange, setDataRange] = useState(7);
  
  // --- NEW STATE FOR OVERLAY VISIBILITY ---
  const [showEmptyStateOverlay, setShowEmptyStateOverlay] = useState(true);

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
            (d.avg_lower?.gy || 0) ** 2 + (d.avg_lower?.gy || 0) ** 2 + (d.avg_lower?.gz || 0) ** 2
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

  // Helper function to check if a patient matches the search term
  const isPatientMatch = useCallback((patient) => {
    if (!searchTerm) return false;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const patientName = patient.name?.toLowerCase() || "";
    const patientId = patient.id?.toLowerCase() || "";
    const patientDeviceId = patient.device_id?.toLowerCase() || "";

    return (
        patientName.includes(lowerCaseSearchTerm) ||
        patientId.includes(lowerCaseSearchTerm) ||
        patientDeviceId.includes(lowerCaseSearchTerm)
    );
  }, [searchTerm]);

  useEffect(() => {
    // If we are searching, filter the list
    if (searchTerm === "") {
      setFilteredPatients([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const newFilteredPatients = patients.filter(isPatientMatch);
      setFilteredPatients(newFilteredPatients);

      // Automatic selection logic (optional but helpful)
      if (newFilteredPatients.length === 1 && selectedPatientId !== newFilteredPatients[0].id) {
        // Only auto-select if no patient is currently selected (or if the selected one is filtered out)
        if (!selectedPatientId || !newFilteredPatients.some(p => p.id === selectedPatientId)) {
             setSelectedPatientId(newFilteredPatients[0].id);
             // When a patient is auto-selected, the overlay should hide
             setShowEmptyStateOverlay(false);
        }
      }
    }

    // Always clear patient details if the selected patient is no longer in the list (e.g., deleted or search term changed)
    if (
        selectedPatientId &&
        !patients.some(p => p.id === selectedPatientId) &&
        !filteredPatients.some(p => p.id === selectedPatientId)
      ) {
        setSelectedPatientId(null);
        setSelectedPatientDetails(null);
        // If selection is cleared, show the overlay again
        setShowEmptyStateOverlay(true);
      } else if (searchTerm && filteredPatients.length === 0) {
        // ... (Keep the existing patient selected unless they manually select a new one or clear search.)
      }
  }, [searchTerm, patients, selectedPatientId, filteredPatients.length, isPatientMatch]);

  useEffect(() => {
    fetchData(selectedPatientId);
    fetchPatientDetails(selectedPatientId);
    // Ensure overlay hides if a patient is selected (e.g., via direct URL or state persistence)
    if (selectedPatientId) {
        setShowEmptyStateOverlay(false);
    } else {
        setShowEmptyStateOverlay(true);
    }

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
    setSearchTerm(""); // Clear search when selecting
    setFilteredPatients([]); // Clear filtered list
    setShowEmptyStateOverlay(false); // Hide the overlay
  };


  // --- CRUD Handlers ---
  const handleAddPatientSuccess = () => {
    setShowAddPatientModal(false);
    fetchPatients();
  };

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
      // Show overlay if the deleted patient was the one selected
      setShowEmptyStateOverlay(true);
    }
  };

  const handleDeletionFlowClose = () => {
    setShowDeleteFlow(false);
    setPatientForDeleteFlow(null);
  };

  // DEFINE A COMMON CLOSE HANDLER FOR EDIT/DELETE MODALS
  const handleCloseEditModal = () => {
    setShowEditPatientModal(false);
    setPatientToEdit(null);
    setEditMode(null);
  };

  // Handler to close the central search overlay
  const handleCloseSearchOverlay = () => {
    // 1. Hide the overlay card
    setShowEmptyStateOverlay(false);
    // 2. Clear any active search term/results
    setSearchTerm("");
    setFilteredPatients([]);
  };

  // --- Tailwind CSS Classes for consistency ---
  const pageBg = "min-h-screen bg-gradient-to-br from-blue-50 to-white font-sans text-gray-800";
  const containerPadding = "p-4 md:p-6 lg:p-20";
  const dashboardTitleClasses = "text-xl lg:text-2xl font-bold text-gray-800 mb-0 relative mt-[-5]";
  const summaryMetricCardClasses = "flex items-center bg-white rounded-full px-2 py-1.5 shadow-xs border border-blue-100 md-0";
  const chartCardClasses = "bg-white rounded-lg shadow-md p-4 lg:p-6 h-[250px] transition-all";
  const chartTitleClasses = "text-lg md:text-base font-semibold text-gray-700 mb-3";
  const chartAxisLabelStyle = { fontSize: '0.6rem', fill: '#6b7280' };
  const patientSidebarClasses = "bg-white rounded-xl shadow-md p-6 lg:p-6 col-span-1 relative z-30";
  const patientDetailItemClasses = "flex items-center text-gray-700 text-xs mb-2";

  // Determine if the blur/overlay should be active
  // The dashboard is blurred only if NO patient is selected AND the overlay is currently visible.
  const isBlurredState = !selectedPatientId && showEmptyStateOverlay;

  return (
    <div className={pageBg} >
      <div className="sticky top-0 z-[50] bg-white shadow-md"> 
         <Navbar2 logout={logout} />
      </div>
      <br />
      <div className={containerPadding}>

        {/*
          --- BLUR/OVERLAY CONTAINER: This div holds everything except the Navbar.
          It applies blur and a dimming effect when the dashboard is in the starting (blurred) state.
        */}
        <div className={`relative ${isBlurredState ? 'filter blur-sm pointer-events-none' : ''}`}>

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

          {/* --- MAIN GRID LAYOUT: Parent of the Main Content and Sidebar --- */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">

            {/* LEFT COLUMN: Main Dashboard Content (Charts/Medication) */}
            <div className="lg:col-span-3">
              {/* If no patient is selected, show a placeholder in the blurred background. 
                 If a patient IS selected, show the charts.
              */}
              {selectedPatientId ? (
                // Selected Patient Dashboard Content
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
              ) : (
                // EMPTY STATE PLACEHOLDER for the main content area
                <div className="h-[500px] bg-white rounded-lg shadow-md border-t-8 border-blue-500 flex flex-col items-center justify-center text-center p-8">
                    <FontAwesomeIcon icon={faChartLine} className="text-blue-400 text-6xl mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Select the patient to display data</h2>
                    <p className="text-lg text-gray-500 max-w-md">
                        Use the search tool or patient list on the right to select a patient.
                    </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Patient Search and Details */}
            <div className="lg:col-span-1 mt-[-16px] relative z-30">
              <div className={patientSidebarClasses}>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Search Patients</h2>

                {/* MODIFIED SIDEBAR CONTENT WHEN NO PATIENT IS SELECTED (and no overlay is shown) */}
                {!selectedPatientId && !showEmptyStateOverlay ? (
                     <p className="text-sm text-gray-500 mb-2">
                        Select a patient from the list below, or <span 
                            className="text-blue-500 cursor-pointer hover:underline font-medium" 
                            onClick={() => setShowEmptyStateOverlay(true)}
                        >
                            use the central search tool.
                        </span>
                     </p>
                ) : (
                    // Show search bar if a patient is selected, or if the overlay is visible (though we use the one in the overlay)
                    !isBlurredState && ( 
                      <div className="relative mb-2 pointer-events-auto">
                        <input
                          type="text"
                          placeholder="Search patients by name, ID, or Device ID..."
                          className="w-full pl-10 pr-4 py-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    )
                )}


                {/* Add Patient Button (Always visible on sidebar for quick access) */}
                <button
                  onClick={() => setShowAddPatientModal(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-1 rounded-full flex items-center justify-center transition-colors mb-2"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add New Patient
                </button>

                {/* Patient List (Shows filtered results) */}
                <div className="max-h-96 overflow-y-auto mb-2 border rounded-lg border-gray-200 text-sm">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      patient.id && (
                        <div
                          key={patient.id}
                          className={`cursor-pointer p-3 border-b border-gray-100 hover:bg-blue-50 flex justify-between items-center pointer-events-auto ${selectedPatientId === patient.id ? "bg-blue-100 font-semibold" : ""
                            }`}
                          onClick={() => handlePatientSelect(patient.id)}
                        >
                          <div>
                            {patient.name || "Unknown Name"} ({patient.id})
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
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

        {/* --- CENTRAL OVERLAY CARD  */}
        {selectedPatientId === null && showEmptyStateOverlay && (
          <div className="absolute inset-0 flex items-center justify-center z-50 p-4">

            <div 
              className="p-6 rounded-lg shadow-2xl text-center max-w-4xl w-full border-t-8 border-blue-500 relative bg-cover bg-center overflow-hidden" 
              style={{ backgroundImage: `url(${LoginBG})` }}
            >
              
              {/* Semi-transparent white overlay for readability (opacity-80) */}
              <div className="absolute inset-0 bg-white opacity-80"></div>
              
              {/* Content wrapper with higher z-index to sit on top of the overlay */}
              <div className="relative z-10"> 

                {/* --- CLOSE BUTTON --- */}
                <button 
                    onClick={handleCloseSearchOverlay} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-2 pointer-events-auto" 
                    title="Close Search"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                
                <h1 className="text-4xl font-extrabold text-blue-600 mb-2">KneeCare</h1>
                <p className="text-xl text-gray-600 mb-8">Patient Monitoring System</p>

                {/* TWO COLUMN GRID FOR SEARCH/REGISTER AND PATIENT LIST */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                  
                  {/* LEFT COLUMN: Search and Register */}
                  <div className="bg-blue-50 p-6 rounded-lg shadow-inner flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-4 text-left">Find or Register Patient</h3>
                      
                      {/* --- SEARCH BOX --- */}
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Enter patient name or ID to search..."
                          className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-base pointer-events-auto"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                      </div>
                      {/* --- END SEARCH BOX --- */}

                      {/* Display message based on search results */}
                      {searchTerm && filteredPatients.length === 0 && (
                          <p className="text-sm text-red-500 mb-4 text-left">No matching patients found in the database. Try refining your search.</p>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-6 text-left">
                          Select an existing patient from the list on the right, or register a new one to begin monitoring.
                      </p>
                    </div>

                    {/* Register Button at the bottom */}
                    <button
                      onClick={() => setShowAddPatientModal(true)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-colors shadow-lg mt-4 pointer-events-auto"
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" /> Register a New Patient
                    </button>
                  </div>
                  
                  {/* RIGHT COLUMN: All Patients List (Scrollable Card) */}
                  <div className="flex flex-col">
                      <h3 className="text-xl font-semibold text-gray-700 mb-4 text-left">All Registered Patients</h3>
                      
                      {/* SCROLLABLE CARD CONTAINER (max-h-[300px] allows the inner list to scroll) */}
                      <div className="max-h-[300px] overflow-y-auto mb-2 border rounded-lg border-gray-200 text-sm bg-white shadow-inner">
                        {patients.length > 0 ? (
                            // Display ALL patients, regardless of search term
                            patients.map((patient) => (
                                patient.id && (
                                  <div
                                      key={patient.id}
                                      className={`cursor-pointer p-3 border-b border-gray-100 flex justify-between items-center hover:bg-blue-50 transition-colors pointer-events-auto 
                                          ${selectedPatientId === patient.id ? "bg-blue-100 font-semibold" : ""} 
                                          ${isPatientMatch(patient) ? "border-l-4 border-blue-500 bg-blue-50" : ""}`}
                                      onClick={() => handlePatientSelect(patient.id)}
                                  >
                                      {/* Highlight matching patients */}
                                      <div className={isPatientMatch(patient) ? "font-bold text-blue-700" : ""}>
                                          {patient.name || "Unknown Name"} ({patient.id})
                                      </div>

                                      {/* EDIT AND DELETE BUTTONS */}
                                      <div className="flex items-center space-x-2 ml-4">
                                          <button
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
                                      {/* END EDIT/DELETE BUTTONS */}
                                  </div>
                                )
                            ))
                        ) : (
                            <p className="p-3 text-gray-500 text-sm">
                                No patients available. Please register a new patient on the left.
                            </p>
                        )}
                      </div>
                      {patients.length > 0 && (
                          <p className="text-xs text-gray-500 text-left mt-1">
                              Total Patients: {patients.length} 
                              {searchTerm && filteredPatients.length > 0 ? ` | Matches: ${filteredPatients.length}` : ''}
                          </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Modals (rendered outside the main content flow for overlay) --- */}
      <AddPatientModal
        show={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        onSuccess={handleAddPatientSuccess}
      />

      {/* Renders the full patient edit modal only when editMode is 'full' */}
      {patientToEdit && editMode === 'full' && (
        <EditPatientModal
          show={showEditPatientModal}
          onClose={handleCloseEditModal}
          patient={patientToEdit}
          onSuccess={handleEditPatientSuccess}
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