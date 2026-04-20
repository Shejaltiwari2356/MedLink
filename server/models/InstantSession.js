// Filename: models/InstantSession.js
const mongoose = require("mongoose");

const instantSessionSchema = new mongoose.Schema(
    {
        // Unique identifier for the live session/call instance
        sessionId: { 
            type: String, 
            required: true, 
            unique: true,
            default: () => `INST-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
        },

        // References the patient who initiated the request (User.uniqueId)
        patientId: { 
            type: String, 
            required: true,
            ref: 'User'
        },

        // References the doctor who was locked/selected (User.uniqueId)
        doctorId: { 
            type: String, 
            required: true,
            ref: 'User'
        },

        // The exact fee charged for this specific instant session
        feeAmount: { 
            type: Number, 
            required: true 
        },

        // Current status of the call session (used for logic in the controller)
        status: { 
            type: String, 
            enum: ['pending_payment', 'pending_doctor_join', 'active', 'completed', 'failed_timeout'], 
            required: true,
            default: 'pending_payment'
        },
        
        // Time when the doctor was locked/session was created
        lockTime: {
            type: Date,
            default: Date.now,
        },

        // Time the doctor joined the call
        callStartTime: { 
            type: Date 
        },

        // Time the call ended
        callEndTime: { 
            type: Date 
        },

        // Optional: Reason/Symptom provided by the patient before payment
        consultReason: {
            type: String,
            trim: true,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("InstantSession", instantSessionSchema);

