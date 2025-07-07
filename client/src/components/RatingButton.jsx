import { useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import { API_BASE } from "../utils/network.js";

const RatingButton = ({ messageId }) => {
  const [rated, setRated] = useState(false);
  const [show, setShow] = useState(false);

  const submitRating = async (value) => {
    await axios.post(
      `${API_BASE}/api/messages/${messageId}/rate`,
      { rating: value },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    setRated(true);
    setShow(false);
  };

  if (rated) return <span className="text-xs text-green-600">Rated</span>;

  return (
    <div className="inline-block ml-2 relative">
      <button onClick={() => setShow((v) => !v)} className="text-yellow-500">★</button>
      {show && (
        <div className="absolute bg-white border rounded shadow p-2 flex space-x-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => submitRating(n)} className="text-yellow-500">{n}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingButton; 