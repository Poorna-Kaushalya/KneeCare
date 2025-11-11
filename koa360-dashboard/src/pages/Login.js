import { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- import
import api from "../api/api";
import backgroundImg from "../images/background.jpg";
import SignOutNavbar from "../components/SignOutNavbar";
import logo from "../images/Logo.png";

function Login({ setToken, setRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("doctor");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // <-- initialize navigate

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

      // ✅ Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error || "User not found or invalid password"
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-start"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <SignOutNavbar />
      <img
        src={logo}
        alt="Project Logo"
        className="w-72 h-24 mx-56 my-32 shadow-xl rounded-3xl"
      />

      <div className="absolute top-[27rem] left-[25rem] w-[450px] rounded-2xl p-8 transform -translate-x-1/2">
        <h2 className="text-xl font-bold text-left text-gray-900 mb-6">
          🔑 Login as
        </h2>

        {error && (
          <p className="text-red-500 text-left mb-4 font-medium">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="flex items-center space-x-6 absolute top-[35px] left-[170px]">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="radio"
                name="userType"
                value="doctor"
                checked={userType === "doctor"}
                onChange={(e) => setUserType(e.target.value)}
                className="w-5 h-5 accent-blue-600"
              />
              <span>
                <b>Doctor</b>
              </span>
            </label>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="radio"
                name="userType"
                value="patient"
                checked={userType === "patient"}
                onChange={(e) => setUserType(e.target.value)}
                className="w-4 h-4 accent-blue-600"
              />
              <span>
                <b>Patient</b>
              </span>
            </label>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-2 py-1 border rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

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
              className="w-full px-2 py-1 border rounded-lg border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-1/2 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
