// Filename: AddVitals.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

// --- Inline SVG icons ---
const SquarePlus = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
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
// --- End SVG Icons ---

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const isNumeric = (str) => {
  return /^-?\d+(\.\d+)?$/.test(str);
};

// 🏥 Function to perform client-side range checks (UNCHANGED)
const validateVitals = (v) => {
  const checks = [
    { value: v.bodyTemperature, min: 90, max: 110, name: "Body Temperature" },
    { value: v.systolic, min: 50, max: 250, name: "Systolic BP" },
    { value: v.diastolic, min: 30, max: 150, name: "Diastolic BP" },
    { value: v.heartRate, min: 30, max: 250, name: "Heart Rate" },
    { value: v.respiratoryRate, min: 5, max: 50, name: "Respiratory Rate" },
    { value: v.spo2, min: 70, max: 100, name: "SpO2" },
    { value: v.sugarBeforeMeal, min: 40, max: 400, name: "Sugar Before Meal" },
    { value: v.sugarAfterMeal, min: 40, max: 400, name: "Sugar After Meal" },
    { value: v.height, min: 50, max: 250, name: "Height (cm)" },
    { value: v.weight, min: 20, max: 300, name: "Weight (kg)" },
  ];

  for (const check of checks) {
    const val = parseFloat(check.value);
    if (isNaN(val)) continue;
    if (val < check.min || val > check.max) {
      return `${check.name} value (${val}) is outside the clinically sane range (${check.min} - ${check.max}).`;
    }
  }
  if (parseFloat(v.systolic) <= parseFloat(v.diastolic)) {
    return "Systolic BP must be greater than Diastolic BP.";
  }
  return null;
};

const AddVitals = () => {
  const [vitals, setVitals] = useState({
    bodyTemperature: "",
    systolic: "",
    diastolic: "",
    heartRate: "",
    respiratoryRate: "",
    spo2: "",
    sugarBeforeMeal: "",
    sugarAfterMeal: "",
    height: "",
    weight: "",
    bmi: "",
    date: "",
    time: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 1. BMI Calculation Logic
    if (vitals.height && vitals.weight) {
      const heightInMeters = vitals.height / 100;
      const bmiValue = vitals.weight / (heightInMeters * heightInMeters);
      setVitals((prevVitals) => ({
        ...prevVitals,
        bmi: isNaN(bmiValue) ? "" : bmiValue.toFixed(2),
      }));
    } else {
      setVitals((prevVitals) => ({ ...prevVitals, bmi: "" }));
    }

    // 2. Set Default Date/Time to current local time
    const now = new Date();
    // Getting YYYY-MM-DD
    const formattedDate = now.toISOString().slice(0, 10);
    // Getting HH:MM using local time
    const formattedTime = now.toTimeString().slice(0, 5);

    setVitals((prevVitals) => ({
      ...prevVitals,
      // Only update if they haven't been touched (prevents resetting user input)
      date: prevVitals.date || formattedDate,
      time: prevVitals.time || formattedTime,
    }));
  }, [vitals.height, vitals.weight]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVitals((prevVitals) => ({
      ...prevVitals,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // --- 1. Validation Checks (omitted for brevity) ---
    const requiredFields = [
      "bodyTemperature",
      "systolic",
      "diastolic",
      "heartRate",
      "respiratoryRate",
      "spo2",
      "sugarBeforeMeal",
      "sugarAfterMeal",
      "height",
      "weight",
    ];

    for (const field of requiredFields) {
      if (!vitals[field] || !isNumeric(vitals[field])) {
        setMessage(
          "Please ensure all fields are filled with valid numeric data."
        );
        return;
      }
    }

    const validationError = validateVitals(vitals);
    if (validationError) {
      setMessage(`Validation Error: ${validationError}`);
      return;
    }

    try {
      const bloodPressure = `${vitals.systolic}/${vitals.diastolic}`;

      /**
       * ✅ CRITICAL FIX: The time display issue is solved here.
       * We construct the timestamp from local date/time strings WITHOUT the 'Z' suffix.
       * This forces the JS Date object to correctly interpret the time in the user's
       * current timezone (e.g., 16:38 IST). When this moment is saved and retrieved,
       * the ViewVitals component will display it correctly.
       */
      const localTimeString = `${vitals.date}T${vitals.time}:00`;
      const timestamp = new Date(localTimeString);

      const payload = {
        bodyTemperature: parseFloat(vitals.bodyTemperature),
        bloodPressure,
        heartRate: parseInt(vitals.heartRate, 10),
        respiratoryRate: parseInt(vitals.respiratoryRate, 10),
        spo2: parseInt(vitals.spo2, 10),
        sugarBeforeMeal: parseFloat(vitals.sugarBeforeMeal),
        sugarAfterMeal: parseFloat(vitals.sugarAfterMeal),
        height: parseFloat(vitals.height),
        weight: parseFloat(vitals.weight),
        bmi: parseFloat(vitals.bmi),
        date: timestamp,
      };

      const res = await apiClient.post("/vitals/add", payload);
      setMessage(res.data.message);

      // Clear form and reset date/time to current moment on success
      const now = new Date();
      setVitals({
        bodyTemperature: "",
        systolic: "",
        diastolic: "",
        heartRate: "",
        respiratoryRate: "",
        spo2: "",
        sugarBeforeMeal: "",
        sugarAfterMeal: "",
        height: "",
        weight: "",
        bmi: "",
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to add vitals. Please check the server connection."
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
        {/* COLOR CHANGE: Indigo -> Blue */}
        <SquarePlus size={32} className="text-blue-600" />
        <span>Add New Vitals</span>
      </h2>
      {message && (
        <div
          className={`p-4 rounded-lg font-medium text-sm ${
            message.toLowerCase().includes("success")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={vitals.date}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            name="time"
            value={vitals.time}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
            <HeartPulse size={16} />
            <span>Body Temperature (°F)</span>
          </label>
          <input
            type="number"
            name="bodyTemperature"
            value={vitals.bodyTemperature}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="e.g., 98.6"
            min="90"
            max="110"
            step="0.1"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
              <Activity size={16} />
              <span>Systolic (Upper BP)</span>
            </label>
            <input
              type="number"
              name="systolic"
              value={vitals.systolic}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="e.g., 120"
              min="50"
              max="250"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Diastolic (Lower BP)
            </label>
            <input
              type="number"
              name="diastolic"
              value={vitals.diastolic}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="e.g., 80"
              min="30"
              max="150"
              required
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
            <HeartPulse size={16} />
            <span>Heart Rate (BPM)</span>
          </label>
          <input
            type="number"
            name="heartRate"
            value={vitals.heartRate}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="e.g., 75"
            min="30"
            max="250"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
            <Activity size={16} />
            <span>Respiratory Rate (breaths/min)</span>
          </label>
          <input
            type="number"
            name="respiratoryRate"
            value={vitals.respiratoryRate}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="e.g., 16"
            min="5"
            max="50"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
            <Droplets size={16} />
            <span>SpO2 (%)</span>
          </label>
          <input
            type="number"
            name="spo2"
            value={vitals.spo2}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="e.g., 98"
            min="70"
            max="100"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
              <Utensils size={16} />
              <span>Sugar (Before Meal)</span>
            </label>
            <input
              type="number"
              name="sugarBeforeMeal"
              value={vitals.sugarBeforeMeal}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="e.g., 90"
              min="40"
              max="400"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Sugar (After Meal)
            </label>
            <input
              type="number"
              name="sugarAfterMeal"
              value={vitals.sugarAfterMeal}
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="e.g., 120"
              min="40"
              max="400"
              required
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
            <Scale size={16} />
            <span>Height (cm)</span>
          </label>
          <input
            type="number"
            name="height"
            value={vitals.height}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="e.g., 170"
            min="50"
            max="250"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
            <Scale size={16} />
            <span>Weight (kg)</span>
          </label>
          <input
            type="number"
            name="weight"
            value={vitals.weight}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            placeholder="e.g., 70"
            min="20"
            max="300"
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
            <Scale size={16} />
            <span>BMI</span>
          </label>
          <input
            type="text"
            name="bmi"
            value={vitals.bmi}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            readOnly
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            // COLOR CHANGE: Indigo -> Blue
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            Save Vitals
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVitals;
