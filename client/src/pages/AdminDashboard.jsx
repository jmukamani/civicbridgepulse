import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import { API_BASE } from "../utils/network.js";

const StatCard = ({ title, value, icon, color = "bg-indigo-500" }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center">
      <div className={`${color} p-3 rounded-full text-white mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setStats(response.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and management</p>
      </div>

      {/* User Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            icon="👥"
            color="bg-blue-500"
          />
          <StatCard
            title="Citizens"
            value={stats.users.citizens}
            icon="👤"
            color="bg-green-500"
          />
          <StatCard
            title="Representatives"
            value={stats.users.representatives}
            icon="🏛️"
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Representative Verification */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Representative Verification</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Pending Verification"
            value={stats.representatives.pending}
            icon="⏳"
            color="bg-yellow-500"
          />
          <StatCard
            title="Verified"
            value={stats.representatives.verified}
            icon="✅"
            color="bg-green-500"
          />
          <StatCard
            title="Rejected"
            value={stats.representatives.rejected}
            icon="❌"
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Platform Activity */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Issues"
            value={stats.issues.total}
            icon="📝"
            color="bg-indigo-500"
          />
          <StatCard
            title="Open Issues"
            value={stats.issues.open}
            icon="🔓"
            color="bg-orange-500"
          />
          <StatCard
            title="Resolved Issues"
            value={stats.issues.resolved}
            icon="✅"
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/dashboard/verification-queue'}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">⏳</div>
            <div>Review Pending</div>
            <div className="text-sm opacity-90">({stats.representatives.pending})</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/user-management'}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">👥</div>
            <div>Manage Users</div>
            <div className="text-sm opacity-90">({stats.users.total})</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/issues'}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <div>View Issues</div>
            <div className="text-sm opacity-90">({stats.issues.total})</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/analytics'}
            className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div>Analytics</div>
            <div className="text-sm opacity-90">Reports</div>
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">System Health</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Polls Created</span>
            <span className="font-semibold">{stats.polls.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Issue Resolution Rate</span>
            <span className="font-semibold">
              {stats.issues.total > 0 
                ? Math.round((stats.issues.resolved / stats.issues.total) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Representative Verification Rate</span>
            <span className="font-semibold">
              {stats.users.representatives > 0 
                ? Math.round((stats.representatives.verified / stats.users.representatives) * 100)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 