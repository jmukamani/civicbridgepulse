import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getUser, getToken } from "../utils/auth.js";
import useSocket from "../hooks/useSocket.js";

const API_BASE = "http://localhost:5000";

const StatCard = ({ title, value, icon, note }) => (
  <div className="bg-white p-6 rounded-lg shadow flex items-center gap-4">
    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xl">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {note && <p className="text-xs text-green-600 mt-1">{note}</p>}
    </div>
  </div>
);

const RepresentativeHome = () => {
  const user = getUser();
  const [issues, setIssues] = useState([]);
  const [polls, setPolls] = useState([]);
  const [threads, setThreads] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [events, setEvents] = useState([]);
  const socketRef = useSocket();

  useEffect(() => {
    const load = async () => {
      try {
        const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
        const [issRes, pollRes, threadRes, policyRes, eventsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/issues`, tokenHeader),
          axios.get(`${API_BASE}/api/polls`, tokenHeader),
          axios.get(`${API_BASE}/api/forums/threads`, tokenHeader),
          axios.get(`${API_BASE}/api/policies`, tokenHeader),
          axios.get(`${API_BASE}/api/events`, tokenHeader),
        ]);

        setIssues(issRes.data);
        setThreads(threadRes.data);
        setPolicies(policyRes.data);
        setEvents(eventsRes.data);

        // Poll details with votes
        const dets = await Promise.all(
          pollRes.data.map(async (p) => {
            const d = await axios.get(`${API_BASE}/api/polls/${p.id}`, tokenHeader).then((r) => r.data);
            return { ...p, votes: d.votes };
          })
        );
        setPolls(dets);
      } catch (err) {
        console.error(err);
      }
    };
    load();

    const socket = socketRef.current;
    if (socket) {
      socket.on("policy_comment", load);
      return () => socket.off("policy_comment", load);
    }
  }, []);

  // Compute simple budget total for display (sum of numeric values in budget JSON)
  const totalBudget = policies.reduce((sum, p) => {
    if (p.budget && typeof p.budget === "object") {
      return (
        sum +
        Object.values(p.budget).reduce((s, val) => (typeof val === "number" ? s + val : s), 0)
      );
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1">
            Welcome, Hon. {user?.name?.split(" ")[0] || "Representative"}
          </h2>
          <p className="text-gray-600">
            Manage civic activities in {user?.ward || "your Ward"}, {user?.county || "your County"}
          </p>
        </div>
        <Link
          to="/dashboard/policy-management"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <span className="text-lg">+</span> Create New Policy
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Policies"
          value={policies.length}
          icon={<span>📄</span>}
          note={`${policies.filter((p) => p.status === "published").length} published`}
        />
        <StatCard
          title="Citizen Feedback"
          value={threads.length}
          icon={<span>💬</span>}
          note={`${issues.filter((i) => i.status !== "resolved").length} open issues`}
        />
        <StatCard
          title="Scheduled Events"
          value={events.length}
          icon={<span>📅</span>}
          note={events.length ? "next: "+ new Date(events[0].date).toLocaleDateString() : "none"}
        />
        <StatCard
          title="Budget Allocation"
          value={totalBudget ? `KES ${totalBudget.toLocaleString()}` : "–"}
          icon={<span>💰</span>}
          note={totalBudget ? "based on uploaded budgets" : undefined}
        />
      </div>

      {/* Policies management table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-lg">Policies Management</h3>
          {/* Simple filters – non-functional placeholder to mirror design */}
          <div className="flex gap-2">
            <select className="border rounded px-3 py-1 text-sm">
              <option>All Categories</option>
            </select>
            <select className="border rounded px-3 py-1 text-sm">
              <option>All Status</option>
            </select>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 uppercase tracking-wider bg-gray-50">
              <th className="px-6 py-3">Policy</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500">Uploaded: {new Date(p.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-3">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                    {p.category}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={
                      "inline-block text-xs px-2 py-0.5 rounded " +
                      (p.status === "published"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-indigo-100 text-indigo-800")
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-3 space-x-3">
                  <Link to="policy-management" className="text-indigo-600 text-xs hover:underline">
                    Edit
                  </Link>
                  <Link to={`/dashboard/policy-management/${p.id}`} className="text-indigo-600 text-xs hover:underline">Comments</Link>
                </td>
              </tr>
            ))}
            {policies.length === 0 && (
              <tr>
                <td className="px-6 py-4 text-gray-500" colSpan="4">
                  No policy documents yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepresentativeHome;
