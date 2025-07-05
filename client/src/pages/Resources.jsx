import { useEffect, useState } from "react";
import debounce from "lodash.debounce";
import ResourceCard from "../components/ResourceCard.jsx";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";

const API_BASE = "http://localhost:5000";

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ q: "", category: "", bookmarked: false, recent: false });
  const [showModal, setShowModal] = useState(false);
  const [newRes, setNewRes] = useState({ title: "", description: "", externalUrl: "", category: "", tags: "" });
  const user = getUser();

  const fetchResources = async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/api/resources?${qs}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const list = await res.json();
      setResources(list);
      // derive categories
      const cats = Array.from(new Set(list.map((r) => r.category).filter(Boolean)));
      setCategories(cats);
      // store cache
      localStorage.setItem('resources_cache', JSON.stringify(list));
    } catch (err) {
      const cached = localStorage.getItem('resources_cache');
      if (cached) {
        const list = JSON.parse(cached);
        setResources(list);
        const cats = Array.from(new Set(list.map((r) => r.category).filter(Boolean)));
        setCategories(cats);
      } else {
        toast.info('Resources not available offline yet');
      }
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    fetchResources(filters);
  }, [filters.q, filters.category, filters.bookmarked, filters.recent]);

  const debouncedSearch = debounce((txt) => setFilters((f) => ({ ...f, q: txt })), 400);

  const toggleBookmarkLocal = (id, bookmarked) => {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, bookmarked } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Civic Education Resources</h2>
        {user.role === "representative" && (
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">+ Add</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-end bg-white p-4 rounded shadow">
        <div>
          <label className="block text-xs font-medium text-gray-600">Search</label>
          <input className="border px-2 py-1 rounded" placeholder="Search…" onChange={(e) => debouncedSearch(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Category</label>
          <select
            className="border px-2 py-1 rounded"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={filters.bookmarked}
            onChange={(e) => setFilters((f) => ({ ...f, bookmarked: e.target.checked }))}
          />
          Bookmarks
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={filters.recent} onChange={(e) => setFilters((f) => ({ ...f, recent: e.target.checked }))} />
          Recent
        </label>
      </div>

      <ul className="space-y-2">
        {resources.map((r) => (
          <ResourceCard key={r.id} res={r} onBookmarkToggle={toggleBookmarkLocal} />
        ))}
        {resources.length === 0 && <p>No resources found.</p>}
      </ul>

      {showModal && (
        <Dialog open={true} onClose={()=>setShowModal(false)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white w-full max-w-lg p-6 rounded shadow-lg relative z-10 space-y-3">
              <h3 className="text-lg font-semibold">Add Resource</h3>
              <input className="border w-full px-3 py-2 rounded" placeholder="Title" value={newRes.title} onChange={(e)=>setNewRes({...newRes,title:e.target.value})} />
              <textarea className="border w-full px-3 py-2 rounded" rows="3" placeholder="Description" value={newRes.description} onChange={(e)=>setNewRes({...newRes,description:e.target.value})} />
              <input className="border w-full px-3 py-2 rounded" placeholder="External URL" value={newRes.externalUrl} onChange={(e)=>setNewRes({...newRes,externalUrl:e.target.value})} />
              <input className="border w-full px-3 py-2 rounded" placeholder="Category" value={newRes.category} onChange={(e)=>setNewRes({...newRes,category:e.target.value})} />
              <input className="border w-full px-3 py-2 rounded" placeholder="Tags (comma)" value={newRes.tags} onChange={(e)=>setNewRes({...newRes,tags:e.target.value})} />
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={async()=>{
                  if(!newRes.title||!(newRes.externalUrl)) {toast.error("Title & URL required"); return;}
                  try{
                    await fetch(`${API_BASE}/api/resources`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},body:JSON.stringify({...newRes,tags:newRes.tags.split(',').map(t=>t.trim()).filter(Boolean)})});
                    toast.success("Resource added");
                    setShowModal(false);
                    setNewRes({ title:"", description:"", externalUrl:"", category:"", tags:""});
                    fetchResources(filters);
                  }catch{toast.error("Failed");}
                }}>Save</button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Resources; 