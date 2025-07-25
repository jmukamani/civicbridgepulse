import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import useSocket from "../hooks/useSocket.js";
import { API_BASE } from "../utils/network.js";

const PolicyComments = ({ policyId, onCommentCount, modalMode }) => {
  const { id: routeId } = useParams();
  const id = policyId || routeId; // support both prop and route param
  const [policy, setPolicy] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const socketRef = useSocket();

  const fetchComments = async () => {
    const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
    try {
      const [meta, cmts] = await Promise.all([
        axios.get(`${API_BASE}/api/policies/${id}`, tokenHeader).then((r) => r.data),
        axios.get(`${API_BASE}/api/policies/${id}/comments`, tokenHeader).then((r) => r.data),
      ]);
      setPolicy(meta);
      setComments(Array.isArray(cmts) ? cmts : []);
      if (onCommentCount) onCommentCount(Array.isArray(cmts) ? cmts.length : 0);
    } catch (err) {
      setComments([]);
      if (onCommentCount) onCommentCount(0);
    }
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
    await axios.post(`${API_BASE}/api/policies/${id}/comments`, { content, anonymous, parentId: replyTo }, tokenHeader);
    setContent("");
    setAnonymous(false);
    setReplyTo(null);
    fetchComments();
  };

  const user = getUser();

  // Helper to group comments by parentId
  const topLevel = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  // Find parent comment for snippet
  const parentComment = replyTo ? comments.find(c => c.id === replyTo) : null;

  const renderComment = (c) => (
    <div key={c.id} className={`p-2 rounded max-w-xl ${c.authorId === user.id ? "ml-auto bg-emerald-700 text-white" : "bg-gray-100"} mb-2`}>
      <div className="flex items-center gap-2">
        <span>
          {c.anonymous && c.author?.role === "citizen"
            ? "Anonymous"
            : c.author?.role === "representative"
              ? `Hon. ${c.author?.name}`
              : c.author?.name || ""}
        </span>
        {c.author?.role === "representative" && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-indigo-200 text-indigo-800">Representative</span>
        )}
      </div>
      <div className="mt-1">{c.content}</div>
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs opacity-70">{new Date(c.createdAt).toLocaleString()}</div>
        <button className="text-xs text-indigo-600 hover:underline" onClick={() => {
          setReplyTo(c.id);
          setContent("");
        }}>Reply</button>
      </div>
      {/* Render replies indented */}
      <div className="pl-6 mt-2">
        {replies.filter(r => r.parentId === c.id).map(renderReply)}
      </div>
    </div>
  );

  const renderReply = (c) => (
    <div key={c.id} className="p-2 rounded max-w-xl bg-gray-200 border mb-2 text-gray-900">
      <div className="flex items-center gap-2">
        <span>
          {c.anonymous && c.author?.role === "citizen"
            ? "Anonymous"
            : c.author?.role === "representative"
              ? `Hon. ${c.author?.name}`
              : c.author?.name || ""}
        </span>
        {c.author?.role === "representative" && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-indigo-200 text-indigo-800">Representative</span>
        )}
      </div>
      <div className="mt-1">{c.content}</div>
      <div className="text-xs mt-1 opacity-70 text-right">{new Date(c.createdAt).toLocaleString()}</div>
    </div>
  );

  return (
    <div className={modalMode ? "space-y-4" : "space-y-4 mt-4"}>
      <h2 className="text-xl font-bold">Comments on: {policy?.title}</h2>
      <div className="border rounded h-96 overflow-y-auto p-4 bg-white space-y-3">
        {topLevel.map(renderComment)}
        {comments.length === 0 && <p className="text-center text-gray-500">No comments yet.</p>}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 items-center">
        {replyTo && parentComment && (
          <div className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-2 max-w-xs truncate">
            Replying to: <span className="italic truncate">{parentComment.content.slice(0, 60)}{parentComment.content.length > 60 ? "..." : ""}</span>
            <button className="ml-2 text-red-500" onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        )}
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
          className="flex-1 border rounded px-3 py-2"
          onKeyDown={(e)=>{if(e.key==="Enter") post();}}
        />
        {user.role === "citizen" && (
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} />
            Post anonymously
          </label>
        )}
        <button onClick={post} className="bg-indigo-600 text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default PolicyComments; 