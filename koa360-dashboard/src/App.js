import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./pages/Dashboard";
import FormEntry from "./pages/FormEntry";
import KOApredict1 from "./components/PredicForms/KOAPredictForm";
import KOAFusionPredictPage from "./components/dashboard/KOAFusionPredictPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);

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
      {/* Home Page (First Load) */}
      <Route
        path="/"
        element={
          token ? <Navigate to="/dashboard" /> : <Home />
        }
      />

      {/* Dashboard (Protected) */}
      <Route
        path="/dashboard"
        element={
          token ? (
            <Dashboard token={token} role={role} logout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
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
        element={
          token ? <Navigate to="/dashboard" /> : <Register />
        }
      />

      {/* Form */}
      <Route
        path="/form"
        element={
          token ? <FormEntry logout={handleLogout} /> : <Navigate to="/" />
        }
      />

      <Route path="/koa-predict" element={<KOApredict1 />} />
      <Route path="/koa-predict/combined" element={<KOAFusionPredictPage />} />
    </Routes>
  );
}

export default App;