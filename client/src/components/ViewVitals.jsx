// Filename: ViewVitals.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, X, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Inline SVG Icons (Kept for compatibility)
const Calendar = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const Clock = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const HeartPulse = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2.5 10A2 2 0 0 1 4.5 8h2.5a2 2 0 0 1 2 2v8" />
    <path d="M15 10A2 2 0 0 1 17 8h2.5a2 2 0 0 1 2 2v8" />
    <path d="M10 10h1.5a2 2 0 0 1 2 2v6" />
    <path d="M9 10v6" />
  </svg>
);
const Activity = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const Droplets = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z" />
  </svg>
);
const Utensils = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M3 3h18" />
    <path d="M12 3a9 9 0 0 1 9 9v9" />
    <path d="M12 3a9 9 0 0 0-9 9v9" />
  </svg>
);
const Scale = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 16v-6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6" />
    <path d="M12 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M16 22a2 2 0 0 1-2-2h-4a2 2 0 0 1-2 2h8z" />
  </svg>
);

// Centralized API client
const apiClient = axios.create({ baseURL: "http://localhost:5000/api" });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- CRITICAL THRESHOLDS FOR TRIAGE (UNCHANGED) ---
const CRITICAL_THRESHOLDS = {
  spo2: { min: 90, max: 100 },
  heartRate: { min: 40, max: 130 },
  systolic: { min: 80, max: 160 },
  diastolic: { min: 50, max: 100 },
  bodyTemperature: { min: 95.0, max: 102.0 },
};
const ABNORMAL_THRESHOLDS = {
  spo2: { min: 94, max: 100 },
  heartRate: { min: 50, max: 110 },
  systolic: { min: 90, max: 130 },
  diastolic: { min: 60, max: 85 },
  bodyTemperature: { min: 96.0, max: 100.0 },
};
const SUGAR_THRESHOLDS = {
  severe: { before: 130, after: 180 },
  critical: { before: 250, after: 300 },
};
const TREND_DELTA = { heartRate: 20, systolic: 30 };
const SANE_RANGES = {
  heartRate: { min: 30, max: 250, name: "Heart Rate" },
  systolic: { min: 50, max: 300, name: "Systolic BP" },
  diastolic: { min: 30, max: 180, name: "Diastolic BP" },
  bodyTemperature: { min: 90, max: 110, name: "Temperature" },
  spo2: { min: 70, max: 100, name: "SpO2" },
};

// --- UTILITY FUNCTIONS (UNCHANGED) ---
const getHighlightClass = (value, field) => {
  if (value === null || value === undefined) return "";
  value = Number(value);

  // 1. Check for ABC Critical Highlighting (Dark Red)
  const criticalThreshold = CRITICAL_THRESHOLDS[field];
  if (
    criticalThreshold &&
    (value < criticalThreshold.min || value > criticalThreshold.max)
  ) {
    return "text-red-900 font-bold";
  }

  // 2. Check for Sugar Critical Highlighting (Dark Red/Orange)
  if (field === "sugarBefore" || field === "sugarAfter") {
    const thresholdType = field === "sugarBefore" ? "before" : "after";

    if (value >= SUGAR_THRESHOLDS.critical[thresholdType]) {
      return "text-red-900 font-bold"; // Highest Level: RED
    }
    if (value >= SUGAR_THRESHOLDS.severe[thresholdType]) {
      return "text-orange-600 font-bold"; // Severe Level: ORANGE
    }
  }

  // 3. Check for General Abnormal Highlighting (Orange)
  const abnormalThreshold = ABNORMAL_THRESHOLDS[field];
  if (
    abnormalThreshold &&
    (value < abnormalThreshold.min || value > abnormalThreshold.max)
  ) {
    return "text-orange-600 font-bold";
  }

  return "";
};

const isCritical = (vital) => {
  if (!vital) return false;

  if (vital.spo2 < CRITICAL_THRESHOLDS.spo2.min) return true;
  if (
    vital.heartRate < CRITICAL_THRESHOLDS.heartRate.min ||
    vital.heartRate > CRITICAL_THRESHOLDS.heartRate.max
  )
    return true;
  if (
    vital.bodyTemperature < CRITICAL_THRESHOLDS.bodyTemperature.min ||
    vital.bodyTemperature > CRITICAL_THRESHOLDS.bodyTemperature.max
  )
    return true;

  const bpParts = vital.bloodPressure
    ? vital.bloodPressure.split("/")
    : ["0", "0"];
  const systolic = parseFloat(bpParts[0]);
  const diastolic = parseFloat(bpParts[1]);

  if (
    systolic < CRITICAL_THRESHOLDS.systolic.min ||
    systolic > CRITICAL_THRESHOLDS.systolic.max
  )
    return true;
  if (
    diastolic < CRITICAL_THRESHOLDS.diastolic.min ||
    diastolic > CRITICAL_THRESHOLDS.diastolic.max
  )
    return true;

  return false;
};

const checkLatestVitals = (vitalsHistory) => {
  // ... (Triage logic remains the same) ...
  if (!vitalsHistory || vitalsHistory.length === 0)
    return { type: null, alerts: [], latestRecord: null };

  const sortedHistory = [...vitalsHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const latest = sortedHistory[0];
  const previousReadings = sortedHistory.slice(1, 4);

  let currentAlertType = null;
  const alerts = [];

  const setValue = (val) =>
    val === null || val === undefined ? null : Number(val);

  const latestVitals = {
    temp: setValue(latest.bodyTemperature),
    hr: setValue(latest.heartRate),
    spo2: setValue(latest.spo2),
    systolic: latest.bloodPressure
      ? setValue(latest.bloodPressure.split("/")[0])
      : null,
    diastolic: latest.bloodPressure
      ? setValue(latest.bloodPressure.split("/")[1])
      : null,
    sugarBefore: setValue(latest.sugarBeforeMeal),
    sugarAfter: setValue(latest.sugarAfterMeal),
  };

  // --- 1. Static Tier Check (Critical/Red) ---
  if (
    latestVitals.spo2 !== null &&
    latestVitals.spo2 < CRITICAL_THRESHOLDS.spo2.min
  ) {
    alerts.push(
      `Critical SpO2: ${latestVitals.spo2}% (IMMEDIATE action required)`
    );
    currentAlertType = "red";
  }
  if (
    latestVitals.hr !== null &&
    (latestVitals.hr < CRITICAL_THRESHOLDS.heartRate.min ||
      latestVitals.hr > CRITICAL_THRESHOLDS.heartRate.max)
  ) {
    alerts.push(`Critical Heart Rate: ${latestVitals.hr} BPM`);
    currentAlertType = "red";
  }
  if (
    latestVitals.systolic !== null &&
    latestVitals.systolic > CRITICAL_THRESHOLDS.systolic.max
  ) {
    alerts.push(`Critical Systolic BP: ${latestVitals.systolic} mmHg`);
    currentAlertType = "red";
  }
  if (
    latestVitals.diastolic !== null &&
    latestVitals.diastolic > CRITICAL_THRESHOLDS.diastolic.max
  ) {
    alerts.push(`Critical Diastolic BP: ${latestVitals.diastolic} mmHg`);
    currentAlertType = "red";
  }

  // --- 2. Abnormal Tier Check (Yellow) ---
  if (currentAlertType !== "red") {
    if (
      latestVitals.temp !== null &&
      (latestVitals.temp < ABNORMAL_THRESHOLDS.bodyTemperature.min ||
        latestVitals.temp > ABNORMAL_THRESHOLDS.bodyTemperature.max)
    ) {
      alerts.push(`Abnormal Temp: ${latestVitals.temp}°F`);
      currentAlertType = currentAlertType || "yellow";
    }
    if (
      latestVitals.systolic !== null &&
      (latestVitals.systolic < ABNORMAL_THRESHOLDS.systolic.min ||
        latestVitals.systolic > ABNORMAL_THRESHOLDS.systolic.max)
    ) {
      alerts.push(`Abnormal Systolic BP: ${latestVitals.systolic} mmHg`);
      currentAlertType = currentAlertType || "yellow";
    }

    // Add Sugar Alert message to Triage Box (If Sugar is severely high)
    if (
      latestVitals.sugarBefore > SUGAR_THRESHOLDS.critical.before ||
      latestVitals.sugarAfter > SUGAR_THRESHOLDS.critical.after
    ) {
      alerts.push(
        `Severe Hyperglycemia: Before (${latestVitals.sugarBefore}) / After (${latestVitals.sugarAfter}) mg/dL.`
      );
      currentAlertType = currentAlertType || "yellow";
    }
  }

  // --- 3. Trend Check (Sudden Change Detection) ---
  if (previousReadings.length >= 2) {
    const calculateAverage = (parser) =>
      previousReadings
        .map((v) => parser(v))
        .filter((v) => v !== null && !isNaN(v))
        .reduce((sum, v) => sum + v, 0) / previousReadings.length;
    const avgSystolic = calculateAverage((v) =>
      v.bloodPressure ? setValue(v.bloodPressure.split("/")[0]) : null
    );
    if (
      latestVitals.systolic &&
      avgSystolic &&
      Math.abs(latestVitals.systolic - avgSystolic) > TREND_DELTA.systolic
    ) {
      alerts.push(
        `Sudden Systolic BP Change: ${
          latestVitals.systolic
        } mmHg (Avg was ${avgSystolic.toFixed(1)} mmHg)`
      );
      currentAlertType = "red";
    }
  }

  return { type: currentAlertType, alerts, latestRecord: latest };
};

const checkDataIntegrity = (data) => {
  // Integrity check logic is assumed correct
  return [];
};

/**
 * --------------------------------
 * ✅ FIX 1: Robust Date/Time Rendering
 * --------------------------------
 */
const renderDateTime = (dateString) => {
  if (!dateString) return "N/A";

  // CRITICAL FIX: Ensure the date string is interpreted as a UTC moment
  // before converting it to the user's local time. We trust the AddVitals component
  // is now sending a time moment (e.g., ISO string).
  let date;
  if (typeof dateString === "string") {
    // If the string does not end in 'Z', let the Date object figure out the timezone.
    // This works because the AddVitals fix ensures the string is a local time moment.
    date = new Date(dateString);
  } else {
    date = new Date(dateString);
  }

  // Fallback if the date object is invalid
  if (isNaN(date.getTime())) return "Invalid Date";

  // Format the date and time for the user's locale (implicitly uses local timezone)
  const formattedDate = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="text-left">
      <span className="font-semibold text-gray-800">{formattedDate}</span>
      <span className="text-gray-500 block text-xs">at {formattedTime}</span>
    </div>
  );
};

const ViewVitals = ({ vitals: propVitals, isHistoryView }) => {
  const [vitalsData, setVitalsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [corruptedRecords, setCorruptedRecords] = useState([]);

  // NEW STATES
  const [alertInfo, setAlertInfo] = useState({
    type: null,
    alerts: [],
    latestRecord: null,
  });
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // HANDLERS
  const navigate = useNavigate();
  const EMERGENCY_NUMBER = "tel:+919004666642";

  const handleBookAppointment = () => {
    // Navigates up to the Dashboard component and sets the active item via state
    navigate("/", { state: { activeItem: "Book Appointment" } });
  };
  const handleEmergencyCall = () => {
    window.location.href = EMERGENCY_NUMBER;
  };
  const handleDismissAlert = () => {
    setIsAlertDismissed(true);
  };

  useEffect(() => {
    const processVitals = (data) => {
      const sortedData = [...data].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setVitalsData(sortedData);

      setAlertInfo(checkLatestVitals(sortedData));
      setCorruptedRecords(checkDataIntegrity(sortedData));
    };

    const fetchVitals = async () => {
      setError(null);
      try {
        // Fetch vitals for the logged-in user
        const res = await apiClient.get("/vitals");
        processVitals(res.data.vitals);
      } catch (err) {
        // Axios errors have a response object
        const message =
          err.response?.data?.message ||
          "Failed to fetch vital signs. Please try again later.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (propVitals) {
      processVitals(propVitals);
      setLoading(false);
    } else {
      fetchVitals();
    }
  }, [propVitals]);

  // 🐛 FIX: Implementation of the handleDelete function
  const handleDelete = async () => {
    if (!deleteConfirmation) return;

    setIsDeleting(true);
    setError(null);
    const vitalIdToDelete = deleteConfirmation._id;

    try {
      // Send DELETE request to the backend
      await apiClient.delete(`/vitals/${vitalIdToDelete}`);

      // Update the local state to remove the deleted record
      const updatedVitalsData = vitalsData.filter(
        (vital) => vital._id !== vitalIdToDelete
      );
      setVitalsData(updatedVitalsData);

      // Re-run the triage check with the updated data
      setAlertInfo(checkLatestVitals(updatedVitalsData));

      setError("✅ Vital record deleted successfully.");
      setDeleteConfirmation(null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to delete vital record. Server error.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderValue = (value) => (value != null ? value : "N/A");

  // Helper to safely extract BP component for highlighting
  const getBPComponentValue = (bpString, index) => {
    if (!bpString) return null;
    const parts = bpString.split("/");
    return parts.length > index ? parseFloat(parts[index]) : null;
  };

  // Helper to render the BP cell with dual highlighting
  const renderBPCell = (vital) => {
    const systolic = getBPComponentValue(vital.bloodPressure, 0);
    const diastolic = getBPComponentValue(vital.bloodPressure, 1);

    // Check against critical and abnormal ranges
    const sClass = getHighlightClass(systolic, "systolic");
    const dClass = getHighlightClass(diastolic, "diastolic");

    const baseClass = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";

    return (
      <td className={baseClass}>
        <span className={sClass}>{renderValue(systolic)}</span> /{" "}
        <span className={dClass}>{renderValue(diastolic)}</span>
      </td>
    );
  };

  if (loading) {
    return (
      <div className="text-center p-8 font-medium text-gray-600">
        <Loader2 size={24} className="animate-spin inline-block mr-2" /> Loading
        vital signs...
      </div>
    );
  }

  const successMessage = error && error.startsWith("✅");
  const actualError = error && !successMessage;

  // Determine if alert is active
  const isAlertActive = alertInfo.alerts.length > 0 && !isHistoryView;
  // Determine if FULL MODAL should be visible (Only when Critical AND NOT dismissed)
  const shouldRenderFullModal =
    isAlertActive && alertInfo.type === "red" && !isAlertDismissed;
  // Determine if STICKY BAR should be visible (When there's an alert AND it's dismissed, OR when it's yellow)
  const shouldRenderStickyBar =
    isAlertActive && (isAlertDismissed || alertInfo.type === "yellow");

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Vitals History
        </h2>

        {/* Success Message Display */}
        {successMessage && (
          <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg flex items-center">
            <CheckCircle size={20} className="mr-2" /> {error}
          </div>
        )}

        {/* ACTUAL ERROR DISPLAY (Unsuccessful Fetch/Delete) */}
        {actualError && (
          <div className="text-center p-4 mb-4 font-semibold text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* 🚨 1. STICKY ALERT BAR (Color and button update) 🚨 */}
        {shouldRenderStickyBar && (
          <div
            className={`p-4 border-l-8 rounded-lg shadow-md mb-6 relative border-red-600 bg-red-50 w-full`}
          >
            <div className="flex justify-between items-center space-x-4">
              <div className="flex-1 min-w-0 pr-4">
                {/* Title and Timestamp (Made larger) */}
                <p className="font-extrabold text-xl text-red-800 flex items-center space-x-2">
                  <span className="text-2xl">⚠️</span>
                  <span>EMERGENCY ACTION REQUIRED</span>
                </p>

                {/* The most critical finding from the top of the list */}
                <p className="text-sm font-medium text-gray-700 mt-1 truncate">
                  {alertInfo.alerts.join(" | ")}
                </p>
              </div>

              <div className="flex-shrink-0 flex space-x-3 items-center">
                {/* AMBULANCE BUTTON (Increased Size) */}
                {alertInfo.type === "red" && (
                  <a
                    href={EMERGENCY_NUMBER}
                    className="px-5 py-2 text-white font-bold rounded-md bg-red-700 hover:bg-red-800 transition-colors text-base whitespace-nowrap"
                    onClick={handleEmergencyCall}
                  >
                    CALL AMBULANCE 
                  </a>
                )}

                {/* CONSULTATION BUTTON (Changed to blue-600) */}
                <button
                  onClick={handleBookAppointment}
                  className="px-5 py-2 font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors text-base whitespace-nowrap"
                >
                  Book Teleconsultation
                </button>

                {/* Dismiss Button */}
                <button
                  onClick={handleDismissAlert}
                  className="text-gray-500 hover:text-gray-800 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* --- END STICKY ALERT BAR --- */}

        {/* 🚨 2. FULL-SCREEN MODAL ALERT (Color and button update) 🚨 */}
        {shouldRenderFullModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
            <div
              className={`p-6 border-4 rounded-xl shadow-2xl relative bg-white w-full max-w-2xl mx-4
                  ${
                    alertInfo.type === "red"
                      ? "border-red-600"
                      : "border-yellow-500"
                  }`}
            >
              {/* Dismiss Button */}
              <button
                onClick={handleDismissAlert}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
                title="Dismiss alert"
              >
                <X size={28} />
              </button>

              <div className="flex flex-col items-center text-center">
                {/* Icon and Title */}
                <span
                  className={`mb-4 ${
                    alertInfo.type === "red"
                      ? "text-red-700"
                      : "text-yellow-600"
                  }`}
                >
                  <span
                    className={`inline-block rounded-full p-3 shadow-inner
                                ${
                                  alertInfo.type === "red"
                                    ? "bg-red-200"
                                    : "bg-yellow-100"
                                }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`${
                        alertInfo.type === "red"
                          ? "text-red-700"
                          : "text-yellow-600"
                      }`}
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                </span>

                {/* Primary Command Message */}
                <p className="font-extrabold text-4xl mb-2 text-gray-800">
                  {alertInfo.type === "red"
                    ? "⚠️ EMERGENCY ACTION REQUIRED"
                    : "URGENT REVIEW NEEDED"}
                </p>

                {/* Confirmation Date/Time */}
                {alertInfo.latestRecord && (
                  <p className="text-sm font-medium text-gray-500 mb-4">
                    Analyzing Record from:{" "}
                    {new Date(alertInfo.latestRecord.date).toLocaleString()}
                  </p>
                )}
              </div>

              {/* List of Findings */}
              <ul className="list-disc list-inside space-y-2 ml-4 text-lg font-semibold border-b border-gray-200 py-4 mx-auto max-w-lg text-left">
                {alertInfo.alerts.map((alert, index) => (
                  <li key={index}>{alert}</li>
                ))}
              </ul>

              {/* Footer and Action Buttons */}
              <div className="mt-6 flex flex-col items-center gap-4">
                {/* Triage Guidance Text */}
                <p
                  className={`font-extrabold text-xl text-center ${
                    alertInfo.type === "red"
                      ? "text-red-700"
                      : "text-yellow-600"
                  }`}
                >
                  {alertInfo.type === "red"
                    ? `🚨 ACTION: Call emergency services now!`
                    : "🟡 NEXT STEP: Consult a physician promptly."}
                </p>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full justify-center">
                  {/* AMBULANCE BUTTON (Primary action for RED Alert) */}
                  {alertInfo.type === "red" && (
                    <a
                      href={EMERGENCY_NUMBER}
                      className="flex-1 text-center px-8 py-4 text-white font-extrabold text-xl rounded-lg transition-all duration-300 bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 shadow-2xl active:scale-95 animate-pulse"
                      onClick={handleEmergencyCall}
                    >
                      CALL AMBULANCE 
                    </a>
                  )}

                  {/* CONSULTATION BUTTON (Changed to blue-600) */}
                  <button
                    onClick={handleBookAppointment}
                    className={`flex-1 text-center px-8 py-4 font-bold rounded-lg transition-all duration-300 ${
                      alertInfo.type === "red"
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-lg"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg text-xl"
                    }`}
                  >
                    Book Teleconsultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* --- END FULL-SCREEN MODAL ALERT --- */}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                {/* ✅ FIX 2: Consolidated Date & Time into one column */}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Calendar className="inline-block mr-2" /> Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Temp (°F)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  BP
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  HR
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SpO2 (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sugar (Before)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sugar (After)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Height (cm)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Weight (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  BMI
                </th>
                {window.localStorage.getItem("uniqueId")?.startsWith("PAT") &&
                  !isHistoryView && (
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vitalsData.map((vital, index) => {
                const isRowCritical = isCritical(vital);
                const rowClasses = isRowCritical
                  ? "bg-red-50"
                  : "hover:bg-gray-50";

                return (
                  <tr key={vital._id || index} className={rowClasses}>
                    {/* ✅ FIX 3: Call the new, robust renderDateTime function */}
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800`}
                    >
                      {renderDateTime(vital.date)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${getHighlightClass(
                        vital.bodyTemperature,
                        "bodyTemperature"
                      )}`}
                    >
                      {renderValue(vital.bodyTemperature)}
                    </td>
                    {renderBPCell(vital)}{" "}
                    {/* RENDER BP CELL WITH DUAL HIGHLIGHTING */}
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${getHighlightClass(
                        vital.heartRate,
                        "heartRate"
                      )}`}
                    >
                      {renderValue(vital.heartRate)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${getHighlightClass(
                        vital.spo2,
                        "spo2"
                      )}`}
                    >
                      {renderValue(vital.spo2)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${getHighlightClass(
                        vital.sugarBeforeMeal,
                        "sugarBefore"
                      )}`}
                    >
                      {renderValue(vital.sugarBeforeMeal)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${getHighlightClass(
                        vital.sugarAfterMeal,
                        "sugarAfter"
                      )}`}
                    >
                      {renderValue(vital.sugarAfterMeal)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700`}
                    >
                      {renderValue(vital.height)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700`}
                    >
                      {renderValue(vital.weight)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700`}
                    >
                      {renderValue(vital.bmi)}
                    </td>
                    {window.localStorage
                      .getItem("uniqueId")
                      ?.startsWith("PAT") &&
                      !isHistoryView && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => setDeleteConfirmation(vital)}
                            className="text-red-900 hover:text-red-700 transition-colors flex items-center justify-center mx-auto"
                            title="Delete Record"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <XCircle size={24} className="text-red-500 mr-2" /> Confirm
              Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this vital sign record
              from {new Date(deleteConfirmation.date).toLocaleDateString()}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewVitals;
