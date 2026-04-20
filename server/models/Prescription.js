const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g., "1-0-1"
});

const prescriptionSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    files: [
      {
        fileName: { type: String, required: true },
        fileData: { type: Buffer, required: true },
        contentType: { type: String },
      },
    ],
    uploadDate: {
      type: Date,
      default: Date.now,
    },

    // 🆕 New fields for digital prescription
    doctorId: { type: String, ref: "User" },
    patientId: { type: String, ref: "User" },
    medicines: [medicineSchema],
    notes: { type: String },
    type: { type: String, default: "file" }, // "file" or "digital"
    doctorSignature: {
      type: String, // base64 image string
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
