// Drug overdose bubble chart visualization - Properly centered version
(function() {
  'use strict';
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBubbleChart);
  } else {
    initBubbleChart();
  }
  
  function initBubbleChart() {
    console.log("Initializing drug bubble chart...");
    
    // Check if container exists
    const container = document.getElementById('drug-bubble-chart');
    if (!container) {
      console.error("Container #drug-bubble-chart not found!");
      return;
    }
    
    // Get container dimensions for responsive sizing
    const containerWidth = container.clientWidth;
    const margin = { top: 10, right: 20, bottom: 20, left: 20 }; // Reduced top margin
    const width = Math.min(containerWidth - 40, 900) - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom; // Slightly reduced height

    // Sample data for different drugs
    const drugData = {
      fatal: [
        { name: "Fentanyl", deaths: 73838, info: "Synthetic opioid 50-100x stronger than morphine. Leading cause of overdose deaths.", color: "#8B0000" },
        { name: "Heroin", deaths: 13165, info: "Illegal opioid derived from morphine. Often mixed with fentanyl.", color: "#B22222" },
        { name: "Cocaine", deaths: 24486, info: "Powerful stimulant. Often combined with opioids in overdoses.", color: "#DC143C" },
        { name: "Methamphetamine", deaths: 34833, info: "Highly addictive stimulant. Increasing role in overdose deaths.", color: "#FF4500" },
        { name: "Prescription Opioids", deaths: 16706, info: "Includes oxycodone, hydrocodone. Gateway to stronger opioids.", color: "#CD5C5C" },
        { name: "Benzodiazepines", deaths: 12499, info: "Sedatives often involved in poly-drug overdoses.", color: "#FF6347" },
        { name: "Synthetic Cannabinoids", deaths: 164, info: "Lab-made compounds that mimic THC. Unpredictable effects.", color: "#FF7F50" },
        { name: "Alcohol", deaths: 2221, info: "Combined with other substances increases overdose risk.", color: "#FFA07A" }
      ],
      nonfatal: [
        { name: "Fentanyl", deaths: 42000, info: "Most common in nonfatal overdoses. Naloxone can reverse effects.", color: "#8B0000" },
        { name: "Heroin", deaths: 28000, info: "Naloxone-reversible. Many survivors enter treatment after overdose.", color: "#B22222" },
        { name: "Cocaine", deaths: 18500, info: "Stimulant overdoses harder to treat. Often requires supportive care.", color: "#DC143C" },
        { name: "Methamphetamine", deaths: 22000, info: "No reversal agent. Treatment focuses on stabilization.", color: "#FF4500" },
        { name: "Prescription Opioids", deaths: 35000, info: "Highest nonfatal rate. Responds well to naloxone.", color: "#CD5C5C" },
        { name: "Benzodiazepines", deaths: 15500, info: "Dangerous when combined. Requires medical detox.", color: "#FF6347" },
        { name: "Synthetic Cannabinoids", deaths: 8200, info: "Emergency room visits common. Severe anxiety and psychosis.", color: "#FF7F50" },
        { name: "Alcohol", deaths: 45000, info: "Alcohol poisoning treatable. Often co-occurs with other drugs.", color: "#FFA07A" }
      ]
    };

    let currentDataType = 'fatal';

    // Create SVG with responsive sizing
    const svg = d3.select("#drug-bubble-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("display", "block")
      .style("margin", "0 auto")
      .append("g")
      .attr("transform", `translate(${margin.left + width / 2}, ${margin.top + height / 2})`);

    console.log("SVG created for bubble chart with dimensions:", width, "x", height);

    // Create tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "drug-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.9)")
      .style("color", "white")
      .style("padding", "15px")
      .style("border-radius", "8px")
      .style("font-size", "14px")
      .style("max-width", "300px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)");

    // Scale for bubble sizes - adjusted for smaller container
    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(drugData.fatal, d => d.deaths)])
      .range([15, 75]); // Slightly smaller max size

    // Function to create force simulation
    function createBubbles(data) {
      console.log("Creating bubbles with data:", data.length, "items");
      
      // Update size scale based on current data
      sizeScale.domain([0, d3.max(data, d => d.deaths)]);

      // Create nodes with positions
      const nodes = data.map(d => ({
        ...d,
        radius: sizeScale(d.deaths),
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2
      }));

      // Force simulation
      const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(5))
        .force("center", d3.forceCenter(0, 0))
        .force("collision", d3.forceCollide().radius(d => d.radius + 2))
        .force("x", d3.forceX(0).strength(0.05))
        .force("y", d3.forceY(0).strength(0.05));

      // Bind data to circles
      const circles = svg.selectAll(".drug-bubble")
        .data(nodes, d => d.name);

      // Exit
      circles.exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .remove();

      // Enter + Update
      const circlesEnter = circles.enter()
        .append("circle")
        .attr("class", "drug-bubble")
        .attr("r", 0)
        .style("cursor", "pointer");

      const allCircles = circlesEnter.merge(circles);

      allCircles
        .transition()
        .duration(800)
        .attr("r", d => d.radius)
        .attr("fill", d => d.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("opacity", 0.8);

      // Add hover effects
      allCircles
        .on("mouseover", function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 1)
            .attr("stroke-width", 4);

          tooltip
            .style("visibility", "visible")
            .html(`
              <strong style="font-size: 16px; color: ${d.color}">${d.name}</strong><br/>
              <strong style="font-size: 20px; color: #FFD700">${d.deaths.toLocaleString()}</strong> ${currentDataType} overdoses<br/>
              <hr style="margin: 8px 0; border-color: rgba(255,255,255,0.3)">
              <span style="color: #ddd">${d.info}</span>
            `);
        })
        .on("mousemove", function(event) {
          tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 15) + "px");
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style("opacity", 0.8)
            .attr("stroke-width", 2);

          tooltip.style("visibility", "hidden");
        });

      // Bind data to labels
      const labels = svg.selectAll(".drug-label")
        .data(nodes, d => d.name);

      labels.exit().remove();

      const labelsEnter = labels.enter()
        .append("text")
        .attr("class", "drug-label")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("font-size", d => {
          // Adjust font size based on bubble size
          if (d.radius > 60) return "12px";
          if (d.radius > 40) return "11px";
          return "9px";
        })
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("pointer-events", "none")
        .style("text-shadow", "1px 1px 2px rgba(0,0,0,0.8)");

      const allLabels = labelsEnter.merge(labels);

      allLabels.text(d => d.name)
        .style("font-size", d => {
          // Adjust font size based on bubble size
          if (d.radius > 60) return "12px";
          if (d.radius > 40) return "11px";
          return "9px";
        });

      // Update positions on simulation tick
      simulation.on("tick", () => {
        allCircles
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        allLabels
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      });
      
      console.log("Bubbles created successfully");
    }

    // Initialize with fatal data
    createBubbles(drugData.fatal);

    // Add title
    d3.select("#drug-bubble-chart")
      .insert("h2", ":first-child")
      .attr("class", "chart-title")
      .style("text-align", "center")
      .style("margin-bottom", "10px")
      .style("margin-top", "0")

    // Filter button functionality
    d3.selectAll(".overdose-filter-btn").on("click", function() {
      const filterType = d3.select(this).attr("data-filter");
      currentDataType = filterType;
      
      console.log("Filter changed to:", filterType);

      // Update active button
      d3.selectAll(".overdose-filter-btn")
        .classed("active", false)
        .style("background-color", "#666")
        .style("color", "white");

      d3.select(this)
        .classed("active", true)
        .style("background-color", "#DC143C")
        .style("color", "white");

      // Update visualization
      createBubbles(drugData[filterType]);
    });
    
    console.log("Drug bubble chart initialization complete!");
  }
})();