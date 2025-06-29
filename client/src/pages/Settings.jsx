import { useState } from "react";
import { getUser, getToken, setToken } from "../utils/auth.js";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

const Settings = () => {
  const user = getUser();
  if (user.role === "representative") return <RepSettings initial={user} />;
  return <CitizenSettings initial={user} />;
};

const CitizenSettings = ({ initial }) => {
  const [form, setForm] = useState({ name: initial.name, county: initial.county || "", ward: initial.ward || "", ageRange: initial.ageRange || "", gender: initial.gender || "" });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed");
    }
  };
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Profile Settings</h2>
      <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded shadow">
        <input name="name" value={form.name} onChange={change} placeholder="Full name" className="w-full border px-2 py-1" />
        <input name="county" value={form.county} onChange={change} placeholder="County" className="w-full border px-2 py-1" />
        <input name="ward" value={form.ward} onChange={change} placeholder="Ward" className="w-full border px-2 py-1" />
        <select name="ageRange" value={form.ageRange} onChange={change} className="w-full border px-2 py-1">
          <option value="">Age Range</option>
          <option value="18-24">18-24</option><option value="25-34">25-34</option><option value="35-44">35-44</option><option value="45-54">45-54</option><option value="55+">55+</option>
        </select>
        <select name="gender" value={form.gender} onChange={change} className="w-full border px-2 py-1">
          <option value="">Gender</option>
          <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
        </select>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
};

const RepSettings = ({ initial }) => {
  const [form, setForm] = useState({ name: initial.name, county: initial.county || "", ward: initial.ward || "" });
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      toast.success("Saved");
    } catch (err) { toast.error("Failed"); }
  };
  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Representative Settings</h2>
      <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded shadow">
        <input name="name" value={form.name} onChange={change} placeholder="Name" className="w-full border px-2 py-1" />
        <input name="county" value={form.county} onChange={change} placeholder="County" className="w-full border px-2 py-1" />
        <input name="ward" value={form.ward} onChange={change} placeholder="Ward" className="w-full border px-2 py-1" />
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
};

export default Settings; 