import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import SignOutNavbar from "../components/SignOutNavbar";
import logo from "../images/Logo.png";
import LoginBG from "../images/LoginBG.jpg";

function Login({ setToken, setRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("doctor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post(`/login/${userType}`, {
        username,
        password,
      });

      const token = res.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("role", userType);

      setToken(token);
      setRole(userType);

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error || "User not found or invalid password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `url(${LoginBG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <SignOutNavbar />

      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">

        {/* LEFT SECTION */}
        <div className="hidden lg:flex flex-1 max-w-xl flex-col justify-center text-left p-8">
          <div className="mb-6">
            <img src={logo} alt="Project Logo" className="h-28 w-auto" />
          </div>

          <h1 className="text-6xl font-extrabold text-blue-800 mb-4">
            KneeCare Monitor
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed mb-6">
            Real-time biomechanical and environmental monitoring for optimized patient care and recovery.
          </p>
        </div>

        {/* RIGHT LOGIN CARD */}
        <div className="w-full max-w-lg lg:max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">

          {/* HEADER */}
          <div className="flex items-center justify-start text-blue-700 mb-6 border-b pb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 mr-3 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">
              Sign In To Your Account
            </h2>
          </div>

          {/* LOGIN TYPE */}
          <p className="block mb-3 text-sm font-semibold text-gray-700">
            Login As
          </p>

          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 shadow-md">
            <button
              type="button"
              onClick={() => setUserType("doctor")}
              className={`flex-1 py-2 rounded-xl font-semibold transition ${
                userType === "doctor"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Doctor
            </button>

            <button
              type="button"
              onClick={() => setUserType("patient")}
              className={`flex-1 py-2 rounded-xl font-semibold transition ${
                userType === "patient"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              Patient
            </button>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-4 text-center p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl font-medium">
              🚨 {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-6">

            {/* USERNAME */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Username / ID
              </label>

              <input
                type="text"
                placeholder="Enter your username or ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold text-lg rounded-xl shadow-lg transition flex items-center justify-center ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* REGISTER */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
              >
                Create an Account
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;