import { useState } from "react";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import { queueAction, generateId } from "../utils/db.js";
import useQueueSync from "../hooks/useQueueSync.js";

const API_BASE = "http://localhost:5000";

const defaultForm = {
  title: "",
  description: "",
  category: "infrastructure",
  location: "",
};

const IssueForm = ({ onCreated }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const online = useOnlineStatus();
  useQueueSync();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (online) {
        res = await fetch(`${API_BASE}/api/issues`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to submit");
        const data = await res.json();
        toast.success("Issue reported successfully");
        setForm(defaultForm);
        onCreated && onCreated(data);
      } else {
        const offlineAction = {
          id: generateId(),
          type: "issue",
          payload: form,
        };
        await queueAction(offlineAction);
        toast.info("Issue queued for sync when online");
        setForm(defaultForm);
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not report issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 bg-white p-4 rounded shadow" onSubmit={submit}>
      <h2 className="text-lg font-bold">Report an Issue</h2>
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="mt-1 w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="mt-1 w-full border rounded px-2 py-1"
        >
          <option value="infrastructure">Infrastructure</option>
          <option value="service">Service</option>
          <option value="environment">Environment</option>
          <option value="security">Security</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Location (area name)</label>
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          className="mt-1 w-full border rounded px-2 py-1"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Report"}
      </button>
    </form>
  );
};

export default IssueForm;