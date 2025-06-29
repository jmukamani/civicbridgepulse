import { useEffect, useState } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import { Link, useNavigate } from "react-router-dom";
import SelectRecipient from "../components/SelectRecipient.jsx";

const Conversations = () => {
  const [threads, setThreads] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThreads = async () => {
      const res = await axios.get("http://localhost:5000/api/messages/threads", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setThreads(res.data);
    };
    fetchThreads();
  }, []);

  const current = getUser();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex justify-between items-center">
        Messages
        <button
          onClick={() => setPickerOpen(true)}
          className="bg-indigo-600 text-white px-3 py-1 rounded"
        >
          New Message
        </button>
      </h2>
      {threads.length === 0 && <p className="text-gray-600">No conversations yet. Start a new message.</p>}
      <ul className="space-y-2">
        {threads.map((t) => (
          <li key={t.id}>
            <Link to={`../messages/${t.senderId === current.id ? t.recipientId : t.senderId}`} className="block p-3 border rounded hover:bg-gray-100">
              <div className="font-medium">{t.content.slice(0, 50)}</div>
              <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
            </Link>
          </li>
        ))}
      </ul>
      {pickerOpen && (
        <SelectRecipient
          onSelect={(u) => {
            setPickerOpen(false);
            navigate(`../messages/${u.id}`);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default Conversations; 