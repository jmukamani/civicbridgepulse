import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../utils/network.js";
import { notifySuccess } from "../utils/toast.js";
import PasswordInput from "./PasswordInput.jsx";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }
    setIsValidToken(true);
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setError(t("passwords_must_match"));
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/reset-password`, {
        token,
        password: form.password,
      });
      
      setSuccess(res.data.message || t("password_reset_success"));
      notifySuccess(res.data.message || t("password_reset_success"));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", { 
          state: { message: "Password reset successful. You can now login with your new password." }
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center text-red-600">Invalid Reset Link</h2>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
          <p className="text-center mt-6">
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Request new reset link
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">{t("reset_password")}</h2>
        
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">{t("new_password")}</label>
            <PasswordInput
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter new password"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">{t("confirm_new_password")}</label>
            <PasswordInput
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Resetting..." : t("reset_password")}
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword; 