// Filename: src/utils/authUtils.js

import { useCallback, useMemo } from "react";

// This hook retrieves authentication data from localStorage
export const useAuth = () => {
  // Keys MUST match what your login function sets in localStorage
  const rawToken = localStorage.getItem("token");
  const storedUniqueId = localStorage.getItem("uniqueId");

  // Format the token for API headers
  const authToken = rawToken ? `Bearer ${rawToken}` : null;
  const isAuthenticated = !!rawToken && !!storedUniqueId;

  // Stable logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("uniqueId");
    window.location.href = "/login";
  }, []);

  // Memoize the return object to provide a stable reference
  const authData = useMemo(
    () => ({
      // Provide the user ID under consistent key names
      patientId: storedUniqueId,
      doctorId: storedUniqueId,
      userId: storedUniqueId, // <--- THIS IS THE KEY VALUE

      authToken,
      isAuthenticated,
      logout,
    }),
    [storedUniqueId, authToken, isAuthenticated, logout]
  );

  return authData;
};

// NOTE: Ensure you are using this hook correctly in InstantConsultation.js
// and that your login endpoint sets both 'token' and 'uniqueId' in localStorage.
