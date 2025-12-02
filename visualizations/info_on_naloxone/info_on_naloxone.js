(function () {
    document.addEventListener("DOMContentLoaded", initNaloxoneInfo);
  
    function initNaloxoneInfo() {
      const container = document.getElementById("naloxone-info-wrapper");
      if (!container) return;
  
      // ---------- DATA FOR INFO CARDS ----------
      const slides = [
        {
          title: "What Is Naloxone?",
          text: "Naloxone is a life-saving medication that rapidly reverses an opioid overdose. It works by blocking opioid receptors, restoring normal breathing within 1–3 minutes.",
        },
        {
          title: "How Does It Work?",
          text: "Naloxone quickly knocks opioids off brain receptors. It is safe, non-addictive, and only affects the body if opioids are present. It cannot cause a high.",
        },
        {
          title: "Forms of Naloxone",
          text: "Naloxone comes in two main forms: a nasal spray (Narcan®) and an injectable form. The nasal spray is most common and requires no assembly.",
        },
        {
          title: "Who Should Carry It?",
          text: "Anyone who uses opioids, knows someone who uses opioids, or lives in a community affected by overdoses should carry naloxone. Many states allow purchase without a prescription.",
        },
        {
          title: "Recognizing an Overdose",
          text: "Signs include slow or no breathing, blue lips or nails, unresponsiveness, or gurgling sounds. If unsure, always give naloxone — it cannot harm someone who is not overdosing.",
        },
        {
          title: "Is Naloxone Safe?",
          text: "Yes. Naloxone is extremely safe. It has no effect if opioids are not present. It can be given to children, pregnant individuals, and bystanders with no medical training.",
        },
        {
          title: "After Giving Naloxone",
          text: "Naloxone wears off in 30–90 minutes. Always call 911, give rescue breaths if needed, and be prepared to give a second dose if the person does not wake up.",
        }
      ];
  
      // ---------- INJECT HTML STRUCTURE ----------
      container.innerHTML = `
        <div class="naloxone-slider">
          <div class="naloxone-track">
            ${slides
              .map(
                (s, i) => `
            <div class="naloxone-slide">
              <h2>${s.title}</h2>
              <p>${s.text}</p>
            </div>`
              )
              .join("")}
          </div>
  
          <button class="nav-arrow left-arrow"></button>
          <button class="nav-arrow right-arrow"></button>
  
          <div class="naloxone-dots">
            ${slides
              .map(
                (_, i) => `<span class="dot ${i === 0 ? "active" : ""}" data-index="${i}"></span>`
              )
              .join("")}
          </div>
        </div>
      `;
  
      // ---------- STYLING ----------
      const style = document.createElement("style");
      style.textContent = `
      /* ---------- STYLING (UPDATED FOR VERTICAL SLIDES) ---------- */
      #naloxone-info-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-top: 2rem;
      }

      .naloxone-slider {
        width: 70%;                          /* narrower width */
        max-width: 700px;                    /* keeps it slim on desktop */
        position: relative;
        overflow: hidden;
        padding: 1rem 0 3.5rem;
        margin: 0 auto;
      }

      .naloxone-track {
        display: flex;
        transition: transform 0.6s ease;
      }

      .naloxone-slide {
        min-width: 100%;
        flex-shrink: 0;
        background: rgba(255,255,255,0.05);
        border-radius: 18px;
        padding: 2rem 1.8rem;                /* tighter padding */
        text-align: center;
        backdrop-filter: blur(4px);
        display: flex;                       /* ensures vertical centering */
        flex-direction: column;
        justify-content: center;
        min-height: 350px;                   /* taller card */
      }

      .naloxone-slide h2 {
        color: white;
        font-size: 1.8rem;                   /* slightly smaller */
        margin-bottom: 1rem;
      }

      .naloxone-slide p {
        font-size: 1.05rem;
        color: #ccc;
        line-height: 1.55;
        max-width: 500px;                    /* much slimmer */
        margin: 0 auto;
      }

      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: none;                     /* remove circles */
        border: none;
        width: 0;
        height: 0;
        border-style: solid;
        cursor: pointer;
        opacity: 0.9;
        transition: opacity 0.2s ease;
      }

      /* Left triangle */
      .left-arrow {
        border-width: 18px 22px 18px 0;
        border-color: transparent white transparent transparent;
        left: 30px;                          /* tuck in more */
      }

      /* Right triangle */
      .right-arrow {
        border-width: 18px 0 18px 22px;
        border-color: transparent transparent transparent white;
        right: 30px;                         /* tuck in more */
      }

      .nav-arrow:hover {
        opacity: 0.6;
      }

      .naloxone-dots {
        width: 100%;
        text-align: center;
        position: absolute;
        bottom: 8px;
      }

      .naloxone-dots .dot {
        width: 10px;
        height: 10px;
        background: #666;
        border-radius: 50%;
        display: inline-block;
        margin: 0 5px;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .naloxone-dots .dot.active {
        background: #fff;
        transform: scale(1.15);
      }

      `;
      document.head.appendChild(style);
  
      // ---------- SLIDER LOGIC ----------
      const track = container.querySelector(".naloxone-track");
      const dots = Array.from(container.querySelectorAll(".dot"));
      const leftBtn = container.querySelector(".left-arrow");
      const rightBtn = container.querySelector(".right-arrow");
  
      let currentIndex = 0;
  
      function updateSlider() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
  
        dots.forEach((d, i) => {
          d.classList.toggle("active", i === currentIndex);
        });
      }
  
      function goLeft() {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
        updateSlider();
      }
  
      function goRight() {
        currentIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
        updateSlider();
      }
  
      leftBtn.addEventListener("click", goLeft);
      rightBtn.addEventListener("click", goRight);
  
      dots.forEach(dot => {
        dot.addEventListener("click", () => {
          currentIndex = +dot.dataset.index;
          updateSlider();
        });
      });
    }
  })();
  