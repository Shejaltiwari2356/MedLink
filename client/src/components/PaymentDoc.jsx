import React, { useEffect, useState } from "react";

const PaymentDoc = ({ patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Fetch active appointments
  useEffect(() => {
    fetch(`http://localhost:5000/api/appointments/patient/${patientId}`)
      .then((res) => res.json())
      .then((data) => {
        const active = data.filter(
          (appt) =>
            appt.status === "pending" && appt.paymentStatus === "pending"
        );
        setAppointments(active);
      })
      .catch((err) => console.error("Failed to fetch appointments:", err));
  }, [patientId]);

  //   Confirm payment after scanning
  const handleConfirmPayment = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/appointments/${selectedAppt._id}/pay`,
        { method: "POST" }
      );
      const data = await res.json();
      alert(data.message);

      // Remove paid appointment from list
      setAppointments((prev) =>
        prev.filter((appt) => appt._id !== selectedAppt._id)
      );
      setShowQR(false);
      setSelectedAppt(null);
    } catch (err) {
      console.error(err);
      alert("Payment failed!");
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg max-w-2xl mx-auto font-sans">
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800">
        💳 Payment Section
      </h2>

      {appointments.length === 0 ? (
        <p className="text-center italic text-gray-500">No pending payments.</p>
      ) : (
        appointments.map((appt) => (
          <div
            key={appt._id}
            className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm"
          >
            <p className="text-gray-700">
              <b>Doctor:</b> {appt.doctorId}
            </p>
            <p className="text-gray-700">
              <b>Date:</b> {new Date(appt.date).toLocaleDateString()}
            </p>
            <p className="text-gray-700">
              <b>Time:</b> {appt.time}
            </p>
            <p className="text-gray-700">
              <b>Problem:</b> {appt.problem}
            </p>
            <p className="text-gray-700 mb-3">
              <b>Fee:</b> ₹{appt.fee}
            </p>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              onClick={() => handleConfirmPayment(appt)}
            >
              Payment Received
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default PaymentDoc;
