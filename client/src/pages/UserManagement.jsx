import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import ActionMenu from "../components/ActionMenu.jsx";
import { API_BASE } from "../utils/network.js";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/users?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateUser = async (id, payload) => {
    try {
      await axios.patch(`${API_BASE}/api/admin/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const toggleActive = (u) => updateUser(u.id, { isActive: !u.isActive });
  const setRole = (u, role) => updateUser(u.id, { role });

  const del = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Deleted");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 capitalize">{u.role}</td>
                <td className="px-3 py-2">{u.isActive ? "✅" : "🚫"}</td>
                <td className="px-3 py-2">
                  <ActionMenu
                    actions={[
                      ...(u.role !== "admin"
                        ? [
                            { label: "Make Citizen", onClick: () => setRole(u, "citizen") },
                            { label: "Make Rep", onClick: () => setRole(u, "representative") },
                          ]
                        : []),
                      {
                        label: u.isActive ? "Disable" : "Enable",
                        onClick: () => toggleActive(u),
                      },
                      ...(u.role !== "admin"
                        ? [
                            {
                              label: "Delete",
                              onClick: () => del(u.id),
                            },
                          ]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement; 