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
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post(`/login/${userType}`, { username, password });
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
    }
  };

  return (
    <div
      className="min-h-screen bg-blue-100 flex flex-col"
      style={{ 
        backgroundImage: `url(${LoginBG})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <SignOutNavbar />
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        {/* Left Section */}
        <div className="hidden lg:flex flex-1 max-w-xl flex-col justify-center text-left p-8">
          <div className="mb-6">
            <img src={logo} alt="Project Logo" className="h-28 w-auto" />
          </div>
          <h1 className="text-6xl font-extrabold text-blue-800 mb-4">
            KneeCare Monitor
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-6">
            Real-time biomechanical and environmental monitoring for optimized
            patient care and recovery.
          </p>  
        </div>

        {/* Right Section: Login Form Card */}
        <div className="w-full max-w-lg lg:max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300">
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
            <h2 className="text-2xl font-bold text-gray-800">Sign In To Your Account</h2>
          </div>

          <p className="block mb-3 text-sm font-semibold text-gray-700">
            Login As
          </p>
          
          {/* User Type Selection - Segmented Control Style */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6 shadow-md">
            <button
              type="button"
              onClick={() => setUserType("doctor")}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-xl text-base font-semibold transition-all duration-200 focus:outline-none 
                ${
                  userType === "doctor"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-400/50"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.275a1.125 1.125 0 011.277 0c.346.223.518.665.334 1.054L20.25 10.5h-8.25V4.5l1.5-1.5z"
                />
              </svg>
              Doctor
            </button>
            <button
              type="button"
              onClick={() => setUserType("patient")}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-xl text-base font-semibold transition-all duration-200 focus:outline-none 
                ${
                  userType === "patient"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-400/50"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Patient
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-center mb-4 font-medium p-3 bg-red-100 border border-red-300 rounded-xl">
              🚨 {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Username / ID
              </label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username or ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-150 shadow-inner text-gray-800"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-150 shadow-inner text-gray-800"
                required
              />
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/50 hover:bg-blue-700 transition duration-300 transform hover:scale-[1.005] focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-70 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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
                Sign In
              </button>
            </div>
          </form>

          {/* Navigate to Register Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate("/register");
                  }
                }}
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
