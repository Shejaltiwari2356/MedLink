// Filename: Sidebar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  LogOut,
  HeartPulse,
  FileText,
  Brain,
  Microscope,
  SquarePlus,
  List,
  BarChart3,
  ChevronRight,
  ChevronDown,
  BadgeHelp,
  DollarSign,
  Calendar,
  Search,
  CalendarCheck,
  // ADD: Import the Video icon for tele-consult
  Video,
} from "lucide-react";

// --- Logout Confirmation Modal (Standard) ---
const LogoutConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
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
            // Retained red for destructive action (Logout)
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-medium"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Sidebar Component ---
const Sidebar = ({ activeItem, setActiveItem, onMenuSelect }) => {
  // State for controlling expansion
  const [expandedStates, setExpandedStates] = useState({
    Appointments: false,
    VitalsTracker: false,
    HealthRecords: false,
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  // Helper function to check if a sub-item is currently active
  const isSubItemActive = (parentName) => {
    const map = {
      Appointments: ["Book Appointment", "View Appointments"],
      VitalsTracker: ["Add Vitals", "View Vitals", "Analyse Vitals"],
      HealthRecords: ["Prescription", "Blood Reports"],
    };
    return map[parentName]?.includes(activeItem);
  };

  // FIX 1: Logic to ensure the correct parent is expanded on load/navigation
  React.useEffect(() => {
    // Automatically expand the parent if a sub-item is the current active item
    if (isSubItemActive("Appointments"))
      setExpandedStates((prev) => ({ ...prev, Appointments: true }));
    if (isSubItemActive("VitalsTracker"))
      setExpandedStates((prev) => ({ ...prev, VitalsTracker: true }));
    if (isSubItemActive("HealthRecords"))
      setExpandedStates((prev) => ({ ...prev, HealthRecords: true }));
  }, [activeItem]);

  const handleItemClick = (item) => {
    // This is for navigation (sub-items or non-collapsible parents)
    setActiveItem(item);
    onMenuSelect(item);
  };

  const handleToggle = (parentName) => {
    // This is ONLY for collapsing/expanding the section
    setExpandedStates((prev) => ({
      ...prev,
      [parentName]: !prev[parentName],
    }));
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("uniqueId");
    localStorage.removeItem("token");
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // --- Main Menu Array (Prioritized for Patient) ---
  const menuItems = [
    { name: "Home", icon: Home },
    {
      name: "Appointments",
      icon: Calendar,
      subItems: ["Book Appointment", "View Appointments"],
      stateKey: "Appointments",
    },
    {
      name: "Vitals Tracker",
      icon: HeartPulse,
      subItems: ["Add Vitals", "View Vitals", "Analyse Vitals"],
      stateKey: "VitalsTracker",
    },
    {
      name: "Health Records",
      icon: FileText,
      subItems: ["Prescription", "Blood Reports"],
      stateKey: "HealthRecords",
    },
    { name: "Symptom Checker", icon: Brain },
    // MODIFIED: Replaced "Payment" with "Instant Tele-Consultation"
    // { name: "Instant Tele-Consultation", icon: Video, isUrgent: true },
    // { name: "Payment", icon: DollarSign }, // Retaining Payment, placed below the new item
    { name: "Profile", icon: User },
    { name: "Help", icon: BadgeHelp },
  ];

  const getSubItemIcon = (name) => {
    switch (name) {
      case "Add Vitals":
        return SquarePlus;
      case "View Vitals":
        return List;
      case "Analyse Vitals":
        return BarChart3;
      case "Book Appointment":
        return Search;
      case "View Appointments":
        return CalendarCheck;
      case "Prescription":
        return FileText;
      case "Blood Reports":
        return Microscope;
      default:
        return ChevronRight;
    }
  };

  const renderLink = (item, isSubItem = false) => {
    const isActive = activeItem === item.name;
    const isParentActive = item.stateKey && isSubItemActive(item.stateKey);
    const isExpanded = item.stateKey ? expandedStates[item.stateKey] : false;
    // NEW: Check for urgency
    const isUrgent = item.isUrgent;

    const IconComponent = isSubItem ? getSubItemIcon(item.name) : item.icon;

    const baseClass = `p-3 rounded-lg font-medium transition-colors duration-200 cursor-pointer flex items-center space-x-3`;

    // Determine the style: Is it currently selected, a parent, or an urgent item?
    let activeClass;
    let iconColorClass;

    if (isActive) {
      // Active selected item style (Blue background, Cyan indicator)
      activeClass =
        "bg-blue-800 text-white relative before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-cyan-400";
      iconColorClass = "text-cyan-400";
    } else if (isUrgent) {
      // Urgent item style (Red background/highlight)
      activeClass =
        "bg-red-700 text-white hover:bg-red-600 font-bold animate-pulse-slow";
      iconColorClass = "text-red-300";
    } else if (isParentActive) {
      // Active Parent highlight style (Darker gray)
      activeClass = "bg-gray-700 text-white";
      iconColorClass = "text-gray-400"; // Default for non-active parent links
    } else {
      // Default item style
      activeClass = "text-gray-300 hover:bg-gray-700";
      iconColorClass = "text-gray-400";
    }

    // Override standard icon color for specific items to match the existing blue accent
    const parentIconClass =
      isParentActive || isExpanded ? "text-blue-400" : iconColorClass;

    const textClass = isSubItem ? "text-sm" : "text-lg";

    if (item.subItems) {
      // Collapsible Parent Item
      return (
        <React.Fragment key={item.name}>
          <li
            // FIX 2: Parent item click calls the toggle handler
            onClick={() => handleToggle(item.stateKey)}
            className={`${baseClass} ${textClass} justify-between ${
              isExpanded ? "bg-gray-700 text-white" : activeClass
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Parent icon color changed to a more professional blue-400 */}
              <item.icon size={20} className={parentIconClass} />
              <span>{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </li>
          {isExpanded && (
            <ul className="ml-6 space-y-2 border-l border-gray-700 pl-4">
              {item.subItems.map((sub) => renderLink({ name: sub }, true))}
            </ul>
          )}
        </React.Fragment>
      );
    }

    // Standard Menu or Sub-Item Link
    return (
      <li
        key={item.name}
        // FIX 3: Sub-item click calls the navigation handler
        onClick={() => handleItemClick(item.name)}
        className={`${baseClass} ${textClass} ${activeClass}`}
      >
        {/* Icon color determined by the logic above */}
        <IconComponent size={isSubItem ? 16 : 20} className={iconColorClass} />
        <span>{item.name}</span>
      </li>
    );
  };

  return (
    <>
      <style jsx global>{`
        /* Custom Keyframes for slow pulse effect on urgent item */
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
      `}</style>
      <aside className="w-64 bg-gray-900 text-white shadow-2xl h-full p-4 flex flex-col z-10">
        {/* Title accent changed to blue-400 */}
        <h2 className="text-2xl font-extrabold mb-6 border-b border-gray-700 pb-3 text-white-400">
          Patient Portal
        </h2>
        <ul className="space-y-2 flex-1">
          {menuItems.map((item) => renderLink(item))}
        </ul>

        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-700">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center space-x-3 p-3 text-lg font-medium rounded-lg text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
          >
            {/* Retained red for destructive action icon */}
            <LogOut size={20} className="text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmationModal
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </>
  );
};

export default Sidebar;
