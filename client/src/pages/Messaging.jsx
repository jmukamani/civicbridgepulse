import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import useSocket from "../hooks/useSocket.js";
import { useParams } from "react-router-dom";
import RatingButton from "../components/RatingButton.jsx";
import { notifySuccess, notifyError } from "../utils/notifications.js";

const Messaging = () => {
  const { userId: otherId } = useParams();
  const [topic, setTopic] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [composeCategory, setComposeCategory] = useState("other");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const socketRef = useSocket();
  const user = getUser();
  const bottomRef = useRef(null);

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

  const sendMessage = async () => {
    if (!content) return;
    try {
      const res = await axios.post(
        "http://localhost:5000/api/messages/send",
        { recipientId: otherId, content, topic, category: composeCategory },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setMessages((prev) => [...prev, res.data]);
      setContent("");
      notifySuccess("Message sent");
    } catch (err) {
      notifyError(err.response?.data?.message || "Send failed");
    }
  };

  const filteredMessages = messages.filter(
    (m) =>
      (filterCategory === "all" || m.category === filterCategory) &&
      (search === "" || m.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-2 flex flex-wrap gap-2 items-center">
        <input
          placeholder="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <select value={filterCategory} onChange={(e)=>setFilterCategory(e.target.value)} className="border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="urgent">Urgent</option>
          <option value="policy">Policy</option>
          <option value="local">Local</option>
          <option value="other">Other</option>
        </select>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search" className="border rounded px-2 py-1 flex-1" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs p-2 rounded shadow text-sm ${
              msg.senderId === user.id ? "ml-auto bg-indigo-600 text-white" : "bg-gray-200"
            }`}
          >
            {msg.content}
            {msg.senderId === user.id && (
              <span className="block text-xs text-right mt-1">
                {msg.read ? "Read" : "Sent"}
              </span>
            )}
            <span className="block text-xs mb-1 font-semibold">{msg.category}</span>
            {msg.senderId !== user.id && user.role === "citizen" && (
              <RatingButton messageId={msg.id} />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t flex items-center space-x-2">
        <select value={composeCategory} onChange={(e)=>setComposeCategory(e.target.value)} className="border rounded px-2 py-2">
          <option value="urgent">Urgent</option>
          <option value="policy">Policy</option>
          <option value="local">Local</option>
          <option value="other">Other</option>
        </select>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message"
          className="flex-1 border rounded px-3 py-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Messaging; 