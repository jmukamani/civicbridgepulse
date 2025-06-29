import { useEffect, useState } from "react";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

const CitizenAnalytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/me`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        toast.error("Failed to load analytics");
      }
    };
    fetchData();
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Engagement Summary</h2>
      <div className="grid md:grid-cols-4 gap-4">
        <Card label="Issues Reported" value={data.issues} color="bg-yellow-500" />
        <Card label="Messages Sent" value={data.messages} color="bg-indigo-600" />
        <Card label="Poll Votes" value={data.votes} color="bg-green-600" />
        <Card label="Forum Posts" value={data.posts} color="bg-teal-600" />
      </div>
    </div>
  );
};

const Card = ({ label, value, color }) => (
  <div className={`p-4 rounded shadow text-white ${color}`}>
    <p className="text-sm">{label}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

export default CitizenAnalytics; 