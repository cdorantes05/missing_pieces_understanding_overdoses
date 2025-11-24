// Wait for DOM to be ready and container to have dimensions
function initMap() {
  const container = d3.select("#us-overdose-map");
  const containerNode = container.node();
  
  if (!containerNode) {
    console.error("Container #us-overdose-map not found");
    return;
  }

  // Get dimensions with fallback
  function getDimensions() {
    const rect = containerNode.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    
    // Fallback if dimensions are 0 (container not visible yet)
    if (width === 0 || height === 0) {
      // Use parent section dimensions or viewport as fallback
      const section = containerNode.closest('.section');
      if (section) {
        const sectionRect = section.getBoundingClientRect();
        width = sectionRect.width * 0.9 || window.innerWidth * 0.9;
        height = sectionRect.height * 0.75 || window.innerHeight * 0.75;
      } else {
        width = window.innerWidth * 0.9;
        height = window.innerHeight * 0.75;
      }
    }
    
    return { width, height };
  }

  let { width, height } = getDimensions();

  // Create tooltip element
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "us-map-tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("border", "1px solid rgba(255, 255, 255, 0.2)")
    .style("border-radius", "8px")
    .style("padding", "12px 16px")
    .style("font-family", "Inter, sans-serif")
    .style("font-size", "14px")
    .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.3)")
    .style("z-index", "1000");

  const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

  // ✅ Updated color scale to match your real dataset (4.3 → 71.6)
  const color = d3.scaleSequential()
    .interpolator(d3.interpolateReds)
    .domain([5, 72]);

  // Projection & path - will be updated when data loads
  let projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width * 0.62);

  let path = d3.geoPath().projection(projection);

  // Legend SVG reference (will be set when legend is created)
  let legendSvg;

  // Convert FIPS → State Name
  function getStateName(fips) {
    // Ensure FIPS is always a 2–digit string
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

  // Load map + overdose data
  function cleanStateName(s) {
    return s
      .replace(/\r/g, "")      // remove CR
      .replace(/\n/g, "")      // remove stray LF if any
      .replace(/"/g, "")
      .trim();
  }

  // ✅ Updated Legend to match new domain
  function createLegend() {
    const legendWidth = 20;
    const legendHeight = 200;
    const legendMargin = { top: 20, right: 50 };

    // Remove existing legend if it exists
    svg.selectAll(".legend").remove();

    legendSvg = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - legendMargin.right - 150}, ${height / 2 - legendHeight / 2})`);

    const defs = svg.append("defs");

    // Remove existing gradient if it exists
    defs.selectAll("#legend-gradient").remove();

    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%").attr("y1", "100%")
      .attr("x2", "0%").attr("y2", "0%");

    const legendStops = d3.range(0, 1.01, 0.1);

    gradient.selectAll("stop")
      .data(legendStops)
      .enter()
      .append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => color(5 + d * (72 - 5)));

    legendSvg.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
      .domain([5, 72])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .tickValues([5, 20, 40, 60, 72])
      .tickSize(3);

    legendSvg.append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll("text")
      .style("fill", "#eee")
      .style("font-size", "12px");

    legendSvg.append("text")
      .attr("x", -40)
      .attr("y", -10)
      .attr("fill", "#fff")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Deaths per 100k (2023)");
  }

  // Function to update legend position
  function updateLegend() {
    if (!legendSvg) return;
    const legendMargin = { top: 20, right: 50 };
    const legendHeight = 200;
    legendSvg.attr("transform", `translate(${width - legendMargin.right - 150}, ${height / 2 - legendHeight / 2})`);
  }

  // Function to update projection and path when dimensions change
  function updateProjection() {
    const dims = getDimensions();
    width = dims.width;
    height = dims.height;
    
    projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width * 0.62);
    
    path = d3.geoPath().projection(projection);
    
    // Update SVG viewBox
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    
    // Update paths if they exist
    svg.selectAll("path.state-path").attr("d", path);
    
    // Update legend position
    updateLegend();
  }

  // Load map + overdose data
  Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.csv("data/overdose_rates_us.csv")
  ]).then(([us, data]) => {

    // Recalculate dimensions in case they've changed
    const dims = getDimensions();
    width = dims.width;
    height = dims.height;
    
    // Update projection with final dimensions
    projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width * 0.62);
    
    path = d3.geoPath().projection(projection);
    
    // Update SVG viewBox
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Convert rates to numbers & clean state names
    const rateByState = new Map(
      data.map(d => [cleanStateName(d.state), +d.rate])
    );

    rateByState.set("Alabama", 25.7);
    
    const states = topojson.feature(us, us.objects.states).features;

    // Draw states
    svg.selectAll("path.state-path")
      .data(states)
      .enter()
      .append("path")
      .attr("class", "state-path")
      .attr("d", path)
      .attr("fill", d => {
        const name = getStateName(d.id);
        const rate = rateByState.get(name);
        return rate ? color(rate) : "#444";
      })
      .attr("stroke", "#2e2e2e")
      .attr("stroke-width", 0.6)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        const name = getStateName(d.id);
        const rate = rateByState.get(name);
        
        if (rate) {
          const stateColor = color(rate);
          const formattedRate = rate.toFixed(1);
          
          tooltip
            .html(`
              <div style="margin-bottom: 6px;">
                <strong style="color: ${stateColor}; font-size: 16px;">${name}</strong>
              </div>
              <div style="color: #ccc; font-size: 13px;">
                ${formattedRate} fatal overdose deaths per 100K people
              </div>
            `)
            .style("opacity", 1);
        }
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      });
    
    // Create legend after map is drawn
    createLegend();
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      updateProjection();
    }, 250);
  });

  // Use Intersection Observer to recalculate when section becomes visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Recalculate dimensions when section is visible
        updateProjection();
      }
    });
  }, { threshold: 0.1 });

  const section = containerNode.closest('.section');
  if (section) {
    observer.observe(section);
  }
}

// Initialize the map when DOM is ready
function tryInitMap() {
  const container = document.querySelector("#us-overdose-map");
  if (!container) {
    // Container not found yet, try again after a short delay
    setTimeout(tryInitMap, 100);
    return;
  }
  
  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    // Container has no dimensions yet, try again
    setTimeout(tryInitMap, 100);
    return;
  }
  
  // Container exists and has dimensions, initialize
  initMap();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInitMap);
} else {
  // DOM is already ready, but wait a bit for CSS to apply
  setTimeout(tryInitMap, 50);
}
