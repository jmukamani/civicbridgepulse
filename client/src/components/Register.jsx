import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE } from "../utils/network.js";
import { notifySuccess } from "../utils/toast.js";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "citizen", county: "" });
  const [specializations, setSpecializations] = useState([]);
  
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
    
    // Validate representative specializations
    if (form.role === "representative" && specializations.length === 0) {
      setError("Representatives must select at least one area of specialization");
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
      setError(err.response?.data?.message || "Registration failed");
      setSuccess(null);
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
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Choose a strong password"
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
    </div>
  );
};

export default Register; 