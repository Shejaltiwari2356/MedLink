import React, { useState } from "react";
import axios from "axios";

// Helper function to generate default doctor availability
const generateDefaultAvailability = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const defaultSlots = [
    "10:00 AM - 10:30 AM",
    "10:30 AM - 11:00 AM",
    "11:00 AM - 11:30 AM",
    "11:30 AM - 12:00 PM",
    "12:00 PM - 12:30 PM",
    "12:30 PM - 01:00 PM",
  ];

  return days.map((day) => ({
    day,
    slots: defaultSlots.map((time) => ({ time, isBooked: false })),
  }));
};

// Reusable input style
const inputStyle = {
  padding: "12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
};

export default function RegisterForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male",
    bloodGroup: "",
    contact: "",
    address: "",
    role: "doctor",
    email: "",
    password: "",
    fees: "",
    degree: "",
    specialization: "",
    experience: "",
  });
  const [uniqueId, setUniqueId] = useState(null);

  const isDoctor = form.role === "doctor";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalForm = { ...form };

    if (isDoctor) {
      finalForm.availability = generateDefaultAvailability();
      finalForm.experience = parseInt(form.experience, 10);
    } else {
      delete finalForm.specialization;
      delete finalForm.experience;
      delete finalForm.fees;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        finalForm
      );
      setUniqueId(res.data.uniqueId);
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
      console.error("Registration error:", err.response?.data);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "450px",
        margin: "40px auto",
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>
        Register
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
        {/* Role Selection */}
        <select
          name="role"
          onChange={handleChange}
          style={inputStyle}
          value={form.role}
        >
          <option value="doctor">Doctor</option>
          <option value="patient">Patient</option>
        </select>

        {/* Common Fields */}
        <input
          name="firstName"
          placeholder="First Name"
          onChange={handleChange}
          required
          value={form.firstName}
          style={inputStyle}
        />
        <input
          name="lastName"
          placeholder="Last Name"
          onChange={handleChange}
          required
          value={form.lastName}
          style={inputStyle}
        />
        <input
          type="date"
          name="dob"
          onChange={handleChange}
          required
          value={form.dob}
          style={inputStyle}
        />
        <select
          name="gender"
          onChange={handleChange}
          value={form.gender}
          style={inputStyle}
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input
          name="bloodGroup"
          placeholder="Blood Group"
          onChange={handleChange}
          required
          value={form.bloodGroup}
          style={inputStyle}
        />
        <input
          name="contact"
          placeholder="Contact"
          onChange={handleChange}
          required
          value={form.contact}
          style={inputStyle}
        />
        <textarea
          name="address"
          placeholder="Address"
          onChange={handleChange}
          required
          value={form.address}
          style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
        />

        {/* Doctor Fields */}
        {isDoctor && (
          <>
            <input
              name="fees"
              placeholder="Fees"
              onChange={handleChange}
              required
              value={form.fees}
              style={inputStyle}
            />
            <input
              name="degree"
              placeholder="Degree"
              onChange={handleChange}
              required
              value={form.degree}
              style={inputStyle}
            />
            <input
              name="specialization"
              placeholder="Specialization"
              onChange={handleChange}
              required
              value={form.specialization}
              style={inputStyle}
            />
            <input
              type="number"
              name="experience"
              placeholder="Experience (Years)"
              onChange={handleChange}
              required
              value={form.experience}
              style={inputStyle}
            />
            <p
              style={{ fontSize: "12px", color: "#777", margin: "0 0 10px 0" }}
            >
              *Default availability (Mon-Fri, 10am-1pm) will be set upon
              registration.
            </p>
          </>
        )}

        {/* Credentials */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          value={form.email}
          style={inputStyle}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          value={form.password}
          style={inputStyle}
        />

        <button
          type="submit"
          style={{
            padding: "12px",
            backgroundColor: "#4a90e2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            cursor: "pointer",
            transition: "0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#357ABD")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#4a90e2")
          }
        >
          Register
        </button>
      </form>

      {uniqueId && (
        <div
          style={{
            marginTop: "25px",
            padding: "12px",
            border: "1px solid #4CAF50",
            backgroundColor: "#e8f5e9",
            borderRadius: "6px",
            textAlign: "center",
            color: "#2e7d32",
          }}
        >
          ✅ Registration successful! Your Unique ID is: <b>{uniqueId}</b>
        </div>
      )}
    </div>
  );
}
