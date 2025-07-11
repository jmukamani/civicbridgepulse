import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUser, getToken } from "../utils/auth.js";
import { formatDateTime } from "../utils/datetime.js";
import CountdownTimer from "../components/CountdownTimer.jsx";
import axios from "axios";
import ResourceCard from "../components/ResourceCard.jsx";
import { API_BASE } from "../utils/network.js";
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import documentStorage from "../utils/documentStorage.js";
import { DocumentIcon, CloudArrowDownIcon } from "@heroicons/react/24/outline";

// Convert snake_case status into "Title Case" with spaces
const formatStatus = (str) =>
  str
    ?.split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// StatCard component with optional onClick
const StatCard = ({ title, value, icon, note, onClick }) => (
  <div 
    className={`bg-white p-6 rounded-lg shadow flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xl">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {note && <p className="text-xs text-green-600 mt-1">{note}</p>}
    </div>
  </div>
);

const CitizenHome = () => {
  const user = getUser();
  const [issues, setIssues] = useState([]);
  const [polls, setPolls] = useState([]);
  const [threads, setThreads] = useState([]);
  const [events, setEvents] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [offlineStats, setOfflineStats] = useState({ count: 0, totalSizeMB: 0 });
  const online = useOnlineStatus();

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

        // Load offline document stats
        try {
          const stats = await documentStorage.getStorageStats();
          setOfflineStats(stats);
        } catch (error) {
          console.warn('Failed to load offline stats:', error);
        }

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-600">{online ? 'Online' : 'Offline'}</span>
        </div>
      </div>

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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Issues"
          value={issues.length}
          icon={<span>🔧</span>}
          note={`${issues.filter((i) => i.status === "resolved").length} resolved`}
        />
        <StatCard
          title="Active Polls"
          value={polls.length}
          icon={<span>📊</span>}
          note={polls.length ? (
            (() => {
              const nextPoll = polls.find(p => new Date(p.endsAt) > new Date());
              if (nextPoll) {
                const diffDays = Math.ceil((new Date(nextPoll.endsAt) - new Date()) / (1000 * 60 * 60 * 24));
                return `Next ends in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
              }
              return "no active polls";
            })()
          ) : (
            "none"
          )}
        />
        <StatCard
          title="Recent Discussions"
          value={threads.length}
          icon={<span>💬</span>}
          note={threads.length ? `${threads.filter((t) => new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week` : "none"}
        />
        
        {/* Offline Documents Card */}
        <StatCard
          title="Offline Documents"
          value={offlineStats.count}
          icon={<DocumentIcon className="h-5 w-5 text-indigo-600" />}
          note={offlineStats.count > 0 ? `${offlineStats.totalSizeMB} MB stored` : "No documents downloaded"}
          onClick={() => window.location.href = '/dashboard/policies'}
        />
      </div>
    </div>
  );
};

export default CitizenHome;
