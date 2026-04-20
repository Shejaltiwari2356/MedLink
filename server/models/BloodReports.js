const mongoose = require('mongoose');

const bloodReportSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true,
  },
  fileData: {
    type: Buffer,
    required: true,
  },
  aiSummary: {
    type: String,
    default: "",
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
}, { 
  timestamps: true
});

module.exports = mongoose.model('BloodReport', bloodReportSchema);