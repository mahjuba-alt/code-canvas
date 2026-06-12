/* ============================================================
   CODE & CANVAS — script.js
   Vanilla JavaScript — no frameworks, no libraries
   ============================================================ */

'use strict';

/* ============================================================
   1. UTILITY HELPERS
   ============================================================ */

/**
 * Shorthand querySelector
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element|null}
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Shorthand querySelectorAll → Array
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element[]}
 */
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Throttle: limit how often a function fires
 * @param {Function} fn
 * @param {number} limit  ms
 * @returns {Function}
 */
const throttle = (fn, limit = 100) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
};

/**
 * Debounce: delay execution until activity stops
 * @param {Function} fn
 * @param {number} delay  ms
 * @returns {Function}
 */
const debounce = (fn, delay = 200) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

/* ============================================================
   2. MOBILE MENU TOGGLE
   ============================================================ */

const initMobileMenu = () => {
  const toggle = $('.navbar__toggle');
  const menu   = $('.navbar__menu');
  const header = $('.site-header');

  if (!toggle || !menu) return;

  const openMenu = () => {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('is-open');
    menu.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  };

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('is-open');
    menu.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const toggleMenu = () => {
    const isOpen = menu.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  };

  toggle.addEventListener('click', toggleMenu);

  // Close when a nav link is clicked
  $$('.navbar__link', menu).forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
  });

  // Close when clicking outside the menu
  document.addEventListener('click', e => {
    if (
      menu.classList.contains('is-open') &&
      !menu.contains(e.target) &&
      !toggle.contains(e.target)
    ) closeMenu();
  });
};

/* ============================================================
   3. NAVBAR — BACKGROUND CHANGE ON SCROLL
   ============================================================ */

const initNavbarScroll = () => {
  const header = $('.site-header');
  if (!header) return;

  const update = () => {
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  window.addEventListener('scroll', throttle(update, 80), { passive: true });
  update(); // run once on load
};

/* ============================================================
   4. SMOOTH SCROLLING
   ============================================================ */

const initSmoothScroll = () => {
  // Handle all anchor links pointing to an ID on the same page
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id === '#') return; // bare # — do nothing
      const target = $(id);
      if (!target) return;

      e.preventDefault();

      // Respect CSS scroll-padding-top (set to nav height via :root)
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Move focus for accessibility (screen readers)
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
};

/* ============================================================
   5. ACTIVE NAVBAR LINK HIGHLIGHT (INTERSECTION OBSERVER)
   ============================================================ */

const initActiveNav = () => {
  const sections = $$('main section[id]');
  const navLinks = $$('.navbar__link[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  const setActive = id => {
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('navbar__link--active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, {
    rootMargin: '-40% 0px -55% 0px', // trigger when section is in the middle band
    threshold: 0,
  });

  sections.forEach(s => observer.observe(s));
};

/* ============================================================
   6. SCROLL REVEAL ANIMATIONS
   ============================================================ */

const initScrollReveal = () => {
  // Elements with these classes animate in when they enter the viewport
  const targets = $$(
    '.fade-up, .fade-left, .fade-right, .reveal, ' +
    '.stagger-children, .project-card, .gallery__item, ' +
    '.stat-card, .skill-item, .about__grid, .timeline__item, ' +
    '.skills__category'
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      el.classList.add('is-visible');

      // Trigger skill bar fills once their container is visible
      if (el.classList.contains('skills__category')) {
        $$('.skill-item__fill', el).forEach(bar => bar.style.transform = 'scaleX(1)');
      }

      observer.unobserve(el); // animate once only
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.08,
  });

  targets.forEach(el => observer.observe(el));
};

/* ============================================================
   7. TYPING EFFECT — HERO TAGLINE
   ============================================================ */

const initTypingEffect = () => {
  const target = $('.hero__tagline');
  if (!target) return;

  // Preserve the original text after the DOM is ready
  const fullText = target.textContent.trim();
  target.textContent = '';
  target.setAttribute('aria-label', fullText); // keep it accessible

  // Create a visible span and a cursor span
  const textSpan   = document.createElement('span');
  textSpan.setAttribute('aria-hidden', 'true');
  const cursorSpan = document.createElement('span');
  cursorSpan.setAttribute('aria-hidden', 'true');
  cursorSpan.className = 'typing-cursor';
  cursorSpan.textContent = '|';
  cursorSpan.style.cssText = `
    display: inline-block;
    margin-left: 2px;
    color: var(--clr-accent-primary);
    animation: blink-cursor 0.9s step-start infinite;
    font-style: normal;
  `;

  // Inject keyframe for cursor blink via a <style> tag (once)
  if (!$('#typing-style')) {
    const style = document.createElement('style');
    style.id = 'typing-style';
    style.textContent = `
      @keyframes blink-cursor {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  target.appendChild(textSpan);
  target.appendChild(cursorSpan);

  let index = 0;
  const speed = 38; // ms per character
  const startDelay = 900; // wait for hero fade-in animation

  const type = () => {
    if (index < fullText.length) {
      textSpan.textContent += fullText[index];
      index++;
      setTimeout(type, speed);
    } else {
      // Remove cursor after a pause
      setTimeout(() => {
        cursorSpan.style.animation = 'none';
        cursorSpan.style.opacity  = '0';
      }, 2000);
    }
  };

  setTimeout(type, startDelay);
};

/* ============================================================
   8. COUNTER ANIMATION — STATISTICS SECTION
   ============================================================ */

const initCounters = () => {
  const statNumbers = $$('.stat-card__number[data-count]');
  if (!statNumbers.length) return;

  /**
   * Animate a number from 0 to target
   * @param {HTMLElement} el
   * @param {number} target
   * @param {number} duration  ms
   */
  const animateCounter = (el, target, duration = 1800) => {
    const start     = performance.now();
    const startVal  = 0;

    // Easing: ease-out cubic
    const ease = t => 1 - Math.pow(1 - t, 3);

    const step = now => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(ease(progress) * (target - startVal) + startVal);

      el.textContent = value.toLocaleString();

      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString(); // ensure exact final value
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.count, 10);
      if (!isNaN(target)) animateCounter(el, target);
      observer.unobserve(el);
    });
  }, { threshold: 0.4 });

  statNumbers.forEach(el => observer.observe(el));
};

/* ============================================================
   9. GALLERY HOVER INTERACTIONS
   ============================================================ */

const initGallery = () => {
  const items = $$('.gallery__item');
  if (!items.length) return;

  items.forEach(item => {
    const img = $('img', item);
    if (!img) return;

    // Subtle parallax tilt on mouse move
    item.addEventListener('mousemove', e => {
      const rect   = item.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2); // -1 → 1
      const dy     = (e.clientY - cy) / (rect.height / 2); // -1 → 1
      const tiltX  = dy * -4;  // max 4deg
      const tiltY  = dx *  4;

      item.style.transform  = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
      item.style.transition = 'transform 0.1s linear';
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform  = '';
      item.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    });

    // Keyboard: show caption on focus
    item.setAttribute('tabindex', '0');
    item.addEventListener('focus', () => item.classList.add('is-focused'));
    item.addEventListener('blur',  () => item.classList.remove('is-focused'));
  });
};

/* ============================================================
   10. PROJECT FILTER TABS
   ============================================================ */

const initProjectFilter = () => {
  const filterBtns = $$('.filter-btn');
  const cards      = $$('.project-card');

  if (!filterBtns.length || !cards.length) return;

  const filter = category => {
    cards.forEach(card => {
      const match = category === 'all' || card.dataset.category === category;

      if (match) {
        card.style.display = '';
        // Trigger re-paint so transition fires
        requestAnimationFrame(() => {
          card.style.opacity   = '1';
          card.style.transform = '';
        });
      } else {
        card.style.opacity   = '0';
        card.style.transform = 'scale(0.96)';
        // Hide after fade-out
        setTimeout(() => { if (card.style.opacity === '0') card.style.display = 'none'; }, 300);
      }
    });
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('filter-btn--active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('filter-btn--active');
      btn.setAttribute('aria-selected', 'true');
      filter(btn.dataset.filter || 'all');
    });
  });

  // Add transition styles to cards once
  cards.forEach(card => {
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  });
};

/* ============================================================
   11. CONTACT FORM VALIDATION
   ============================================================ */

const initContactForm = () => {
  const form    = $('#contact-form');
  if (!form) return;

  const fields  = {
    name:    { el: $('#contact-name'),    errorEl: $('#name-error')    },
    email:   { el: $('#contact-email'),   errorEl: $('#email-error')   },
    subject: { el: $('#contact-subject'), errorEl: $('#subject-error') },
    message: { el: $('#contact-message'), errorEl: $('#message-error') },
  };

  const successMsg = $('#form-success');
  const submitBtn  = $('#contact-submit');

  /* Validation rules */
  const rules = {
    name:    v => v.trim().length >= 2       ? '' : 'Please enter your name (at least 2 characters).',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
    subject: v => v !== ''                   ? '' : 'Please choose a subject.',
    message: v => v.trim().length >= 10      ? '' : 'Please write a message (at least 10 characters).',
  };

  /**
   * Validate a single field
   * @param {string} name  key in fields / rules
   * @returns {boolean}    true = valid
   */
  const validateField = name => {
    const { el, errorEl } = fields[name];
    if (!el) return true;
    const message = rules[name](el.value);
    errorEl.textContent = message;
    el.classList.toggle('is-error', !!message);
    el.setAttribute('aria-invalid', !!message);
    return !message;
  };

  // Live validation: validate on blur, clear error on input
  Object.keys(fields).forEach(name => {
    const { el } = fields[name];
    if (!el) return;
    el.addEventListener('blur',  () => validateField(name));
    el.addEventListener('input', () => {
      if (el.classList.contains('is-error')) validateField(name);
    });
  });

  /* Form submit */
  form.addEventListener('submit', e => {
    e.preventDefault();

    const valid = Object.keys(fields).map(validateField).every(Boolean);

    // Check consent checkbox separately
    const consent = $('#contact-consent');
    if (consent && !consent.checked) {
      consent.focus();
      valid; // already false-ish, but let the built-in :invalid style handle this
    }

    if (!valid) {
      // Focus the first invalid field
      const firstInvalid = $$('.form-input.is-error', form)[0];
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Simulate submission (replace with real fetch/API call)
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled    = true;

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = 'Send Message';
      submitBtn.disabled    = false;

      if (successMsg) {
        successMsg.removeAttribute('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Hide again after 6 seconds
        setTimeout(() => successMsg.setAttribute('hidden', ''), 6000);
      }
    }, 1400);
  });
};

/* ============================================================
   12. BACK-TO-TOP BUTTON
   ============================================================ */

const initBackToTop = () => {
  // Create the button dynamically so it isn't needed in HTML
  const btn = document.createElement('button');
  btn.className    = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" width="20" height="20" aria-hidden="true">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  `;

  // Inject styles once
  if (!$('#back-to-top-style')) {
    const style = document.createElement('style');
    style.id = 'back-to-top-style';
    style.textContent = `
      .back-to-top {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 90;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--grad-accent);
        color: #fff;
        border: none;
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: 0 4px 20px rgba(124,106,245,0.45);
        opacity: 0;
        visibility: hidden;
        transform: translateY(12px);
        transition: opacity 0.3s ease, visibility 0.3s ease,
                    transform 0.3s cubic-bezier(0.22,1,0.36,1),
                    box-shadow 0.2s ease;
      }
      .back-to-top.is-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      .back-to-top:hover {
        box-shadow: 0 8px 28px rgba(124,106,245,0.6);
        transform: translateY(-2px);
      }
      .back-to-top:active { transform: translateY(0); }

      @media (max-width: 480px) {
        .back-to-top { bottom: 1.25rem; right: 1.25rem; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(btn);

  const toggleVisibility = () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  };

  window.addEventListener('scroll', throttle(toggleVisibility, 120), { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Move focus to top for keyboard/screen-reader users
    const hero = $('#hero') || $('main') || document.body;
    hero.setAttribute('tabindex', '-1');
    hero.focus({ preventScroll: true });
  });
};

/* ============================================================
   13. DARK / LIGHT MODE TOGGLE
   ============================================================ */

const initThemeToggle = () => {
  // Determine initial theme: localStorage → system preference → dark default
  const stored   = localStorage.getItem('cc-theme');
  const prefLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial  = stored ?? (prefLight ? 'light' : 'dark');

  // Apply theme to <html>
  const applyTheme = theme => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cc-theme', theme);

    // Update button aria-label and icon
    if (btn) {
      const isLight = theme === 'light';
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      btn.setAttribute('title',      isLight ? 'Switch to dark mode' : 'Switch to light mode');
      moonIcon.style.display = isLight ? 'none'  : 'block';
      sunIcon.style.display  = isLight ? 'block' : 'none';
    }
  };

  // Inject light-theme CSS variables (overrides) — dark is the default in style.css
  if (!$('#theme-vars')) {
    const style = document.createElement('style');
    style.id = 'theme-vars';
    style.textContent = `
      [data-theme="light"] {
        --clr-bg-deep:      #f5f4f9;
        --clr-bg-mid:       #eeedf5;
        --clr-bg-surface:   #e8e7f2;
        --clr-bg-raised:    #dddcee;
        --clr-text-primary: #1a1728;
        --clr-text-secondary:#4a4565;
        --clr-text-muted:   #8f8aab;
        --clr-border:       rgba(124,106,245,0.2);
        --clr-border-subtle:rgba(124,106,245,0.1);
        --clr-glass:        rgba(255,255,255,0.55);
        --clr-glass-hover:  rgba(255,255,255,0.75);
        --grad-card: linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%);
        --shadow-md: 0 4px 16px rgba(100,80,200,0.12), 0 2px 6px rgba(100,80,200,0.08);
        --shadow-lg: 0 12px 40px rgba(100,80,200,0.15), 0 4px 12px rgba(100,80,200,0.1);
      }
    `;
    document.head.appendChild(style);
  }

  // Build the toggle button
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';

  const moonIcon = document.createElement('span');
  moonIcon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         width="18" height="18" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
    </svg>`;

  const sunIcon = document.createElement('span');
  sunIcon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`;

  btn.appendChild(moonIcon);
  btn.appendChild(sunIcon);

  // Styles for the toggle button
  if (!$('#theme-toggle-style')) {
    const style = document.createElement('style');
    style.id = 'theme-toggle-style';
    style.textContent = `
      .theme-toggle {
        position: fixed;
        bottom: 5.5rem;
        right: 2rem;
        z-index: 90;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--clr-glass);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--clr-border);
        color: var(--clr-text-secondary);
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: var(--shadow-sm);
        transition: color 0.2s ease, background 0.2s ease,
                    border-color 0.2s ease, transform 0.2s ease,
                    box-shadow 0.2s ease;
      }
      .theme-toggle:hover {
        color: var(--clr-accent-primary);
        border-color: var(--clr-accent-primary);
        background: rgba(124,106,245,0.1);
        transform: rotate(20deg);
        box-shadow: 0 0 16px rgba(124,106,245,0.25);
      }
      .theme-toggle span { display: block; line-height: 0; }

      @media (max-width: 480px) {
        .theme-toggle { bottom: 4.75rem; right: 1.25rem; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(btn);

  // Apply initial theme (before attaching click so icons are set)
  applyTheme(initial);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Respond to system preference changes (only when no local override)
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
    if (!localStorage.getItem('cc-theme')) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });
};

/* ============================================================
   14. FOOTER YEAR
   ============================================================ */

const initFooterYear = () => {
  const el = $('#footer-year');
  if (!el) return;
  const y = new Date().getFullYear();
  el.textContent = y;
  el.setAttribute('datetime', String(y));
};

/* ============================================================
   15. NAVBAR ACTIVE LINK STYLES (CSS INJECTION)
   ============================================================ */

const injectActiveNavStyles = () => {
  // Active state styles for the navbar links (class toggled by JS)
  if ($('#active-nav-style')) return;
  const style = document.createElement('style');
  style.id = 'active-nav-style';
  style.textContent = `
    .navbar__link--active:not(.navbar__link--cta) {
      color: var(--clr-text-primary) !important;
    }
    .navbar__link--active:not(.navbar__link--cta)::after {
      transform: scaleX(1) !important;
    }
  `;
  document.head.appendChild(style);
};

/* ============================================================
   16. HERO SECTION — SUBTLE PARALLAX ON SCROLL
   ============================================================ */

const initHeroParallax = () => {
  const heroBg      = $('.hero__bg');
  const heroVisual  = $('.hero__visual');
  if (!heroBg || !heroVisual) return;

  // Only run on devices that support hover (typically desktops)
  if (!window.matchMedia('(hover: hover)').matches) return;

  const update = () => {
    const scrolled = window.scrollY;
    heroBg.style.transform     = `translateY(${scrolled * 0.25}px)`;
    heroVisual.style.transform = `translateY(${scrolled * 0.12}px)`;
  };

  window.addEventListener('scroll', throttle(update, 16), { passive: true });
};

/* ============================================================
   17. SECTION LABEL REVEAL (adds .is-visible to section-labels)
   ============================================================ */

const initSectionLabels = () => {
  const labels = $$('.section-label');
  if (!labels.length) return;

  labels.forEach(label => {
    label.style.opacity   = '0';
    label.style.transform = 'translateX(-12px)';
    label.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateX(0)';
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  labels.forEach(label => observer.observe(label));
};

/* ============================================================
   18. GALLERY KEYBOARD LIGHTBOX (ACCESSIBILITY ENHANCEMENT)
   ============================================================ */

const initGalleryLightbox = () => {
  const items = $$('.gallery__item');
  if (!items.length) return;

  // Allow Enter/Space to "activate" a gallery item (same as click)
  items.forEach(item => {
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Emit a custom event that a future lightbox script can listen to
        item.dispatchEvent(new CustomEvent('gallery:open', {
          bubbles: true,
          detail: {
            src:   $('img', item)?.src,
            alt:   $('img', item)?.alt,
            caption: $('.gallery__caption', item)?.textContent,
          },
        }));
      }
    });
  });
};

/* ============================================================
   19. FORM CHARACTER COUNTER (message textarea)
   ============================================================ */

const initCharCounter = () => {
  const textarea  = $('#contact-message');
  if (!textarea) return;

  const counter   = document.createElement('span');
  counter.className = 'char-counter';
  counter.setAttribute('aria-live', 'polite');
  counter.setAttribute('aria-atomic', 'true');

  if (!$('#char-counter-style')) {
    const style = document.createElement('style');
    style.id = 'char-counter-style';
    style.textContent = `
      .char-counter {
        display: block;
        text-align: right;
        font-size: 0.7rem;
        font-family: var(--font-mono);
        color: var(--clr-text-muted);
        margin-top: 4px;
        transition: color 0.2s ease;
      }
      .char-counter.is-warning { color: var(--clr-accent-warm); }
      .char-counter.is-max     { color: var(--clr-error); }
    `;
    document.head.appendChild(style);
  }

  const max = 1000;
  textarea.setAttribute('maxlength', max);

  const update = () => {
    const len  = textarea.value.length;
    const left = max - len;
    counter.textContent = `${len} / ${max}`;
    counter.classList.toggle('is-warning', left < 100 && left >= 20);
    counter.classList.toggle('is-max',     left < 20);
  };

  textarea.parentNode.insertBefore(counter, textarea.nextSibling);
  textarea.addEventListener('input', update);
  update();
};

/* ============================================================
   20. INIT — RUN EVERYTHING WHEN DOM IS READY
   ============================================================ */

const init = () => {
  injectActiveNavStyles();
  initThemeToggle();       // theme first so variables are set
  initNavbarScroll();
  initMobileMenu();
  initSmoothScroll();
  initActiveNav();
  initScrollReveal();
  initTypingEffect();
  initCounters();
  initGallery();
  initGalleryLightbox();
  initProjectFilter();
  initContactForm();
  initCharCounter();
  initBackToTop();
  initHeroParallax();
  initSectionLabels();
  initFooterYear();
};

// Wait for DOM, then run
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already parsed (script deferred / placed before </body>)
  init();
}
/* =========================
   THREE JS BACKGROUND
   ========================= */

const container = document.getElementById("bg-canvas");

if (container && typeof THREE !== "undefined") {

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  const particleCount = window.innerWidth < 768 ? 1000 : 2500;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 250;
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    size: 0.35,
    color: 0x6ea8ff,
    transparent: true,
    opacity: 0.9
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener("mousemove", (event) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    particles.rotation.y = elapsed * 0.04;
    particles.rotation.x = elapsed * 0.02;

    camera.position.x +=
      (mouseX * 8 - camera.position.x) * 0.03;

    camera.position.y +=
      (-mouseY * 8 - camera.position.y) * 0.03;

    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    camera.aspect =
      window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  });
}
