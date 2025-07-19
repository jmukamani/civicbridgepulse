import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../utils/network.js";
import { notifySuccess } from "../utils/toast.js";
import PasswordInput from "./PasswordInput.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "citizen", county: "" });
  const [specializations, setSpecializations] = useState([]);
  const [privacyPolicyAgreed, setPrivacyPolicyAgreed] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Fallback specializations in case API call fails
  const fallbackSpecializations = [
    "Water & Sanitation",
    "Infrastructure & Roads",
    "Healthcare Services",
    "Education",
    "Environmental Issues",
    "Agriculture & Livestock",
    "Security & Safety",
    "Economic Development",
    "Housing & Urban Planning",
    "Energy & Utilities",
    "Transport & Mobility",
    "Social Services"
  ];
  
  const [availableSpecializations, setAvailableSpecializations] = useState(fallbackSpecializations);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Fetch available specializations
    const fetchSpecializations = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/admin/specializations`);
        // Ensure we always have an array
        const specs = Array.isArray(response.data) ? response.data : fallbackSpecializations;
        setAvailableSpecializations(specs);
      } catch (err) {
        console.error("Failed to fetch specializations, using fallback", err);
        // Keep using fallback specializations on error
        setAvailableSpecializations(fallbackSpecializations);
      }
    };
    fetchSpecializations();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSpecializationChange = (spec) => {
    setSpecializations(prev => {
      if (prev.includes(spec)) {
        return prev.filter(s => s !== spec);
      } else {
        return [...prev, spec];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (form.password !== form.confirmPassword) {
      setError(t("passwords_must_match"));
      setShowResendOption(false);
      return;
    }
    
    // Validate privacy policy agreement
    if (!privacyPolicyAgreed) {
      setError(t("privacy_policy_required"));
      setShowResendOption(false);
      return;
    }
    
    // Validate representative specializations
    if (form.role === "representative" && specializations.length === 0) {
      setError("Representatives must select at least one area of specialization");
      setShowResendOption(false);
      return;
    }
    
    try {
      const submitData = { ...form };
      if (form.role === "representative") {
        submitData.specializations = specializations;
      }
      
      const res = await axios.post(`${API_BASE}/api/auth/register`, submitData);
      
      const msg = res.data?.message || (form.role === "admin"
        ? "Admin account created successfully! You can login immediately."
        : "Registration successful. Check your email for verification link.");

      // Toast message immediately
      notifySuccess(msg);

      // Redirect to login and pass message in location state
      navigate("/login", { state: { message: msg } });
      return; // stop further execution
       
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      setSuccess(null);
      
      // Show resend option for specific errors
      if (errorMessage.includes("Email already exists") || 
          errorMessage.includes("verify your email first") ||
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
    setSuccess(null);
    
    try {
      const res = await axios.post(`${API_BASE}/api/auth/resend-verification`, {
        email: form.email
      });
      
      setSuccess(res.data.message || t("verification_sent"));
      notifySuccess(res.data.message || t("verification_sent"));
      setShowResendOption(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">{t("register")}</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}
        
        {showResendOption && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800 mb-2">
              It looks like you may have already registered with this email. Would you like us to resend the verification email?
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
          <label className="block mb-2 text-sm font-medium">{t("name")}</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">{t("email")}</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your email address"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">{t("password")}</label>
          <PasswordInput
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Choose a strong password"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">{t("confirm_password")}</label>
          <PasswordInput
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">{t("county")}</label>
          <input
            name="county"
            value={form.county}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. Nairobi, Kiambu, etc."
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="citizen">Citizen</option>
            <option value="representative">Representative</option>
          </select>
        </div>

        {form.role === "representative" && (
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Areas of Specialization</label>
            <p className="text-xs text-gray-600 mb-3">
              Select your areas of expertise (choose at least one):
            </p>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
              {(availableSpecializations || []).map((spec) => (
                <label key={spec} className="flex items-center mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specializations.includes(spec)}
                    onChange={() => handleSpecializationChange(spec)}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm">{spec}</span>
                </label>
              ))}
            </div>
            {form.role === "representative" && specializations.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                Please select at least one area of specialization
              </p>
            )}
          </div>
        )}

        {form.role === "representative" && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Representative accounts require admin verification. 
              You will not be able to access representative features until your account is approved.
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={privacyPolicyAgreed}
              onChange={(e) => setPrivacyPolicyAgreed(e.target.checked)}
              className="mt-1 mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              required
            />
            <span className="text-sm text-gray-700">
              {t("privacy_policy_agreement")}{" "}
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(true)}
                className="text-indigo-600 hover:text-indigo-800 underline font-medium"
              >
                {t("view_privacy_policy")}
              </button>
            </span>
          </label>
        </div>
        
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-medium text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          {t("register")}
        </button>
        <p className="text-center mt-6 text-sm">
          {t("login")}? <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">{t("login")}</Link>
        </p>
      </form>
      
      <PrivacyPolicy 
        isOpen={showPrivacyPolicy} 
        onClose={() => setShowPrivacyPolicy(false)} 
      />
    </div>
  );
};

export default Register; 