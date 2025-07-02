import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Landing from "./pages/Landing.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";

const App = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const onLanding = location.pathname === "/";

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
        <div>
            <button onClick={() => changeLanguage("en")} className="mr-2">EN</button>
          <button onClick={() => changeLanguage("sw")}>SW</button>
          </div>
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
    </div>
  );
};

export default App; 