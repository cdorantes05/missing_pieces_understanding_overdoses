d3.csv("data/naloxone_distribution.csv").then(raw => {

  // ----------------------------------------
  // FORMAT + FILTER DATA
  // ----------------------------------------
  const focusSpecialties = [
    "General practice",
    "Nurse practitioner",
    "Surgical specialties",
    "Family practice",
    "Physician assistant",
    "Internal Medicine"
  ];

  const years = ["2017", "2018", "2019", "2020", "2021", "2022"];

  const data = raw
    .map(d => ({
      Specialty: d.Specialty.trim(),
      "2017": +d["2017"],
      "2018": +d["2018"],
      "2019": +d["2019"],
      "2020": +d["2020"],
      "2021": +d["2021"],
      "2022": +d["2022"]
    }))
    .filter(d => focusSpecialties.includes(d.Specialty));

  // Totals for line chart (only these 7 specialties)
  const totals = years.map(yr => ({
    year: +yr,
    total: d3.sum(data, d => d[yr])
  }));

  // Color scale by specialty
  const color = d3.scaleOrdinal()
    .domain(focusSpecialties)
    .range([
      "#90CAF9",  // Light Blue
      "#64B5F6",
      "#42A5F5",
      "#2196F3",
      "#1E88E5",
      "#1565C0" // Internal Medicine
    ]);

  // ----------------------------------------
  // TOOLTIP (shared by radial + line)
  // ----------------------------------------
  const tooltip = d3.select("body")
    .append("div")
    .attr("id", "naloxone-tooltip")
    .style("position", "absolute")
    .style("background", "#111")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("border", "1px solid #555")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // ----------------------------------------
  // RADIAL CHART (LEFT PANEL)
  // ----------------------------------------
  const widthR = 700;
  const heightR = 700;
  const cx = widthR / 2;
  const cy = heightR / 2;

  const innerMostRadius = 90;
  const ringThickness = 26;
  const ringGap = 10;

  const radialSvg = d3.select("#naloxone-bar")
    .append("svg")
    .attr("viewBox", `0 0 ${widthR} ${heightR}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const radialGroup = radialSvg.append("g")
    .attr("transform", `translate(${cx},${cy-40})`);

  // Center label
  const centerGroup = radialSvg.append("g")
    .attr("class", "naloxone-center-label")
    .attr("transform", `translate(${cx},${cy-40})`);

  centerGroup.append("text")
    .attr("class", "center-title")
    .attr("y", -6)
    .text("Naloxone");

  centerGroup.append("text")
    .attr("class", "center-title")
    .attr("y", 18)
    .text("Distribution");

  centerGroup.append("text")
    .attr("class", "center-subtitle")
    .attr("y", 45)
    .text("2017–2022");

  // Legend (top-left)
  const legend = radialSvg.append("g")
    .attr("class", "naloxone-legend")
    .attr("transform", "translate(20, -30)");

  const legendItem = legend.selectAll(".legend-item")
    .data(focusSpecialties)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 18})`);

  legendItem.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("fill", d => color(d));

  legendItem.append("text")
    .attr("x", 18)
    .attr("y", 9)
    .attr("dominant-baseline", "middle")
    .text(d => d);

  // Pie generator (angle share within each year based on value)
  const pie = d3.pie()
    .sort(null)
    .value(d => d.value || 0);

  // store all ring groups for highlighting
  const ringsGroup = radialGroup.append("g").attr("class", "rings-group");

  years.forEach((yearStr, ringIndex) => {
    const year = +yearStr;

    const yearData = focusSpecialties.map(spec => {
      const row = data.find(d => d.Specialty === spec);
      return {
        specialty: spec,
        value: row ? row[yearStr] : 0,
        year: year
      };
    });

    const innerRadius = innerMostRadius + ringIndex * (ringThickness + ringGap);
    const outerRadius = innerRadius + ringThickness;

    const arcGen = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ring = ringsGroup.append("g")
      .attr("class", "ring")
      .attr("data-year", year);

    ring.selectAll("path")
      .data(pie(yearData))
      .enter()
      .append("path")
      .attr("class", "naloxone-arc")
      .attr("d", arcGen)
      .attr("fill", d => color(d.data.specialty))
      .attr("stroke", "#050818")
      .attr("stroke-width", 1.5)
      .on("mousemove", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.data.specialty}</strong><br>
            Year: ${d.data.year}<br>
            Distributed: ${d.data.value.toLocaleString()}
          `)
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // Year labels along the top
    const labelRadius = (innerRadius + outerRadius) / 2;

    radialGroup.append("text")
      .attr("class", "ring-year-label")
      .attr("data-year", year)
      .attr("x", 0)
      .attr("y", -labelRadius)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text(year);
  });

  // ----------------------------------------
  // LINE CHART (RIGHT PANEL) — unchanged layout
  // ----------------------------------------
  const marginL = { top: 80, right: 40, bottom: 65, left: 60 };
  const widthL = 600, heightL = 500;

  const lineSvg = d3.select("#naloxone-line")
    .append("svg")
    .attr("viewBox", `0 0 ${widthL} ${heightL}`);

  const gL = lineSvg.append("g")
    .attr("transform", `translate(${marginL.left},${marginL.top})`);

  const xL = d3.scalePoint()
    .domain(totals.map(d => d.year))
    .range([0, widthL - marginL.left - marginL.right])
    .padding(0.5);

  const yL = d3.scaleLinear()
    .range([heightL - marginL.top - marginL.bottom, 0])
    .domain([0, d3.max(totals, d => d.total)]).nice();

  gL.append("g")
    .attr("transform", `translate(0,${heightL - marginL.top - marginL.bottom})`)
    .call(d3.axisBottom(xL).tickFormat(d3.format("d")));

  gL.append("text")
    .attr("x", (widthL - marginL.left - marginL.right) / 2)
    .attr("y", heightL - marginL.top - marginL.bottom + 45)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-size", "16px")
    .text("Year");

  gL.append("g").call(d3.axisLeft(yL).ticks(5));

  gL.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(heightL - marginL.top - marginL.bottom) / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-size", "16px")
    .text("Total Naloxone Distribution");

  const line = d3.line()
    .x(d => xL(d.year))
    .y(d => yL(d.total))
    .curve(d3.curveMonotoneX);

  gL.append("path")
    .datum(totals)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  const dots = gL.selectAll(".year-dot")
    .data(totals)
    .enter()
    .append("circle")
    .attr("class", "year-dot")
    .attr("cx", d => xL(d.year))
    .attr("cy", d => yL(d.total))
    .attr("r", 6)
    .attr("fill", "white")
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>Year:</strong> ${d.year}<br>
          <strong>Total distributed:</strong> ${d.total.toLocaleString()}
        `)
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // ----------------------------------------
  // HIGHLIGHT YEAR (link line chart ↔ radial rings)
  // ----------------------------------------
  function highlightYear(year) {
    // Line dots
    dots.attr("fill", d => d.year === year ? "#64B5F6" : "white");

    // Big overlay text, if present
    const overlay = d3.select("#naloxoneYearOverlay");
    if (!overlay.empty()) {
      overlay.text(year);
    }

    // Radial rings
    ringsGroup.selectAll(".ring")
      .attr("opacity", function() {
        const yr = +d3.select(this).attr("data-year");
        return yr === year ? 1 : 0.25;
      });

    // Year labels on rings
    radialGroup.selectAll(".ring-year-label")
      .attr("fill", function() {
        const yr = +d3.select(this).attr("data-year");
        return yr === year
          ? "rgba(255,255,255,1)"
          : "rgba(255,255,255,0.45)";
      })
      .attr("font-weight", function() {
        const yr = +d3.select(this).attr("data-year");
        return yr === year ? "700" : "400";
      });
  }

  dots.on("click", (event, d) => highlightYear(d.year));

  // ----------------------------------------
  // INITIAL STATE
  // ----------------------------------------
  highlightYear(2017);
});
