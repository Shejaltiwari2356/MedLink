import React, { useState, useEffect } from "react";

// 🚨 Define the API endpoint (Using port 8000)
const API_ENDPOINT = "http://localhost:8000/predict";
const SYMPTOMS_ENDPOINT = "http://localhost:8000/symptoms";

// -----------------------------------------------------------
// 1. DiagnosisResult Component (Unchanged)
// -----------------------------------------------------------

/**
 * Helper function to render detailed medication information from the API response.
 */
const renderMedicationDetails = (medications) => {
  if (!medications || medications.length === 0) {
    return <p>No specific medication guidance provided.</p>;
  }
  return (
    <ul style={{ listStyleType: "none", paddingLeft: "10px" }}>
      {medications.map((med, index) => (
        <li
          key={index}
          style={{
            marginBottom: "15px",
            borderLeft: "3px solid #60bd60",
            paddingLeft: "10px",
          }}
        >
          <strong>{med.name}</strong> ({med.adult_dosage})
          <ul
            style={{ fontSize: "0.9em", listStyleType: "disc", color: "#555" }}
          >
            <li>Instruction: {med.instructions}</li>
            <li>Duration: {med.duration}</li>
            <li>Warning: {med.warning}</li>
          </ul>
        </li>
      ))}
    </ul>
  );
};

function DiagnosisResult({ initialSymptoms }) {
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // CRITICAL: Convert comma-separated string to list of display names
  const symptomList = initialSymptoms
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      if (symptomList.length === 0) {
        setError("No valid symptoms provided for diagnosis.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setDiagnosisResult(null);

      // ✅ CORRECT API REQUEST BODY STRUCTURE: Sending a list under the 'symptoms' key
      const requestBody = {
        symptoms: symptomList,
      };

      try {
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (response.ok) {
          setDiagnosisResult(result);
        } else {
          // Display API-side errors gracefully
          setError(
            result.error ||
              "An unknown error occurred during diagnosis. Check server logs."
          );
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        setError(
          "A network error occurred. Is the Python API running on port 8000? Check your backend console."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [initialSymptoms]);

  // --- Component Rendering ---

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "blue" }}>
        <p>
          ...Analyzing **"{initialSymptoms}"** (Symptoms:{" "}
          {symptomList.join(", ")}) ...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red", fontWeight: "bold" }}>
        ❌ Diagnosis Error: {error}
      </div>
    );
  }

  if (!diagnosisResult) return null;

  const { type, severity, message, predictions, advice, medication_details } =
    diagnosisResult;

  // 💡 FIX (Safety Check): Safely convert advice and immediate_actions to arrays
  const adviceList = advice
    ? Array.isArray(advice)
      ? advice
      : [String(advice)]
    : [];

  const immediateActionsList = diagnosisResult.immediate_actions
    ? Array.isArray(diagnosisResult.immediate_actions)
      ? diagnosisResult.immediate_actions
      : [String(diagnosisResult.immediate_actions)]
    : [];

  const actionsToDisplay = [...adviceList, ...immediateActionsList].filter(
    (item) => item && item.trim().length > 0
  );

  const baseStyle = {
    padding: "20px",
    maxWidth: "800px",
    margin: "20px auto",
    fontFamily: "Arial, sans-serif",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  };

  // 🚨 EMERGENCY RESPONSE (CRITICAL / URGENT)
  if (type === "emergency") {
    const bgColor =
      severity && severity.includes("CRITICAL") ? "#f8d7da" : "#fff3cd";
    const borderColor =
      severity && severity.includes("CRITICAL") ? "#d63638" : "#ffc107";

    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: bgColor,
          border: `2px solid ${borderColor}`,
          color: "#000",
        }}
      >
        <h2 style={{ color: borderColor }}>{message}</h2>
        <p>
          <strong>Emergency Level:</strong>{" "}
          <span style={{ color: borderColor, fontWeight: "bold" }}>
            {severity ? severity.replace("_", " ").toUpperCase() : "UNKNOWN"}
          </span>
        </p>

        <h3
          style={{
            borderBottom: `1px solid ${borderColor}`,
            paddingBottom: "10px",
            marginTop: "15px",
          }}
        >
          Immediate Actions:
        </h3>
        <ul
          style={{ paddingLeft: "20px", fontWeight: "bold", color: "#d63638" }}
        >
          {/* Use the safe, combined actionsToDisplay array */}
          {actionsToDisplay.map((item, index) => (
            <li key={`action-${index}`}>{item}</li>
          ))}
        </ul>

        {medication_details && (
          <>
            <h4 style={{ marginTop: "15px" }}>RamKit Medication Details:</h4>
            {Object.entries(medication_details).map(([name, med]) => (
              <div
                key={name}
                style={{
                  border: "1px dotted #ccc",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "4px",
                }}
              >
                <strong>{name}</strong>: {med.dosage} ({med.purpose})
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // ⚠️ ADVICE RESPONSE (NO HIGH-CONFIDENCE DIAGNOSIS)
  if (type === "advice") {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: "#fffbe6",
          border: "1px solid #ffeb3b",
          color: "#333",
        }}
      >
        <h2>⚠️ Analysis Complete - General Guidance</h2>
        <p>
          <strong>Overall Severity:</strong>{" "}
          <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>
            {severity}
          </span>
        </p>
        <h3 style={{ color: "orange" }}>{message}</h3>
        {/* Render advice here if available */}
        {adviceList.length > 0 && (
          <ul style={{ paddingLeft: "20px", marginTop: "10px" }}>
            {adviceList.map((item, index) => (
              <li key={`advice-item-${index}`}>{item}</li>
            ))}
          </ul>
        )}
        <p>
          The model did not find a high-confidence disease match for the
          symptoms you provided:
          <strong style={{ display: "block", marginTop: "5px" }}>
            {symptomList.join(", ")}
          </strong>
          .
        </p>
        <p>
          Please monitor your symptoms closely and contact a doctor if they
          worsen or persist.
        </p>
      </div>
    );
  }

  // ✅ DIAGNOSIS RESPONSE (Standard Matches)
  if (type === "diagnosis" && predictions && predictions.length > 0) {
    return (
      <div
        style={{
          ...baseStyle,
          backgroundColor: "#e6ffe6",
          border: "1px solid #60bd60",
          color: "#000",
        }}
      >
        <h2>✅ High-Confidence Diagnosis Results</h2>
        <p>
          <strong>Overall Severity:</strong>{" "}
          <span style={{ textTransform: "capitalize", fontWeight: "bold" }}>
            {severity}
          </span>
        </p>

        <h3
          style={{
            borderBottom: "1px solid #60bd60",
            paddingBottom: "10px",
            marginTop: "15px",
          }}
        >
          Top Predictions:
        </h3>
        {predictions.map((pred, index) => (
          <div
            key={index}
            style={{
              marginBottom: "20px",
              padding: "15px",
              border: `1px solid ${index === 0 ? "#4CAF50" : "#ddd"}`,
              borderRadius: "5px",
              backgroundColor: index === 0 ? "#d4edda" : "white",
            }}
          >
            <h4>
              {index + 1}. **{pred.disease}** (Confidence:{" "}
              {(pred.confidence * 100).toFixed(1)}%)
            </h4>
            <h5 style={{ color: "#007bff", marginTop: "10px" }}>
              Recommended Treatment:
            </h5>
            {/* The medications field is now a list of detailed objects */}
            {renderMedicationDetails(pred.medications)}
          </div>
        ))}
      </div>
    );
  }

  // Fallback if the structure is unexpected
  return (
    <div
      style={{
        ...baseStyle,
        backgroundColor: "#ffffe0",
        border: "1px solid #ffeb3b",
        color: "#000",
      }}
    >
      <p>
        <strong>Analysis Error:</strong> Received an unexpected or empty
        response from the API.
      </p>
      <pre>{JSON.stringify(diagnosisResult, null, 2)}</pre>
    </div>
  );
}

// -----------------------------------------------------------
// 2. SymptomInputPage Component (The Main Page Logic - with Final Fix)
// -----------------------------------------------------------

function SymptomInputPage() {
  const [symptomList, setSymptomList] = useState([]);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [symptomsError, setSymptomsError] = useState(null);
  const [diagnosedSymptoms, setDiagnosedSymptoms] = useState(null);

  // 💥 FIX: Initialize selectedSymptom to an empty string for the placeholder
  const [selectedSymptom, setSelectedSymptom] = useState("");

  const FALLBACK_SYMPTOMS = [
    "Chest Pain",
    "Breathlessness",
    "Vomiting",
    "High Fever",
    "Mild Fever",
    "Chills",
    "Sweating",
    "Fatigue",
    "Runny Nose",
    "Continuous Sneezing",
    "Cough",
    "Diarrhoea",
    "Abdominal Pain",
    "Nausea",
    "Headache",
    "Muscle Pain",
    "Neck Pain",
    "Itching",
    "Skin Rash",
    "Nodal Skin Eruptions",
  ];

  // Fetch available symptoms on component mount to populate the dropdown
  useEffect(() => {
    const fetchAvailableSymptoms = async () => {
      try {
        const response = await fetch(SYMPTOMS_ENDPOINT);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        let fetchedList =
          data.symptoms && data.symptoms.length > 0
            ? data.symptoms
            : FALLBACK_SYMPTOMS;

        // Trim whitespace and filter out category headers
        fetchedList = fetchedList
          .map((s) => s.trim())
          .filter((s) => !s.startsWith("---") && s.length > 0)
          .sort();

        setAvailableSymptoms(fetchedList);
        setLoadingSymptoms(false);
        // 💥 FIX: DO NOT set a default selected symptom here. Keep it as "" to show the placeholder.
      } catch (error) {
        console.error("Error fetching symptoms:", error);
        setSymptomsError(
          "Could not fetch available symptoms. Using a hardcoded list instead. Please check your API."
        );

        const fallbackList = FALLBACK_SYMPTOMS.map((s) => s.trim())
          .filter((s) => !s.startsWith("---") && s.length > 0)
          .sort();

        setAvailableSymptoms(fallbackList);
        setLoadingSymptoms(false);
        // 💥 FIX: DO NOT set a default selected symptom here.
      }
    };
    fetchAvailableSymptoms();
  }, []);

  // Function to add a selected symptom to the list
  const addSymptom = (symptom) => {
    if (symptom && !symptomList.includes(symptom)) {
      const newList = [...symptomList, symptom].sort();
      setSymptomList(newList);

      // Set the next default selection to the first symptom not yet chosen, or reset to ""
      const nextDefault = availableSymptoms.find((s) => !newList.includes(s));
      setSelectedSymptom(nextDefault || "");
    }
  };

  // Function to remove a symptom from the list
  const removeSymptom = (symptomToRemove) => {
    const newList = symptomList.filter((s) => s !== symptomToRemove);
    setSymptomList(newList);

    // Ensure the dropdown resets to the placeholder if the last symptom is removed
    if (selectedSymptom === "" && newList.length < availableSymptoms.length) {
      const nextDefault = availableSymptoms.find((s) => !newList.includes(s));
      setSelectedSymptom(nextDefault || "");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (symptomList.length === 0) {
      alert("Please select at least one symptom before submitting.");
      return;
    }

    const symptomsString = symptomList.join(", ");

    setDiagnosedSymptoms(symptomsString);
  };

  const handleReset = () => {
    setSymptomList([]);
    setDiagnosedSymptoms(null);
    // Reset the dropdown back to the placeholder
    setSelectedSymptom("");
  };

  // --- Conditional Rendering ---

  if (diagnosedSymptoms) {
    return (
      <div>
        <button
          onClick={handleReset}
          style={{
            margin: "20px",
            padding: "10px",
            cursor: "pointer",
            backgroundColor: "#333",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          ← Enter New Symptoms
        </button>
        <DiagnosisResult initialSymptoms={diagnosedSymptoms} />
      </div>
    );
  }

  // Default render: Show the input form
  const symptomsAlreadyAdded = new Set(symptomList);
  const symptomsToSelect = availableSymptoms.filter(
    (s) => !symptomsAlreadyAdded.has(s)
  );

  // Check if the currently selected symptom is one that hasn't been added yet
  const isSymptomSelected =
    selectedSymptom && !symptomsAlreadyAdded.has(selectedSymptom);

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "40px auto",
        border: "1px solid #ccc",
        borderRadius: "8px",
        color: "black",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <h2>⚕️ Health Diagnosis System</h2>
      <p>
        Use the **dropdown menu** to select your symptoms and click **Add
        Symptom**.
      </p>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="symptoms-select"
          style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
        >
          Select Symptoms:
        </label>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <select
            id="symptoms-select"
            value={selectedSymptom}
            onChange={(e) => setSelectedSymptom(e.target.value)}
            style={{
              flexGrow: 1,
              padding: "12px",
              border: "1px solid #aaa",
              borderRadius: "4px",
            }}
            disabled={
              loadingSymptoms ||
              (symptomsToSelect.length === 0 && symptomList.length > 0)
            }
          >
            {/* 💥 FIX: Placeholder option that is disabled/unselectable if the value is "" */}
            <option value="" disabled>
              -- Select Symptoms Here --
            </option>

            {loadingSymptoms && (
              <option value="" disabled>
                Loading available symptoms...
              </option>
            )}

            {symptomsToSelect.map((symptom) => (
              <option key={symptom} value={symptom}>
                {symptom}
              </option>
            ))}
            {symptomsToSelect.length === 0 && !loadingSymptoms && (
              <option value="" disabled>
                All symptoms added
              </option>
            )}
          </select>

          <button
            type="button"
            onClick={() => addSymptom(selectedSymptom)}
            // Disable if no symptom is currently selected (i.e., placeholder is showing or all symptoms are added)
            disabled={!isSymptomSelected || loadingSymptoms}
            style={{
              padding: "12px 20px",
              backgroundColor: isSymptomSelected ? "#007bff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSymptomSelected ? "pointer" : "not-allowed",
              fontSize: "16px",
            }}
          >
            Add Symptom
          </button>
        </div>

        <h3
          style={{
            borderBottom: "1px solid #ccc",
            paddingBottom: "10px",
            marginTop: "10px",
          }}
        >
          Selected Symptoms ({symptomList.length}):
        </h3>

        <div
          style={{
            minHeight: "40px",
            border: "1px solid #ddd",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
            backgroundColor: "#f9f9f9",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {symptomList.length === 0 ? (
            <p style={{ margin: 0, color: "#888" }}>
              No symptoms added yet. Please select one above.
            </p>
          ) : (
            symptomList.map((symptom) => (
              <span
                key={symptom}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "#e0f7fa",
                  border: "1px solid #b2ebf2",
                  borderRadius: "15px",
                  fontSize: "0.9em",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {symptom}
                <button
                  type="button"
                  onClick={() => removeSymptom(symptom)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    marginLeft: "5px",
                    fontWeight: "bold",
                    lineHeight: "1",
                  }}
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>

        <button
          type="submit"
          disabled={symptomList.length === 0}
          style={{
            width: "100%",
            padding: "12px 25px",
            backgroundColor: symptomList.length > 0 ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: symptomList.length > 0 ? "pointer" : "not-allowed",
            fontSize: "16px",
          }}
        >
          Get High-Confidence Diagnosis
        </button>
      </form>

      {symptomsError && (
        <p style={{ color: "red", marginTop: "20px" }}>
          **Note:** {symptomsError}
        </p>
      )}
    </div>
  );
}

export default SymptomInputPage;
