/**
 * MONO Watch 3D Interactive Studio
 * Powered by Three.js
 * Features:
 * - High fidelity 3D Keychain Watch Model (Classic Box & Capsule Oval)
 * - True visual geometric centering on X, Y, Z axes
 * - Authentic 7-segment digital LCD texture with real-time clock & stopwatch
 * - Interactive Tactile Buttons with Web Audio API Beeps
 * - EL Luminescent Backlight Glow Toggle
 * - 6 Color Variant Skins (Signature Blue, Red, Mint, White, Black, Capsule Noir)
 * - 360 Orbit Controls with camera framing that prevents clipping
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER FOR DIGITAL WATCH BEEPS ---
  let audioCtx = null;
  function playWatchBeep(freq = 4000, duration = 0.05, type = 'sine') {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  }

  // --- WATCH CONFIG & PALETTES (FROM CANVA SLIDE 21) ---
  const WATCH_PALETTES = {
    blue: {
      name: 'Cobalt Sky (Signature MONO)',
      bodyColor: 0x1448ff, // Official Canva HEX #1448ff
      strapColor: 0x1448ff,
      roughness: 0.28,
      metalness: 0.05,
      type: 'classic',
    },
    red: {
      name: 'Crimson Flame',
      bodyColor: 0xff2e4d,
      strapColor: 0xff2e4d,
      roughness: 0.28,
      metalness: 0.05,
      type: 'classic',
    },
    black: {
      name: 'Stealth Black',
      bodyColor: 0x231f20, // Official Canva HEX #231f20
      strapColor: 0x1e1c1d,
      roughness: 0.32,
      metalness: 0.05,
      type: 'classic',
    },
    white: {
      name: 'Glacier White',
      bodyColor: 0xf4f6fa,
      strapColor: 0xf4f6fa,
      roughness: 0.25,
      metalness: 0.05,
      type: 'classic',
    },
    mint: {
      name: 'Mint Breeze',
      bodyColor: 0x51edad, // Official Canva HEX #51edad
      strapColor: 0x51edad,
      roughness: 0.3,
      metalness: 0.05,
      type: 'classic',
    },
    capsule_black: {
      name: 'Capsule Noir (Oval)',
      bodyColor: 0x231f20,
      strapColor: 0x191a20,
      roughness: 0.35,
      metalness: 0.05,
      type: 'capsule',
    },
  };

  let currentColorKey = 'blue'; // default to MONO Cobalt Sky
  let currentChassis = 'classic';
  let isBacklightOn = false;
  let isAutoRotate = false;
  let watchMode = 'clock'; // 'clock', 'stopwatch'
  let stopwatchRunning = false;
  let stopwatchElapsed = 0;
  let stopwatchStartTime = 0;

  // --- THREE.JS INITIALIZATION ---
  let scene, camera, renderer, controls;
  let watchGroup, classicModel, capsuleModel;
  let bodyMaterialClassic, strapMaterialClassic;
  let bodyMaterialCapsule, strapMaterialCapsule;
  let topButtonMeshClassic, bottomButtonMeshClassic;
  let topButtonMeshCapsule, bottomButtonMeshCapsule;
  let lcdCanvas, lcdContext, lcdTexture, lcdMaterial;
  let backlightPointLight;
  let container;
  let raycaster, mouse;

  // Keychain physics / animation state
  let keychainPivotClassic, keychainPivotCapsule;
  let lastCameraAzimuth = 0;
  let lastCameraElevation = 0;
  let strapAngleZ = 0;
  let strapAngleY = 0;
  let strapVelZ = 0;
  let strapVelY = 0;

  function initThree() {
    container = document.getElementById('three-canvas-container');
    if (!container) return;

    // SCENE
    scene = new THREE.Scene();

    // CAMERA (Framed looking at the watch resting on the living room table)
    const width = container.clientWidth;
    const height = container.clientHeight || 520;
    camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 6.8);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.6;
    controls.maxDistance = 10;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.9;
    controls.maxPolarAngle = Math.PI / 2.05; // Keep camera above the table surface
    controls.minPolarAngle = Math.PI / 5;
    controls.target.set(0, -0.4, 0);

    // LIGHTS
    setupLighting();

    // DYNAMIC LCD TEXTURE
    setupLCDCanvas();

    // WATCH MESHES GROUP
    watchGroup = new THREE.Group();
    scene.add(watchGroup);

    // Build Cozy Living Room & Table Setting
    buildLivingRoomScene();

    buildClassicWatch();
    buildCapsuleWatch();

    // Initial chassis visibility
    capsuleModel.visible = false;
    classicModel.visible = true;

    // Contact Shadow Plane
    setupContactShadow();

    // RAYCASTER FOR INTERACTIVE 3D CLICKS
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // WINDOW RESIZE
    window.addEventListener('resize', onWindowResize);

    // START ANIMATION LOOP
    animate();
  }

  function setupLighting() {
    // Ambient soft studio light with warm living room tone
    const ambientLight = new THREE.AmbientLight(0xfff5eb, 0.95);
    scene.add(ambientLight);

    // Warm Sun Window Light
    const windowLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    windowLight.position.set(-6, 8, 5);
    windowLight.castShadow = true;
    windowLight.shadow.mapSize.width = 1024;
    windowLight.shadow.mapSize.height = 1024;
    windowLight.shadow.camera.near = 0.5;
    windowLight.shadow.camera.far = 30;
    windowLight.shadow.bias = -0.001;
    scene.add(windowLight);

    // Fill Light (soft living room ambiance)
    const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.5);
    fillLight.position.set(6, 4, 4);
    scene.add(fillLight);

    // Warm Cozy Table Lamp Light
    const lampLight = new THREE.PointLight(0xffd7a8, 1.1, 10);
    lampLight.position.set(3.2, 1.2, -1.2);
    scene.add(lampLight);

    // Subtle Rim Light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
    rimLight.position.set(0, 6, -6);
    scene.add(rimLight);

    // EL Backlight Glow Point Light
    backlightPointLight = new THREE.PointLight(0x35ffc2, 0, 3.5);
    backlightPointLight.position.set(-1.0, 0, 0.6);
    scene.add(backlightPointLight);
  }

  // --- LIVING ROOM & TABLE ENVIRONMENT ---
  function buildLivingRoomScene() {
    const roomGroup = new THREE.Group();

    // 1. BACK WALL (Soft warm contemporary interior color)
    const wallGeo = new THREE.PlaneGeometry(36, 22);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xedf0f8,
      roughness: 0.92,
      metalness: 0.02,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 4.5, -7.5);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Wall Baseboard moulding
    const baseboardGeo = new THREE.BoxGeometry(36, 0.5, 0.15);
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboard.position.set(0, -3.2, -7.4);
    roomGroup.add(baseboard);

    // 2. WOODEN FLOOR / RUG
    const floorGeo = new THREE.PlaneGeometry(36, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xd9ccba,
      roughness: 0.8,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -3.5, 0);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Cozy woven rug under the table
    const rugGeo = new THREE.PlaneGeometry(16, 12);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0xf3efe8,
      roughness: 0.95,
      metalness: 0.01,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, -3.48, 0);
    rug.receiveShadow = true;
    roomGroup.add(rug);

    // 3. LIVING ROOM WINDOW (Left wall background)
    const winFrameGeo = new THREE.BoxGeometry(4.2, 5.8, 0.12);
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const windowFrame = new THREE.Mesh(winFrameGeo, winFrameMat);
    windowFrame.position.set(-6.5, 3.8, -7.4);
    roomGroup.add(windowFrame);

    const winGlassGeo = new THREE.PlaneGeometry(3.8, 5.4);
    const winGlassMat = new THREE.MeshBasicMaterial({ color: 0xdaf2ff });
    const windowGlass = new THREE.Mesh(winGlassGeo, winGlassMat);
    windowGlass.position.set(-6.5, 3.8, -7.33);
    roomGroup.add(windowGlass);

    // 4. FRAMED ART PRINT (Right wall background)
    const artFrameGeo = new THREE.BoxGeometry(3.6, 2.6, 0.1);
    const artFrameMat = new THREE.MeshStandardMaterial({ color: 0x231f20, roughness: 0.3 });
    const artFrame = new THREE.Mesh(artFrameGeo, artFrameMat);
    artFrame.position.set(5.5, 4.2, -7.4);
    roomGroup.add(artFrame);

    const artCanvasGeo = new THREE.PlaneGeometry(3.3, 2.3);
    const artCanvasMat = new THREE.MeshBasicMaterial({ color: 0x1448ff });
    const artCanvas = new THREE.Mesh(artCanvasGeo, artCanvasMat);
    artCanvas.position.set(5.5, 4.2, -7.34);
    roomGroup.add(artCanvas);

    // 5. WOODEN LIVING ROOM COFFEE TABLE (The watch rests here!)
    // Warm natural oak table top
    const tableTopGeo = new THREE.BoxGeometry(9.6, 0.4, 5.2);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xc89b6b, // warm oak wood
      roughness: 0.42,
      metalness: 0.04,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, woodMat);
    tableTop.position.set(0, -1.4, 0);
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    roomGroup.add(tableTop);

    // Table Legs (Tapered Scandinavian rounded legs)
    const legGeo = new THREE.CylinderGeometry(0.12, 0.08, 2.1, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a241f, roughness: 0.5 });

    const legPositions = [
      [-4.2, -2.45, -2.0],
      [ 4.2, -2.45, -2.0],
      [-4.2, -2.45,  2.0],
      [ 4.2, -2.45,  2.0]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      roomGroup.add(leg);
    });

    // 6. LIVING ROOM TABLE ACCESSORIES (Potted succulent + ceramic coffee mug)
    // Coaster under coffee cup
    const coasterGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.04, 32);
    const coasterMat = new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.7 });
    const coaster = new THREE.Mesh(coasterGeo, coasterMat);
    coaster.position.set(2.8, -1.18, -0.6);
    roomGroup.add(coaster);

    // Ceramic Coffee Mug
    const mugGeo = new THREE.CylinderGeometry(0.42, 0.38, 0.75, 24);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 0.3 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(2.8, -0.8, -0.6);
    mug.castShadow = true;
    roomGroup.add(mug);

    // Coffee inside
    const coffeeGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.02, 24);
    const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.2 });
    const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
    coffee.position.set(2.8, -0.48, -0.6);
    roomGroup.add(coffee);

    // Small Potted Plant on Table
    const potGeo = new THREE.CylinderGeometry(0.5, 0.36, 0.7, 24);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.3 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-3.2, -0.85, -0.8);
    pot.castShadow = true;
    roomGroup.add(pot);

    // Green Succulent Leaves
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x3da85e, roughness: 0.6 });
    for (let i = 0; i < 5; i++) {
      const leafGeo = new THREE.ConeGeometry(0.18, 0.5, 8);
      const leaf = new THREE.Mesh(leafGeo, plantMat);
      const angle = (i / 5) * Math.PI * 2;
      leaf.position.set(-3.2 + Math.cos(angle) * 0.2, -0.4, -0.8 + Math.sin(angle) * 0.2);
      leaf.rotation.z = Math.cos(angle) * 0.45;
      leaf.rotation.x = Math.sin(angle) * 0.45;
      roomGroup.add(leaf);
    }

    // Modern Table Lamp in background corner
    const lampBaseGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.12, 24);
    const lampBaseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const lampBase = new THREE.Mesh(lampBaseGeo, lampBaseMat);
    lampBase.position.set(3.2, -1.14, -1.2);
    roomGroup.add(lampBase);

    const lampPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 16);
    const lampPole = new THREE.Mesh(lampPoleGeo, lampBaseMat);
    lampPole.position.set(3.2, -0.24, -1.2);
    roomGroup.add(lampPole);

    const lampShadeGeo = new THREE.ConeGeometry(0.65, 0.75, 24, 1, true);
    const lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0xfffae6,
      roughness: 0.3,
      side: THREE.DoubleSide,
      emissive: 0xffd280,
      emissiveIntensity: 0.4
    });
    const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
    lampShade.position.set(3.2, 0.7, -1.2);
    roomGroup.add(lampShade);

    scene.add(roomGroup);
  }

  function setupContactShadow() {
    // Shadow receiver plane under the watch (clean neutral drop shadow)
    const planeGeo = new THREE.PlaneGeometry(12, 12);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 115);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.24)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.02)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });

    const shadowMesh = new THREE.Mesh(planeGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.18; // Directly atop coffee table surface (-1.2)
    scene.add(shadowMesh);
  }

  // --- LCD CANVAS DRAWING & UPDATES ---
  function setupLCDCanvas() {
    lcdCanvas = document.createElement('canvas');
    lcdCanvas.width = 512;
    lcdCanvas.height = 256;
    lcdContext = lcdCanvas.getContext('2d');

    lcdTexture = new THREE.CanvasTexture(lcdCanvas);
    lcdTexture.minFilter = THREE.LinearFilter;
    lcdTexture.magFilter = THREE.LinearFilter;

    lcdMaterial = new THREE.MeshBasicMaterial({
      map: lcdTexture,
    });
  }

  function updateLCD() {
    if (!lcdContext) return;

    const ctx = lcdContext;
    const w = 512;
    const h = 256;

    // Background color
    if (isBacklightOn) {
      ctx.fillStyle = '#2bf5b2'; // Bright Glowing Mint EL
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#b7ccb2'; // Retro greenish-gray classic LCD
      ctx.fillRect(0, 0, w, h);
    }

    // Screen inner bezel shadow
    ctx.strokeStyle = isBacklightOn ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);

    // LCD Segment Text Color
    ctx.fillStyle = isBacklightOn ? '#072e21' : '#141d16';

    const now = new Date();

    if (watchMode === 'clock') {
      // ONLY NUMBERS taking up the majority of the screen
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const colon = now.getSeconds() % 2 === 0 ? ':' : ' ';

      // Extra large bold 7-segment digital font filling the display
      ctx.font = 'bold 210px "VT323", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${hours}${colon}${minutes}`, w / 2, h / 2 + 10);
    } else if (watchMode === 'stopwatch') {
      // ONLY NUMBERS for Stopwatch taking up the majority of the screen
      let currentElapsed = stopwatchElapsed;
      if (stopwatchRunning) {
        currentElapsed = Date.now() - stopwatchStartTime + stopwatchElapsed;
      }

      const totalSec = Math.floor(currentElapsed / 1000);
      const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const sec = String(totalSec % 60).padStart(2, '0');
      const cs = String(Math.floor((currentElapsed % 1000) / 10)).padStart(2, '0'); // centiseconds

      // Display format: MM:SS.CS or MM:SS filling majority of screen
      if (totalSec < 3600) {
        ctx.font = 'bold 185px "VT323", "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${min}:${sec}`, w / 2 - 38, h / 2 + 10);

        // Centiseconds taking remaining space
        ctx.font = 'bold 85px "VT323", "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`.${cs}`, w / 2 + 140, h / 2 + 35);
      } else {
        const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        ctx.font = 'bold 190px "VT323", "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${hrs}:${min}`, w / 2, h / 2 + 10);
      }
    }

    lcdTexture.needsUpdate = true;
  }

  // --- BUILD 3D MODELS ---

  // 1. CLASSIC RECTANGULAR WATCH
  function buildClassicWatch() {
    classicModel = new THREE.Group();

    const currentPal = WATCH_PALETTES[currentColorKey] || WATCH_PALETTES.blue;

    // Body Material
    bodyMaterialClassic = new THREE.MeshPhysicalMaterial({
      color: currentPal.bodyColor,
      roughness: currentPal.roughness,
      metalness: currentPal.metalness,
      clearcoat: 0.35,
      clearcoatRoughness: 0.15,
    });

    // Outer case: Rounded rectangle
    const caseWidth = 3.2;
    const caseHeight = 1.35;
    const cornerRadius = 0.22;

    const caseShape = new THREE.Shape();
    caseShape.moveTo(-caseWidth / 2 + cornerRadius, -caseHeight / 2);
    caseShape.lineTo(caseWidth / 2 - cornerRadius, -caseHeight / 2);
    caseShape.quadraticCurveTo(caseWidth / 2, -caseHeight / 2, caseWidth / 2, -caseHeight / 2 + cornerRadius);
    caseShape.lineTo(caseWidth / 2, caseHeight / 2 - cornerRadius);
    caseShape.quadraticCurveTo(caseWidth / 2, caseHeight / 2, caseWidth / 2 - cornerRadius, caseHeight / 2);
    caseShape.lineTo(-caseWidth / 2 + cornerRadius, caseHeight / 2);
    caseShape.quadraticCurveTo(-caseWidth / 2, caseHeight / 2, -caseWidth / 2, caseHeight / 2 - cornerRadius);
    caseShape.lineTo(-caseWidth / 2, -caseHeight / 2 + cornerRadius);
    caseShape.quadraticCurveTo(-caseWidth / 2, -caseHeight / 2, -caseWidth / 2 + cornerRadius, -caseHeight / 2);

    const extrudeSettings = {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const caseGeo = new THREE.ExtrudeGeometry(caseShape, extrudeSettings);
    caseGeo.center();
    const caseMesh = new THREE.Mesh(caseGeo, bodyMaterialClassic);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    classicModel.add(caseMesh);

    // Screen Well (Dark recessed bevel border)
    const wellGeo = new THREE.BoxGeometry(1.65, 0.85, 0.06);
    const wellMat = new THREE.MeshStandardMaterial({
      color: 0x111316,
      roughness: 0.6,
      metalness: 0.1,
    });
    const wellMesh = new THREE.Mesh(wellGeo, wellMat);
    wellMesh.position.set(-0.45, 0, 0.3);
    classicModel.add(wellMesh);

    // Inner LCD Screen Plane
    const screenGeo = new THREE.PlaneGeometry(1.5, 0.72);
    const screenMesh = new THREE.Mesh(screenGeo, lcdMaterial);
    screenMesh.position.set(-0.45, 0, 0.335);
    classicModel.add(screenMesh);

    // Glossy protective Glass cover
    const glassGeo = new THREE.PlaneGeometry(1.5, 0.72);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
      thickness: 0.1,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(-0.45, 0, 0.34);
    classicModel.add(glassMesh);

    // 2 Tactile Buttons on the Right Side of the Face
    const btnGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 24);
    btnGeo.rotateX(Math.PI / 2);

    const btnMat = new THREE.MeshStandardMaterial({
      color: 0xb5bcc7,
      roughness: 0.3,
      metalness: 0.6,
    });

    topButtonMeshClassic = new THREE.Mesh(btnGeo, btnMat.clone());
    topButtonMeshClassic.position.set(0.85, 0.28, 0.32);
    topButtonMeshClassic.name = 'btn_top';
    classicModel.add(topButtonMeshClassic);

    bottomButtonMeshClassic = new THREE.Mesh(btnGeo, btnMat.clone());
    bottomButtonMeshClassic.position.set(0.85, -0.28, 0.32);
    bottomButtonMeshClassic.name = 'btn_bottom';
    classicModel.add(bottomButtonMeshClassic);

    // -------------------------------------------------------
    // HINGE / KEYCHAIN PIVOT WITH PHYSICS
    // -------------------------------------------------------
    // Side lanyard eyelet on the far right of the case
    const lugGeo = new THREE.TorusGeometry(0.15, 0.05, 16, 24);
    lugGeo.rotateY(Math.PI / 2);
    const lugMesh = new THREE.Mesh(lugGeo, bodyMaterialClassic);
    lugMesh.position.set(1.64, 0, 0);
    classicModel.add(lugMesh);

    // Keychain Pivot Group for Physics Swinging
    keychainPivotClassic = new THREE.Group();
    keychainPivotClassic.position.set(1.88, 0, 0);
    classicModel.add(keychainPivotClassic);

    // Metal Split Jump Ring Connector
    const ringGeo = new THREE.TorusGeometry(0.20, 0.035, 16, 32);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      roughness: 0.18,
      metalness: 0.95,
    });
    const ringMesh = new THREE.Mesh(ringGeo, metalMat);
    ringMesh.position.set(0, 0, 0);
    keychainPivotClassic.add(ringMesh);

    // Molded Silicone Carabiner Loop Strap
    strapMaterialClassic = new THREE.MeshStandardMaterial({
      color: currentPal.strapColor,
      roughness: 0.45,
      metalness: 0.02,
    });

    // Cinch Toggle / Bead collar at the base of the strap
    const cinchGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.22, 24);
    cinchGeo.rotateZ(Math.PI / 2);
    const cinchMesh = new THREE.Mesh(cinchGeo, strapMaterialClassic);
    cinchMesh.position.set(0.26, 0, 0);
    keychainPivotClassic.add(cinchMesh);

    // Smooth teardrop loop curve (local to pivot at (1.88, 0, 0))
    const loopPoints = [
      new THREE.Vector3(0.26, 0, 0),
      new THREE.Vector3(0.44, 0.16, 0.02),
      new THREE.Vector3(0.77, 0.42, 0.03),
      new THREE.Vector3(1.22, 0.45, 0.0),
      new THREE.Vector3(1.52, 0.22, -0.02),
      new THREE.Vector3(1.60, 0, -0.03),
      new THREE.Vector3(1.52, -0.22, -0.02),
      new THREE.Vector3(1.22, -0.45, 0.0),
      new THREE.Vector3(0.77, -0.42, 0.03),
      new THREE.Vector3(0.44, -0.16, 0.02),
    ];
    const loopCurve = new THREE.CatmullRomCurve3(loopPoints, true);
    const tubeGeo = new THREE.TubeGeometry(loopCurve, 64, 0.075, 16, true);
    const strapMesh = new THREE.Mesh(tubeGeo, strapMaterialClassic);
    strapMesh.castShadow = true;
    keychainPivotClassic.add(strapMesh);

    // Center the entire classic watch (case -1.6 to strap +3.48 => center = +0.94)
    classicModel.position.set(-0.94, 0, 0);

    watchGroup.add(classicModel);
  }

  // 2. CAPSULE / OVAL WATCH MODEL
  function buildCapsuleWatch() {
    capsuleModel = new THREE.Group();

    bodyMaterialCapsule = new THREE.MeshPhysicalMaterial({
      color: 0x18191d,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
    });

    // Capsule pill shape
    const capWidth = 2.9;
    const capHeight = 1.35;
    const r = capHeight / 2;

    const capShape = new THREE.Shape();
    capShape.moveTo(-capWidth / 2 + r, -r);
    capShape.lineTo(capWidth / 2 - r, -r);
    capShape.absarc(capWidth / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
    capShape.lineTo(-capWidth / 2 + r, r);
    capShape.absarc(-capWidth / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);

    const extrudeSettings = {
      depth: 0.48,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const capGeo = new THREE.ExtrudeGeometry(capShape, extrudeSettings);
    capGeo.center();
    const capMesh = new THREE.Mesh(capGeo, bodyMaterialCapsule);
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    capsuleModel.add(capMesh);

    // Beveled screen well
    const wellGeo = new THREE.BoxGeometry(1.5, 0.82, 0.06);
    const wellMat = new THREE.MeshStandardMaterial({
      color: 0x111316,
      roughness: 0.6,
      metalness: 0.1,
    });
    const wellMesh = new THREE.Mesh(wellGeo, wellMat);
    wellMesh.position.set(-0.35, 0, 0.31);
    capsuleModel.add(wellMesh);

    // LCD Screen Plane
    const screenGeo = new THREE.PlaneGeometry(1.38, 0.7);
    const screenMesh = new THREE.Mesh(screenGeo, lcdMaterial);
    screenMesh.position.set(-0.35, 0, 0.345);
    capsuleModel.add(screenMesh);

    // Glass Cover
    const glassGeo = new THREE.PlaneGeometry(1.38, 0.7);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      transparent: true,
      roughness: 0.05,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(-0.35, 0, 0.35);
    capsuleModel.add(glassMesh);

    // 2 Buttons
    const btnGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.15, 24);
    btnGeo.rotateX(Math.PI / 2);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x8f95a0, roughness: 0.4, metalness: 0.5 });

    topButtonMeshCapsule = new THREE.Mesh(btnGeo, btnMat.clone());
    topButtonMeshCapsule.position.set(0.78, 0.26, 0.33);
    topButtonMeshCapsule.name = 'btn_top';
    capsuleModel.add(topButtonMeshCapsule);

    bottomButtonMeshCapsule = new THREE.Mesh(btnGeo, btnMat.clone());
    bottomButtonMeshCapsule.position.set(0.78, -0.26, 0.33);
    bottomButtonMeshCapsule.name = 'btn_bottom';
    capsuleModel.add(bottomButtonMeshCapsule);

    // Right Metal Lug & Ring with physics pivot
    const lugGeo = new THREE.TorusGeometry(0.14, 0.05, 16, 24);
    lugGeo.rotateY(Math.PI / 2);
    const lugMesh = new THREE.Mesh(lugGeo, bodyMaterialCapsule);
    lugMesh.position.set(1.48, 0, 0);
    capsuleModel.add(lugMesh);

    keychainPivotCapsule = new THREE.Group();
    keychainPivotCapsule.position.set(1.72, 0, 0);
    capsuleModel.add(keychainPivotCapsule);

    const ringGeo = new THREE.TorusGeometry(0.20, 0.035, 16, 32);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, roughness: 0.18, metalness: 0.95 });
    const ringMesh = new THREE.Mesh(ringGeo, metalMat);
    ringMesh.position.set(0, 0, 0);
    keychainPivotCapsule.add(ringMesh);

    // Braided Textured Black Cord Loop (matching mono_capsule_black.png)
    strapMaterialCapsule = new THREE.MeshStandardMaterial({
      color: 0x16171a,
      roughness: 0.85,
      metalness: 0.05,
    });

    const beadGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.22, 24);
    beadGeo.rotateZ(Math.PI / 2);
    const beadMesh = new THREE.Mesh(beadGeo, bodyMaterialCapsule);
    beadMesh.position.set(0.26, 0, 0);
    keychainPivotCapsule.add(beadMesh);

    const cordPoints = [
      new THREE.Vector3(0.26, 0, 0),
      new THREE.Vector3(0.46, 0.15, 0.02),
      new THREE.Vector3(0.83, 0.4, 0.03),
      new THREE.Vector3(1.28, 0.42, 0),
      new THREE.Vector3(1.58, 0.2, -0.02),
      new THREE.Vector3(1.66, 0, -0.03),
      new THREE.Vector3(1.58, -0.2, -0.02),
      new THREE.Vector3(1.28, -0.42, 0),
      new THREE.Vector3(0.83, -0.4, 0.03),
      new THREE.Vector3(0.46, -0.15, 0.02),
    ];
    const cordCurve = new THREE.CatmullRomCurve3(cordPoints, true);
    const cordGeo = new THREE.TubeGeometry(cordCurve, 64, 0.07, 16, true);
    const cordMesh = new THREE.Mesh(cordGeo, strapMaterialCapsule);
    cordMesh.castShadow = true;
    keychainPivotCapsule.add(cordMesh);

    // Center the entire capsule watch (case -1.45 to cord +3.38 => center = +0.96)
    capsuleModel.position.set(-0.96, 0, 0);

    watchGroup.add(capsuleModel);
  }

  // --- INTERACTION & CLICKS ---
  function onPointerDown(event) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const activeModel = currentChassis === 'classic' ? classicModel : capsuleModel;
    const intersects = raycaster.intersectObjects(activeModel.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.name === 'btn_top' || (hit.parent && hit.parent.name === 'btn_top')) {
        onTopButtonClick();
      } else if (hit.name === 'btn_bottom' || (hit.parent && hit.parent.name === 'btn_bottom')) {
        onBottomButtonClick();
      }
    }
  }

  function onTopButtonClick() {
    playWatchBeep(4200, 0.06);

    const activeBtn = currentChassis === 'classic' ? topButtonMeshClassic : topButtonMeshCapsule;
    if (activeBtn) {
      activeBtn.position.z -= 0.04;
      setTimeout(() => {
        activeBtn.position.z += 0.04;
      }, 90);
    }

    // Top button changes mode to CLOCK mode
    setClockMode();
  }

  function onBottomButtonClick() {
    playWatchBeep(3200, 0.06);

    const activeBtn = currentChassis === 'classic' ? bottomButtonMeshClassic : bottomButtonMeshCapsule;
    if (activeBtn) {
      activeBtn.position.z -= 0.04;
      setTimeout(() => {
        activeBtn.position.z += 0.04;
      }, 90);
    }

    // Bottom button changes to STOPWATCH mode and starts the stopwatch
    setStopwatchModeAndStart();
  }

  function setClockMode() {
    watchMode = 'clock';
    // Pause stopwatch running state while in clock mode
    if (stopwatchRunning) {
      stopwatchElapsed += Date.now() - stopwatchStartTime;
      stopwatchRunning = false;
    }
    updateModeButtonLabel();
  }

  function setStopwatchModeAndStart() {
    watchMode = 'stopwatch';
    if (!stopwatchRunning) {
      stopwatchStartTime = Date.now();
      stopwatchRunning = true;
    } else {
      // If already in stopwatch mode and running, clicking toggles pause / restart
      stopwatchElapsed += Date.now() - stopwatchStartTime;
      stopwatchRunning = false;
    }
    updateModeButtonLabel();
  }

  function toggleMode() {
    playWatchBeep(3500, 0.08);
    if (watchMode === 'clock') {
      setStopwatchModeAndStart();
    } else {
      setClockMode();
    }
  }

  function updateModeButtonLabel() {
    const lbl = document.getElementById('current-mode-label');
    if (lbl) {
      lbl.innerText = watchMode === 'clock' ? 'CLOCK' : (stopwatchRunning ? 'STOPWATCH (RUNNING)' : 'STOPWATCH');
      lbl.style.color = watchMode === 'clock' ? 'var(--mono-blue)' : '#FF2E4D';
    }
  }

  function switchChassis(type) {
    if (type === currentChassis) return;
    currentChassis = type;

    if (type === 'classic') {
      classicModel.visible = true;
      capsuleModel.visible = false;
    } else {
      classicModel.visible = false;
      capsuleModel.visible = true;
      switchWatchColor('capsule_black');
    }

    playWatchBeep(3200, 0.04);
  }

  function switchWatchColor(colorKey) {
    if (!WATCH_PALETTES[colorKey]) return;
    currentColorKey = colorKey;
    const pal = WATCH_PALETTES[colorKey];

    if (pal.type === 'capsule' && currentChassis !== 'capsule') {
      currentChassis = 'capsule';
      classicModel.visible = false;
      capsuleModel.visible = true;
    } else if (pal.type === 'classic' && currentChassis !== 'classic') {
      currentChassis = 'classic';
      classicModel.visible = true;
      capsuleModel.visible = false;
    }

    // Update classic materials
    if (bodyMaterialClassic && strapMaterialClassic) {
      bodyMaterialClassic.color.setHex(pal.bodyColor);
      bodyMaterialClassic.roughness = pal.roughness;
      strapMaterialClassic.color.setHex(pal.strapColor);
    }

    // Update capsule materials if capsule
    if (bodyMaterialCapsule && strapMaterialCapsule) {
      bodyMaterialCapsule.color.setHex(pal.bodyColor);
      bodyMaterialCapsule.roughness = pal.roughness;
    }

    // Update HUD/labels in DOM
    const nameEl = document.getElementById('selected-color-name');
    if (nameEl) nameEl.innerText = pal.name;

    // Update swatch buttons active state
    document.querySelectorAll('.color-swatch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.color === colorKey);
    });

    document.querySelectorAll('.model-chassis-toggle .toggle-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.chassis === currentChassis);
    });

    playWatchBeep(4400, 0.03);
  }

  function resetCamera() {
    controls.reset();
    camera.position.set(0, 1.2, 6.8);
    controls.target.set(0, -0.4, 0);
    playWatchBeep(3000, 0.04);
  }

  function toggleAutoRotate() {
    isAutoRotate = !isAutoRotate;
    controls.autoRotate = isAutoRotate;

    const btn = document.getElementById('btn-auto-rotate');
    if (btn) {
      btn.classList.toggle('active', isAutoRotate);
    }
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 520;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // --- ANIMATION LOOP ---
  let lastLCDUpdate = 0;
  let lastTimestamp = 0;

  function animate(timestamp) {
    requestAnimationFrame(animate);

    const time = timestamp || 0;
    const dt = Math.min((time - (lastTimestamp || time)) / 1000, 0.1);
    lastTimestamp = time;

    // Update LCD for smooth digital clock
    if (!lastLCDUpdate || time - lastLCDUpdate > 100) {
      updateLCD();
      lastLCDUpdate = time;
    }

    // Table resting position with tiny idle breath
    const t = time * 0.0012;
    watchGroup.position.y = -0.42 + Math.sin(t) * 0.015;

    // --- KEYCHAIN PENDULUM / INERTIAL PHYSICS ---
    if (controls) {
      const az = controls.getAzimuthalAngle();
      const el = controls.getPolarAngle();

      const deltaAz = az - lastCameraAzimuth;
      const deltaEl = el - lastCameraElevation;

      lastCameraAzimuth = az;
      lastCameraElevation = el;

      // User orbit rotation induces torque / angular acceleration on strap
      const dragTorqueZ = -deltaAz * 12.0;
      const dragTorqueY = -deltaEl * 8.0;

      // Natural spring restoring force towards equilibrium + subtle gravity pendulum swing
      const naturalSwing = Math.sin(time * 0.003) * 0.08;
      const springK = 28.0;
      const damping = 4.5;

      // Integrate Z (swinging up/down/tilt)
      const accelZ = -springK * (strapAngleZ - naturalSwing) + dragTorqueZ * 40.0 - damping * strapVelZ;
      strapVelZ += accelZ * dt;
      strapAngleZ += strapVelZ * dt;

      // Integrate Y (swinging forwards/backwards in depth)
      const accelY = -springK * strapAngleY + dragTorqueY * 40.0 - damping * strapVelY;
      strapVelY += accelY * dt;
      strapAngleY += strapVelY * dt;

      // Clamp max deflection to avoid unnatural flipping
      strapAngleZ = Math.max(-1.1, Math.min(1.1, strapAngleZ));
      strapAngleY = Math.max(-0.9, Math.min(0.9, strapAngleY));

      // Apply physics rotation to active keychain pivot
      if (keychainPivotClassic) {
        keychainPivotClassic.rotation.z = strapAngleZ;
        keychainPivotClassic.rotation.y = strapAngleY;
        keychainPivotClassic.rotation.x = Math.sin(time * 0.002) * 0.04;
      }
      if (keychainPivotCapsule) {
        keychainPivotCapsule.rotation.z = strapAngleZ * 0.9;
        keychainPivotCapsule.rotation.y = strapAngleY * 0.9;
        keychainPivotCapsule.rotation.x = Math.sin(time * 0.002) * 0.04;
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // EXPOSE GLOBAL API TO WINDOW
  window.MonoWatch3D = {
    init: initThree,
    switchColor: switchWatchColor,
    switchChassis: switchChassis,
    setClockMode: setClockMode,
    setStopwatchModeAndStart: setStopwatchModeAndStart,
    toggleMode: toggleMode,
    resetCamera: resetCamera,
    toggleAutoRotate: toggleAutoRotate,
    playBeep: playWatchBeep,
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThree);
  } else {
    initThree();
  }
})();
