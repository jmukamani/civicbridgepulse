import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { getUser, getToken } from "../utils/auth.js";
import { formatDateTime } from "../utils/datetime.js";
import useSocket from "../hooks/useSocket.js";
import { toast } from "react-toastify";
import ActionMenu from "../components/ActionMenu.jsx";
import ResourceCard from "../components/ResourceCard.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import { API_BASE } from "../utils/network.js";

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
  const [recentResources, setRecentResources] = useState([]);
  const socketRef = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
        const [issRes, pollRes, threadRes, policyRes, eventsRes, resourcesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/issues`, tokenHeader),
          axios.get(`${API_BASE}/api/polls`, tokenHeader),
          axios.get(`${API_BASE}/api/forums/threads`, tokenHeader),
          axios.get(`${API_BASE}/api/policies`, tokenHeader),
          axios.get(`${API_BASE}/api/events`, tokenHeader),
          axios.get(`${API_BASE}/api/resources?recent=true`, tokenHeader),
        ]);

        setIssues(issRes.data);
        setThreads(threadRes.data);
        setPolicies(policyRes.data);
        const evSorted = [...eventsRes.data].sort((a,b)=> new Date(a.date) - new Date(b.date));
        setEvents(evSorted);
        setRecentResources(resourcesRes.data);

        // Poll details with votes
        const dets = await Promise.all(
          pollRes.data.map(async (p) => {
            const d = await axios.get(`${API_BASE}/api/polls/${p.id}`, tokenHeader).then((r) => r.data);
            return { ...p, votes: d.votes };
          })
        );
        setPolls(dets);

        const snapshot = { issues: issRes.data, threads: threadRes.data, policies: policyRes.data, events: evSorted, polls: dets, resources: resourcesRes.data };
        localStorage.setItem('rep_dash_cache', JSON.stringify(snapshot));
      } catch (err) {
        const cached = localStorage.getItem('rep_dash_cache');
        if (cached) {
          const snap = JSON.parse(cached);
          setIssues(snap.issues||[]);
          setThreads(snap.threads||[]);
          setPolicies(snap.policies||[]);
          setEvents(snap.events||[]);
          setPolls(snap.polls||[]);
          setRecentResources(snap.resources||[]);
        }
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
          note={events.length ? (
            (() => {
              const diffDays = Math.ceil((new Date(events[0].date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <span className="flex items-center gap-1 text-yellow-600">
                  <span>⏰</span> Next in {diffDays} day{diffDays === 1 ? "" : "s"}
                </span>
              );
            })()
          ) : (
            "none"
          )}
        />
        <StatCard
          title="Budget Allocation"
          value={totalBudget ? `KES ${totalBudget.toLocaleString()}` : "–"}
          icon={<span>💰</span>}
          note={totalBudget ? "based on uploaded budgets" : undefined}
        />
      </div>

      {/* Scheduled Events */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Scheduled Events</h3>
        <ul className="space-y-1 text-sm max-h-40 overflow-auto">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center gap-2">
              <span>{formatDateTime(ev.date)}</span>
              <CountdownTimer date={ev.date} />
              <span>– {ev.title}</span>
            </li>
          ))}
          {events.length === 0 && <p>No events scheduled.</p>}
        </ul>
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
                <td className="px-6 py-3">
                  <ActionMenu
                    actions={[
                      { label: "Edit", onClick: () => navigate("/dashboard/policy-management") },
                      { label: "Comments", onClick: () => navigate(`/dashboard/policy-management/${p.id}`) },
                      {
                        label: "Share",
                        onClick: () => {
                          navigator.clipboard.writeText(`${window.location.origin}/dashboard/policies/view/${p.id}`);
                          toast.success("Link copied to clipboard");
                        },
                      },
                    ]}
                  />
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

      {/* Recent Resources */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">My Recent Resources</h3>
        <ul className="space-y-2 text-sm max-h-40 overflow-auto">
          {recentResources.map((r) => (
            <li key={r.id} className="flex justify-between items-center">
              <a href={r.externalUrl || r.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline truncate">
                {r.title}
              </a>
            </li>
          ))}
          {recentResources.length === 0 && <p>No recent resources.</p>}
        </ul>
      </div>
    </div>
  );
};

export default RepresentativeHome;
