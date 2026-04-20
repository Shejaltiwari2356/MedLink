import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TimeSeriesScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import annotationPlugin from "chartjs-plugin-annotation";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register all necessary Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin, // For the "normal range" boxes
  TimeScale,
  TimeSeriesScale,
  ChartDataLabels // For showing values on data points
);

const apiClient = axios.create({ baseURL: "http://localhost:5000/api" });
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const processVitalsForCharts = (vitalsHistory) => {
  if (!vitalsHistory || vitalsHistory.length === 0) return null;

  // Sort data chronologically for a correct timeline
  const sortedHistory = [...vitalsHistory].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const formatData = (mapper) =>
    sortedHistory
      .map((v) => ({
        x: new Date(v.date).valueOf(), // Use timestamp for the x-axis
        y: mapper(v),
      }))
      .filter((point) => point.y != null && !isNaN(point.y)); // Filter out null/invalid data

  return {
    temperature: {
      datasets: [
        {
          label: "Temp (°F)",
          data: formatData((v) => v.bodyTemperature),
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
        },
      ],
    },
    bloodPressure: {
      datasets: [
        {
          label: "Systolic",
          data: formatData((v) => v.bloodPressure?.split("/")[0]),
          borderColor: "#3b82f6",
          backgroundColor: "#3b82f6",
        },
        {
          label: "Diastolic",
          data: formatData((v) => v.bloodPressure?.split("/")[1]),
          borderColor: "#22c55e",
          backgroundColor: "#22c55e",
        },
      ],
    },
    heartRate: {
      datasets: [
        {
          label: "Heart Rate (bpm)",
          data: formatData((v) => v.heartRate),
          borderColor: "#eab308",
          backgroundColor: "#eab308",
        },
      ],
    },
    spo2: {
      datasets: [
        {
          label: "SpO2 (%)",
          data: formatData((v) => v.spo2),
          borderColor: "#8b5cf6",
          backgroundColor: "#8b5cf6",
        },
      ],
    },
    bmi: {
      datasets: [
        {
          label: "BMI",
          data: formatData((v) => v.bmi),
          borderColor: "#0ea5e9",
          backgroundColor: "#0ea5e9",
        },
      ],
    },
    weight: {
      datasets: [
        {
          label: "Weight (kg)",
          data: formatData((v) => v.weight),
          borderColor: "#64748b",
          backgroundColor: "#64748b",
        },
      ],
    },
  };
};

// --- TRIAGE CONSTANTS ---
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

/**
 * Checks the latest vitals against static tiers and historical trend.
 */
const checkLatestVitals = (vitalsHistory) => {
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

const AnalyseVitals = ({ vitals: propVitals }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ADDED: Alert States
  const [alertInfo, setAlertInfo] = useState({
    type: null,
    alerts: [],
    latestRecord: null,
  });
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // HANDLERS
  const navigate = useNavigate();
  const EMERGENCY_NUMBER = "tel:999";
  const handleBookAppointment = () => {
    navigate("/", { state: { activeItem: "Book Appointment" } });
  };
  const handleEmergencyCall = () => {
    window.location.href = EMERGENCY_NUMBER;
  };
  const handleDismissAlert = () => {
    setIsAlertDismissed(true);
  };

  useEffect(() => {
    const processData = (vitalsHistory) => {
      // Enforce chronological sort (oldest first) for chart rendering
      const chronologicalData = [...vitalsHistory].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const processedData = processVitalsForCharts(chronologicalData);
      if (!processedData) {
        setError("No vitals data found to analyze.");
      } else {
        setChartData(processedData);

        if (vitalsHistory && vitalsHistory.length > 0) {
          setAlertInfo(checkLatestVitals(vitalsHistory));
        }
      }
    };

    if (propVitals) {
      processData(propVitals);
      setLoading(false);
    } else {
      const fetchVitals = async () => {
        try {
          const res = await apiClient.get("/vitals");
          processData(res.data.vitals);
        } catch (err) {
          setError("Failed to fetch and analyze vitals.");
        } finally {
          setLoading(false);
        }
      };
      fetchVitals();
    }
  }, [propVitals]);

  // Reusable function to generate chart options (UPDATED)
  const getChartOptions = (
    title,
    yMin,
    yMax,
    yAxisLabel = "",
    customYMin = null,
    customAnnotations = {}
  ) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: title,
        font: { size: 18, weight: "bold" },
        padding: { bottom: 20 },
      },
      // FIX 3: Suppress data labels if point radius is 0
      datalabels: {
        display: (context) => context.dataset.pointRadius > 0,
        color: "#333",
        align: "top",
        offset: 8,
        font: { weight: "600" },
        formatter: (value) => value.y, // Display the y-value
      },
      annotation: {
        annotations: {
          // Existing green box (Normal Range)
          box1: {
            type: "box",
            yMin,
            yMax,
            backgroundColor: "rgba(74, 222, 128, 0.15)",
            borderColor: "rgba(34, 197, 94, 0.2)",
            borderWidth: 1,
          },
          // FIX 4: Include custom clinical lines
          ...customAnnotations,
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { tooltipFormat: "MMM d, yyyy, h:mm a" },
        title: { display: true, text: "Date & Time", font: { size: 14 } },
      },
      y: {
        beginAtZero: false,
        suggestedMin: customYMin, // FIX 2: Apply custom minimum for zoom
        title: { display: !!yAxisLabel, text: yAxisLabel, font: { size: 14 } },
      },
    },
    elements: {
      line: { tension: 0.4 }, // Smoother line
      point: { radius: 0, hoverRadius: 5 }, // FIX 1: Suppress points, keep hover
    },
  });

  // --- ANNOTATION DEFINITIONS (Clinical Context) ---
  const hrAnnotations = {
    criticalHR: {
      type: "line",
      yMin: 130,
      yMax: 130,
      borderColor: "rgb(220, 38, 38)", // Red
      borderWidth: 2,
      label: {
        display: true,
        content: "CRITICAL MAX (130 BPM)",
        position: "end",
        backgroundColor: "rgba(220, 38, 38, 0.8)",
        font: { size: 10 },
      },
    },
  };
  const bpAnnotations = {
    criticalBP: {
      type: "line",
      yMin: 140, // Stage 2 Hypertension for Systolic
      yMax: 140,
      borderColor: "rgb(255, 127, 0)", // Orange
      borderWidth: 2,
      label: {
        display: true,
        content: "HTN STAGE 2 (140)",
        position: "end",
        backgroundColor: "rgba(255, 127, 0, 0.8)",
        font: { size: 10 },
      },
    },
  };

  // Alert Rendering Logic
  const isAlertActive = alertInfo.alerts.length > 0;
  const shouldRenderFullModal =
    isAlertActive && alertInfo.type === "red" && !isAlertDismissed;
  const shouldRenderStickyBar =
    isAlertActive && (isAlertDismissed || alertInfo.type === "yellow");

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          Vitals Trend Analysis
        </h2>
        <p className="text-gray-500 mt-2">
          Visualizing your health data over time. The shaded green area
          represents the normal range.
        </p>
      </div>

      {/* 🚨 1. STICKY ALERT BAR (For Yellow/Dismissed Critical Alerts) 🚨 */}
      {shouldRenderStickyBar && (
        <div
          className={`p-4 border-l-8 rounded-lg shadow-md mb-6 relative border-red-600 bg-red-50 w-full`}
        >
          <div className="flex justify-between items-center space-x-4">
            <div className="flex-1 min-w-0 pr-4">
              <p className="font-extrabold text-xl text-red-800 flex items-center space-x-2">
                <span className="text-2xl">⚠️</span>
                <span>EMERGENCY ACTION REQUIRED</span>
              </p>

              {/* Display combined critical findings */}
              <p className="text-sm font-medium text-gray-700 mt-1 truncate">
                {alertInfo.alerts.join(" | ")}
              </p>
            </div>

            <div className="flex-shrink-0 flex space-x-3 items-center">
              {/* AMBULANCE BUTTON */}
              {alertInfo.type === "red" && (
                <a
                  href={EMERGENCY_NUMBER}
                  className="px-5 py-2 text-white font-bold rounded-md bg-red-700 hover:bg-red-800 transition-colors text-base whitespace-nowrap"
                  onClick={handleEmergencyCall}
                >
                  CALL AMBULANCE (999)
                </a>
              )}

              {/* CONSULTATION BUTTON */}
              <button
                onClick={handleBookAppointment}
                className="px-5 py-2 font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-base whitespace-nowrap"
              >
                Book Teleconsultation
              </button>

              {/* Dismiss Button */}
              <button
                onClick={handleDismissAlert}
                className="text-gray-500 hover:text-gray-800 transition p-1"
                title="Dismiss alert"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- END STICKY ALERT BAR --- */}

      {/* 🚨 2. FULL-SCREEN MODAL ALERT (Only when critical and not dismissed) 🚨 */}
      {shouldRenderFullModal && (
        // Full-screen overlay with blur
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
                  alertInfo.type === "red" ? "text-red-700" : "text-yellow-600"
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
                  alertInfo.type === "red" ? "text-red-700" : "text-yellow-600"
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
                    CALL AMBULANCE ({EMERGENCY_NUMBER.replace("tel:", "")})
                  </a>
                )}

                {/* CONSULTATION BUTTON (Secondary/Primary) */}
                <button
                  onClick={handleBookAppointment}
                  className={`flex-1 text-center px-8 py-4 font-bold rounded-lg transition-all duration-300 text-xl ${
                    alertInfo.type === "red"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-lg"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-xl"
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

      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm h-96">
            {/* BMI Chart - Y-Axis fix applied (Starts at 15) */}
            <Line
              options={getChartOptions(
                "BMI Trend",
                18.5,
                24.9,
                "BMI (kg/m²)",
                15
              )}
              data={chartData.bmi}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm h-96">
            {/* HR Chart - Y-Axis fix applied (Starts at 40) and Critical Line added */}
            <Line
              options={getChartOptions(
                "Heart Rate",
                60,
                100,
                "Beats Per Minute (BPM)",
                40,
                hrAnnotations
              )}
              data={chartData.heartRate}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm h-96">
            {/* BP Chart - Y-Axis fix applied (Starts at 60) and Stage 2 HTN Line added */}
            <Line
              options={getChartOptions(
                "Blood Pressure",
                80,
                120,
                "mmHg",
                60,
                bpAnnotations
              )}
              data={chartData.bloodPressure}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm h-96">
            <Line
              options={getChartOptions("Body Temperature", 97, 99, "°F")}
              data={chartData.temperature}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm h-96">
            <Line
              options={getChartOptions(
                "SpO2 (Oxygen Saturation)",
                95,
                100,
                "%"
              )}
              data={chartData.spo2}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl shadow-sm h-96">
            {/* Weight Chart - Y-Axis fix applied (Starts at 100) */}
            <Line
              options={getChartOptions(
                "Weight Trend",
                null,
                null,
                "Weight (kg)",
                100
              )}
              data={chartData.weight}
            />
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 text-center italic pt-4">
        *Disclaimer: This analysis is for informational purposes only and is not
        a substitute for professional medical advice.
      </p>
    </div>
  );
};

export default AnalyseVitals;
