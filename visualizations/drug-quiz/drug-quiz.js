// ======================================================
//   Drug Use Guessing Quiz — Clean/Modern D3 Version
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

    // Inputs / Buttons
    const inputs = {
      lifetime: document.getElementById("lifetime-guess"),
      pastyear: document.getElementById("pastyear-guess"),
      pastmonth: document.getElementById("pastmonth-guess"),
    };

    const revealBtn = document.getElementById("reveal-answer");
    const resetBtn = document.getElementById("try-again");

    // Container
    const pieChartsContainer = d3.select("#pie-charts");

    let revealed = false;

    // =============================
    // 2. CREATE CHARTS
    // =============================
    charts.forEach((cfg) => {
      createPie(cfg);
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

      // Prevent empty submission
      if (!guesses.lifetime && !guesses.pastyear && !guesses.pastmonth) {
        alert("Please enter at least one guess to begin!");
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
    // 5. PIE CREATION
    // =============================
    function createPie(cfg) {
      const wrap = pieChartsContainer
        .append("div")
        .attr("class", "pie-block")
        .attr("id", `pie-${cfg.id}`);

      wrap.append("div")
        .attr("class", "pie-header")
        .text(cfg.title);

      // SVG setup
      const size = 260;
      const svg = wrap
        .append("svg")
        .attr("width", size)
        .attr("height", size)
        .append("g")
        .attr("transform", `translate(${size / 2}, ${size / 2})`);

      svg.append("circle")
        .attr("class", "pie-bg")
        .attr("r", 110);

      svg.append("g").attr("class", "guess-layer");
      svg.append("g").attr("class", "actual-layer");
      svg.append("g").attr("class", "label-layer");
    }

    // =============================
    // 6. PIE UPDATE
    // =============================
    function updatePie(id, guess, actualVal, showActual) {
      const g = d3.select(`#pie-${id} svg g`);
      const radius = 110;

      const pie = d3.pie().value((d) => d).sort(null);

      const arcGuess = d3.arc().innerRadius(0).outerRadius(radius);
      const arcActual = d3.arc().innerRadius(0).outerRadius(radius - 25);

      const guessData = pie([guess, 100 - guess]);
      const actualData = pie([actualVal, 100 - actualVal]);

      // Guess arcs
      const guessLayer = g.select(".guess-layer").selectAll("path").data(guessData);

      guessLayer.enter()
        .append("path")
        .merge(guessLayer)
        .attr("fill", (_, i) => (i === 0 ? "#4DA3FF" : "rgba(255,255,255,0.08)"))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .transition()
        .duration(600)
        .attrTween("d", function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return (t) => arcGuess(i(t));
        });

      // Actual arcs
      const actualLayer = g.select(".actual-layer").selectAll("path").data(showActual ? actualData : []);

      actualLayer.enter()
        .append("path")
        .merge(actualLayer)
        .attr("fill", (_, i) => (i === 0 ? "rgba(0, 255, 140, 0.6)" : "transparent"))
        .attr("stroke", (_, i) => (i === 0 ? "#00FF8C" : "transparent"))
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "6,4")
        .transition()
        .duration(900)
        .attrTween("d", function (d) {
          const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return (t) => arcActual(i(t));
        });

      // Labels
      const labelLayer = g.select(".label-layer");
      labelLayer.selectAll("*").remove();

      // Guess label
      labelLayer
        .append("text")
        .attr("class", "pie-label-guess")
        .attr("y", showActual ? -12 : 5)
        .text(`${guess.toFixed(1)}%`);

      if (showActual) {
        labelLayer
          .append("text")
          .attr("class", "pie-label-actual")
          .attr("y", 12)
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
          .attr("class", "pie-label-error")
          .attr("y", 34)
          .text(msg);
      }
    }

    console.log("Updated quiz loaded successfully.");
  }
})();
