import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  Printer,
  Pill,
  Stethoscope,
  User,
  CalendarDays,
  Loader2,
  FileText,
} from "lucide-react";

// Helper function to calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const DigitalPrescriptionViewModal = ({
  prescription,
  onClose,
  patientId,
  doctorId,
}) => {
  const [patientInfo, setPatientInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token"); // Get token for auth if needed

      // Function to safely fetch data
      const fetchResource = async (uniqueId, setter, fallback) => {
        if (!uniqueId) return setter(fallback);

        // 🚨 FIX 1: Corrected API URL to /api/users/:uniqueId
        const url = `http://localhost:5000/api/auth/${uniqueId}`;

        try {
          const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // 🚨 FIX 2: Access data from res.data.data (as returned by the controller)
          setter(res.data.data);
        } catch (error) {
          console.error(`Failed to fetch info from ${url}:`, error);
          setter(fallback);
        }
      };

      // Fetch Patient Info
      await fetchResource(patientId, setPatientInfo, {
        name: "Unknown Patient",
        dob: "N/A",
        gender: "N/A",
        bloodGroup: "N/A",
      });

      // Fetch Doctor Info
      await fetchResource(doctorId, setDoctorInfo, {
        name: "Unknown Doctor",
        license: "N/A",
        specialization: "N/A",
        degree: "N/A",
      });

      setLoading(false);
    };

    fetchData();
  }, [patientId, doctorId]);

  if (!prescription) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  // Calculate age using the helper function
  const patientAge = calculateAge(patientInfo?.dob);

  // Function to handle printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
      {/* The main document container. Use @media print to style for printing */}
      <style>{`
        /* ... existing print styles ... */
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 scale-100 p-6 sm:p-8 print:p-0">
        {/* Document Content */}
        <div
          id="prescription-document"
          className="bg-white border-4 border-blue-500 rounded-lg shadow-xl p-8 space-y-6"
        >
          {/* 1. HEADER (Website/Clinic Name & Doctor Info) */}
          <header className="text-center border-b-2 border-dashed pb-4">
            <h1 className="text-3xl font-extrabold text-blue-700">MedLink</h1>
            <p className="text-lg text-gray-600">Digital Prescription Record</p>
          </header>

          {/* 2. PATIENT AND DOCTOR INFO BLOCK */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            {/* Doctor Info */}
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-bold text-green-700 flex items-center mb-2">
                <Stethoscope size={16} className="mr-2" /> Prescribing Doctor
              </h3>
              {/* 🚨 FIX: Display full name, degree, and specialization */}
              <p>
                <strong>Dr. Name:</strong> {doctorInfo?.name || "N/A"}
              </p>
              <p>
                <strong>Degree:</strong> {doctorInfo?.degree || "N/A"}
              </p>
              <p>
                <strong>Specialization:</strong>{" "}
                {doctorInfo?.specialization || "N/A"}
              </p>
              <p>
                <strong>License/ID:</strong> {doctorInfo?.license || "N/A"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(prescription.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Patient Info */}
            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <h3 className="font-bold text-indigo-700 flex items-center mb-2">
                <User size={16} className="mr-2" /> Patient Details
              </h3>
              {/* 🚨 FIX: Display full name, age, gender, and blood group */}
              <p>
                <strong>Name:</strong> {patientInfo?.name || "N/A"}
              </p>
              <p>
                <strong>Age:</strong> {patientAge}
              </p>
              <p>
                <strong>Gender:</strong> {patientInfo?.gender || "N/A"}
              </p>
              <p>
                <strong>Blood Group:</strong> {patientInfo?.bloodGroup || "N/A"}
              </p>
              <p>
                <strong>Patient ID:</strong> {patientId}
              </p>
            </div>
          </div>

          {/* 3. MEDICINES TABLE */}
          {/* ... Medicines table content remains the same ... */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <Pill className="mr-2 text-red-500" size={20} /> Medicines
              Prescribed
            </h3>

            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosage / Frequency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prescription.medicines && prescription.medicines.length > 0 ? (
                  prescription.medicines.map((med, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {med.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {med.dosage}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="2"
                      className="px-4 py-3 text-center text-gray-500 italic"
                    >
                      No medicines listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. DOCTOR'S NOTES */}
          <div className="pt-4 border-t border-dashed">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center">
              <FileText className="mr-2 text-indigo-600" size={20} />{" "}
              Instructions / Notes:
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-gray-700 whitespace-pre-wrap italic">
                {prescription.notes ||
                  "No additional notes provided by the doctor."}
              </p>
            </div>
          </div>

          {/* 5. FOOTER/SIGNATURE */}
          <footer className="text-right pt-4 text-sm text-gray-500">
            <p className="mt-4 font-semibold text-gray-700">
              Digital Signature Validated by MedLink
            </p>

            {/* 🚨 FIX: ADDED IMG TAG FOR SIGNATURE */}
            {prescription.doctorSignature && (
              <img
                src={prescription.doctorSignature}
                alt="Doctor Signature"
                className="block w-32 h-16 object-contain mt-1 ml-auto"
              />
            )}

            <p>Prescription ID: {prescription._id.substring(0, 10)}...</p>
          </footer>
        </div>

        {/* Modal Controls (Outside the printable area) */}
        <div className="p-4 flex justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center"
          >
            <Printer size={18} className="mr-2" /> Print
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalPrescriptionViewModal;
