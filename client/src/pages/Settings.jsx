import { useState, useEffect } from "react";
import { getUser, getToken, removeToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationPreferences from "../components/NotificationPreferences.jsx";
import { API_BASE } from "../utils/network.js";

const Settings = () => {
  const user = getUser();
  if (user.role === "representative") return <RepSettings initial={user} />;
  return <CitizenSettings initial={user} />;
};

const DeleteAccountSection = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    if (!window.confirm(t('delete_account_confirm'))) {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE}/api/users/account`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        data: { password }
      });
      
      toast.success(t('account_deleted'));
      removeToken();
      navigate("/");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        toast.error(err.response.data.message || t('invalid_password'));
      } else {
        toast.error(t('delete_account_failed'));
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setPassword("");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
      <h3 className="text-lg font-semibold text-red-700 mb-2">{t('delete_account')}</h3>
      <p className="text-sm text-gray-600 mb-3">
        {t('delete_account_warning')}
      </p>
      
      {!showDeleteModal ? (
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          {t('delete_account')}
        </button>
      ) : (
        <form onSubmit={handleDeleteAccount} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('enter_password_confirm')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {isDeleting ? t('deleting') : t('confirm_delete')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setPassword("");
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const CitizenSettings = ({ initial }) => {
  const [form, setForm] = useState({ name: initial.name, county: initial.county || "", ward: initial.ward || "", ageRange: initial.ageRange || "", gender: initial.gender || "", isPublic: initial.isPublic ?? true });
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };
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
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isPublic"
            checked={form.isPublic}
            onChange={change}
            className="h-4 w-4"
          />
          <span className="text-sm">{t('public_profile')}</span>
        </label>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
      </form>
      <NotificationPreferences />
      <div className="bg-white p-4 rounded shadow">
        <button
          onClick={() => {
            removeToken();
            navigate("/login");
          }}
          className="text-red-600 hover:underline text-sm"
        >
          Sign out
        </button>
      </div>
      <DeleteAccountSection />
    </div>
  );
};

const RepSettings = ({ initial }) => {
  const [form, setForm] = useState({ name: initial.name, county: initial.county || "", ward: initial.ward || "", isPublic: initial.isPublic ?? true });
  const { t: tRep } = useTranslation();
  const navigate = useNavigate();
  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };
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
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isPublic"
            checked={form.isPublic}
            onChange={change}
            className="h-4 w-4"
          />
          <span className="text-sm">{tRep('public_profile')}</span>
        </label>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
      </form>
      <NotificationPreferences />
      <div className="bg-white p-4 rounded shadow">
        <button
          onClick={() => {
            removeToken();
            navigate("/login");
          }}
          className="text-red-600 hover:underline text-sm"
        >
          Sign out
        </button>
      </div>
      <DeleteAccountSection />
    </div>
  );
};

export default Settings; 