import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { setToken, getToken } from "../utils/auth.js";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../utils/network.js";
import { notifySuccess } from "../utils/toast.js";
import PasswordInput from "./PasswordInput.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [showResendOption, setShowResendOption] = useState(false);
  const [isResending, setIsResending] = useState(false);
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
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      
      // Show resend option for email verification errors
      if (errorMessage.includes("verify your email first") ||
          errorMessage.includes("Please verify your email")) {
        setShowResendOption(true);
      } else {
        setShowResendOption(false);
      }
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setError(null);
    setInfo(null);
    
    try {
      const res = await axios.post(`${API_BASE}/api/auth/resend-verification`, {
        email
      });
      
      setInfo(res.data.message || t("verification_sent"));
      notifySuccess(res.data.message || t("verification_sent"));
      setShowResendOption(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
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
        
        {showResendOption && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 mb-2">
              Please verify your email before logging in. Would you like us to resend the verification email?
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isResending ? "Sending..." : t("resend_verification")}
            </button>
          </div>
        )}
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
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {t("forgot_password")}
          </Link>
        </div>
        <p className="text-center mt-6 text-sm">
          {t("register")}? <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">{t("register")}</Link>
        </p>
      </form>
    </div>
  );
};

export default Login; 