import { useState } from "react";
import { getToken } from "../utils/auth.js";
import { toast } from "react-toastify";
import { queueAction, generateId } from "../utils/db.js";

const API_BASE = "http://localhost:5000";

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
    <li className="border p-3 rounded flex justify-between items-start gap-4">
      <div>
        <a href={res.externalUrl || res.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium">
          {res.title}
        </a>
        {res.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{res.description}</p>}
        {res.tags?.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap text-xs">
            {res.tags.map((t) => (
              <span key={t} className="bg-gray-100 px-1 rounded">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
      <button onClick={toggle} disabled={processing}>{res.bookmarked ? "★" : "☆"}</button>
    </li>
  );
};

export default ResourceCard; 