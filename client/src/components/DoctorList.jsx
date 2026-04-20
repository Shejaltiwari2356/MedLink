import React, { useEffect, useState } from "react";
import axios from "axios";
import SlotSelection from "./SlotSelection"; // 🚨 Ensure the path is correct

const DoctorList = ({ patientId }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [message, setMessage] = useState(null);

  // Fetch all doctors from backend
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // Assuming this endpoint fetches users with role='doctor' and includes availability/fees
        const res = await axios.get("http://localhost:5000/api/auth/doctors");
        setDoctors(res.data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };
    fetchDoctors();
  }, []);

  // Function to handle a successful booking from the SlotSelection component
  const handleSlotBooked = (msg) => {
    setMessage(msg);
    setSelectedDoctor(null); // Return to the doctor list view
    // Optional: Re-fetch doctors to reflect updated availability, though unnecessary for the current view
  };

  if (message) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl font-bold text-green-600 mb-4">{message}</p>
        <button
          className="mt-3 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
          onClick={() => setMessage(null)}
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  // --- Conditional Rendering ---

  // 2. Show Slot Selection component if a doctor is selected
  if (selectedDoctor) {
    return (
      <SlotSelection
        doctor={selectedDoctor}
        patientId={patientId}
        onSlotBooked={handleSlotBooked}
        onBack={() => setSelectedDoctor(null)}
      />
    );
  }

  // 1. Show Doctor list (Default view)
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Our Medical Team
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a specialist to book your appointment
        </p>
      </div>

      {/* Doctors Grid - CHANGED: Reduced columns to make cards wider */}
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {" "}
          {/* CHANGED: From 4 to 3 columns */}
          {doctors.map((doc) => (
            <div
              key={doc.uniqueId}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 overflow-hidden"
            >
              {/* Doctor Header */}
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* CHANGED: Removed truncate to allow full name display */}
                    <h3 className="text-lg font-semibold text-gray-900 break-words">
                      Dr. {doc.firstName} {doc.lastName}
                    </h3>
                    {doc.specialization && (
                      <p className="text-blue-600 font-medium text-sm mt-1">
                        {doc.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  {doc.degree && (
                    <div className="flex items-start text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                      </svg>
                      <span className="break-words">{doc.degree}</span>
                    </div>
                  )}

                  {doc.experience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{doc.experience} years experience</span>
                    </div>
                  )}

                  {doc.contact && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span>{doc.contact}</span>
                    </div>
                  )}
                </div>

                {/* Fees and Action */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    {doc.fees && (
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{doc.fees}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          consultation
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:from-blue-600 group-hover:to-indigo-700"
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    Book Appointment
                  </button>
                </div>

                {/* ID */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    ID: {doc.uniqueId}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {doctors.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Doctors Available
          </h3>
          <p className="text-gray-500">
            Please check back later for available specialists.
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
