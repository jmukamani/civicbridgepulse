import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";
import { API_BASE } from "../utils/network.js";

const SpecializationBadge = ({ specialization }) => (
  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
    {specialization}
  </span>
);

const VerificationQueue = () => {
  const [pendingReps, setPendingReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRep, setSelectedRep] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchPendingReps();
  }, []);

  const fetchPendingReps = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/pending-representatives`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setPendingReps(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending representatives");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (userId, action, reason = "") => {
    setActionLoading(true);
    try {
      await axios.post(`${API_BASE}/api/admin/verify-representative`, {
        userId,
        action,
        reason
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      toast.success(`Representative ${action}d successfully`);
      
      // Remove from pending list
      setPendingReps(prev => prev.filter(rep => rep.id !== userId));
      setSelectedRep(null);
      setRejectReason("");
      
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} representative`);
    } finally {
      setActionLoading(false);
    }
  };

  const approveRepresentative = (userId) => {
    handleVerification(userId, "approve");
  };

  const rejectRepresentative = (userId) => {
    handleVerification(userId, "reject", rejectReason);
  };

  const openRejectDialog = (rep) => {
    setSelectedRep(rep);
    setRejectReason("");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Representative Verification Queue</h1>
        <p className="text-gray-600 mt-2">
          Review and approve representative registration requests
        </p>
      </div>

      {pendingReps.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending representative verifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingReps.map((rep) => {
            const verificationDocs = rep.verificationDocs ? JSON.parse(rep.verificationDocs) : null;
            
            return (
              <div key={rep.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{rep.name}</h3>
                    <p className="text-gray-600">{rep.email}</p>
                    <p className="text-sm text-gray-500">County: {rep.county}</p>
                    <p className="text-sm text-gray-500">
                      Applied: {new Date(rep.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => approveRepresentative(rep.id)}
                      disabled={actionLoading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => openRejectDialog(rep)}
                      disabled={actionLoading}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>

                {/* Specializations */}
                {rep.specializations && rep.specializations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Specializations:</h4>
                    <div className="flex flex-wrap">
                      {rep.specializations.map((spec, index) => (
                        <SpecializationBadge key={index} specialization={spec} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Documents */}
                {verificationDocs && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Documents:</h4>
                    <div className="text-sm text-gray-600">
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(verificationDocs, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      {selectedRep && (
        <Dialog open={true} onClose={() => setSelectedRep(null)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white max-w-md w-full p-6 rounded-lg shadow-lg relative z-10">
              <Dialog.Title className="text-lg font-semibold mb-4">
                Reject Representative Application
              </Dialog.Title>
              
              <p className="text-gray-600 mb-4">
                Are you sure you want to reject <strong>{selectedRep.name}</strong>'s application?
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (optional):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Provide a reason for the rejection..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedRep(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectRepresentative(selectedRep.id)}
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {actionLoading ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default VerificationQueue; 