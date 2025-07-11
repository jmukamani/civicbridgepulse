import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { setToken, getToken } from "../utils/auth.js";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../utils/network.js";
import { notifySuccess } from "../utils/toast.js";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // On mount, show any message passed via location state
  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
      notifySuccess(location.state.message);
      // Clear state so it does not reappear on further navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) {
      const existing = getToken();
      if (existing) {
        navigate("/dashboard");
      } else {
        setError("Offline: cannot authenticate");
      }
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });
      setToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  // if token exists already, auto redirect even offline
  if (getToken()) {
    navigate("/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">{t("login")}</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {info && <p className="text-green-600 mb-4 text-sm">{info}</p>}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">{t("email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          {t("login")}
        </button>
        <p className="text-center mt-6 text-sm">
          {t("register")}? <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">{t("register")}</Link>
        </p>
      </form>
    </div>
  );
};

export default Login; 