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
import { API_BASE } from "../utils/network.js";
import RepresentativeRatingModal from "./RepresentativeRatingModal.jsx";

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

// Helper to turn status value into nicely formatted label
const getStatusLabel = (value) => {
  const found = STATUS_OPTIONS.find((s) => s.value === value);
  if (found) return found.label;
  // Fallback: convert snake_case to Title Case
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [filters, setFilters] = useState({ status: "", category: "", priority: "", q: "" });
  const [timelineIssue, setTimelineIssue] = useState(null);
  const user = getUser();
  const socketRef = useSocket();
  const online = useOnlineStatus();
  const [showRating, setShowRating] = useState({ open: false, repId: null, issueId: null });
  const [ratedIssues, setRatedIssues] = useState([]); // prevent duplicate modals
  const [showAll, setShowAll] = useState(false); // for rep toggle
  const [detailsIssue, setDetailsIssue] = useState(null); // for rep view details modal

  const fetchIssues = async (params = {}) => {
    try {
      const repParams = { ...params };
      if (user.role === "representative") repParams.showAll = showAll;
      const res = await axios.get(`${API_BASE}/api/issues`, {
        params: repParams,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setIssues(res.data);
      // cache
      localStorage.setItem('issues_cache', JSON.stringify(res.data));
    } catch (err) {
      const cached = localStorage.getItem('issues_cache');
      if (cached) {
        setIssues(JSON.parse(cached));
      }
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [showAll]);

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
      // Show rating modal if citizen, status is resolved, and not already rated
      if (
        user.role === "citizen" &&
        status === "resolved" &&
        updated.representativeId &&
        !ratedIssues.includes(id)
      ) {
        setShowRating({ open: true, repId: updated.representativeId, issueId: updated.id });
        setRatedIssues((prev) => [...prev, id]);
      }
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
    try {
      const { data } = await axios.get(`${API_BASE}/api/issues/${issue.id}/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTimelineIssue({ ...issue, history: data });
      // cache for offline
      localStorage.setItem(`issue_hist_${issue.id}`, JSON.stringify(data));
    } catch (err) {
      // offline fallback
      const cached = localStorage.getItem(`issue_hist_${issue.id}`);
      if (cached) {
        setTimelineIssue({ ...issue, history: JSON.parse(cached) });
      } else {
        toast.info("Timeline not available offline yet");
      }
    }
  };

  // Show rating modal for already-resolved, assigned, unrated issues (citizen)
  useEffect(() => {
    if (user.role === "citizen" && issues.length > 0) {
      const unrated = issues.find(
        (i) =>
          i.status === "resolved" &&
          i.representativeId &&
          !ratedIssues.includes(i.id)
      );
      if (unrated) {
        setShowRating({ open: true, repId: unrated.representativeId, issueId: unrated.id });
        setRatedIssues((prev) => [...prev, unrated.id]);
      }
    }
    // eslint-disable-next-line
  }, [issues]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      {(user.role === "citizen" || user.role === "admin") && (
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
      )}
      {user.role === "representative" && (
        <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
            />
            Show All Issues
          </label>
          <span className="text-xs text-gray-500">(Uncheck to see only issues relevant to your specialization)</span>
        </div>
      )}

      <h2 className="text-lg font-bold">All Issues</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-center align-middle">Status</th>
              <th className="px-4 py-2 text-center align-middle">Location</th>
              <th className="px-4 py-2 text-center align-middle">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-t">
                <td className="px-4 py-2">{issue.title}</td>
                <td className="px-4 py-2 capitalize">{issue.category}</td>
                <td className="px-4 py-2 text-center align-middle">
                  <span
                    className={`inline-block min-w-[80px] text-center px-2 py-1 rounded text-xs font-medium ${
                      statusColors[issue.status] || "bg-gray-100"
                    }`}
                  >
                    {getStatusLabel(issue.status)}
                  </span>
                </td>
                <td className="px-4 py-2 text-center align-middle text-xs">{issue.location || "-"}</td>
                <td className="px-4 py-2 text-center align-middle" style={{ minWidth: 48 }}>
                  <ActionMenu
                    actions={[
                      { label: "Timeline", onClick: () => openTimeline(issue) },
                      ...(user.role === "representative"
                        ? [{ label: "View Details", onClick: () => setDetailsIssue(issue) }]
                        : []),
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
                        <strong>{getStatusLabel(h.status)}</strong>
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
      <RepresentativeRatingModal
        open={showRating.open}
        onClose={() => setShowRating({ open: false, repId: null, issueId: null })}
        representativeId={showRating.repId}
        issueId={showRating.issueId}
      />
      {/* Issue Details Modal for Representatives */}
      {detailsIssue && (
        <Dialog open={true} onClose={() => setDetailsIssue(null)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white max-w-lg w-full p-6 rounded shadow-lg relative z-10">
              <h3 className="text-lg font-semibold mb-4">Issue Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Title:</strong> {detailsIssue.title}</div>
                <div><strong>Description:</strong> {detailsIssue.description}</div>
                <div><strong>Category:</strong> {detailsIssue.category}</div>
                <div><strong>Status:</strong> {getStatusLabel(detailsIssue.status)}</div>
                <div><strong>Location:</strong> {detailsIssue.location || "-"}</div>
                <div><strong>Priority:</strong> {detailsIssue.priority || "-"}</div>
                <div><strong>Created:</strong> {new Date(detailsIssue.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right mt-4">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={() => setDetailsIssue(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Issues; 