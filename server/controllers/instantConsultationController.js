const moment = require('moment'); 
const User = require('../models/User'); 
const InstantSession = require('../models/InstantSession');
const mongoose = require('mongoose');

/*
    NOTE: This code assumes the User model has the following fields:
    1. isInstantOnline: Boolean
    2. isLockedForConsultation: Boolean (Used for atomic session locking)
    3. role: 'doctor' | 'patient'
*/

// --- Helper: Check True Availability (Final Structure) ---
const checkTrueAvailability = (doctor) => {
    // 1. Initial Check: Must be marked as a doctor, toggle ON, and have the correct role.
    if (doctor.role !== 'doctor' || !doctor.isInstantOnline) {
        return false;
    }
    // 2. Time Overlap Check: Your comprehensive appointment overlap check logic should be fully implemented here.
    return true; 
};

// --- Controller Functions ---

// @route GET /api/consult/status
exports.getInstantStatus = async (req, res) => {
    // We assume the 'auth' middleware has placed the doctor's uniqueId on req.user
    const doctorId = req.user.uniqueId; 

    if (!doctorId) {
        return res.status(401).json({ message: "Authentication required for status check." });
    }

    try {
        // Find the doctor and select only the required status fields
        const doctor = await User.findOne({ uniqueId: doctorId, role: 'doctor' }).select('isInstantOnline isLockedForConsultation');

        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found." });
        }

        // Return the current status from the database
        res.json({
            isInstantOnline: doctor.isInstantOnline,
            isLockedForConsultation: doctor.isLockedForConsultation
        });

    } catch (error) {
        console.error("Error fetching doctor instant status:", error);
        res.status(500).json({ message: "Server error while fetching status." });
    }
};

// @route GET /api/consult/live-doctors
exports.getLiveDoctors = async (req, res) => {
    try {
        const allDoctors = await User.find({ role: 'doctor' });

        const availableDoctors = allDoctors
            .filter(checkTrueAvailability)
            .map(doctor => ({ 
                uniqueId: doctor.uniqueId, 
                firstName: doctor.firstName,
                lastName: doctor.lastName,
                specialization: doctor.specialization, 
                fees: doctor.fees, 
            }));

        res.json({ doctors: availableDoctors }); 
    } catch (error) {
        console.error("Error fetching live doctors:", error);
        res.status(500).json({ message: "Server error while fetching doctors." });
    }
};


// @route POST /api/consult/initiate (Patient locks the doctor)
exports.initiateInstantConsultation = async (req, res) => {
    const patientId = req.user.uniqueId;
    
    // 🚩 NEW SAFEGURAD: Check if the body exists before destructuring
    if (!req.body || Object.keys(req.body).length === 0) {
        // This likely means a non-POST request or a failure in JSON parsing
        console.error(`Critical: Request body is empty or undefined. Check HTTP method and express.json() middleware.`);
        return res.status(400).json({ message: "Invalid request data. Body is empty." });
    }

    // Extract 'fee' as feeInput to be safely parsed later
    const { doctorId, fee: feeInput, consultReason } = req.body; 

    // 🔥 FIX: Safely parse the fee, assuming it could be a string from the network
    let fee;
    try {
        // The front-end is sending a number, but this protects against network string conversion
        fee = parseFloat(feeInput); 
    } catch (e) {
        fee = NaN;
    }

    // 🚨 Validation: Check for missing IDs or an invalid/non-positive fee
    if (!patientId || !doctorId || isNaN(fee) || fee <= 0) {
        // Log the actual received feeInput for better debugging
        console.error(`Critical: Missing/Invalid data before save. Patient:${patientId}, Doctor:${doctorId}, FeeInput:${feeInput}, ParsedFee:${fee}`);
        return res.status(400).json({ message: "Missing required user data (Patient/Doctor ID or Invalid Fee)." });
    }
    
    try {
        // Atomic Lock: Check isInstantOnline: true AND NOT locked
        const doctor = await User.findOneAndUpdate(
            { 
                uniqueId: doctorId, role: 'doctor', 
                isInstantOnline: true, 
                isLockedForConsultation: { $ne: true } 
            },
            { $set: { isLockedForConsultation: true } }, 
            { new: true }
        );

        if (!doctor || !checkTrueAvailability(doctor)) {
            if (doctor) await User.findByIdAndUpdate(doctor._id, { $set: { isLockedForConsultation: false } }); 
            return res.status(400).json({ message: "Doctor is no longer available or couldn't be locked." });
        }
        
        // Create the Session (Uses the safely parsed fee)
        const newSession = new InstantSession({
            sessionId: `INST-${Date.now()}-${patientId}`, 
            patientId, doctorId, feeAmount: fee,  // Use the parsed fee here
            status: 'pending_payment', 
            lockTime: new Date(),
            consultReason: consultReason || 'Emergency Consult initiated by patient',
        });
        await newSession.save();

        console.log(`[Lock] Doctor ${doctorId} locked by Patient ${patientId}. Session: ${newSession.sessionId}`);

        res.status(201).json({ sessionId: newSession.sessionId, message: "Doctor locked. Proceed to payment." });

    } catch (error) {
        console.error("Error initiating consultation:", error);
        // In case of database error, unlock the doctor if they were locked
        if (req.body.doctorId) {
            try {
                await User.findOneAndUpdate({ uniqueId: req.body.doctorId }, { $set: { isLockedForConsultation: false } });
                console.log(`[UNLOCK] Attempted unlock of Doctor ${req.body.doctorId} due to initiation failure.`);
            } catch (unlockError) {
                console.error("Failed to unlock doctor after initiation error:", unlockError);
            }
        }
        res.status(500).json({ message: "Failed to initiate session due to server error." });
    }
};


// @route POST /api/consult/:sessionId/confirm-payment (Alerts Doctor)
exports.confirmPaymentAndAlertDoctor = async (req, res) => {
    const { sessionId } = req.params;
    const patientId = req.user.uniqueId;

    try {
        const session = await InstantSession.findOneAndUpdate(
            { sessionId: sessionId, patientId: patientId, status: 'pending_payment' },
            { $set: { status: 'pending_doctor_join' } },
            { new: true }
        );

        if (!session) { return res.status(404).json({ message: "Session not found, expired, or payment failed." }); }
        
        // SOCKET.IO ALERT
        const io = req.app.get('socketio');
        const doctorRoom = session.doctorId; 
        if (io) {
            io.to(doctorRoom).emit('incoming_consult', { sessionId: sessionId, patientId: session.patientId, message: `New instant consult from Patient ${session.patientId}. Waiting to join.` });
            console.log(`[ALERT SENT] Doctor ${doctorRoom} notified via Socket.IO.`);
        }

        // Timeout Logic
        setTimeout(async () => {
            try { 
                const currentSession = await InstantSession.findOne({ sessionId: sessionId });
                if (currentSession && currentSession.status === 'pending_doctor_join') {
                    await User.findOneAndUpdate({ uniqueId: currentSession.doctorId }, { $set: { isLockedForConsultation: false } });
                    await InstantSession.findByIdAndUpdate(currentSession._id, { $set: { status: 'failed_timeout' } });
                    console.log(`[TIMEOUT] Session ${sessionId} closed. Doctor unlocked.`);
                }
            } catch (timeoutError) { console.error(`CRITICAL: Error inside timeout for session ${sessionId}:`, timeoutError); }
        }, 60000); 

        res.json({ message: "Payment confirmed. Doctor alerted. Awaiting join.", sessionId: session.sessionId });

    } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({ message: "Failed to confirm payment due to server error." });
    }
};

// @route POST /api/consult/toggle-instant-status 🚨 COMPLETE TOGGLE LOGIC
exports.toggleInstantStatus = async (req, res) => {
    const doctorId = req.user.uniqueId;
    const { action } = req.body; 

    if (!doctorId || !['go-online', 'go-offline'].includes(action)) {
        return res.status(400).json({ message: "Invalid action provided." });
    }

    try {
        const isOnline = action === 'go-online';

        // 1. Atomically update the isInstantOnline status
        const updatedDoctor = await User.findOneAndUpdate(
            { uniqueId: doctorId, role: 'doctor' }, 
            { $set: { isInstantOnline: isOnline } }, 
            { new: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ message: "Doctor profile not found or role mismatch." });
        }
        
        // If the doctor is going OFFLINE, force-unlock any lingering session lock
        if (!isOnline) {
             await User.findByIdAndUpdate(updatedDoctor._id, { $set: { isLockedForConsultation: false } });
        }


        // 2. Respond with the new status
        res.json({ 
            message: `Instant status set to ${isOnline ? 'ONLINE' : 'OFFLINE'}.`,
            isInstantOnline: updatedDoctor.isInstantOnline,
            isLockedForConsultation: updatedDoctor.isLockedForConsultation
        });

    } catch (error) {
        console.error("DB Error toggling instant status:", error);
        res.status(500).json({ message: "Server error occurred while updating status." });
    }
};


// @route POST /api/consult/:sessionId/join-doctor
exports.doctorJoinsCall = async (req, res) => {
    const { sessionId } = req.params;
    const doctorId = req.user.uniqueId;

    try {
        const session = await InstantSession.findOneAndUpdate(
            { sessionId: sessionId, doctorId: doctorId, status: 'pending_doctor_join' },
            { $set: { status: 'active', call_start_time: new Date() } },
            { new: true }
        );

        if (!session) {
            return res.status(400).json({ message: "Session is not ready, belongs to another doctor, or has timed out." });
        }
        
        console.log(`[JOIN] Doctor ${doctorId} has joined. Session ${sessionId} is now ACTIVE.`);
        res.json({ message: "Call started successfully." });

    } catch (error) {
        console.error("Error joining call:", error);
        res.status(500).json({ message: "Failed to join call due to server error." });
    }
};

// @route POST /api/consult/:sessionId/end
exports.endConsultation = async (req, res) => {
    const { sessionId } = req.params;
    
    try {
        const session = await InstantSession.findOneAndUpdate(
            { sessionId: sessionId, status: { $ne: 'completed' } },
            { $set: { status: 'completed', call_end_time: new Date() } }
        );

        if (!session) {
            return res.status(404).json({ message: "Session already ended or not found." });
        }
        
        // Unlock Doctor
        await User.findOneAndUpdate(
            { uniqueId: session.doctorId },
            { $set: { isLockedForConsultation: false } } 
        );

        console.log(`[UNLOCK] Doctor ${session.doctorId} unlocked.`);
        
        res.json({ message: "Consultation ended. Doctor is now available." });

    } catch (error) {
        console.error("Error ending consultation:", error);
        res.status(500).json({ message: "Failed to end session due to server error." });
    }
};


