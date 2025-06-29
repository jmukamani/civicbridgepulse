import { useEffect, useState, useRef } from "react";
import { getToken, getUser } from "../utils/auth.js";
import * as d3 from "d3";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000";

const Analytics = () => {
  const [data, setData] = useState(null);
  const chartRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Failed to load analytics");
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!data) return;
    // Draw simple bar chart for engagement counts
    const counts = [
      { label: "Citizens", value: data.users.citizens },
      { label: "Representatives", value: data.users.representatives },
      { label: "Issues", value: data.issues.total },
      { label: "Poll Votes", value: data.polls.votes },
      { label: "Forum Posts", value: data.forums.posts },
    ];
    const width = 400;
    const height = 200;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
    const svg = d3
      .select(chartRef.current)
      .html("")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);
    const x = d3
      .scaleBand()
      .domain(counts.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(counts, (d) => d.value) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
    svg
      .append("g")
      .selectAll("rect")
      .data(counts)
      .join("rect")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", "#6366f1");
  }, [data]);

  const exportIssues = () => {
    window.location.href = `${API_BASE}/api/analytics/export/issues?token=${getToken()}`;
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Total Users</h3>
          <p className="text-3xl font-bold">{data.users.total}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Issues Resolved</h3>
          <p className="text-3xl font-bold">{data.issues.resolved}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Avg Reply Time (s)</h3>
          <p className="text-3xl font-bold">{data.messages.avgReplySeconds}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div ref={chartRef} className="bg-white p-4 rounded shadow overflow-auto"></div>

      <button onClick={exportIssues} className="bg-indigo-600 text-white px-4 py-2 rounded">
        Export Issues CSV
      </button>
    </div>
  );
};

export default Analytics;
