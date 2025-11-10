d3.csv("data/naloxone_distribution.csv").then(raw => {
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
  
    // ------ Line Chart Data ------
    const totals = years.map(year => ({
      year: +year,
      total: d3.sum(data, d => d[year])
    }));
  
    const marginBar = { top: 80, right: 30, bottom: 45, left: 160 };
    const widthBar = 700, heightBar = 500;
    const barSvg = d3.select("#naloxone-bar")
      .append("svg")
      .attr("viewBox", `0 0 ${widthBar} ${heightBar}`);
  
    const gBar = barSvg.append("g")
      .attr("transform", `translate(${marginBar.left}, ${marginBar.top})`);
  
    const x = d3.scaleLinear().range([0, widthBar - marginBar.left - marginBar.right]);
    const y = d3.scaleBand().range([0, heightBar - marginBar.top - marginBar.bottom]).padding(0.25);
  
    const barColor = "#DC143C"; // same color for all bars
  
    // ------ Line Chart ------
    const marginL = { top: 80, right: 40, bottom: 45, left: 60 };
    const widthL = 600, heightL = 500;
    const lineSvg = d3.select("#naloxone-line")
      .append("svg")
      .attr("viewBox", `0 0 ${widthL} ${heightL}`);
  
    const gL = lineSvg.append("g")
      .attr("transform", `translate(${marginL.left},${marginL.top})`);
  
    const xL = d3.scaleLinear().range([0, widthL - marginL.left - marginL.right]).domain([2017, 2022]);
    const yL = d3.scaleLinear().range([heightL - marginL.top - marginL.bottom, 0])
      .domain([0, d3.max(totals, d => d.total)]).nice();
  
    gL.append("g")
      .attr("transform", `translate(0,${heightL - marginL.top - marginL.bottom})`)
      .call(d3.axisBottom(xL).tickFormat(d3.format("d")));
  
    gL.append("g")
      .call(d3.axisLeft(yL).ticks(5));
  
    const line = d3.line()
      .x(d => xL(d.year))
      .y(d => yL(d.total))
      .curve(d3.curveMonotoneX);
  
    gL.append("path")
      .datum(totals)
      .attr("fill", "none")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2.5)
      .attr("d", line);
  
    const hoverCircle = gL.append("circle")
      .attr("r", 6)
      .attr("fill", "#ffffff")
      .attr("stroke", "#DC143C")
      .attr("stroke-width", 2)
      .style("opacity", 0);
  
    const overlay = gL.append("rect")
      .attr("width", widthL - marginL.left - marginL.right)
      .attr("height", heightL - marginL.top - marginL.bottom)
      .attr("fill", "transparent")
      .style("cursor", "pointer");
  
    function updateBars(year) {
      d3.select("#naloxoneYearOverlay").text(year);
  
      const top5 = data
        .map(d => ({ Specialty: d.Specialty, value: d[year] }))
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 5);
  
      x.domain([0, d3.max(top5, d => d.value)]);
      y.domain(top5.map(d => d.Specialty));
  
      gBar.selectAll("rect")
        .data(top5, d => d.Specialty)
        .join("rect")
        .attr("x", 0)
        .attr("y", d => y(d.Specialty))
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth())
        .attr("fill", barColor);
  
      // Labels
      gBar.selectAll("text")
        .data(top5, d => d.Specialty)
        .join("text")
        .attr("x", d => x(d.value) + 8)
        .attr("y", d => y(d.Specialty) + y.bandwidth() / 2)
        .attr("fill", "#fff")
        .style("alignment-baseline", "middle")
        .text(d => d.value.toLocaleString());
    }
  
    updateBars("2017"); // initial
  
    overlay.on("mousemove", (event) => {
      const [mx] = d3.pointer(event, overlay.node());
      const yearGuess = Math.round(xL.invert(mx));
      const nearest = Math.min(2022, Math.max(2017, yearGuess));
      const pt = totals.find(d => d.year === nearest);
  
      hoverCircle
        .attr("cx", xL(pt.year))
        .attr("cy", yL(pt.total))
        .style("opacity", 1);
  
      updateBars(String(nearest));
    });
  });
  