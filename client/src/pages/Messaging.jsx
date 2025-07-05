import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import useSocket from "../hooks/useSocket.js";
import { useParams, useNavigate, Link } from "react-router-dom";
import RatingButton from "../components/RatingButton.jsx";
import { notifySuccess, notifyError } from "../utils/notifications.js";
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import { queueAction, generateId } from "../utils/db.js";
import { addLocalMessage } from "../utils/localDB.js";

const Messaging = () => {
  const { userId: otherId } = useParams();
  const [topic, setTopic] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [composeCategory, setComposeCategory] = useState("other");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([]);
  const [threadFilter, setThreadFilter] = useState("all");
  const [content, setContent] = useState("");
  const socketRef = useSocket();
  const user = getUser();
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const online = useOnlineStatus();

  useEffect(() => {
    if (!otherId) return;
    const fetchMessages = async () => {
      const res = await axios.get(`http://localhost:5000/api/messages/with/${otherId}`, {
        params: { topic },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMessages(res.data);
    };
    fetchMessages();
  }, [otherId, topic]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on("new_message", (msg) => {
      if (
        (msg.senderId === otherId && msg.recipientId === user.id) ||
        (msg.senderId === user.id && msg.recipientId === otherId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    socket.on("message_read", ({ id }) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    });
    return () => {
      socket.off("new_message");
      socket.off("message_read");
    };
  }, [socketRef, otherId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation list
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/messages/threads", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setThreads(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchThreads();
  }, []);

  const sendMessage = async () => {
    if (!content) return;
    const msgPayload = { recipientId: otherId, content, topic, category: composeCategory };

    if (online) {
      try {
        const res = await axios.post("http://localhost:5000/api/messages/send", msgPayload, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setMessages((prev) => [...prev, res.data]);
        notifySuccess("Message sent");
      } catch (err) {
        notifyError(err.response?.data?.message || "Send failed");
      }
    } else {
      // save locally to dexie and queue for sync
      const localId = await addLocalMessage({ threadId: null, repId: null, userId: user.id, ...msgPayload });
      await queueAction({ id: generateId(), type: "message", payload: msgPayload, token: getToken(), localId });
      setMessages((prev) => [
        ...prev,
        { id: `local-${localId}`, ...msgPayload, senderId: user.id, recipientId: otherId, createdAt: new Date().toISOString(), read: false },
      ]);
      notifySuccess("Message queued (offline)");
    }
    setContent("");
  };

  const filteredMessages = messages.filter(
    (m) =>
      (filterCategory === "all" || m.category === filterCategory) &&
      (search === "" || m.content.toLowerCase().includes(search.toLowerCase()))
  );

  // Filter threads list
  const displayedThreads = threads.filter((t) => {
    if (threadFilter === "unread" && t.read) return false;
    if (threadFilter === "flagged" && !t.flagged) return false;
    if (search && !t.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] md:h-full bg-gray-50 rounded-lg shadow overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-white flex flex-col">
        <div className="p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <div className="flex gap-2 mt-3 text-sm font-medium">
            {[
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              { key: "flagged", label: "Flagged" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setThreadFilter(f.key)}
                className={`px-2 py-1 rounded ${
                  threadFilter === f.key ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {displayedThreads.map((t) => {
            const partnerId = t.senderId === user.id ? t.recipientId : t.senderId;
            const unread = !t.read && t.recipientId === user.id;
            return (
              <Link
                key={t.id}
                to={`/dashboard/messages/${partnerId}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-100 ${
                  partnerId === otherId ? "bg-gray-100 border-l-4 border-indigo-600" : ""
                }`}
                onClick={() => navigate(`/dashboard/messages/${partnerId}`)}
              >
                <div className="relative flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 uppercase">
                  {t.senderName?.[0] || "U"}
                  {unread && (
                    <span className="absolute -top-1 -right-1 bg-red-600 h-4 w-4 rounded-full text-[10px] text-white flex items-center justify-center">
                      !
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{t.senderName || t.recipientName}</p>
                  <p className="text-xs text-gray-500 truncate w-48">{t.content}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </Link>
            );
          })}
          {displayedThreads.length === 0 && <p className="p-4 text-sm text-gray-500">No conversations</p>}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-3 flex items-center justify-between bg-white">
          <div className="font-semibold">Conversation</div>
          {/* action icons placeholder */}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-xs p-2 rounded text-sm shadow-sm ${
                msg.senderId === user.id ? "ml-auto bg-emerald-700 text-white" : "bg-white"
              }`}
            >
              {msg.content}
              {msg.senderId === user.id && (
                <span className="block text-[10px] text-right mt-1 opacity-80">
                  {msg.read ? "✓✓" : "✓"}
                </span>
              )}
              {msg.senderId !== user.id && user.role === "citizen" && (
                <RatingButton messageId={msg.id} />
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="p-3 border-t flex items-center gap-2 bg-white">
          <select
            value={composeCategory}
            onChange={(e) => setComposeCategory(e.target.value)}
            className="border rounded px-2 py-2 text-sm"
          >
            <option value="urgent">Urgent</option>
            <option value="policy">Policy</option>
            <option value="local">Local</option>
            <option value="other">Other</option>
          </select>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message"
            className="flex-1 border rounded px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button onClick={sendMessage} className="bg-emerald-700 text-white px-4 py-2 rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messaging; 