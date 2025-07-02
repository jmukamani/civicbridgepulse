import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import { queueAction, generateId } from "../utils/db.js";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/events`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.date) return;
    const payload = { ...form };
    try {
      await axios.post(`${API_BASE}/api/events`, payload, { headers: { Authorization: `Bearer ${getToken()}` } });
      toast.success("Event created");
      setForm({ title: "", description: "", date: "", location: "" });
      load();
    } catch (err) {
      // offline handling
      if (!navigator.onLine) {
        await queueAction({ id: generateId(), type: "event", payload, token: getToken() });
        toast.info("Event queued and will sync when online");
        setForm({ title: "", description: "", date: "", location: "" });
      } else {
        toast.error(err.response?.data?.message || "Failed");
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Event Management</h2>
      <div className="bg-white p-4 rounded shadow mb-6 space-y-2">
        <input
          placeholder="Title"
          className="border rounded px-3 py-2 w-full"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          placeholder="Description"
          className="border rounded px-3 py-2 w-full"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="datetime-local"
          className="border rounded px-3 py-2 w-full"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          placeholder="Location"
          className="border rounded px-3 py-2 w-full"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <button onClick={create} className="bg-indigo-600 text-white px-4 py-2 rounded">Create</button>
      </div>

      <h3 className="font-semibold mb-2">Upcoming Events</h3>
      <ul className="space-y-2">
        {events.map((ev) => (
          <li key={ev.id} className="p-3 border rounded">
            <p className="font-medium">{ev.title}</p>
            <p className="text-sm">{new Date(ev.date).toLocaleString()} • {ev.location}</p>
            <p className="text-xs text-gray-600">{ev.description}</p>
          </li>
        ))}
        {events.length === 0 && <p>No upcoming events.</p>}
      </ul>
    </div>
  );
};

export default EventManagement; 