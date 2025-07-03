import { useState, useEffect } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import { queueAction, generateId } from "../utils/db.js";
import { toast } from "react-toastify";
import { formatDateTime } from "../utils/datetime.js";
import CountdownTimer from "../components/CountdownTimer.jsx";
import ActionMenu from "../components/ActionMenu.jsx";

const API_BASE = "http://localhost:5000";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "", capacity: "", category: "" });
  const [editingId, setEditingId] = useState(null);

  const user = getUser();
  const isRep = user?.role === "representative";

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/events`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const evSorted = [...res.data].sort((a,b)=> new Date(a.date) - new Date(b.date));
      setEvents(evSorted);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.date) return;
    const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : undefined };
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/api/events/${editingId}`, payload, { headers: { Authorization: `Bearer ${getToken()}` } });
        toast.success("Event updated");
      } else {
        await axios.post(`${API_BASE}/api/events`, payload, { headers: { Authorization: `Bearer ${getToken()}` } });
        toast.success("Event created");
      }
      setForm({ title: "", description: "", date: "", location: "", capacity: "", category: "" });
      setEditingId(null);
      load();
    } catch (err) {
      // offline handling only for create
      if (!editingId && !navigator.onLine) {
        await queueAction({ id: generateId(), type: "event", payload, token: getToken() });
        toast.info("Event queued and will sync when online");
        setForm({ title: "", description: "", date: "", location: "", capacity: "", category: "" });
      } else {
        toast.error(err.response?.data?.message || "Failed");
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{isRep ? "Event Management" : "Events"}</h2>

      <h3 className="font-semibold mb-2">Upcoming Events</h3>
      <ul className="space-y-2">
        {events.map((ev) => (
          <li key={ev.id} className="p-3 border rounded space-y-1">
            <div className="flex justify-between items-start">
              <p className="font-medium">{ev.title}</p>
              {isRep && (
                <ActionMenu
                  actions={[
                    {
                      label: "Edit",
                      onClick: () => {
                        setEditingId(ev.id);
                        setForm({
                          title: ev.title || "",
                          description: ev.description || "",
                          date: ev.date ? new Date(ev.date).toISOString().slice(0,16) : "",
                          location: ev.location || "",
                          capacity: ev.capacity?.toString() || "",
                          category: ev.category || "",
                        });
                      },
                    },
                    {
                      label: "Delete",
                      onClick: async () => {
                        if (!window.confirm("Delete this event?")) return;
                        try {
                          await axios.delete(`${API_BASE}/api/events/${ev.id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
                          toast.success("Event deleted");
                          load();
                        } catch (err) {
                          toast.error(err.response?.data?.message || "Delete failed");
                        }
                      },
                    },
                  ]}
                />
              )}
            </div>
            <p className="text-sm flex items-center gap-2">
              {formatDateTime(ev.date)}
              <CountdownTimer date={ev.date} />
              {ev.location && <span>• {ev.location}</span>}
            </p>
            <p className="text-xs text-gray-600">{ev.description}</p>
            {ev.capacity && (
              <p className="text-xs">
                Capacity: {ev.rsvpCount ?? "-"}/{ev.capacity}
              </p>
            )}

            {!isRep && (
              <>
                {ev.hasRsvped ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">RSVPed</span>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(
                          `${API_BASE}/api/events/${ev.id}/rsvp`,
                          {},
                          { headers: { Authorization: `Bearer ${getToken()}` } }
                        );
                        toast.success("RSVP successful");
                        load();
                      } catch (err) {
                        toast.error(err.response?.data?.message || "RSVP failed");
                      }
                    }}
                    disabled={ev.capacity && ev.rsvpCount >= ev.capacity}
                    className="mt-1 bg-green-600 text-white text-xs px-2 py-1 rounded disabled:opacity-50"
                  >
                    RSVP
                  </button>
                )}
              </>
            )}
          </li>
        ))}
        {events.length === 0 && <p>No upcoming events.</p>}
      </ul>

      {isRep && (
        <>
          <h3 className="font-semibold mt-6 mb-2">Create Event</h3>
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
            <input
              type="number"
              placeholder="Capacity (optional)"
              className="border rounded px-3 py-2 w-full"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
            <input
              placeholder="Category (optional)"
              className="border rounded px-3 py-2 w-full"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded">
                {editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({ title: "", description: "", date: "", location: "", capacity: "", category: "" });
                  }}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventManagement; 