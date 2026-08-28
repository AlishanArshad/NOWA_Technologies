(() => {
  'use strict';

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (min, value, max) => Math.max(min, Math.min(value, max));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer:fine)').matches;

  document.documentElement.classList.add('js');

  // Loader: visual only, intentionally short and deterministic.
  const loader = qs('.loader');
  const loaderBar = qs('.loader__track span');
  const loaderCount = qs('.loader__count');
  let loaded = 0;
  const finishLoading = () => {
    if (!loader || loader.classList.contains('is-done')) return;
    loaded = 100;
    if (loaderBar) loaderBar.style.width = '100%';
    if (loaderCount) loaderCount.textContent = '100';
    window.setTimeout(() => {
      loader.classList.add('is-done');
      document.body.classList.add('page-ready');
    }, reducedMotion ? 20 : 380);
  };

  const loadingTimer = window.setInterval(() => {
    loaded += Math.ceil(Math.random() * 7);
    loaded = Math.min(loaded, 94);
    if (loaderBar) loaderBar.style.width = `${loaded}%`;
    if (loaderCount) loaderCount.textContent = String(loaded);
  }, 55);

  window.addEventListener('load', () => {
    window.clearInterval(loadingTimer);
    finishLoading();
  }, { once: true });
  window.setTimeout(() => {
    window.clearInterval(loadingTimer);
    finishLoading();
  }, 2100);

  // Header, progress, parallax and horizontal project rail.
  const header = qs('.site-header');
  const progress = qs('.scroll-progress span');
  const horizontalWrap = qs('.horizontal-wrap');
  const horizontalTrack = qs('.horizontal-track');
  const parallaxItems = qsa('[data-parallax]');
  const splitRevealItems = qsa('.split-reveal');
  let lastY = window.scrollY;
  let ticking = false;

  const updateScrollEffects = () => {
    ticking = false;
    const y = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = y / maxScroll;
    if (progress) progress.style.width = `${ratio * 100}%`;

    if (header) {
      header.classList.toggle('is-compact', y > 50);
      const movingDown = y > lastY && y > 260;
      header.classList.toggle('is-hidden', movingDown && !document.body.classList.contains('menu-open'));
    }
    lastY = y;

    if (!reducedMotion) {
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax || 0);
        item.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });

      // Scroll-linked text fill. Each split-reveal heading progressively
      // changes from muted to its section's real text color while it moves
      // through the viewport for NOWA's progressive text-fill motion.
      splitRevealItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        // Skip expensive work for headings that are far outside the viewport.
        if (rect.bottom < -window.innerHeight * .35 || rect.top > window.innerHeight * 1.35) return;
        const start = window.innerHeight * 0.88;
        const end = window.innerHeight * 0.28;
        const value = clamp(0, (start - rect.top) / Math.max(1, start - end), 1);
        item.style.setProperty('--reveal', `${(value * 100).toFixed(3)}%`);
        item.classList.toggle('in-view', value > 0.01);
      });
    } else {
      splitRevealItems.forEach((item) => item.style.setProperty('--reveal', '100%'));
    }

    updateHorizontalRail();
  };

  const requestScrollUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollEffects);
    }
  };

  const updateHorizontalRail = () => {
    if (!horizontalWrap || !horizontalTrack || reducedMotion || window.innerWidth <= 760) {
      if (horizontalTrack) horizontalTrack.style.transform = '';
      return;
    }
    const rect = horizontalWrap.getBoundingClientRect();
    const scrollable = horizontalWrap.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const progressValue = clamp(0, -rect.top / scrollable, 1);
    const maxX = Math.max(0, horizontalTrack.scrollWidth - window.innerWidth);
    horizontalTrack.style.transform = `translate3d(${-maxX * progressValue}px,0,0)`;
  };


  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  requestScrollUpdate();

  // Intersection-based reveal and counters.
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });
  qsa('.reveal').forEach((el) => revealObserver.observe(el));

  const animateCounter = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();
    const frame = (now) => {
      const p = clamp(0, (now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.55 });
  qsa('[data-count]').forEach((el) => counterObserver.observe(el));

  // Service interaction.
  const serviceRows = qsa('.service-row');
  const serviceNumber = qs('.service-visual__number');
  const serviceLabel = qs('.service-visual__label');
  const serviceCore = qs('.service-visual__core');
  serviceRows.forEach((row, index) => {
    const activate = () => {
      serviceRows.forEach((item) => item.classList.remove('is-active'));
      row.classList.add('is-active');
      if (serviceNumber) serviceNumber.textContent = row.dataset.service || String(index + 1).padStart(2, '0');
      if (serviceLabel) serviceLabel.textContent = row.dataset.label || 'NOWA';
      if (serviceCore && !reducedMotion) {
        serviceCore.animate([
          { transform: 'scale(.88) rotate(-8deg)' },
          { transform: 'scale(1.06) rotate(2deg)', offset: .65 },
          { transform: 'scale(1) rotate(0)' }
        ], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    };
    row.addEventListener('mouseenter', activate);
    row.addEventListener('click', activate);
    row.addEventListener('focusin', activate);
  });

  // Fullscreen navigation.
  const menuButton = qs('.menu-toggle');
  const menuPanel = qs('.menu-panel');
  const toggleMenu = (force) => {
    if (!menuButton || !menuPanel) return;
    const open = typeof force === 'boolean' ? force : !menuPanel.classList.contains('is-open');
    menuPanel.classList.toggle('is-open', open);
    menuPanel.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    if (header) header.classList.remove('is-hidden');
  };
  menuButton?.addEventListener('click', () => toggleMenu());
  qsa('.menu-panel a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleMenu(false);
      closeModal();
    }
  });

  // Magnetic elements.
  if (finePointer && !reducedMotion) {
    qsa('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * .18}px,${y * .18}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0,0)';
      });
    });
  }

  // Cursor.
  if (finePointer) {
    const dot = qs('.cursor-dot');
    const ring = qs('.cursor-ring');
    let mouseX = innerWidth / 2;
    let mouseY = innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (dot) dot.style.transform = `translate(${mouseX}px,${mouseY}px) translate(-50%,-50%)`;
    }, { passive: true });

    const cursorLoop = () => {
      ringX += (mouseX - ringX) * .16;
      ringY += (mouseY - ringY) * .16;
      if (ring) ring.style.transform = `translate(${ringX}px,${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(cursorLoop);
    };
    cursorLoop();

    qsa('a,button,input,textarea,select,.service-row,.tech-cloud span').forEach((el) => {
      el.addEventListener('mouseenter', () => ring?.classList.add('is-link'));
      el.addEventListener('mouseleave', () => ring?.classList.remove('is-link'));
    });
    qsa('.cursor-view').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        ring?.classList.remove('is-link');
        ring?.classList.add('is-view');
      });
      el.addEventListener('mouseleave', () => ring?.classList.remove('is-view'));
    });
  }

  // Premium depth interactions: project-card tilt and a soft magnetic technology cloud.
  if (finePointer && !reducedMotion) {
    qsa('.project-card').forEach((card) => {
      let frame = 0;
      card.addEventListener('mousemove', (event) => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width - .5;
          const ny = (event.clientY - rect.top) / rect.height - .5;
          const rotateY = nx * 4.2;
          const rotateX = ny * -3.2;
          card.style.transform = `perspective(1300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px) scale(1.008)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        if (frame) cancelAnimationFrame(frame);
        card.style.transform = '';
      });
    });

    const techCloud = qs('.tech-cloud');
    const techItems = techCloud ? qsa('span', techCloud) : [];
    if (techCloud && techItems.length) {
      techCloud.addEventListener('mousemove', (event) => {
        const cloudRect = techCloud.getBoundingClientRect();
        techItems.forEach((item) => {
          const rect = item.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = event.clientX - cx;
          const dy = event.clientY - cy;
          const distance = Math.max(90, Math.hypot(dx, dy));
          const influence = Math.max(0, 1 - distance / Math.max(cloudRect.width * .52, 500));
          item.style.setProperty('--mx', `${dx * influence * .026}px`);
          item.style.setProperty('--my', `${dy * influence * .026}px`);
        });
      }, { passive: true });
      techCloud.addEventListener('mouseleave', () => {
        techItems.forEach((item) => {
          item.style.setProperty('--mx', '0px');
          item.style.setProperty('--my', '0px');
        });
      });
    }
  }

  // Contact modal and demo form validation.
  const modal = qs('.contact-modal');
  const openButtons = qsa('.open-contact');
  const modalClose = qs('.modal-close');
  const forms = qsa('.contact-form');

  function openModal() {
    if (!modal) return;
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
    document.body.classList.add('modal-open');
    window.setTimeout(() => qs('input', modal)?.focus(), 120);
  }

  function closeModal() {
    if (!modal || !modal.hasAttribute('open')) return;
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
    document.body.classList.remove('modal-open');
  }

  openButtons.forEach((button) => button.addEventListener('click', openModal));
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => {
    const rect = modal.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) closeModal();
  });
  modal?.addEventListener('close', () => document.body.classList.remove('modal-open'));

  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formStatus = qs('.form-status', form);
      if (!form.checkValidity()) {
        if (formStatus) {
          formStatus.textContent = 'Please complete the required fields.';
          formStatus.className = 'form-status error';
        }
        form.reportValidity();
        return;
      }
      const submit = qs('.form-submit', form);
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending…';
      }
      window.setTimeout(() => {
        if (formStatus) {
          formStatus.textContent = 'Thanks — your inquiry is ready. Connect this form to your email or CRM before launch.';
          formStatus.className = 'form-status success';
        }
        form.reset();
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = 'Send inquiry <span>↗</span>';
        }
      }, 850);
    });
  });

  // Smooth page-to-page transition for the new multi-page structure.
  qsa('a[href]').forEach((link) => {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || link.target === '_blank') return;
    let url;
    try { url = new URL(rawHref, window.location.href); } catch (_) { return; }
    if (url.origin !== window.location.origin || !/\.html$/i.test(url.pathname)) return;
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1) return;
      if (url.href === window.location.href) return;
      event.preventDefault();
      toggleMenu(false);
      closeModal();
      document.body.classList.add('page-leaving');
      window.setTimeout(() => { window.location.href = url.href; }, reducedMotion ? 20 : 430);
    });
  });

  // Internal link correction when a modal/menu is open.
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = qs(id);
      if (!target) return;
      event.preventDefault();
      toggleMenu(false);
      closeModal();
      if (window.nowaLenis && !reducedMotion) {
        const headerOffset = (header?.offsetHeight || 76) + 8;
        window.nowaLenis.scrollTo(target, { offset: -headerOffset, duration: 1.05 });
      } else {
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  const year = qs('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

// Note: extra page-level interactions are registered in a separate IIFE so the
// original NOWA motion layer stays untouched.
(() => {
  'use strict';
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const qs = (s, root = document) => root.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (a, v, b) => Math.max(a, Math.min(v, b));

  // Track NOWA page chapters independently for in-view state.
  const scrollSections = qsa('[data-motion-section]');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.setAttribute('data-motion-inview', '');
      else entry.target.removeAttribute('data-motion-inview');
    });
  }, { threshold: 0.03, rootMargin: '20% 0px 20% 0px' });
  scrollSections.forEach((section, index) => {
    if (!section.dataset.motionId) section.dataset.motionId = `section${index + 1}`;
    sectionObserver.observe(section);
  });

  // Local parallax based on each element's own viewport position.
  const parallax = qsa('[data-depth-speed]');
  const kinetic = qsa('[data-kinetic]');
  let raf = 0;
  const update = () => {
    raf = 0;
    if (reduced) return;
    parallax.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const speed = Number(el.dataset.depthSpeed || 0);
      const center = r.top + r.height / 2 - innerHeight / 2;
      el.style.transform = `translate3d(0,${center * speed}px,0)`;
    });
    kinetic.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const p = clamp(-1, (innerHeight / 2 - (r.top + r.height / 2)) / innerHeight, 1);
      const direction = el.dataset.kinetic === 'right' ? 1 : -1;
      el.style.transform = `translate3d(${p * direction * 8}vw,0,0)`;
    });
  };
  const request = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  request();

  // About/technology tab system.
  qsa('[data-tabs]').forEach(group => {
    const buttons = qsa('[data-tab]', group), panels = qsa('[data-panel]', group);
    buttons.forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.tab;
      buttons.forEach(b => b.classList.toggle('is-active', b === btn));
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === key));
    }));
  });

  // Services index controls the sticky visual, giving every service a different state.
  const serviceSphere = qs('.service-index__sphere');
  const serviceRows = qsa('.service-index-row');
  serviceRows.forEach(row => {
    const activate = () => {
      serviceRows.forEach(x => x.classList.remove('is-active'));
      row.classList.add('is-active');
      if (!serviceSphere) return;
      const num = row.dataset.indexService || '01';
      const label = row.dataset.indexLabel || 'NOWA';
      const b = qs('b', serviceSphere), span = qs('span', serviceSphere), ring = qs('i', serviceSphere);
      if (b) b.textContent = num;
      if (span) span.textContent = label;
      if (ring && !reduced) ring.animate([
        { transform: 'scaleY(.4) rotate(16deg)' },
        { transform: `scaleY(.58) rotate(${38 + Number(num) * 31}deg)` },
        { transform: 'scaleY(.4) rotate(16deg)' }
      ], { duration: 760, easing: 'cubic-bezier(.16,1,.3,1)' });
    };
    row.addEventListener('mouseenter', activate);
    row.addEventListener('focusin', activate);
  });

  // FAQ accordion.
  qsa('[data-accordion] .faq-item').forEach(item => {
    const button = qs('button', item);
    button?.addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      qsa('[data-accordion] .faq-item').forEach(x => x.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });

  // Small depth response for the new visual cards.
  if (matchMedia('(pointer:fine)').matches && !reduced) {
    qsa('.mission-panel__visual,.service-art,.work-case__visual,.global-orbit,.availability-orbit').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--tilt-x', `${y * -2.2}deg`);
        el.style.setProperty('--tilt-y', `${x * 2.8}deg`);
        const base = el.dataset.depthSpeed ? el.style.transform : '';
        el.style.filter = `brightness(${1 + Math.abs(x) * .035})`;
        if (!el.dataset.depthSpeed) el.style.transform = `perspective(1200px) rotateX(${y * -2.2}deg) rotateY(${x * 2.8}deg)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.filter = '';
        if (!el.dataset.depthSpeed) el.style.transform = '';
      });
    });
  }
})();
