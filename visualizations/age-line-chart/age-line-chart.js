(async function() {
  // Chart dimensions and margins - reduced height for better fit
  const distributionWidth = 200;
  const width = 900 + distributionWidth;
  const height = 400;
  const marginTop = 50;
  const marginRight = 180; // increased to make room for legend outside chart
  const marginBottom = 50;
  const marginLeft = 80 + distributionWidth;

  // Load dataset
  let data = await d3.csv("data/DOSE_SyS_Dashboard_Download_10-23-2025 - Overall.csv", d => ({
    year: +d.year,
    month: +d.month,
    age_range: d.age_range,
    drug_rate: +d.drug_rate
  }));

  console.log("Loaded data:", data.slice(0, 5));

  // Convert year + month → date object for x-axis
  data.forEach(d => {
    const y = +d.year;
    const m = +d.month;
    if (!isNaN(y) && !isNaN(m)) {
      d.date = new Date(y, m - 1, 1);
    } else {
      d.date = new Date(`${d.year}-${d.month}-01`);
    }
  });

  // ✅ keep only valid rows
  data = data.filter(d =>
    !isNaN(d.drug_rate) &&
    d.date instanceof Date &&
    !isNaN(d.date.getTime())
  );

  // 🧮 Aggregate by (age_range, month)
  const rolled = d3.rollups(
    data,
    v => d3.mean(v, d => d.drug_rate),
    d => d.age_range,
    d => d3.timeMonth(d.date)
  );

  // Flatten back into an array
  const aggregated = rolled.flatMap(([age, values]) =>
    values.map(([date, rate]) => ({
      age_range: age,
      date,
      drug_rate: rate
    }))
  );

  // Group the aggregated data by age_range
  const ageGroups = d3.group(aggregated, d => d.age_range);

  // Define age group order from youngest to oldest
  const ageOrder = [
    "0 to 14",
    "15 to 24",
    "25 to 34",
    "35 to 44",
    "45 to 54",
    "55 to 64",
    "65+",
    "Total"
  ];

  // Filter to only include age groups that exist in the data
  const orderedAgeGroups = ageOrder.filter(age => ageGroups.has(age));

  // Scales
  const x = d3.scaleUtc()
    .domain(d3.extent(aggregated, d => d.date))
    .range([marginLeft, width - marginRight]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.drug_rate)]).nice()
    .range([height - marginBottom, marginTop]);

  // Color scheme - keep the same mapping
  const color = d3.scaleOrdinal()
    .domain([...ageGroups.keys()])
    .range([
      "#FFB3BA", // light pink
      "#FF8E8E", // salmon
      "#FF6B6B", // coral red
      "#E63946", // bright red
      "#DC2F02", // vivid orange-red
      "#D00000", // deep red
      "#9D0208", // dark red
      "#6A040F"  // darkest red
    ]);

  // Line generator
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.drug_rate));

  // SVG setup
  const svg = d3.select("#overdose-line-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Main chart title - simple, clean, no background
  svg.append("text")
    .attr("x", marginLeft)
    .attr("y", marginTop - 20)
    .attr("fill", "#ffffff")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Overdose Trends Over Time");

  // X-axis
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(4)).tickFormat(d3.timeFormat("%b %Y")))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  // Y-axis - removed the label
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove());

  // Draw lines
  for (const [age, values] of ageGroups) {
    values.sort((a, b) => a.date - b.date);

    const path = svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color(age))
      .attr("stroke-width", 2.5)
      .attr("d", line)
      .attr("opacity", 0.9);

    const totalLength = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0);
  }

  // Legend wrapper
const legendGroup = svg.append("g")
.attr("transform", `translate(${width - marginRight + 20}, ${marginTop + 30})`);

// --- NEW: separate sub-group for the header ---
legendGroup.append("g")
.append("text")
.attr("x", 0)
.attr("y", -10)
.attr("fill", "#ffffff")
.attr("font-size", "13px")
.attr("font-weight", "bold")
.text("Age Groups");

// --- NEW: separate sub-group for legend items ---
const legendItems = legendGroup.append("g")
.attr("class", "legend-items");

legendItems.selectAll("rect")
.data(orderedAgeGroups)
.enter()
.append("rect")
.attr("x", 0)
.attr("y", (d, i) => i * 22)
.attr("width", 14)
.attr("height", 14)
.attr("fill", d => color(d))
.attr("rx", 2);

legendItems.selectAll("text")
.data(orderedAgeGroups)
.enter()
.append("text")
.attr("x", 22)
.attr("y", (d, i) => i * 22 + 11)
.attr("fill", "#ffffff")
.style("font-size", "12px")
.text(d => d);

  // ====================================
  // INTERACTIVE VERTICAL LINE + AGE DISTRIBUTION
  // ====================================

  // Group data by date for quick lookup
  const dataByDate = d3.rollup(
    aggregated,
    v => v,
    d => d3.timeMonth(d.date).getTime()
  );

  // Get all unique dates sorted (only dates with data)
  const allDates = Array.from(dataByDate.keys()).sort((a, b) => a - b);
  
  // Start with the latest date
  let currentDate = new Date(allDates[allDates.length - 1]);

  // Create age distribution scales - using ordered age groups
  const distributionX = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.drug_rate)])
    .range([90, distributionWidth - 40]);

  const distributionY = d3.scaleBand()
    .domain(orderedAgeGroups) // use ordered age groups
    .range([marginTop + 40, height - marginBottom])
    .padding(0.25);

  // Create age distribution group
  const distributionGroup = svg.append("g")
    .attr("class", "age-distribution")
    .attr("transform", `translate(50, 0)`);

  // Distribution title - simple, clean, no background
  distributionGroup.append("text")
    .attr("x", 0)
    .attr("y", marginTop - 20)
    .attr("fill", "#ffffff")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Age Distribution");

  // Date label - simple, clean, no background
  const dateLabel = distributionGroup.append("text")
    .attr("class", "date-label")
    .attr("x", 0)
    .attr("y", marginTop + 15)
    .attr("fill", "#FFB3BA")
    .attr("font-size", "13px")
    .attr("font-weight", "bold");

  // Add "No data available" message (hidden by default)
  const noDataMessage = distributionGroup.append("text")
    .attr("class", "no-data-message")
    .attr("x", 0)
    .attr("y", (marginTop + height - marginBottom) / 2)
    .attr("fill", "#FF6B6B")
    .attr("font-size", "14px")
    .attr("font-style", "italic")
    .attr("opacity", 0)
    .text("No data available");

  // Add age group labels on the left - using ordered age groups
  const ageLabels = distributionGroup.selectAll(".age-label")
    .data(orderedAgeGroups)
    .enter()
    .append("text")
    .attr("class", "age-label")
    .attr("x", 0)
    .attr("y", d => distributionY(d) + distributionY.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("fill", "#ffffff")
    .attr("font-size", "11px")
    .attr("text-anchor", "start")
    .text(d => d);

  // Create bars for age distribution - using ordered age groups
  const bars = distributionGroup.selectAll(".age-bar")
    .data(orderedAgeGroups)
    .enter()
    .append("rect")
    .attr("class", "age-bar")
    .attr("y", d => distributionY(d))
    .attr("height", distributionY.bandwidth())
    .attr("fill", d => color(d))
    .attr("opacity", 0.85)
    .attr("rx", 3);

  // Add value labels - using ordered age groups
  const valueLabels = distributionGroup.selectAll(".age-value")
    .data(orderedAgeGroups)
    .enter()
    .append("text")
    .attr("class", "age-value")
    .attr("y", d => distributionY(d) + distributionY.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("fill", "#ffffff")
    .attr("font-size", "11px")
    .attr("font-weight", "bold");

  // Create vertical line - now white and more subtle
  const verticalLine = svg.append("line")
    .attr("class", "vertical-indicator")
    .attr("y1", marginTop)
    .attr("y2", height - marginBottom)
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4,4")
    .attr("opacity", 0.5)
    .style("cursor", "ew-resize");

  // Create draggable circle handle - now white
  const handle = svg.append("circle")
    .attr("class", "drag-handle")
    .attr("r", 7)
    .attr("cy", height - marginBottom)
    .attr("fill", "#ffffff")
    .attr("stroke", "#cccccc")
    .attr("stroke-width", 2)
    .style("cursor", "ew-resize")
    .attr("opacity", 0.8);

  // Function to find nearest date with data
  function findNearestDateWithData(targetDate) {
    const targetTime = targetDate.getTime();
    let nearest = allDates[0];
    let minDiff = Math.abs(targetTime - nearest);
    
    for (const dateTime of allDates) {
      const diff = Math.abs(targetTime - dateTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = dateTime;
      }
    }
    
    return new Date(nearest);
  }

  // Function to update the age distribution
  function updateDistribution(date, animate = true) {
    const timestamp = d3.timeMonth(date).getTime();
    const dataAtDate = dataByDate.get(timestamp) || [];
    
    const hasData = dataAtDate.length > 0;
    
    if (!hasData) {
      // Show "No data available" message
      noDataMessage.transition().duration(200).attr("opacity", 1);
      ageLabels.transition().duration(200).attr("opacity", 0.3);
      dateLabel.text(d3.timeFormat("%B %Y")(date) + " - No Data");
      
      // Fade out bars and labels
      const barUpdate = animate ? bars.transition().duration(200) : bars;
      barUpdate.attr("opacity", 0);
      
      const labelUpdate = animate ? valueLabels.transition().duration(200) : valueLabels;
      labelUpdate.attr("opacity", 0);
      
      return;
    }
    
    // Hide "No data available" message and restore opacity
    noDataMessage.transition().duration(200).attr("opacity", 0);
    ageLabels.transition().duration(200).attr("opacity", 1);
    
    // Create a map for quick lookup
    const rateMap = new Map(dataAtDate.map(d => [d.age_range, d.drug_rate]));
    
    // Update bars with animation and restore full opacity
    const barUpdate = animate ? bars.transition().duration(200) : bars;
    barUpdate
      .attr("opacity", 0.85) // ✅ Reset to normal opacity
      .attr("x", 90)
      .attr("width", d => {
        const rate = rateMap.get(d) || 0;
        return distributionX(rate) - 90;
      });

    // Update value labels with animation and restore full opacity
    const labelUpdate = animate ? valueLabels.transition().duration(200) : valueLabels;
    labelUpdate
      .attr("opacity", 1) // ✅ Reset to full opacity
      .attr("x", d => {
        const rate = rateMap.get(d) || 0;
        return distributionX(rate) + 5;
      })
      .text(d => {
        const rate = rateMap.get(d);
        return rate ? rate.toFixed(1) : "0.0";
      });

    // Update date label
    dateLabel.text(d3.timeFormat("%B %Y")(date));
  }

  // Function to update vertical line position (no transitions during drag)
  function updateVerticalLine(date, animate = false) {
    const xPos = x(date);
    verticalLine.attr("x1", xPos).attr("x2", xPos);
    handle.attr("cx", xPos);
    currentDate = date;
    updateDistribution(date, animate);
  }

  // Drag behavior
  const drag = d3.drag()
    .on("drag", function(event) {
      const xPos = Math.max(marginLeft, Math.min(width - marginRight, event.x));
      const date = x.invert(xPos);
      
      // Snap to nearest month
      const snappedDate = d3.timeMonth.round(date);
      
      // Update immediately without animation for smooth dragging
      updateVerticalLine(snappedDate, false);
    })
    .on("end", function(event) {
      // Snap to nearest date with actual data
      const xPos = Math.max(marginLeft, Math.min(width - marginRight, event.x));
      const date = x.invert(xPos);
      const snappedDate = d3.timeMonth.round(date);
      const nearestDataDate = findNearestDateWithData(snappedDate);
      updateVerticalLine(nearestDataDate, true);
    });

  // Apply drag to both line and handle
  verticalLine.call(drag);
  handle.call(drag);

  // Click anywhere on chart to move the line
  svg.append("rect")
    .attr("class", "interaction-overlay")
    .attr("x", marginLeft)
    .attr("y", marginTop)
    .attr("width", width - marginLeft - marginRight)
    .attr("height", height - marginTop - marginBottom)
    .attr("fill", "transparent")
    .style("cursor", "crosshair")
    .on("click", function(event) {
      const [xPos] = d3.pointer(event);
      const date = x.invert(xPos);
      const snappedDate = d3.timeMonth.round(date);
      const nearestDataDate = findNearestDateWithData(snappedDate);
      updateVerticalLine(nearestDataDate, true);
    });

  // Initialize with latest date
  updateVerticalLine(currentDate, false);

})();