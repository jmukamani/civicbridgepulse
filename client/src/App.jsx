import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";

const App = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <nav className="flex justify-between items-center p-4 bg-indigo-600 text-white">
        <Link to="/" className="font-bold text-lg">
          CivicBridgePulse Kenya
        </Link>
        <div>
          <button onClick={() => changeLanguage("en")} className="mr-2">
            EN
          </button>
          <button onClick={() => changeLanguage("sw")}>SW</button>
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
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App; 