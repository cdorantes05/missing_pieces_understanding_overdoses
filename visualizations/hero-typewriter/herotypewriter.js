// heroTypewriter.js

document.addEventListener("DOMContentLoaded", () => {
    const typewriterEl = document.getElementById("typewriter");
    const subtextEl = document.getElementById("hero-subtext");
    const skipBtn = document.getElementById("skip-intro");
  
    // ✏️ EDIT THESE LINES LATER AS WE REFINE THE COPY
    const lines = [
        "Every few minutes, someone in the world dies from a drug overdose.",
        "By the time you finish scrolling here, another life will be taken.",
        "We’re running out of time to understand the crisis and rewrite its story."
    ];
      
  
    const subtext =
    "Scroll to uncover the hidden patterns, the human stories, and the recent hero behind the overdose epidemic.";
  
    const typingSpeed = 65;    // ms per character
    const linePause = 900;     // pause after each line in ms
    const eraseSpeed = 25;     // ms per character when erasing
    const initialDelay = 400;  // delay before starting animation
  
    let skipRequested = false;
  
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    async function typeText(el, text, speed) {
      el.textContent = "";
      for (let i = 0; i < text.length; i++) {
        if (skipRequested) return;
        el.textContent += text[i];
        await sleep(speed);
      }
    }
  
    async function eraseText(el, speed) {
      while (el.textContent.length > 0) {
        if (skipRequested) return;
        el.textContent = el.textContent.slice(0, -1);
        await sleep(speed);
      }
    }
  
    async function runTypewriter() {
      // small delay so users settle on the page
      await sleep(initialDelay);
      if (skipRequested) return;
  
      typewriterEl.classList.add("cursor-active");
  
      // type through each line, erasing between them except the last
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
  
        await typeText(typewriterEl, line, typingSpeed);
        if (skipRequested) break;
  
        await sleep(linePause);
        if (skipRequested) break;
  
        if (i < lines.length - 1) {
          await eraseText(typewriterEl, eraseSpeed);
        }
      }
  
      typewriterEl.classList.remove("cursor-active");
  
      // Show subtext with a subtle fade
      if (!skipRequested && subtextEl) {
        subtextEl.textContent = subtext;
        subtextEl.classList.add("visible");
      }
    }
  
    // Allow user to skip the animation
    if (skipBtn) {
      skipBtn.addEventListener("click", () => {
        skipRequested = true;
  
        // Immediately show final state
        typewriterEl.classList.remove("cursor-active");
        typewriterEl.textContent = lines[lines.length - 1];
  
        if (subtextEl) {
          subtextEl.textContent = subtext;
          subtextEl.classList.add("visible");
        }
      });
    }
  
    runTypewriter();
  });
  