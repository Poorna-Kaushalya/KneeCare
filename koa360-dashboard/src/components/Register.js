import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import SignOutNavbar from "../components/SignOutNavbar";
import logo from "../images/Logo.png";
import LoginBG from "../images/LoginBG.jpg";

function Register() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [regNo, setRegNo] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        fullName,
        phone,
        specialization,
        username,
        password,
        regNo,
      };

      const res = await api.post(`/register/doctor`, payload);

      setSuccess(res.data.message || "Registration Successful!");

      // Clear all fields
      setFullName("");
      setPhone("");
      setSpecialization("");
      setUsername("");
      setPassword("");
      setRegNo("");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-blue-100 flex flex-col"
      style={{
        backgroundImage: `url(${LoginBG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <SignOutNavbar />

      <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex flex-1 max-w-xl flex-col justify-center text-left p-8">
          <div className="mb-6">
            <img src={logo} alt="Project Logo" className="h-28 w-auto" />
          </div>
          <h1 className="text-6xl font-extrabold text-blue-800 mb-4">
            Create Your Account
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-6">
            Register to gain access to personalized KOA monitoring and
            real-time biomechanical analytics.
          </p>
        </div>

        {/* RIGHT SIDE FORM CARD */}
        <div className="w-full max-w-xl lg:max-w-lg bg-white rounded-2xl shadow-2xl p-4 sm:p-6 transition-all duration-300">
          <div className="flex items-center justify-start text-blue-700 mb-4 border-b pb-3">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0h-3C12 14 8 14 3 20z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">Create an Account</h2>
          </div>

          {success && (
            <p className="text-green-600 text-center mb-4 font-medium p-3 bg-green-100 border border-green-300 rounded-xl">
              ✅ {success}
            </p>
          )}
          {error && (
            <p className="text-red-600 text-center mb-4 font-medium p-3 bg-red-100 border border-red-300 rounded-xl">
              🚨 {error}
            </p>
          )}

          {/* FORM with 2 columns */}
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left column */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Enter specialization"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Doctor Registration No.
                </label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="Enter registration number"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold text-lg rounded-xl shadow-lg ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/50"
              }`}
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          {/* Navigate to Login Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-blue-600 font-semibold cursor-pointer hover:underline"
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate("/login");
                  }
                }}
              >
                Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
