import React, { useState, useEffect } from "react";
import { Trash2, Loader2, Download, Plus, FileText } from "lucide-react";
import axios from "axios";
// Assuming AddPrescriptionForm is imported and used in a modal/conditional render

// You can move apiClient to a central file to avoid redefining it
const apiClient = axios.create({ baseURL: "http://localhost:5000/api" });
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A mock component to represent the full Prescriptions page
const MyPrescriptionsPage = ({ patientId = "PAT-10000" }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // Track which item is being deleted

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      // Replace with your actual GET endpoint
      const response = await apiClient.get(
        `/prescriptions/list-for-patient/${patientId}`
      );
      // Mocking the data structure based on the screenshot
      const mockData = [
        { id: 1, title: "helloe", date: "August 19, 2025" },
        { id: 2, title: "hello", date: "August 19, 2025" },
        { id: 3, title: "file1", date: "August 19, 2025" },
        { id: 4, title: "file2", date: "August 19, 2025" },
        { id: 5, title: "file1", date: "August 19, 2025" },
      ];
      setPrescriptions(mockData); // Use mock data for this example
      // setPrescriptions(response.data); // Use actual data in production
    } catch (err) {
      setError("Failed to fetch prescriptions.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * The core function to delete a prescription entry.
   * @param {number} prescriptionId The ID of the prescription entry to delete.
   */
  const handleDeletePrescription = async (prescriptionId) => {
    // Confirmation dialog is a good idea before permanent deletion
    if (
      !window.confirm(
        "Are you sure you want to delete this prescription entry?"
      )
    ) {
      return;
    }

    setDeletingId(prescriptionId);
    try {
      // 1. **API Call:** Send a DELETE request to your backend
      await apiClient.delete(`/prescriptions/${prescriptionId}`);

      // 2. **UI Update:** Filter the deleted item out of the current state
      setPrescriptions((prev) => prev.filter((p) => p.id !== prescriptionId));

      // Optional: Show a success message
      console.log(`Prescription ID ${prescriptionId} deleted successfully.`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete prescription. Please try again."
      );
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <Loader2 className="animate-spin mr-2" /> Loading Prescriptions...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">My Prescriptions</h2>
      {error && (
        <p className="mb-4 bg-red-100 text-red-700 p-3 rounded-md border border-red-200">
          Error: {error}
        </p>
      )}

      {/* Create New File Section */}
      <div className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3">Create New File</h3>
        {/* Simplified Upload Area - onClick would open the AddPrescriptionForm modal */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center w-full py-3 px-4 border border-indigo-500 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition duration-150"
        >
          <Plus size={20} className="mr-2" /> Upload New Prescription
        </button>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium border-b pb-2">History</h3>
        {prescriptions.length === 0 ? (
          <p className="text-gray-500">No prescriptions found.</p>
        ) : (
          prescriptions.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition duration-150"
            >
              <div className="flex items-center space-x-3">
                <FileText size={24} className="text-indigo-500" />
                <div>
                  <p className="font-medium text-gray-800">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.date}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  title="Add More Files"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Add File
                </button>
                <button
                  title="Download All Files"
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <Download size={16} className="mr-1" /> Download All
                </button>

                {/* The new Delete Button */}
                <button
                  title="Delete Prescription"
                  onClick={() => handleDeletePrescription(p.id)}
                  disabled={deletingId === p.id}
                  className="p-1 rounded-full text-red-500 hover:bg-red-100 disabled:opacity-50 transition"
                >
                  {deletingId === p.id ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Trash2 size={20} />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Conditional render of the AddForm modal */}
      {/* {isModalOpen && (
                <AddPrescriptionForm 
                    patientId={patientId}
                    onUploadSuccess={() => {
                        setIsModalOpen(false);
                        fetchPrescriptions(); // Refresh list on success
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            )} */}
    </div>
  );
};

export default MyPrescriptionsPage;
