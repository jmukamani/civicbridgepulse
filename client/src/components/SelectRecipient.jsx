import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";

const SelectRecipient = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get("http://localhost:5000/api/users", {
        params: { q: search },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setResults(res.data);
    };
    fetch();
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow w-full max-w-md p-4">
        <h3 className="text-lg font-bold mb-2">Select Recipient</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full border px-3 py-2 rounded mb-3"
        />
        <div className="max-h-60 overflow-y-auto space-y-2">
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full text-left p-2 border rounded hover:bg-gray-100"
            >
              {u.name} ({u.role})
              <span className="block text-xs text-gray-500">{u.email}</span>
            </button>
          ))}
          {results.length === 0 && <p className="text-sm text-gray-500">No users</p>}
        </div>
        <button onClick={onClose} className="mt-4 text-red-600">Close</button>
      </div>
    </div>
  );
};

export default SelectRecipient; 