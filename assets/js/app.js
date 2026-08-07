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
    }

    updateHorizontalRail();
    updateSplitReveal();
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

  const splitElements = qsa('.split-reveal');
  const updateSplitReveal = () => {
    splitElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const start = window.innerHeight * 0.9;
      const end = window.innerHeight * 0.18;
      const value = clamp(0, (start - rect.top) / (start - end), 1);
      el.style.setProperty('--reveal', `${value * 100}%`);
    });
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

  // Contact modal and demo form validation.
  const modal = qs('.contact-modal');
  const openButtons = qsa('.open-contact');
  const modalClose = qs('.modal-close');
  const form = qs('.contact-form');
  const formStatus = qs('.form-status');

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

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      formStatus.textContent = 'Please complete the required fields.';
      formStatus.className = 'form-status error';
      form.reportValidity();
      return;
    }
    const submit = qs('.form-submit', form);
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }
    window.setTimeout(() => {
      formStatus.textContent = 'Thanks — your inquiry is ready. Connect this form to your email or CRM before launch.';
      formStatus.className = 'form-status success';
      form.reset();
      if (submit) {
        submit.disabled = false;
        submit.innerHTML = 'Send inquiry <span>↗</span>';
      }
    }, 850);
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
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  const year = qs('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
