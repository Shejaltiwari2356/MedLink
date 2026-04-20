// Filename: controllers/appointmentController.js
const Appointment = require('../models/Appointment'); 
const User = require('../models/User'); 
const { Types } = require("mongoose");
const moment = require('moment'); 

// --- Helper function (Unchanged) ---
const getDayName = (dateString) => {
    return moment(dateString).format('dddd');
};

// POST /api/appointments/book (Unchanged)
exports.bookAppointment = async (req, res) => {
    const session = await User.startSession();
    session.startTransaction();

    try {
        const { patientId, doctorId, date, time, problem } = req.body;

        if (!date || !time) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Date and time are required" });
        }
        
        const dayName = getDayName(date);

        // 1. Mark the slot as booked in the Doctor's availability
        const updateResult = await User.updateOne(
            {
              uniqueId: doctorId,
              role: 'doctor',
              'availability.day': dayName
            },
            {
              $set: { 'availability.$[day].slots.$[slot].isBooked': true }
            },
            {
              arrayFilters: [
                { 'day.day': dayName },
                { 'slot.time': time, 'slot.isBooked': false }
              ],
              session
            }
        );

      console.log('Slot booking update result:', updateResult);


        // Check if the slot was actually marked as booked
        if (updateResult.modifiedCount === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ message: "Slot is no longer available or was already booked." });
        }

        // 2. Fetch the doctor's fee to save on the appointment record
        const doctor = await User.findOne({ uniqueId: doctorId }, 'fees').session(session);
        const appointmentFee = doctor ? doctor.fees : 500;

        // 3. Create the new appointment record
        const newAppointment = new Appointment({
            patientId,
            doctorId,
            date: new Date(date),
            time,
            problem,
            fee: appointmentFee,
            roomId: new Types.ObjectId().toString(),
        });

        const savedAppointment = await newAppointment.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: "Appointment booked and slot reserved successfully",
            appointment: savedAppointment,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error booking appointment (Transaction rolled back):", error);
        res.status(500).json({
            message: "Failed to book appointment",
            error: error.message,
        });
    }
};

// GET /api/appointments/doctor/:doctorId (Unchanged)
exports.getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointments = await Appointment.find({ doctorId });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctor appointments", error: error.message });
  }
};

// Get all appointments of a patient
exports.getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // 1. Fetch all appointments for the patient
        const appointments = await Appointment.find({ patientId }).lean();
        
        if (appointments.length === 0) {
            return res.json([]);
        }

        // 2. Get all unique doctorIds (stored as uniqueId strings)
        const doctorIds = [...new Set(appointments.map(appt => appt.doctorId))];

        // 3. Fetch the full name for all unique doctors in a single query
        const doctors = await User.find(
            { uniqueId: { $in: doctorIds } }, 
            'uniqueId firstName lastName' // Select only necessary fields
        ).lean();

        // 4. Create a map for quick doctor name lookup
        const doctorMap = doctors.reduce((map, doctor) => {
            map[doctor.uniqueId] = `Dr. ${doctor.firstName} ${doctor.lastName}`;
            return map;
        }, {});

        // 5. Merge the doctor name into each appointment object
        const appointmentsWithNames = appointments.map(appt => ({
            ...appt,
            // Add the doctor's name
            doctorName: doctorMap[appt.doctorId] || 'Unknown Doctor',
            // CRITICAL: Format date to a simple YYYY-MM-DD string for safe consumption by React
            date: appt.date.toISOString().split('T')[0],
        }));

        res.json(appointmentsWithNames);

    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        res.status(500).json({ message: "Failed to fetch patient appointments", error: error.message });
    }
};

// PUT /api/appointments/:id/complete (Unchanged)
exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { status: "completed" },
      { new: true } // return updated doc
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      message: "Appointment marked as completed",
      appointment: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update appointment status",
      error: error.message,
    });
  }
};

// POST /api/appointments/:id/pay (Unchanged)
exports.payForAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { paymentStatus: "paid" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      message: "Payment successful",
      appointment: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Payment failed",
      error: error.message,
    });
  }
};

// GET /api/appointments/slots/:doctorId (Unchanged)
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Fetch the doctor's document, including only the availability field
        const doctor = await User.findOne({ uniqueId: doctorId, role: 'doctor' }, 'availability fees');

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Filter availability to only include slots that are NOT booked.
        const availableSlots = doctor.availability.map(dayEntry => ({
            day: dayEntry.day,
            slots: dayEntry.slots.filter(slot => !slot.isBooked) 
        })).filter(dayEntry => dayEntry.slots.length > 0); 

        res.json({
            fees: doctor.fees, 
            availability: availableSlots
        });
    } catch (error) {
        console.error("Error fetching available slots:", error);
        res.status(500).json({ message: "Failed to fetch available slots", error: error.message });
    }
};


// --- CORE DASHBOARD FUNCTION: GET LATEST UPCOMING APPOINTMENT (Unchanged) ---
exports.getLatestUpcomingAppointment = async (req, res) => {
    const { patientId } = req.params;

    if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required." });
    }

    try {
        const now = new Date();
        // Set startOfToday to midnight LOCAL time for consistent date comparison
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Format current time for strict string comparison (HH:MM)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeString = `${hours}:${minutes}`;

        // 1. Query for the single, nearest upcoming appointment
        const latestAppointment = await Appointment.findOne({
            patientId: patientId,
            status: { $ne: "completed" }, // Must not be completed
            // Removed paymentStatus check to allow pending payments to display
            // paymentStatus: { $ne: "pending" }, 

            // CRITICAL LOGIC: Find future appointments
            $or: [
                // Condition A: Appointments scheduled for any day AFTER today
                { date: { $gt: startOfToday } }, 
                
                // Condition B: Appointments scheduled for TODAY at a time greater than or equal to the current time
                { 
                    date: startOfToday, 
                    time: { $gte: currentTimeString } 
                } 
            ]
        })
        // Sort by date (ascending) and then time (ascending) to get the *nearest* one
        .sort({ date: 1, time: 1 }) 
        .lean(); 

        if (!latestAppointment) {
            return res.status(404).json({ message: "No upcoming appointments found." });
        }
        
        // 2. MANUAL LOOKUP: Fetch Doctor details using the String doctorId
        const doctor = await User.findOne({ uniqueId: latestAppointment.doctorId });
        
        // 3. Safely extract Doctor Details
        const doctorName = (doctor && doctor.firstName && doctor.lastName) 
                           ? `Dr. ${doctor.firstName} ${doctor.lastName}` 
                           : 'Unknown Doctor';
        
        const specialization = (doctor && doctor.specialization) ? doctor.specialization : 'N/A';

        // 4. Transform the final data
        const responseData = {
            id: latestAppointment._id,
            doctorName: doctorName,
            specialization: specialization,
            
            // CRITICAL FIX: Ensure the date string ONLY contains YYYY-MM-DD
            date: latestAppointment.date.toISOString().split('T')[0], 
            time: latestAppointment.time, // e.g., '14:30'
        };

        res.status(200).json(responseData);

    } catch (err) {
        console.error("Error in getLatestUpcomingAppointment:", err.message);
        res.status(500).json({ message: "Server error while fetching latest appointment." });
    }
};

// Filename: controllers/appointmentController.js (ADD THIS NEW FUNCTION)

// GET /api/appointments/doctor/today/:doctorId
exports.getDoctorTodayAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Set startOfToday to midnight LOCAL time for consistent date comparison
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Set endOfToday to midnight of the NEXT day
        const startOfNextDay = new Date(startOfToday);
        startOfNextDay.setDate(startOfNextDay.getDate() + 1);

        // 1. Query for all appointments for the doctor where the date is today (not completed)
        const todayAppointments = await Appointment.find({
            doctorId: doctorId,
            status: { $ne: "completed" }, // Only include pending or scheduled appointments
            date: {
                $gte: startOfToday, // Greater than or equal to the start of today
                $lt: startOfNextDay  // Less than the start of the next day
            }
        })
        .sort({ time: 1 }) // Sort by time (chronological)
        .lean();

        // Check if there are any appointments
        if (todayAppointments.length === 0) {
            return res.json([]);
        }

        // 2. Get all unique patientIds
        const patientIds = [...new Set(todayAppointments.map(appt => appt.patientId))];
        
        // 3. Fetch the full name for all unique patients in a single query
        const patients = await User.find(
            { uniqueId: { $in: patientIds } },
            'uniqueId firstName lastName' // Select only necessary fields
        ).lean();

        // 4. Create a map for quick patient name lookup
        const patientMap = patients.reduce((map, patient) => {
            map[patient.uniqueId] = `${patient.firstName} ${patient.lastName}`;
            return map;
        }, {});

        // 5. Merge the patient name and format the data for the front-end
        const appointmentsWithDetails = todayAppointments.map(appt => ({
            _id: appt._id,
            time: appt.time,
            problem: appt.problem, // Required: Description of the disease/problem
            status: appt.status,
            roomId: appt.roomId,
            patientId: appt.patientId,
            // Required: Patient's name
            patientName: patientMap[appt.patientId] || 'Unknown Patient', 
            // Format date to a simple YYYY-MM-DD string for safe consumption
            date: appt.date.toISOString().split('T')[0],
        }));
        
        res.json(appointmentsWithDetails);

    } catch (error) {
        console.error("Error fetching doctor's today appointments:", error);
        res.status(500).json({ message: "Failed to fetch today's appointments", error: error.message });
    }
};


