// ==========================================
//  STORIES MODULE — REUSABLE STORY COMPONENT
//  Renders image, transcript, and audio controls
// ==========================================

(function() {
  'use strict';

  // Module state
  let stories = [];
  let currentStoryIndex = 0;
  let currentTranscript = null;
  let transcriptInterval = null;
  let allAudios = [];
  let currentTimeupdateHandler = null;
  let previousStoryIndex = 0;

  // ==========================================
  //  INITIALIZATION
  // ==========================================

  /**
   * Initialize stories module
   * @param {Array} storiesData - Array of story objects
   * @param {string} storiesData[].id - Unique identifier (e.g., 'jonathans')
   * @param {string} storiesData[].title - Story title
   * @param {string} storiesData[].image - Path to image file
   * @param {string} storiesData[].audio - Path to audio file
   * @param {Array} storiesData[].transcript - Array of {time: number, text: string}
   */
  function initStories(storiesData) {
    if (!Array.isArray(storiesData) || storiesData.length === 0) {
      console.error('initStories: storiesData must be a non-empty array');
      return;
    }

    const container = document.getElementById('stories-container');
    if (!container) {
      console.error('initStories: Container #stories-container not found');
      return;
    }

    stories = storiesData;
    currentStoryIndex = 0;
    allAudios = [];

    // Clear container
    container.innerHTML = '';

    // Create story gallery structure
    const gallery = createStoryGallery();
    container.appendChild(gallery);

    // Create navigation
    const navigation = createNavigation();
    container.appendChild(navigation);

    // Initialize first story as active
    showStory(0);

    // Set up keyboard navigation
    setupKeyboardNavigation();
  }

  // ==========================================
  //  DOM CREATION
  // ==========================================

  function createStoryGallery() {
    const gallery = document.createElement('div');
    gallery.className = 'story-gallery';

    const storyContainer = document.createElement('div');
    storyContainer.className = 'story-container';

    // Create slides for each story
    stories.forEach((story, index) => {
      const slide = createStorySlide(story, index);
      storyContainer.appendChild(slide);
    });

    gallery.appendChild(storyContainer);
    return gallery;
  }

  function createStorySlide(story, index) {
    const slide = document.createElement('div');
    slide.className = 'story-slide';
    if (index === 0) slide.classList.add('active');
    slide.setAttribute('data-story', index);

    const wrapper = document.createElement('div');
    wrapper.className = 'story-wrapper';

    // Left column: Image and controls
    const left = createStoryLeft(story);
    wrapper.appendChild(left);

    // Right column: Transcript
    const right = createStoryRight(story);
    wrapper.appendChild(right);

    slide.appendChild(wrapper);
    return slide;
  }

  function createStoryLeft(story) {
    const left = document.createElement('div');
    left.className = 'story-left';

    // Image
    const img = document.createElement('img');
    img.src = story.image;
    img.alt = story.title;
    img.className = 'story-image';
    left.appendChild(img);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'story-controls';

    const title = document.createElement('h2');
    title.textContent = story.title;
    controls.appendChild(title);

    const playBtn = document.createElement('button');
    playBtn.className = 'play-btn';
    playBtn.setAttribute('data-audio', `${story.id}-audio`);
    playBtn.textContent = '▶ Play Story';
    controls.appendChild(playBtn);

    left.appendChild(controls);

    // Audio element
    const audio = document.createElement('audio');
    audio.id = `${story.id}-audio`;
    audio.src = story.audio;
    left.appendChild(audio);

    allAudios.push(audio);

    // Set up play button handler
    playBtn.addEventListener('click', () => handlePlayPause(story.id, playBtn, audio));

    // Set up audio ended handler
    audio.addEventListener('ended', () => handleAudioEnded(story.id, playBtn));

    return left;
  }

  function createStoryRight(story) {
    const right = document.createElement('div');
    right.className = 'story-right';

    const transcriptContainer = document.createElement('div');
    transcriptContainer.className = 'transcript-container';

    const transcriptTitle = document.createElement('h3');
    transcriptTitle.textContent = 'Transcript';
    transcriptContainer.appendChild(transcriptTitle);

    const transcript = document.createElement('div');
    transcript.className = 'transcript';
    transcript.id = `${story.id}-transcript`;

    // Create transcript lines
    if (story.transcript && Array.isArray(story.transcript)) {
      story.transcript.forEach(line => {
        const lineEl = document.createElement('p');
        lineEl.className = 'transcript-line';
        lineEl.setAttribute('data-time', line.time);
        lineEl.textContent = line.text;
        transcript.appendChild(lineEl);
      });
    }

    transcriptContainer.appendChild(transcript);
    right.appendChild(transcriptContainer);

    return right;
  }

  function createNavigation() {
    const navigation = document.createElement('div');
    navigation.className = 'story-navigation';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-btn prev-btn';
    prevBtn.id = 'prev-story';
    prevBtn.textContent = '‹';
    prevBtn.addEventListener('click', () => prevStory());
    navigation.appendChild(prevBtn);

    // Dots
    const indicators = document.createElement('div');
    indicators.className = 'story-indicators';

    stories.forEach((story, index) => {
      const dot = document.createElement('span');
      dot.className = 'story-dot';
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('data-story', index);
      dot.addEventListener('click', () => {
        currentStoryIndex = index;
        showStory(index);
      });
      indicators.appendChild(dot);
    });

    navigation.appendChild(indicators);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-btn next-btn';
    nextBtn.id = 'next-story';
    nextBtn.textContent = '›';
    nextBtn.addEventListener('click', () => nextStory());
    navigation.appendChild(nextBtn);

    return navigation;
  }

  // ==========================================
  //  STORY NAVIGATION
  // ==========================================

  function showStory(index) {
    if (index < 0 || index >= stories.length) return;

    const slides = document.querySelectorAll('.story-slide');
    const currentSlide = slides[currentStoryIndex];
    const nextSlide = slides[index];
    const isNext = index > currentStoryIndex;
    const isPrev = index < currentStoryIndex;
    
    if (currentSlide && nextSlide && currentSlide !== nextSlide) {
      // Remove all transition classes first
      slides.forEach(slide => {
        slide.classList.remove('active', 'slide-next', 'slide-prev');
      });
      
      // Set up exit animation for current slide
      if (isNext) {
        // Current slide exits to left
        currentSlide.classList.add('slide-prev');
      } else if (isPrev) {
        // Current slide exits to right
        currentSlide.classList.add('slide-next');
      }
      
      // Set up entry animation for next slide
      if (isNext) {
        // Next slide enters from right
        nextSlide.classList.add('slide-next');
        // Force reflow to apply initial state
        nextSlide.offsetHeight;
        nextSlide.classList.remove('slide-next');
      } else if (isPrev) {
        // Previous slide enters from left
        nextSlide.classList.add('slide-prev');
        // Force reflow to apply initial state
        nextSlide.offsetHeight;
        nextSlide.classList.remove('slide-prev');
      }
      
      // Activate the new slide
      nextSlide.classList.add('active');
    } else {
      // First load or same slide
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('active');
          slide.classList.remove('slide-next', 'slide-prev');
        } else {
          slide.classList.remove('active');
          if (i < index) {
            slide.classList.add('slide-prev');
          } else {
            slide.classList.add('slide-next');
          }
        }
      });
    }

    previousStoryIndex = currentStoryIndex;
    currentStoryIndex = index;

    // Update dots
    const dots = document.querySelectorAll('.story-dot');
    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Stop all audio and clear transcripts
    clearAllAudio();
    clearTranscript();
  }

  function nextStory() {
    const nextIndex = (currentStoryIndex + 1) % stories.length;
    showStory(nextIndex);
  }

  function prevStory() {
    const prevIndex = (currentStoryIndex - 1 + stories.length) % stories.length;
    showStory(prevIndex);
  }

  // ==========================================
  //  AUDIO HANDLING
  // ==========================================

  function handlePlayPause(storyId, button, audio) {
    // Pause all other audios
    allAudios.forEach(a => {
      if (a !== audio && !a.paused) {
        a.pause();
        a.currentTime = 0;
        const otherBtn = document.querySelector(`[data-audio="${a.id}"]`);
        if (otherBtn) {
          otherBtn.textContent = '▶ Play Story';
        }
      }
    });

    // Clear other transcripts
    clearTranscript();

    if (audio.paused) {
      audio.play();
      button.textContent = '⏸ Pause Story';
      updateTranscript(storyId, audio);
    } else {
      audio.pause();
      button.textContent = '▶ Play Story';
      clearTranscript();
    }
  }

  function handleAudioEnded(storyId, button) {
    clearTranscript();
    button.textContent = '▶ Play Story';

    // Reset transcript lines
    const transcriptId = `${storyId}-transcript`;
    const transcript = document.getElementById(transcriptId);
    if (transcript) {
      transcript.querySelectorAll('.transcript-line').forEach(line => {
        line.classList.remove('active', 'past');
      });
    }

    // Auto-advance to next story if not last
    if (currentStoryIndex < stories.length - 1) {
      setTimeout(() => {
        nextStory();
      }, 1000);
    }
  }

  function clearAllAudio() {
    allAudios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.textContent = '▶ Play Story';
    });
  }

  // ==========================================
  //  TRANSCRIPT HIGHLIGHTING
  // ==========================================

  function updateTranscript(storyId, audio) {
    const transcriptId = `${storyId}-transcript`;
    const transcript = document.getElementById(transcriptId);
    if (!transcript) return;

    currentTranscript = transcript;
    const lines = transcript.querySelectorAll('.transcript-line');

    // Clear any existing interval and event listeners
    if (transcriptInterval) {
      clearInterval(transcriptInterval);
    }

    // Remove previous timeupdate handler if it exists
    if (currentTimeupdateHandler) {
      allAudios.forEach(a => {
        a.removeEventListener('timeupdate', currentTimeupdateHandler);
      });
    }

    // Reset all lines
    lines.forEach(line => {
      line.classList.remove('active', 'past');
    });

    // Update transcript highlighting based on audio time
    function highlightTranscript() {
      if (!audio || audio.paused) return;

      const currentTime = audio.currentTime;

      lines.forEach((line, index) => {
        const lineTime = parseFloat(line.getAttribute('data-time'));
        const nextLineTime = index < lines.length - 1
          ? parseFloat(lines[index + 1].getAttribute('data-time'))
          : Infinity;

        line.classList.remove('active', 'past');

        if (currentTime >= lineTime && currentTime < nextLineTime) {
          line.classList.add('active');
          // Scroll to active line if needed
          const rect = line.getBoundingClientRect();
          const transcriptRect = transcript.getBoundingClientRect();
          if (rect.top < transcriptRect.top || rect.bottom > transcriptRect.bottom) {
            line.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (currentTime >= nextLineTime) {
          line.classList.add('past');
        }
      });
    }

    // Store handler reference for cleanup
    currentTimeupdateHandler = highlightTranscript;

    // Update every 100ms for smooth highlighting
    transcriptInterval = setInterval(highlightTranscript, 100);

    // Also update on timeupdate for more accuracy
    audio.addEventListener('timeupdate', highlightTranscript);
  }

  function clearTranscript() {
    if (transcriptInterval) {
      clearInterval(transcriptInterval);
      transcriptInterval = null;
    }

    // Remove timeupdate handler
    if (currentTimeupdateHandler) {
      allAudios.forEach(a => {
        a.removeEventListener('timeupdate', currentTimeupdateHandler);
      });
      currentTimeupdateHandler = null;
    }

    if (currentTranscript) {
      const lines = currentTranscript.querySelectorAll('.transcript-line');
      lines.forEach(line => {
        line.classList.remove('active', 'past');
      });
    }
  }

  // ==========================================
  //  KEYBOARD NAVIGATION
  // ==========================================

  function setupKeyboardNavigation() {
    document.addEventListener('keydown', e => {
      const storiesSection = document.getElementById('stories-container');
      if (!storiesSection) return;

      const rect = storiesSection.getBoundingClientRect();
      const isInStoriesSection = window.scrollY >= rect.top - 100 &&
        window.scrollY < rect.bottom + 100;

      if (isInStoriesSection) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextStory();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevStory();
        }
      }
    });
  }


  // Export initStories function
  window.initStories = initStories;

  // Export default stories data for convenience
  window.defaultStories = defaultStories;

})();
