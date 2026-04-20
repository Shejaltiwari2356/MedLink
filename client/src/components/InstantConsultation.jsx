import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import InstantCallWrapper from "./InstantCallWrapper";
import { useAuth } from "../utils/authUtils"; // Assuming the path is correct
import { Video, Zap, Loader } from "lucide-react"; // Import necessary icons

const API_BASE_URL = "http://localhost:5000/api";

const InstantConsultation = () => {
  // Assuming useAuth provides patientId, authToken, isAuthenticated
  const { patientId, authToken, isAuthenticated } = useAuth();

  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  // Prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch available doctors
  useEffect(() => {
    if (!isAuthenticated) {
      setAvailableDoctors([]);
      setLoading(false);
      setError("You must be logged in to view available doctors.");
      return;
    }

    let didCancel = false;

    const fetchOnlineDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/consult/live-doctors`,
          {
            headers: { Authorization: authToken },
          }
        );

        if (!didCancel && mountedRef.current) {
          // Filter to ensure only doctors marked as available are shown
          setAvailableDoctors(response.data.doctors || []);
          setLoading(false);
        }
      } catch (err) {
        if (!didCancel && mountedRef.current) {
          console.error("Error fetching online doctors:", err);
          setError("Failed to load available doctors. Please try again.");
          setLoading(false);
        }
      }
    };

    fetchOnlineDoctors();

    // Cleanup in case component unmounts before request finishes
    return () => {
      didCancel = true;
    };
  }, [authToken, isAuthenticated]);

  // Initiate consultation: lock doctor and create session
  const handleStartConsult = async (doctor) => {
    if (!isAuthenticated || !patientId || !doctor.uniqueId) {
      alert("Error: Missing authentication or doctor ID. Please log in again.");
      return;
    }

    // Confirm with user
    const confirmStart = window.confirm(
      `Start instant call with Dr. ${doctor.lastName} for ₹${
        doctor.fees || "N/A"
      }?`
    );
    if (!confirmStart) return;

    // Parse fee robustly (doctor.fees may be string or number)
    const rawFeeValue = doctor.fees ?? "0";
    const numericFee = parseFloat(
      rawFeeValue.toString().replace(/[^0-9.]/g, "")
    );

    if (isNaN(numericFee) || numericFee <= 0) {
      alert("Invalid consultation fee detected. Cannot proceed.");
      return;
    }

    try {
      // Calls the POST /api/consult/initiate endpoint to lock the doctor
      const response = await axios.post(
        `${API_BASE_URL}/consult/initiate`,
        {
          doctorId: doctor.uniqueId,
          fee: numericFee,
          consultReason: "Emergency Consult initiated by patient",
        },
        {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data?.sessionId) {
        // Successful lock, proceed to payment confirmation wrapper
        setActiveSession({
          sessionId: response.data.sessionId,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
        });
      } else {
        alert("Unexpected response from server. Check logs.");
        console.warn("Unexpected initiate response:", response?.data);
      }
    } catch (err) {
      console.error("Error starting consultation:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Server error occurred. Check backend logs.";
      alert(`Could not start consultation: ${errorMessage}`);
    }
  };

  // --- UI RENDERING LOGIC ---

  // 1. If session is active, render the wrapper for payment/redirect
  if (activeSession) {
    return (
      <InstantCallWrapper
        sessionId={activeSession.sessionId}
        patientId={patientId}
        doctorName={activeSession.doctorName}
      />
    );
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className="loading-state p-6 text-center text-gray-600 flex justify-center items-center">
        <Loader size={20} className="animate-spin mr-2" /> Loading available
        doctors...
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="error-state p-6 text-center text-red-600 border border-red-300 rounded bg-red-50">
        {error}
      </div>
    );
  }

  // 4. Main Doctor List
  return (
    <div className="instant-consultation-container p-6 bg-gray-50">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
        <Zap size={28} className="text-red-600 mr-2" /> Instant Teleconsultation
      </h2>

      {availableDoctors.length === 0 ? (
        <div className="no-doctors text-center p-8 bg-white rounded shadow text-gray-600">
          No doctors are currently available for instant consultation. Please
          check back later.
        </div>
      ) : (
        <div className="doctor-list grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDoctors.map((doctor) => (
            <div
              key={doctor.uniqueId}
              className="doctor-card bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl"
            >
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-green-500 text-2xl">•</span>
                <span className="font-semibold text-sm text-green-600">
                  ONLINE & AVAILABLE
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900">{`Dr. ${doctor.firstName} ${doctor.lastName}`}</h3>
              <p className="text-sm text-gray-600">
                Specialization: <strong>{doctor.specialization}</strong>
              </p>
              <p className="text-lg font-bold text-blue-600 mt-3">
                Consultation Fee: ₹{doctor.fees || "N/A"}
              </p>

              <button
                className="w-full mt-4 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition duration-200 flex items-center justify-center"
                onClick={() => handleStartConsult(doctor)}
                disabled={!isAuthenticated}
              >
                <Video size={20} className="mr-2" />{" "}
                {isAuthenticated ? "Start Instant Consult" : "Login to Consult"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstantConsultation;
