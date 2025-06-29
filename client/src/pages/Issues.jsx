import { useEffect, useState } from "react";
import IssueForm from "../components/IssueForm.jsx";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

const statusColors = {
  reported: "bg-yellow-100 text-yellow-800",
  acknowledged: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const user = getUser();

  const fetchIssues = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/issues`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIssues(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load issues");
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreated = (issue) => setIssues((prev) => [issue, ...prev]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/issues/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
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

  return (
    <div className="space-y-6">
      {user.role === "citizen" && <IssueForm onCreated={onCreated} />}

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
                <td className="px-4 py-2 space-x-2">
                  {user.role === "representative" && !issue.representativeId && (
                    <button
                      className="text-indigo-600 hover:underline"
                      onClick={() => assignMe(issue.id)}
                    >
                      Assign to me
                    </button>
                  )}
                  {user.role === "representative" && issue.representativeId === user.id && issue.status !== "resolved" && (
                    <button
                      className="text-green-600 hover:underline"
                      onClick={() => updateStatus(issue.id, "resolved")}
                    >
                      Mark Resolved
                    </button>
                  )}
                  {user.role === "citizen" && issue.status === "reported" && (
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => updateStatus(issue.id, "resolved")}
                    >
                      Cancel
                    </button>
                  )}
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
    </div>
  );
};

export default Issues; 