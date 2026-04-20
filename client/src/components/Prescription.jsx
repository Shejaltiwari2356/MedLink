import React, { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  UploadCloud,
  FileText,
  Archive,
  CalendarDays,
  FilePlus,
  Loader2,
  Eye,
  Trash2,
  X,
} from "lucide-react";

// The modal component is already correctly imported:
import AddDigitalPrescriptionModal from "./AddDigitalPrescriptionModal";
import DigitalPrescriptionViewModal from "./DigitalPrescriptionViewModal";

// Assuming you also define setRole in your component setup
const Prescription = ({ patientIdForDoctor, isHistoryView }) => {
  const [title, setTitle] = useState("");
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isDragOver, setIsDragOver] = useState(false);

  // --- DIGITAL VIEW STATE (Already correctly defined) ---
  const [viewingDigitalPrescription, setViewingDigitalPrescription] =
    useState(null);

  // 🚨 Corrected State: Use a clear name for the modal control
  const [isDigitalModalOpen, setIsDigitalModalOpen] = useState(false);

  const [jwtUniqueId, setJwtUniqueId] = useState(null); // The ID from the JWT (Doctor or Patient)
  const [role, setRole] = useState(null); // Added role state, which is required for ID logic

  // State and refs for modifying existing entries
  const [isAddingFileTo, setIsAddingFileTo] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [deletingEntryId, setDeletingEntryId] = useState(null);

  const fileInputRef = useRef(null);
  const addFileInputRef = useRef(null);

  // 🚨 Corrected Logic: Determine the target ID based on view context.
  // The unique ID of the user whose records are being displayed (Patient ID)
  const currentUniqueId = isHistoryView ? patientIdForDoctor : jwtUniqueId;

  // Get uniqueId and role from JWT on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded Token:", decoded);

        // Use the correct field from your token (assuming 'uniqueId' or 'id' holds the primary user ID)
        setJwtUniqueId(decoded.uniqueId || decoded.id || decoded.doctorId);
        setRole(decoded.role || "doctor"); // Assuming a default role if viewing a doctor/patient page
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }
  }, []);

  // Fetch prescriptions when currentUniqueId is available
  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (currentUniqueId) {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/prescriptions/${currentUniqueId}`
          );
          setPrescriptions(
            res.data.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )
          );
        } catch (err) {
          console.error("Fetch error:", err);
          setMessage({ type: "error", text: "Could not fetch prescriptions." });
        }
      } else {
        setPrescriptions([]);
      }
    };
    fetchPrescriptions();
  }, [currentUniqueId]);

  // --- Handlers for Main Upload Form (kept as is) ---
  const handleFileSelection = (selectedFiles) => {
    setMessage({ type: "", text: "" });
    const newFiles = Array.from(selectedFiles).map((file) => ({
      file: file,
      customName: "",
    }));
    setFilesToUpload((prev) => [...prev, ...newFiles]);
  };

  const handleCustomNameChange = (index, newName) => {
    const updatedFiles = [...filesToUpload];
    updatedFiles[index].customName = newName;
    setFilesToUpload(updatedFiles);
  };

  const removeFileFromStage = (indexToRemove) => {
    setFilesToUpload(
      filesToUpload.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelection(e.dataTransfer.files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);

  // 🚨 NEW HANDLER: Opens the modal and sets the prescription data
  const handleViewDigital = (prescription) => {
    setViewingDigitalPrescription(prescription);
  };

  // 🚨 NEW HANDLER: Closes the modal
  const handleCloseDigitalViewModal = () => {
    setViewingDigitalPrescription(null);
  };
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || filesToUpload.length === 0 || !currentUniqueId) {
      setMessage({
        type: "error",
        text: "Title and at least one file are required.",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    formData.append("uniqueId", currentUniqueId);
    formData.append("title", title);

    const customNames = filesToUpload.map((f) => f.customName || f.file.name);
    formData.append("fileNames", JSON.stringify(customNames));

    filesToUpload.forEach((f) => formData.append("files", f.file));

    try {
      const res = await axios.post(
        "http://localhost:5000/api/prescriptions/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        }
      );

      setMessage({ type: "success", text: "Files uploaded successfully!" });
      setTitle("");
      setFilesToUpload([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPrescriptions((prev) =>
        [res.data.prescription, ...prev].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Upload failed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers for History Section Actions (kept as is) ---
  const handleTriggerAddFile = (prescriptionId) => {
    setIsAddingFileTo(prescriptionId);
    addFileInputRef.current.click();
  };

  const handleAddMoreFiles = async (event) => {
    const files = event.target.files;
    if (!files.length || !isAddingFileTo) {
      setIsAddingFileTo(null);
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const res = await axios.post(
        `http://localhost:5000/api/prescriptions/add-files/${isAddingFileTo}`,
        formData
      );
      setPrescriptions((prev) =>
        prev.map((p) => (p._id === isAddingFileTo ? res.data.prescription : p))
      );
      setMessage({ type: "success", text: "Files added successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to add files.",
      });
    } finally {
      setIsAddingFileTo(null);
      if (addFileInputRef.current) addFileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (prescriptionId, fileIndex) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this file? This action cannot be undone."
      )
    )
      return;

    setDeletingFile({ prescriptionId, fileIndex });
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/prescriptions/${prescriptionId}/file/${fileIndex}`
      );
      setPrescriptions((prev) =>
        prev.map((p) => (p._id === prescriptionId ? res.data.prescription : p))
      );
      setMessage({ type: "success", text: "File deleted successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete file.",
      });
    } finally {
      setDeletingFile(null);
    }
  };

  /**
   * Handles deletion of the entire prescription entry.
   */
  const handleDeleteEntry = async (prescriptionId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this entire prescription file (including all contained documents)? This action cannot be undone."
      )
    )
      return;

    setDeletingEntryId(prescriptionId); // Start loading state
    try {
      await axios.delete(
        `http://localhost:5000/api/prescriptions/${prescriptionId}`
      );

      // Remove the deleted entry from the local state
      setPrescriptions((prev) => prev.filter((p) => p._id !== prescriptionId));

      setMessage({
        type: "success",
        text: "Prescription entry deleted successfully!",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message || "Failed to delete prescription entry.",
      });
    } finally {
      setDeletingEntryId(null); // Stop loading state
    }
  };

  const handlePreviewFile = (prescriptionId, fileIndex) => {
    window.open(
      `http://localhost:5000/api/prescriptions/${prescriptionId}/file/${fileIndex}`,
      "_blank"
    );
  };

  const handleDownloadAll = (prescriptionId) => {
    window.open(
      `http://localhost:5000/api/prescriptions/${prescriptionId}`,
      "_blank"
    );
  };

  // 🚨 NEW HANDLER: To update the list and close the modal on success
  const handleDigitalPrescriptionSuccess = (newPrescription) => {
    // Add the new prescription to the state and keep it sorted by date
    setPrescriptions((prev) =>
      [newPrescription, ...prev].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )
    );
    setIsDigitalModalOpen(false);
  };

  // Determine if the "Add Digital" button should show (only for doctor view)
  const shouldShowDigitalButton = role === "doctor" && isHistoryView;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen text-gray-800">
      <input
        type="file"
        multiple
        ref={addFileInputRef}
        onChange={handleAddMoreFiles}
        className="hidden"
        accept="application/pdf"
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {isHistoryView ? "Patient Health Records" : "My Prescriptions"}
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Here you can manage medical documents. Create a new file entry with
            multiple PDFs, add more files to an entry at any time, and download
            them whenever you need.
          </p>
        </div>

        {/* ➕ Add New Digital Prescription Button (Only visible for Doctors viewing patient history) */}
        {shouldShowDigitalButton && (
          <button
            onClick={() => setIsDigitalModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-all"
          >
            ➕ Add Digital Prescription
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Upload Section (Only visible for Patient/default view) --- */}
        {!isHistoryView && (
          <div className="lg:col-span-1">
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Create New File</h2>
              <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="e.g., Follow-up with Dr. Smith"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragOver
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PDF files up to 5MB</p>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelection(e.target.files)}
                    className="hidden"
                    accept="application/pdf"
                  />
                </div>

                {filesToUpload.length > 0 && (
                  <div className="space-y-3 mt-2 max-h-48 overflow-y-auto pr-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Files to Upload:
                    </h3>
                    {filesToUpload.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 bg-gray-50 p-2 rounded-md border"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm truncate font-medium">
                            {item.file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFileFromStage(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter a custom name (optional)"
                          value={item.customName}
                          onChange={(e) =>
                            handleCustomNameChange(index, e.target.value)
                          }
                          className="w-full text-sm border-gray-300 rounded-md shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {isLoading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:from-blue-600 group-hover:to-indigo-700"
                >
                  {isLoading ? `Uploading... ${uploadProgress}%` : "Upload"}
                </button>

                {message.text && (
                  <div
                    className={`p-3 rounded-lg text-center text-sm ${
                      message.type === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* --- History Section --- */}
        <div className={isHistoryView ? "lg:col-span-3" : "lg:col-span-2"}>
          <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">History</h2>
            <div className="space-y-4">
              {currentUniqueId && prescriptions.length === 0 && (
                <p className="text-gray-500">
                  No history found. Create your first file!
                </p>
              )}

              {prescriptions.map((pres) => (
                <div
                  key={pres._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <p className="font-semibold">{pres.title}</p>

                      {/* 🚨 NEW: Display Doctor ID/Name if it's a digital prescription */}
                      {pres.type === "digital" && pres.doctorId && (
                        <p className="text-sm text-gray-500 mt-1">
                          Prescribed by Doctor ID: {pres.doctorId}
                        </p>
                      )}

                      <p className="flex items-center text-sm text-gray-500 mt-1">
                        <CalendarDays size={14} className="mr-1.5" />
                        {new Date(pres.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* 🚨 CHECK TYPE: Only show File Upload buttons for "file" type */}
                      {pres.type !== "digital" && (
                        <>
                          <button
                            onClick={() => handleTriggerAddFile(pres._id)}
                            disabled={!!isAddingFileTo}
                            className="flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-blue-100 disabled:opacity-50"
                          >
                            {isAddingFileTo === pres._id ? (
                              <Loader2
                                size={16}
                                className="mr-2 animate-spin"
                              />
                            ) : (
                              <FilePlus size={16} className="mr-2" />
                            )}{" "}
                            Add File
                          </button>
                          <button
                            onClick={() => handleDownloadAll(pres._id)}
                            className="flex items-center bg-gray-100 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-200"
                          >
                            <Archive size={16} className="mr-2" /> Download All
                          </button>
                        </>
                      )}
                      {/* 🚨 NEW BUTTON: Show a specific button for Digital Prescriptions */}
                      {pres.type === "digital" && (
                        <button
                          // 🚨 CHANGE: Pass the entire 'pres' object to the handler
                          onClick={() => handleViewDigital(pres)}
                          className="flex items-center bg-blue-600 text-white px-3 py-1.5 text-sm font-medium rounded-md hover:bg-blue-700"
                        >
                          <Eye size={16} className="mr-2" /> View Digital
                        </button>
                      )}
                      {/* DELETE ENTRY BUTTON - REMAINS FOR BOTH TYPES */}
                      <button
                        onClick={() => handleDeleteEntry(pres._id)}
                        disabled={deletingEntryId === pres._id}
                        className="flex items-center bg-red-100 text-red-700 px-3 py-1.5 text-sm font-medium rounded-md hover:bg-red-200 disabled:opacity-50"
                        title="Delete Prescription Entry"
                      >
                        {deletingEntryId === pres._id ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <Trash2 size={16} className="mr-2" />
                        )}{" "}
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* 🚨 CHECK TYPE: Only show the file list if it's NOT digital and has files */}
                  {pres.type !== "digital" &&
                    pres.files &&
                    pres.files.length > 0 && (
                      <div className="border-t pt-3 mt-3 space-y-2">
                        {pres.files.map((file, index) => {
                          const isDeleting =
                            deletingFile?.prescriptionId === pres._id &&
                            deletingFile?.fileIndex === index;
                          return (
                            <div
                              key={index}
                              className={`flex items-center justify-between bg-gray-50 p-2 rounded-md ${
                                isDeleting ? "opacity-50" : ""
                              }`}
                            >
                              <div className="flex items-center min-w-0">
                                <FileText
                                  className="text-blue-500 mr-2 flex-shrink-0"
                                  size={18}
                                />
                                <span className="text-sm truncate">
                                  {file.fileName}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 ml-2">
                                <button
                                  onClick={() =>
                                    handlePreviewFile(pres._id, index)
                                  }
                                  className="flex items-center text-blue-600 text-sm font-semibold hover:text-blue-800 disabled:opacity-50"
                                  disabled={isDeleting}
                                >
                                  <Eye size={16} className="mr-1" />
                                  Preview
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteFile(pres._id, index)
                                  }
                                  className="flex items-center text-red-600 text-sm font-semibold hover:text-red-800 disabled:opacity-50"
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <Loader2
                                      size={16}
                                      className="mr-1 animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={16} className="mr-1" />
                                  )}
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* 🚨 NEW: Show a message if it's digital type */}
                  {pres.type === "digital" && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm text-green-600 font-medium">
                        This is a digital prescription entry. Click "View
                        Digital" to see details.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 CORRECTLY RENDERED AddDigitalPrescriptionModal */}
      {isDigitalModalOpen && jwtUniqueId && patientIdForDoctor && (
        <AddDigitalPrescriptionModal
          // The doctor's ID is the JWT ID when they are viewing a patient's history.
          doctorId={jwtUniqueId}
          // The patient's ID is passed via props when the doctor is viewing their history.
          patientId={patientIdForDoctor}
          onClose={() => setIsDigitalModalOpen(false)}
          // Use the new, clean handler
          onSuccess={handleDigitalPrescriptionSuccess}
        />
      )}
      {/* 🚨 UPDATED: DigitalPrescriptionViewModal - Passing IDs */}
      {viewingDigitalPrescription && (
        <DigitalPrescriptionViewModal
          prescription={viewingDigitalPrescription}
          onClose={handleCloseDigitalViewModal}
          // 🚨 IMPORTANT: Pass the Patient ID for the lookup
          patientId={currentUniqueId}
          // 🚨 IMPORTANT: Pass the Doctor ID from the prescription for the lookup
          doctorId={viewingDigitalPrescription.doctorId}
        />
      )}
    </div>
  );
};

export default Prescription;
