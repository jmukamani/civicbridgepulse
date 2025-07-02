import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import useSocket from "../hooks/useSocket.js";

const API_BASE = "http://localhost:5000";

const PolicyComments = () => {
  const { id } = useParams(); // policy id
  const [policy, setPolicy] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef(null);
  const socketRef = useSocket();

  const fetchComments = async () => {
    const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
    const [meta, cmts] = await Promise.all([
      axios.get(`${API_BASE}/api/policies/${id}`, tokenHeader).then((r) => r.data),
      axios.get(`${API_BASE}/api/policies/${id}/comments`, tokenHeader).then((r) => r.data),
    ]);
    setPolicy(meta);
    setComments(cmts);
  };

  useEffect(() => { fetchComments(); /* eslint-disable-next-line */ }, [id]);

  // live update when socket event received
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = ({ policyId }) => {
      if (policyId === id) fetchComments();
    };
    socket.on("policy_comment", handler);
    return () => socket.off("policy_comment", handler);
  }, [socketRef, id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments]);

  const post = async () => {
    if (!content) return;
    const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
    await axios.post(`${API_BASE}/api/policies/${id}/comments`, { content }, tokenHeader);
    setContent("");
    fetchComments();
  };

  const user = getUser();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Comments on: {policy?.title}</h2>
      <div className="border rounded h-96 overflow-y-auto p-4 bg-white space-y-3">
        {comments.map((c) => (
          <div key={c.id} className={`p-2 rounded max-w-xl ${c.authorId === user.id ? "ml-auto bg-emerald-700 text-white" : "bg-gray-100"}`}>
            {c.content}
            <div className="text-xs mt-1 opacity-70 text-right">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-center text-gray-500">No comments yet.</p>}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply..."
          className="flex-1 border rounded px-3 py-2"
          onKeyDown={(e)=>{if(e.key==="Enter") post();}}
        />
        <button onClick={post} className="bg-indigo-600 text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default PolicyComments; 