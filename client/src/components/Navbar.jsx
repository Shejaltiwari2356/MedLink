import React from "react";

const Navbar = ({ websiteName, uniqueId }) => {
  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 bg-gray-900 text-white shadow-md border-b border-gray-700">
      <div className="text-2xl font-extrabold tracking-wide text-white">
        {websiteName}
      </div>

      <div className="text-white font-medium opacity-90 text-xl">
        {uniqueId ? `Welcome, ${uniqueId}` : "Guest"}
      </div>
    </nav>
  );
};

export default Navbar;
