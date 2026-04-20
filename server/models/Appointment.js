const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    doctorId: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: { type: String, default: "pending" },
    problem: { type: String, required: true },
    roomId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },

    // New fields for payment
    fee: { type: Number, default: 500 }, // example fee
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
