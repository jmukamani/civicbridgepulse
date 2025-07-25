import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../utils/network.js";
import { getToken, getUser } from "../utils/auth.js";

const RepLeaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibility, setVisibility] = useState({ citizens: false, representatives: false });
  const user = getUser();

  useEffect(() => {
    if (user?.role !== "admin") return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/representatives/leaderboard`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setData(res.data);
        setError("");
      } catch (err) {
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    const fetchVisibility = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/representatives/leaderboard-visibility`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setVisibility(res.data);
      } catch {}
    };
    fetchData();
    fetchVisibility();
    // eslint-disable-next-line
  }, [user?.role]);

  const updateVisibility = async (field, value) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/api/representatives/leaderboard-visibility`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setVisibility(res.data);
    } catch {}
  };

  if (user?.role !== "admin") {
    return <div className="p-8 text-center text-red-600 font-bold">Access denied</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Representative Leaderboard</h2>
      <div className="flex gap-6 mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visibility.citizens}
            onChange={e => updateVisibility("citizens", e.target.checked)}
          />
          Visible to Citizens
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visibility.representatives}
            onChange={e => updateVisibility("representatives", e.target.checked)}
          />
          Visible to Representatives
        </label>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full border rounded shadow text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">County</th>
              <th className="px-4 py-2"># Ratings</th>
              <th className="px-4 py-2">Avg Responsiveness</th>
              <th className="px-4 py-2">Avg Issue Resolution</th>
              <th className="px-4 py-2">Avg Engagement</th>
            </tr>
          </thead>
          <tbody>
            {data.map((rep) => (
              <tr key={rep.id} className="border-t">
                <td className="px-4 py-2 font-semibold">{rep.name}</td>
                <td className="px-4 py-2">{rep.county}</td>
                <td className="px-4 py-2 text-center">{rep.count}</td>
                <td className="px-4 py-2 text-center">{rep.avg.responsiveness ?? "-"}</td>
                <td className="px-4 py-2 text-center">{rep.avg.issueResolution ?? "-"}</td>
                <td className="px-4 py-2 text-center">{rep.avg.engagement ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RepLeaderboard; 