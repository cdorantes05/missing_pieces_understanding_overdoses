// ==========================================
//  STORIES HERO MODULE — TV-STYLE LAYOUT
//  Builds hero "video" card + transcript + story row
//  Uses ONLY the data below (no HTML needed in index.html)
// ==========================================
(function () {
  'use strict';

  // ------------------------------------------
  // 1. DATA (images, audio, transcripts)
  //    Transcripts are EXACTLY from your index.html
  // ------------------------------------------
  const storiesData = [
    {
      id: 'jonathan',
      title: "Jonathan's Story",
      tagline: "Jonathan's mom remembers her son for who he was, not just his opioid addiction.",
      image: 'data/jonathans_story.png',
      audio: 'data/jonathans_story.mp3',
      transcript: [
        {
          time: 0,
          text: 'He was the son that any mother would have wanted her son to grow up to be.'
        },
        {
          time: 5,
          text: "Unfortunately, we still don't know what makes someone vulnerable to develop addiction."
        },
        {
          time: 12,
          text: 'He deserved to live a life like any of us.'
        }
      ]
    },
    {
      id: 'sofia',
      title: "Sofia's Story",
      tagline: 'Narcan saved Sofia’s life after an unexpected overdose.',
      image: 'data/sofias_story.png',
      audio: 'data/sofias_story.mp3',
      transcript: [
        {
          time: 0,
          text: 'Bored in my room and I notice, you know, I have half this pill.'
        },
        {
          time: 4,
          text: "Why not? It'll make me cheer up."
        },
        {
          time: 9,
          text: 'And I crushed it up, took a line...'
        },
        {
          time: 12,
          text: 'Felt kind of sparkly for two seconds and then I woke up in the hospital.'
        }
      ]
    },
    {
      id: 'jake',
      title: "Jake's Story",
      tagline: 'Jake talks about overdose, relapse, and the long road to recovery.',
      image: 'data/jakes_story.png',
      audio: 'data/jakes_story.mp3',
      transcript: [
        {
          time: 0,
          text: 'Told my dad hey, like, I already have fentanyl.'
        },
        {
          time: 2,
          text: "I'm gonna either use it in the house or I'm going to use it outside of the house."
        },
        {
          time: 5,
          text: 'And, um, very luckily, he let me come in the house.'
        },
        {
          time: 8,
          text: "It would have been extremely bad if he didn't because I overdosed that night."
        },
        {
          time: 12,
          text: 'My heart stopped and I went blue.'
        },
        {
          time: 14,
          text: 'My dad had to do CPR on me. My mom had to call the ambulance.'
        },
        {
          time: 20,
          text: "I can't imagine how traumatic that was for them."
        },
        {
          time: 23,
          text: '[Interviewer] I feel, I feel terrible for your parents.'
        },
        {
          time: 26,
          text: "I can't even imagine...I feel so bad that I did that to them."
        },
        {
          time: 29,
          text: 'So, I went to the hosipital again that night. Got out, relapsed the same day again.'
        },
        {
          time: 36,
          text: "I didn't want to stay sober whatsoever."
        },
        {
          time: 38,
          text: 'So, I would just tell the doctors, "Yeah, I\'m going to stay on suboxone and not relapse."'
        },
        {
          time: 45,
          text: "I'd get out and the same day I'd relapse. It kept going on like that for a while."
        }
      ]
    }
  ];

  // ------------------------------------------
  // 2. STATE
  // ------------------------------------------
  let currentIndex = 0;
  let audioEl = null;
  let playBtn = null;
  let progressFill = null;
  let timeCurrentEl = null;
  let timeTotalEl = null;
  let transcriptContainer = null;
  let transcriptLines = [];
  let transcriptInterval = null;

  // ------------------------------------------
  // 3. CSS INJECTION
  // ------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    /* Root container */
    #stories-container {
      width: 90%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .stories-root {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .stories-right-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stories-main {
      display: flex;
      gap: 20px;
      align-items: stretch;
    }

    /* Hero panel (left) */
    .hero-panel {
      flex: 1.6;
      background: radial-gradient(circle at top, #1e163a 0%, #090812 70%);
      border-radius: 18px;
      padding: 18px 18px 16px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.55);
      position: relative;
      overflow: hidden;
    }

    .hero-image-wrapper {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 14px;
    }

    .hero-image {
      width: 100%;
      height: 260px;
      object-fit: cover;
      display: block;
    }

    .hero-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%);
      pointer-events: none;
    }

    .hero-play-button {
      position: absolute;
      top: 16px;
      right: 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 999px;
      border: none;
      background: rgba(255,255,255,0.95);
      color: #11111d;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0,0,0,0.45);
      transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
    }

    .hero-play-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 26px rgba(0,0,0,0.6);
      background: #ffffff;
    }

    .hero-play-icon {
      width: 14px;
      height: 14px;
      border-style: solid;
      border-width: 7px 0 7px 11px;
      border-color: transparent transparent transparent #11111d;
      margin-left: 2px;
    }

    .hero-play-button.paused .hero-play-icon {
      width: 12px;
      height: 12px;
      border: none;
      display: inline-block;
      position: relative;
    }

    .hero-play-button.paused .hero-play-icon::before,
    .hero-play-button.paused .hero-play-icon::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      background: #11111d;
      border-radius: 999px;
    }

    .hero-play-button.paused .hero-play-icon::before {
      left: 0;
    }
    .hero-play-button.paused .hero-play-icon::after {
      right: 0;
    }

    .hero-meta-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      margin: 2px 0 4px;
    }

    .hero-meta-tagline {
      color: #d9d9f5;
      font-size: 14px;
      margin: 0 0 10px;
    }

    .hero-timeline {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #c0c0dd;
    }

    .hero-progress {
      height: 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }

    .hero-progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #f97316, #fb7185);
      border-radius: inherit;
      transition: width 0.12s linear;
    }

    /* Transcript panel (right) */
    .transcript-panel {
      flex: none;              /* remove flex-stretch */
      background: radial-gradient(circle at top, #1e163a 0%, #090812 70%);
      border-radius: 18px;
      padding: 16px 16px 14px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      max-height: 180px;       /* MUCH shorter */
      height: 180px;           /* fixed height so it doesn’t grow */
      margin-bottom: 12px;     /* space before story row */
    }


    .transcript-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .transcript-header-left h3 {
      margin: 0;
      font-size: 16px;
      color: #ffffff;
    }

    .transcript-subtext {
      margin: 2px 0 0;
      font-size: 12px;
      color: #9ca3c7;
    }

    .transcript-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(34,197,94,0.12);
      color: #bbf7d0;
      border: 1px solid rgba(22,163,74,0.6);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34,197,94,0.9);
    }

    .transcript-body {
      flex: 1;
      margin-top: 6px;
      padding-right: 4px;
      overflow-y: auto;
      scrollbar-width: thin;
    }

    .transcript-line {
      font-size: 12px;
      padding: 4px 6px;
      margin-bottom: 3px;
      color: #e5e7ff;
      border-radius: 8px;
      transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
      opacity: 0.7;
    }

    .transcript-line.active {
      background: rgba(129, 140, 248, 0.22);
      color: #ffffff;
      transform: translateX(2px);
      opacity: 1;
    }

    .transcript-line.past {
      opacity: 0.45;
      color: #9ca3c7;
    }

    /* Story row (thumbnails) */
    .stories-thumbs {
      margin-top: 0;             /* remove big spacing */
      padding-top: 4px;
    }

    .stories-row-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .stories-row-sub {
      font-size: 11px;
      margin-bottom: 6px;
      text-align: left;
    }

    .stories-row {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;     /* cleaner */
    }

    .story-card {
      min-width: 170px;
      max-width: 190px;
      background: radial-gradient(circle at top, #1e163a 0%, #090812 70%);
      border-radius: 14px;
      box-shadow: 0 16px 30px rgba(0,0,0,0.55);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease;
      border: 1px solid transparent;
      display: flex;
      flex-direction: column;
    }

    .story-card.active {
      border-color: rgba(249,115,22,0.9);
      transform: translateY(-2px);
      box-shadow: 0 18px 40px rgba(0,0,0,0.7);
    }

    .story-card-image-wrapper {
      position: relative;
      border-radius: 14px 14px 0 0;
      overflow: hidden;
    }

    .story-card-image {
      width: 100%;
      height: 90px;
      object-fit: cover;
      display: block;
    }

    .story-card-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%);
    }

    .story-card-title {
      font-size: 14px;
      color: #f9fafb;
      font-weight: 600;
      padding: 10px 10px 4px;
    }

    .story-card-tagline {
      font-size: 12px;
      color: #c4c6e5;
      padding: 0 10px 10px;
    }

    /* Small responsiveness tweaks */
    @media (max-width: 900px) {
      .stories-main {
        flex-direction: column;
      }
      .hero-image {
        height: 220px;
      }
      .transcript-panel {
        max-height: 260px;
      }
      .story-card {
        min-width: 180px;
      }
    }
  `;
  document.head.appendChild(style);

  // ------------------------------------------
  // 4. INIT — build DOM once
  // ------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('stories-container');
    if (!container) return;
    buildStoriesLayout(container);
    loadStory(0);
  });

  // Build the full layout inside the container
function buildStoriesLayout(container) {
  container.innerHTML = '';

  const root = document.createElement('div');
  root.className = 'stories-root';

  // ---- Main hero + transcript/row wrapper
  const main = document.createElement('div');
  main.className = 'stories-main';

  // HERO PANEL
  const hero = document.createElement('div');
  hero.className = 'hero-panel';

  const heroImgWrap = document.createElement('div');
  heroImgWrap.className = 'hero-image-wrapper';

  const heroImg = document.createElement('img');
  heroImg.className = 'hero-image';
  heroImg.alt = '';

  const heroGrad = document.createElement('div');
  heroGrad.className = 'hero-gradient';

  const btn = document.createElement('button');
  btn.className = 'hero-play-button';
  btn.innerHTML = `<span class="hero-play-icon"></span><span class="hero-play-label">Play Story</span>`;

  heroImgWrap.appendChild(heroImg);
  heroImgWrap.appendChild(heroGrad);
  heroImgWrap.appendChild(btn);
  hero.appendChild(heroImgWrap);

  const metaTitle = document.createElement('div');
  metaTitle.className = 'hero-meta-title';
  hero.appendChild(metaTitle);

  const metaTagline = document.createElement('div');
  metaTagline.className = 'hero-meta-tagline';
  hero.appendChild(metaTagline);

  const timeline = document.createElement('div');
  timeline.className = 'hero-timeline';

  const timeCur = document.createElement('span');
  timeCur.className = 'hero-time-current';
  timeCur.textContent = '0:00';

  const progress = document.createElement('div');
  progress.className = 'hero-progress';

  const progressInner = document.createElement('div');
  progressInner.className = 'hero-progress-fill';
  progress.appendChild(progressInner);

  const timeTotal = document.createElement('span');
  timeTotal.className = 'hero-time-total';
  timeTotal.textContent = '--:--';

  timeline.appendChild(timeCur);
  timeline.appendChild(progress);
  timeline.appendChild(timeTotal);

  hero.appendChild(timeline);

  // TRANSCRIPT PANEL
  const transcriptPanel = document.createElement('div');
  transcriptPanel.className = 'transcript-panel';

  const tHeader = document.createElement('div');
  tHeader.className = 'transcript-header';

  const tHeaderLeft = document.createElement('div');
  tHeaderLeft.className = 'transcript-header-left';

  const tTitle = document.createElement('h3');
  tTitle.textContent = 'Live Transcript';

  const tSub = document.createElement('p');
  tSub.className = 'transcript-subtext';
  tSub.textContent = 'Lines will highlight as the story plays.';

  tHeaderLeft.appendChild(tTitle);
  tHeaderLeft.appendChild(tSub);

  const tStatus = document.createElement('div');
  tStatus.className = 'transcript-status';
  tStatus.innerHTML = `<span class="status-dot"></span><span>Following along</span>`;

  tHeader.appendChild(tHeaderLeft);
  tHeader.appendChild(tStatus);

  transcriptPanel.appendChild(tHeader);

  const tBody = document.createElement('div');
  tBody.className = 'transcript-body';
  transcriptPanel.appendChild(tBody);

  // === RIGHT COLUMN (transcript + available stories) ===
  const rightCol = document.createElement('div');
  rightCol.className = 'stories-right-col';

  // add transcript at top of right column
  rightCol.appendChild(transcriptPanel);

  // STORY ROW
  const rowWrapper = document.createElement('div');
  rowWrapper.className = 'stories-thumbs';

  const rowHeader = document.createElement('h3');
  rowHeader.className = 'stories-row-header';
  rowHeader.textContent = 'Available Stories';

  const rowSub = document.createElement('div');
  rowSub.className = 'stories-row-sub';
  rowSub.textContent = '';

  const row = document.createElement('div');
  row.className = 'stories-row';

  // Build cards from storiesData
  storiesData.forEach((story, idx) => {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.dataset.index = String(idx);

    const imgWrap = document.createElement('div');
    imgWrap.className = 'story-card-image-wrapper';

    const img = document.createElement('img');
    img.className = 'story-card-image';
    img.src = story.image;
    img.alt = story.title;

    const grad = document.createElement('div');
    grad.className = 'story-card-gradient';

    imgWrap.appendChild(img);
    imgWrap.appendChild(grad);

    const title = document.createElement('div');
    title.className = 'story-card-title';
    title.textContent = story.title;

    const tagline = document.createElement('div');
    tagline.className = 'story-card-tagline';
    tagline.textContent = story.tagline;

    card.appendChild(imgWrap);
    card.appendChild(title);
    card.appendChild(tagline);

    card.addEventListener('click', () => {
      if (currentIndex !== idx) {
        loadStory(idx);
      }
    });

    row.appendChild(card);
  });

  rowWrapper.appendChild(rowHeader);
  rowWrapper.appendChild(rowSub);
  rowWrapper.appendChild(row);

  // Attach row under transcript in the right column
  rightCol.appendChild(rowWrapper);

  // Put hero + right column into main row
  main.appendChild(hero);
  main.appendChild(rightCol);

  // Hidden audio element
  const audio = document.createElement('audio');
  audio.id = 'stories-audio';
  audio.preload = 'metadata';

  root.appendChild(main);
  root.appendChild(audio);

  container.appendChild(root);

  // Save references for later
  audioEl = audio;
  playBtn = btn;
  progressFill = progressInner;
  timeCurrentEl = timeCur;
  timeTotalEl = timeTotal;
  transcriptContainer = tBody;

  // Play/pause handler
  playBtn.addEventListener('click', () => togglePlay());

  // Audio events
  audioEl.addEventListener('timeupdate', onTimeUpdate);
  audioEl.addEventListener('ended', onEnded);
  audioEl.addEventListener('loadedmetadata', () => {
    if (!isNaN(audioEl.duration)) {
      timeTotalEl.textContent = formatTime(audioEl.duration);
    }
  });

  // Keyboard navigation (left/right to change story, space to play/pause)
  document.addEventListener('keydown', (e) => {
    const section = container.closest('.section') || container;
    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToStory(currentIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToStory(currentIndex - 1);
    } else if (e.key === ' ') {
      e.preventDefault();
      togglePlay();
    }
  });
}


  // ------------------------------------------
  // 5. STORY LOADING + UI UPDATE
  // ------------------------------------------
  function loadStory(index) {
    if (index < 0) index = storiesData.length - 1;
    if (index >= storiesData.length) index = 0;
    currentIndex = index;

    const story = storiesData[index];
    if (!story) return;

    // Hero elements
    const heroImg = document.querySelector('.hero-image');
    const metaTitle = document.querySelector('.hero-meta-title');
    const metaTagline = document.querySelector('.hero-meta-tagline');

    if (heroImg) {
      heroImg.src = story.image;
      heroImg.alt = story.title;
    }
    if (metaTitle) metaTitle.textContent = story.title;
    if (metaTagline) metaTagline.textContent = story.tagline;

    // Update active card
    document.querySelectorAll('.story-card').forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Reset audio + transcript
    stopAudio();
    audioEl.src = story.audio || '';
    timeCurrentEl.textContent = '0:00';
    timeTotalEl.textContent = '--:--';
    progressFill.style.width = '0%';

    // Build transcript lines
    transcriptContainer.innerHTML = '';
    transcriptLines = [];

    if (Array.isArray(story.transcript)) {
      story.transcript.forEach((line) => {
        const p = document.createElement('p');
        p.className = 'transcript-line';
        p.dataset.time = String(line.time);
        p.textContent = line.text;
        transcriptContainer.appendChild(p);
        transcriptLines.push(p);
      });
    }

    // Scroll transcript to top
    transcriptContainer.scrollTop = 0;
  }

  function goToStory(idx) {
    loadStory(idx);
  }

  // ------------------------------------------
  // 6. AUDIO + TRANSCRIPT SYNC
  // ------------------------------------------
  function togglePlay() {
    if (!audioEl || !audioEl.src) return;

    if (audioEl.paused) {
      audioEl.play().catch(() => {});
      playBtn.classList.add('paused');
      playBtn.querySelector('.hero-play-label').textContent = 'Pause Story';
    } else {
      audioEl.pause();
      playBtn.classList.remove('paused');
      playBtn.querySelector('.hero-play-label').textContent = 'Play Story';
    }
  }

  function stopAudio() {
    if (!audioEl) return;
    audioEl.pause();
    audioEl.currentTime = 0;
    if (playBtn) {
      playBtn.classList.remove('paused');
      const label = playBtn.querySelector('.hero-play-label');
      if (label) label.textContent = 'Play Story';
    }
    clearTranscriptHighlight();
  }

  function onEnded() {
    stopAudio();
  }

  function onTimeUpdate() {
    if (!audioEl || !audioEl.duration || isNaN(audioEl.duration)) return;

    const cur = audioEl.currentTime;
    const dur = audioEl.duration;

    // Timeline UI
    timeCurrentEl.textContent = formatTime(cur);
    timeTotalEl.textContent = formatTime(dur);
    const ratio = Math.min(Math.max(cur / dur, 0), 1);
    progressFill.style.width = (ratio * 100).toFixed(2) + '%';

    // Transcript sync
    highlightTranscript(cur);
  }

  function highlightTranscript(currentTime) {
    if (!transcriptLines.length) return;

    transcriptLines.forEach((line, idx) => {
      const start = parseFloat(line.dataset.time);
      const next = idx < transcriptLines.length - 1
        ? parseFloat(transcriptLines[idx + 1].dataset.time)
        : Infinity;

      line.classList.remove('active', 'past');

      if (currentTime >= start && currentTime < next) {
        line.classList.add('active');

        const rect = line.getBoundingClientRect();
        const parentRect = transcriptContainer.getBoundingClientRect();
        if (rect.top < parentRect.top || rect.bottom > parentRect.bottom) {
          line.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (currentTime >= next) {
        line.classList.add('past');
      }
    });
  }

  function clearTranscriptHighlight() {
    transcriptLines.forEach((line) => {
      line.classList.remove('active', 'past');
    });
  }

  // ------------------------------------------
  // 7. HELPERS
  // ------------------------------------------
  function formatTime(sec) {
    if (!isFinite(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
})();
