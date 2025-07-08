import { useEffect, useState } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import BudgetChart from "../components/BudgetChart.jsx";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { API_BASE } from "../utils/network.js";

const PolicyList = () => {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const user = getUser();

  const fetch = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/policies`, {
        params: { q: search, category },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDocs(res.data);
      prefetchFiles(res.data);
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fileAvailable, setFileAvailable] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/policies/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setDoc(res.data);
        
        // Update local storage cache
        const saved = JSON.parse(localStorage.getItem("policies_cache")) || [];
        const updatedSaved = saved.filter(d => d.id !== res.data.id);
        updatedSaved.push(res.data);
        localStorage.setItem("policies_cache", JSON.stringify(updatedSaved));
        
        // Check if file is available (cached or online)
        if (res.data.filePath) {
          await checkFileAvailability(res.data.filePath);
        }
      } catch (err) {
        console.warn('Failed to fetch from API, trying offline cache:', err);
        // offline: look in localStorage
        const cached = JSON.parse(localStorage.getItem("policies_cache")) || [];
        const found = cached.find((d) => d.id === id);
        if (found) {
          setDoc(found);
          if (found.filePath) {
            await checkFileAvailability(found.filePath);
          }
        } else {
          console.error('Policy not found in cache:', err);
          toast.error('Policy not available offline. Please check your connection.');
        }
      }
    };
    fetchDoc();
  }, [id]);

  const checkFileAvailability = async (filePath) => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('policy-files');
        const cachedResponse = await cache.match(`${API_BASE}/${filePath}`);
        if (cachedResponse) {
          setFileAvailable(true);
          return;
        }
      }
      
      // If not cached, check if we're online
      if (isOnline) {
        setFileAvailable(true);
      } else {
        setFileAvailable(false);
      }
    } catch (error) {
      console.warn('Error checking file availability:', error);
      setFileAvailable(isOnline);
    }
  };

  if (!doc) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-indigo-600">← Back</button>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Loading policy...</p>
        </div>
      </div>
    );
  }

  if (!doc.filePath) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-indigo-600">← Back</button>
        <p className="text-gray-600">Document file not available.</p>
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
      
      {/* Offline status indicator */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>You're offline. {fileAvailable ? 'Showing cached document.' : 'Document may not display properly.'}</p>
          </div>
        </div>
      )}
      
      {/* Document display */}
      {fileAvailable ? (
        doc.filePath.toLowerCase().endsWith(".pdf") ? (
          <embed
            src={`${API_BASE}/${doc.filePath}`}
            type="application/pdf"
            className="w-full h-[80vh] border"
            onError={(e) => {
              console.error('PDF embed error:', e);
              if (!isOnline) {
                toast.error('PDF not available offline. Please connect to internet.');
              }
            }}
          />
        ) : (
          <iframe
            title="doc-viewer"
            className="w-full h-[80vh] border"
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(`${API_BASE}/${doc.filePath}`)}`}
            onError={(e) => {
              console.error('Document viewer error:', e);
              if (!isOnline) {
                toast.error('Document viewer not available offline.');
              }
            }}
          />
        )
      ) : (
        <div className="w-full h-[80vh] border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
          <div className="text-center p-6">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document Unavailable Offline</h3>
            <p className="text-gray-500 mb-4">This document isn't cached for offline viewing.</p>
            {!isOnline && (
              <p className="text-sm text-gray-400">Connect to internet to view the full document.</p>
            )}
            {isOnline && (
              <button 
                onClick={() => window.location.reload()} 
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Try to reload document
              </button>
            )}
          </div>
        </div>
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
      const res = await axios.get(`${API_BASE}/api/policies/${policyId}/comments`, {
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
        `${API_BASE}/api/policies/${policyId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 mt-4">
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
      <ul className="space-y-2 text-sm">
        {comments.map((c) => (
          <li key={c.id} className="border p-2 rounded">
            {c.content}
          </li>
        ))}
      </ul>
    </div>
  );
};

// helper to cache files
const prefetchFiles = async (docs) => {
  if (!('caches' in window)) return;
  
  try {
    const fileCache = await caches.open('policy-files');
    const apiCache = await caches.open('external-api-cache');
    
    // Cache policy files and metadata in parallel
    const cachePromises = docs.map(async (d) => {
      const promises = [];
      
      // Cache the file if it exists
      if (d.filePath) {
        promises.push(
          fileCache.add(`${API_BASE}/${d.filePath}`).catch(err => {
            console.warn(`Failed to cache file ${d.filePath}:`, err);
          })
        );
      }
      
      // Cache the metadata endpoint
      promises.push(
        apiCache.add(`${API_BASE}/api/policies/${d.id}`).catch(err => {
          console.warn(`Failed to cache metadata for policy ${d.id}:`, err);
        })
      );
      
      // Cache comments endpoint
      promises.push(
        apiCache.add(`${API_BASE}/api/policies/${d.id}/comments`).catch(err => {
          console.warn(`Failed to cache comments for policy ${d.id}:`, err);
        })
      );
      
      return Promise.all(promises);
    });

    await Promise.all(cachePromises);
    console.log(`Successfully cached ${docs.length} policies for offline access`);
  } catch (error) {
    console.error('Error caching policies:', error);
  }
};

// ---- Router wrapper ----
const Policies = () => (
  <Routes>
    <Route index element={<PolicyList />} />
    <Route path="view/:id" element={<PolicyViewer />} />
  </Routes>
);

export default Policies;