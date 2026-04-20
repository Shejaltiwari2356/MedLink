// Filename: Dashboard2.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import {
  Zap,
  XCircle,
  CheckCircle,
  Video,
  Loader,
  CalendarDays,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react"; // Added more icons

// Import all necessary components (Assuming these exist)
import Navbar from "./Navbar";
import Sidebar2 from "./Sidebar2";
import Profile from "./Profile";
import PaymentDoc from "./PaymentDoc";
import DoctorsPortal from "./DoctorsPortal";
import DoctorAppointments from "./DoctorAppointments";
import Help from "./Help";
const API_BASE_URL = "http://localhost:5000/api";
const SOCKET_SERVER_URL = "http://localhost:5000";

const useAuth = () => {
  const rawToken = localStorage.getItem("token");
  const storedUniqueId = localStorage.getItem("uniqueId");

  const authToken = rawToken ? `Bearer ${rawToken}` : null;
  const isAuthenticated = !!rawToken && !!storedUniqueId;

  return {
    doctorId: storedUniqueId,
    authToken,
    isAuthenticated,
  };
};

// --- Helper Functions (StatCard, getStatusStyle) ---
// Enhanced StatCard for better design
const StatCard = ({
  title,
  value,
  color,
  icon: Icon,
  children,
  className = "",
}) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between ${className}`}
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      {Icon && <Icon size={20} className={`text-${color.split("-")[1]}-500`} />}
    </div>
    <p className={`text-3xl font-bold ${color} `}>{value}</p>
    {children && <div className="mt-2 text-sm text-gray-600">{children}</div>}
  </div>
);

const getStatusStyle = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "pending":
      return "bg-indigo-100 text-indigo-800 border-indigo-300";
    case "completed":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// --- Main Dashboard Component ---

const Dashboard2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctorId, authToken, isAuthenticated } = useAuth();

  const uniqueId =
    doctorId || localStorage.getItem("uniqueId") || location.state?.uniqueId;
  const websiteName = "MedLink";

  // --- State Initialization ---
  const [isAvailable, setIsAvailable] = useState(false); // DB isInstantOnline status
  const [patientIdInput, setPatientIdInput] = useState("");
  const [activeItem, setActiveItem] = useState("Home");
  const [dbAvailability, setDbAvailability] = useState({
    isInstantOnline: false,
    isLockedForConsultation: false,
  });
  const [todaysAppointments, setTodaysAppointments] = useState(null);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [pendingConsults, setPendingConsults] = useState([]); // Holds incoming alerts
  const [statusLoading, setStatusLoading] = useState(true); // Added status loading state

  // =======================================================================
  // 🚨 SOCKET.IO ALERT LOGIC (RECEIVING ALERTS) 🚨
  // =======================================================================
  useEffect(() => {
    if (!uniqueId || !isAuthenticated) return;

    const socket = io(SOCKET_SERVER_URL);

    // 1. Join Alert Room
    socket.on("connect", () => {
      console.log("Alert Socket Connected.");
      socket.emit("join_alert_room", uniqueId);
    });

    // 2. Listen for incoming alerts
    socket.on("incoming_consult", (data) => {
      setPendingConsults((prev) => {
        if (!prev.some((c) => c.sessionId === data.sessionId)) {
          alert(`🚨 NEW CALL: Patient ${data.patientId} is waiting!`);
          return [...prev, data];
        }
        return prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [uniqueId, isAuthenticated]);

  // 🟢 FUNCTION: Doctor Joins Call (Triggered by the Alert UI)
  const handleJoinCall = async (sessionId) => {
    if (!authToken) {
      alert("Authentication failed. Please log in.");
      return;
    }

    try {
      // 1. API Call: Marks the session as 'active' (server-side)
      await axios.post(
        `${API_BASE_URL}/consult/${sessionId}/join-doctor`,
        {},
        { headers: { Authorization: authToken } }
      );

      // 2. Remove alert and redirect to the video component
      setPendingConsults((prev) =>
        prev.filter((c) => c.sessionId !== sessionId)
      );

      navigate(`/call/${sessionId}`, {
        replace: true,
        state: { userId: uniqueId }, // Pass doctorId as userId
      });
    } catch (error) {
      alert(
        `Failed to join call: ${
          error.response?.data?.message ||
          "Server error. Session may have timed out."
        }`
      );
    }
  };
  // =======================================================================

  // --- Other Utility Functions (fetch status/appointments) ---
  const fetchDoctorStatus = async () => {
    if (!uniqueId || !authToken) {
      setStatusLoading(false);
      return;
    }
    setStatusLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/consult/status`, {
        headers: { Authorization: authToken },
      });
      const statusData = response.data;

      setDbAvailability(statusData);
      setIsAvailable(statusData.isInstantOnline);
    } catch (error) {
      console.error(
        "Failed to fetch initial status:",
        error.response?.data?.message || error.message
      );
      // Default to offline if API fails
      setDbAvailability({
        isInstantOnline: false,
        isLockedForConsultation: false,
      });
      setIsAvailable(false);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchTodaysAppointments = async () => {
    if (!uniqueId || !authToken) {
      setAppointmentsLoading(false);
      return;
    }
    setAppointmentsLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/appointments/doctor/today/${uniqueId}`,
        {
          headers: { Authorization: authToken },
        }
      );
      setTodaysAppointments(response.data);
    } catch (error) {
      console.error("Failed to fetch today's appointments:", error);
      setTodaysAppointments([]); // Set to empty array on error
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    setActiveItem("Home");
    fetchDoctorStatus();
    fetchTodaysAppointments();
  }, [uniqueId, authToken]);

  const handleAvailabilityToggle = async () => {
    const newState = !isAvailable;
    const action = newState ? "go-online" : "go-offline";
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/consult/toggle-instant-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: action }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsAvailable(newState);
        setDbAvailability({
          isInstantOnline: data.isInstantOnline,
          isLockedForConsultation: data.isLockedForConsultation,
        });
        console.log(
          `Availability toggled to: ${newState ? "ONLINE" : "OFFLINE"} via API.`
        );
      } else {
        const error = await res.json();
        alert(`Failed to change status: ${error.message}`);
      }
    } catch (error) {
      alert("Network error while toggling availability.");
    }
  };

  // --- NEW COMPONENT: Renders the incoming alerts ---
  const IncomingAlertsUI = () => {
    if (pendingConsults.length === 0) return null;

    return (
      <div className="p-6 bg-red-50 border-4 border-red-600 rounded-xl shadow-2xl space-y-4 animate-pulse">
        <p className="font-extrabold text-2xl text-red-800 flex items-center">
          <Zap size={30} className="text-red-600 mr-3" /> INCOMING INSTANT
          CONSULTATION!
        </p>
        {pendingConsults.map((session) => (
          <div
            key={session.sessionId}
            className="flex flex-col md:flex-row items-center justify-between p-3 bg-red-100 rounded-lg border border-red-300"
          >
            <div className="text-red-700">
              <p className="font-semibold">Patient ID: {session.patientId}</p>
              <p className="text-sm">
                Status: Patient is waiting for you to join.
              </p>
            </div>
            <button
              onClick={() => handleJoinCall(session.sessionId)}
              className="mt-2 md:mt-0 px-6 py-2 bg-red-600 text-white font-extrabold text-md rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
            >
              <Video size={20} className="mr-2" /> JOIN CALL NOW
            </button>
          </div>
        ))}
      </div>
    );
  };

  // This function renders the main content based on the active item
  const renderContent = () => {
    const DoctorHomeDashboardContent = (
      <div className="space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 border-b pb-4">
          👨‍⚕️ Doctor Command Center
        </h1>

        {/* --- 1. Top Section: Instant Consult Toggle & Alerts --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instant Consult Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Zap size={24} className="text-indigo-500 mr-2" /> Instant
                Consult Status
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isAvailable}
                  onChange={handleAvailabilityToggle}
                  disabled={dbAvailability.isLockedForConsultation} // Disable if busy
                />
                <div
                  className={`w-14 h-8 rounded-full peer transition-all duration-300 ${
                    isAvailable ? "bg-green-600" : "bg-gray-400"
                  } ${
                    dbAvailability.isLockedForConsultation &&
                    isAvailable &&
                    "bg-yellow-500 cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                      isAvailable ? "translate-x-6" : "translate-x-0"
                    } peer-checked:bg-white flex items-center justify-center`}
                  >
                    {isAvailable ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <XCircle size={18} className="text-gray-400" />
                    )}
                  </span>
                </div>
                <span className="ml-3 text-base font-medium text-gray-700">
                  {isAvailable ? "ONLINE" : "OFFLINE"}
                </span>
              </label>
            </div>
            {dbAvailability.isLockedForConsultation && isAvailable ? (
              <p className="text-sm font-bold text-yellow-600 flex items-center mt-2">
                <AlertTriangle size={16} className="mr-1" /> Currently in a
                session. Not available for new instant calls.
              </p>
            ) : (
              <p
                className={`text-sm font-bold ${
                  isAvailable ? "text-green-600" : "text-red-600"
                } flex items-center mt-2`}
              >
                {isAvailable ? (
                  <>
                    <CheckCircle size={16} className="mr-1" /> Ready for
                    Emergency Consultations
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="mr-1" /> Not accepting Instant
                    Consultations
                  </>
                )}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Toggle to control your availability for urgent patient calls.
            </p>
          </div>

          {/* Pending Alerts Card */}
          <StatCard
            title="Pending Emergency Alerts"
            value={
              pendingConsults.length > 0
                ? `${pendingConsults.length} ACTIVE`
                : "NONE"
            }
            color={
              pendingConsults.length > 0
                ? "text-red-600 animate-pulse"
                : "text-green-600"
            }
            icon={pendingConsults.length > 0 ? Zap : CheckCircle}
            className={
              pendingConsults.length > 0
                ? "bg-red-50 border-red-300 shadow-xl"
                : ""
            }
          >
            {pendingConsults.length > 0 ? (
              <p className="text-red-700 font-semibold">
                Urgent attention required!
              </p>
            ) : (
              <p className="text-green-700">No immediate alerts.</p>
            )}
          </StatCard>
        </div>

        {/* Render Incoming Alerts UI only if there are pending consultations */}
        <IncomingAlertsUI />

        {/* --- 2. Appointments Today Stat Card --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <StatCard
            title="Appointments Today"
            value={
              appointmentsLoading ? (
                <Loader size={24} className="animate-spin text-indigo-500" />
              ) : todaysAppointments ? (
                todaysAppointments.length
              ) : (
                0
              )
            }
            color="text-indigo-600"
            icon={CalendarDays}
          >
            <p className="text-gray-600">Total scheduled for today.</p>
          </StatCard>
          {/* Add more stat cards here if needed, e.g., "Total Patients", "Earnings Today" */}
        </div>

        {/* --- 3. Next Sessions List --- */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Clock size={24} className="mr-3 text-indigo-600" /> Upcoming
            Sessions Today
          </h2>
          <ul className="divide-y divide-gray-200">
            {appointmentsLoading && (
              <li className="py-6 text-center text-gray-500 flex justify-center items-center">
                <Loader size={20} className="animate-spin mr-3" /> Loading
                Today's Appointments...
              </li>
            )}

            {!appointmentsLoading &&
              todaysAppointments &&
              todaysAppointments.length === 0 && (
                <li className="py-8 text-center text-gray-600 font-semibold text-lg">
                  🎉 No scheduled appointments for today. Enjoy your day!
                </li>
              )}

            {todaysAppointments &&
              todaysAppointments.length > 0 &&
              todaysAppointments.map((appt) => (
                <li
                  key={appt._id}
                  className="py-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-center hover:bg-gray-50 px-3 rounded-lg transition-colors duration-200"
                >
                  {/* Time */}
                  <div className="flex items-center text-lg font-bold text-gray-900">
                    <Clock size={20} className="text-indigo-500 mr-2" />
                    {appt.time}
                  </div>
                  {/* Patient Info */}
                  <div className="md:col-span-2">
                    <p className="text-lg font-semibold text-gray-900 flex items-center">
                      <User size={18} className="text-gray-600 mr-2" />
                      {appt.patientName} (ID: {appt.patientId})
                    </p>
                    <p className="text-sm text-gray-500 ml-7">
                      Reason: {appt.problem}
                    </p>
                  </div>
                  {/* Status */}
                  <div className="flex items-center justify-end md:justify-start">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(
                        appt.status
                      )}`}
                    >
                      {appt.status}
                    </span>
                  </div>
                  {/* Action Button */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      className="px-5 py-2 bg-green-600 text-white text-base font-medium rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center"
                      onClick={() => {
                        setPatientIdInput(appt.patientId);
                        setActiveItem("Consultation Portal"); // Go to portal to view details
                      }}
                    >
                      <Video size={18} className="mr-2" /> Start Session
                    </button>
                  </div>
                </li>
              ))}
          </ul>
          <p className="mt-6 text-right text-sm text-gray-600 border-t pt-4">
            For a complete overview and historical data, navigate to 'Today's
            Appointments' in the sidebar.
          </p>
        </div>
      </div>
    );
    // --- End Dashboard Home Content ---

    // --- Content for other pages ---
    const AvailabilityCalendarContent = (
      <div className="p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          📅 Availability & Slot Management
        </h2>
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <p className="font-semibold text-indigo-800 mb-2">
            Calendar Functionality Placeholder:
          </p>
          <p className="text-sm text-indigo-700">
            This area manages your standard working hours.
          </p>
        </div>
      </div>
    );

    switch (activeItem) {
      case "Profile Settings":
        return <Profile />;
      case "Consultation Portal":
        return (
          <DoctorsPortal doctorId={uniqueId} patientIdToLoad={patientIdInput} />
        );
      case "View Appointments":
        return <DoctorAppointments doctorId={uniqueId} />;
      case "Availability Calendar":
        return AvailabilityCalendarContent;
      case "Payment & Earnings":
        return <PaymentDoc doctorId={uniqueId} />;
      case "Help":
        return <Help />;
      case "Home":
      default:
        return DoctorHomeDashboardContent;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 font-sans">
      <Navbar websiteName={websiteName} uniqueId={uniqueId} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar2
          activeItem={activeItem}
          setActiveItem={setActiveItem}
          onMenuSelect={setActiveItem}
        />

        <main className="flex-1 p-8 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Dashboard2;
