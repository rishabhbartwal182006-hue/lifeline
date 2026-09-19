/**
 * =========================================================
 * MEDIKIOSK — MODERN CLINICAL MEDICAL INTERACTIONS & 3D GRAPHICS
 * Theme: Emerald Green (#10b981) & Deep Mint (#059669)
 * Features:
 *   1. Custom Animated Medical Reticle & Hover Cursor
 *   2. Hero Section 3D Holographic Heart Core & Telemetry Rings
 *   3. 3D Holographic AI Nurse Assistant Avatar (Cursor-tracking & 360 Spin)
 *   4. Interactive 3D Card Tilt Physics & Triage Priority Dynamics
 *   5. Scroll Entrance & Real-time Telemetry Simulations
 * =========================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initCustomCursor();
  initHeroHeart3D();
  initNurseHologram3D();
  initInteractiveCardTilt();
  initScrollReveal();
  initNurseChatInteractions();
});

/* =========================================================
   1. ANIMATED CUSTOM MEDICAL CURSOR
========================================================= */
function initCustomCursor() {
  const cursor = document.getElementById("customCursor");
  if (!cursor) return;

  // Don't show custom cursor on touch-only devices
  if (window.matchMedia("(pointer: coarse)").matches) {
    cursor.style.display = "none";
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let isHovered = false;
  let isVisible = false;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isVisible) {
      cursor.style.opacity = "1";
      isVisible = true;
    }
  });

  window.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget && !e.toElement) {
      cursor.style.opacity = "0";
      isVisible = false;
    }
  });

  // Smooth lerp tracking loop
  function renderCursor() {
    cursorX += (mouseX - cursorX) * 0.18;
    cursorY += (mouseY - cursorY) * 0.18;

    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Interactive element hover detection
  const interactiveSelector = "a, button, .tilt-card, .vital-card, .triage-level, canvas, .nurse-action-pill, input";
  
  function attachHoverListeners() {
    const targets = document.querySelectorAll(interactiveSelector);
    targets.forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("cursor-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("cursor-hover"));
    });
  }
  attachHoverListeners();

  // Re-attach if DOM modifies
  const observer = new MutationObserver(attachHoverListeners);
  observer.observe(document.body, { childList: true, subtree: true });
}

/* =========================================================
   2. HERO SECTION 3D HOLOGRAPHIC MEDICAL HEART CORE
========================================================= */
function initHeroHeart3D() {
  const canvas = document.getElementById("heroHeartCanvas");
  if (!canvas || !window.THREE) return;

  const container = canvas.parentElement;
  let width = container.clientWidth;
  let height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  // Medical Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const greenLight1 = new THREE.PointLight(0x10b981, 3.5, 25);
  greenLight1.position.set(-4, 4, 5);
  scene.add(greenLight1);

  const mintLight2 = new THREE.PointLight(0x34d399, 2.5, 20);
  mintLight2.position.set(4, -3, 4);
  scene.add(mintLight2);

  // Master Heart Group (for levitation & mouse lookAt)
  const masterGroup = new THREE.Group();
  scene.add(masterGroup);

  // --- Sculpting the 3D Holographic Medical Heart ---
  const heartGroup = new THREE.Group();
  masterGroup.add(heartGroup);

  // Parametric Heart Geometry
  const heartShape = new THREE.Shape();
  const x = 0, y = 0;
  heartShape.moveTo(x + 0.25, y + 0.25);
  heartShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
  heartShape.bezierCurveTo(x - 0.35, y, x - 0.35, y + 0.35, x - 0.35, y + 0.35);
  heartShape.bezierCurveTo(x - 0.35, y + 0.55, x - 0.15, y + 0.77, x + 0.25, y + 1.0);
  heartShape.bezierCurveTo(x + 0.65, y + 0.77, x + 0.85, y + 0.55, x + 0.85, y + 0.35);
  heartShape.bezierCurveTo(x + 0.85, y + 0.35, x + 0.85, y, x + 0.5, y);
  heartShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

  const extrudeSettings = {
    depth: 0.45,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 2,
    bevelSize: 0.15,
    bevelThickness: 0.15
  };

  const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  heartGeo.center();

  // Outer Holographic Emerald Glass Core
  const heartMat = new THREE.MeshPhysicalMaterial({
    color: 0x10b981,
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.45,
    transparent: true,
    opacity: 0.88,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: 0x059669,
    emissiveIntensity: 0.25
  });
  const heartMesh = new THREE.Mesh(heartGeo, heartMat);
  heartMesh.rotation.z = Math.PI;
  heartMesh.scale.set(1.5, 1.5, 1.5);
  heartGroup.add(heartMesh);

  // Wireframe Holographic Shell
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xa7f3d0,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const wireMesh = new THREE.Mesh(heartGeo, wireMat);
  wireMesh.rotation.z = Math.PI;
  wireMesh.scale.set(1.56, 1.56, 1.56);
  heartGroup.add(wireMesh);

  // --- Concentric Glowing Green Telemetry Rings ---
  const ringGroup = new THREE.Group();
  masterGroup.add(ringGroup);

  const ringMaterial1 = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.3,
    metalness: 0.8,
    transparent: true,
    opacity: 0.75
  });

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.028, 16, 90), ringMaterial1);
  ring1.rotation.x = Math.PI / 2.8;
  ringGroup.add(ring1);

  const ringMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.022, 16, 80), ringMaterial2);
  ring2.rotation.y = Math.PI / 3.2;
  ringGroup.add(ring2);

  const ring3 = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.015, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0xa7f3d0, transparent: true, opacity: 0.3 })
  );
  ring3.rotation.x = -Math.PI / 4;
  ringGroup.add(ring3);

  // Orbiting Telemetry Particles
  const particleCount = 4;
  const particles = [];
  const particleGeo = new THREE.SphereGeometry(0.08, 12, 12);
  const particleMat = new THREE.MeshBasicMaterial({ color: 0xecfdf5 });

  for (let i = 0; i < particleCount; i++) {
    const p = new THREE.Mesh(particleGeo, particleMat);
    ringGroup.add(p);
    particles.push({
      mesh: p,
      speed: 0.6 + i * 0.12,
      radius: 2.1 + (i % 2) * 0.35,
      offset: (i * Math.PI) / 2
    });
  }

  // --- Interactive Mouse Follow / Tilt Dynamics ---
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  window.addEventListener("mousemove", (e) => {
    const normX = (e.clientX / window.innerWidth) * 2 - 1;
    const normY = -(e.clientY / window.innerHeight) * 2 + 1;
    targetTiltX = normY * 0.35;
    targetTiltY = normX * 0.45;
  });

  // --- Animation Loop with Levitation & Cardiac Pulse ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // 1. Smooth continuous levitation along Y-axis (slow bobbing)
    masterGroup.position.y = Math.sin(elapsed * 1.6) * 0.22;

    // 2. Cardiac Heartbeat Rhythm Pulse (systole + diastole)
    const pulseTime = elapsed * 3.5;
    const beat = Math.pow(Math.sin(pulseTime), 6) * 0.1 + Math.pow(Math.sin(pulseTime + 0.3), 8) * 0.05;
    const currentScale = 1.0 + beat;
    heartGroup.scale.set(currentScale, currentScale, currentScale);

    // 3. Telemetry rings continuous rotation
    ring1.rotation.z = elapsed * 0.22;
    ring2.rotation.x = elapsed * 0.18;
    ring3.rotation.y = -elapsed * 0.15;

    // 4. Orbiting particles tracking rings
    particles.forEach((pt) => {
      const angle = elapsed * pt.speed + pt.offset;
      pt.mesh.position.set(
        Math.cos(angle) * pt.radius,
        Math.sin(angle * 1.5) * 0.4,
        Math.sin(angle) * pt.radius
      );
    });

    // 5. Mouse-follow interactive tilt (Parallax / LookAt damping)
    currentTiltX += (targetTiltX - currentTiltX) * 0.06;
    currentTiltY += (targetTiltY - currentTiltY) * 0.06;

    masterGroup.rotation.x = currentTiltX;
    masterGroup.rotation.y = currentTiltY + elapsed * 0.12;

    renderer.render(scene, camera);
  }
  animate();

  // Resize Handler
  window.addEventListener("resize", () => {
    if (!canvas.parentElement) return;
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

/* =========================================================
   3. AI NURSE ASSISTANT (3D HOLOGRAPHIC NURSE AVATAR)
========================================================= */
function initNurseHologram3D() {
  const canvas = document.getElementById("nurseHoloCanvas");
  if (!canvas || !window.THREE) return;

  const container = canvas.parentElement;
  let width = container.clientWidth;
  let height = container.clientHeight;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0, 5.8);

  // Ambient & Clinical Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const greenSpot = new THREE.PointLight(0x10b981, 3.2, 18);
  greenSpot.position.set(0, 2, 4);
  scene.add(greenSpot);

  const nurseGroup = new THREE.Group();
  scene.add(nurseGroup);

  // --- Holographic Nurse Head Orb ---
  const headGeo = new THREE.SphereGeometry(1.05, 32, 32);
  const headMat = new THREE.MeshPhysicalMaterial({
    color: 0x091e2b,
    metalness: 0.6,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  nurseGroup.add(headMesh);

  // Outer Holographic Aura Glow Shell
  const auraGeo = new THREE.SphereGeometry(1.2, 24, 24);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  nurseGroup.add(auraMesh);

  // --- Biometric Sensor Visor with Cursor-Tracking Eyes ---
  const visorGroup = new THREE.Group();
  nurseGroup.add(visorGroup);

  const visorGeo = new THREE.CylinderGeometry(0.96, 0.96, 0.38, 32, 1, true, -Math.PI / 3, (Math.PI * 2) / 3);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.rotation.x = Math.PI / 2;
  visorGroup.add(visor);

  // Two Glowing Eye / Sensor Indicators
  const eyeGroup = new THREE.Group();
  visorGroup.add(eyeGroup);

  const eyeGeo = new THREE.SphereGeometry(0.11, 16, 16);
  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    boxShadow: "0 0 10px #10b981"
  });

  const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
  eyeLeft.position.set(-0.32, 0.05, 0.98);
  eyeGroup.add(eyeLeft);

  const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
  eyeRight.position.set(0.32, 0.05, 0.98);
  eyeGroup.add(eyeRight);

  // Glowing Concentric Halo Ring
  const haloGeo = new THREE.TorusGeometry(1.48, 0.02, 16, 70);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.6 });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI / 2.3;
  nurseGroup.add(halo);

  // --- Interactive Cursor Tracking for Eyes & Visor ---
  let eyeTargetX = 0;
  let eyeTargetY = 0;
  let spinAngle = 0;
  let targetSpin = 0;

  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    eyeTargetX = ((e.clientX - centerX) / window.innerWidth) * 0.7;
    eyeTargetY = -((e.clientY - centerY) / window.innerHeight) * 0.5;
  });

  // Hover Interaction: Trigger smooth 360-degree rotation & aura burst
  container.addEventListener("mouseenter", () => {
    targetSpin += Math.PI * 2;
    auraMat.opacity = 0.75;
    auraMat.color.setHex(0x34d399);
  });

  container.addEventListener("mouseleave", () => {
    auraMat.opacity = 0.28;
    auraMat.color.setHex(0x10b981);
  });

  // Animation Loop: Idle breathing effect + sensor eye tracking
  const clock = new THREE.Clock();

  function animateNurse() {
    requestAnimationFrame(animateNurse);
    const elapsed = clock.getElapsedTime();

    // 1. Idle breathing effect (subtle pulsing/scaling)
    const breath = 1.0 + Math.sin(elapsed * 2.2) * 0.035;
    headMesh.scale.set(breath, breath, breath);
    auraMesh.scale.set(breath * 1.02, breath * 1.02, breath * 1.02);

    // 2. Continuous levitation
    nurseGroup.position.y = Math.sin(elapsed * 1.8) * 0.15;

    // 3. Sensor indicators follow user cursor smoothly
    eyeGroup.position.x += (eyeTargetX - eyeGroup.position.x) * 0.1;
    eyeGroup.position.y += (eyeTargetY - eyeGroup.position.y) * 0.1;

    // 4. Smooth 360 spin on hover/interaction
    spinAngle += (targetSpin - spinAngle) * 0.08;
    nurseGroup.rotation.y = spinAngle + Math.sin(elapsed * 0.6) * 0.15;
    halo.rotation.z = elapsed * 0.4;

    renderer.render(scene, camera);
  }
  animateNurse();

  window.addEventListener("resize", () => {
    if (!canvas.parentElement) return;
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

/* =========================================================
   4. INTERACTIVE 3D CARD TILT DYNAMICS
========================================================= */
function initInteractiveCardTilt() {
  const cards = document.querySelectorAll(".tilt-card");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (max 10 degrees)
      const rotateX = ((y - centerY) / centerY) * -9;
      const rotateY = ((x - centerX) / centerX) * 9;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
}

/* =========================================================
   5. AI NURSE INTERACTIVE CHAT SIMULATION
========================================================= */
function initNurseChatInteractions() {
  const msgElement = document.getElementById("nurseChatMsg");
  const actionPills = document.querySelectorAll(".nurse-action-pill");
  if (!msgElement || !actionPills.length) return;

  const responses = {
    triage: "Running multi-system triage rules: Vital signs and red flags determine Priority (Emergency, Urgent, or Routine).",
    chest: "Chest discomfort flagged: Screening for radiation, diaphoresis, and SpO2. Recommending immediate ECG triage review.",
    home: "Syncing Node 2 (Home Care Hub): ESP32-CAM optical vitals & medication reminder compliance are up-to-date."
  };

  actionPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const action = pill.getAttribute("data-action");
      if (!responses[action]) return;

      const targetText = responses[action];
      typeWriter(msgElement, `"${targetText}"`);
    });
  });

  function typeWriter(element, text) {
    element.innerHTML = "";
    let i = 0;
    const speed = 20;

    function type() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    type();
  }
}

/* =========================================================
   6. SCROLL REVEAL (FADE-IN & SLIDE-UP ENTRANCE)
========================================================= */
function initScrollReveal() {
  const reveals = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((el) => observer.observe(el));
}
