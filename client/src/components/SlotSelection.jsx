import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

// 🚨 CRITICAL FIX: Normalizes day names to lowercase for robust comparison
const getNextAvailableDates = (availableDays) => {
  const dates = [];
  const today = moment().startOf("day");
  const maxScanDays = 14;

  // 1. Normalize the available days from the API to lowercase
  const normalizedAvailableDays = Array.isArray(availableDays)
    ? availableDays.map((day) => day.toLowerCase())
    : [];

  if (normalizedAvailableDays.length === 0) {
    return dates;
  }

  // Use a Set to track which unique day names have been found (e.g., 'monday', 'tuesday')
  const foundDays = new Set();

  for (let i = 0; i < maxScanDays; i++) {
    const date = moment(today).add(i, "days");
    // 2. Normalize the moment.js generated day name to lowercase
    const dayName = date.format("dddd").toLowerCase();

    // Check against the normalized list
    if (normalizedAvailableDays.includes(dayName)) {
      // Only add the date if we haven't already captured the required number of unique available days
      if (!foundDays.has(dayName) || dates.length < 7) {
        dates.push({
          date: date.format("YYYY-MM-DD"),
          day: dayName, // Store normalized day name
          display: date.format("ddd, MMM D"),
        });
        foundDays.add(dayName);
      }
    }

    // Optimization: Stop searching if we've found a full week of availability
    if (
      dates.length >= 7 &&
      foundDays.size === normalizedAvailableDays.length
    ) {
      break;
    }
  }

  // Sort the dates chronologically
  dates.sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());

  return dates;
};

const SlotSelection = ({ doctor, patientId, onSlotBooked, onBack }) => {
  const [availability, setAvailability] = useState([]);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [problem, setProblem] = useState("");
  const [bookingCount, setBookingCount] = useState(0);

  // 1. Fetch available slots from the new backend endpoint
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/appointments/slots/${doctor.uniqueId}`
        );
        setFees(res.data.fees);
        // Ensure availability is set to an array, even if the backend returns null/undefined
        setAvailability(res.data.availability || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setError("Could not load doctor's schedule. Please try again.");
        setLoading(false);
      }
    };
    fetchSlots();
  }, [doctor.uniqueId, bookingCount]);

  // Calculate future available dates based on the days the doctor has slots
  const availableDays = Array.isArray(availability)
    ? availability.map((a) => a.day)
    : [];
  const futureDates = getNextAvailableDates(availableDays);

  // Get slots for the currently selected date
  const selectedDayName = futureDates.find((d) => d.date === selectedDate)?.day;

  // Find the slots using the normalized day name
  const slotsForSelectedDay =
    availability.find((a) => a.day.toLowerCase() === selectedDayName)?.slots ||
    [];

  // 🟩 Launch Razorpay checkout and confirm payment
  const openRazorpayAndBook = async () => {
    try {
      // 1️⃣ Create Razorpay order from backend
      const orderRes = await axios.post(
        "http://localhost:5000/api/payments/create-order",
        { amount: fees }
      );

      const { orderId, key } = orderRes.data;
      if (!orderId || !key) {
        alert("Failed to create Razorpay order. Please try again.");
        return;
      }

      // 2️⃣ Razorpay checkout options
      const options = {
        key: key, // from backend (from .env)
        amount: fees * 100,
        currency: "INR",
        name: "Healthcare Appointment",
        description: "Consultation Fee Payment",
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3️⃣ Verify payment on backend
            const verifyRes = await axios.post(
              "http://localhost:5000/api/payments/verify",
              response
            );

            if (verifyRes.data.success) {
              // 4️⃣ Now book appointment only after successful payment
              const bookRes = await axios.post(
                "http://localhost:5000/api/appointments/book",
                {
                  patientId,
                  doctorId: doctor.uniqueId,
                  date: selectedDate,
                  time: selectedTime,
                  problem,
                }
              );

              // alert("✅ Payment & Booking Successful!");
              setBookingCount((prev) => prev + 1);
              setSelectedTime(null);
              setProblem("");
              onSlotBooked(bookRes.data.message);
            } else {
              alert("❌ Payment verification failed!");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            alert("Error verifying payment!");
          }
        },
        prefill: {
          name: "Patient Name",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: { color: "#0a9a73" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed to start!");
    }
  };

  const handleBookNow = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !problem) {
      alert("Please select a date, time, and describe your problem.");
      return;
    }
    openRazorpayAndBook(); // Launch Razorpay flow
  };

  if (loading)
    return <div className="text-center p-8">Loading schedule...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  // Check if we found ANY dates in the next 14 days
  if (futureDates.length === 0)
    return (
      <div className="text-center p-8 text-orange-600">
        Dr. {doctor.lastName} has no available slots in the near future.
        <button
          className="block mx-auto mt-4 text-blue-500 hover:text-blue-700"
          onClick={onBack}
        >
          ← Go back
        </button>
      </div>
    );

  const formattedFees = fees
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(fees)
    : "N/A";

  return (
    <div className="p-4 border rounded shadow-md max-w-2xl mx-auto mt-6 bg-white">
      <h2 className="text-xl font-bold mb-4 text-gray-700">
        Book Slot with Dr. {doctor.firstName} {doctor.lastName}
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Consultation Fee:{" "}
        <span className="font-semibold text-green-700">{formattedFees}</span>
      </p>

      {/* Date Picker (Top Row) */}
      <div className="flex overflow-x-auto gap-2 p-2 bg-gray-50 rounded mb-4 border">
        {/* Render dates found by the corrected helper */}
        {Array.isArray(futureDates) &&
          futureDates.map((day) => (
            <button
              key={day.date}
              onClick={() => {
                setSelectedDate(day.date);
                setSelectedTime(null); // Clear time selection on date change
              }}
              className={`p-3 min-w-[100px] text-center rounded transition 
                  ${
                    selectedDate === day.date
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-blue-100 border"
                  }`}
            >
              <p className="font-bold">{day.display.split(",")[0]}</p>
              <p className="text-xs">{day.display.split(",")[1]}</p>
            </button>
          ))}
      </div>

      {/* Time Slots (Bottom Grid) */}
      {selectedDate ? (
        <div className="mt-4">
          <h3 className="font-semibold mb-3 text-gray-700">
            Available Slots for{" "}
            {futureDates.find((d) => d.date === selectedDate)?.display}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {/* Defensive check for mapping */}
            {Array.isArray(slotsForSelectedDay) &&
            slotsForSelectedDay.length > 0 ? (
              slotsForSelectedDay.map((slot) => (
                <button
                  // Key combining date and time
                  key={`${selectedDate}-${slot.time}`}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`p-3 rounded border text-sm transition 
                                ${
                                  selectedTime === slot.time
                                    ? "bg-green-600 text-white shadow"
                                    : "bg-white text-gray-700 hover:bg-green-50 border-green-300"
                                }`}
                >
                  {slot.time}
                </button>
              ))
            ) : (
              <p className="col-span-3 text-center text-gray-500 p-2 border rounded bg-gray-50">
                No available time slots for this date.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center p-4 text-gray-500">
          Please select a date to view available times.
        </p>
      )}

      {/* Confirmation Form */}
      <form onSubmit={handleBookNow} className="mt-6 pt-4 border-t">
        <textarea
          placeholder="Describe problem (required)"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          className="block w-full mb-4 p-3 border rounded"
          rows="3"
          required
        />
        <div className="flex justify-between">
          <button
            type="button"
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            onClick={onBack}
          >
            ← Change Doctor
          </button>
          <button
            type="submit"
            disabled={!selectedDate || !selectedTime || !problem || loading}
            className={`px-4 py-2 rounded text-white transition 
                              ${
                                !selectedDate ||
                                !selectedTime ||
                                !problem ||
                                loading
                                  ? "bg-blue-300 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
          >
            Confirm Booking & Pay Later
          </button>
        </div>
      </form>
    </div>
  );
};

export default SlotSelection;
