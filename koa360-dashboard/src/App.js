import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home"; 
import Login from "./components/Login";
import Register from "./components/Register";
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
      
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/Home" />
          ) : (
            <Home />
          )
        }
      />

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

      {/* 3. Login Route (Redirects if logged in) */}
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

      {/* 4. Register Route (Redirects if logged in) */}
      <Route
        path="/register"
        element={token ? <Navigate to="/dashboard" /> : <Register />}
      />

      {/* 5. Form Route (Protected) */}
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