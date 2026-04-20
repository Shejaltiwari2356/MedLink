const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/PrescriptionController");

// Upload new prescription
router.post(
  "/upload",
  prescriptionController.uploadPrescription,
  prescriptionController.addPrescription
);

// Add more files
router.post(
  "/add-files/:id",
  prescriptionController.uploadPrescription,
  prescriptionController.addMoreFiles
);

// Delete single file
router.delete("/:id/file/:fileIndex", prescriptionController.deleteSingleFile);

// Delete entire prescription
router.delete("/:id", prescriptionController.deletePrescriptionEntry);

// Download single file
router.get("/:id/file/:fileIndex", prescriptionController.getPrescriptionFile);

// Download all files (ZIP)
router.get("/download/:id", prescriptionController.getPrescriptionFile);

// Get all prescriptions for a user
// router.get("/user/:uniqueId", prescriptionController.getPrescriptions);
router.get("/:uniqueId", prescriptionController.getPrescriptions);

// Add new digital prescription (no files)
router.post("/addDigital", prescriptionController.addDigitalPrescription);

router.post(
  "/addDigitalWithSignature",
  prescriptionController.addDigitalPrescriptionWithSignature
);


module.exports = router;
