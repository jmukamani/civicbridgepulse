import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../utils/network.js";
import { getToken } from "../utils/auth.js";

const StarInput = ({ value, onChange, label }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="w-32 text-sm">{label}</span>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`text-xl ${star <= value ? "text-yellow-400" : "text-gray-300"}`}
        onClick={() => onChange(star)}
        aria-label={`Rate ${star}`}
      >
        ★
      </button>
    ))}
  </div>
);

const RepresentativeRatingModal = ({ open, onClose, representativeId, issueId, messageThreadId, onSubmitted }) => {
  const [responsiveness, setResponsiveness] = useState(0);
  const [issueResolution, setIssueResolution] = useState(0);
  const [engagement, setEngagement] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (![responsiveness, issueResolution, engagement].every((v) => v >= 1 && v <= 5)) {
      setError("Please rate all categories (1-5 stars)");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE}/api/representatives/${representativeId}/ratings`,
        {
          responsiveness,
          issueResolution,
          engagement,
          comment,
          issueId,
          messageThreadId,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSubmitted) onSubmitted();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-red-500">&times;</button>
        <h3 className="text-lg font-bold mb-4">Rate Your Representative</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <StarInput value={responsiveness} onChange={setResponsiveness} label="Responsiveness" />
          <StarInput value={issueResolution} onChange={setIssueResolution} label="Issue Resolution" />
          <StarInput value={engagement} onChange={setEngagement} label="Engagement" />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Thank you for your feedback!</div>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded font-semibold mt-2 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RepresentativeRatingModal; 