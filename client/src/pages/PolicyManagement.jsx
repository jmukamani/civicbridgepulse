import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";

const PolicyManagement = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("budget");
  const [file, setFile] = useState(null);
  const [summaryEn, setSummaryEn] = useState("");
  const [summarySw, setSummarySw] = useState("");
  const [error, setError] = useState("");
  const [docs, setDocs] = useState([]);
  const [budgetText, setBudgetText] = useState("");

  const fetchDocs = async () => {
    const res = await axios.get("http://localhost:5000/api/policies", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setDocs(res.data);
  };
  useEffect(() => { fetchDocs(); }, []);

  const upload = async () => {
    if (!file || !title) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("category", category);
    if (summaryEn) fd.append("summary_en", summaryEn);
    if (summarySw) fd.append("summary_sw", summarySw);
    if (budgetText) fd.append("budget", budgetText);
    try {
      await axios.post("http://localhost:5000/api/policies/upload", fd, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTitle("");
      setSummaryEn("");
      setSummarySw("");
      setFile(null);
      setError("");
      setBudgetText("");
      fetchDocs();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Policy Management</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">Upload Policy Document</h3>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-2"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border px-2 py-2 mb-2">
          <option value="budget">Budget</option>
          <option value="development">Development Plan</option>
          <option value="bylaw">Bylaw</option>
          <option value="other">Other</option>
        </select>
        <textarea
          placeholder="English summary (optional)"
          value={summaryEn}
          onChange={(e) => setSummaryEn(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-2"
        />
        <textarea
          placeholder="Kiswahili summary (optional)"
          value={summarySw}
          onChange={(e) => setSummarySw(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-2"
        />
        <textarea
          placeholder="Budget JSON e.g. {&quot;Health&quot;:120000}"
          value={budgetText}
          onChange={(e) => setBudgetText(e.target.value)}
          className="border px-3 py-2 rounded w-full mb-2"
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-2" />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <button onClick={upload} className="bg-indigo-600 text-white px-4 py-2 rounded">Upload</button>
      </div>

      <h3 className="font-semibold mb-2">Existing Documents</h3>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="p-3 border rounded">
            {d.title} - {d.category} - {d.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PolicyManagement;
