// Drug overdose bubble chart visualization - Real dataset version
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
    const margin = { top: 10, right: 20, bottom: 20, left: 20 };
    const width = Math.min(containerWidth - 40, 900) - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select("#drug-bubble-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("display", "block")
      .style("margin", "0 auto")
      .append("g")
      .attr("transform", `translate(${margin.left + width / 2}, ${margin.top + height / 2})`);

    console.log("SVG created for bubble chart with dimensions:", width, "x", height);

    // Tooltip
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

    // Bubble size scale
    const sizeScale = d3.scaleSqrt()
      .range([30, 105]); // bubble size range

    // Animation control
    let hasAnimated = false;
    let nodes = null;
    let simulation = null;

    // Function to create bubbles
    function createBubbles(data, animate = false) {
      console.log("Creating bubbles with data:", data);

      // Update scale
      sizeScale.domain([0, d3.max(data, d => d.deaths)]);

      // Create nodes in zigzag pattern
      nodes = data.map((d, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const xSpacing = width / 5;
        const ySpacing = height / 4;
        const xOffset = row % 2 === 0 ? 0 : xSpacing / 2;
        
        return {
          ...d,
          radius: sizeScale(d.deaths),
          x: (col - 1) * xSpacing + xOffset,
          y: (row - 1) * ySpacing
        };
      });

      // Force simulation with position constraints
      simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(5))
        .force("collision", d3.forceCollide().radius(d => d.radius + 2))
        .force("x", d3.forceX(d => d.x).strength(0.8))
        .force("y", d3.forceY(d => d.y).strength(0.8));

      // Stop simulation initially if not animating
      if (!animate) {
        simulation.stop();
      }

      // Circles
      const circles = svg.selectAll(".drug-bubble")
        .data(nodes, d => d.name);

      circles.exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .remove();

      const circlesEnter = circles.enter()
        .append("circle")
        .attr("class", "drug-bubble")
        .attr("r", 0)
        .style("cursor", "pointer")
        .attr("fill", d => d.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("opacity", 0);

      const allCircles = circlesEnter.merge(circles);

      // Animate only if flag is set
      if (animate) {
        allCircles
          .transition()
          .duration(1000)
          .delay((d, i) => i * 100) // stagger animation
          .attr("r", d => d.radius)
          .style("opacity", 0.8);
      }

      // Hover tooltip
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
              <strong style="font-size: 20px; color: #FFD700">${d.deaths.toFixed(2)}</strong> avg rate<br/>
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

      // Labels
      const labels = svg.selectAll(".drug-label")
        .data(nodes, d => d.name);

      labels.exit().remove();

      const labelsEnter = labels.enter()
        .append("text")
        .attr("class", "drug-label")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("pointer-events", "none")
        .style("opacity", 0);

      const allLabels = labelsEnter.merge(labels);

      allLabels.text(d => d.name)
        .style("font-size", d => {
          if (d.radius > 90) return "18px";
          if (d.radius > 60) return "14px";
          return "9px";
        });

      // Animate labels if flag is set
      if (animate) {
        allLabels
          .transition()
          .duration(1000)
          .delay((d, i) => i * 100 + 400) // delay after bubbles start
          .style("opacity", 1);
      }

      // Update on tick
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

    // Function to trigger animation
    function triggerAnimation() {
      if (simulation && nodes) {
        console.log("Triggering bubble animation!");
        
        // Restart simulation
        simulation.alpha(1).restart();
        
        // Animate bubbles
        svg.selectAll(".drug-bubble")
          .transition()
          .duration(1000)
          .delay((d, i) => i * 100)
          .attr("r", d => d.radius)
          .style("opacity", 0.8);
        
        // Animate labels
        svg.selectAll(".drug-label")
          .transition()
          .duration(1000)
          .delay((d, i) => i * 100 + 400)
          .style("opacity", 1);
      }
    }

    // Load real dataset (CSV converted from Excel)
    d3.csv("data/DOSE_SyS_Dashboard_Download_10-23-2025 - Overall.csv").then(function(data) {
      console.log("Loaded overdose data:", data.length, "rows");

      // Drug keys and display info
      const drugs = [
        { name: "Fentanyl", key: "fentanyl_rate", color: "#B22222" },
        { name: "Heroin", key: "heroin_rate", color: "#DC143C" },
        { name: "Stimulants", key: "stimulant_rate", color: "#FF4500" },
        { name: "Cocaine", key: "cocaine_rate", color: "#CD5C5C" },
        { name: "Methamphetamine", key: "methamphetamine_rate", color: "#FF6347" },
        { name: "Benzodiazepines", key: "benzodiazepine_rate", color: "#FFA07A" }
      ];

      // Aggregate (average) the rate for each drug
      const aggregatedData = drugs.map(drug => {
        const values = data.map(d => +d[drug.key]).filter(v => !isNaN(v));
        const mean = d3.mean(values);
        return {
          name: drug.name,
          deaths: mean,
          info: `${drug.name} average nonfatal overdose rate across all records.`,
          color: drug.color
        };
      });

      // Create the bubbles (initially hidden)
      createBubbles(aggregatedData, false);

      // Set up Intersection Observer for scroll-triggered animation
      const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.3 // trigger when 30% of element is visible
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            console.log("Bubble chart is visible, triggering animation!");
            triggerAnimation();
            hasAnimated = true; // only animate once
          }
        });
      }, observerOptions);

      // Start observing the container
      observer.observe(container);

    }).catch(error => {
      console.error("Error loading dataset:", error);
    });

    console.log("Drug bubble chart initialization complete!");
  }
})();