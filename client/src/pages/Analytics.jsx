import { useEffect, useState } from "react";
import { getToken } from "../utils/auth.js";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "react-toastify";
import ActionMenu from "../components/ActionMenu.jsx";
import { API_BASE } from "../utils/network.js";

const Analytics = () => {
  const [data, setData] = useState([]);
  const [pollData, setPollData] = useState([]);
  const [issueData, setIssueData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${getToken()}` };
        const [polRes, pollsRes, issRes] = await Promise.all([
          axios.get(`${API_BASE}/api/analytics/policies`, { headers }),
          axios.get(`${API_BASE}/api/analytics/polls`, { headers }),
          axios.get(`${API_BASE}/api/analytics/issues`, { headers }),
        ]);
        setData(polRes.data);
        setPollData(pollsRes.data);
        setIssueData(issRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Could not load analytics");
      }
    };
    load();
  }, []);

  const downloadCSV = () => {
    const headers = ["title", "views", "comments"];
    const rows = data.map((d) => [d.title, d.views, d.comments]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "policy_engagement.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPollCSV = () => {
    const headers = ["question", "totalVotes"];
    const rows = pollData.map(p => [p.question, p.totalVotes]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "poll_participation.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadIssueCSV = () => {
    const csv =
      "metric,value\n" +
      `open,${issueData.open}\nresolved,${issueData.resolved}\nblocked,${issueData.blocked}\n` +
      `avgResponseHours,${issueData.avgResponseHours}\navgResolveHours,${issueData.avgResolveHours}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "issue_kpis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ["#10b981", "#fbbf24", "#ef4444"];

  // Produce compact label: up to 3 significant words (excluding common stop-words)
  const stopWords = new Set(["the","a","an","of","in","on","for","to","and","or","by","with","at","from","is","are","as","that"]);
  const compactLabel = (sentence) => {
    if (!sentence) return "";
    const words = sentence.split(/\s+/).filter((w) => w && !stopWords.has(w.toLowerCase()));
    const selected = words.slice(0, 3).join(" ");
    return selected + (words.length > 3 ? "…" : "");
  };

  // Combined export handler
  const downloadAll = () => {
    downloadCSV();
    if (pollData.length) downloadPollCSV();
    if (issueData) downloadIssueCSV();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Policy Engagement Analytics</h2>
        <ActionMenu
          buttonClass="bg-indigo-600 text-white"
          actions={[
            { label: "Export All CSVs", onClick: downloadAll },
            { label: "Export Policy CSV", onClick: downloadCSV },
            { label: "Export Polls CSV", onClick: downloadPollCSV },
            { label: "Export Issues CSV", onClick: downloadIssueCSV },
          ]}
        />
      </div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <XAxis
              dataKey="title"
              tick={false}
              axisLine={true}
              tickLine={false}
              height={10}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" stackId="a" fill="#6366f1" name="Views" />
            <Bar dataKey="comments" stackId="a" fill="#10b981" name="Comments" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No data yet.</p>
      )}

      {/* Poll Participation */}
      {!!pollData.length && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Poll Participation</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pollData.map(p => ({ question: p.question, votes: p.totalVotes }))} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <XAxis
                dataKey="question"
                tick={false}
                axisLine={true}
                tickLine={false}
                height={10}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="votes" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Issue KPIs */}
      {issueData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Issue Status Breakdown</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Open", value: issueData.open },
                  { name: "Resolved", value: issueData.resolved },
                  { name: "Blocked", value: issueData.blocked },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {COLORS.map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600">Avg Response Time: {issueData.avgResponseHours.toFixed(1)} hrs | Avg Resolve Time: {issueData.avgResolveHours.toFixed(1)} hrs</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
