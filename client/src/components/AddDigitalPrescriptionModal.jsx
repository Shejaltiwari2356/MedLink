import React, { useState, useRef } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import { X } from "lucide-react";

const AddDigitalPrescriptionModal = ({
  doctorId,
  patientId,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "" }]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const sigCanvas = useRef(null);

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", dosage: "" }]);
  };

  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    let doctorSignature = null;

    // 🚨 THE ROBUST FIX (Line 43 substitute):
    // Use getCanvas() which is more stable across bundlers, and check if it's empty.
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      // Use getCanvas() to get the full canvas and convert it to a data URL.
      // This bypasses the problematic getTrimmedCanvas() function.
      doctorSignature = sigCanvas.current.getCanvas().toDataURL("image/png");
    }
    // END FIX

    try {
      const res = await axios.post(
        "http://localhost:5000/api/prescriptions/addDigitalWithSignature",
        {
          doctorId,
          patientId,
          title,
          medicines,
          notes,
          doctorSignature,
        }
      );

      setMessage("Prescription added successfully!");
      setLoading(false);
      onSuccess(res.data.prescription);
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error adding prescription.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          New Prescription
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Prescription title"
            className="w-full border rounded-lg p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Medicines
            </h3>
            {medicines.map((med, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Medicine name"
                  className="flex-1 border rounded-lg p-2"
                  value={med.name}
                  onChange={(e) =>
                    handleMedicineChange(index, "name", e.target.value)
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 1-0-1)"
                  className="w-32 border rounded-lg p-2"
                  value={med.dosage}
                  onChange={(e) =>
                    handleMedicineChange(index, "dosage", e.target.value)
                  }
                  required
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeMedicineRow(index)}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addMedicineRow}
              className="text-blue-600 font-medium mt-1"
            >
              + Add Medicine
            </button>
          </div>

          <textarea
            placeholder="Additional notes (optional)"
            className="w-full border rounded-lg p-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {/* 🖋 Signature pad */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Doctor’s Signature
            </h3>
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 150,
                className: "border border-gray-300 rounded-lg",
              }}
            />
            <button
              type="button"
              onClick={clearSignature}
              className="text-sm text-red-500 mt-2"
            >
              Clear Signature
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Prescription"}
          </button>

          {message && (
            <p className="text-center text-sm text-green-600 mt-2">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddDigitalPrescriptionModal;
