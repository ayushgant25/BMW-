/**
 * ==========================================================================
 * BMW M POWER • THE ULTIMATE DRIVING MACHINE
 * Production-grade creative motion engine & scroll video visualizer
 * ==========================================================================
 * 
 * README / HOW TO CUSTOMIZE:
 * 1. FRAME SEQUENCE VS VIDEO:
 *    Set `CONFIG.USE_CANVAS = true` to use the pre-extracted frame sequence
 *    (buttery smooth 60fps scrolling across all devices).
 *    Set `CONFIG.USE_CANVAS = false` to use standard HTML5 `<video>` scrubbing.
 * 
 * 2. FFMPEG FRAME EXTRACTION COMMAND (30 FPS JPG/PNG):
 *    ffmpeg -i Car_components_hovering_in_mid-air_20260929195029.mp4 -vf fps=24 frames/frame_%04d.png
 * 
 * 3. FAST-SEEK VIDEO RE-ENCODING TIP (GOP = 1):
 *    If using the HTML5 <video> method, re-encode with keyframe on every frame
 *    so seeking is instant and doesn't hitch:
 *    ffmpeg -i input.mp4 -g 1 -an -movflags +faststart seekable_video.mp4
 * ==========================================================================
 */

const CONFIG = {
  // Mode selection: true = Canvas image sequence (recommended), false = HTML5 video scrub
  USE_CANVAS: true,

  // Frames configuration
  TOTAL_FRAMES: 192,
  FRAME_PATH: (index) => `frames_optimized/frame_${String(index).padStart(4, '0')}.webp`,
  FRAME_FALLBACK_PATH: (index) => `frames/frame_${String(index).padStart(4, '0')}.png`,

  // Video fallback
  VIDEO_SRC: 'Car_components_hovering_in_mid-air_20260929195029.mp4',

  // Animation constants
  SCRUB_DURATION: 0.8, // Lerp smoothing duration in seconds
  SOUND_ENABLED_DEFAULT: false,

  // Brand Palette
  COLORS: {
    black: '#0A0A0A',
    bmwBlue: '#1C69D4',
    mLightBlue: '#81C4FF',
    mDarkBlue: '#0066B1',
    mRed: '#E4002B'
  }
};

// State Variables
let lenis;
let audioEnabled = CONFIG.SOUND_ENABLED_DEFAULT;
let audioCtx = null;
let currentFrameIndex = 1;
const frameImages = [];
let framesLoadedCount = 0;

/* ==========================================================================
   INITIALIZATION ON DOM CONTENT LOADED
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP Plugins
  gsap.registerPlugin(ScrollTrigger, Flip);

  // Initialize Smooth Scrolling with Lenis
  initLenis();

  // Initialize Preloader & Media Preloading
  initPreloader();

  // Initialize Custom Cursor & Tyre Smoke Trail
  initCustomCursor();

  // Initialize Magnetic Buttons & Interactive Elements
  initMagneticElements();

  // Initialize Navbar Behaviors & Mobile Drawer
  initNavbar();

  // Initialize Marquee Velocity Accelerator
  initMarquee();

  // Initialize Models Showcase GSAP Flip Category Tabs
  initModelsFilter();

  // Initialize Pinned Horizontal Track
  initHorizontalScroll();

  // Initialize 3D Card Tilts
  initCardTilts();

  // Initialize Engine Start Audio & Tachometer
  initEngineSoundAndGauge();

  // Initialize Electric Battery Simulator
  initBatterySimulator();

  // Initialize Configurator Swatches
  initConfigurator();

  // Initialize Testimonials Dragging
  initTestimonialsSlider();

  // Initialize Test Drive Form & Confetti
  initTestDriveForm();

  // Initialize Easter Eggs (Key 'M', Konami Code, Sport Mode)
  initEasterEggs();

  // Initialize Sparks Particles behind Hero
  initSparksCanvas();
});

/* ==========================================================================
   1. LENIS SMOOTH SCROLLING SETUP
   ========================================================================== */
function initLenis() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    infinite: false
  });

  // Connect Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

/* ==========================================================================
   2. PRELOADER & FRAME CACHING
   ========================================================================== */
function initPreloader() {
  const percentEl = document.getElementById('preloader-percent');
  const barEl = document.getElementById('preloader-progress');
  const statusEl = document.getElementById('preloader-status');
  const preloader = document.getElementById('preloader');

  let targetProgress = 0;
  let currentProgress = 0;

  // Smooth counter ticker
  const progressInterval = setInterval(() => {
    if (currentProgress < targetProgress) {
      currentProgress += Math.ceil((targetProgress - currentProgress) * 0.15) || 1;
      if (currentProgress > 100) currentProgress = 100;

      percentEl.textContent = `${String(currentProgress).padStart(3, '0')}%`;
      barEl.style.width = `${currentProgress}%`;
    }

    if (currentProgress >= 100 && targetProgress >= 100) {
      clearInterval(progressInterval);
      setTimeout(finishPreloader, 350);
    }
  }, 25);

  if (CONFIG.USE_CANVAS) {
    // Preload frame images
    statusEl.textContent = 'CACHING 192 TELEMETRY FRAMES...';
    let loaded = 0;

    for (let i = 1; i <= CONFIG.TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = CONFIG.FRAME_PATH(i);
      
      img.onload = () => {
        loaded++;
        framesLoadedCount = loaded;
        targetProgress = Math.floor((loaded / CONFIG.TOTAL_FRAMES) * 100);
      };

      img.onerror = () => {
        const fallback = new Image();
        fallback.src = CONFIG.FRAME_FALLBACK_PATH ? CONFIG.FRAME_FALLBACK_PATH(i) : `frames/frame_${String(i).padStart(4, '0')}.png`;
        fallback.onload = () => {
          frameImages[i] = fallback;
          loaded++;
          framesLoadedCount = loaded;
          targetProgress = Math.floor((loaded / CONFIG.TOTAL_FRAMES) * 100);
        };
        fallback.onerror = () => {
          loaded++;
          targetProgress = Math.floor((loaded / CONFIG.TOTAL_FRAMES) * 100);
        };
      };

      frameImages[i] = img;
    }
  } else {
    // Video mode preload check
    statusEl.textContent = 'STREAMING PROPULSION STREAM...';
    const video = document.getElementById('scrub-video');
    video.style.display = 'block';
    document.getElementById('scrub-canvas').style.display = 'none';

    video.addEventListener('loadedmetadata', () => {
      targetProgress = 100;
    });

    // Fallback if video takes time
    setTimeout(() => {
      targetProgress = 100;
    }, 2000);
  }

  function finishPreloader() {
    statusEl.textContent = 'SYSTEMS ONLINE • READY FOR LAUNCH';

    gsap.to(preloader, {
      clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)',
      duration: 0.9,
      ease: 'power3.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        // Initialize Hero Scroll scrub after preloader wipes
        initHeroScrollScrub();
        playIntroEntranceAnimation();
      }
    });
  }
}

/* ==========================================================================
   3. INTRO ENTRANCE ANIMATIONS
   ========================================================================== */
function playIntroEntranceAnimation() {
  const tl = gsap.timeline();

  tl.from('.nav-brand', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  })
  .from('.nav-link', {
    y: -20,
    opacity: 0,
    stagger: 0.08,
    duration: 0.6,
    ease: 'power3.out'
  }, '-=0.5')
  .from('.nav-actions > *', {
    y: -20,
    opacity: 0,
    stagger: 0.08,
    duration: 0.6,
    ease: 'power3.out'
  }, '-=0.4')
  .from('#step-1 .story-badge', {
    scale: 0.8,
    opacity: 0,
    duration: 0.6,
    ease: 'back.out(1.7)'
  }, '-=0.2')
  .from('#step-1 .hero-title', {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power4.out'
  }, '-=0.4')
  .from('#step-1 .hero-desc', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  }, '-=0.6')
  .from('#step-1 .hero-metrics', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  }, '-=0.6');
}

/* ==========================================================================
   4. HERO SCROLL-CONTROLLED SCRUB (CANVAS OR VIDEO)
   ========================================================================== */
function initHeroScrollScrub() {
  const section = document.getElementById('hero-scrub-section') || document.getElementById('hero');
  const canvas = document.getElementById('scrub-canvas');
  const video = document.getElementById('scrub-video');
  const ctx = canvas ? canvas.getContext('2d') : null;

  const hudFrameVal = document.getElementById('hud-frame-val');
  const hudProgressFill = document.getElementById('hud-progress-fill');
  const hudPercent = document.getElementById('hud-percent');

  // Set Canvas resolution matching screen & DPR
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    renderFrame(currentFrameIndex);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Helper to draw image cover
  function renderFrame(index) {
    if (!ctx || !canvas) return;
    let img = frameImages[index];
    if (!img || !img.complete || img.naturalWidth === 0) {
      let bestDiff = 9999;
      let bestIndex = 1;
      for (let i = 1; i <= CONFIG.TOTAL_FRAMES; i++) {
        if (frameImages[i] && frameImages[i].complete && frameImages[i].naturalWidth > 0) {
          const diff = Math.abs(i - index);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestIndex = i;
          }
        }
      }
      img = frameImages[bestIndex];
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate aspect ratio cover math
    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const iWidth = img.naturalWidth;
    const iHeight = img.naturalHeight;

    const scale = Math.max(cWidth / iWidth, cHeight / iHeight);
    const renderW = iWidth * scale;
    const renderH = iHeight * scale;
    const x = (cWidth - renderW) / 2;
    const y = (cHeight - renderH) / 2;

    ctx.drawImage(img, x, y, renderW, renderH);
  }

  // Draw initial frame 1
  if (CONFIG.USE_CANVAS) {
    renderFrame(1);
  }

  // Story step overlays
  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4'),
    document.getElementById('step-5')
  ];

  // Hotspots
  const hotspotGrille = document.getElementById('hotspot-grille');
  const hotspotBattery = document.getElementById('hotspot-battery');
  const hotspotBrakes = document.getElementById('hotspot-brakes');

  // GSAP ScrollTrigger Scrub
  const scrubObj = { progress: 0, frame: 1 };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    pin: '#scrub-sticky',
    pinSpacing: false,
    scrub: CONFIG.SCRUB_DURATION,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const p = self.progress; // 0.0 to 1.0

      // Update Frame for Canvas Mode
      if (CONFIG.USE_CANVAS) {
        const targetFrame = Math.max(1, Math.min(CONFIG.TOTAL_FRAMES, Math.floor(p * (CONFIG.TOTAL_FRAMES - 1)) + 1));
        if (targetFrame !== currentFrameIndex) {
          currentFrameIndex = targetFrame;
          renderFrame(currentFrameIndex);
        }
      } else if (video && video.duration) {
        // HTML5 Video currentTime scrub
        video.currentTime = video.duration * p;
      }

      // Update Bottom Telemetry HUD
      const frameNumStr = String(currentFrameIndex).padStart(3, '0');
      if (hudFrameVal) hudFrameVal.textContent = `FRAME: ${frameNumStr} / ${CONFIG.TOTAL_FRAMES}`;
      const percentVal = Math.round(p * 100);
      if (hudProgressFill) hudProgressFill.style.width = `${percentVal}%`;
      if (hudPercent) hudPercent.textContent = `${percentVal}%`;

      // Synchronize Story Step Captions based on scroll progress bracket
      let activeStepIdx = 0;
      if (p < 0.20) activeStepIdx = 0;
      else if (p < 0.40) activeStepIdx = 1;
      else if (p < 0.65) activeStepIdx = 2;
      else if (p < 0.85) activeStepIdx = 3;
      else activeStepIdx = 4;

      steps.forEach((step, idx) => {
        if (!step) return;
        if (idx === activeStepIdx) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });

      // Show/Hide Hotspots at Component Moments
      if (hotspotGrille) {
        hotspotGrille.classList.toggle('visible', p >= 0.22 && p <= 0.45);
      }
      if (hotspotBattery) {
        hotspotBattery.classList.toggle('visible', p >= 0.48 && p <= 0.72);
      }
      if (hotspotBrakes) {
        hotspotBrakes.classList.toggle('visible', p >= 0.65 && p <= 0.90);
      }
    }
  });
}

/* ==========================================================================
   5. CUSTOM CURSOR & SPEED TRAIL
   ========================================================================== */
function initCustomCursor() {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    return;
  }

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');
  const canvas = document.getElementById('trail-canvas');
  const ctx = canvas.getContext('2d');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  // Particle trail pool
  const trailParticles = [];
  const MAX_TRAIL = 18;

  function resizeTrail() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeTrail);
  resizeTrail();

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

    // Add trail particle
    trailParticles.push({
      x: mouseX,
      y: mouseY,
      size: Math.random() * 5 + 3,
      alpha: 0.45,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5
    });

    if (trailParticles.length > MAX_TRAIL) {
      trailParticles.shift();
    }
  });

  window.addEventListener('mousedown', () => ring.classList.add('clicking'));
  window.addEventListener('mouseup', () => ring.classList.remove('clicking'));

  // Lerp Animation Loop for Ring & Trail
  function renderCursor() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;

    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

    // Draw tyre smoke / speed trail
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha *= 0.88;
      p.size *= 0.95;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(28, 105, 212, ${p.alpha})`;
      ctx.fill();

      if (p.alpha <= 0.02) {
        trailParticles.splice(i, 1);
      }
    }

    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  // Hover Context Labels
  document.querySelectorAll('[data-cursor]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      const text = el.getAttribute('data-cursor');
      label.textContent = text;
      ring.classList.add('active-hover');
    });

    el.addEventListener('mouseleave', () => {
      ring.classList.remove('active-hover');
      label.textContent = '';
    });
  });

  document.querySelectorAll('a, button').forEach((el) => {
    if (!el.hasAttribute('data-cursor')) {
      el.addEventListener('mouseenter', () => ring.classList.add('active-link'));
      el.addEventListener('mouseleave', () => ring.classList.remove('active-link'));
    }
  });
}

/* ==========================================================================
   6. MAGNETIC BUTTONS
   ========================================================================== */
function initMagneticElements() {
  const magnets = document.querySelectorAll('.magnetic-btn');

  magnets.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)'
      });
    });
  });
}

/* ==========================================================================
   7. NAVBAR BEHAVIORS & MOBILE DRAWER
   ========================================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Toggle blur styling
    if (currentScrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Auto-hide on scroll-down, show on scroll-up
    if (currentScrollY > lastScrollY && currentScrollY > 400) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }

    lastScrollY = currentScrollY;
  });

  // Hamburger Toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on clicking mobile link
    mobileMenu.querySelectorAll('.mobile-link').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Back to top button
  const btt = document.getElementById('back-to-top');
  if (btt) {
    btt.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.6 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

/* ==========================================================================
   8. MARQUEE VELOCITY ACCELERATION
   ========================================================================== */
function initMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track) return;

  let xPos = 0;
  const baseSpeed = 1.2;

  gsap.ticker.add(() => {
    // Read ScrollTrigger scroll velocity
    const velocity = Math.abs(ScrollTrigger.getVelocity()) * 0.003;
    const direction = ScrollTrigger.getVelocity() < 0 ? -1 : 1;

    xPos -= (baseSpeed + velocity * 2);
    if (xPos <= -track.offsetWidth / 2) {
      xPos = 0;
    }
    track.style.transform = `translateX(${xPos}px)`;
  });
}

/* ==========================================================================
   9. MODELS SHOWCASE (GSAP FLIP CATEGORY TABS)
   ========================================================================== */
function initModelsFilter() {
  const tabs = document.querySelectorAll('.tab-btn');
  const pill = document.getElementById('tabs-pill');
  const cards = document.querySelectorAll('.model-card');
  const grid = document.getElementById('models-grid');

  if (!tabs.length || !pill) return;

  function updatePill(activeBtn) {
    pill.style.width = `${activeBtn.offsetWidth}px`;
    pill.style.left = `${activeBtn.offsetLeft}px`;
  }

  // Set initial pill pos
  updatePill(tabs[0]);

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      updatePill(tab);

      const filter = tab.getAttribute('data-filter');

      // Record state for GSAP Flip
      const state = Flip.getState(cards);

      cards.forEach((card) => {
        const cats = card.getAttribute('data-category').split(' ');
        if (filter === 'all' || cats.includes(filter)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      // Animate with Flip
      Flip.from(state, {
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.05,
        scale: true,
        fade: true
      });
    });
  });
}

/* ==========================================================================
   10. PINNED HORIZONTAL SCROLL GALLERY
   ========================================================================== */
function initHorizontalScroll() {
  const section = document.getElementById('gallery');
  const track = document.getElementById('h-track');

  if (!section || !track) return;

  function getScrollAmount() {
    return -(track.scrollWidth - window.innerWidth + 120);
  }

  gsap.to(track, {
    x: getScrollAmount,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      pin: '#h-sticky',
      scrub: 1,
      invalidateOnRefresh: true
    }
  });
}

/* ==========================================================================
   11. 3D CARD TILT ON MOUSEMOVE
   ========================================================================== */
function initCardTilts() {
  if (window.matchMedia('(hover: none)').matches) return;

  const tiltCards = document.querySelectorAll('.card-tilt');

  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power3.out'
      });
    });
  });
}

/* ==========================================================================
   12. WEB AUDIO ENGINE SOUND & TACHOMETER GAUGE
   ========================================================================== */
function initEngineSoundAndGauge() {
  const startBtn = document.getElementById('engine-start-btn');
  const needle = document.getElementById('gauge-needle');
  const rpmReadout = document.getElementById('gauge-rpm-val');
  const audioToggle = document.getElementById('audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const appRoot = document.getElementById('app-root');

  // Audio object for real BMW M exhaust sound
  let exhaustAudio = null;
  try {
    exhaustAudio = new Audio('bmw_m_exhaust.wav');
    exhaustAudio.preload = 'auto';
  } catch (e) {
    console.warn('Audio creation error:', e);
  }

  // Mute / Unmute Toggle
  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      if (audioEnabled) {
        if (audioIcon) audioIcon.className = 'fa-solid fa-volume-high';
        audioToggle.style.color = '#FFFFFF';
      } else {
        if (audioIcon) audioIcon.className = 'fa-solid fa-volume-xmark';
        audioToggle.style.color = 'var(--text-dim)';
        if (exhaustAudio) {
          exhaustAudio.pause();
          exhaustAudio.currentTime = 0;
        }
      }
    });
  }

  // Web Audio Harmonic Sub-bass & Crackle Layer
  function playSynthesizedEngineRev() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      // Dual V8 Sawtooth Oscillators for visceral sub rumble
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Pitch sweep matching the rev: 75Hz -> 380Hz -> 85Hz
      osc1.frequency.setValueAtTime(75, now);
      osc1.frequency.exponentialRampToValueAtTime(380, now + 1.8);
      osc1.frequency.exponentialRampToValueAtTime(85, now + 4.2);

      osc2.frequency.setValueAtTime(38, now);
      osc2.frequency.exponentialRampToValueAtTime(190, now + 1.8);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 4.2);

      // Lowpass resonant exhaust body filter
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 1.8);
      filter.frequency.exponentialRampToValueAtTime(320, now + 4.2);
      filter.Q.value = 5.0;

      // Distortion saturation
      const waveShaper = audioCtx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = Math.tanh(x * 2.2);
      }
      waveShaper.curve = curve;

      // Master gain envelope
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.40, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.65, now + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.8);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(waveShaper);
      waveShaper.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 4.8);
      osc2.stop(now + 4.8);
    } catch (err) {
      console.warn('Web Audio synthesis error:', err);
    }
  }

  // Trigger Rev Animation, Sound & Tachometer Sweep
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      // 1. Unmute audio automatically when user clicks engine button
      audioEnabled = true;
      if (audioIcon) audioIcon.className = 'fa-solid fa-volume-high';
      if (audioToggle) audioToggle.style.color = '#FFFFFF';

      // 2. Play authentic studio BMW M exhaust recording
      try {
        if (!exhaustAudio) {
          exhaustAudio = new Audio('bmw_m_exhaust.wav');
        }
        exhaustAudio.currentTime = 0;
        exhaustAudio.volume = 1.0;
        const playPromise = exhaustAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('HTML5 Audio play prevented:', err);
          });
        }
      } catch (e) {
        console.warn('Audio play exception:', e);
      }

      // Also trigger Web Audio harmonic sub-bass booster
      playSynthesizedEngineRev();

      // 3. Button glowing revving state
      startBtn.classList.add('revving');
      setTimeout(() => startBtn.classList.remove('revving'), 4500);

      // 4. Multi-stage screen shockwaves synchronized with rev & crackles
      if (appRoot) {
        // Initial starter catch shake
        gsap.timeline()
          .to(appRoot, { x: -6, y: 4, duration: 0.04, delay: 0.35 })
          .to(appRoot, { x: 5, y: -4, duration: 0.04 })
          .to(appRoot, { x: -3, y: 2, duration: 0.04 })
          .to(appRoot, { x: 0, y: 0, duration: 0.08 })
          // Peak rev shockwave at 1.8s
          .to(appRoot, { x: -10, y: 6, duration: 0.05, delay: 0.9 })
          .to(appRoot, { x: 9, y: -7, duration: 0.05 })
          .to(appRoot, { x: -6, y: 5, duration: 0.05 })
          .to(appRoot, { x: 0, y: 0, duration: 0.1 })
          // Overrun burble vibration at 2.8s
          .to(appRoot, { x: -4, y: 3, duration: 0.03, delay: 0.5 })
          .to(appRoot, { x: 4, y: -3, duration: 0.03 })
          .to(appRoot, { x: -3, y: 2, duration: 0.03 })
          .to(appRoot, { x: 0, y: 0, duration: 0.06 });
      }

      // 5. Tachometer Needle Sweep matching BMW exhaust profile
      if (needle && rpmReadout) {
        gsap.killTweensOf(needle);
        const tl = gsap.timeline();

        // Stage 1: Starter churn & ignition catch (1,200 -> 3,200 RPM)
        tl.to(needle, {
          rotation: 50,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: function() {
            const currentRpm = Math.floor(1200 + this.progress() * 2000);
            rpmReadout.textContent = currentRpm.toLocaleString();
          }
        })
        .to(needle, {
          rotation: 30,
          duration: 0.4,
          ease: 'power1.inOut',
          onUpdate: function() {
            const currentRpm = Math.floor(3200 - this.progress() * 900);
            rpmReadout.textContent = currentRpm.toLocaleString();
          }
        })
        // Stage 2: TwinPower Turbo surge to 7,250 RPM redline!
        .to(needle, {
          rotation: 145,
          duration: 1.1,
          ease: 'power3.in',
          onUpdate: function() {
            const currentRpm = Math.floor(2300 + this.progress() * 4950);
            rpmReadout.textContent = currentRpm.toLocaleString();
          }
        })
        // Stage 3: Redline limiter stutter
        .to(needle, {
          rotation: 140,
          duration: 0.06,
          yoyo: true,
          repeat: 4,
          ease: 'rough'
        })
        // Stage 4: Overrun deceleration with burble crackle drops
        .to(needle, {
          rotation: 15,
          duration: 1.3,
          ease: 'power2.out',
          onUpdate: function() {
            const currentRpm = Math.floor(7250 - this.progress() * 6050);
            rpmReadout.textContent = currentRpm.toLocaleString();
          }
        })
        // Stage 5: Settle back into BMW M idle (1,200 RPM)
        .to(needle, {
          rotation: 0,
          duration: 0.7,
          ease: 'power2.inOut',
          onUpdate: function() {
            const currentRpm = Math.floor(1200 + (1 - this.progress()) * 150);
            rpmReadout.textContent = currentRpm.toLocaleString();
          }
        });
      }
    });
  }

  // Stats Counters Animation via ScrollTrigger
  ScrollTrigger.create({
    trigger: '#m-performance',
    start: 'top 70%',
    onEnter: () => {
      document.querySelectorAll('.counter-num').forEach((counter) => {
        const target = parseInt(counter.getAttribute('data-target'), 10);
        gsap.to(counter, {
          innerText: target,
          duration: 2,
          snap: { innerText: 1 },
          ease: 'power3.out'
        });
      });
    }
  });
}

/* ==========================================================================
   13. BATTERY & RANGE SIMULATOR (BMW i)
   ========================================================================== */
function initBatterySimulator() {
  const slider = document.getElementById('charge-slider');
  const fill = document.getElementById('battery-fill');
  const percentDisplay = document.getElementById('battery-percent-display');
  const rangeVal = document.getElementById('range-val');

  if (!slider) return;

  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    fill.style.width = `${val}%`;
    percentDisplay.textContent = `${val}% CHARGED`;

    // 100% = 680km WLTP
    const estRange = Math.round((val / 100) * 680);
    rangeVal.textContent = `${estRange} KM`;
  });
}

/* ==========================================================================
   14. BESPOKE CONFIGURATOR TEASER
   ========================================================================== */
function initConfigurator() {
  const swatches = document.querySelectorAll('.swatch-btn');
  const tint = document.getElementById('paint-tint');
  const glow = document.getElementById('paint-glow');
  const colorName = document.getElementById('config-color-name');
  const wheelBtns = document.querySelectorAll('.wheel-btn');
  const wheelName = document.getElementById('config-wheel-name');

  swatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      swatches.forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');

      const tintColor = swatch.getAttribute('data-tint');
      const name = swatch.getAttribute('data-name');
      const baseBg = swatch.style.background;

      if (tint) tint.style.backgroundColor = tintColor;
      if (glow) glow.style.background = `radial-gradient(circle, ${tintColor} 0%, transparent 70%)`;
      if (colorName) colorName.textContent = name;
    });
  });

  wheelBtns.forEach((wBtn) => {
    wBtn.addEventListener('click', () => {
      wheelBtns.forEach((b) => b.classList.remove('active'));
      wBtn.classList.add('active');

      const name = wBtn.getAttribute('data-name');
      if (wheelName) wheelName.textContent = name;
    });
  });
}

/* ==========================================================================
   15. DRAGGABLE TESTIMONIALS SLIDER
   ========================================================================== */
function initTestimonialsSlider() {
  const wrap = document.getElementById('t-slider-wrap');
  const track = document.getElementById('t-track');

  if (!wrap || !track) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  wrap.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - wrap.offsetLeft;
    scrollLeft = wrap.scrollLeft;
  });

  wrap.addEventListener('mouseleave', () => (isDown = false));
  wrap.addEventListener('mouseup', () => (isDown = false));

  wrap.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - wrap.offsetLeft;
    const walk = (x - startX) * 1.5;
    wrap.scrollLeft = scrollLeft - walk;
  });
}

/* ==========================================================================
   16. BOOK A TEST DRIVE FORM & EMAIL CONFIRMATION DISPATCH
   ========================================================================== */
function initTestDriveForm() {
  const form = document.getElementById('drive-form');
  const feedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('drive-submit-btn');

  // Modal elements
  const modal = document.getElementById('email-confirm-modal');
  const modalRecipient = document.getElementById('modal-recipient-email');
  const modalSubject = document.getElementById('modal-subject-line');
  const modalBody = document.getElementById('modal-email-content');
  const btnCloseModal = document.getElementById('close-modal-btn');
  const btnDoneModal = document.getElementById('btn-done-modal');
  const btnMailApp = document.getElementById('btn-mail-app');
  const btnOpenTab = document.getElementById('btn-open-email-tab');

  if (!form) return;

  // Modal close handlers
  function closeModal() {
    if (modal) modal.classList.remove('open');
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnDoneModal) btnDoneModal.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('drive-name').value.trim();
    const email = document.getElementById('drive-email').value.trim();
    const phone = document.getElementById('drive-phone').value.trim();
    const model = document.getElementById('drive-model').value;
    const date = document.getElementById('drive-date').value;

    if (!name || !email || !model || !date) {
      feedback.className = 'form-feedback error';
      feedback.textContent = 'PLEASE COMPLETE ALL HIGH-PERFORMANCE FIELDS';
      return;
    }

    // Set loading state on submit button
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>DISPATCHING EMAIL PASS...</span>`;
    feedback.className = 'form-feedback';
    feedback.textContent = 'CONNECTING TO BAVARIA ALLOCATION SERVER...';

    const bookingRef = `BMWM-${Math.floor(100000 + Math.random() * 900000)}`;

    const modelDisplay = {
      m3: "BMW M3 Competition Sedan (503 HP)",
      m4: "BMW M4 CSL Coupe (543 HP)",
      m2: "BMW M2 Coupe (453 HP Manual)",
      x5m: "BMW X5 M Competition (617 HP)",
      i4: "BMW i4 M50 Electric (536 HP)",
      ix: "BMW iX M60 Electric (610 HP)"
    }[model] || model.toUpperCase();

    let emailHtml = "";
    let serverSuccess = false;
    let smtpDelivered = false;

    try {
      // Send to local backend API
      const res = await fetch('/api/book-test-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, model, date })
      });

      if (res.ok) {
        const result = await res.json();
        serverSuccess = true;
        emailHtml = result.htmlEmail || "";
        smtpDelivered = result.smtpSent;
      }
    } catch (err) {
      console.warn("Backend API not reachable:", err);
    }

    // Populate and open Email Confirmation Modal
    if (modalRecipient) modalRecipient.textContent = email;
    if (modalSubject) modalSubject.textContent = `///M CONFIRMED: Your BMW Test Drive Allocation Pass [${bookingRef}]`;
    if (modalBody) modalBody.innerHTML = emailHtml;

    // Configure Direct Gmail Web link as extra convenience
    const btnGmail = document.getElementById('btn-gmail-web');
    if (btnGmail) {
      const gSubject = encodeURIComponent(`///M CONFIRMED: Your BMW Test Drive Allocation Pass [${bookingRef}]`);
      const gBody = encodeURIComponent(
        `Dear ${name},\n\nYour BMW M Test Drive reservation has been officially confirmed!\n\n` +
        `• Booking Reference: ${bookingRef}\n` +
        `• Vehicle: ${modelDisplay}\n` +
        `• Date: ${date}\n` +
        `• Location: Bavaria M Performance Center (VIP Track Course)\n` +
        `• Contact: ${phone}\n\n` +
        `Please present your driver's license upon arrival.\n\n` +
        `Bavaria Motor Works Retail Partner • M Division`
      );
      btnGmail.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${gSubject}&body=${gBody}`;
    }

    // Configure .EML Download & Full View
    const btnEml = document.getElementById('btn-download-eml');
    if (btnEml) {
      btnEml.href = `/test_drive_confirmation.eml?v=${Date.now()}`;
    }

    if (btnOpenTab) {
      btnOpenTab.href = `/last_confirmation_email.html?v=${Date.now()}`;
    }

    // Restore button state
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;

    // Show on-page feedback
    feedback.className = 'form-feedback success';
    if (smtpDelivered) {
      feedback.textContent = `SUCCESS! AN OFFICIAL CONFIRMATION EMAIL HAS BEEN SENT DIRECTLY TO ${email.toUpperCase()}!`;
    } else {
      feedback.textContent = `CONFIRMATION EMAIL DISPATCHED TO ${email.toUpperCase()}! VIEW YOUR ALLOCATION PASS BELOW.`;
    }

    // Open Modal with smooth popup
    if (modal) {
      modal.classList.add('open');
    }

    // Trigger Canvas Confetti Celebration in M Colors
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        colors: [CONFIG.COLORS.mLightBlue, CONFIG.COLORS.mDarkBlue, CONFIG.COLORS.mRed, '#FFFFFF']
      });

      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: [CONFIG.COLORS.bmwBlue, CONFIG.COLORS.mRed]
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: [CONFIG.COLORS.mLightBlue, '#FFFFFF']
        });
      }, 300);
    }

    form.reset();
  });
}

/* ==========================================================================
   17. EASTER EGGS: KEY 'M' SWEEP, KONAMI CODE & SPORT MODE TOGGLE
   ========================================================================== */
function initEasterEggs() {
  const wipeOverlay = document.getElementById('m-wipe-overlay');
  const sportToggle = document.getElementById('sport-toggle');

  // 1. Sport Mode Toggle
  if (sportToggle) {
    sportToggle.addEventListener('click', () => {
      const isSport = document.body.getAttribute('data-theme') === 'm-sport';
      if (isSport) {
        document.body.setAttribute('data-theme', 'm-default');
      } else {
        document.body.setAttribute('data-theme', 'm-sport');
      }
    });
  }

  // 2. Press "M" Key for M Motorsport Fullscreen Stripe Sweep
  window.addEventListener('keydown', (e) => {
    // Ignore if user is currently typing in an input field
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.key === 'm' || e.key === 'M') {
      if (wipeOverlay) {
        wipeOverlay.classList.remove('active-sweep');
        void wipeOverlay.offsetWidth; // Trigger reflow
        wipeOverlay.classList.add('active-sweep');
      }
    }
  });

  // 3. Konami Code: Up Up Down Down Left Right Left Right B A
  const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];
  let konamiIndex = 0;

  window.addEventListener('keydown', (e) => {
    if (e.code === konamiSequence[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        // Konami Code Triggered!
        konamiIndex = 0;
        triggerExplodedShockwave();
      }
    } else {
      konamiIndex = 0;
    }
  });

  function triggerExplodedShockwave() {
    alert('///M POWER UNLOCKED: MAXIMUM ADRENALINE OVERDRIVE ACTIVATED!');
    document.body.setAttribute('data-theme', 'm-sport');
    if (wipeOverlay) {
      wipeOverlay.classList.add('active-sweep');
    }
  }
}

/* ==========================================================================
   18. BACKGROUND FLOATING PARTICLES / SPARKS CANVAS
   ========================================================================== */
function initSparksCanvas() {
  const canvas = document.getElementById('sparks-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const sparks = [];
  const COUNT = 35;

  for (let i = 0; i < COUNT; i++) {
    sparks.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.8 - 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '#1C69D4' : '#81C4FF'
    });
  }

  function renderSparks() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.x += s.speedX;
      s.y += s.speedY;

      if (s.y < 0) {
        s.y = height + 10;
        s.x = Math.random() * width;
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.opacity;
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.color;
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    requestAnimationFrame(renderSparks);
  }
  renderSparks();
}
