// LoginForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [form, setForm] = useState({ uniqueId: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // 🧭 If already logged in, redirect directly
  useEffect(() => {
    const token = localStorage.getItem("token");
    const uniqueId = localStorage.getItem("uniqueId");

    if (token && uniqueId) {
      if (uniqueId.startsWith("DOC")) {
        navigate("/doctorSite", { replace: true });
      } else if (uniqueId.startsWith("PAT")) {
        navigate("/", { replace: true });
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form
      );
      setMessage("Login Successful!");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("uniqueId", res.data.uniqueId);

      // Redirect based on role
      if (res.data.uniqueId.startsWith("DOC")) {
        navigate("/doctorSite", { state: { uniqueId: res.data.uniqueId } });
      } else if (res.data.uniqueId.startsWith("PAT")) {
        navigate("/", { state: { uniqueId: res.data.uniqueId } });
      } else {
        console.error("Unknown role for uniqueId:", res.data.uniqueId);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
      console.error("Login error:", err.response?.data);
    }
  };

  const inputStyle = {
    padding: "14px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box",
    transition: "all 0.2s",
  };

  const buttonStyle = {
    padding: "14px",
    backgroundColor: "#4a90e2",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.2s",
    width: "100%",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "420px",
        margin: "60px auto",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        backgroundColor: "#ffffff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#333",
          marginBottom: "25px",
          fontWeight: "600",
        }}
      >
        Login
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ marginBottom: "6px", color: "#555" }}>
            Unique ID:
          </label>
          <input
            type="text"
            name="uniqueId"
            value={form.uniqueId}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="Enter your unique ID"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ marginBottom: "6px", color: "#555" }}>
            Password:
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          // style={buttonStyle}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 group-hover:from-blue-600 group-hover:to-indigo-700"
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#357ABD")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#4a90e2")
          }
        >
          Login
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: "25px",
            padding: "14px",
            borderRadius: "8px",
            textAlign: "center",
            color: message.includes("Successful") ? "#2e7d32" : "#c62828",
            backgroundColor: message.includes("Successful")
              ? "#e8f5e9"
              : "#fdecea",
            border: message.includes("Successful")
              ? "1px solid #4CAF50"
              : "1px solid #f44336",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
