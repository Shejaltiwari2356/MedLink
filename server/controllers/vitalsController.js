// Filename: controllers/vitalsController.js
const Vitals = require('../models/Vitals'); 
// Assuming authMiddleware has passed the user object with uniqueId in protected routes

// Helper function to dynamically determine the status for a reading
const determineStatus = (name, value, bpSystolic, bpDiastolic) => {
    if (value === null || value === undefined) return 'Normal';

    // Ensure value is treated as a number where necessary
    const numValue = Number(value);

    switch (name) {
        case "Blood Pressure":
            // Critical if >= 140/90. Warning if >= 130/80
            if (bpSystolic >= 140 || bpDiastolic >= 90) return 'Critical';
            if (bpSystolic >= 130 || bpDiastolic >= 80) return 'Warning';
            return 'Normal';

        case "Heart Rate":
            // Normal range: 60-100 BPM
            if (numValue > 130 || numValue < 40) return 'Critical';
            if (numValue > 110 || numValue < 50) return 'Warning';
            return 'Normal';

        case "Body Temperature":
            // Critical if >= 103F. Warning if >= 99.5F or <= 96F
            if (numValue >= 103) return 'Critical';
            if (numValue >= 99.5 || numValue <= 96) return 'Warning';
            return 'Normal';

        case "SpO2":
            // Normal range: 95-100%
            if (numValue < 90) return 'Critical';
            if (numValue < 94) return 'Warning';
            return 'Normal';

        case "Respiratory Rate":
            // Normal range: 12-20 breaths/min
            if (numValue > 24 || numValue < 8) return 'Critical';
            if (numValue > 20 || numValue < 12) return 'Warning';
            return 'Normal';

        case "BMI":
            // Healthy range: 18.5 - 24.9
            if (numValue >= 30) return 'Critical'; // Obesity
            if (numValue < 18.5) return 'Warning'; // Underweight
            return 'Normal';
            
        case "Sugar Before Meal":
            // Critical if >= 200 mg/dL. Warning if >= 100 mg/dL
            if (numValue >= 200) return 'Critical';
            if (numValue >= 100) return 'Warning'; 
            return 'Normal';

        default:
            return 'Normal';
    }
}


// 🏥 Server-side validation function 
const validateAndSanitizeVitals = (data) => {
    const { bodyTemperature } = data;
    if (bodyTemperature > 200) return "Invalid temperature."; 
    return null; 
}


// --- API Functions ---

// POST /api/vitals/add (Protected)
const addVitals = async (req, res) => {
    try {
        const uniqueId = req.user.uniqueId;
        const {
            bodyTemperature, bloodPressure, heartRate, respiratoryRate, spo2,
            sugarBeforeMeal, sugarAfterMeal, height, weight, bmi, date
        } = req.body;
        
        // --- Validation Logic ---
        const bpParts = bloodPressure.split('/');
        if (bpParts.length !== 2) {
             return res.status(400).json({ message: 'Invalid Blood Pressure format.' });
        }
        const validationData = {
            ...req.body,
            systolic: bpParts[0],
            diastolic: bpParts[1]
        };
        const validationError = validateAndSanitizeVitals(validationData);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        // --- End Validation Logic ---

        const newVitals = new Vitals({
            uniqueId, bodyTemperature, bloodPressure, heartRate, respiratoryRate, spo2,
            sugarBeforeMeal, sugarAfterMeal, height, weight, bmi, date
        });

        await newVitals.save();
        res.status(201).json({ message: 'Vitals data saved successfully!', vitals: newVitals });
    } catch (err) {
        console.error("Error in addVitals:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/vitals/ (Protected)
const getVitals = async (req, res) => {
    try {
        const uniqueId = req.user.uniqueId;
        // NOTE: Keeping date sort here is acceptable for a history list
        const vitals = await Vitals.find({ uniqueId }).sort({ date: -1 }); 
        res.status(200).json({ vitals });
    } catch (err) {
        console.error("Error in getVitals:", err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/vitals/:id (Protected)
const deleteVitals = async (req, res) => {
    try {
        const _id = req.params.id; 
        const uniqueId = req.user.uniqueId; 

        const deletedVitals = await Vitals.findOneAndDelete({ _id, uniqueId });

        if (!deletedVitals) {
            return res.status(404).json({ message: 'Vital record not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Vital record deleted successfully.' });
    } catch (err) {
        console.error("Error in deleteVitals:", err.message);
        res.status(500).json({ message: 'Server error during deletion.' });
    }
};

// GET /api/vitals/recent/:uniqueId (Unprotected for Dashboard Fetch)
const getRecentVitals = async (req, res) => {
    const { uniqueId } = req.params;

    if (!uniqueId) {
        return res.status(400).json({ message: 'Unique ID is required.' });
    }

    try {
        // 1. Fetch the single, most recent vital entry
        const latestVitals = await Vitals.findOne({ uniqueId: uniqueId })
            // 🐛 FIX: Use _id or createdAt for reliable fetching of the ABSOLUTE latest record
            .sort({ _id: -1 }); 

        if (!latestVitals) {
            return res.status(200).json([]); // No records found
        }
        
        // --- DATA TRANSFORMATION AND ANALYSIS ---
        const [bpSystolic, bpDiastolic] = latestVitals.bloodPressure.split('/').map(Number);
        
        const safeValue = (field) => (field !== null && field !== undefined) ? field.toString() : 'N/A';
        const safeStatus = (name, value) => (value !== null && value !== undefined) ? determineStatus(name, value) : 'Normal';


        const readings = [
            // 1. Blood Pressure
            { 
                name: "Blood Pressure", 
                value: latestVitals.bloodPressure, 
                unit: "mmHg", 
                status: determineStatus("Blood Pressure", null, bpSystolic, bpDiastolic)
            },
            // 2. Heart Rate
            { 
                name: "Heart Rate", 
                value: latestVitals.heartRate.toString(), 
                unit: "bpm", 
                status: determineStatus("Heart Rate", latestVitals.heartRate) 
            },
            // 3. Blood Sugar (Before Meal - Primary Sugar Reading)
            { 
                name: "Blood Sugar", 
                value: safeValue(latestVitals.sugarBeforeMeal), 
                unit: "mg/dL", 
                status: safeStatus("Sugar Before Meal", latestVitals.sugarBeforeMeal)
            },
            // 4. Temperature
            { 
                name: "Temperature", 
                value: latestVitals.bodyTemperature.toFixed(1), 
                unit: "°F", 
                status: determineStatus("Body Temperature", latestVitals.bodyTemperature) 
            },
            // 5. SpO2
            { 
                name: "SpO2", 
                value: safeValue(latestVitals.spo2), 
                unit: "%", 
                status: safeStatus("SpO2", latestVitals.spo2)
            },
            // 6. Respiratory Rate
            { 
                name: "Respiratory Rate", 
                value: safeValue(latestVitals.respiratoryRate), 
                unit: "breaths/min", 
                status: safeStatus("Respiratory Rate", latestVitals.respiratoryRate)
            },
            // 7. BMI
            { 
                name: "BMI", 
                value: latestVitals.bmi ? latestVitals.bmi.toFixed(2) : 'N/A', 
                unit: "", 
                status: safeStatus("BMI", latestVitals.bmi)
            },
            // 8. Weight
            { 
                name: "Weight", 
                value: safeValue(latestVitals.weight), 
                unit: "kg", 
                status: 'Normal' 
            },
            // 9. Height
            { 
                name: "Height", 
                value: safeValue(latestVitals.height), 
                unit: "cm", 
                status: 'Normal' 
            },
            // 10. Sugar After Meal (If required on the dashboard)
            { 
                name: "Sugar (After)", 
                value: safeValue(latestVitals.sugarAfterMeal), 
                unit: "mg/dL", 
                status: safeStatus("Sugar Before Meal", latestVitals.sugarAfterMeal)
            },
        ];

        // Filter out any vitals that couldn't be safely retrieved or are 'N/A'
        const filteredReadings = readings.filter(r => r.value !== 'N/A');

        // Inject the timestamp from the Mongoose document's 'date' field
        if (filteredReadings.length > 0) {
            filteredReadings[0].timestamp = latestVitals.date; 
        }

        // 3. Send the expanded array to the frontend
        res.status(200).json(filteredReadings);

    } catch (err) {
        console.error("Error fetching recent vitals:", err.message);
        res.status(500).json({ message: 'Failed to retrieve recent vitals.', error: err.message });
    }
};


module.exports = { addVitals, getVitals, deleteVitals, getRecentVitals };

