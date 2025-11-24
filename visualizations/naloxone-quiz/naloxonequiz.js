// ==========================================
//  NALOXONE QUIZ — FULLY ISOLATED MODULE v2
//  (Drag Handle + Click Lock + Keyboard Accessible)
// ==========================================

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", initNaloxoneQuiz);

  function initNaloxoneQuiz() {
    console.log("Naloxone quiz module initialized ✓");

    const quizData = [
      { id: "know", question: "Know what naloxone is", trueValue: 46 },
      { id: "carry", question: "Carry naloxone", trueValue: 11 },
      { id: "administer", question: "Administered naloxone", trueValue: 8 }
    ];

    const quizContainer = document.getElementById("naloxone-quiz-container");
    if (!quizContainer) return;

    // Local constants — no globals
    const SVG_NS = "http://www.w3.org/2000/svg";
    const RADIUS = 60;
    const THICKNESS = 20;
    const CIRC = 2 * Math.PI * RADIUS;
    const HANDLE_RADIUS = 10;

    // Local state
    const userGuesses = {};
    const locked = {};
    let dragState = null;

    // ---------------------------
    //  Utility functions
    // ---------------------------

    function angleToPercent(angle) {
      angle = angle < 0 ? angle + Math.PI * 2 : angle;
      return +(angle / (Math.PI * 2) * 100).toFixed(1);
    }

    function getAngleFromEvent(evt, svg) {
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const clientX = evt.clientX || (evt.touches && evt.touches[0].clientX);
      const clientY = evt.clientY || (evt.touches && evt.touches[0].clientY);

      const dx = clientX - cx;
      const dy = clientY - cy;

      let angle = Math.atan2(dy, dx);

      // rotate so 0 degrees is at top
      angle = angle + Math.PI / 2;

      return angle;
    }

    function getPositionFromPercent(percent) {
      const angle = (percent / 100) * Math.PI * 2 - Math.PI / 2;

      return {
        x: 90 + RADIUS * Math.cos(angle),
        y: 90 + RADIUS * Math.sin(angle)
      };
    }

    function updateFill(fg, percent) {
      fg.style.strokeDasharray = `${(percent / 100) * CIRC} ${CIRC}`;
    }

    function updateHandlePosition(handle, percent) {
      const pos = getPositionFromPercent(percent);
      handle.setAttribute("cx", pos.x);
      handle.setAttribute("cy", pos.y);
    }

    // ---------------------------
    //  Create pie chart component
    // ---------------------------

    function createPie(item) {
      const card = document.createElement("div");
      card.className = "quiz-pie";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "slider");
      card.setAttribute("aria-label", `${item.question}: Use drag, arrow keys, or +/-`);
      card.setAttribute("aria-valuemin", "0");
      card.setAttribute("aria-valuemax", "100");
      card.setAttribute("aria-valuenow", "0");

      // Title
      const title = document.createElement("h3");
      title.textContent = item.question;
      card.appendChild(title);

      // SVG Wrapper
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", "180");
      svg.setAttribute("height", "180");
      card.appendChild(svg);

      // Background circle
      const bg = document.createElementNS(SVG_NS, "circle");
      bg.setAttribute("cx", "90");
      bg.setAttribute("cy", "90");
      bg.setAttribute("r", RADIUS);
      bg.setAttribute("fill", "none");
      bg.setAttribute("stroke", "#333");
      bg.setAttribute("stroke-width", THICKNESS);
      svg.appendChild(bg);

      // Foreground fill ring
      const fg = document.createElementNS(SVG_NS, "circle");
      fg.setAttribute("cx", "90");
      fg.setAttribute("cy", "90");
      fg.setAttribute("r", RADIUS);
      fg.setAttribute("fill", "none");
      fg.setAttribute("stroke", "#4d90fe");
      fg.setAttribute("stroke-width", THICKNESS);
      fg.setAttribute("stroke-linecap", "round");
      fg.style.transform = "rotate(-90deg)";
      fg.style.transformOrigin = "50% 50%";
      fg.style.strokeDasharray = `0 ${CIRC}`;
      fg.style.transition = "stroke 0.3s ease";
      svg.appendChild(fg);

      // Draggable handle
      const handle = document.createElementNS(SVG_NS, "circle");
      const startPos = getPositionFromPercent(0);
      handle.setAttribute("cx", startPos.x);
      handle.setAttribute("cy", startPos.y);
      handle.setAttribute("r", HANDLE_RADIUS);
      handle.setAttribute("fill", "#4d90fe");
      handle.setAttribute("stroke", "#fff");
      handle.setAttribute("stroke-width", "3");
      handle.style.cursor = "grab";
      handle.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
      svg.appendChild(handle);

      // Center text
      const instructionText = document.createElementNS(SVG_NS, "text");
      instructionText.setAttribute("x", "90");
      instructionText.setAttribute("y", "90");
      instructionText.setAttribute("text-anchor", "middle");
      instructionText.setAttribute("dominant-baseline", "middle");
      instructionText.setAttribute("fill", "#888");
      instructionText.setAttribute("font-size", "12");
      instructionText.setAttribute("font-weight", "bold");
      instructionText.textContent = "Drag";
      svg.appendChild(instructionText);

      // Guess label
      const guessLabel = document.createElement("p");
      guessLabel.innerHTML = `Your guess: <span id="${item.id}-guess">0%</span>`;
      card.appendChild(guessLabel);

      // Lock button
      const lockButton = document.createElement("button");
      lockButton.className = "lock-button";
      lockButton.textContent = "🔓 Click to Lock";
      lockButton.style.cssText = `
        margin-top: 8px;
        padding: 6px 12px;
        font-size: 0.9rem;
        background: #4d90fe;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      `;
      card.appendChild(lockButton);

      // Result label
      const result = document.createElement("p");
      result.id = `${item.id}-result`;
      result.className = "result";
      card.appendChild(result);

      // ----------------------------------------
      //  Update UI based on percentage
      // ----------------------------------------
      function updateDisplay(percent) {
        userGuesses[item.id] = percent;
        guessLabel.querySelector("span").textContent = `${percent}%`;
        updateFill(fg, percent);
        updateHandlePosition(handle, percent);
        card.setAttribute("aria-valuenow", Math.round(percent));
      }

      // ----------------------------------------
      //  Lock current value
      // ----------------------------------------
      function lockGuess() {
        if (locked[item.id]) return;

        locked[item.id] = true;

        fg.setAttribute("stroke", "#2ecc71");
        handle.setAttribute("fill", "#2ecc71");
        handle.style.cursor = "not-allowed";

        lockButton.textContent = "🔒 Locked";
        lockButton.style.background = "#2ecc71";
        lockButton.disabled = true;

        instructionText.textContent = "Locked";
        instructionText.setAttribute("fill", "#2ecc71");

        handle.style.pointerEvents = "none";
      }

      // ----------------------------------------
      //  Drag Handlers
      // ----------------------------------------
      function onDragStart(evt) {
        if (locked[item.id]) return;
        evt.preventDefault();

        dragState = { itemId: item.id, svg, handle };
        handle.style.cursor = "grabbing";
        handle.setAttribute("r", HANDLE_RADIUS + 2);

        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("mouseup", onDragEnd);
        document.addEventListener("touchmove", onDragMove);
        document.addEventListener("touchend", onDragEnd);
      }

      function onDragMove(evt) {
        if (!dragState || dragState.itemId !== item.id) return;

        evt.preventDefault();
        const angle = getAngleFromEvent(evt, svg);
        const percent = angleToPercent(angle);
        updateDisplay(percent);
      }

      function onDragEnd(evt) {
        if (!dragState || dragState.itemId !== item.id) return;

        evt.preventDefault();
        handle.style.cursor = "grab";
        handle.setAttribute("r", HANDLE_RADIUS);

        document.removeEventListener("mousemove", onDragMove);
        document.removeEventListener("mouseup", onDragEnd);
        document.removeEventListener("touchmove", onDragMove);
        document.removeEventListener("touchend", onDragEnd);

        dragState = null;
      }

      handle.addEventListener("mousedown", onDragStart);
      handle.addEventListener("touchstart", onDragStart);

      // ----------------------------------------
      //  Keyboard controls
      // ----------------------------------------
      card.addEventListener("keydown", evt => {
        if (locked[item.id]) return;

        const current = userGuesses[item.id] || 0;
        let updated = current;
        let handled = true;

        switch (evt.key) {
          case "ArrowRight":
          case "ArrowUp":
          case "+":
          case "=":
            updated = Math.min(100, current + 1);
            break;

          case "ArrowLeft":
          case "ArrowDown":
          case "-":
          case "_":
            updated = Math.max(0, current - 1);
            break;

          case "PageUp":
            updated = Math.min(100, current + 10);
            break;

          case "PageDown":
            updated = Math.max(0, current - 10);
            break;

          case "Home":
            updated = 0;
            break;

          case "End":
            updated = 100;
            break;

          case "Enter":
          case " ": // spacebar
            lockGuess();
            return;

          default:
            handled = false;
        }

        if (handled) {
          evt.preventDefault();
          updateDisplay(updated);
        }
      });

      // Visual focus styles
      card.addEventListener("focus", () => {
        if (!locked[item.id]) {
          handle.setAttribute("stroke-width", "4");
          fg.setAttribute("stroke-width", THICKNESS + 2);
        }
      });

      card.addEventListener("blur", () => {
        if (!locked[item.id]) {
          handle.setAttribute("stroke-width", "3");
          fg.setAttribute("stroke-width", THICKNESS);
        }
      });

      // Lock via button
      lockButton.addEventListener("click", lockGuess);

      // Initialize
      updateDisplay(0);

      quizContainer.appendChild(card);
    }

    // Create all pies
    quizData.forEach(createPie);

    // Reveal answers
    const submitBtn = document.getElementById("submit-quiz");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        quizData.forEach(item => {
          const resultEl = document.getElementById(`${item.id}-result`);
          const guess = userGuesses[item.id] || 0;
          const real = item.trueValue;

          const msg =
            Math.abs(guess - real) < 1
              ? "🎯 You guessed correctly!"
              : guess > real
              ? "📉 Fewer Americans than you guessed."
              : "📈 More Americans than you guessed.";

          resultEl.innerHTML = `<strong>Reality: ${real}%</strong><br>${msg}`;
        });
      });
    }
  }
})();
