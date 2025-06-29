import { useEffect, useState } from "react";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

const RepPerformance = () => {
  const rep = getUser();
  const [score, setScore] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/repScores`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const rows = await res.json();
        const mine = rows.find((r) => r.id === rep.id);
        setScore(mine);
      } catch (err) {
        toast.error("Failed to load scores");
      }
    };
    load();
  }, [rep.id]);

  if (!score) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Performance</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Average Reply Time (seconds)</h3>
          <p className="text-4xl font-bold">{Number(score.avg_reply_seconds).toFixed(0)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Issue Resolve Ratio</h3>
          <p className="text-4xl font-bold">{(score.resolve_ratio * 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default RepPerformance; 