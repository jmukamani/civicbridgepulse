import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getUser, getToken } from "../utils/auth.js";

const API_BASE = "http://localhost:5000";

const RepresentativeHome = () => {
  const user = getUser();
  const [issues, setIssues] = useState([]);
  const [polls, setPolls] = useState([]);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
        const iss = await axios.get(`${API_BASE}/api/issues`, tokenHeader);
        setIssues(iss.data);
        const ps = await axios.get(`${API_BASE}/api/polls`, tokenHeader);
        setPolls(ps.data);
        const th = await axios.get(`${API_BASE}/api/forums/threads`, tokenHeader);
        setThreads(th.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const unresolved = issues.filter((i) => i.status !== "resolved");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Welcome, {user?.name} – Representative</h2>

      {/* Issues Management */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">Issues Management</h3>
        <p className="mb-2">Unresolved issues: <span className="font-bold">{unresolved.length}</span></p>
        <Link to="issues" className="text-indigo-600 underline">Open Issues Dashboard →</Link>
      </div>

      {/* Polling System */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Polls Created</h3>
          <p className="text-3xl font-bold text-indigo-600">{polls.length}</p>
          <Link to="polls" className="text-sm text-indigo-600 underline">Manage Polls</Link>
        </div>
        <div className="bg-white p-4 rounded shadow md:col-span-2 flex items-center justify-center text-gray-400 italic">
          Poll analytics coming soon
        </div>
      </div>

      {/* Community Engagement */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Community Discussions</h3>
        <p>Active threads: <span className="font-bold">{threads.length}</span></p>
        <Link to="forums" className="text-indigo-600 underline">Monitor Discussions</Link>
      </div>

      {/* Constituency Overview */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Constituency Overview</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 italic">
          Geographic visualization coming soon
        </div>
      </div>
    </div>
  );
};

export default RepresentativeHome;
