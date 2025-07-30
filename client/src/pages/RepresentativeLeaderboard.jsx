import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../utils/network.js";
import { getToken, getUser } from "../utils/auth.js";

const RepresentativeLeaderboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibility, setVisibility] = useState({ citizens: false, representatives: false });
  const [myRank, setMyRank] = useState(null);
  const user = getUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First check if leaderboard is visible to representatives
        const visibilityRes = await axios.get(`${API_BASE}/api/representatives/leaderboard-visibility`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setVisibility(visibilityRes.data);
        
        if (!visibilityRes.data.representatives) {
          setError("Leaderboard is not currently available to representatives");
          setLoading(false);
          return;
        }

        // Fetch leaderboard data
        const res = await axios.get(`${API_BASE}/api/representatives/leaderboard`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setData(res.data);
        
        // Find current user's rank
        const myIndex = res.data.findIndex(rep => rep.id === user.id);
        setMyRank(myIndex >= 0 ? myIndex + 1 : null);
        
        setError("");
      } catch (err) {
        if (err.response?.status === 403) {
          setError("Leaderboard is not currently available to representatives");
        } else {
          setError("Failed to load leaderboard");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  if (user?.role !== "representative") {
    return <div className="p-8 text-center text-red-600 font-bold">Access denied</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Representative Leaderboard</h2>
      <p className="text-gray-600 mb-6">
        See how you and your colleagues are performing based on citizen ratings and feedback.
      </p>
      
      {myRank && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-xl">🏆</span>
            </div>
            <div className="ml-3">
              <p className="text-blue-800 font-medium">Your Current Rank: #{myRank}</p>
              <p className="text-blue-700 text-sm mt-1">
                Keep up the great work! Your performance is based on citizen feedback.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
                  Rank
                </th>
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
                <tr 
                  key={rep.id} 
                  className={`${index < 3 ? "bg-yellow-50" : ""} ${rep.id === user.id ? "bg-blue-50 border-l-4 border-blue-400" : ""}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 && (
                        <span className="mr-2 text-lg">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rep.name}
                          {rep.id === user.id && <span className="ml-2 text-blue-600">(You)</span>}
                        </div>
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
        <p className="mt-1">Top 3 representatives are highlighted with medals. Your position is highlighted in blue.</p>
      </div>
    </div>
  );
};

export default RepresentativeLeaderboard; 