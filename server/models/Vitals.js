const mongoose = require('mongoose');

const VitalsSchema = new mongoose.Schema({
  uniqueId: {
    type: String,  // 👈 store the User's uniqueId string, not ObjectId
    ref: 'User',
    required: true,
  },
  bodyTemperature: { type: Number, required: true },
  bloodPressure: { type: String, required: true },
  heartRate: { type: Number, required: true },
  respiratoryRate: { type: Number, required: true },
  spo2: { type: Number, required: true },
  sugarBeforeMeal: { type: Number },
  sugarAfterMeal: { type: Number },
  height: { type: Number },
  weight: { type: Number },
  bmi: { type: Number },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Vitals', VitalsSchema);
