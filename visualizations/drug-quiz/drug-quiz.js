// ======================================================
//   Drug Use Guessing Quiz — Three Column Layout
//   Fits the aesthetic of your overdose dashboards
// ======================================================
(function () {
  "use strict";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQuiz);
  } else {
    initQuiz();
  }

  function initQuiz() {
    console.log("Initializing updated Drug Use Quiz...");

    // =============================
    // 1. CONSTANTS
    // =============================
    const actual = {
      lifetime: 52.0,
      pastYear: 25.5,
      pastMonth: 16.7,
    };

    const charts = [
      { id: "lifetime", title: "Lifetime Use", actual: actual.lifetime },
      { id: "pastyear", title: "Past Year Use", actual: actual.pastYear },
      { id: "pastmonth", title: "Past Month Use", actual: actual.pastMonth },
    ];

    // Buttons
    const revealBtn = document.getElementById("drugs-quiz-reveal");
    const resetBtn = document.getElementById("drugs-quiz-reset");

    // Container
    const pieChartsContainer = d3.select("#drugs-quiz-charts");

    // Store input references
    const inputs = {};

    let revealed = false;

    // =============================
    // 2. CREATE COLUMNS WITH CHARTS
    // =============================
    charts.forEach((cfg) => {
      const column = createColumn(cfg);
      inputs[cfg.id] = column.input;
      
      inputs[cfg.id].addEventListener("input", () => {
        const val = parseFloat(inputs[cfg.id].value) || 0;
        updatePie(cfg.id, val, cfg.actual, revealed);
      });
    });

    // =============================
    // 3. BUTTON — REVEAL ANSWERS
    // =============================
    revealBtn.addEventListener("click", () => {
      const guesses = {
        lifetime: parseFloat(inputs.lifetime.value) || 0,
        pastyear: parseFloat(inputs.pastyear.value) || 0,
        pastmonth: parseFloat(inputs.pastmonth.value) || 0,
      };

      // Require ALL inputs to have values
      if (!guesses.lifetime || !guesses.pastyear || !guesses.pastmonth) {
        alert("Please enter a percentage for all three categories!");
        return;
      }

      revealed = true;

      charts.forEach((cfg) => {
        updatePie(cfg.id, guesses[cfg.id], cfg.actual, true);
        inputs[cfg.id].disabled = true;
      });

      revealBtn.style.display = "none";
      resetBtn.style.display = "inline-block";
    });

    // =============================
    // 4. BUTTON — RESET QUIZ
    // =============================
    resetBtn.addEventListener("click", () => {
      revealed = false;

      Object.keys(inputs).forEach((key) => {
        inputs[key].value = "";
        inputs[key].disabled = false;
      });

      charts.forEach((cfg) => {
        updatePie(cfg.id, 0, cfg.actual, false);
      });

      resetBtn.style.display = "none";
      revealBtn.style.display = "inline-block";
    });

    // =============================
    // 5. COLUMN CREATION
    // =============================
    function createColumn(cfg) {
      // Create column wrapper
      const column = pieChartsContainer
        .append("div")
        .attr("class", "drugs-quiz-column")
        .attr("id", `drugs-quiz-column-${cfg.id}`);

      // Add title
      column.append("div")
        .attr("class", "drugs-quiz-column-title")
        .text(cfg.title);

      // Add input
      const inputNode = column.append("input")
        .attr("type", "number")
        .attr("class", "drugs-quiz-input")
        .attr("id", `drugs-quiz-${cfg.id}-input`)
        .attr("placeholder", "Enter %")
        .attr("min", "0")
        .attr("max", "100")
        .attr("step", "0.1")
        .node();

      // Add pie chart
      createPie(column, cfg);

      return {
        input: inputNode,
        column: column
      };
    }

    // =============================
    // 6. PIE CREATION
    // =============================
    function createPie(column, cfg) {
      const wrap = column
        .append("div")
        .attr("class", "drugs-quiz-pie-block")
        .attr("id", `drugs-quiz-pie-${cfg.id}`)
        .style("display", "flex")
        .style("justify-content", "center");

      // SVG setup
      const size = 260;
      const svg = wrap
        .append("svg")
        .attr("width", size)
        .attr("height", size)
        .append("g")
        .attr("transform", `translate(${size / 2}, ${size / 2})`);

      // Background circle - transparent fill, white stroke
      svg.append("circle")
        .attr("class", "drugs-quiz-pie-bg")
        .attr("r", 110)
        .attr("fill", "transparent")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      svg.append("g").attr("class", "drugs-quiz-guess-layer");
      svg.append("g").attr("class", "drugs-quiz-actual-layer");
      svg.append("g").attr("class", "drugs-quiz-label-layer");
    }

    // =============================
    // 7. PIE UPDATE
    // =============================
    function updatePie(id, guess, actualVal, showActual) {
      const g = d3.select(`#drugs-quiz-pie-${id} svg g`);
      const radius = 110;

      const pie = d3.pie().value((d) => d).sort(null);

      const arcGuess = d3.arc().innerRadius(0).outerRadius(radius);
      const arcActual = d3.arc().innerRadius(0).outerRadius(radius - 25);

      const guessData = pie([guess, 100 - guess]);
      const actualData = pie([actualVal, 100 - actualVal]);

      // Guess arcs - Light Red
      const guessLayer = g.select(".drugs-quiz-guess-layer").selectAll("path").data(guessData);

      guessLayer.enter()
        .append("path")
        .merge(guessLayer)
        .attr("fill", (_, i) => (i === 0 ? "#6bc5fdff" : "transparent"))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .transition()
        .duration(600)
        .attrTween("d", function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return (t) => arcGuess(i(t));
        });

      // Actual arcs - Vibrant Red
      const actualLayer = g.select(".drugs-quiz-actual-layer").selectAll("path").data(showActual ? actualData : []);

      actualLayer.enter()
        .append("path")
        .merge(actualLayer)
        .attr("fill", (_, i) => (i === 0 ? "rgba(255, 51, 51, 0.6)" : "transparent"))
        .attr("stroke", (_, i) => (i === 0 ? "#FF3333" : "transparent"))
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "6,4")
        .transition()
        .duration(900)
        .attrTween("d", function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return (t) => arcActual(i(t));
        });

      actualLayer.exit().remove();

      // Labels - White text
      const labelLayer = g.select(".drugs-quiz-label-layer");
      labelLayer.selectAll("*").remove();

      // Guess label
      labelLayer
        .append("text")
        .attr("class", "drugs-quiz-pie-label-guess")
        .attr("y", showActual ? -12 : 5)
        .attr("fill", "#fff")
        .attr("font-size", "24px")
        .attr("font-weight", "600")
        .attr("text-anchor", "middle")
        .text(`${guess.toFixed(1)}%`);

      if (showActual) {
        labelLayer
          .append("text")
          .attr("class", "drugs-quiz-pie-label-actual")
          .attr("y", 12)
          .attr("fill", "#fff")
          .attr("font-size", "20px")
          .attr("font-weight", "500")
          .attr("text-anchor", "middle")
          .text(`${actualVal.toFixed(1)}%`);

        const diff = guess - actualVal;
        const msg =
          diff === 0
            ? "Perfect!"
            : diff > 0
            ? `+${Math.abs(diff).toFixed(1)}%`
            : `-${Math.abs(diff).toFixed(1)}%`;

        labelLayer
          .append("text")
          .attr("class", "drugs-quiz-pie-label-error")
          .attr("y", 34)
          .attr("fill", "#fff")
          .attr("font-size", "16px")
          .attr("font-weight", "400")
          .attr("text-anchor", "middle")
          .text(msg);
      }
    }

    console.log("Updated quiz loaded successfully.");
  }
})();