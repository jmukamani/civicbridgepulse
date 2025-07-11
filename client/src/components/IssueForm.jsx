import { useState } from "react";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import { queueAction, generateId } from "../utils/db.js";
import useQueueSync from "../hooks/useQueueSync.js";
import { API_BASE } from "../utils/network.js";

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
          token: getToken(),
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
    <form className="space-y-4 md:space-y-6 bg-white p-4 md:p-6 rounded-lg shadow" onSubmit={submit}>
      <h2 className="text-lg md:text-xl font-bold">Report an Issue</h2>
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Brief description of the issue"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          placeholder="Provide detailed information about the issue..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="infrastructure">Infrastructure</option>
          <option value="service">Service</option>
          <option value="environment">Environment</option>
          <option value="security">Security</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Location (area name)</label>
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g. Kibera, Westlands, etc."
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
      >
        {loading ? "Submitting..." : "Report Issue"}
      </button>
    </form>
  );
};

export default IssueForm;