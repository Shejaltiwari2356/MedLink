const Prescription = require("../models/Prescription");
const multer = require("multer");
const archiver = require("archiver");

// ✅ In-memory file storage (saves in `req.files[].buffer`)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Export middleware to use in route
exports.uploadPrescription = upload.array("files", 10);

// ==========================
// CREATE
// ==========================
exports.addPrescription = async (req, res) => {
  try {
    const { uniqueId, title } = req.body;

    if (!uniqueId || !title) {
      return res.status(400).json({ message: "uniqueId and title are required." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded." });
    }

    // ✅ Store both filename and actual binary buffer
    const filesArray = req.files.map((file) => ({
      fileName: file.originalname,
      fileData: file.buffer,
      contentType: file.mimetype,
    }));

    const newPrescription = new Prescription({
      uniqueId,
      title,
      files: filesArray,
    });

    await newPrescription.save();

    res.status(201).json({
      message: "Prescription uploaded successfully.",
      prescription: newPrescription,
    });
  } catch (error) {
    console.error("❌ Error in addPrescription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// READ - All prescriptions
// ==========================
exports.getPrescriptions = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const prescriptions = await Prescription.find({ uniqueId });

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error("❌ Error in getPrescriptions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// READ - Specific file
// ==========================
exports.getPrescriptionFile = async (req, res) => {
  try {
    const { id, fileIndex } = req.params;
    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (fileIndex !== undefined) {
      const file = prescription.files[fileIndex];
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.set({
        "Content-Type": file.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${file.fileName}"`,
      });

      return res.send(file.fileData);
    }

    if (!prescription.files || prescription.files.length === 0) {
      return res.status(404).json({ message: "No files found in this prescription." });
    }

    // Create ZIP of all files
    res.attachment(`${prescription.title || "prescription"}.zip`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    prescription.files.forEach((file) => {
      archive.append(file.fileData, { name: file.fileName });
    });

    await archive.finalize();
  } catch (error) {
    console.error("❌ Error in getPrescriptionFile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// UPDATE - Add more files
// ==========================
exports.addMoreFiles = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No new files were uploaded." });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription record not found." });
    }

    const newFiles = req.files.map((file) => ({
      fileName: file.originalname,
      fileData: file.buffer,
      contentType: file.mimetype,
    }));

    prescription.files.push(...newFiles);
    await prescription.save();

    res.status(200).json({ message: "Files added successfully.", prescription });
  } catch (error) {
    console.error("❌ Error in addMoreFiles:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// DELETE - Single file
// ==========================
exports.deleteSingleFile = async (req, res) => {
  try {
    const { id, fileIndex } = req.params;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found." });
    }

    const index = parseInt(fileIndex, 10);
    if (isNaN(index) || index < 0 || index >= prescription.files.length) {
      return res.status(400).json({ message: "Invalid file index." });
    }

    prescription.files.splice(index, 1);
    await prescription.save();

    res.status(200).json({ message: "File deleted successfully.", prescription });
  } catch (error) {
    console.error("❌ Error in deleteSingleFile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// DELETE - Entire prescription
// ==========================
exports.deletePrescriptionEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Prescription.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Prescription not found." });
    }

    res.status(200).json({ message: "Prescription deleted successfully.", deletedId: id });
  } catch (error) {
    console.error("❌ Error in deletePrescriptionEntry:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// DIGITAL PRESCRIPTION (Doctor Added)
// ==========================
exports.addDigitalPrescription = async (req, res) => {
  try {
    const { doctorId, patientId, medicines, notes, title } = req.body;

    if (!doctorId || !patientId || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "Doctor, patient and at least one medicine are required." });
    }

    const newPrescription = new Prescription({
      uniqueId: patientId, // so it shows in patient’s view
      title: title || "Digital Prescription",
      doctorId,
      patientId,
      medicines,
      notes,
      type: "digital",
    });

    await newPrescription.save();

    res.status(201).json({
      message: "Digital prescription created successfully.",
      prescription: newPrescription,
    });
  } catch (error) {
    console.error("❌ Error in addDigitalPrescription:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================
// DIGITAL PRESCRIPTION WITH SIGNATURE
// ==========================
exports.addDigitalPrescriptionWithSignature = async (req, res) => {
  try {
    const { doctorId, patientId, medicines, notes, title, doctorSignature } =
      req.body;

    if (!doctorId || !patientId || !Array.isArray(medicines) || medicines.length === 0) {
      return res
        .status(400)
        .json({ message: "Doctor, patient, and at least one medicine are required." });
    }

    if (!doctorSignature) {
      return res.status(400).json({ message: "Doctor signature is required." });
    }

    const newPrescription = new Prescription({
      uniqueId: patientId,
      title: title || "Digital Prescription",
      doctorId,
      patientId,
      medicines,
      notes,
      doctorSignature,
      type: "digital",
    });

    await newPrescription.save();

    res.status(201).json({
      message: "Digital prescription with signature created successfully.",
      prescription: newPrescription,
    });
  } catch (error) {
    console.error("❌ Error in addDigitalPrescriptionWithSignature:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
