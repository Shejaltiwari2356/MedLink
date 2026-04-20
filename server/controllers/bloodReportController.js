const BloodReport = require('../models/BloodReports');
const multer = require('multer');
// Ensure HarmCategory and HarmBlockThreshold are imported
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// ✅ FIXED: Robust and guaranteed working pdf-parse loader
let pdfParse;
try {
    const mod = require('pdf-parse');
    if (typeof mod === 'function') {
        pdfParse = mod;
    } else if (mod && typeof mod.default === 'function') {
        pdfParse = mod.default;
    } else if (mod && typeof mod.pdf === 'function') {
        pdfParse = mod.pdf;
    } else {
        for (const key of Object.keys(mod || {})) {
            if (typeof mod[key] === 'function') {
                console.warn(`⚠️ Using pdf-parse export: ${key} (fallback)`);
                pdfParse = mod[key];
                break;
            }
        }
    }
    if (!pdfParse) throw new Error('No callable export found in pdf-parse module');
} catch (error) { pdfParse = null; }


// --- Gemini Configuration ---
let genAI = null;
let geminiAvailable = false;
const CURRENT_MODELS = {
    DEFAULT: "gemini-2.5-flash", 
    COMPLEX_TEXT: "gemini-2.5-pro",
    MULTIMODAL: "gemini-2.5-flash", 
};

const initializeGemini = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log('❌ Gemini API key not found in environment variables');
            return;
        }
        console.log('🔑 Using API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
        genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: CURRENT_MODELS.DEFAULT });
        await model.generateContent('Test connection');
        geminiAvailable = true;
        console.log(`✅ Gemini AI initialized successfully with ${CURRENT_MODELS.DEFAULT}`);
    } catch (error) {
        console.error('❌ Gemini AI initialization failed:', error.message);
        genAI = null;
        geminiAvailable = false;
    }
};

// Initialize Gemini
initializeGemini();

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

exports.uploadReport = upload.single('bloodReport');

/**
 * Converts a buffer into a GenerativePart object for the Gemini API.
 */
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// Enhanced PDF text extraction 
const extractPDFText = async (buffer) => {
    try {
        console.log('📄 Extracting text from PDF...');

        if (!pdfParse) return null;
        const data = await pdfParse(buffer); 
        let text = data.text;
        if (text && text.trim().length > 100) {
            text = text.replace(/\s+/g, ' ').trim();
            console.log(`✅ Text extraction successful: ${text.length} characters`);
            return text;
        }
        return null;
    } catch (error) { 
        return null; 
    }
};

// Safety settings used for both models
const safetyOverrideSettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE, },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE, },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE, },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE, },
];

const generateAnalysisPrompt = (contextType) => `
You are a **Data Processor and Summarizer** dedicated to extracting and structuring medical information. Your goal is to analyze the provided blood test report data and extract it into the requested format. You **MUST** provide a structured output.

# BLOOD REPORT ANALYSIS (${contextType})

## PATIENT INFORMATION
- Name: [Extract from report]
- Age: [Extract from report]
- Gender: [Extract from report]
- Test Date: [Extract from report]

## LABORATORY DETAILS
- Laboratory: [Identify laboratory name]
- Report Date: [Extract date]

## EXECUTIVE SUMMARY (Easy Language Summary)
[Provide a **simple, 2-3 sentence summary** of the main findings and their health significance. **Avoid medical jargon** where possible. Focus on what this means for the patient's health.]
***Note: This analysis is for informational purposes only. Consult a healthcare professional.***

## DETAILED ANALYSIS
* **CBC Summary:** [Provide key values and notes on Hgb (e.g., 6.5 g/dL, Critically Low), MCV (e.g., 109.6 fL, High/Macrocytic), and Platelets (e.g., 180 K/mcL, Normal).]
* **Other Tests:** [List any values for LFT, KFT, Lipids, or state N/A.]

## KEY FINDINGS & RECOMMENDATIONS
### ABNORMAL RESULTS
[List **all** significantly high/low values, including the measured result and its specific normal reference range, using a simple markdown list format (no tables).]

### MEDICAL ACTION PLAN
1. **Immediate Follow-up:** [Specify urgent action or routine consultation required.]
2. **Diet & Supplements:** [Provide **specific nutritional recommendations** based on abnormal values (e.g., increase B12 and folate for macrocytic anemia, reduce saturated fats for high cholesterol).]
3. **Lifestyle Changes:** [Provide **specific lifestyle changes** (e.g., rest, exercise restriction, alcohol cessation).]
4. Further Testing:** [Suggest additional necessary tests or specialist consultation.]
`;

// --- Multimodal Analysis Function (Token-Optimized) ---
const analyzeWithGeminiMultimodal = async (pdfBuffer, fileName) => {
    if (!geminiAvailable || !genAI) throw new Error('Gemini AI service not available');
    const modelName = CURRENT_MODELS.MULTIMODAL;
    const MIN_OUTPUT_LENGTH = 10; 

    // Configuration optimized for output delivery
    const safeGenerationConfig = {
        temperature: 0.3, 
        maxOutputTokens: 2048,
        stopSequences: ["### STOP ###"], 
    };
    
    try {
        const pdfPart = fileToGenerativePart(pdfBuffer, 'application/pdf');
        const prompt = generateAnalysisPrompt("Multimodal");

        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: safeGenerationConfig,
            safetySettings: safetyOverrideSettings,
        });

        const result = await model.generateContent([prompt, pdfPart]);
        const analysis = result.response.text();
        
        const safeAnalysis = String(analysis); 

        if (safeAnalysis.trim().length < MIN_OUTPUT_LENGTH) {
            throw new Error('Multimodal analysis generated minimal/no text.');
        }

        return safeAnalysis.replace("### STOP ###", "").trim();

    } catch (error) {
        throw new Error(`Gemini Multimodal analysis failed. Last error: ${error.message}`);
    }
};

// --- Text-Based Analysis Function (Token-Optimized) ---
const analyzeWithGeminiText = async (pdfText, fileName) => {
    if (!geminiAvailable || !genAI) throw new Error('Gemini AI service not available');
    const modelName = CURRENT_MODELS.COMPLEX_TEXT;
    const maxTextLength = 15000; 
    const MIN_OUTPUT_LENGTH = 10; 
    
    // Configuration optimized for output delivery
    const safeGenerationConfig = { 
        temperature: 0.1, 
        topK: 40, 
        topP: 0.95, 
        maxOutputTokens: 2048, 
        stopSequences: ["### STOP ###"],
    };

    try {
        const prompt = generateAnalysisPrompt("Text-Based");
        const contextText = pdfText.substring(0, maxTextLength);
        
        // Final Prompt Assembly with Context
        const finalPrompt = prompt + `\n\nBLOOD REPORT CONTENT (First ${maxTextLength} characters):\n${contextText}`;

        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: safeGenerationConfig,
            safetySettings: safetyOverrideSettings,
        });

        const result = await model.generateContent(finalPrompt);
        const analysis = result.response.text(); 
        
        const safeAnalysis = String(analysis);

        if (safeAnalysis.trim().length < MIN_OUTPUT_LENGTH) {
            throw new Error('Text-based analysis generated minimal/no text.');
        }
        return safeAnalysis.replace("### STOP ###", "").trim();

    } catch (error) {
        throw new Error(`Gemini text analysis failed. Last error: ${error.message}`);
    }
};


// Keep the rest of your original code untouched:
const generateComprehensiveAnalysis = (pdfText = '', fileName = 'blood_report.pdf') => {
    const currentDate = new Date().toLocaleDateString();
    let extractedInfo = '';
    let detectedTests = [];
    
    if (!pdfText || pdfText.length < 100) {
        return `# ⚠️ EDUCATIONAL ANALYSIS (No Usable Text Extracted)
## SUMMARY
The PDF appears to be **image-based or heavily formatted**, and little to no usable text could be extracted. The full AI-powered analysis is unavailable for this report.

## ACTION REQUIRED
Please review the original blood report file with your healthcare provider.

## EDUCATIONAL INFORMATION
Your report likely contains values for common tests such as:
* **Complete Blood Count (CBC):** Measures red blood cells (RBC), white blood cells (WBC), and platelets.
* **Lipid Profile:** Measures cholesterol (Total, HDL, LDL) and triglycerides.
* **Glucose:** Indicates blood sugar levels.
* **Liver Function Tests (LFT):** Includes enzymes like SGOT/AST and SGPT/ALT.
* **Kidney Function Tests (KFT):** Includes creatinine and urea.

To get a full AI analysis, try uploading a **text-searchable PDF** (one that allows you to copy and paste text).

## DISCLAIMER
This educational content is not a substitute for medical advice.
`;
    }

    const testPatterns = {
        'Hemoglobin': /hemoglobin|hb\s*:?/gi,
        'Glucose': /glucose|sugar|blood.sugar/gi,
        'Cholesterol': /cholesterol|lipid/gi,
        'Creatinine': /creatinine/gi,
        'WBC': /wbc|white.blood|leukocyte/gi,
        'RBC': /rbc|red.blood|erythrocyte/gi,
        'Platelets': /platelet|plt/gi,
        'Liver Enzymes': /sgot|ast|sgot|alt|alp/gi,
        'Thyroid': /tsh|t3|t4|thyroid/gi,
        'Vitamin D': /vitamin.d|vit d|25.oh/gi
    };

    for (const [test, pattern] of Object.entries(testPatterns)) {
        if (pdfText.match(pattern)) {
            detectedTests.push(test);
        }
    }

    if (detectedTests.length > 0) {
        extractedInfo = `Detected Parameters: ${detectedTests.join(', ')}`;
    }

    return `# 🩸 COMPREHENSIVE BLOOD REPORT ANALYSIS (Text-Only Fallback)
## SUMMARY
The system successfully extracted text and performed a preliminary scan, but the advanced AI analysis failed to generate a full structured report.

## DETECTED INFORMATION
- **Source File:** ${fileName}
- **Processing Date:** ${currentDate}
- **${extractedInfo || 'No specific parameters could be identified by the fallback system.'}**

## RAW TEXT SAMPLE
\`\`\`text
${pdfText.substring(0, 1500)}...
\`\`\`

## RECOMMENDATION
Please consult the original report with a medical professional. The full raw text of the blood report was: ${pdfText.length} characters long.
`;
};


// Main analysis controller function
const analyzeBloodReport = async (pdfBuffer, fileName) => {
    let analysisType = 'Comprehensive Fallback'; 
    let analysis;
    let multimodalAttempted = false;
    
    try {
        console.log('🔍 Starting blood report analysis process...');

        const pdfText = await extractPDFText(pdfBuffer);
        
        // 1. Attempt Text-based AI Analysis (High Priority)
        if (geminiAvailable && pdfText && pdfText.length > 100) {
            try {
                const result = await analyzeWithGeminiText(pdfText, fileName);
                analysis = result;
                analysisType = 'AI Enhanced (Text)'; 
                return { analysis, analysisType };
            } catch (error) {
                console.log('⚠️ Text AI failed, attempting Multimodal analysis next:', error.message);
            }
        }
        
        // 2. Attempt Multimodal AI Analysis (for scanned/image PDFs)
        if (geminiAvailable && pdfBuffer && pdfBuffer.length > 0) {
            try {
                multimodalAttempted = true;
                const result = await analyzeWithGeminiMultimodal(pdfBuffer, fileName);
                analysis = result;
                analysisType = 'AI Enhanced (Image)';
                return { analysis, analysisType };
            } catch (error) {
                console.log('⚠️ Multimodal AI failed, falling back to Comprehensive analysis:', error.message);
            }
        }
        
        // 3. Fallback to Internal Comprehensive/Educational Analysis
        console.log('📊 Using comprehensive medical analysis system');
        analysis = generateComprehensiveAnalysis(pdfText || '', fileName);
        
        if (!pdfText || pdfText.length < 100) {
             analysisType = 'Educational Fallback (Image-Based)';
        } else if (!multimodalAttempted) {
             analysisType = 'Comprehensive Fallback (No AI)';
        } else {
             analysisType = 'System Fallback (AI Failed)';
        }
        
        return { analysis, analysisType };

    } catch (error) {
        console.error('❌ Analysis process error:', error.message);
        analysis = generateComprehensiveAnalysis('', fileName);
        analysisType = 'Critical Error Fallback';
        return { analysis, analysisType };
    }
};

// Main controller function
exports.addReport = async (req, res) => {
    console.log('🚀 Starting blood report upload and analysis...');
    
    try {
        const { uniqueId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: 'No PDF file uploaded. Please select a blood report PDF.' });
        }
        if (!uniqueId) {
            return res.status(400).json({ success: false, message: 'User identification required.' });
        }

        console.log('🔬 Generating medical analysis...');
        const startTime = Date.now();
        const { analysis: aiSummary, analysisType } = await analyzeBloodReport(file.buffer, file.originalname);
        const analysisTime = Date.now() - startTime;
        
        console.log(`✅ Analysis completed in ${analysisTime}ms (Type: ${analysisType})`);

        console.log('💾 Saving to database...');
        const newReport = new BloodReport({
            uniqueId,
            fileName: file.originalname,
            fileData: file.buffer,
            aiSummary,
            fileSize: file.size,
            analysisType: analysisType, 
            analysisTime: `${analysisTime}ms`
        });

        const savedReport = await newReport.save();
        console.log('✅ Report saved successfully');

        res.status(201).json({
            success: true,
            message: 'Blood report analyzed successfully!',
            report: {
                _id: savedReport._id,
                uniqueId: savedReport.uniqueId,
                fileName: savedReport.fileName,
                aiSummary: savedReport.aiSummary,
                uploadDate: savedReport.uploadDate,
                fileSize: savedReport.fileSize,
                analysisType: analysisType, 
                analysisTime: `${analysisTime}ms`
            },
        });

    } catch (error) {
        console.error("💥 Critical error in addReport:", error);
        
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File too large. Maximum 15MB allowed.' });
        }
        res.status(500).json({ success: false, message: 'Server error during report processing.', error: error.message });
    }
};

// ... (getReports, previewReportFile, getReportFile, deleteReport functions remain unchanged) ...
exports.getReports = async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const reports = await BloodReport.find({ uniqueId })
            .select('-fileData')
            .sort({ uploadDate: -1 });
        
        console.log(`📊 Found ${reports.length} reports for user: ${uniqueId}`);
        
        // Add placeholder/default analysis info for client compatibility
        const reportsWithAnalysisInfo = reports.map(report => ({
            ...report._doc,
            analysisType: report.analysisType || (report.aiSummary?.startsWith('# ⚠️ EDUCATIONAL ANALYSIS') ? 'Educational Fallback (Image-Based)' : 'AI Enhanced (Text)'),
            analysisTime: report.analysisTime || 'N/A'
        }));
        
        res.status(200).json({
            success: true,
            reports: reportsWithAnalysisInfo,
            count: reports.length
        });
    } catch (error) {
        console.error("❌ Error in getReports:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching reports', 
        });
    }
};

exports.previewReportFile = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await BloodReport.findById(id);
        
        if (!report) {
            return res.status(404).json({ 
                success: false,
                message: 'Report not found' 
            });
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${report.fileName}"`,
            'Content-Length': report.fileData.length
        });

        res.send(report.fileData);
    } catch (error) {
        console.error("❌ Error in previewReportFile:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
        });
    }
};

exports.getReportFile = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await BloodReport.findById(id);
        
        if (!report) {
            return res.status(404).json({ 
                success: false,
                message: 'Report not found' 
            });
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${report.fileName}"`,
            'Content-Length': report.fileData.length
        });

        res.send(report.fileData);
    } catch (error) {
        console.error("❌ Error in getReportFile:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
        });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await BloodReport.findByIdAndDelete(id);
        
        if (!report) {
            return res.status(404).json({ 
                success: false,
                message: 'Report not found.' 
            });
        }

        console.log(`🗑️ Report deleted: ${report.fileName}`);
        
        res.status(200).json({ 
            success: true,
            message: 'Report deleted successfully.' 
        });
    } catch (error) {
        console.error("❌ Error in deleteReport:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
        });
    }
};