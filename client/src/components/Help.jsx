import React, { useState } from "react";
import {
  Send,
  MessageCircle,
  Mail,
  Phone,
  Copy,
  CornerDownRight,
  CheckCircle,
} from "lucide-react";

const CONTACT_EMAIL = "2022.ishan.joshi@ves.ac.in";
const CONTACT_PHONE = "+91 96193 58205";

// Function to safely copy text to the clipboard
const copyToClipboard = (text, setCopyStatus) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } else {
      console.error("Fallback: Copy command unsuccessful.");
    }
  } catch (err) {
    console.error("Fallback: Unable to copy", err);
  }
  document.body.removeChild(textarea);
};

const Help = () => {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isCopied, setIsCopied] = useState(false);

  const handleSend = () => {
    if (!input.trim()) {
      setStatus({
        message: "Please enter your query before submitting.",
        type: "error",
      });
      return;
    }

    console.log("Query submitted:", input.trim());

    setStatus({
      message:
        "Query submitted successfully! We've received your message and will contact you shortly via the email or phone number listed below.",
      type: "success",
    });

    setInput("");

    setTimeout(() => {
      setStatus({ message: "", type: "" });
    }, 5000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusClasses =
    status.type === "success"
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700";

  return (
    <div
      className="flex flex-col h-screen bg-gray-50"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-indigo-700 text-white px-6 py-5 shadow-2xl flex items-center justify-center sm:justify-start space-x-3 sticky top-0 z-10">
        <MessageCircle size={30} className="text-cyan-300" />
        <h2 className="text-2xl font-extrabold tracking-wide">
          MedLink Support Query
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-2xl border-t-4 border-indigo-500">
          <h3 className="text-3xl font-bold text-indigo-700 mb-4">
            Submit Your Assistance Request
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Please enter a detailed description of your question or issue in the
            box below. Once submitted, our team will review your request and
            reach out to you directly using the contact details provided in the
            footer.
          </p>

          {/* Status Message */}
          {status.message && (
            <div
              className={`p-4 mb-4 border-l-4 rounded-lg text-sm font-medium ${statusClasses}`}
              role="alert"
            >
              {status.message}
            </div>
          )}

          {/* Text Area */}
          <div className="relative mb-6">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Start typing your issue here... (Use Shift+Enter for new lines)"
              rows={6}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition duration-300 text-base shadow-inner resize-y"
            />
            <button
              onClick={handleSend}
              className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full flex items-center justify-center transition duration-300 transform hover:scale-105 shadow-lg"
              title="Submit Query"
              disabled={!input.trim()}
            >
              <CornerDownRight size={20} />
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSend}
            className={`w-full bg-indigo-600 text-white py-3 rounded-xl flex items-center justify-center space-x-3 transition duration-300 transform shadow-xl hover:shadow-2xl hover:bg-indigo-700 hover:scale-[1.01] ${
              !input.trim() ? "opacity-70 cursor-not-allowed" : ""
            }`}
            title="Submit Request"
            disabled={!input.trim()}
          >
            <Send size={20} />
            <span className="text-lg font-semibold">Submit Request</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-100 p-5 text-center space-y-3 border-t-4 border-indigo-500">
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-300">
          Direct Contact Information
        </p>

        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-base">
          {/* Email (Clickable + Copy) */}
          <div className="relative flex items-center justify-center space-x-2">
            <Mail size={18} className="text-indigo-400" />

            <button
              onClick={() => {
                // Opens default mail app
                window.location.href = `mailto:${CONTACT_EMAIL}`;
              }}
              className="transition duration-200 font-semibold text-indigo-300 hover:text-indigo-400 underline underline-offset-2"
              title="Send an Email"
            >
              {CONTACT_EMAIL}
            </button>

            <button
              onClick={() => copyToClipboard(CONTACT_EMAIL, setIsCopied)}
              className={`p-1 rounded-full transition duration-300 ${
                isCopied ? "bg-green-600 text-white" : "hover:bg-gray-700"
              }`}
              title="Copy Email to Clipboard"
            >
              {isCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>

            {isCopied && (
              <div className="absolute top-[-2rem] p-1 px-2 text-xs bg-green-500 text-white rounded shadow-md animate-fade-in">
                Copied!
              </div>
            )}
          </div>

          {/* Phone */}
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
            className="flex items-center justify-center space-x-2 transition duration-200 hover:text-indigo-400 font-semibold"
          >
            <Phone size={18} className="text-indigo-400" />
            <span>{CONTACT_PHONE}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Help;
