d3.csv("data/naloxone_distribution.csv").then(raw => {

  // ----------------------------------------
  // FORMAT DATA
  // ----------------------------------------
  const data = raw.map(d => ({
    Specialty: d.Specialty.trim(),
    "2017": +d["2017"],
    "2018": +d["2018"],
    "2019": +d["2019"],
    "2020": +d["2020"],
    "2021": +d["2021"],
    "2022": +d["2022"]
  }));

  const years = ["2017", "2018", "2019", "2020", "2021", "2022"];

  const totals = years.map(yr => ({
    year: +yr,
    total: d3.sum(data, d => d[yr])
  }));


  // ----------------------------------------
  // BAR CHART SETUP
  // ----------------------------------------
  const marginBar = { top: 80, right: 30, bottom: 65, left: 160 };
  const widthBar = 700, heightBar = 500;

  const barSvg = d3.select("#naloxone-bar")
    .append("svg")
    .attr("viewBox", `0 0 ${widthBar} ${heightBar}`);

  barSvg.append("text")
    .attr("class", "chart-title")
    .attr("x", widthBar / 2)
    .attr("y", heightBar - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-size", "18px")
    .text("Top 5 Naloxone Prescribing Specialties in 2017");

  const gBar = barSvg.append("g")
    .attr("transform", `translate(${marginBar.left}, ${marginBar.top})`);

  const x = d3.scaleLinear().range([0, widthBar - marginBar.left - marginBar.right]);
  const y = d3.scaleBand().range([0, heightBar - marginBar.top - marginBar.bottom]).padding(0.25);

  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.Specialty))
    .range(["#0072B2", "#56B4E9", "#009E73", "#88CCEE", "#117733", "#44AA99", "#66CCEE", "#1E88A8", "#2A9D8F", "#6A9FB0"]);


  // ----------------------------------------
  // LINE CHART SETUP (with fixed ticks + dots)
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
    .domain([0, d3.max(totals, d => d.total)])
    .nice();

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


  // ----------------------------------------
  // DOTS — always visible
  // ----------------------------------------
  const dots = gL.selectAll(".year-dot")
    .data(totals)
    .enter()
    .append("circle")
    .attr("class", "year-dot")
    .attr("cx", d => xL(d.year))
    .attr("cy", d => yL(d.total))
    .attr("r", 6)
    .attr("fill", "white")
    .style("cursor", "pointer");


  // ----------------------------------------
  // TOOLTIP
  // ----------------------------------------
  const tooltip = d3.select("body")
    .append("div")
    .attr("id", "naloxone-tooltip")
    .style("position", "absolute")
    .style("background", "#222")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("border", "1px solid #555")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("opacity", 0);


  // ----------------------------------------
  // UPDATE BAR CHART
  // ----------------------------------------
  function updateBars(year) {

    d3.select("#naloxoneYearOverlay").text(year);

    barSvg.select(".chart-title")
      .text(`Top 5 Naloxone Prescribing Specialties in ${year}`);

    const top5 = data
      .map(d => ({ Specialty: d.Specialty, value: d[year] }))
      .sort((a, b) => d3.descending(a.value, b.value))
      .slice(0, 5);

    x.domain([0, d3.max(top5, d => d.value)]);
    y.domain(top5.map(d => d.Specialty));

    const bars = gBar.selectAll("rect")
      .data(top5, d => d.Specialty)
      .join("rect")
      .attr("x", 0)
      .attr("y", d => y(d.Specialty))
      .attr("width", d => x(d.value))
      .attr("height", y.bandwidth())
      .attr("fill", d => colorScale(d.Specialty))
      .style("cursor", "pointer");

    gBar.selectAll(".spec-label")
      .data(top5, d => d.Specialty)
      .join("text")
      .attr("class", "spec-label")
      .attr("x", 8)
      .attr("y", d => y(d.Specialty) + y.bandwidth() / 2)
      .attr("fill", "white")
      .style("font-size", "14px")
      .style("alignment-baseline", "middle")
      .text(d => d.Specialty);

    bars
      .on("mousemove", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>Specialty:</strong> ${d.Specialty}<br>
            <strong>Distributed:</strong> ${d.value.toLocaleString()} units<br>
            <strong>Year:</strong> ${year}
          `)
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  }


  // ----------------------------------------
  // HANDLE CLICK ON LINE CHART DOTS
  // ----------------------------------------
  function highlightYear(year) {
    dots.attr("fill", d => d.year === year ? "#0072B2" : "white");

    updateBars(String(year));
  }

  dots.on("click", (event, d) => highlightYear(d.year));


  // ----------------------------------------
  // INITIAL DISPLAY
  // ----------------------------------------
  highlightYear(2017);

});
