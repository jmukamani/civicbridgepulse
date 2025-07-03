import { useEffect, useState } from "react";
import IssueForm from "../components/IssueForm.jsx";
import ActionMenu from "../components/ActionMenu.jsx";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";
import debounce from "lodash.debounce";
import useSocket from "../hooks/useSocket.js";
import axios from "axios";
import useOnlineStatus from "../hooks/useOnlineStatus.js";

const API_BASE = "http://localhost:5000";

const STATUS_OPTIONS = [
  { value: "reported", label: "Reported" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "under_review", label: "Under Review" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const statusColors = {
  reported: "bg-yellow-100 text-yellow-800",
  acknowledged: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  blocked: "bg-red-100 text-red-800",
  under_review: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [filters, setFilters] = useState({ status: "", category: "", priority: "", q: "" });
  const [timelineIssue, setTimelineIssue] = useState(null);
  const user = getUser();
  const socketRef = useSocket();
  const online = useOnlineStatus();

  const fetchIssues = async (params = {}) => {
    try {
      const res = await axios.get(`${API_BASE}/api/issues`, {
        params,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setIssues(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load issues");
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    const handler = () => fetchIssues(filters);
    window.addEventListener("issue_status", handler);
    return () => window.removeEventListener("issue_status", handler);
  }, [filters]);

  // Debounced search
  const debouncedSearch = debounce((text) => {
    setFilters((f) => ({ ...f, q: text }));
  }, 500);

  useEffect(() => {
    fetchIssues(filters);
  }, [filters.status, filters.category, filters.priority, filters.q]);

  const onCreated = (issue) => setIssues((prev) => [issue, ...prev]);

  const updateStatus = async (id, status) => {
    let note;
    if (status === "blocked") {
      note = window.prompt("Enter reason for blocking this issue:");
      if (note === null) return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/issues/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(note ? { status, note } : { status }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)));
      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      toast.error("Could not update status");
    }
  };

  const assignMe = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/issues/${id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)));
      toast.success("Assigned");
    } catch (err) {
      console.error(err);
      toast.error("Could not assign");
    }
  };

  const openTimeline = async (issue) => {
    if (!online) {
      toast.info("Timeline not available offline");
      return;
    }
    try {
      const { data } = await axios.get(`${API_BASE}/api/issues/${issue.id}/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTimelineIssue({ ...issue, history: data });
    } catch (err) {
      toast.error("Could not load timeline");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600">Status</label>
          <select
            className="border px-2 py-1 rounded"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Search</label>
          <input
            className="border px-2 py-1 rounded"
            placeholder="Search title…"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>

      <h2 className="text-lg font-bold">All Issues</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-t">
                <td className="px-4 py-2">{issue.title}</td>
                <td className="px-4 py-2 capitalize">{issue.category}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      statusColors[issue.status] || "bg-gray-100"
                    }`}
                  >
                    {issue.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs">{issue.location || "-"}</td>
                <td className="px-4 py-2">
                  <ActionMenu
                    actions={[
                      { label: "Timeline", onClick: () => openTimeline(issue) },
                      ...(user.role === "representative"
                        ? STATUS_OPTIONS.filter((s) => s.value !== issue.status).map((s) => ({
                            label: `Set ${s.label}`,
                            onClick: () => updateStatus(issue.id, s.value),
                          }))
                        : []),
                      ...(user.role === "representative" && !issue.representativeId
                        ? [{ label: "Assign to me", onClick: () => assignMe(issue.id) }]
                        : []),
                      {
                        label: "Share",
                        onClick: () => {
                          navigator.clipboard.writeText(`${window.location.origin}/dashboard/issues#${issue.id}`);
                          toast.success("Link copied");
                        },
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No issues found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Timeline Modal */}
      {timelineIssue && (
        <Dialog open={true} onClose={() => setTimelineIssue(null)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white max-w-lg w-full p-6 rounded shadow-lg relative z-10">
              <h3 className="text-lg font-semibold mb-4">Issue Timeline</h3>
              <ul className="space-y-2 text-sm">
                {timelineIssue.history?.map((h) => (
                  <li key={h.id} className="flex gap-2 items-start">
                    <span className="w-2 h-2 mt-2 rounded-full bg-indigo-600" />
                    <div>
                      <p>
                        <strong className="capitalize">{h.status.replace(/_/g, " ")}</strong>
                        {h.note && <span> – {h.note}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="text-right mt-4">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => setTimelineIssue(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {user.role === "citizen" && (
        <div className="mt-6">
          <IssueForm onCreated={onCreated} />
        </div>
      )}
    </div>
  );
};

export default Issues; 