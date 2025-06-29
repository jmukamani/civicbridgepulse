import { useEffect, useState } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import BudgetChart from "../components/BudgetChart.jsx";
import { toast } from "react-toastify";

const PolicyList = () => {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get("http://localhost:5000/api/policies", {
        params: { q: search, category },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDocs(res.data);
    };
    fetch();
  }, [search, category]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Policy Documents</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search policies"
          className="border px-3 py-2 rounded flex-1"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border px-2 py-2">
          <option value="">All</option>
          <option value="budget">Budget</option>
          <option value="development">Development Plan</option>
          <option value="bylaw">Bylaw</option>
        </select>
      </div>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id}>
            <Link
              to={`view/${d.id}`}
              className="block p-3 border rounded hover:bg-gray-100"
            >
              <div className="font-medium">{d.title}</div>
              <div className="text-xs text-gray-500">
                {d.category} · {new Date(d.createdAt).toLocaleDateString()}
              </div>
            </Link>
          </li>
        ))}
        {docs.length === 0 && <p className="text-gray-500">No documents found</p>}
      </ul>
    </div>
  );
};

const PolicyViewer = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const id = pathname.split("/").pop();
  const [doc, setDoc] = useState(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const fetch = async () => {
      const res = await axios.get(`http://localhost:5000/api/policies/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDoc(res.data);
    };
    fetch();
  }, [id]);

  if (!doc) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-indigo-600 mb-4">← Back</button>
      <h2 className="text-2xl font-bold mb-2">{doc.title}</h2>
      <div className="mb-4 text-sm text-gray-600">{doc.category} · {new Date(doc.createdAt).toLocaleDateString()}</div>
      <div className="mb-4">
        <button onClick={()=>setLang('en')} className={`mr-2 ${lang==='en'?'font-bold':''}`}>EN</button>
        <button onClick={()=>setLang('sw')} className={lang==='sw'?'font-bold':''}>SW</button>
      </div>
      <p className="mb-4">{lang==='en'?doc.summary_en:doc.summary_sw}</p>
      {doc.budget && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Budget Breakdown</h4>
          <BudgetChart data={typeof doc.budget=== 'string'? JSON.parse(doc.budget): doc.budget} />
        </div>
      )}
      {doc.filePath.toLowerCase().endsWith(".pdf") ? (
        <embed
          src={`http://localhost:5000/${doc.filePath}`}
          type="application/pdf"
          className="w-full h-[80vh] border"
        />
      ) : (
        <iframe
          title="doc-viewer"
          className="w-full h-[80vh] border"
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(`http://localhost:5000/${doc.filePath}`)}`}
        />
      )}

      <Comments policyId={id} />
    </div>
  );
};

// Comments component
const Comments = ({ policyId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const user = getUser();

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/policies/${policyId}/comments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [policyId]);

  const postComment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `http://localhost:5000/api/policies/${policyId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setComments((prev) => [...prev, res.data]);
      setContent("");
    } catch (err) {
      toast.error("Could not comment");
    }
  };

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-2">Comments</h3>
      <ul className="space-y-2 mb-4">
        {comments.map((c) => (
          <li key={c.id} className="border p-2 rounded text-sm">
            {c.content}
          </li>
        ))}
        {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
      </ul>
      {user && (
        <form onSubmit={postComment} className="flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment"
            className="border flex-1 px-2 py-1"
            required
          />
          <button className="bg-indigo-600 text-white px-4 rounded">Post</button>
        </form>
      )}
    </div>
  );
};

const Policies = () => (
  <Routes>
    <Route index element={<PolicyList />} />
    <Route path="view/:id" element={<PolicyViewer />} />
  </Routes>
);

export default Policies;