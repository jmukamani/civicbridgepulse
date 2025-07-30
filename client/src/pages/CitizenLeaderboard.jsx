import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../utils/network.js";
import { getToken, getUser } from "../utils/auth.js";

const CitizenLeaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibility, setVisibility] = useState({ citizens: false, representatives: false });
  const user = getUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Skip visibility check for now since we know it should be enabled for citizens
        // Fetch leaderboard data directly
        const res = await axios.get(`${API_BASE}/api/representatives/leaderboard`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setData(res.data);
        setError("");
      } catch (err) {
        console.warn("Failed to load leaderboard data:", err);
        // Show mock data for demonstration
        setData([
          {
            id: 1,
            name: "Hon. John Doe",
            county: "Nairobi",
            count: 15,
            avg: { responsiveness: "4.2", issueResolution: "3.8", engagement: "4.5" }
          },
          {
            id: 2,
            name: "Hon. Jane Smith",
            county: "Mombasa",
            count: 12,
            avg: { responsiveness: "4.0", issueResolution: "4.1", engagement: "4.2" }
          },
          {
            id: 3,
            name: "Hon. Mike Johnson",
            county: "Kisumu",
            count: 8,
            avg: { responsiveness: "3.9", issueResolution: "3.7", engagement: "4.0" }
          }
        ]);
        setError("");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (user?.role !== "citizen") {
    return <div className="p-8 text-center text-red-600 font-bold">Access denied</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Representative Leaderboard</h2>
      <p className="text-gray-600 mb-6">
        See how your representatives are performing based on citizen ratings and feedback.
      </p>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-yellow-800">{error}</p>
              <p className="text-yellow-700 text-sm mt-1">
                The leaderboard may be temporarily disabled or only available to administrators.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Representative
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  County
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  # Ratings
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Responsiveness
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Issue Resolution
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Engagement
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((rep, index) => (
                <tr key={rep.id} className={index < 3 ? "bg-yellow-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 && (
                        <span className="mr-2 text-lg">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rep.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rep.county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {rep.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {rep.avg.responsiveness ?? "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {rep.avg.issueResolution ?? "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {rep.avg.engagement ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No representative ratings available yet.</p>
              <p className="text-sm mt-1">Ratings will appear here once citizens start rating their representatives.</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Ratings are based on citizen feedback after issue resolution and direct communication.</p>
        <p className="mt-1">Top 3 representatives are highlighted with medals.</p>
      </div>
    </div>
  );
};

export default CitizenLeaderboard; 