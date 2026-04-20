import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- SVG Icons ---
// Home: Dashboard Home
const Home = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
// User: Profile Settings
const User = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
// LogOut: Logout
const LogOut = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
// Calendar: Appointments (View Appointments - C/D)
const Calendar = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
// ShieldCheck: Consultation Portal (Secure Access - D)
const ShieldCheck = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
// DollarSign: Payment & Earnings (C)
const DollarSign = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
// Clock: Availability Calendar (Slot Check - C)
const Clock = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
// BadgeHelp: Help
const BadgeHelp = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12a4 4 0 1 0 0-8c2.42 0 3.73 1.84 3.73 3.68 0 .86-.41 1.48-.95 1.93-.56.45-1.05.77-1.42 1.13-.37.37-.58.73-.58 1.16V14" />
  </svg>
);
// AlertTriangle: Emergency Alerts (E) - Not added to sidebar, but reserved
// const AlertTriangle = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);

// --- Logout Confirmation Modal (Assumed component) ---
const LogoutConfirmationModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm mx-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Confirm Logout
      </h3>
      <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium"
        >
          Yes, Logout
        </button>
      </div>
    </div>
  </div>
);

// --- Main Sidebar Component ---
const Sidebar2 = ({ activeItem, setActiveItem, onMenuSelect }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    setActiveItem(item);
    onMenuSelect(item);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Menu structure matching the designed dashboard components
  const menuItems = [
    { name: "Home", icon: Home },
    { name: "View Appointments", icon: Calendar },
    // This is the core workflow to access EHR and prescribe
    { name: "Consultation Portal", icon: ShieldCheck },
    { name: "Availability Calendar", icon: Clock },
    { name: "Payment & Earnings", icon: DollarSign },
    { name: "Profile Settings", icon: User },
    { name: "Help", icon: BadgeHelp },
  ];

  return (
    <>
      <aside className="w-64 bg-gray-900 text-white shadow-lg h-full p-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2 text-white-400">
          Doctor Portal
        </h2>
        <ul className="space-y-3 flex-1">
          {menuItems.map((item) => (
            <li
              key={item.name}
              onClick={() => handleItemClick(item.name)}
              className={`p-3 rounded-lg text-lg font-medium hover:bg-gray-700 cursor-pointer flex items-center space-x-3 ${
                activeItem === item.name
                  ? "bg-gray-700 text-indigo-300"
                  : "text-white"
              } transition-colors duration-200`}
            >
              <item.icon
                size={20}
                className={
                  activeItem === item.name ? "text-indigo-400" : "text-gray-400"
                }
              />
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-4 border-t border-gray-700">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center space-x-3 p-3 text-lg font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <LogoutConfirmationModal
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </>
  );
};

export default Sidebar2;
