import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";
import axios from "axios";
import { queueAction, generateId } from "../utils/db.js";
import { API_BASE } from "../utils/network.js";

const NewThreadForm = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      const online = navigator.onLine;
      let thread;
      if (online) {
        thread = (
          await axios.post(
            `${API_BASE}/api/forums/threads`,
            { title },
            { headers: { Authorization: `Bearer ${getToken()}` } }
          )
        ).data;
      } else {
        const action = { id: generateId(), type: "thread", payload: { title }, token: getToken() };
        await queueAction(action);
        toast.info("Thread queued for sync");
        thread = { id: action.id, title, posts: [] };
      }
      onCreated && onCreated(thread);
      setTitle("");
    } catch (err) {
      toast.error("Could not create thread");
    }
  };
  return (
    <form onSubmit={submit} className="mb-4 flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New thread title"
        className="border flex-1 px-2 py-1"
        required
      />
      <button className="bg-indigo-600 text-white px-4 rounded">Post</button>
    </form>
  );
};

const ThreadList = ({ onOpen }) => {
  const [threads, setThreads] = useState([]);
  const fetchThreads = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/forums/threads`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setThreads(data);
      localStorage.setItem('threads_cache', JSON.stringify(data));
    } catch {
      const cached = localStorage.getItem('threads_cache');
      if (cached) setThreads(JSON.parse(cached));
    }
  };
  useEffect(() => { fetchThreads(); }, []);
  const onCreated = (t) => setThreads((prev) => [t, ...prev]);
  const user = getUser();
  return (
    <div>
      {user && <NewThreadForm onCreated={onCreated} />}
      <ul className="space-y-2">
        {threads.map((th) => (
          <li
            key={th.id}
            className="p-3 border rounded hover:bg-gray-100 cursor-pointer"
            onClick={() => onOpen(th.id)}
          >
            <div className="flex justify-between items-center">
              <span>{th.title}</span>
              {typeof th.postCount !== "undefined" && (
                <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {th.postCount}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {threads.length === 0 && <p>No threads yet.</p>}
    </div>
  );
};

const ThreadView = ({ id, onBack }) => {
  const [thread, setThread] = useState(null);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // <-- new state
  const user = getUser();
  const fetchThread = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/forums/threads/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setThread(data);
      localStorage.setItem(`thread_${id}`, JSON.stringify(data));
    } catch (err) {
      const cached = localStorage.getItem(`thread_${id}`);
      if (cached) {
        setThread(JSON.parse(cached));
      } else {
        toast.info("Thread not available offline yet");
      }
    }
  };
  useEffect(() => { fetchThread(); }, [id]);
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (navigator.onLine) {
        const { data: post } = await axios.post(
          `${API_BASE}/api/forums/threads/${id}/posts`,
          { content, anonymous, parentId: replyTo },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        setThread((prev) => ({ ...prev, posts: [...prev.posts, post] }));
      } else {
        await queueAction({ id: generateId(), type: "forumPost", payload: { threadId: id, content, anonymous, parentId: replyTo }, token: getToken() });
        setThread((prev) => ({ ...prev, posts: [...prev.posts, { id: generateId(), content, authorId: user.id, anonymous, parentId: replyTo }] }));
        toast.info("Post queued");
      }
      setContent("");
      setAnonymous(false);
      setReplyTo(null);
    } catch (err) {
      toast.error("Could not post");
    }
  };
  if (!thread) return <p>Loading...</p>;
  // Group posts by parentId
  const topLevel = thread.posts?.filter(p => !p.parentId) || [];
  const replies = thread.posts?.filter(p => p.parentId) || [];
  const renderPost = (p) => {
    const mine = user && p.authorId === user.id;
    let bubbleClass = "self-start bg-gray-100";
    if (mine) {
      bubbleClass = "self-end bg-green-100";
    } else if (p.author?.role === "representative") {
      bubbleClass = "self-start bg-indigo-100";
    }
    return (
      <li
        key={p.id}
        className={`max-w-xs rounded px-3 py-2 text-sm shadow ${bubbleClass} mb-2`}
      >
        <div className="flex items-center gap-2">
          <span>
            {p.anonymous && p.author?.role === "citizen"
              ? "Anonymous"
              : p.author?.role === "representative"
                ? `Hon. ${p.author?.name}`
                : p.author?.name || ""}
          </span>
          {p.author?.role === "representative" && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-indigo-200 text-indigo-800">Representative</span>
          )}
        </div>
        <div className="mt-1">{p.content}</div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs opacity-70">{new Date(p.createdAt).toLocaleString()}</div>
          <button className="text-xs text-indigo-600 hover:underline" onClick={() => {
            setReplyTo(p.id);
            setContent("");
          }}>Reply</button>
        </div>
        {/* Render replies indented */}
        <ul className="pl-6 mt-2">
          {replies.filter(r => r.parentId === p.id).map(renderReply)}
        </ul>
      </li>
    );
  };
  const renderReply = (p) => {
    let bubbleClass = "self-start bg-gray-50 border";
    return (
      <li key={p.id} className={`max-w-xs rounded px-3 py-2 text-sm shadow ${bubbleClass} mb-2`}>
        <div className="flex items-center gap-2">
          <span>
            {p.anonymous && p.author?.role === "citizen"
              ? "Anonymous"
              : p.author?.role === "representative"
                ? `Hon. ${p.author?.name}`
                : p.author?.name || ""}
          </span>
          {p.author?.role === "representative" && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-indigo-200 text-indigo-800">Representative</span>
          )}
        </div>
        <div className="mt-1">{p.content}</div>
        <div className="text-xs mt-1 opacity-70 text-right">{new Date(p.createdAt).toLocaleString()}</div>
      </li>
    );
  };
  return (
    <div>
      <button onClick={onBack} className="text-indigo-600 mb-2">← Back</button>
      <h2 className="text-lg font-bold mb-2">{thread.title}</h2>
      <ul className="flex flex-col space-y-2 mb-4">
        {topLevel.map(renderPost)}
        {topLevel.length === 0 && <p>No replies yet.</p>}
      </ul>
      {user && (
        <form onSubmit={submit} className="flex gap-2 items-center">
          {replyTo && (
            <div className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-2">
              Replying to a post
              <button className="ml-2 text-red-500" onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          )}
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Write a post..."}
            className="border flex-1 px-2 py-1"
            required
          />
          {user.role === "citizen" && (
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} />
              Post anonymously
            </label>
          )}
          <button className="bg-indigo-600 text-white px-4 rounded">Post</button>
        </form>
      )}
    </div>
  );
};

const Forums = () => {
  const [openThread, setOpenThread] = useState(null);
  const location = useLocation();

  // Open thread when hash present
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      if (id) setOpenThread(id);
    }
  }, [location.hash]);

  return openThread ? (
    <ThreadView id={openThread} onBack={() => {
      setOpenThread(null);
      window.history.replaceState({}, "", location.pathname); // remove hash
    }} />
  ) : (
    <ThreadList onOpen={setOpenThread} />
  );
};

export default Forums; 