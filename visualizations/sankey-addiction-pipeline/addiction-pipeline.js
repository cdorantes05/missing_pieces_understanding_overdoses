// ===============================================
// SANKEY FLOW DIAGRAM
// The Addiction Pipeline: From Prescription to Outcome
// ===============================================

(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSankey);
  } else {
    initSankey();
  }

  function initSankey() {
    const container = document.getElementById('sankey-addiction-flow');
    if (!container) {
      console.error('Sankey container not found');
      return;
    }

    const width = Math.min(container.clientWidth, 1200);
    const height = 600;
    const margin = { top: 30, right: 40, bottom: 30, left: 40 };

    // Create SVG
    const svg = d3.select("#sankey-addiction-flow")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      //.text("The Prescription Opioid Misuse Pipeline (millions of people)");

    // Real data from SAMHSA/NSDUH
    const data = {
      nodes: [
        { name: "New prescription pain reliever misusers (entry)", shortName: "New Misusers", id: 0, stage: 0 },
        { name: "Continuing prescription pain reliever misusers", shortName: "Continuing Misusers", id: 1, stage: 0 },
        { name: "Past-year prescription pain reliever misusers", shortName: "Past-Year Misusers", id: 2, stage: 1 },
        { name: "Past-year prescription opioid misusers", shortName: "Opioid Misusers", id: 3, stage: 2 },
        { name: "Other prescription pain reliever misusers (non-opioid)", shortName: "Non-Opioid", id: 4, stage: 2 },
        { name: "Opioid Use Disorder (OUD)", shortName: "OUD", id: 5, stage: 3 },
        { name: "Opioid misuse without OUD", shortName: "Misuse (No OUD)", id: 6, stage: 3 },
        { name: "Received MOUD (meds for opioid use disorder)", shortName: "Received MOUD", id: 7, stage: 4 },
        { name: "Did not receive MOUD", shortName: "No MOUD", id: 8, stage: 4 }
      ],
      links: [
        { source: 0, target: 2, value: 1.522 },
        { source: 1, target: 2, value: 6.478 },
        { source: 2, target: 3, value: 7.6 },
        { source: 2, target: 4, value: 0.4 },
        { source: 3, target: 5, value: 4.8 },
        { source: 3, target: 6, value: 3.0 },
        { source: 5, target: 7, value: 0.818 },
        { source: 5, target: 8, value: 3.982 }
      ]
    };

    // Color scale by stage
    const colorScale = d3.scaleOrdinal()
      .domain([0, 1, 2, 3, 4])
      .range([
        "#3b82f6", // Entry - Blue
        "#8b5cf6", // Misuse - Purple
        "#f59e0b", // Opioid classification - Orange
        "#ef4444", // OUD - Red
        "#10b981"  // Treatment - Green
      ]);

    // Node color function
    function nodeColor(d) {
      if (d.name.includes("MOUD") || d.name.includes("Received")) return "#10b981";
      if (d.name.includes("Did not receive")) return "#dc2626";
      if (d.name.includes("OUD")) return "#ef4444";
      return colorScale(d.stage);
    }

    // Create Sankey generator
    const sankey = d3.sankey()
      .nodeId(d => d.id)
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    // Generate the Sankey layout
    const { nodes, links } = sankey({
      nodes: data.nodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d))
    });

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "sankey-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "linear-gradient(135deg, rgba(26, 29, 58, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%)")
      .style("color", "white")
      .style("padding", "12px 18px")
      .style("border-radius", "10px")
      .style("border", "1px solid rgba(139, 92, 246, 0.3)")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 8px 32px rgba(0, 0, 0, 0.5)");

    // Draw links
    const link = svg.append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", d => {
        const sourceNode = nodes[d.source.index];
        return nodeColor(sourceNode);
      })
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.4)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("opacity", 0.7)
          .attr("stroke-width", d => Math.max(1, d.width) + 2);

        tooltip
          .style("visibility", "visible")
          .html(`
            <strong>${d.source.name}</strong> → <strong>${d.target.name}</strong><br/>
            <span style="color: #8b5cf6;">${d.value} million</span> people in this pathway
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("opacity", 0.4)
          .attr("stroke-width", d => Math.max(1, d.width));

        tooltip.style("visibility", "hidden");
      });

    // Draw nodes
    const node = svg.append("g")
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", nodeColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("opacity", 0.8)
          .attr("stroke-width", 3);

        tooltip
          .style("visibility", "visible")
          .html(`
            <strong style="font-size: 16px;">${d.name}</strong><br/>
            <span style="color: #8b5cf6;">Stage ${d.stage + 1}</span><br/>
            <span>${d.value.toFixed(2)} million people</span>
          `);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke-width", 2);

        tooltip.style("visibility", "hidden");
      });

    // Node labels
    svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text(d => d.shortName)
      .style("pointer-events", "none");

    // Stage labels
    const stages = ["Entry", "Past-Year Misuse", "Classification", "Disorder Status", "Treatment"];
    const stagePositions = [80, 280, 480, 680, 880];

    svg.append("g")
      .selectAll("text")
      .data(stages)
      .join("text")
      .attr("x", (d, i) => stagePositions[i])
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255, 255, 255, 0.5)")
      .attr("font-size", "11px")
      .attr("font-style", "italic")
      .text(d => d);

    console.log('Sankey diagram initialized!');
  }
})();