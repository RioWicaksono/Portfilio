/* ============================================================
   RW PORTFOLIO — GSAP-LEVEL SCROLL ENGINE v4
   Features:
   - Overflow-mask word reveals (no opacity, pure Y clip)
   - Velocity-reactive GSAP-driven marquee
   - Horizontal pinned project scroll
   - 3D skill card entrances + tag stagger
   - Magnetic buttons
   - Scrubbed multi-layer parallax
   - Section scale-in on scroll
   ============================================================ */

'use strict';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

let lenis = null;
let scrollVelocity = 0;
const body = document.body;

// ============================================================
// LENIS SMOOTH SCROLL
// ============================================================
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 1.6,
  });
  lenis.on('scroll', ({ velocity }) => {
    scrollVelocity = velocity;
    ScrollTrigger.update();
  });
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ============================================================
// LOADER
// ============================================================
function initLoader() {
  const loader = document.getElementById('loader');
  const fill = document.querySelector('.loader__fill');
  if (!loader) return;

  gsap.to(fill, {
    width: '100%',
    duration: 1.8,
    ease: 'expo.inOut',
    onComplete() {
      gsap.timeline({
        onComplete() {
          loader.style.display = 'none';
          body.style.overflow = '';
          initLenis();
          initAnimations();
          ScrollTrigger.refresh();
        }
      })
        .to('.loader__text', { y: -32, opacity: 0, duration: 0.4, ease: 'power3.in' }, 0)
        .to('.loader__bar', { scaleX: 0, opacity: 0, duration: 0.3, ease: 'power3.in' }, 0.05)
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, 0.25);
    }
  });
}

// ============================================================
// CURSOR
// ============================================================
function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  if (!cursor || !follower || globalThis.matchMedia('(hover: none)').matches) return;

  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.to(cursor, { x: mx, y: my, duration: 0.06, ease: 'none' });
  });

  (function tick() {
    fx += (mx - fx) * 0.085;
    fy += (my - fy) * 0.085;
    gsap.set(follower, { x: fx, y: fy });
    requestAnimationFrame(tick);
  })();

  const hoverEls = 'a, button, .project-card, .skill-card, .stat, .cert-item';
  document.addEventListener('mouseover', e => { if (e.target.closest(hoverEls)) body.classList.add('cursor-hover'); });
  document.addEventListener('mouseout', e => { if (e.target.closest(hoverEls)) body.classList.remove('cursor-hover'); });
  document.addEventListener('mouseleave', () => gsap.to([cursor, follower], { opacity: 0, duration: 0.3 }));
  document.addEventListener('mouseenter', () => gsap.to([cursor, follower], { opacity: 1, duration: 0.3 }));
}

// ============================================================
// MAGNETIC BUTTONS
// ============================================================
function initMagnetic() {
  if (globalThis.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.btn, .nav__logo a').forEach(el => {
    el.style.willChange = 'transform';
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
      gsap.to(el, { x: dx, y: dy, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// ============================================================
// NAVIGATION
// ============================================================
function resetHamburger(btn) {
  const s = btn.querySelectorAll('span');
  gsap.to(s[0], { rotateZ: 0, y: 0, duration: 0.35, ease: 'expo.out' });
  gsap.to(s[1], { opacity: 1, x: 0, duration: 0.2 });
  gsap.to(s[2], { rotateZ: 0, y: 0, duration: 0.35, ease: 'expo.out' });
}

function initNav() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const scrollProgress = document.getElementById('scrollProgress');
  if (!nav) return;

  ScrollTrigger.create({
    start: 'top -60px',
    onEnter: () => nav.classList.add('scrolled'),
    onLeaveBack: () => nav.classList.remove('scrolled'),
  });

  if (scrollProgress) {
    gsap.to(scrollProgress, {
      width: '100%', ease: 'none',
      scrollTrigger: { scrub: 0.3, start: 'top top', end: 'bottom bottom' }
    });
  }

  document.querySelectorAll('section[id]').forEach(section => {
    ScrollTrigger.create({
      trigger: section, start: 'top 55%', end: 'bottom 55%',
      onEnter: () => setActive(section.id),
      onEnterBack: () => setActive(section.id),
    });
  });

  function setActive(id) {
    document.querySelectorAll('.nav__link, .mobile-menu__link').forEach(el => {
      el.classList.toggle('active', el.dataset.section === id);
    });
  }

  document.querySelectorAll('[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      if (mobileMenu) mobileMenu.classList.remove('open');
      if (navToggle) resetHamburger(navToggle);
      if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.8 });
      else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      const spans = navToggle.querySelectorAll('span');
      if (open) {
        gsap.to(spans[0], { rotateZ: 45, y: 7, duration: 0.35, ease: 'expo.out' });
        gsap.to(spans[1], { opacity: 0, x: 10, duration: 0.2 });
        gsap.to(spans[2], { rotateZ: -45, y: -7, duration: 0.35, ease: 'expo.out' });
        gsap.fromTo('.mobile-menu__link',
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.07, duration: 0.55, ease: 'expo.out', delay: 0.2 }
        );
      } else {
        resetHamburger(navToggle);
        // Animate links out before menu closes
        gsap.to('.mobile-menu__link', {
          opacity: 0, y: 20, duration: 0.25, stagger: 0.03, ease: 'power3.in',
        });
      }
    });
  }
}

// ============================================================
// SPLIT TITLE — overflow-mask word reveal, preserves inner HTML
// ============================================================
function splitTitle(el) {
  if (!el || el.dataset.split === 'done') return [];
  el.dataset.split = 'done';

  const innerEls = [];
  const nodes = Array.from(el.childNodes);
  const frag = document.createDocumentFragment();

  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.trim().split(/\s+/).filter(Boolean).forEach(word => {
        const wrap = document.createElement('span');
        // overflow:hidden clips characters sliding in from below — signature GSAP reveal
        wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:text-bottom;padding-bottom:0.1em;';
        const inner = document.createElement('span');
        inner.className = 'word-inner';
        inner.style.display = 'inline-block';
        inner.textContent = word + '\u00A0';
        wrap.appendChild(inner);
        frag.appendChild(wrap);
        innerEls.push(inner);
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.textContent.trim().split(/\s+/).filter(Boolean).forEach(word => {
        const wrap = document.createElement('span');
        wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:text-bottom;padding-bottom:0.1em;';
        const inner = node.cloneNode(false);
        inner.className = (inner.className + ' word-inner').trim();
        inner.style.display = 'inline-block';
        inner.textContent = word + '\u00A0';
        wrap.appendChild(inner);
        frag.appendChild(wrap);
        innerEls.push(inner);
      });
    }
  });

  el.innerHTML = '';
  el.appendChild(frag);
  return innerEls;
}

// ============================================================
// GSAP-DRIVEN VELOCITY-REACTIVE MARQUEE
// ============================================================
function initMarquee() {
  const tracks = document.querySelectorAll('.marquee-track');
  if (!tracks.length) return;

  tracks.forEach(track => {
    const isReverse = track.classList.contains('marquee-track--reverse');
    // Stop the CSS animation — GSAP takes over
    track.style.animation = 'none';
    track.style.willChange = 'transform';

    // Wait one frame for scrollWidth to be accurate after CSS animation removed
    requestAnimationFrame(() => {
      const halfWidth = track.scrollWidth / 2;
      let x = isReverse ? -(halfWidth * 0.1) : 0;
      let lastTime = 0;

      gsap.ticker.add(time => {
        if (!lastTime) { lastTime = time; return; }
        const dt = Math.min(time - lastTime, 0.05);
        lastTime = time;

        // Base speed: pixels per second so one loop = 28s
        const base = halfWidth / 28;
        const boost = Math.min(Math.abs(scrollVelocity) * 0.5, base * 2.5);
        const speed = (base + boost) * dt;

        x += isReverse ? speed : -speed;

        // Seamless loop via modulo
        if (x <= -halfWidth) x += halfWidth;
        if (x >= 0) x -= halfWidth;

        gsap.set(track, { x, force3D: true });
      });
    });
  });
}

// ============================================================
// PARTICLES
// ============================================================
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = window.innerWidth > 768 ? 40 : 18;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 2.5 + 0.8;
    dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:var(--accent);border-radius:50%;opacity:${(Math.random() * 0.3 + 0.06).toFixed(2)};left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;pointer-events:none;`;
    container.appendChild(dot);
    gsap.to(dot, {
      x: (Math.random() - 0.5) * 90,
      y: (Math.random() - 0.5) * 130,
      duration: Math.random() * 8 + 8,
      repeat: -1, yoyo: true, ease: 'sine.inOut', delay: Math.random() * 6,
    });
  }
}

// ============================================================
// INITIAL STATES (hero only — scroll-triggered elements use fromTo)
// ============================================================
function setInitialStates() {
  // Hero — revealed in initHero() after loader completes
  gsap.set('.hero__badge', { opacity: 0, y: 28 });
  gsap.set('.hero__hello, .hero__name', { opacity: 0 }); // hidden until split + reveal
  gsap.set('.hero__role', { opacity: 0, y: 24 });
  gsap.set('.hero__desc', { opacity: 0, y: 24 });
  gsap.set('.hero__cta', { opacity: 0, y: 24 });
  gsap.set('.hero__scroll-indicator', { opacity: 0, y: 20 });
  gsap.set('.hero__visual', { opacity: 0, scale: 0.88, y: 20 });

  // Scroll-triggered elements — pre-hidden during loader to prevent flash
  gsap.set('.section__tag', { opacity: 0, y: 16 });
  gsap.set('.about__left', { opacity: 0, x: -70 });
  gsap.set('.about__stats', { opacity: 0, x: 70 });
  gsap.set('.about__text p', { opacity: 0, y: 28 });
  gsap.set('.skill-card', { opacity: 0, y: 70 });
  gsap.set('.certs', { opacity: 0, y: 40 });
  gsap.set('.timeline__item', { opacity: 0, x: 60 });
  gsap.set('.contact__lead', { opacity: 0, y: 40 });
  gsap.set('.contact__link', { opacity: 0, x: -60 });
  gsap.set('.service-card', { opacity: 0, y: 60 });
}

// ============================================================
// HERO ANIMATION
// ============================================================
function initHero() {
  const hello = document.querySelector('.hero__hello');
  const nameEl = document.querySelector('.hero__name');
  const tl = gsap.timeline({ delay: 0.05 });

  // Badge slides up with opacity
  tl.to('.hero__badge', { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0);

  // "Hello." — overflow-mask reveal with slight rotation (pure clip, max GSAP feel)
  if (hello) {
    const words = splitTitle(hello);
    gsap.set(hello, { opacity: 1 }); // reveal container — words clipped inside overflow wraps
    gsap.set(words, { y: '120%', rotation: 6 });
    tl.to(words, { y: '0%', rotation: 0, duration: 1, stagger: 0.06, ease: 'expo.out' }, 0.2);
  }

  // "I'm Rio Wicaksono" — same mask reveal, slightly delayed
  if (nameEl) {
    const words = splitTitle(nameEl);
    gsap.set(nameEl, { opacity: 1 }); // reveal container — words clipped inside overflow wraps
    gsap.set(words, { y: '120%', rotation: 5 });
    tl.to(words, { y: '0%', rotation: 0, duration: 1.05, stagger: 0.055, ease: 'expo.out' }, 0.55);
  }

  tl.to('.hero__role', { y: 0, opacity: 1, duration: 0.75, ease: 'expo.out' }, 0.9)
    .to('.hero__desc', { y: 0, opacity: 1, duration: 0.75, ease: 'expo.out' }, 1.05)
    .to('.hero__cta', { y: 0, opacity: 1, duration: 0.75, ease: 'expo.out' }, 1.15)
    .to('.hero__scroll-indicator', { y: 0, opacity: 1, duration: 0.65, ease: 'expo.out' }, 1.3)
    .to('.hero__visual', { opacity: 1, scale: 1, y: 0, duration: 1.5, ease: 'expo.out' }, 0.65);

  // SVG orbital float
  gsap.to('.hero__visual-float', {
    y: -18, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut',
  });

  // Multi-layer scrubbed parallax (different speeds = depth)
  gsap.to('.hero__grid', {
    yPercent: 32, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
  });
  gsap.to('.hero__gradient', {
    yPercent: 22, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 }
  });
  gsap.to('.hero__visual', {
    yPercent: 28, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.1 }
  });
  gsap.to('.hero__left', {
    yPercent: 10, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7 }
  });
}

// ============================================================
// SECTION TITLES — overflow-mask word reveal with rotation
// ============================================================
function initScrollTitles() {
  document.querySelectorAll('.section__title').forEach(title => {
    const header = title.closest('.section__header');
    const words = splitTitle(title);
    const tag = header ? header.querySelector('.section__tag') : null;

    // Set initial states BEFORE creating the ScrollTrigger
    // (prevents words flashing in if the element happens to be in viewport on init)
    if (words.length) gsap.set(words, { y: '115%', rotation: 4 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: header || title, start: 'top 85%', end: 'top 48%', scrub: 0.6 }
    });

    if (tag) {
      tl.to(tag, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0);
    }

    if (words.length) {
      tl.to(words, {
        y: '0%', rotation: 0,
        duration: 0.95, stagger: 0.04, ease: 'expo.out'
      }, tag ? 0.08 : 0);
    }
  });
}

// ============================================================
// ABOUT
// ============================================================
function initAbout() {
  // Left col: slide from left
  gsap.fromTo('.about__left',
    { x: -70, opacity: 0 },
    { x: 0, opacity: 1, ease: 'expo.out', scrollTrigger: { trigger: '.about__left', start: 'top 82%', end: 'top 45%', scrub: 0.8 } }
  );

  // Text paras
  document.querySelectorAll('.about__text p').forEach(p => {
    gsap.fromTo(p,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 90%', end: 'top 58%', scrub: 0.5 } }
    );
  });

  // Stats col: slide from right
  gsap.fromTo('.about__stats',
    { x: 70, opacity: 0 },
    { x: 0, opacity: 1, ease: 'expo.out', scrollTrigger: { trigger: '.about__stats', start: 'top 82%', end: 'top 45%', scrub: 0.8 } }
  );

  // Stat counter — scrubbed directly to scroll position
  document.querySelectorAll('.stat__number').forEach(el => {
    const target = Number.parseInt(el.dataset.count, 10) || 0;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      ease: 'none',
      onUpdate() { el.textContent = Math.round(obj.val); },
      scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 42%', scrub: 1 }
    });
  });

  // Avatar float
  gsap.to('.about__avatar-float', { y: -12, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

// ============================================================
// SKILLS — 3D entrance + tag stagger
// ============================================================
function initSkills() {
  document.querySelectorAll('.skill-card').forEach(card => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 48%', scrub: 0.65 }
    });

    // Card flips down with perspective
    tl.fromTo(card,
      { y: 70, opacity: 0, rotateX: -18, transformPerspective: 900, transformOrigin: 'top center' },
      { y: 0, opacity: 1, rotateX: 0, duration: 0.9, ease: 'expo.out' }
    );

    // Tags pop in after card
    const tags = card.querySelectorAll('.tag');
    if (tags.length) {
      tl.fromTo(tags,
        { y: 12, opacity: 0, scale: 0.82 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.04, duration: 0.4, ease: 'back.out(1.6)' },
        '-=0.5'
      );
    }
  });

  // Certs strip
  gsap.fromTo('.certs',
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, ease: 'expo.out', scrollTrigger: { trigger: '.certs', start: 'top 90%', end: 'top 62%', scrub: 0.5 } }
  );
}

// ============================================================
// TIMELINE
// ============================================================
function initTimeline() {
  // Scrub-driven line growth
  ScrollTrigger.create({
    trigger: '.timeline', start: 'top 65%', end: 'bottom 35%', scrub: 0.8,
    onUpdate: self => {
      const bar = document.getElementById('timelineProgress');
      if (bar) bar.style.height = (self.progress * 100) + '%';
    }
  });

  // Items slide from right — scrubbed, tags follow in same timeline
  document.querySelectorAll('.timeline__item').forEach(item => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: item, start: 'top 88%', end: 'top 45%', scrub: 0.7 }
    });
    tl.fromTo(item,
      { x: 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: 'expo.out' }
    );
    const tags = item.querySelectorAll('.tag');
    if (tags.length) {
      tl.fromTo(tags,
        { opacity: 0, scale: 0.85 },
        { opacity: 1, scale: 1, stagger: 0.04, duration: 0.5, ease: 'back.out(1.5)' },
        '-=0.4'
      );
    }
  });
}

// ============================================================
// PROJECTS — HORIZONTAL PINNED SCROLL on desktop
// ============================================================
function initProjects() {
  const section = document.querySelector('.projects');
  const grid = document.querySelector('.projects__grid');
  if (!section || !grid) return;

  const mm = gsap.matchMedia();

  // DESKTOP: horizontal scroll
  mm.add('(min-width: 1024px)', () => {
    const getShift = () => grid.scrollWidth - window.innerWidth;

    gsap.to(grid, {
      x: () => -getShift(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 1.4,
        start: 'top top',
        end: () => `+=${getShift()}`,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      }
    });

    // Cards are naturally visible; horizontal scroll is the reveal UX on desktop

    return () => { gsap.set(grid, { x: 0 }); };
  });

  // MOBILE / TABLET: vertical stacked
  mm.add('(max-width: 1023px)', () => {
    document.querySelectorAll('.project-card').forEach(card => {
      gsap.fromTo(card,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 55%', scrub: 0.6 } }
      );
    });
  });
}

// ============================================================
// CONTACT
// ============================================================
function initContact() {
  gsap.fromTo('.contact__lead',
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, ease: 'expo.out', scrollTrigger: { trigger: '.contact__lead', start: 'top 88%', end: 'top 58%', scrub: 0.6 } }
  );

  gsap.fromTo('.contact__link',
    { x: -60, opacity: 0 },
    { x: 0, opacity: 1, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.contact__links', start: 'top 88%', end: 'top 58%', scrub: 0.6 } }
  );
}

// ============================================================
// PROJECT GLOW
// ============================================================
function initProjectGlow() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
}

// ============================================================
// SECTION SCALE-IN ON SCROLL (subtle scrubbed entrance)
// ============================================================
function initSectionReveals() {
  gsap.utils.toArray('.section:not(.hero):not(.projects)').forEach(section => {
    gsap.fromTo(section,
      { scale: 0.97, transformOrigin: 'top center' },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top 100%', end: 'top 45%', scrub: 0.6 } }
    );
  });
}

// ============================================================
// SERVICES
// ============================================================
function initServices() {
  document.querySelectorAll('.service-card').forEach((card) => {
    gsap.fromTo(card,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 48%', scrub: 0.65 }
      }
    );
  });
}

// ============================================================
// BACK TO TOP
// ============================================================
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  ScrollTrigger.create({
    start: '200px top',
    onEnter: () => btn.classList.add('visible'),
    onLeaveBack: () => btn.classList.remove('visible'),
  });

  btn.addEventListener('click', () => {
    lenis.scrollTo(0, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
  });
}

// ============================================================
// INIT ALL
// ============================================================
function initAnimations() {
  initScrollTitles();
  initHero();
  initAbout();
  initServices();
  initSkills();
  initTimeline();
  initProjects();
  initContact();
  initProjectGlow();
  initParticles();
  initSectionReveals();
  initMagnetic();
  initMarquee();
  initBackToTop();
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  body.style.overflow = 'hidden';
  setInitialStates();
  initCursor();
  initNav();
  initLoader();
});
