import { useEffect, useState } from "react";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";
import ActionMenu from "../components/ActionMenu.jsx";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import { queueAction, generateId } from "../utils/db.js";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/network.js";

const defaultPoll = { question: "", options: ["", ""], multiple: false, opensAt: "", closesAt: "" };

const PollForm = ({ onCreated }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiple, setMultiple] = useState(false);

  const addOption = () => setOptions([...options, ""]);
  const handleOptionChange = (idx, val) => {
    const arr = [...options];
    arr[idx] = val;
    setOptions(arr);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/polls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ question, options: options.filter(Boolean), multiple }),
      });
      if (!res.ok) throw new Error("Failed");
      const poll = await res.json();
      onCreated && onCreated(poll);
      toast.success("Poll created");
      setQuestion("");
      setOptions(["", ""]);
      setMultiple(false);
    } catch (err) {
      toast.error("Could not create");
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-2 mb-6">
      <h2 className="font-bold">Create Poll</h2>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Question"
        required
        className="border px-2 py-1 w-full"
      />
      {options.map((opt, idx) => (
        <input
          key={idx}
          value={opt}
          onChange={(e) => handleOptionChange(idx, e.target.value)}
          placeholder={`Option ${idx + 1}`}
          required
          className="border px-2 py-1 w-full"
        />
      ))}
      <button type="button" onClick={addOption} className="text-sm text-indigo-600">
        + Add option
      </button>
      <div>
        <label>
          <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} /> Allow multiple
        </label>
      </div>
      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
        Create
      </button>
    </form>
  );
};

const PollCard = ({ poll, onVote, onEdit, onCreateDiscussion }) => {
  const user = getUser();
  const [selected, setSelected] = useState([]);
  const voted = poll.votes?.some((v)=>v.voterId===user.id);

  const toggle = (idx) => {
    if (poll.multiple) {
      setSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
    } else {
      setSelected([idx]);
    }
  };

  const deletePoll = async () => {
    if (!window.confirm("Delete this poll?")) return;
    try {
      await fetch(`${API_BASE}/api/polls/${poll.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      poll._onDeleted && poll._onDeleted();
    } catch (err) {
      toast.error("Could not delete poll");
    }
  };

  return (
    <div className="border rounded p-4 space-y-2 relative">
      <h3 className="font-semibold">{poll.question}</h3>
      {voted || user.role==='representative' ? (
        <div className="space-y-1">
          {poll.options.map((opt, idx)=>(
            <div key={idx} className="flex items-center gap-2">
              <div className="w-32">{opt}</div>
              <div className="flex-1 bg-gray-200 h-2 rounded">
                {(() => {
                  const count = poll.votesCount?.[idx] ?? 0;
                  const pct = (count / (poll.totalVotes || 1)) * 100;
                  return (
                    <div className="bg-indigo-600 h-2 rounded" style={{ width: `${pct}%` }} />
                  );
                })()}
              </div>
              <span className="text-xs">{poll.votesCount?.[idx] ?? 0}</span>
            </div>
          ))}
          {voted && <p className="text-xs text-green-700">You voted</p>}
        </div>
      ) : (
      <ul className="space-y-1">
        {poll.options.map((opt, idx) => (
          <li key={idx}>
            <label className="flex items-center gap-2">
              <input
                type={poll.multiple ? "checkbox" : "radio"}
                name={`poll-${poll.id}`}
                checked={selected.includes(idx)}
                onChange={() => toggle(idx)}
              />
              {opt}
            </label>
          </li>
        ))}
      </ul>)}
      {!voted && user.role==='citizen' && (
      <button
        className="bg-indigo-600 text-white px-2 py-1 rounded text-sm"
        onClick={() => onVote(poll.id, selected)}
        disabled={selected.length === 0}
      >
        Vote
      </button>)}
      {user.role==='representative' && (
        <div className="absolute top-2 right-2">
          <ActionMenu
            actions={[
              { label: "Edit", onClick: onEdit },
              poll.discussionThreadId
                ? {
                    label: "View Discussion",
                    onClick: () => {
                      onCreateDiscussion(poll, "view");
                    },
                  }
                : { label: "Create Discussion", onClick: onCreateDiscussion },
              {
                label: "Share",
                onClick: () => {
                  navigator.clipboard.writeText(`${window.location.origin}/dashboard/polls#${poll.id}`);
                  toast.success("Link copied");
                },
              },
              { label: "Delete", onClick: deletePoll },
            ]}
          />
        </div>
      )}
    </div>
  );
};

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const user = getUser();
  const [editPoll, setEditPoll] = useState(null);
  const [discussionModal, setDiscussionModal] = useState(null);
  const online = useOnlineStatus();
  const navigate = useNavigate();

  const fetchPolls = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const listRes = await axios.get(`${API_BASE}/api/polls`, { headers });
      const dets = await Promise.all(
        listRes.data.map(async (p) => {
          const d = await axios.get(`${API_BASE}/api/polls/${p.id}`, { headers }).then((r) => r.data);
          const counts = Array(p.options.length).fill(0);
          d.votes.forEach((v) => v.selected.forEach((i) => counts[i]++));
          d.votesCount = counts;
          d.totalVotes = d.votes.length;
          return d;
        })
      );
      setPolls(dets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const vote = async (id, selected) => {
    if (online) {
      try {
        await axios.post(
          `${API_BASE}/api/polls/${id}/vote`,
          { selected },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        toast.success("Vote submitted");
        fetchPolls();
      } catch (err) {
        toast.error("Could not vote");
      }
    } else {
      await queueAction({ id: generateId(), type: "pollVote", payload: { pollId: id, selected }, token: getToken() });
      toast.info("Vote queued for sync");
    }
  };

  const onCreated = (poll) => {
    poll.votes = [];
    poll.votesCount = Array(poll.options.length).fill(0);
    poll.totalVotes = 0;
    poll._onDeleted = () => setPolls(prev=>prev.filter(p=>p.id!==poll.id));
    setPolls((prev) => [poll, ...prev]);
  };

  const saveEdit = async () => {
    if (!editPoll) return;
    try {
      const payload = { ...editPoll };
      // Convert opensAt/closesAt to ISO if provided
      if (payload.opensAt) payload.opensAt = new Date(payload.opensAt);
      if (payload.closesAt) payload.closesAt = new Date(payload.closesAt);
      await fetch(`${API_BASE}/api/polls/${editPoll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      toast.success("Poll updated");
      setEditPoll(null);
      fetchPolls();
    } catch (err) {
      toast.error("Could not update");
    }
  };

  const createDiscussion = async (poll, mode = "create") => {
    const threadId = poll.discussionThreadId;
    if (mode === "view" && threadId) {
      navigate(`/dashboard/forums#${threadId}`);
      return;
    }

    // Open modal for editing
    // Prepare default summary content
    const lines = poll.options
      .map((opt, i) => `- ${opt}: ${poll.votesCount?.[i] ?? 0} votes`)
      .join("\n");
    const defaultContent = `Poll Results for **${poll.question}**\n\n${lines}`;
    setDiscussionModal({ poll, title: poll.question, content: defaultContent });
  };

  const submitDiscussion = async () => {
    const { poll, title, content } = discussionModal;
    try {
      const res = await fetch(`${API_BASE}/api/polls/${poll.id}/discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed");
      const thread = await res.json();
      toast.success("Discussion created");
      setPolls((prev) => prev.map((p) => (p.id === poll.id ? { ...p, discussionThreadId: thread.id } : p)));
      setDiscussionModal(null);
      navigate(`/dashboard/forums#${thread.id}`);
    } catch (err) {
      toast.error(err.message || "Could not create discussion");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Active Polls</h2>
      <div className="space-y-4">
        {polls.map((poll) => {
          poll._onDeleted = () => setPolls(prev=>prev.filter(p=>p.id!==poll.id));
          return (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={vote}
              onEdit={() => setEditPoll({ ...poll, opensAt: poll.opensAt ? poll.opensAt.split("T")[0] : "", closesAt: poll.closesAt ? poll.closesAt.split("T")[0] : "" })}
              onCreateDiscussion={() => createDiscussion(poll)}
            />
          );
        })}
        {polls.length === 0 && <p>No polls available</p>}
      </div>

      {/* Edit Modal */}
      {editPoll && (
        <Dialog open={true} onClose={() => setEditPoll(null)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white max-w-lg w-full p-6 rounded shadow-lg relative z-10 space-y-3">
              <h3 className="text-lg font-semibold">Edit Poll</h3>
              <input className="border w-full px-3 py-2 rounded" value={editPoll.question} onChange={(e)=>setEditPoll({...editPoll, question:e.target.value})} />
              {editPoll.options.map((opt, idx)=> (
                <input key={idx} className="border w-full px-3 py-2 rounded" value={opt} onChange={(e)=>{
                  const arr=[...editPoll.options]; arr[idx]=e.target.value; setEditPoll({...editPoll, options:arr}); }} />
              ))}
              <button className="text-xs text-indigo-600" onClick={()=>setEditPoll({...editPoll, options:[...editPoll.options, ""]})}>+ Add option</button>
              <label className="block"><input type="checkbox" checked={editPoll.multiple} onChange={(e)=>setEditPoll({...editPoll, multiple:e.target.checked})}/> Allow multiple</label>
              <div className="flex gap-2">
                <div>
                  <label className="text-xs">Opens</label>
                  <input type="date" value={editPoll.opensAt} onChange={(e)=>setEditPoll({...editPoll, opensAt:e.target.value})} className="border px-2 py-1" />
                </div>
                <div>
                  <label className="text-xs">Closes</label>
                  <input type="date" value={editPoll.closesAt} onChange={(e)=>setEditPoll({...editPoll, closesAt:e.target.value})} className="border px-2 py-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setEditPoll(null)}>Cancel</button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {user.role === "representative" && <PollForm onCreated={onCreated} />}

      {/* Discussion Modal */}
      {discussionModal && (
        <Dialog open={true} onClose={() => setDiscussionModal(null)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white max-w-lg w-full p-6 rounded shadow-lg relative z-10 space-y-3">
              <h3 className="text-lg font-semibold">Create Discussion</h3>
              <input
                className="border w-full px-3 py-2 rounded"
                value={discussionModal.title}
                onChange={(e) => setDiscussionModal({ ...discussionModal, title: e.target.value })}
              />
              <textarea
                rows="6"
                className="border w-full px-3 py-2 rounded whitespace-pre-wrap font-mono text-sm"
                value={discussionModal.content}
                onChange={(e) => setDiscussionModal({ ...discussionModal, content: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setDiscussionModal(null)}>
                  Cancel
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={submitDiscussion}>
                  Post Discussion
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Polls; 