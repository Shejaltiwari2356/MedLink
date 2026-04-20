const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  time: { type: String, required: true }, // e.g., "10:00 AM - 10:30 AM"
  isBooked: { type: Boolean, default: false }
});

const availabilitySchema = new mongoose.Schema({
  day: { type: String, required: true }, // e.g., "Monday"
  slots: [slotSchema]
});

const userSchema = new mongoose.Schema(
  {
    uniqueId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    bloodGroup: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: String, enum: ["doctor", "patient"], required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 👇 only applicable for doctors
    fees: { type: String },
    degree: { type: String },
    specialization: { type: String },
    experience: { type: Number },
    
    // 🟢 ADDITION FOR INSTANT CONSULT AVAILABILITY
    /** * This field stores the doctor's real-time toggle status 
     * (the 'ONLINE' switch in the Doctor Command Center).
     * Used for instant/emergency consultations.
     */
    isInstantOnline: {
        type: Boolean,
        default: false,
        required: function() {
            return this.role === 'doctor';
        }
    },
    
    // Existing availability for scheduled appointments
    availability: [availabilitySchema] 
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

