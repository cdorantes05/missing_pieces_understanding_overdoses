// Drug overdose bubble chart visualization - With Filters (Fixed Filtering)
(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBubbleChart);
  } else {
    initBubbleChart();
  }

  function initBubbleChart() {

    // Check if container exists
    const container = document.getElementById('drug-bubble-chart');
    if (!container) {
      console.error("Container #drug-bubble-chart not found!");
      return;
    }

    // Get container dimensions for responsive sizing
    const containerWidth = container.clientWidth;
    const listWidth = 200; // Width for the drug list on the right
    const margin = { top: 10, right: 30, bottom: 20, left: 30 };
    const width = containerWidth - 40 - margin.left - margin.right - listWidth - 40; // Reserve space for list
    const height = 350 - margin.top - margin.bottom;

    // Create main container div
    const mainContainer = d3.select("#drug-bubble-chart")
      .style("display", "flex")
      .style("justify-content", "space-between")
      .style("align-items", "flex-start")
      .style("gap", "40px");

    // Create SVG container
    const svgContainer = mainContainer.append("div")
      .style("flex", "1");

    // Create SVG
    const svg = svgContainer
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("display", "block")
      .append("g")
      .attr("transform", `translate(${margin.left + width/2}, ${margin.top + height / 2 - 40})`);

    // Create drug list container
    const listContainer = mainContainer.append("div")
      .attr("class", "drug-rate-list")
      .style("width", listWidth + "px")
      .style("padding", "10px")
      .style("background", "rgba(255, 255, 255, 0.05)")
      .style("border-radius", "10px")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)");

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

    // -------- SCALE FOR BUBBLE SIZES, FEEL FREE TO CHANGE :) ------------
    const sizeScale = d3.scaleSqrt().range([35, 150]);


    // Animation control
    let hasAnimated = false;
    let nodes = null;
    let simulation = null;
    let fullData = null;

    // Current filter state
    let currentFilter = {
      type: 'overall',
      age: null,
      gender: null
    };

    // Function to update the drug rate list
    function updateDrugList(data) {
      // Sort data by deaths (rate) in descending order
      const sortedData = [...data].sort((a, b) => b.deaths - a.deaths);
      
      // Find the maximum rate
      const maxRate = d3.max(sortedData, d => d.deaths);

      // Bind data to list items
      const listItems = listContainer.selectAll(".drug-list-item")
        .data(sortedData, d => d.name);

      // Remove old items
      listItems.exit()
        .transition()
        .duration(400)
        .style("opacity", 0)
        .style("transform", "translateX(20px)")
        .remove();

      // Add new items
      const itemsEnter = listItems.enter()
        .append("div")
        .attr("class", "drug-list-item")
        .style("margin-bottom", "10px")
        .style("opacity", 0)
        .style("transform", "translateX(20px)")
        .style("transition", "all 0.5s ease")
        .style("padding", "10px")
        .style("border-radius", "8px");

      // Drug name
      itemsEnter.append("div")
        .attr("class", "drug-name")
        .style("font-size", "14px")
        .style("font-weight", "500")
        .style("margin-bottom", "4px")
        .style("color", "#ddd")
        .text(d => d.name);

      // Drug rate
      itemsEnter.append("div")
        .attr("class", "drug-rate")
        .style("font-size", "28px")
        .style("font-weight", "bold")
        .style("line-height", "1")
        .style("color", d => d.color)
        .text(d => d.deaths.toFixed(1));

      // Merge and update all items
      const allItems = itemsEnter.merge(listItems);

      // Highlight the highest rate item with subtle red danger styling
      allItems
        .style("background", d => d.deaths === maxRate && d.deaths > 0 ? "rgba(255, 68, 68, 0.08)" : "transparent")
        .style("border", d => d.deaths === maxRate && d.deaths > 0 ? "2px solid rgba(255, 68, 68, 0.3)" : "2px solid transparent");

      // Animate items into view with staggered delay
      allItems
        .transition()
        .duration(500)
        .delay((d, i) => i * 50)
        .style("opacity", 1)
        .style("transform", "translateX(0)");

      // Update rates with smooth number transitions
      allItems.select(".drug-rate")
        .transition()
        .duration(500)
        .style("color", d => d.color)
        .style("font-size", d => d.deaths === maxRate && d.deaths > 0 ? "30px" : "28px") // Slightly larger for highest
        .style("text-shadow", d => d.deaths === maxRate && d.deaths > 0 ? "0 0 6px rgba(255, 68, 68, 0.3)" : "none") // Subtle glow
        .tween("text", function(d) {
          const node = this;
          const currentText = node.textContent;
          const currentValue = parseFloat(currentText) || 0;
          const interpolator = d3.interpolateNumber(currentValue, d.deaths);
          
          return function(t) {
            node.textContent = interpolator(t).toFixed(1);
          };
        });
    }

    // Function to create or update bubbles
    function updateBubbles(dataObj, isInitial = false) {
      const data = dataObj.nonZero; // Use only non-zero drugs for bubbles
      const allDrugs = dataObj.all; // Use all drugs for labels


      // --- DYNAMIC AUTO-SPACING LAYOUT THAT MORPHS SMOOTHLY ---

      const numBubbles = data.length;
      const rowCount = 2;
      const colCount = Math.ceil(numBubbles / rowCount); // Dynamic column count
      const padding = 0; // bubbles should touch

      // Compute radii
      const radii = data.map(d => sizeScale(d.deaths));

      // Compute row heights based on largest radius in each row
      const rowHeights = [];
      for (let r = 0; r < rowCount; r++) {
        const rowBubbles = radii.slice(r * colCount, Math.min((r + 1) * colCount, numBubbles));
        if (rowBubbles.length > 0) {
          const maxRadius = d3.max(rowBubbles);
          rowHeights.push(maxRadius * 2 + padding);
        }
      }

      const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);

      // Center rows vertically around (0,0)
      let yOffset = -totalHeight / 2;
      const yOffsets = [];
      for (let r = 0; r < rowCount; r++) {
        if (rowHeights[r]) {
          yOffsets.push(yOffset + rowHeights[r] / 2);
          yOffset += rowHeights[r];
        }
      }

      let newNodes = [];

      for (let r = 0; r < rowCount; r++) {
        const startIdx = r * colCount;
        const endIdx = Math.min((r + 1) * colCount, numBubbles);
        
        if (startIdx >= numBubbles) break; // No more bubbles
        
        // Radii for this row
        const rowR = radii.slice(startIdx, endIdx);
        const rowData = data.slice(startIdx, endIdx);

        // Total row width = sum(diameters) + padding
        const totalRowWidth = d3.sum(rowR.map(x => x * 2)) + padding * (rowData.length - 1);

        // Start X so row is perfectly centered
        let xPos = -totalRowWidth / 2;

        for (let c = 0; c < rowData.length; c++) {
          const d = rowData[c];
          const radius = rowR[c];

          const targetX = xPos + radius;
          const targetY = yOffsets[r];

          // Find existing node for smooth morphing
          const existing = nodes ? nodes.find(n => n.name === d.name) : null;

          newNodes.push({
            ...d,
            radius,
            targetX,
            targetY,

            // Morph from prior position → new target
            x: existing ? existing.x : targetX,
            y: existing ? existing.y : targetY,
            vx: existing ? existing.vx : 0,
            vy: existing ? existing.vy : 0
          });

          // Move X for the next bubble
          xPos += radius * 2 + padding;
        }
      }

      nodes = newNodes;

      // Create label nodes for ALL drugs (including zero-rate ones)
      const labelNodes = allDrugs.map((drug, index) => {
        const bubbleNode = nodes.find(n => n.name === drug.name);
        if (bubbleNode) {
          // Drug has a bubble, use its position
          return bubbleNode;
        } else {
          // Zero-rate drug, position it below the bubbles in a row
          const zeroRateIndex = allDrugs.slice(0, index).filter(d => d.deaths === 0).length;
          return {
            ...drug,
            x: -150 + (zeroRateIndex * 100), // Position horizontally
            y: height / 2 - 80, // Position below bubbles
            targetX: -150 + (zeroRateIndex * 100),
            targetY: height / 2 - 80,
            radius: 0
          };
        }
      });

      // Update the drug list with all drugs (including zero-rate)
      updateDrugList(allDrugs);

      // Smoothly interpolate positions toward new target
      svg.selectAll(".drug-bubble")
        .transition()
        .duration(500)
        .ease(d3.easeCubicInOut)
        .attrTween("cx", function(d) {
          const i = d3.interpolateNumber(d.x, d.targetX);
          return t => d.x = i(t);   // update data AND visual position
        })
        .attrTween("cy", function(d) {
          const i = d3.interpolateNumber(d.y, d.targetY);
          return t => d.y = i(t);
        });


      if (!simulation) {
        simulation = d3.forceSimulation(nodes)
          .force("x", d3.forceX(d => d.targetX).strength(0.15))
          .force("y", d3.forceY(d => d.targetY).strength(0.15))
          .force("collision", d3.forceCollide().radius(d => d.radius))
          .alphaDecay(0.05);
      } else {
        simulation.nodes(nodes);
        simulation.force("x").x(d => d.targetX);
        simulation.force("y").y(d => d.targetY);
        simulation.force("collision").radius(d => d.radius);
        simulation.alpha(0.9).restart();
}

      // Bind data to circles
      const circles = svg.selectAll(".drug-bubble")
        .data(nodes, d => d.name);

      // Remove circles that are no longer needed
      circles.exit()
        .transition()
        .duration(500)
        .attr("r", 0)
        .style("opacity", 0)
        .remove();

      // Add new circles
      const circlesEnter = circles.enter()
        .append("circle")
        .attr("class", "drug-bubble")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 0)
        .style("cursor", "pointer")
        .attr("fill", d => d.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("opacity", 0);

      // Merge and update ALL circles (both new and existing)
      const allCircles = circlesEnter.merge(circles);

      // Find the drug with the highest rate
      const maxRateBubble = d3.max(nodes, d => d.deaths);

      // Set radius immediately so physics & SVG match
      allCircles
        .attr("r", d => d.radius)
        .style("opacity", 0.8)
        .attr("stroke", d => d.deaths === maxRateBubble ? "#ff7171ff" : "#fff") // Red stroke for highest
        .attr("stroke-width", d => d.deaths === maxRateBubble ? 3 : 2) // Slightly thicker stroke for highest
        .style("filter", d => d.deaths === maxRateBubble ? "drop-shadow(0 0 8px rgba(255, 68, 68, 0.5))" : "none"); // Subtle red glow

      // Now update simulation forces with new radii
      simulation.force("collision").radius(d => d.radius);
      simulation.alphaTarget(0.2).restart();

      setTimeout(() => {
        simulation.alphaTarget(0);
      }, 400);


      // Set up hover interactions
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

      // Bind data to labels - Sort by rate (highest first) for z-index ordering
      // Use labelNodes which includes all drugs (even zero-rate ones)
      const sortedLabelNodes = [...labelNodes].sort((a, b) => b.deaths - a.deaths);
      
      const labels = svg.selectAll(".drug-label")
        .data(sortedLabelNodes, d => d.name);

      // Remove labels that are no longer needed
      labels.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

      // Add new labels
      const labelsEnter = labels.enter()
        .append("text")
        .attr("class", "drug-label")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("pointer-events", "none")
        .style("opacity", 0);

      // Merge and update ALL labels
      const allLabels = labelsEnter.merge(labels);

      // Find the drug with the highest rate
      const maxRate = d3.max(labelNodes, d => d.deaths);

      allLabels
        .text(d => d.name)
        .transition()
        .duration(isInitial ? 1000 : 700)
        .delay(isInitial ? (d, i) => i * 100 + 400 : 0)
        .style("font-size", d => {
          if (d.deaths === maxRate && d.deaths > 0) return "19px"; // Slightly larger for highest rate
          if (d.deaths === 0) return "12px"; // Smaller font for zero-rate drugs
          if (d.radius > 90) return "18px";
          if (d.radius > 60) return "14px";
          return "9px";
        })
        .style("opacity", 1) // Show all labels
        .style("fill", d => {
          if (d.deaths === 0) return "#888"; // Gray for zero-rate
          if (d.deaths === maxRate) return "rgba(255, 242, 242, 1)"; // Softer red for highest rate
          return "white"; // White for others
        })
        .style("font-weight", d => d.deaths === maxRate && d.deaths > 0 ? "900" : "bold") // Extra bold for highest
        .style("text-shadow", d => d.deaths === maxRate && d.deaths > 0 ? "0 0 6px rgba(255, 68, 68, 0.4)" : "none"); // Subtle red glow

      // Update positions on simulation tick
      simulation.on("tick", () => {
        allCircles
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        allLabels
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      });

    }

    // Function to aggregate data based on filters
    function aggregateData(data, filterType, age = null, gender = null) {
      console.log("Aggregating data with filter:", filterType, age, gender);

      const drugs = [
        { name: "Fentanyl", key: "fentanyl_rate", color: "#B22222" },
        { name: "Heroin", key: "heroin_rate", color: "#DC143C" },
        { name: "Stimulants", key: "stimulant_rate", color: "#FF4500" },
        { name: "Cocaine", key: "cocaine_rate", color: "#CD5C5C" },
        { name: "Methamphetamine", key: "methamphetamine_rate", color: "#FF6347" },
        { name: "Benzodiazepines", key: "benzodiazepine_rate", color: "#FFA07A" }
      ];

      let filteredData;

      if (filterType === 'overall') {
        // Overall: sex = "Total" AND age_range = "Total"
        filteredData = data.filter(d => d.sex === "Total" && d.age_range === "Total");
        console.log("Filtering for Overall - sex='Total' AND age_range='Total'");
      } else if (filterType === 'age' && age) {
        // By Age: age_range = selected age AND sex = "Total"
        filteredData = data.filter(d => d.age_range === age && d.sex === "Total");
        console.log(`Filtering for Age - age_range='${age}' AND sex='Total'`);
      } else if (filterType === 'gender' && gender) {
        // By Gender: sex = selected gender AND age_range = "Total"
        filteredData = data.filter(d => d.sex === gender && d.age_range === "Total");
        console.log(`Filtering for Gender - sex='${gender}' AND age_range='Total'`);
      } else {
        // Default to overall if no valid selection
        console.log("No valid filter selection, defaulting to overall");
        filteredData = data.filter(d => d.sex === "Total" && d.age_range === "Total");
      }

      console.log("Filtered data rows:", filteredData.length);

      // Aggregate (average) the rate for each drug
      const aggregatedData = drugs.map(drug => {
        const values = filteredData
          .map(d => parseFloat(d[drug.key]))
          .filter(v => Number.isFinite(v) && v !== 0);

        const mean = d3.mean(values) || 0;

        
        let infoText = `${drug.name} average nonfatal overdose rate`;
        if (filterType === 'age' && age) {
          infoText += ` for ages ${age}`;
        } else if (filterType === 'gender' && gender) {
          infoText += ` for ${gender === 'M' ? 'males' : 'females'}`;
        } else {
          infoText += ` overall`;
        }
        
        return {
          name: drug.name,
          deaths: mean,
          info: infoText,
          color: drug.color
        };
      });

      return {
        all: aggregatedData, // All drugs including zero-rate ones
        nonZero: aggregatedData.filter(drug => drug.deaths > 0) // Only drugs with rates > 0
      };
    }

    // Function to update visualization based on filter
    function updateVisualization() {
      if (!fullData) return;

      // Only update if we have valid filter selections
      if (currentFilter.type === 'age' && !currentFilter.age) {
        console.log("Age filter selected but no age chosen yet - skipping update");
        return;
      }
      if (currentFilter.type === 'gender' && !currentFilter.gender) {
        console.log("Gender filter selected but no gender chosen yet - skipping update");
        return;
      }

      const aggregatedData = aggregateData(
        fullData, 
        currentFilter.type, 
        currentFilter.age, 
        currentFilter.gender
      );

      // Update bubbles with new data
      updateBubbles(aggregatedData, false);
    }

    // Function to trigger initial animation
    function triggerAnimation() {
      if (!hasAnimated && nodes) {
        hasAnimated = true;
        
        if (simulation) {
          simulation.alpha(1).restart();
        }
        
        svg.selectAll(".drug-bubble")
          .transition()
          .duration(1000)
          .delay((d, i) => i * 100)
          .attr("r", d => d.radius)
          .style("opacity", 0.8);
        
        svg.selectAll(".drug-label")
          .transition()
          .duration(1000)
          .delay((d, i) => i * 100 + 400)
          .style("opacity", 1);
      }
    }

    // Create filter controls
    function createFilterUI() {
      const filterContainer = d3.select("#drug-bubble-filters");
      if (!filterContainer.node()) {
        console.error("Filter container #drug-bubble-filters not found!");
        return;
      }

      filterContainer.html('');

      // Filter type selection
      const filterTypeDiv = filterContainer
        .append("div")
        .attr("class", "bubble-filter-type")
        .style("margin-bottom", "20px");

      filterTypeDiv.append("label")
        .style("font-weight", "600")
        .style("margin-right", "15px")
        .text("View by:");

      const filterTypes = [
        { value: 'overall', label: 'Overall' },
        { value: 'age', label: 'Age Group' },
        { value: 'gender', label: 'Gender' }
      ];

      filterTypes.forEach(type => {
        const label = filterTypeDiv.append("label")
          .style("margin-right", "20px")
          .style("cursor", "pointer");

        label.append("input")
          .attr("type", "radio")
          .attr("name", "bubble-filter-type")
          .attr("value", type.value)
          .property("checked", type.value === 'overall')
          .on("change", function() {
            currentFilter.type = this.value;
            currentFilter.age = null;
            currentFilter.gender = null;
            updateSecondaryFilters();
            
            // Only update visualization if switching to 'overall'
            if (this.value === 'overall') {
              updateVisualization();
            }
          });

        label.append("span")
          .style("margin-left", "5px")
          .text(type.label);
      });

      // Secondary filter container
      filterContainer.append("div")
        .attr("id", "bubble-secondary-filter")
        .style("margin-top", "15px");

      updateSecondaryFilters();
    }

    // Update secondary filters based on filter type
    function updateSecondaryFilters() {
      const secondaryContainer = d3.select("#bubble-secondary-filter");
      secondaryContainer.html('');

      if (currentFilter.type === 'age') {
        const ageGroups = ["0 to 14", "15 to 24", "25 to 34", "35 to 44", "45 to 54", "55 to 64", "65+"];
        
        secondaryContainer.append("label")
          .style("font-weight", "600")
          .style("margin-right", "10px")
          .text("Select Age Group:");

        const select = secondaryContainer.append("select")
          .attr("class", "bubble-filter-select")
          .style("padding", "8px")
          .style("font-size", "14px")
          .style("border-radius", "4px")
          .on("change", function() {
            currentFilter.age = this.value;
            if (this.value) {
              updateVisualization();
            }
          });

        select.append("option")
          .attr("value", "")
          .text("-- Select Age --");

        ageGroups.forEach(age => {
          select.append("option")
            .attr("value", age)
            .text(age);
        });

      } else if (currentFilter.type === 'gender') {
        const genders = [
          { value: 'M', label: 'Male' },
          { value: 'F', label: 'Female' }
        ];

        secondaryContainer.append("label")
          .style("font-weight", "600")
          .style("margin-right", "10px")
          .text("Select Gender:");

        const select = secondaryContainer.append("select")
          .attr("class", "bubble-filter-select")
          .style("padding", "8px")
          .style("font-size", "14px")
          .style("border-radius", "4px")
          .on("change", function() {
            currentFilter.gender = this.value;
            if (this.value) {
              updateVisualization();
            }
          });

        select.append("option")
          .attr("value", "")
          .text("-- Select Gender --");

        genders.forEach(gender => {
          select.append("option")
            .attr("value", gender.value)
            .text(gender.label);
        });
      }
    }

    // Load real dataset
    d3.csv("data/DOSE_SyS_Dashboard_Download_10-23-2025 - Overall.csv").then(function(data) {

      fullData = data;

      // Compute global max rate across all drug types (ignoring "*" etc.)
      const globalMaxRaw = d3.max(fullData, d => 
        Math.max(
          parseFloat(d.fentanyl_rate)        || 0,
          parseFloat(d.heroin_rate)          || 0,
          parseFloat(d.stimulant_rate)       || 0,
          parseFloat(d.cocaine_rate)         || 0,
          parseFloat(d.methamphetamine_rate) || 0,
          parseFloat(d.benzodiazepine_rate)  || 0
        )
      );

      // Focus the visual scale on the 0–10 range (most age-group averages live here)
      const effectiveMax = Math.min(globalMaxRaw, 10);

      // Use one constant domain across all filters, and clamp big outliers
      sizeScale
        .domain([0, effectiveMax])
        .clamp(true);

      console.log("Global raw max:", globalMaxRaw, "using effective max:", effectiveMax);



      // Create filter UI
      createFilterUI();

      // Create initial bubbles
      const initialData = aggregateData(data, 'overall');
      updateBubbles(initialData, true);

      // Set up Intersection Observer for scroll-triggered animation
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAnimated) {
            triggerAnimation();
          }
        });
      }, observerOptions);

      observer.observe(container);

    }).catch(error => {
      console.error("Error loading dataset:", error);
    });

  }
})();