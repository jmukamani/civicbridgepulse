import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUser, getToken } from "../utils/auth.js";
import { formatDateTime } from "../utils/datetime.js";
import CountdownTimer from "../components/CountdownTimer.jsx";
import axios from "axios";
import ResourceCard from "../components/ResourceCard.jsx";

const API_BASE = "http://localhost:5000";

// Convert snake_case status into "Title Case" with spaces
const formatStatus = (str) =>
  str
    ?.split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const CitizenHome = () => {
  const user = getUser();
  const [issues, setIssues] = useState([]);
  const [polls, setPolls] = useState([]);
  const [threads, setThreads] = useState([]);
  const [events, setEvents] = useState([]);
  const [recentResources, setRecentResources] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const tokenHeader = { headers: { Authorization: `Bearer ${getToken()}` } };
        // Issues
        const iss = await axios.get(`${API_BASE}/api/issues`, tokenHeader);
        setIssues(iss.data);
        // Polls list with votes included
        const ps = await axios.get(`${API_BASE}/api/polls`, tokenHeader);
        const pollsVoted = [];
        for (const p of ps.data) {
          const detail = await axios.get(`${API_BASE}/api/polls/${p.id}`, tokenHeader);
          if (detail.data.votes?.some((v) => v.voterId === user.id)) {
            pollsVoted.push(detail.data);
          }
        }
        setPolls(pollsVoted);
        // Forum threads authored or replied
        const th = await axios.get(`${API_BASE}/api/forums/threads`, tokenHeader);
        const myThreads = th.data.filter((t) => t.createdBy === user.id);
        setThreads(myThreads);

        // Events
        const ev = await axios.get(`${API_BASE}/api/events`, tokenHeader);
        const evSorted = [...ev.data].sort((a,b) => new Date(a.date) - new Date(b.date));
        setEvents(evSorted);

        const resRecent = await axios.get(`${API_BASE}/api/resources?recent=true`, tokenHeader);
        setRecentResources(resRecent.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [user?.id]);

  const civicScore = issues.length + polls.length + threads.length;

  // Days until the next upcoming event
  const nextEventDays = (() => {
    const upcoming = events.find((ev) => new Date(ev.date) > new Date());
    if (!upcoming) return null;
    const diff = Math.ceil((new Date(upcoming.date) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  })();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="issues" className="bg-yellow-500 text-white p-4 rounded text-center font-semibold">
          Report Issue
        </Link>
        <Link to="polls" className="bg-indigo-600 text-white p-4 rounded text-center font-semibold">
          Participate in Poll
        </Link>
        <Link to="forums" className="bg-teal-600 text-white p-4 rounded text-center font-semibold">
          Join Community Discussion
        </Link>
      </div>

      {/* My Civic Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Issues I've Reported</h3>
          <ul className="space-y-1 text-sm max-h-32 overflow-auto">
            {issues.map((i) => (
              <li key={i.id}>
                {i.title} — <span className="italic">{formatStatus(i.status)}</span>
              </li>
            ))}
            {issues.length === 0 && <p>No issues yet.</p>}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Polls Participated</h3>
          <p className="text-3xl font-bold text-indigo-600">{polls.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Discussions Joined</h3>
          <p className="text-3xl font-bold text-teal-600">{threads.length}</p>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="font-semibold">Upcoming Events</h3>
          {nextEventDays !== null && (
            <p className="flex items-center gap-1 text-yellow-600 text-sm">
              <span>⏰</span> Next in {nextEventDays} day{nextEventDays === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <ul className="space-y-1 text-sm max-h-40 overflow-auto">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center gap-2">
              <span>{formatDateTime(ev.date)}</span>
              <CountdownTimer date={ev.date} />
              <span>– {ev.title}</span>
            </li>
          ))}
          {events.length === 0 && <p>No events scheduled.</p>}
        </ul>
      </div>

      {/* Recent Resources */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Recently Accessed Resources</h3>
        <ul className="space-y-2 text-sm max-h-40 overflow-auto">
          {recentResources.map((r) => (
            <li key={r.id} className="flex justify-between items-center">
              <a href={r.externalUrl || r.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline truncate">
                {r.title}
              </a>
            </li>
          ))}
          {recentResources.length === 0 && <p>No recent resources.</p>}
        </ul>
      </div>

      {/* Civic Score */}
      <div className="bg-white p-4 rounded shadow text-center">
        <h3 className="font-semibold mb-2">Civic Score</h3>
        <p className="text-5xl font-bold text-green-600">{civicScore}</p>
        <p className="text-sm text-gray-500">Engagement level indicator</p>
      </div>
    </div>
  );
};

export default CitizenHome;
