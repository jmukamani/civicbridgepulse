import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying email...");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    const verify = async () => {
      try {
        await axios.get(`http://localhost:5000/api/auth/verify?token=${token}`);
        setStatus("success");
        setMessage("Email verified successfully. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      }
    };

    verify();
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm text-center">
        {status === "loading" && <p>{message}</p>}
        {status === "success" && <p className="text-green-600">{message}</p>}
        {status === "error" && <p className="text-red-500">{message}</p>}
      </div>
    </div>
  );
};

export default VerifyEmail; 