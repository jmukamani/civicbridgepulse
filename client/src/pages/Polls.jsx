import { useEffect, useState } from "react";
import { getToken, getUser } from "../utils/auth.js";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

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

const PollCard = ({ poll, onVote }) => {
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
    <div className="border rounded p-4 space-y-2">
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
          <p className="text-xs text-green-700">{voted?"You voted":"Results"}</p>
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
        <button onClick={deletePoll} className="text-red-600 text-xs ml-2">Delete</button>
      )}
    </div>
  );
};

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const user = getUser();

  const fetchPolls = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/polls`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const list = await res.json();
      const dets = await Promise.all(list.map(async p=>{
        const d = await fetch(`${API_BASE}/api/polls/${p.id}`, { headers: { Authorization: `Bearer ${getToken()}` } }).then(r=>r.json());
        // compute counts
        const counts=Array(p.options.length).fill(0);
        d.votes.forEach(v=>v.selected.forEach(i=>counts[i]++));
        d.votesCount=counts; d.totalVotes=d.votes.length;
        return d;
      }));
      setPolls(dets);
    } catch (err) {}
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const vote = async (id, selected) => {
    try {
      await fetch(`${API_BASE}/api/polls/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ selected }),
      });
      toast.success("Vote cast");
    } catch (err) {
      toast.error("Could not vote");
    }
  };

  const onCreated = (poll) => {
    poll.votes = [];
    poll.votesCount = Array(poll.options.length).fill(0);
    poll.totalVotes = 0;
    poll._onDeleted = () => setPolls(prev=>prev.filter(p=>p.id!==poll.id));
    setPolls((prev) => [poll, ...prev]);
  };

  return (
    <div className="space-y-4">
      {user.role === "representative" && <PollForm onCreated={onCreated} />}
      <h2 className="text-lg font-bold">Active Polls</h2>
      <div className="space-y-4">
        {polls.map((poll) => {
          poll._onDeleted = () => setPolls(prev=>prev.filter(p=>p.id!==poll.id));
          return <PollCard key={poll.id} poll={poll} onVote={vote} />;
        })}
        {polls.length === 0 && <p>No polls available</p>}
      </div>
    </div>
  );
};

export default Polls; 