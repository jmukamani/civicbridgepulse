import { useEffect, useState } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import BudgetChart from "../components/BudgetChart.jsx";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

const PolicyList = () => {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const user = getUser();

  const fetch = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/policies", {
        params: { q: search, category },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDocs(res.data);
      // Persist for offline usage
      localStorage.setItem("policies_cache", JSON.stringify(res.data));
    } catch (err) {
      // Offline fallback
      const cached = localStorage.getItem("policies_cache");
      if (cached) {
        setDocs(JSON.parse(cached));
      } else {
        console.error(err);
      }
    }
  };

  useEffect(() => { fetch(); }, [search, category]);

  // Helper to color tags
  const tagClasses = (type, val) => {
    const map = {
      category: {
        infrastructure: "bg-green-100 text-green-800",
        education: "bg-purple-100 text-purple-800",
        energy: "bg-amber-100 text-amber-800",
        water: "bg-blue-100 text-blue-800",
        environment: "bg-green-100 text-green-800",
        budget: "bg-teal-100 text-teal-800",
        development: "bg-indigo-100 text-indigo-800",
        bylaw: "bg-pink-100 text-pink-800",
        other: "bg-gray-100 text-gray-800",
      },
      status: {
        draft: "bg-yellow-100 text-yellow-800",
        review: "bg-amber-100 text-amber-800",
        published: "bg-green-100 text-green-800",
        approved: "bg-green-100 text-green-800",
        'in progress': "bg-blue-100 text-blue-800",
        delayed: "bg-red-100 text-red-800",
        'under review': "bg-amber-100 text-amber-800",
      },
    };
    return map[type]?.[val] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Policies</h2>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects"
            className="border px-3 py-2 rounded flex-1"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border px-2 py-2">
            <option value="">All</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="education">Education</option>
            <option value="energy">Energy</option>
            <option value="water">Water</option>
            <option value="environment">Environment</option>
            <option value="budget">Budget</option>
            <option value="development">Development Plan</option>
            <option value="bylaw">Bylaw</option>
          </select>
        </div>
      </div>
      {/* Table header */}
      <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 px-4 py-2 border-b">
        <div className="col-span-4 md:col-span-4">POLICY</div>
        <div className="col-span-2">CATEGORY</div>
        <div className="col-span-2">STATUS</div>
        <div className="col-span-2">LAST UPDATE</div>
        {user?.role === 'citizen' && <div className="col-span-2 text-center">ACTION</div>}
      </div>
      {docs.map((d) => (
        <div
          key={d.id}
          className="grid grid-cols-12 items-center px-4 py-3 border-b hover:bg-gray-50 text-sm"
        >
          {/* Icon + title */}
          <Link to={`view/${d.id}`} className="col-span-4 md:col-span-4 flex items-start gap-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl font-bold">
              {d.title.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900 leading-none">{d.title}</p>
              <p className="text-xs text-gray-500">{d.subtitle || d.department || d.category}</p>
            </div>
          </Link>
          {/* Category tag */}
          <div className="col-span-2">
            <span className={`text-xs px-2 py-1 rounded-full ${tagClasses('category', d.category)}`}>{d.category}</span>
          </div>
          {/* Status tag */}
          <div className="col-span-2">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${tagClasses('status', d.status)}`}>{d.status?.replace('_', ' ')}</span>
          </div>
          {/* Last update */}
          <div className="col-span-2 text-gray-500 text-xs">
            {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}
          </div>
          {user?.role === 'citizen' && (
            <div className="col-span-2 flex justify-center">
              <Link to={`view/${d.id}#comments`} className="text-indigo-600 text-xs hover:underline">Add Feedback</Link>
            </div>
          )}
        </div>
      ))}
      {docs.length === 0 && <p className="text-gray-500 mt-4 text-sm">No projects found</p>}
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
    const fetchDoc = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/policies/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setDoc(res.data);
        // store for offline
        const saved = JSON.parse(localStorage.getItem("policies_cache")) || [];
        const exists = saved.find((d) => d.id === res.data.id);
        if (!exists) {
          localStorage.setItem("policies_cache", JSON.stringify([...saved, res.data]));
        }
      } catch (err) {
        // offline: look in localStorage
        const cached = JSON.parse(localStorage.getItem("policies_cache")) || [];
        const found = cached.find((d) => d.id === id);
        if (found) setDoc(found);
        else console.error(err);
      }
    };
    fetchDoc();
  }, [id]);

  if (!doc || !doc.filePath) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-indigo-600">← Back</button>
        <p className="text-gray-600">Document not available offline.</p>
      </div>
    );
  }

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