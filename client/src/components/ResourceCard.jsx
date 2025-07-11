import { useState } from "react";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import { queueAction, generateId } from "../utils/db.js";
import { API_BASE } from "../utils/network.js";

const ResourceCard = ({ res, onBookmarkToggle }) => {
  const [processing, setProcessing] = useState(false);

  const toggle = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      if (navigator.onLine) {
        const r = await fetch(`${API_BASE}/api/resources/${res.id}/bookmark`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        }).then((d) => d.json());
        onBookmarkToggle(res.id, r.bookmarked);
      } else {
        await queueAction({ id: generateId(), type: 'resourceBookmark', payload: { resourceId: res.id }, token: getToken(), priority: 4 });
        onBookmarkToggle(res.id, !res.bookmarked);
        toast.info('Bookmark queued');
      }
    } catch {
      toast.error("Could not toggle bookmark");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <a 
            href={res.externalUrl || res.fileUrl} 
            target="_blank" 
            rel="noreferrer" 
            className="text-indigo-600 hover:text-indigo-800 underline font-medium text-base md:text-lg block"
          >
            {res.title}
          </a>
          {res.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
              {res.description}
            </p>
          )}
          {res.tags?.length > 0 && (
            <div className="mt-3 flex gap-1 flex-wrap">
              {res.tags.map((t) => (
                <span key={t} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <button 
          onClick={toggle} 
          disabled={processing}
          className={`flex-shrink-0 text-2xl hover:scale-110 transition-transform ${
            res.bookmarked ? 'text-yellow-500' : 'text-gray-400'
          } ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:text-yellow-600'}`}
          aria-label={res.bookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {res.bookmarked ? "★" : "☆"}
        </button>
      </div>
    </div>
  );
};

export default ResourceCard; 