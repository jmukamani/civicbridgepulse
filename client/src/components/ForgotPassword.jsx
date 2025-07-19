import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../utils/network.js";
import { notifySuccess } from "../utils/toast.js";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/forgot-password`, {
        email,
      });
      
      setSuccess(res.data.message || t("password_reset_sent"));
      notifySuccess(res.data.message || t("password_reset_sent"));
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">{t("forgot_password")}</h2>
        <p className="text-gray-600 mb-6 text-sm text-center">
          {t("enter_email_for_reset")}
        </p>
        
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
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
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : t("send_reset_link")}
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

export default ForgotPassword; 