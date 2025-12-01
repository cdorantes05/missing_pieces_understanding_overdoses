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

  .icon-chart-title {
    display: none;
  }

  .icon-chart-subtitle {
    margin-top: 5px;
    margin-bottom: 0;
    color: #c2c2d6;
    font-size: 14px;
    text-align: center;
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

  .person { cursor: default; }
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
  const data = [
    { industry: "Accommodation / Food Service", denominator: 5, percent: 20, ratioLabel: "1 out of 5 people" },
    { industry: "Arts / Entertainment / Recreation", denominator: 6, percent: 16.7, ratioLabel: "1 out of 6 people" },
    { industry: "Construction", denominator: 7, percent: 14.3, ratioLabel: "1 out of 7 people" },
    { industry: "Fishing, Farming, Forestry", denominator: 8, percent: 12.5, ratioLabel: "1 out of 8 people" },
    { industry: "Healthcare (support roles)", denominator: 10, percent: 10, ratioLabel: "1 out of 10 people" }
  ];

  // Create container
  const container = document.getElementById(targetId);
  container.classList.add("icon-chart-container");

  container.innerHTML = `
    <h1 class="icon-chart-title">Industries with Higher Reported Substance Use</h1>
    <svg id="industryIconSvg"></svg>
    <p class="icon-chart-subtitle">Each row shows <strong>1 person out of N</strong> workers reporting substance use.</p>
    <div id="industryTooltip" class="tooltip"></div>
  `;

  const svg = d3.select("#industryIconSvg");
  const tooltip = d3.select("#industryTooltip");

  const margin = { top: 20, right: 320, bottom: 40, left: 440 };
  const rowHeight = 120;
  const width = 1800;
  const height = margin.top + margin.bottom + rowHeight * data.length;

  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const iconSize = 64;
  const iconGap = 48;

  // Create rows
  const rows = svg.selectAll(".row")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", (d, i) => `translate(0, ${margin.top + i * rowHeight})`);

  // Labels
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

  // Draw icons
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
        const x = margin.left + d.index * (iconSize + iconGap);
        const y = rowHeight / 2 - iconSize / 2;
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

    // Person icon shapes - more human-like
    const headRadius = iconSize * 0.25;
    const bodyWidth = iconSize * 0.4;
    const bodyHeight = iconSize * 0.5;
    const armWidth = iconSize * 0.12;
    const armLength = iconSize * 0.35;
    const legWidth = iconSize * 0.14;
    const legLength = iconSize * 0.45;

    // Head
    groups.append("circle")
      .attr("cx", iconSize / 2)
      .attr("cy", headRadius + 1)
      .attr("r", headRadius);

    // Body
    groups.append("rect")
      .attr("x", iconSize / 2 - bodyWidth / 2)
      .attr("y", headRadius * 2 + 2)
      .attr("width", bodyWidth)
      .attr("height", bodyHeight)
      .attr("rx", bodyWidth * 0.25);

    // Left arm
    groups.append("rect")
      .attr("x", iconSize / 2 - bodyWidth / 2 - armWidth * 0.5)
      .attr("y", headRadius * 2 + 3)
      .attr("width", armWidth)
      .attr("height", armLength)
      .attr("rx", armWidth * 0.5)
      .attr("transform", `rotate(20 ${iconSize / 2 - bodyWidth / 2} ${headRadius * 2 + 3})`);

    // Right arm
    groups.append("rect")
      .attr("x", iconSize / 2 + bodyWidth / 2 - armWidth * 0.5)
      .attr("y", headRadius * 2 + 3)
      .attr("width", armWidth)
      .attr("height", armLength)
      .attr("rx", armWidth * 0.5)
      .attr("transform", `rotate(-20 ${iconSize / 2 + bodyWidth / 2} ${headRadius * 2 + 3})`);

    // Left leg
    groups.append("rect")
      .attr("x", iconSize / 2 - bodyWidth / 2 + legWidth * 0.3)
      .attr("y", headRadius * 2 + bodyHeight + 2)
      .attr("width", legWidth)
      .attr("height", legLength)
      .attr("rx", legWidth * 0.4);

    // Right leg
    groups.append("rect")
      .attr("x", iconSize / 2 + bodyWidth / 2 - legWidth * 1.3)
      .attr("y", headRadius * 2 + bodyHeight + 2)
      .attr("width", legWidth)
      .attr("height", legLength)
      .attr("rx", legWidth * 0.4);
  });
}

// =====================
// Auto-render if #industryIcons exists
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const autoTarget = document.getElementById("industryIcons");
  if (autoTarget) renderIndustryIconsChart("industryIcons");
});
