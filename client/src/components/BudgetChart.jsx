import { useRef, useEffect } from "react";
import * as d3 from "d3";

const BudgetChart = ({ data }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data) return;
    const entries = Object.entries(data);
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(ref.current)
      .html("")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(entries.map((d) => d[0]))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(entries, (d) => d[1])])
      .nice()
      .range([height, 0]);

    svg
      .selectAll("rect")
      .data(entries)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d[0]))
      .attr("y", (d) => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d[1]))
      .attr("fill", "#4f46e5");

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y).ticks(5));
  }, [data]);

  return <div ref={ref} />;
};

export default BudgetChart; 