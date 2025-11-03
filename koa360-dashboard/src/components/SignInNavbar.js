import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiMenu, FiX, FiWifi } from "react-icons/fi";

function SignInNavbar({ logout }) {
  // Map labels → paths
  const links = [
    { label: "Home", path: "/Home" },  
    { label: "Dashboard", path: "/userdashboard" },
    { label: "Radiology", path: "/radiology" },
    { label: "BioData", path: "/biodata" },
    { label: "KOA Grade", path: "/koa-grade" },
    { label: "KneeMonitor", path: "/dashboard" },
    { label: "Sensor Form", path: "/form" }, 
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  const formattedDateTime = dateTime.toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const linkBase =
    "font-semibold px-6 py-2 rounded-lg transition-all duration-300";
  const activeCls = "bg-blue-600 text-white shadow-lg";
  const idleCls = "text-blue-700 hover:bg-blue-100 hover:text-blue-900";

  return (
    <div className="fixed w-full z-50">
      {/* status bar */}
      <div className="w-full bg-blue-600 text-white text-lg px-6 py-1 flex justify-end items-center gap-6 shadow-md">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              connected ? "bg-green-400" : "bg-red-500"
            }`}
          />
          <span className="flex items-center gap-1 font-semibold">
            {connected ? (
              <>
                Device Connected <FiWifi size={16} className="ml-1" /> &nbsp;&nbsp;&nbsp;&nbsp;|
              </>
            ) : (
              "Device Disconnected"
            )}
          </span>
        </div>
        <b><span>{formattedDateTime}</span></b>
      </div>

      {/* main nav */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl shadow-md rounded-b-2xl">
        <div className="max-w-9xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-4xl font-extrabold tracking-wide text-blue-700">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;KneeCare
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex gap-8">
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

          {/* Logout */}
          <div className="hidden md:block">
            <button
              onClick={logout}
              className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 text-white transition shadow-md"
            >
              <b>Logout</b>
            </button>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 space-y-2 bg-white/90 backdrop-blur-sm shadow-lg">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full block text-left ${linkBase} ${
                    isActive ? activeCls : idleCls
                  }`
                }
                end
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={logout}
              className="w-full text-left bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition shadow-md text-white"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}

export default SignInNavbar;
