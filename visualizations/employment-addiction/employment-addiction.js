// =====================
// Inject CSS Styles
// =====================
const style = document.createElement("style");
style.textContent = `
  .icon-chart-container {
    max-width: 90%;
    margin: 0 auto;
    background: transparent;
    padding: 12px;
    font-family: system-ui, sans-serif;
    color: #f5f5f7;
    overflow: visible;
  }

  .sort-toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
    justify-content: flex-start;
  }

  .sort-btn {
    padding: 6px 14px;
    border-radius: 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.18);
    color: #e5e5f0;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .sort-btn.active {
    background: #f59e0b;
    color: #111;
    border-color: #fbbf24;
    font-weight: 700;
  }

  .sort-btn:hover {
    background: rgba(255,255,255,0.12);
  }

  .legend-text {
    font-size: 16px;
    color: #c2c2d6;
    margin-left: 4px;
    margin-bottom: 4px;
  }

  svg {
    width: 100%;
    overflow: visible;
  }

  .row-label {
    font-size: 28px;
    fill: #e5e5f0;
  }

  .row-subtext {
    font-size: 24px;
    fill: #9ba0c7;
  }

  .person circle { fill: #6b7280; stroke: #374151; stroke-width: 1; }
  .person rect { fill: #6b7280; stroke: #374151; stroke-width: 1; }

  .person.highlight circle,
  .person.highlight rect {
    fill: #f59e0b;
    stroke: #b45309;
    stroke-width: 2;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }

  .tooltip {
    position: absolute;
    pointer-events: none;
    padding: 8px 10px;
    background: rgba(12, 16, 32, 0.95);
    color: #fff;
    border-radius: 8px;
    font-size: 16px;
    border: 1px solid #40476b;
    opacity: 0;
    transition: opacity 0.1s ease-out;
    white-space: nowrap;
    z-index: 10;
  }
`;
document.head.appendChild(style);

// =====================
// Main D3 Visualization
// =====================
function renderIndustryIconsChart(targetId) {
  // ==========================
  // DATA — including "hours"
  // ==========================
  const data = [
    { industry: "Accommodation / Food Service", denominator: 5, percent: 20, ratioLabel: "1 out of 5 people", workers: 14749400, wage: 20.22, hours: 42.9 },
    { industry: "Arts / Entertainment / Recreation", denominator: 6, percent: 16.7, ratioLabel: "1 out of 6 people", workers: 2755000, wage: 20.94, hours: 29.4 },
    { industry: "Construction", denominator: 7, percent: 14.3, ratioLabel: "1 out of 7 people", workers: 10500000, wage: 21.78, hours: 39.8 },
    { industry: "Fishing, Farming, Forestry", denominator: 8, percent: 12.5, ratioLabel: "1 out of 8 people", workers: 1530000, wage: 26, hours: 40 },
    { industry: "Healthcare (support roles)", denominator: 10, percent: 10, ratioLabel: "1 out of 10 people", workers: 7060000, wage: 17.38, hours: 36.2 }
  ];

  // ===============
  // HTML container
  // ===============
  const container = document.getElementById(targetId);
  container.classList.add("icon-chart-container");

  container.innerHTML = `
  <p class="legend-text">Ranking Mode:</p>
  <div class="sort-toolbar">
    <button class="sort-btn active" data-sort="drug">Default: Drug Use</button>
    <button class="sort-btn" data-sort="workers">Number of Workers</button>
    <button class="sort-btn" data-sort="wage">Average Hourly Wage</button>
    <button class="sort-btn" data-sort="hours">Hours Worked per Week</button>
  </div>

  <div class="chart-wrapper">
    <svg id="industryIconSvg"></svg>

    <!-- NEW RIGHT-SIDE LEGEND -->
    <div class="vertical-rank-legend">
      <span class="rank-high">Highest</span>
      <div class="rank-line"></div>
      <span class="rank-low">Lowest</span>
    </div>
  </div>

  <p class="icon-chart-subtitle">Each row shows <strong>1 person out of N</strong> workers reporting substance use.</p>

  <div id="industryTooltip" class="tooltip"></div>
`;


  const svg = d3.select("#industryIconSvg");
  const tooltip = d3.select("#industryTooltip");

  const margin = { top: 20, right: 320, bottom: 40, left: 440 };
  const rowHeight = 120;
  const width = 1800;
  let height = margin.top + margin.bottom + rowHeight * data.length;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  // =====================================
  // INITIAL ROW DRAW
  // =====================================
  let rows = svg.selectAll(".row")
    .data(data, d => d.industry)
    .enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", (d, i) => `translate(0, ${margin.top + i * rowHeight})`);

  // ---- LABELS
  rows.append("text")
    .attr("class", "row-label")
    .attr("x", margin.left - 30)
    .attr("y", rowHeight / 2 - 12)
    .attr("text-anchor", "end")
    .text(d => d.industry);

  rows.append("text")
    .attr("class", "row-subtext")
    .attr("x", margin.left - 30)
    .attr("y", rowHeight / 2 + 24)
    .attr("text-anchor", "end")
    .text(d => `${d.ratioLabel} (${d.percent}%)`);

  // ---- ICONS
  rows.each(function (rowData) {
    const row = d3.select(this);

    const icons = d3.range(rowData.denominator).map(i => ({
      index: i,
      highlighted: i === rowData.denominator - 1,
      parent: rowData
    }));

    const groups = row.selectAll(".person")
      .data(icons)
      .enter()
      .append("g")
      .attr("class", d => "person" + (d.highlighted ? " highlight" : ""))
      .attr("transform", d => {
        const x = margin.left + d.index * 100;
        const y = rowHeight / 2 - 32;
        return `translate(${x}, ${y})`;
      })
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(
            d.highlighted
              ? `${d.parent.industry}: ${d.parent.ratioLabel} (${d.parent.percent}%)`
              : `Other workers in ${d.parent.industry}`
          )
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", event => {
        tooltip.style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // HEAD
    groups.append("circle")
      .attr("cx", 32)
      .attr("cy", 17)
      .attr("r", 16);

    // BODY
    groups.append("rect")
      .attr("x", 20)
      .attr("y", 34)
      .attr("width", 24)
      .attr("height", 30)
      .attr("rx", 6);
  });

  // ===============================
  // SORTING LOGIC — NOW 4 OPTIONS
  // ===============================
  function sortRows(mode) {
    let sorted;

    if (mode === "drug") {
      sorted = [...data].sort((a, b) => d3.descending(a.percent, b.percent));
    } else if (mode === "workers") {
      sorted = [...data].sort((a, b) => d3.descending(a.workers, b.workers));
    } else if (mode === "wage") {
      sorted = [...data].sort((a, b) => d3.descending(a.wage, b.wage));
    } else if (mode === "hours") {
      sorted = [...data].sort((a, b) => d3.descending(a.hours, b.hours));
    }

    rows.data(sorted, d => d.industry)
      .transition()
      .duration(700)
      .attr("transform", (d, i) => `translate(0, ${margin.top + i * rowHeight})`);
  }

  // ===============================
  // BUTTON CLICK HANDLERS
  // ===============================
  const buttons = container.querySelectorAll(".sort-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const mode = btn.dataset.sort;
      sortRows(mode);
    });
  });

  sortRows("drug"); // initial state
}

// =====================
// Auto-render
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const autoTarget = document.getElementById("industryIcons");
  if (autoTarget) renderIndustryIconsChart("industryIcons");
});
