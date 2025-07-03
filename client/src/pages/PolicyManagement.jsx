import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";
import ActionMenu from "../components/ActionMenu.jsx";
import { useNavigate } from "react-router-dom";

const PolicyManagement = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("budget");
  const [file, setFile] = useState(null);
  const [summaryEn, setSummaryEn] = useState("");
  const [summarySw, setSummarySw] = useState("");
  const [error, setError] = useState("");
  const [docs, setDocs] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [budgetText, setBudgetText] = useState("");
  const navigate = useNavigate();

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

  const del = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    await bulkDelete([id]);
  };

  const bulkDelete = async (ids) => {
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} document(s)?`)) return;
    try {
      await axios.post("http://localhost:5000/api/policies/bulk-delete", { ids }, {
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      });
      toast.success("Deleted successfully");
      setDocs((prev) => prev.filter((d) => !ids.includes(d.id)));
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const saveEdit = async () => {
    if (!editDoc) return;
    try {
      const { id, ...payload } = editDoc;
      await axios.patch(`http://localhost:5000/api/policies/${id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Updated");
      setEditDoc(null);
      fetchDocs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === docs.length ? [] : docs.map((d) => d.id)));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Policy Management</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Documents</h3>
          {selectedIds.length > 0 && (
            <button onClick={() => bulkDelete(selectedIds)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2"><input type="checkbox" checked={selectedIds.length===docs.length && docs.length>0} onChange={toggleSelectAll} /></th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Uploaded</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2"><input type="checkbox" checked={selectedIds.includes(d.id)} onChange={()=>toggleSelect(d.id)} /></td>
                  <td className="px-3 py-2">{d.title}</td>
                  <td className="px-3 py-2">{d.category}</td>
                  <td className="px-3 py-2 capitalize">{d.status}</td>
                  <td className="px-3 py-2">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <ActionMenu
                      actions={[
                        { label: "Preview", onClick: () => setPreviewDoc(d) },
                        { label: "Edit", onClick: () => setEditDoc({ ...d }) },
                        { label: "Comments", onClick: () => navigate(`/dashboard/policy-management/${d.id}`) },
                        {
                          label: "Share",
                          onClick: () => {
                            navigator.clipboard.writeText(`${window.location.origin}/dashboard/policies/view/${d.id}`);
                            toast.success("Link copied to clipboard");
                          },
                        },
                        { label: "Delete", onClick: () => del(d.id) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {docs.length===0 && (<tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500">No documents</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

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

      {previewDoc && (
        <Dialog open={true} onClose={()=>setPreviewDoc(null)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white max-w-3xl w-full p-4 rounded shadow-lg relative z-10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{previewDoc.title}</h3>
                <button onClick={()=>setPreviewDoc(null)} className="text-gray-600">✕</button>
              </div>
              <iframe
                src={`http://localhost:5000/api/policies/${previewDoc.id}/file?token=${getToken()}`}
                className="w-full h-[70vh]"
                title="preview"
              />
            </div>
          </div>
        </Dialog>
      )}

      {editDoc && (
        <Dialog open={true} onClose={()=>setEditDoc(null)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white max-w-lg w-full p-6 rounded shadow-lg relative z-10 space-y-3">
              <h3 className="text-lg font-semibold">Edit Document</h3>
              <input className="border w-full px-3 py-2 rounded" value={editDoc.title} onChange={(e)=>setEditDoc({...editDoc, title:e.target.value})} />
              <select className="border w-full px-3 py-2 rounded" value={editDoc.category} onChange={(e)=>setEditDoc({...editDoc, category:e.target.value})}>
                <option value="budget">Budget</option>
                <option value="development">Development Plan</option>
                <option value="bylaw">Bylaw</option>
                <option value="other">Other</option>
              </select>
              <select className="border w-full px-3 py-2 rounded" value={editDoc.status} onChange={(e)=>setEditDoc({...editDoc, status:e.target.value})}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
              </select>
              <textarea className="border w-full px-3 py-2 rounded" rows="4" value={editDoc.summary_en || ""} onChange={(e)=>setEditDoc({...editDoc, summary_en:e.target.value})} placeholder="English summary"/>
              <textarea className="border w-full px-3 py-2 rounded" rows="4" value={editDoc.summary_sw || ""} onChange={(e)=>setEditDoc({...editDoc, summary_sw:e.target.value})} placeholder="Swahili summary"/>
              <textarea className="border w-full px-3 py-2 rounded" rows="2" value={JSON.stringify(editDoc.budget||{}, null, 0)} onChange={(e)=>setEditDoc({...editDoc, budget:e.target.value})} placeholder="Budget JSON"/>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setEditDoc(null)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default PolicyManagement;
