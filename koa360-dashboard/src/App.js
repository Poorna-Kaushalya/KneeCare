import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FormEntry from "./pages/FormEntry";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  // Save token & role to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
  }, [token, role]);

  const handleLogout = () => {
    setToken(null);
    setRole(null);
  };

  return (
    <Routes>
      {/* Dashboard route */}
      <Route
        path="/dashboard"
        element={
          token ? (
            <Dashboard token={token} role={role} logout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} />}
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login setToken={setToken} setRole={setRole} />
          )
        }
      />

      {/* Register */}
      <Route
        path="/register"
        element={token ? <Navigate to="/dashboard" /> : <Register />}
      />

      <Route
        path="/form"
        element={
          token ? <FormEntry logout={handleLogout} /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}

export default App;
