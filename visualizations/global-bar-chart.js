const overdoseData = [
  { name: "United States", overdoseRate: 324.0 },
  { name: "Puerto Rico", overdoseRate: 246.0 },
  { name: "UK (Scotland)", overdoseRate: 219.0 },
  { name: "Canada", overdoseRate: 193.0 },
  { name: "UK (Wales)", overdoseRate: 102.0 },
  { name: "Iceland", overdoseRate: 93.0 },
  { name: "Sweden", overdoseRate: 82.0 },
  { name: "UK (N. Ireland)", overdoseRate: 81.0 },
  { name: "UK (England)", overdoseRate: 80.0 },
  { name: "Finland", overdoseRate: 71.0 }
];

const container = d3.select("#overdose-bar-chart").node();
const containerWidth = container.offsetWidth;
const containerHeight = container.offsetHeight;

const margin = { top: 20, right: 40, bottom: 20, left: 120 };
const width = containerWidth - margin.left - margin.right;
const height = containerHeight - margin.top - margin.bottom;

const svg = d3.select("#overdose-bar-chart")
  .append("svg")
  .attr("width", containerWidth)
  .attr("height", containerHeight);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear()
  .domain([0, d3.max(overdoseData, d => d.overdoseRate)])
  .range([0, width]);

const y = d3.scaleBand()
  .domain(overdoseData.map(d => d.name))
  .range([0, height])
  .padding(0.1);

g.append("g")
  .call(d3.axisLeft(y))
  .selectAll("text")
  .style("fill", "#fff")
  .style("font-size", "12px");

g.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x))
  .selectAll("text")
  .style("fill", "#fff");

g.selectAll(".bar")
  .data(overdoseData)
  .enter().append("rect")
  .attr("class", "bar")
  .attr("y", d => y(d.name))
  .attr("height", y.bandwidth())
  .attr("x", 0)
  .attr("width", d => x(d.overdoseRate))
  .attr("fill", "#ff9999")
  .attr("id", (d, i) => `bar-${i}`);

g.append("text")
  .attr("x", width / 2)
  .attr("y", height + 40)
  .style("text-anchor", "middle")
  .style("fill", "#fff")
  .style("font-size", "12px")
  .text("Deaths per 1 Million Population (2022)");

// Sync with globe
let currentIndex = 0;
let cycleCount = 0;

function highlightBar(index) {
  d3.selectAll(".bar").attr("fill", "#ff9999");
  d3.select(`#bar-${index}`).attr("fill", "#e60000");
  currentIndex = index;
  
  // Update country context
  const country = overdoseData[index];
  const contextElement = document.getElementById('country-rate');
  if (contextElement) {
    contextElement.textContent = `${country.overdoseRate} deaths for every 1 million people`;
  }
}

function cycleBars() {
  highlightBar(currentIndex);
  currentIndex = (currentIndex + 1) % overdoseData.length;
  
  if (currentIndex === 0) cycleCount++;
  
  if (cycleCount < 1) {
    setTimeout(cycleBars, 3300);
  } else {
    enableBarClicks();
  }
}

function enableBarClicks() {
  g.selectAll(".bar")
    .style("cursor", "pointer")
    .on("click", function(event, d) {
      const index = overdoseData.indexOf(d);
      highlightBar(index);
      window.frames[0].postMessage({type: 'selectCountry', index: index}, '*');
    });
}

// Listen for messages from globe
window.addEventListener('message', function(event) {
  if (event.data.type === 'countrySelected') {
    highlightBar(event.data.index);
  }
});

setTimeout(cycleBars, 2000);