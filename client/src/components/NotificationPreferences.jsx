import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import { API_BASE } from "../utils/network.js";

const NotificationPreferences = () => {
  const [pref, setPref] = useState({ inApp: true, push: true, email: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/notifications/preferences`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setPref(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = async (field) => {
    const newPref = { ...pref, [field]: !pref[field] };
    setPref(newPref);
    try {
      await axios.put(`${API_BASE}/api/notifications/preferences`, newPref, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading preferences…</p>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Notification Preferences</h3>
      <label className="flex items-center gap-2 mb-1">
        <input type="checkbox" checked={pref.inApp} onChange={() => update("inApp")} /> In-app notifications
      </label>
      <label className="flex items-center gap-2 mb-1">
        <input type="checkbox" checked={pref.push} onChange={() => update("push")} /> Push notifications
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={pref.email} onChange={() => update("email")} /> Email notifications
      </label>
    </div>
  );
};

export default NotificationPreferences; 