import { useEffect, useState } from "react";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

const NewThreadForm = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/forums/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed");
      const thread = await res.json();
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
    const res = await fetch(`${API_BASE}/api/forums/threads`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    setThreads(data);
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
            {th.title}
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
  const user = getUser();
  const fetchThread = async () => {
    const res = await fetch(`${API_BASE}/api/forums/threads/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    setThread(data);
  };
  useEffect(() => { fetchThread(); }, [id]);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/forums/threads/${id}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      const post = await res.json();
      setThread((prev) => ({ ...prev, posts: [...prev.posts, post] }));
      setContent("");
    } catch (err) {
      toast.error("Could not post");
    }
  };
  if (!thread) return <p>Loading...</p>;
  return (
    <div>
      <button onClick={onBack} className="text-indigo-600 mb-2">← Back</button>
      <h2 className="text-lg font-bold mb-2">{thread.title}</h2>
      <ul className="space-y-2 mb-4">
        {thread.posts?.map((p) => (
          <li key={p.id} className="border p-2 rounded">
            {p.content}
          </li>
        ))}
        {thread.posts?.length === 0 && <p>No replies yet.</p>}
      </ul>
      {user && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a reply"
            className="border flex-1 px-2 py-1"
            required
          />
          <button className="bg-indigo-600 text-white px-4 rounded">Post</button>
        </form>
      )}
    </div>
  );
};

const Forums = () => {
  const [openThread, setOpenThread] = useState(null);
  return openThread ? (
    <ThreadView id={openThread} onBack={() => setOpenThread(null)} />
  ) : (
    <ThreadList onOpen={setOpenThread} />
  );
};

export default Forums; 