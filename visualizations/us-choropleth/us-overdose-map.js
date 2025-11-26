// ==========================================
//  U.S. OVERDOSE MAP — LINKED VIEW
//  Left: Choropleth map
//  Right: Detail panel with state stats + mini drug bubbles
// ==========================================

(function() {
  'use strict';

  // Initialize when container is ready & sized
  function tryInitMap() {
    const container = document.querySelector("#us-overdose-map");
    if (!container) {
      setTimeout(tryInitMap, 100);
      return;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(tryInitMap, 100);
      return;
    }

    initMap(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitMap);
  } else {
    setTimeout(tryInitMap, 50);
  }

  // ==========================================
  //  MAIN INIT
  // ==========================================
  function initMap(containerNode) {
    const container = d3.select(containerNode);

    // ===== basic layout: map left, detail right =====
    const layout = container
      .append("div")
      .attr("class", "us-map-linked-layout")
      .style("display", "flex")
      .style("flex-direction", "row")
      .style("align-items", "stretch")
      .style("justify-content", "space-between")
      .style("gap", "2rem")
      .style("width", "100%")
      .style("height", "100%");

    const mapColumn = layout
      .append("div")
      .attr("class", "us-map-column")
      .style("flex", "1 1 60%")
      .style("position", "relative")
      .style("min-height", "320px");

    const detailColumn = layout
      .append("div")
      .attr("class", "us-detail-column")
      .style("flex", "1 1 35%")
      .style("margin-top", "30px")
      .style("background", "rgba(15, 15, 15, 0.5)")
      .style("border-radius", "18px")
      .style("border", "1px solid rgba(255, 255, 255, 0.12)")
      .style("padding", "18px 20px")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "10px")
      .style("box-shadow", "0 18px 45px rgba(0, 0, 0, 0.55)")
      .style("max-height", "380px")   // adjust ↑↓
      .style("overflow", "hidden");


    // ===== dimensions for map SVG =====
    function getDimensions() {
      const rect = containerNode.getBoundingClientRect();
      let width = rect.width || window.innerWidth * 0.9;
      let height = rect.height || window.innerHeight * 0.7;

      // Prefer a wide layout for map
      if (height < 350) height = 350;

      return { width, height };
    }

    let { width, height } = getDimensions();

    // ===== color scale (domain set after data load) =====
    const color = d3.scaleSequential(d3.interpolateReds).clamp(true);
    let colorDomain = [5, 72]; // fallback

    // ===== projection & path (updated on resize) =====
    let projection = d3.geoAlbersUsa()
      .translate([width * 0.3, height / 2])
      .scale(width * 0.45);

    let path = d3.geoPath().projection(projection);

    // ===== SVG for map =====
    const svg = mapColumn
      .append("svg")
      .attr("class", "us-overdose-map-svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "100%");

    // // slight dark background behind map
    // svg.append("rect")
    //   .attr("class", "map-bg")
    //   .attr("x", 0)
    //   .attr("y", 0)
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("fill", "linear-gradient(135deg, #2e2e2e 0%, #181818 100%)");

    // group for states
    const statesGroup = svg.append("g")
      .attr("class", "states-group");

    // legend placeholder
    let legendSvg = null;

    // ==========================================
    //  RIGHT DETAIL PANEL SETUP
    // ==========================================
    // const panelTitle = detailColumn.append("div")
    //   .attr("class", "detail-title")
    //   .style("font-size", "14px")
    //   .style("letter-spacing", "0.12em")
    //   .style("text-transform", "uppercase")
    //   .style("color", "rgba(255,255,255,0.75)")
    //   .style("margin-bottom", "4px")
    //   .text("Zooming in: the U.S. perspective");

    const stateNameEl = detailColumn.append("div")
      .attr("class", "detail-state-name")
      .style("font-size", "22px")
      .style("font-weight", "700")
      .style("color", "#ffffff");

    const rateEl = detailColumn.append("div")
      .attr("class", "detail-state-rate")
      .style("font-size", "15px")
      .style("color", "rgba(255,255,255,0.85)");

    const hintEl = detailColumn.append("div")
      .attr("class", "detail-hint")
      .style("font-size", "13px")
      .style("color", "rgba(255,255,255,0.6)")
      .style("margin-top", "4px");
      // .text("Hover over a state on the map to see its overdose profile.")

    const divider = detailColumn.append("div")
      .style("height", "1px")
      .style("margin", "10px 0 8px")
      .style("background", "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02))");

    const drugLabel = detailColumn.append("div")
      .attr("class", "detail-drug-label")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("color", "rgba(255,255,255,0.8)")
      .text("Top drugs involved in overdoses in this state:");

    const drugSubLabel = detailColumn.append("div")
      .attr("class", "detail-drug-sublabel")
      .style("font-size", "12px")
      .style("color", "rgba(255,255,255,0.55)");
      // .text("Each circle represents a leading category of drugs; bubbles re-arrange as you move between states.");

    // Mini-bubble SVG
    const bubbleSvg = detailColumn.append("svg")
      .attr("class", "detail-drug-bubbles-svg")
      .attr("viewBox", "0 0 260 160")
      .style("width", "100%")
      .style("height", "170px")
      .style("margin-top", "8px");

    const bubbleGroup = bubbleSvg.append("g")
      .attr("transform", "translate(130, 80)");

    // For text when no drug data
    const noDrugText = bubbleGroup.append("text")
      .attr("class", "no-drug-text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("fill", "rgba(255,255,255,0.55)")
      .style("font-size", "12px")
      .text("No drug breakdown data for this state.");

    let bubbleSimulation = null;

    // drug color mapping similar to drug-bubble-chart.js
    const DRUG_COLORS = {
      "Fentanyl": "#B22222",
      "Heroin": "#DC143C",
      "Stimulants": "#FF4500",
      "Cocaine": "#CD5C5C",
      "Methamphetamine": "#FF6347",
      "Benzodiazepines": "#FFA07A",
      "Other/Opiods": "#6A5ACD",
      "Other": "#6A5ACD"
    };

    function normalizeDrug(raw) {
      if (!raw) return null;
      const s = raw.toLowerCase().replace(/,$/, "").trim();

      if (s.includes("fentanyl")) return "Fentanyl";
      if (s.includes("heroin")) return "Heroin";
      if (s.includes("stimulant")) return "Stimulants";
      if (s.includes("cocaine")) return "Cocaine";
      if (s.includes("meth")) return "Methamphetamine";
      if (s.includes("benzo")) return "Benzodiazepines";
      if (s.includes("opioid") || s.includes("opiates")) return "Other/Opiods";

      return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : null;
    }

    function colorForDrug(raw) {
      const name = normalizeDrug(raw);
      if (!name) return "#4B9CD3";
      return DRUG_COLORS[name] || "#4B9CD3";
    }

    function updateDrugBubbles(drugList) {
      // process & dedupe
      const cleanNames = Array.from(
        new Set(
          (drugList || [])
            .map(d => d && d.toString())
            .map(d => d.replace(/\r|\n/g, "").trim())
            .filter(d => d.length)
        )
      );

      // If no data, show fallback text
      if (!cleanNames.length) {
        bubbleGroup.selectAll("circle").remove();
        bubbleGroup.selectAll("text.drug-label").remove();

        noDrugText
          .transition()
          .duration(250)
          .style("opacity", 1);

        return;
      }

      noDrugText
        .transition()
        .duration(200)
        .style("opacity", 0);

      const nodes = cleanNames.map(name => ({
        name: normalizeDrug(name),
        rawName: name,
        radius: 28,
        color: colorForDrug(name)
      }));

      if (bubbleSimulation) {
        bubbleSimulation.stop();
      }

      bubbleSimulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(2))
        .force("center", d3.forceCenter(0, 0))
        .force("collision", d3.forceCollide().radius(d => d.radius + 2));

      // circles
      const circles = bubbleGroup.selectAll("circle.drug-bubble")
        .data(nodes, d => d.name);

      circles.exit()
        .transition()
        .duration(250)
        .attr("r", 0)
        .style("opacity", 0)
        .remove();

      const circlesEnter = circles.enter()
        .append("circle")
        .attr("class", "drug-bubble")
        .attr("r", 0)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", d => d.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5)
        .style("opacity", 0.0);

      const allCircles = circlesEnter.merge(circles);

      allCircles
        .transition()
        .duration(550)
        .delay((d, i) => i * 80)
        .attr("r", d => d.radius)
        .style("opacity", 0.9);

      // labels
      const labels = bubbleGroup.selectAll("text.drug-label")
        .data(nodes, d => d.name);

      labels.exit()
        .transition()
        .duration(200)
        .style("opacity", 0)
        .remove();

      const labelsEnter = labels.enter()
        .append("text")
        .attr("class", "drug-label")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("fill", "#ffffff")
        .style("font-weight", "600")
        .style("font-size", "11px")
        .style("pointer-events", "none")
        .style("opacity", 0);

      const allLabels = labelsEnter.merge(labels);

      allLabels
        .text(d => d.name)
        .transition()
        .duration(550)
        .delay((d, i) => i * 80 + 200)
        .style("opacity", 1);

      // tie positions to simulation
      bubbleSimulation.on("tick", () => {
        allCircles
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        allLabels
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      });
    }

    // ==========================================
    //  LEGEND
    // ==========================================
    function createLegend() {
      const legendWidth = 20;
      const legendHeight = 200;
      const legendMargin = { right: 40 };

      svg.selectAll(".legend").remove();
      svg.selectAll("defs #legend-gradient").remove();

      const defs = svg.append("defs");

      const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("y1", "100%")
        .attr("x2", "0%").attr("y2", "0%");

      const [minRate, maxRate] = colorDomain;
      const legendStops = d3.range(0, 1.01, 0.1);

      gradient.selectAll("stop")
        .data(legendStops)
        .enter()
        .append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(minRate + d * (maxRate - minRate)));

      legendSvg = svg.append("g")
        .attr("class", "legend");

      const legendX = width - legendMargin.right - legendWidth - 20;
      const legendY = height / 2 - legendHeight / 2;

      legendSvg.attr("transform", `translate(${legendX}, ${legendY})`);

      legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

      const legendScale = d3.scaleLinear()
        .domain([minRate, maxRate])
        .range([legendHeight, 0]);

      const tickValues = d3.ticks(minRate, maxRate, 4);

      const legendAxis = d3.axisRight(legendScale)
        .tickValues(tickValues)
        .tickSize(3)
        .tickFormat(d => d.toFixed(1));

      legendSvg.append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis)
        .selectAll("text")
        .style("fill", "#eee")
        .style("font-size", "11px");

      legendSvg.append("text")
        .attr("x", -40)
        .attr("y", -10)
        .attr("fill", "#fff")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .text("Deaths per 100k (2023)");
    }

    function updateProjection() {
      const dims = getDimensions();
      width = dims.width;
      height = dims.height;

      projection = d3.geoAlbersUsa()
        .translate([width * 0.5, height / 2])
        .scale(width * 1.1);

      path = d3.geoPath().projection(projection);

      svg
        .attr("viewBox", `0 0 ${width} ${height}`);

      svg.select("rect.map-bg")
        .attr("width", width)
        .attr("height", height);

      svg.selectAll("path.state-path")
        .attr("d", path);

      if (legendSvg) {
        const legendWidth = 20;
        const legendHeight = 200;
        const legendMargin = { right: 40 };
        const legendX = width - legendMargin.right - legendWidth - 20;
        const legendY = height / 2 - legendHeight / 2;
        legendSvg.attr("transform", `translate(${legendX}, ${legendY})`);
      }
    }

    window.addEventListener("resize", () => {
      // debounce-ish
      clearTimeout(window.__usMapResizeTimer);
      window.__usMapResizeTimer = setTimeout(updateProjection, 220);
    });

    const section = containerNode.closest('.section');
    if (section) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateProjection();
          }
        });
      }, { threshold: 0.1 });

      observer.observe(section);
    }

    // ==========================================
    //  STATE NAME HELPER (FIPS -> Name)
    // ==========================================
    function getStateName(fips) {
      const key = String(fips).padStart(2, "0");

      const mapping = {
        "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas",
        "06": "California", "08": "Colorado", "09": "Connecticut", "10": "Delaware",
        "11": "District of Columbia", "12": "Florida", "13": "Georgia", "15": "Hawaii",
        "16": "Idaho", "17": "Illinois", "18": "Indiana", "19": "Iowa",
        "20": "Kansas", "21": "Kentucky", "22": "Louisiana", "23": "Maine",
        "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
        "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska",
        "32": "Nevada", "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico",
        "36": "New York", "37": "North Carolina", "38": "North Dakota", "39": "Ohio",
        "40": "Oklahoma", "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island",
        "45": "South Carolina", "46": "South Dakota", "47": "Tennessee", "48": "Texas",
        "49": "Utah", "50": "Vermont", "51": "Virginia", "53": "Washington",
        "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
      };

      return mapping[key];
    }

    function cleanStateName(s) {
      return (s || "")
        .replace(/\r|\n/g, "")
        .replace(/"/g, "")
        .trim();
    }

    // ==========================================
    //  DATA LOADING & LINKED INTERACTION
    // ==========================================
    let stateData = new Map();

    // function will be defined after data load; placeholder here
    let setActiveState = function() {};

    Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
      d3.csv("data/overdose_rates.csv")
    ]).then(([us, data]) => {
      // preprocess CSV
      data.forEach(d => {
        const name = cleanStateName(d.state);
        const rate = +d.rate;
        const drugs = (d.drug || "")
          .split(",")
          .map(x => x.replace(/\r|\n/g, "").trim())
          .filter(x => x.length);

        stateData.set(name, { rate, drugs });
      });

      const rates = data
        .map(d => +d.rate)
        .filter(v => !isNaN(v));

      if (rates.length) {
        const minRate = d3.min(rates);
        const maxRate = d3.max(rates);
        colorDomain = [minRate, maxRate];
        color.domain(colorDomain);
      } else {
        color.domain(colorDomain);
      }

      const states = topojson.feature(us, us.objects.states).features;

      // draw states
      const statePaths = statesGroup.selectAll("path.state-path")
        .data(states)
        .enter()
        .append("path")
        .attr("class", "state-path")
        .attr("d", path)
        .attr("fill", d => {
          const name = getStateName(d.id);
          const info = stateData.get(name);
          const rate = info ? info.rate : null;
          return rate != null && !isNaN(rate) ? color(rate) : "#444";
        })
        .attr("stroke", "#2e2e2e")
        .attr("stroke-width", 0.8)
        .style("cursor", "pointer")
        .style("transition", "fill 200ms ease-out, stroke-width 200ms ease-out");

      // define linked interaction
      setActiveState = function(stateName) {
        const info = stateData.get(stateName);

        // highlight on map
        statePaths
          .transition()
          .duration(150)
          .attr("stroke-width", d =>
            getStateName(d.id) === stateName ? 1.7 : 0.8
          )
          .attr("stroke", d =>
            getStateName(d.id) === stateName ? "#ffffff" : "#2e2e2e"
          );

        // update panel text
        const rate = info && info.rate != null && !isNaN(info.rate)
          ? info.rate
          : null;

        stateNameEl
          .transition()
          .duration(180)
          .style("opacity", 0.0)
          .on("end", () => {
            stateNameEl
              .text(stateName || "No data")
              .transition()
              .duration(220)
              .style("opacity", 1.0);
          });

        rateEl
          .transition()
          .duration(180)
          .style("opacity", 0.0)
          .on("end", () => {
            if (rate != null) {
              rateEl.text(`${rate.toFixed(1)} fatal overdose deaths per 100,000 people.`);
            } else {
              rateEl.text("No overdose rate data available.");
            }
            rateEl
              .transition()
              .duration(220)
              .style("opacity", 1.0);
          });

        hintEl
          .transition()
          .duration(200)
          .style("opacity", 0.4);

        // update drug bubbles
        const drugs = info ? info.drugs : [];
        updateDrugBubbles(drugs);
      };

      // attach events
      statePaths
        .on("mouseover", function(event, d) {
          const name = getStateName(d.id);
          if (!name) return;
          d3.select(this)
            .raise()
            .transition()
            .duration(120)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1.7);
          setActiveState(name);
        })
        .on("mouseout", function(event, d) {
          const name = getStateName(d.id);
          if (!name) return;

          // keep selected look via setActiveState; here we just gently relax non-hovered states
          d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", d2 =>
              getStateName(d2.id) === name ? 1.7 : 0.8
            );
        })
        .on("click", function(event, d) {
          const name = getStateName(d.id);
          if (!name) return;
          setActiveState(name);
        });

      // create legend now that color domain is known
      createLegend();

      // optional: set a nice default (e.g., first state in CSV)
      if (data.length) {
        const defaultState = cleanStateName(data[0].state);
        setActiveState(defaultState);
      }
    }).catch(err => {
      console.error("Error loading map or overdose data:", err);
      stateNameEl.text("Error loading overdose data");
      rateEl.text("Please check the data file path or format.");
    });
  }

})();
