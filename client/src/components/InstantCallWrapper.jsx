import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react"; // Import Loader icon

const API_BASE_URL = "http://localhost:5000/api/consult";

const InstantCallWrapper = ({ sessionId, patientId, doctorName }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Initiating Payment Confirmation...");
  const [isLoading, setIsLoading] = useState(true);
  // Retrieves the raw token string for Authorization header
  const authToken = localStorage.getItem("token");

  useEffect(() => {
    const confirmPaymentAndJoin = async () => {
      // CRITICAL VALIDATION: Checks the three required pieces of data + token
      if (!sessionId || !patientId || !authToken) {
        setStatus("Authentication error. Missing data. Redirecting...");
        setIsLoading(false);
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      setIsLoading(true);
      try {
        // 1. API Call: Confirms payment and alerts the doctor via Socket.IO
        await axios.post(
          `${API_BASE_URL}/${sessionId}/confirm-payment`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        setStatus(`Payment Confirmed. Waiting for Dr. ${doctorName}...`);

        // 2. Redirect to the video call component (VideoCall2.jsx)
        // This passes the necessary state data to satisfy VideoCall2.jsx's validation.
        setTimeout(() => {
          navigate(`/call/${sessionId}`, {
            replace: true,
            state: {
              userId: patientId, // Patient's ID is the local user ID
              peerName: doctorName, // Doctor's name is the remote peer's name
              sessionType: "instant", // Explicitly set session type
            },
          });
        }, 1000);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          "Server error occurred. Check backend logs.";
        setStatus(`Call Setup Failed: ${errorMessage}. Doctor Lock Released.`);
        setIsLoading(false);
      }
    };

    confirmPaymentAndJoin();
  }, [sessionId, patientId, doctorName, navigate, authToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-white shadow-lg rounded-xl">
      <h2 className="text-3xl font-bold text-blue-600 mb-4">{status}</h2>
      {isLoading && status.includes("Waiting") && (
        <Loader size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
      )}
      {status.includes("Failed") && (
        <p className="text-red-500 mt-4 font-medium">
          Please refresh the page and try booking another doctor.
        </p>
      )}
    </div>
  );
};

export default InstantCallWrapper;
