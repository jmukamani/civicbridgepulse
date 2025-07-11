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
        <div className="absolute right-0 mt-2 w-80 sm:w-72 bg-white shadow-lg border rounded-lg z-50 max-w-[calc(100vw-2rem)] sm:max-w-none">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <button 
              onClick={handleMarkAll} 
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-auto divide-y">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
                  n.read ? "bg-white" : "bg-indigo-50"
                }`}
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
                <p className="font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
              </li>
            ))}
            {notifications.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            )}
          </ul>
          <button 
            onClick={() => loadMore()} 
            className="w-full text-center text-xs py-3 text-indigo-600 hover:bg-gray-50 font-medium border-t"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 