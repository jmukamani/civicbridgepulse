import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUser, getToken } from "../utils/auth.js";
import axios from "axios";

const API_BASE = "http://localhost:5000";

const CitizenHome = () => {
  const user = getUser();
  const [issues, setIssues] = useState([]);
  const [polls, setPolls] = useState([]);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
        // Issues
        const iss = await axios.get(`${API_BASE}/api/issues`, tokenHeader);
        setIssues(iss.data);
        // Polls list with votes included
        const ps = await axios.get(`${API_BASE}/api/polls`, tokenHeader);
        const pollsVoted = [];
        for (const p of ps.data) {
          const detail = await axios.get(`${API_BASE}/api/polls/${p.id}`, tokenHeader);
          if (detail.data.votes?.some((v) => v.voterId === user.id)) {
            pollsVoted.push(detail.data);
          }
        }
        setPolls(pollsVoted);
        // Forum threads authored or replied
        const th = await axios.get(`${API_BASE}/api/forums/threads`, tokenHeader);
        const myThreads = th.data.filter((t) => t.createdBy === user.id);
        setThreads(myThreads);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [user?.id]);

  const civicScore = issues.length + polls.length + threads.length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="issues" className="bg-yellow-500 text-white p-4 rounded text-center font-semibold">
          Report Issue
        </Link>
        <Link to="polls" className="bg-indigo-600 text-white p-4 rounded text-center font-semibold">
          Participate in Poll
        </Link>
        <Link to="forums" className="bg-teal-600 text-white p-4 rounded text-center font-semibold">
          Join Community Discussion
        </Link>
      </div>

      {/* My Civic Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Issues I've Reported</h3>
          <ul className="space-y-1 text-sm max-h-32 overflow-auto">
            {issues.map((i) => (
              <li key={i.id}>
                {i.title} — <span className="italic">{i.status}</span>
              </li>
            ))}
            {issues.length === 0 && <p>No issues yet.</p>}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Polls Participated</h3>
          <p className="text-3xl font-bold text-indigo-600">{polls.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Discussions Joined</h3>
          <p className="text-3xl font-bold text-teal-600">{threads.length}</p>
        </div>
      </div>

      {/* Civic Score */}
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="font-semibold mb-2">Civic Score</h3>
        <p className="text-5xl font-bold text-green-600">{civicScore}</p>
        <p className="text-sm text-gray-500">Engagement level indicator</p>
      </div>
    </div>
  );
};

export default CitizenHome;
