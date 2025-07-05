import { BellIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import useNotifications from "../hooks/useNotifications.js";
import { formatDateTime } from "../utils/datetime.js";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const { notifications, unreadCount, markRead, loadMore } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setOpen((v) => !v);

  const handleMarkAll = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length) markRead(unreadIds);
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="relative p-2 rounded-full hover:bg-gray-100">
        <BellIcon className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg border rounded z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <button onClick={handleMarkAll} className="text-xs text-indigo-600">Mark all read</button>
          </div>
          <ul className="max-h-80 overflow-auto divide-y">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${n.read ? "bg-white" : "bg-indigo-50"}`}
                onClick={() => {
                  let target = null;
                  if (n.type === "message" && n.data?.senderId) {
                    target = `/dashboard/messages/${n.data.senderId}`;
                  } else if ((n.type === "issue_status" || n.type === "issue") && n.data?.issueId) {
                    target = `/dashboard/issues#${n.data.issueId}`;
                  }
                  if (target) navigate(target);
                  markRead([n.id]);
                  setOpen(false);
                }}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(n.createdAt)}</p>
              </li>
            ))}
            {notifications.length === 0 && <p className="p-3 text-center text-sm">No notifications</p>}
          </ul>
          <button onClick={() => loadMore()} className="w-full text-center text-xs py-1 text-indigo-600 hover:bg-gray-50">
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 