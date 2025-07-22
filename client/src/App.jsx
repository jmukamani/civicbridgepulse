import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Landing from "./pages/Landing.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";
import useOnlineStatus from "./hooks/useOnlineStatus.js";
import useLocalSync from "./hooks/useLocalSync.js";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PrivacyPolicy from "./components/PrivacyPolicy.jsx";

const App = () => {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const onLanding = location.pathname === "/";
  const online = useOnlineStatus();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  useLocalSync();

  useEffect(() => {
    if (online) {
      toast.dismiss('offline');
      toast.success('Back online', { toastId: 'online' });
    } else {
      toast.error('You are offline. Some features may be limited.', { toastId: 'offline', autoClose: false });
    }
  }, [online]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <nav className="flex justify-between items-center p-4 bg-indigo-600 text-white">
        <Link to="/" className="font-bold text-lg">
          CivicBridgePulse Kenya
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="text-white hover:text-indigo-200 text-sm underline"
          >
            {t("privacy_policy")}
          </button>
          {onLanding && (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-md bg-white text-indigo-600 font-semibold hover:bg-indigo-50"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-md border border-white hover:bg-white hover:text-indigo-600 font-semibold"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      <PrivacyPolicy 
        isOpen={showPrivacyPolicy} 
        onClose={() => setShowPrivacyPolicy(false)} 
      />
    </div>
  );
};

export default App; 