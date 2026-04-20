import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  HeartPulse,
  Calendar,
  SquarePlus,
  AlertTriangle,
  Brain,
  CalendarCheck,
  Clock,
  History,
  Video,
} from "lucide-react";
import Help from "./Help";

// --- Import Utilities ---
import { useAuth } from "../utils/authUtils";

// --- Import Layout and Content Components (Assuming these files exist) ---
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AddVitals from "./AddVitals";
import ViewVitals from "./ViewVitals";
import AnalyseVitals from "./AnalyseVitals";
import BloodReports from "./BloodReports";
import Prescription from "./Prescription";
import Profile from "./Profile";
import PatientAppointments from "./PatientAppointment";
// import PaymentSection from "./PaymentSection";
import Diagnosis from "./Diagnosis";
import DoctorList from "./DoctorList";

const API_BASE_URL = "http://localhost:5000/api";

// =======================================================================
// 🟢 INSTANT CONSULTATION COMPONENT (FEE FIX APPLIED)
// =======================================================================
const InstantConsultation = () => {
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Uses the STABLE useAuth hook
  const { patientId, authToken, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setError("You must be logged in to view available doctors.");
      setLoading(false);
      return;
    }

    const fetchOnlineDoctors = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/consult/live-doctors`,
          {
            headers: {
              Authorization: authToken,
            },
          }
        );
        setAvailableDoctors(response.data.doctors);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching online doctors:", err);
        if (err.response && err.response.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError("Failed to load available doctors. Please try again.");
        }
        setLoading(false);
      }
    };

    fetchOnlineDoctors();
  }, [authToken, isAuthenticated, logout]); // Dependencies are stable from useAuth

  // Function signature accepts the full 'doctor' object
  const handleStartConsult = async (doctor) => {
    if (!isAuthenticated) {
      alert("Please log in to start a consultation.");
      return;
    }

    // Extract required data safely
    const doctorId = doctor.uniqueId;
    const doctorName = doctor.lastName;

    // Extract and safely parse the fee
    const rawFeeValue = doctor.fees ?? "0";
    const numericFee = parseFloat(
      rawFeeValue.toString().replace(/[^0-9.]/g, "")
    );

    if (isNaN(numericFee) || numericFee <= 0) {
      alert("Invalid consultation fee detected. Cannot proceed.");
      return;
    }

    const confirmStart = window.confirm(
      `Start instant call with Dr. ${doctorName} for ₹${numericFee}?`
    );
    if (!confirmStart) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/consult/initiate`,
        {
          doctorId: doctorId,
          patientId: patientId,
          fee: numericFee, // Fee is correctly included
          type: "video",
        },
        {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
          },
        }
      );

      const { sessionId, message } = response.data;

      alert(message);

      // Redirect patient to the live consultation room
      window.location.href = `/consult/live?session=${sessionId}&doctor=${doctorId}`;
    } catch (err) {
      console.error("Error starting consultation:", err);
      const errorMessage =
        err.response?.data?.message || "Server error occurred.";
      alert(`Could not start consultation: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow border-l-4 border-blue-600">
        <h2>Connecting...</h2>
        <p className="mt-2 text-gray-700">Checking for available doctors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border-l-4 border-red-600 text-red-800 rounded-xl shadow">
        <h2 className="text-xl font-bold">Error</h2>
        <p>
          {error}{" "}
          {error.includes("log in") && (
            <a href="/login" className="text-blue-600 underline">
              Go to Login
            </a>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="instant-consultation-container p-6 bg-white rounded-xl shadow">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        🟢 Instant Teleconsultation
      </h2>

      {availableDoctors.length === 0 ? (
        <div className="no-doctors p-8 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-lg font-semibold text-gray-600">
            No doctors are currently available for instant consultation.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please check back later or use "Book Appointment" for scheduled
            care.
          </p>
        </div>
      ) : (
        <div className="doctor-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDoctors.map((doctor) => (
            <div
              key={doctor.uniqueId}
              className="doctor-card p-4 rounded-xl shadow-lg border-2 border-green-500 bg-emerald-50"
            >
              <div className="status-indicator text-green-700 font-bold mb-2">
                <span style={{ color: "green", fontSize: "1.5em" }}>•</span>{" "}
                ONLINE
              </div>

              <h3 className="text-xl font-bold text-gray-900">{`Dr. ${doctor.firstName} ${doctor.lastName}`}</h3>
              <p className="text-blue-700">
                Specialization: <strong>{doctor.specialization}</strong>
              </p>
              <p className="text-gray-600">
                Fees: <strong>₹{doctor.fees || "N/A"}</strong>
              </p>

              <button
                className="mt-3 w-full px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                onClick={() => handleStartConsult(doctor)} // Passing the full 'doctor' object
                disabled={!isAuthenticated}
              >
                Start Instant Consult
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Placeholder/Content Components ---
// const Help = () => (
//   <div className="p-6 bg-white rounded-xl shadow">
//     <h2>Help & Support</h2>
//     <p>FAQ and Contact Information.</p>
//   </div>
// );

// =======================================================================
// 🛑 CRITICAL FIX: NEW FUNCTION TO OVERRIDE BACKEND STATUS FOR SAFETY
// =======================================================================

/**
 * Client-side validation for Blood Pressure and other critical vitals.
 * This overrides the backend status if a critical value is detected.
 * @param {string} name - The name of the vital (e.g., "Blood Pressure").
 * @param {string} value - The raw value (e.g., "50/32", "98.6").
 * @param {string} backendStatus - The status sent by the API.
 * @returns {string} The corrected status ("Critical", "Warning", or "Normal").
 */
const getCorrectedVitalStatus = (name, value, backendStatus) => {
  // 1. Prioritize any CRITICAL status sent by the backend.
  if (backendStatus === "Critical") {
    return "Critical";
  }

  // 2. Specific override logic for Blood Pressure (BP)
  if (name === "Blood Pressure" && value.includes("/")) {
    const [systolic, diastolic] = value
      .split("/")
      .map((n) => parseFloat(n.trim()));

    // Check for dangerously low BP (Hypotension Crisis)
    // Systolic < 70 or Diastolic < 40 is an emergency. We use common clinical low-cutoffs.
    if (systolic < 70 || diastolic < 40) {
      return "Critical";
    }

    // Check for general low BP (Hypotension) - Typically below 90/60
    if (systolic < 90 || diastolic < 60) {
      return "Warning";
    }

    // Check for very high BP (Hypertensive Crisis) - Systolic > 180 OR Diastolic > 120
    if (systolic > 180 || diastolic > 120) {
      return "Critical";
    }

    // Check for general high BP (Hypertension Stage 2) - Systolic > 140 OR Diastolic > 90
    if (systolic > 140 || diastolic > 90) {
      return "Warning";
    }
  }

  // 3. Add checks for other vitals (e.g., Heart Rate, Temperature) if necessary.
  // Example: For Temperature (using F):
  // if (name === "Temperature" && parseFloat(value) > 103) return "Critical";

  // 4. If no client-side override, use the backend's status.
  return backendStatus;
};

// --- WIDGET HELPER FUNCTIONS ---
const getStatusColor = (status) => {
  switch (status) {
    case "Normal":
      return "bg-emerald-50 border-emerald-600 text-emerald-800";
    case "Warning":
      return "bg-amber-50 border-amber-600 text-amber-800";
    case "Critical":
      return "bg-rose-100 border-red-700 text-red-900 animate-pulse";
    default:
      return "bg-gray-100 border-gray-500 text-gray-700";
  }
};

// --- WIDGET COMPONENTS (VitalsCard, QuickActionCard, AppointmentCard remain unchanged) ---

const VitalsCard = ({ vital }) => {
  // 🛑 FIX: Use the client-side corrected status instead of the one from the API
  const correctedStatus = getCorrectedVitalStatus(
    vital.name,
    vital.value,
    vital.status
  );
  const colorClass = getStatusColor(correctedStatus);

  return (
    <div
      className={`p-6 rounded-xl shadow-lg border-l-4 ${colorClass} transition-shadow duration-300 hover:shadow-xl`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold uppercase">{vital.name}</h3>
        <HeartPulse size={20} className="opacity-75" />
      </div>
      <p className="text-4xl font-extrabold">{vital.value}</p>
      <p className="text-sm">
        {vital.unit} - <span className="font-bold">{correctedStatus}</span>
      </p>{" "}
      {/* Display corrected status */}
    </div>
  );
};

const QuickActionCard = ({
  title,
  icon: Icon,
  onClick,
  isEmergency = false,
}) => (
  <div
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-6 rounded-xl shadow-md cursor-pointer transition-all duration-200 border active:scale-95 ${
      isEmergency
        ? "bg-red-50 border-red-600 hover:bg-red-100 hover:shadow-lg"
        : "bg-white border-gray-200 hover:bg-blue-50 hover:shadow-lg"
    }`}
  >
    <Icon
      size={32}
      className={`${isEmergency ? "text-red-600" : "text-blue-600"} mb-2`}
    />
    <p
      className={`text-center font-semibold ${
        isEmergency ? "text-red-800" : "text-gray-800"
      }`}
    >
      {title}
    </p>
  </div>
);

// --- DYNAMIC APPOINTMENT CARD (Includes final date/time parsing fix) ---
const AppointmentCard = ({ appt, loading, setActiveItem }) => {
  if (loading) {
    return (
      <div className="p-6 bg-blue-700 text-white rounded-xl shadow-lg md:col-span-2 flex flex-col justify-between animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <Clock size={24} className="animate-spin" />
          <h3 className="text-lg font-semibold">Fetching Appointment...</h3>
        </div>
        <div className="h-6 w-3/4 bg-blue-600 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-blue-600 rounded"></div>
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="p-6 bg-white border border-dashed border-gray-300 rounded-xl shadow-inner md:col-span-2 flex flex-col justify-center items-center space-y-4">
        <CalendarCheck size={32} className="text-gray-400" />
        <p className="text-lg font-semibold text-gray-600">
          No Upcoming Appointments
        </p>
        <button
          onClick={() => setActiveItem("Book Appointment")}
          className="self-center px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-lg"
        >
          Book Your First Appointment
        </button>
      </div>
    );
  }

  let appointmentDate = "Invalid Date";

  const startTimeMatch = appt.time
    ? appt.time.match(/(\d{1,2}:\d{2})\s*(AM|PM)/i)
    : null;

  if (startTimeMatch && appt.date) {
    const timeString = startTimeMatch[1];
    const ampm = startTimeMatch[2].toUpperCase();

    let [hour, minute] = timeString.split(":").map(Number);

    if (ampm === "PM" && hour !== 12) {
      hour += 12;
    } else if (ampm === "AM" && hour === 12) {
      hour = 0;
    }

    const hour24 = String(hour).padStart(2, "0");
    const minuteStr = String(minute).padStart(2, "0");

    const isoDateTimeString = `${appt.date}T${hour24}:${minuteStr}:00`;

    appointmentDate = new Date(isoDateTimeString);
  }

  const formattedDate =
    appointmentDate.toString() === "Invalid Date"
      ? "Invalid Date - Parsing Failed"
      : appointmentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

  return (
    <div className="p-6 bg-blue-600 text-white rounded-xl shadow-lg md:col-span-2 flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <Calendar size={24} />
          <h3 className="text-lg font-semibold">Next Appointment</h3>
        </div>
        <p className="text-3xl font-bold mb-1">
          {appt.doctorName} ({appt.specialization})
        </p>
        <p className="text-xl font-medium mb-4">{formattedDate}</p>
      </div>
      <button
        onClick={() => setActiveItem("View Appointments")}
        className="self-start px-6 py-3 bg-white text-blue-700 font-bold rounded-full hover:bg-gray-100 transition-colors duration-200 shadow-md"
      >
        View Details / Join Call
      </button>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  // 🛑 FIX: Use useAuth here to get patientId/uniqueId in a stable way
  const { patientId } = useAuth();
  const uniqueId = patientId; // Use the stable ID from the hook

  const websiteName = "MedLink";
  const [activeItem, setActiveItem] = useState("Home");

  // State for fetching vitals data
  const [recentVitals, setRecentVitals] = useState([]);
  const [vitalsLoading, setVitalsLoading] = useState(true);

  // NEW STATE: To store the date/time of the most recent vital sign
  const [vitalsLastUpdated, setVitalsLastUpdated] = useState(null);

  // State for fetching latest appointment data
  const [latestAppointment, setLatestAppointment] = useState(null);
  const [apptLoading, setApptLoading] = useState(true);

  const [isCriticalAlert, setIsCriticalAlert] = useState(false);

  // --- API FETCH LOGIC ---
  useEffect(() => {
    let isMounted = true;

    const fetchVitals = async () => {
      if (!uniqueId) {
        setRecentVitals([]);
        setVitalsLastUpdated(null);
        setVitalsLoading(false);
        return;
      }

      setVitalsLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/vitals/recent/${uniqueId}`
        );

        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 404 || res.status === 204) {
            setRecentVitals([]);
            setVitalsLastUpdated(null);
            return;
          }
          throw new Error(`API returned status: ${res.status}`);
        }

        const data = await res.json();
        const vitalsArray = data || [];

        setRecentVitals(vitalsArray);

        if (vitalsArray.length > 0 && vitalsArray[0].timestamp) {
          setVitalsLastUpdated(vitalsArray[0].timestamp);
        } else {
          setVitalsLastUpdated(null);
        }
      } catch (error) {
        console.error("Failed to fetch recent vitals:", error);
        if (isMounted) {
          setRecentVitals([]);
          setVitalsLastUpdated(null);
        }
      } finally {
        if (isMounted) {
          setVitalsLoading(false);
        }
      }
    };

    const fetchLatestAppointment = async () => {
      // ... (Appointment fetching logic is unchanged)
      if (!uniqueId) {
        setLatestAppointment(null);
        setApptLoading(false);
        return;
      }

      setApptLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/appointments/patient/latest-upcoming/${uniqueId}`
        );

        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 404) {
            setLatestAppointment(null);
            return;
          }
          throw new Error(`API returned status: ${res.status}`);
        }

        const data = await res.json();
        setLatestAppointment(data);
      } catch (error) {
        console.error("Failed to fetch latest appointment:", error);
        setLatestAppointment(null);
      } finally {
        if (isMounted) {
          setApptLoading(false);
        }
      }
    };

    fetchVitals();
    fetchLatestAppointment();

    return () => {
      isMounted = false;
    };
  }, [uniqueId]);

  // --- ALERT LOGIC (Critical Only) ---
  useEffect(() => {
    // 🛑 FIX: Check the *corrected* status for the alert
    const isUrgent = recentVitals.some(
      (v) => getCorrectedVitalStatus(v.name, v.value, v.status) === "Critical"
    );
    setIsCriticalAlert(isUrgent);
  }, [recentVitals]);

  // --- Utility Functions (unchanged) ---
  const getVitalsSource = () => {
    if (vitalsLoading) return "Loading...";
    if (recentVitals.length > 0) return "Fetched from API";
    return "No Vitals Records Found";
  };

  // UTILITY FUNCTION: Format the timestamp for display
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Invalid timestamp format:", timestamp, e);
      return null;
    }
  };

  const EMERGENCY_NUMBER = "tel:999";
  const handleEmergencyCall = () => {
    window.location.href = EMERGENCY_NUMBER;
  };

  // HANDLER: For emergency tele-consultation
  const handleTeleConsultClick = () => {
    setActiveItem("Emergency Tele-Consult");
  };

  const handleActionClick = (item) => {
    setActiveItem(item);
  };

  const displayVitals = recentVitals;
  const lastUpdatedDisplay = formatLastUpdated(vitalsLastUpdated);

  // This function renders the main content based on the active item
  const renderContent = () => {
    switch (activeItem) {
      // Vitals
      case "Add Vitals":
        return <AddVitals />;
      case "View Vitals":
        return <ViewVitals />;
      case "Analyse Vitals":
        return <AnalyseVitals />;
      // Appointments
      case "View Appointments":
        return (
          <PatientAppointments
            patientId={uniqueId}
            setActiveItem={setActiveItem}
          />
        );
      case "Book Appointment":
        return <DoctorList patientId={uniqueId} />;
      // Records/Data
      case "Prescription":
        return <Prescription />;
      case "Blood Reports":
        return <BloodReports />;
      case "Symptom Checker":
        return <Diagnosis />;

      // 🟢 INTEGRATED COMPONENT: Renders the instant consult logic
      case "Emergency Tele-Consult":
        return <InstantConsultation />;

      // Profile/Misc
      // case "Payment":
      //   return <PaymentSection patientId={uniqueId} />;
      case "Profile":
        return <Profile />;
      case "Help":
        return <Help />;

      case "Home":
      default:
        return (
          <div className="space-y-8">
            {/* 1. EMERGENCY ALERT BANNER */}
            {isCriticalAlert && (
              <div className="p-6 bg-red-700 text-white rounded-xl shadow-2xl flex flex-col md:flex-row items-center justify-between animate-pulse space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <AlertTriangle size={30} className="text-white" />
                  <p className="font-extrabold text-xl md:text-2xl text-center md:text-left">
                    CRITICAL ALERT: Abnormal Vitals Detected!
                  </p>
                </div>
                <button
                  onClick={handleTeleConsultClick}
                  className="px-6 py-3 bg-white text-red-700 font-extrabold text-lg rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  🚨 Start Emergency Tele-Consult
                </button>
              </div>
            )}

            <h2 className="text-3xl font-bold text-gray-800">
              Welcome back, {uniqueId} 👋
            </h2>

            {/* 2. QUICK ACTIONS (Grid Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {/* DYNAMIC APPOINTMENT CARD USAGE */}
              <AppointmentCard
                appt={latestAppointment}
                loading={apptLoading}
                setActiveItem={setActiveItem}
              />

              {/* NEW QUICK ACTION CARD: Emergency Tele-Consult */}
              <QuickActionCard
                title="Emergency Tele-Consult"
                icon={Video}
                onClick={handleTeleConsultClick}
                isEmergency={true} // Triggers red styling
              />

              {/* COMBINED CARD: Record Vitals + Symptom Checker */}
              <div className="bg-white shadow-md rounded-xl overflow-hidden flex flex-col divide-y divide-gray-200">
                <button
                  onClick={() => handleActionClick("Add Vitals")}
                  className="flex items-center justify-center flex-1 py-5 hover:bg-gray-50 transition"
                >
                  <SquarePlus className="mr-2 text-blue-500" size={20} />
                  <span className="font-semibold text-gray-800">
                    Record Vitals
                  </span>
                </button>

                <button
                  onClick={() => handleActionClick("Symptom Checker")}
                  className="flex items-center justify-center flex-1 py-5 hover:bg-gray-50 transition"
                >
                  <Brain className="mr-2 text-green-500" size={20} />
                  <span className="font-semibold text-gray-800">
                    Symptom Checker
                  </span>
                </button>
              </div>
            </div>

            {/* 3. VITALS OVERVIEW (Color-Coded) */}
            <h3 className="text-2xl font-semibold text-gray-800 pt-4 flex items-center justify-between">
              <div>
                Latest Vitals Summary
                <span className="text-sm text-gray-500 italic ml-2">
                  ({getVitalsSource()})
                </span>
              </div>
              {lastUpdatedDisplay && (
                <div className="flex items-center text-sm font-medium text-gray-600">
                  <History size={16} className="mr-1 text-blue-500" />
                  Last Recorded: {lastUpdatedDisplay}
                </div>
              )}
            </h3>
            {vitalsLoading ? (
              <div className="flex items-center space-x-3 text-blue-600">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Fetching vital signs...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {displayVitals.length > 0 ? (
                  displayVitals.map((vital) => (
                    <VitalsCard key={vital.name} vital={vital} />
                  ))
                ) : (
                  <div className="md:col-span-4 p-8 bg-white text-gray-500 text-center rounded-xl shadow border-2 border-dashed border-gray-300">
                    No recent vital signs recorded for this patient.
                  </div>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 font-sans">
      <Navbar websiteName={websiteName} uniqueId={uniqueId} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeItem={activeItem}
          setActiveItem={setActiveItem}
          onMenuSelect={setActiveItem}
        />

        <main className="flex-1 p-8 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
