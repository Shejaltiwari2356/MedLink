// DoctorAppointments.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

const DoctorAppointments = ({ doctorId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctorId) {
      setLoading(true);
      fetch(`http://localhost:5000/api/appointments/doctor/${doctorId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAppointments(data);
          else setAppointments([]);
        })
        .catch((error) => {
          console.error("Failed to fetch appointments:", error);
          setAppointments([]);
        })
        .finally(() => setLoading(false));
    }
  }, [doctorId]);

  const handleComplete = (apptId) => {
    fetch(`http://localhost:5000/api/appointments/${apptId}/complete`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.appointment) {
          setAppointments((prev) =>
            prev.map((a) =>
              a._id === apptId ? { ...a, status: "completed" } : a
            )
          );
        }
      })
      .catch((err) => console.error("Error updating appointment:", err));
  };

  // Separate upcoming and completed appointments like PatientAppointments
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(
        (appt) => appt.status !== "completed" && appt.status !== "cancelled"
      )
      .sort(
        (a, b) =>
          new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
      );
  }, [appointments]);

  const completedAppointments = useMemo(() => {
    return appointments
      .filter((appt) => appt.status === "completed")
      .sort(
        (a, b) =>
          new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`)
      );
  }, [appointments]);

  // Appointment card (used for both sections)
  const AppointmentCard = ({ appt, isPast }) => {
    const statusClass =
      appt.status === "completed"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : appt.status === "cancelled"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

    const cardBaseClass = isPast
      ? "bg-gray-50 rounded-2xl p-7 shadow-inner border border-gray-100 opacity-80"
      : "group bg-white rounded-2xl p-7 shadow-sm hover:shadow-2xl border border-gray-100 hover:border-blue-100 transform hover:-translate-y-1 transition-all duration-500 ease-out";

    return (
      <div key={appt._id} className={cardBaseClass}>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            <div>
              <h3 className="font-bold text-gray-900">
                Patient: {appt.patientId}
              </h3>
              <p className="text-xs text-gray-500">Room: {appt.roomId}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${statusClass}`}
          >
            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
          </span>
        </div>

        {/* Appointment Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3 text-gray-700">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {new Date(appt.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-600">at {appt.time}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-gray-700">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mt-1">
              <svg
                className="w-4 h-4 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Problem</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {appt.problem}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons (only if upcoming) */}
        {!isPast && (
          <div className="pt-4 border-t border-gray-100 flex space-x-3">
            <Link
              to={`/call/${appt.roomId}`}
              state={{ userId: doctorId }}
              className="flex-1"
            >
              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                Start Video Call
              </button>
            </Link>

            <button
              onClick={() => handleComplete(appt._id)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Complete
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
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
        <p className="ml-3 text-lg text-gray-700">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* UPCOMING SECTION */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-3">
            Upcoming Appointments
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Your priority queue for scheduled telemedicine consultations.
          </p>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              No Upcoming Appointments
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You currently have no pending consultations scheduled.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
            {upcomingAppointments.map((appt) => (
              <AppointmentCard key={appt._id} appt={appt} isPast={false} />
            ))}
          </div>
        )}

        {/* COMPLETED HISTORY SECTION */}
        {completedAppointments.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-700 mb-3">
                Completed History
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Review your past consultations and medical sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {completedAppointments.map((appt) => (
                <AppointmentCard key={appt._id} appt={appt} isPast={true} />
              ))}
            </div>
          </div>
        )}

        {/* STATS FOOTER */}
        {appointments.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="px-6">
                <p className="text-2xl font-bold text-blue-600">
                  {appointments.filter((a) => a.status !== "cancelled").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Total Consultations
                </p>
              </div>
              <div className="px-6">
                <p className="text-2xl font-bold text-emerald-600">
                  {appointments.filter((a) => a.status === "completed").length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </div>
              <div className="px-6">
                <p className="text-2xl font-bold text-amber-600">
                  {
                    appointments.filter(
                      (a) =>
                        a.status !== "completed" && a.status !== "cancelled"
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600 mt-1">Upcoming</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
