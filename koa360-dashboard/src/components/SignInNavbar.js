import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiWifi,
  FiBell,
  FiHelpCircle,
} from "react-icons/fi";

function SignInNavbar({ logout }) {
  const links = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Patients", path: "/patients" },
    { label: "Appointments", path: "/appointments" },
    { label: "Reports", path: "/reports" },
    { label: "Sensor Form", path: "/form" },
    { label: "KOA Predict", path: "/koa-predict" },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [connected, setConnected] = useState(false);

  const dropdownRef = useRef(null);

  /* -------------------- Time -------------------- */
  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- Device Status ---------------- */
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("http://192.168.8.102:5000/api/device-status");
        const data = await res.json();
        setConnected(data.connected);
      } catch {
        setConnected(false);
      }
    };
    checkConnection();
    const id = setInterval(checkConnection, 5000);
    return () => clearInterval(id);
  }, []);

  /* -------- Close dropdowns on outside click ------ */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
        setHelpOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDateTime = dateTime.toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const linkBase =
    "font-semibold px-2 py-1 rounded-lg transition-all duration-300";
  const activeCls = "bg-blue-600 text-white shadow-lg";
  const idleCls = "text-blue-700 hover:bg-blue-100 hover:text-blue-900";

  return (
    <div className="fixed w-full z-50">
      {/* ================= Top Status Bar ================= */}
      <div className="w-full bg-blue-600 text-white text-sm px-6 py-1 flex justify-end items-center gap-6 shadow-md">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              connected ? "bg-green-400" : "bg-red-500"
            }`}
          />
          <span className="font-semibold">
            {connected ? (
              <>
                Device Connected <FiWifi className="inline ml-1" />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|
              </>
            ) : (
              "Device Disconnected |"
            )}
          </span>
        </div>
        <b>{formattedDateTime}</b>
      </div>

      {/* ================= Main Navbar ================= */}
      <nav className="bg-white/90 backdrop-blur-xl shadow-md rounded-b-2xl">
        <div className="px-6 py-2 flex justify-between items-center">

          {/* Logo */}
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xl">
            &nbsp;&nbsp;KneeCare
          </div>

          {/* Links */}
          <div className="hidden md:flex gap-6 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.path}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? activeCls : idleCls}`
                }
                end
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right Icons */}
          <div
            className="hidden md:flex items-center gap-6 text-blue-700 relative"
            ref={dropdownRef}
          >
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setHelpOpen(false);
                  setProfileOpen(false);
                }}
                className="relative"
              >
                <FiBell size={22} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                  3
                </span>
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg">
                  <p className="px-4 py-2 font-bold border-b">
                    Notifications
                  </p>
                  <div className="px-4 py-2 hover:bg-blue-50">
                    🔴 Abnormal knee motion detected
                  </div>
                  <div className="px-4 py-2 hover:bg-blue-50">
                    🟡 Next clinic: 06/12/2025
                  </div>
                  <div className="px-4 py-2 hover:bg-blue-50">
                    🟢 Device KOA360 connected
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <div className="relative">
              <button
                onClick={() => {
                  setHelpOpen(!helpOpen);
                  setNotifOpen(false);
                  setProfileOpen(false);
                }}
              >
                <FiHelpCircle size={22} />
              </button>

              {helpOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg">
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100">
                    Documentation
                  </button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100">
                    FAQ
                  </button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100">
                    Support
                  </button>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                className="flex items-center gap-2"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                  setHelpOpen(false);
                }}
              >
                <img
                  src="/assets/avatar.png"
                  alt="Doctor"
                  className="w-8 h-8 rounded-full border"
                />
                <span className="font-semibold text-sm">Dr. Pradeep</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg">
                  <div className="px-4 py-2 border-b">
                    <p className="font-bold">Dr. Pradeep</p>
                    <p className="text-xs text-gray-500">Reg No: DR001</p>
                  </div>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100">
                    Profile
                  </button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100">
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default SignInNavbar;
