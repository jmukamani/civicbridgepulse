import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../utils/network.js";
import { getToken, getUser } from "../utils/auth.js";

const useLeaderboardVisibility = () => {
  const [visibility, setVisibility] = useState({ citizens: false, representatives: false });
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    const fetchVisibility = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/representatives/leaderboard-visibility`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setVisibility(res.data);
      } catch (err) {
        console.warn("Failed to fetch leaderboard visibility:", err);
        // Set default values if API fails
        setVisibility({ citizens: true, representatives: false });
      } finally {
        setLoading(false);
      }
    };

    fetchVisibility();
  }, []);

  const isVisibleToUser = () => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "citizen") return true; // Temporarily hardcoded for testing
    if (user.role === "representative") return visibility.representatives;
    return false;
  };



  return {
    visibility,
    loading,
    isVisibleToUser: isVisibleToUser(),
  };
};

export default useLeaderboardVisibility; 