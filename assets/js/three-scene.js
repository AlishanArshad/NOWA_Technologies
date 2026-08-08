(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const mount = document.querySelector('.hero__webgl');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!hero || !mount || reducedMotion || !window.THREE) {
    hero?.classList.add('webgl-fallback');
    return;
  }

  const THREE = window.THREE;
  const phone = window.matchMedia('(max-width: 760px)').matches;
  const tablet = !phone && window.matchMedia('(max-width: 1024px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !phone,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
  } catch (error) {
    hero.classList.add('webgl-fallback');
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(phone ? 48 : tablet ? 45 : 43, 1, 0.1, 100);
  camera.position.set(0, 0, phone ? 5.9 : tablet ? 6 : 6.2);

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1 : tablet ? 1.15 : 1.35));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = phone ? 1.06 : 1.15;
  renderer.domElement.className = 'hero__webgl-canvas';
  mount.replaceChildren(renderer.domElement);
  hero.classList.remove('webgl-fallback');
  hero.classList.add('webgl-ready');

  const world = new THREE.Group();
  scene.add(world);

  const orbRadius = phone ? 1.05 : tablet ? 1.3 : 1.55;
  const orbDetail = phone ? 2 : tablet ? 3 : 4;
  const orbX = phone ? 0.72 : tablet ? 1.32 : 2.05;
  const orbY = phone ? 0.58 : tablet ? 0.34 : 0.15;
  const orbGeometry = new THREE.IcosahedronGeometry(orbRadius, orbDetail);
  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0xee5924,
    emissive: 0x381306,
    emissiveIntensity: phone ? 0.62 : 0.72,
    metalness: phone ? 0.4 : 0.48,
    roughness: phone ? 0.29 : 0.24,
    transparent: true,
    opacity: 0.94
  });
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);
  orb.position.set(orbX, orbY, 0);
  orb.rotation.set(0.3, -0.45, 0.08);
  world.add(orb);

  const shell = new THREE.Mesh(
    orbGeometry.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xffaa83,
      wireframe: true,
      transparent: true,
      opacity: phone ? 0.14 : tablet ? 0.15 : 0.17
    })
  );
  shell.position.copy(orb.position);
  shell.scale.setScalar(1.026);
  world.add(shell);

  const ringSegments = phone ? 64 : tablet ? 96 : 150;
  const makeRing = (radius, color, opacity, rotation) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, phone ? 0.009 : 0.012, 8, ringSegments),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
    );
    mesh.position.copy(orb.position);
    mesh.rotation.set(...rotation);
    world.add(mesh);
    return mesh;
  };

  const ringA = makeRing(phone ? 1.42 : tablet ? 1.74 : 2.02, 0xee5924, phone ? 0.52 : 0.46, [1.1, 0.1, 0.18]);
  const ringB = makeRing(phone ? 1.70 : tablet ? 2.05 : 2.45, 0xff8b5b, phone ? 0.3 : 0.22, [0.45, 1.05, 0.4]);
  const ringC = phone ? null : makeRing(tablet ? 2.36 : 2.9, 0xffffff, 0.09, [1.25, 0.7, 0.15]);

  const particleCount = phone ? 72 : tablet ? 160 : 360;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = (phone ? 1.8 : 2.5) + Math.random() * (phone ? 3.7 : 5.5);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePositions[i3] = Math.sin(phi) * Math.cos(theta) * radius + (phone ? 0.2 : tablet ? 0.55 : 1.0);
    particlePositions[i3 + 1] = Math.cos(phi) * radius * 0.62;
    particlePositions[i3 + 2] = Math.sin(phi) * Math.sin(theta) * radius - 1.0;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xff7440,
      size: phone ? 0.014 : tablet ? 0.019 : 0.024,
      transparent: true,
      opacity: phone ? 0.48 : 0.58,
      sizeAttenuation: true
    })
  );
  world.add(particles);

  const satellites = [];
  const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xffa079 });
  const satelliteCount = phone ? 3 : tablet ? 4 : 5;
  for (let i = 0; i < satelliteCount; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03 + i * 0.006, phone ? 8 : 12, phone ? 8 : 12), satelliteMaterial);
    world.add(dot);
    satellites.push(dot);
  }

  scene.add(new THREE.AmbientLight(0xffffff, phone ? 0.44 : 0.38));
  const key = new THREE.PointLight(0xff6d37, phone ? 2.4 : 2.9, 18);
  key.position.set(4, 2.8, 4.5);
  scene.add(key);
  const rim = new THREE.PointLight(0xffffff, phone ? 1.15 : 1.4, 14);
  rim.position.set(-3.5, -1.8, 3.4);
  scene.add(rim);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollProgress = 0;
  let active = true;
  let raf = 0;
  let lastRender = 0;
  const clock = new THREE.Clock();
  const minFrameMs = phone || coarse ? 1000 / 36 : 0;

  const resize = () => {
    const width = Math.max(1, hero.clientWidth || window.innerWidth);
    const height = Math.max(1, hero.clientHeight || window.innerHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1 : tablet ? 1.15 : 1.35));
    renderer.setSize(width, height, false);
  };

  const updateScroll = () => {
    const rect = hero.getBoundingClientRect();
    const travel = Math.max(1, hero.offsetHeight + window.innerHeight);
    scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / travel));
  };

  if (!coarse) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.ty = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.tx = 0;
      pointer.ty = 0;
    }, { passive: true });
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });

  const visibilityObserver = new IntersectionObserver((entries) => {
    active = entries[0]?.isIntersecting ?? true;
    if (active && !raf) raf = requestAnimationFrame(animate);
  }, { rootMargin: '12% 0px 12% 0px' });
  visibilityObserver.observe(hero);

  document.addEventListener('visibilitychange', () => {
    active = !document.hidden && hero.getBoundingClientRect().bottom > -160 && hero.getBoundingClientRect().top < innerHeight + 160;
    if (active && !raf) raf = requestAnimationFrame(animate);
  });

  function animate(now = 0) {
    raf = 0;
    if (!active) return;
    if (minFrameMs && now - lastRender < minFrameMs) {
      raf = requestAnimationFrame(animate);
      return;
    }
    lastRender = now;

    const t = clock.getElapsedTime();
    pointer.x += (pointer.tx - pointer.x) * (phone ? 0.028 : 0.045);
    pointer.y += (pointer.ty - pointer.y) * (phone ? 0.028 : 0.045);

    const pointerPower = coarse ? 0 : 1;
    world.rotation.y += (((pointer.x * 0.16 * pointerPower)) - world.rotation.y) * 0.04;
    world.rotation.x += (((-pointer.y * 0.1 * pointerPower)) - world.rotation.x) * 0.04;
    world.position.y += ((scrollProgress * (phone ? 0.2 : 0.55)) - world.position.y) * 0.03;
    camera.position.x += ((pointer.x * 0.18 * pointerPower) - camera.position.x) * 0.03;
    camera.position.y += ((pointer.y * 0.12 * pointerPower) - camera.position.y) * 0.03;

    orb.rotation.y = t * (phone ? 0.11 : 0.16) + pointer.x * 0.12;
    orb.rotation.x = 0.3 + Math.sin(t * 0.33) * 0.08 + pointer.y * 0.08;
    shell.rotation.copy(orb.rotation);
    shell.rotation.z += t * 0.012;

    ringA.rotation.z = 0.18 + t * 0.09;
    ringB.rotation.y = 1.05 - t * 0.065;
    if (ringC) ringC.rotation.x = 1.25 + t * 0.04;
    particles.rotation.y = t * 0.014;
    particles.rotation.x = Math.sin(t * 0.12) * 0.03;

    satellites.forEach((dot, i) => {
      const speed = 0.18 + i * 0.03;
      const radius = (phone ? 1.48 : tablet ? 1.85 : 2.25) + i * (phone ? 0.14 : 0.19);
      const angle = t * speed + i * 1.32;
      dot.position.set(
        orb.position.x + Math.cos(angle) * radius,
        orb.position.y + Math.sin(angle * 1.25) * radius * 0.42,
        Math.sin(angle) * 0.8
      );
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  resize();
  updateScroll();
  raf = requestAnimationFrame(animate);
})();
