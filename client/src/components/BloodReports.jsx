import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  FileUp,
  FileText,
  Download,
  Eye,
  Trash2,
  XCircle,
  CheckCircle,
  Loader2,
  Brain,
  AlertTriangle,
  Info,
  Calendar,
  FileSearch,
  Scan,
  Stethoscope,
  Clock, // Added for analysis time
  ImageIcon, // Added for image-based analysis indicator
} from "lucide-react";
// REQUIRED IMPORTS FOR MARKDOWN RENDERING
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// API client setup (Omitted for brevity)
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 90000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ⭐ FINAL STYLING UPDATE: Custom Markdown Renderer (Maximum Professional Polish)
const MarkdownRenderer = ({ content }) => {
  return (
    // Base text size is large (text-lg) and line height is relaxed for readability
    <div className="markdown-container font-sans text-lg text-gray-800 antialiased leading-relaxed p-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // H1: Main report title - prominent, deep color, strong border for hierarchy
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-extrabold text-gray-900 pb-3 mb-8 border-b-4 border-purple-500">
              {props.children}
            </h1>
          ),
          // H2: Major section headings - Strong color and ample vertical space
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-bold text-indigo-800 mt-10 mb-4 pb-2 border-b-2 border-indigo-200">
              {props.children}
            </h2>
          ),
          // H3: Sub-section Headings (Action Plan, Findings - Distinct teal color, strong border)
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-semibold text-teal-700 mt-8 mb-3 pt-1 pl-4 border-l-4 border-teal-500">
              {props.children}
            </h3>
          ),
          // Paragraphs (Comfortable size and line height)
          p: ({ node, ...props }) => (
            <p className="mb-4 text-lg leading-relaxed">{props.children}</p>
          ),
          // Lists (Bulleted) - Custom styling for visual clarity
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside space-y-3 pl-8 mb-6 text-lg">
              {props.children}
            </ul>
          ),
          // Ordered lists (Numbered)
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside space-y-3 pl-8 mb-6 text-lg">
              {props.children}
            </ol>
          ),
          // List Items (Enhanced font size and spacing)
          li: ({ node, ...props }) => (
            <li className="text-lg pl-1">{props.children}</li>
          ),
          // Blockquotes (for the Disclaimer Note embedded in the summary)
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-yellow-500 bg-yellow-100/70 p-4 mt-6 text-base italic text-gray-800 rounded-r-lg shadow-sm">
              {props.children}
            </blockquote>
          ),

          // ⭐ CORE HIGHLIGHTING: Fuchsia color for high visibility on numbers and key status
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-fuchsia-700 bg-fuchsia-100/60 px-2 py-1 rounded-md text-lg whitespace-nowrap shadow-md">
              {props.children}
            </strong>
          ),
          // Horizontal Rule (Used for subtle separation in the final section)
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-t-2 border-gray-200" />
          ),
        }}
      >
        {/* We handle the disclaimer note formatting by stripping the *** and rendering as a blockquote */}
        {content.replace(
          /\*\*\*Note: This analysis is for informational purposes only. Consult a healthcare professional.\*\*\*/g,
          "> Note: This analysis is for informational purposes only. Consult a healthcare professional."
        )}
      </ReactMarkdown>
    </div>
  );
};

const BloodReports = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uniqueId, setUniqueId] = useState(null);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUniqueId(decoded.uniqueId);
      } catch (error) {
        setErrorMessage("Authentication error. Please login again.");
      }
    }
  }, []);

  useEffect(() => {
    if (uniqueId) {
      fetchReports();
    }
  }, [uniqueId]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/reports/my-reports/${uniqueId}`);
      if (res.data.success) {
        const reportsWithDefaults = res.data.reports.map((report) => ({
          ...report,
          analysisType:
            report.analysisType ||
            (report.aiSummary?.startsWith("# ⚠️ EDUCATIONAL ANALYSIS")
              ? "Educational Fallback (Image-Based)"
              : "AI Enhanced (Text)"),
          analysisTime: report.analysisTime || "N/A",
        }));
        setUploadedReports(reportsWithDefaults);
      } else {
        setErrorMessage("Failed to load reports.");
      }
    } catch (err) {
      setErrorMessage("Failed to load reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setErrorMessage("");
    setSuccessMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setErrorMessage("Please upload a valid PDF file.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage(
        "File size too large. Please upload a PDF smaller than 15MB."
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uniqueId) {
      setErrorMessage("Please select a file and ensure you are logged in.");
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("bloodReport", selectedFile);
    formData.append("uniqueId", uniqueId);

    try {
      const res = await apiClient.post("/reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setUploadedReports((prev) => [res.data.report, ...prev]);
        setSelectedFile(null);
        setUploadStatus("success");
        setSuccessMessage(res.data.message);

        const fileInput = document.getElementById("file-upload");
        if (fileInput) fileInput.value = "";

        setTimeout(() => {
          setUploadStatus("idle");
          setSuccessMessage("");
        }, 5000);
      } else {
        throw new Error(res.data.message || "Upload failed");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.code === "ECONNABORTED") {
        setErrorMessage(
          "Processing timeout. The file might be large or complex. Please try again."
        );
      } else {
        setErrorMessage("Upload failed. Please try again.");
      }

      setUploadStatus("error");
    }
  };

  const handlePreview = (id) => {
    window.open(`http://localhost:5000/api/reports/preview/${id}`, "_blank");
  };

  const handleDownload = (id, fileName) => {
    const link = document.createElement("a");
    link.href = `http://localhost:5000/api/reports/download/${id}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this report? This action cannot be undone."
      )
    )
      return;

    try {
      const res = await apiClient.delete(`/reports/${id}`);
      if (res.data.success) {
        setUploadedReports((prev) =>
          prev.filter((report) => report._id !== id)
        );
        setSuccessMessage("Report deleted successfully.");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      setErrorMessage("Failed to delete report. Please try again.");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAnalysisBadge = (type) => {
    let color = "bg-purple-100 text-purple-700";
    let icon = <Brain size={14} />;
    if (type.includes("Image")) {
      color = "bg-indigo-100 text-indigo-700";
      icon = <ImageIcon size={14} />;
    } else if (type.includes("Text")) {
      color = "bg-purple-100 text-purple-700";
      icon = <Brain size={14} />;
    } else if (type.includes("Educational")) {
      color = "bg-yellow-100 text-yellow-700";
      icon = <AlertTriangle size={14} />;
    } else if (type.includes("Comprehensive") || type.includes("Fallback")) {
      color = "bg-blue-100 text-blue-700";
      icon = <Info size={14} />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${color}`}
      >
        {" "}
        {icon} {type}{" "}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Blood Reports</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Brain size={16} />
          <span>AI-Powered Medical Analysis</span>
        </div>
      </div>

      {/* Upload Section (Unchanged) */}
      <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:border-blue-400 transition-colors">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-lg font-semibold mb-3 text-gray-700">
              Upload Blood Report PDF
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full sm:flex-1 text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors cursor-pointer"
                id="file-upload"
              />
              <button
                type="submit"
                disabled={!selectedFile || uploadStatus === "uploading"}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium w-full sm:w-auto min-w-[140px]"
              >
                {uploadStatus === "uploading" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileUp size={18} />
                    Analyze Report
                  </>
                )}
              </button>
            </div>

            {selectedFile && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle size={16} />
                <div>
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-gray-600 ml-2">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>Maximum file size: 15MB. Supported format: PDF only.</span>
            </div>
            <div className="flex items-center gap-1">
              <Scan size={12} />
              <span>
                **AI now supports scanned/image-based PDFs for analysis.**
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Stethoscope size={12} />
              <span>AI analysis provided for informational purposes only.</span>
            </div>
          </div>
        </form>

        {/* Status Messages */}
        {successMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <CheckCircle size={20} />
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="text-sm text-green-600 mt-1">
                Your report has been processed and is ready for review.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <XCircle size={20} />
            <div>
              <p className="font-medium">{errorMessage}</p>
              <p className="text-sm text-red-600 mt-1">
                Please check the file and try again.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading reports...</span>
          </div>
        ) : uploadedReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileSearch size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No blood reports yet</p>
            <p className="text-sm">
              Upload your first blood report to get AI-powered analysis
            </p>
          </div>
        ) : (
          uploadedReports.map((report) => (
            <div
              key={report._id}
              className="border rounded-xl hover:shadow-md transition-shadow bg-white overflow-hidden"
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-blue-600" />
                      <h3 className="font-semibold text-lg text-gray-800 truncate">
                        {report.fileName}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(report.uploadDate)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Size:</span>{" "}
                        {formatFileSize(report.fileSize)}
                      </div>
                      {/* Analysis Type and Time */}
                      {getAnalysisBadge(
                        report.analysisType || "AI Enhanced (Text)"
                      )}
                      {report.analysisTime && report.analysisTime !== "N/A" && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock size={14} />
                          <span>{report.analysisTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handlePreview(report._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(report._id, report.fileName)
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button
                      onClick={() =>
                        setExpandedReportId(
                          expandedReportId === report._id ? null : report._id
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                    >
                      <Brain size={16} />
                      {expandedReportId === report._id ? "Hide" : "Show"}{" "}
                      Analysis
                    </button>
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* AI Summary Section (UPDATED FOR MARKDOWN RENDERING) */}
                {expandedReportId === report._id && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-xl flex items-center gap-3 text-gray-800">
                        <Brain size={24} className="text-purple-600" />
                        AI Analysis Report
                      </h4>
                    </div>

                    <div className="bg-white p-2 rounded-xl border shadow-md">
                      {report.aiSummary ? (
                        // ⭐ RENDER MARKDOWN WITH STYLING
                        <MarkdownRenderer content={report.aiSummary} />
                      ) : (
                        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                          No analysis available. Please check the file's
                          compatibility with text extraction.
                        </div>
                      )}
                    </div>

                    {/* Main, Formal Disclaimer (Kept for visual importance) */}
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          size={18}
                          className="text-yellow-600 mt-0.5 flex-shrink-0"
                        />
                        <div className="text-sm text-yellow-700">
                          <p className="font-medium mb-1">
                            Important Medical Disclaimer
                          </p>
                          <p>
                            This AI analysis is for informational and
                            educational purposes only and should not be
                            considered medical advice. Always consult with a
                            qualified healthcare professional for proper
                            diagnosis, treatment, and personalized medical
                            recommendations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BloodReports;
