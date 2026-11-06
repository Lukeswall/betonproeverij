import * as THREE from 'three';

/* --- SOUND FX (Web Audio API Synthesizer - No External Assets Needed) --- */
class SoundFX {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playJump() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }
  playClimb() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 + Math.random() * 80, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
  playSnack() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(660, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }
  playAlert() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(950, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
  playWin() {
    if (!this.ctx) return;
    [523, 659, 783, 1046].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = this.ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }
}

const sfx = new SoundFX();

/* --- COMIC FLOATING TEXT EFFECT --- */
function showComicPopup(text) {
  const container = document.getElementById('comic-popups');
  if (!container) return;
  const bubble = document.createElement('div');
  bubble.className = 'comic-bubble';
  bubble.innerText = text;
  container.appendChild(bubble);
  setTimeout(() => bubble.remove(), 800);
}

/* --- GAME ENGINE & SETUP --- */
class BetonproeverijGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Game state
    this.isPlaying = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.snacksCollected = 0;
    this.totalSnacks = 5;
    this.sugarRushTimer = 0;
    this.isStealth = false;
    this.isClimbing = false;
    this.currentClimbTree = null;
    this.startTime = 0;

    // Input state
    this.keys = {};
    this.mouse = { x: 0, y: 0, yaw: 0, pitch: 0.1 };
    this.isPointerLocked = false;

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Game Entities
    this.player = null;
    this.playerVelocity = new THREE.Vector3();
    this.isGrounded = false;
    this.trees = [];
    this.bushes = [];
    this.rocks = [];
    this.snacks = [];
    this.enemies = [];
    this.birds = [];
    this.finishArea = null;

    // Materials (Cel-shaded Toon look)
    this.toonMaterials = this.createMaterials();

    this.initScene();
    this.initPlayer();
    this.initWorld();
    this.setupEvents();
    this.animate();
  }

  createMaterials() {
    return {
      koalaFur: new THREE.MeshToonMaterial({ color: 0x8d99ae }),
      koalaBelly: new THREE.MeshToonMaterial({ color: 0xe0e6ed }),
      koalaNose: new THREE.MeshToonMaterial({ color: 0x1a1a1a }),
      koalaEarPink: new THREE.MeshToonMaterial({ color: 0xffb4a2 }),
      shadesBlack: new THREE.MeshToonMaterial({ color: 0x0a0a0a }),
      goldChain: new THREE.MeshToonMaterial({ color: 0xffd700 }),
      woodTrunk: new THREE.MeshToonMaterial({ color: 0x6f4e37 }),
      leavesGreen: new THREE.MeshToonMaterial({ color: 0x2e7d32 }),
      bushGreen: new THREE.MeshToonMaterial({ color: 0x388e3c }),
      rockGrey: new THREE.MeshToonMaterial({ color: 0x78909c }),
      concreteFloor: new THREE.MeshToonMaterial({ color: 0x90a4ae }),
      groundGrass: new THREE.MeshToonMaterial({ color: 0x558b2f }),
      wallConcrete: new THREE.MeshToonMaterial({ color: 0x607d8b }),
      enemySuitBlue: new THREE.MeshToonMaterial({ color: 0x1565c0 }),
      enemySuitGreen: new THREE.MeshToonMaterial({ color: 0x2e7d32 }),
      enemySkin: new THREE.MeshToonMaterial({ color: 0xffcc80 }),
      stallRoofRed: new THREE.MeshToonMaterial({ color: 0xd32f2f }),
      stallRoofWhite: new THREE.MeshToonMaterial({ color: 0xffffff }),
      goldTree: new THREE.MeshToonMaterial({ color: 0xffc107 })
    };
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Comic bright blue sky
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.007);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 500);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lighting (Hard comic contrast)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
    this.scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff8e7, 1.3);
    sun.position.set(60, 100, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 250;
    const d = 100;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    this.scene.add(sun);
  }

  /* --- PROCEDURAL GANGSTER KOALA MODEL --- */
  initPlayer() {
    this.player = new THREE.Group();

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.55, 16, 16);
    bodyGeo.scale(1, 1.2, 0.9);
    const body = new THREE.Mesh(bodyGeo, this.toonMaterials.koalaFur);
    body.castShadow = true;
    this.player.add(body);

    // Fluffy Belly
    const bellyGeo = new THREE.SphereGeometry(0.35, 12, 12);
    bellyGeo.scale(0.9, 1.1, 0.4);
    const belly = new THREE.Mesh(bellyGeo, this.toonMaterials.koalaBelly);
    belly.position.set(0, -0.05, 0.4);
    this.player.add(belly);

    // Head
    const headGeo = new THREE.SphereGeometry(0.48, 16, 16);
    headGeo.scale(1.1, 0.95, 1.0);
    const head = new THREE.Mesh(headGeo, this.toonMaterials.koalaFur);
    head.position.set(0, 0.8, 0.05);
    head.castShadow = true;
    this.player.add(head);

    // Ears (Big fluffy Koala ears)
    const createEar = (x) => {
      const earGroup = new THREE.Group();
      const earOuter = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), this.toonMaterials.koalaFur);
      earOuter.scale.set(1, 1, 0.4);
      const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), this.toonMaterials.koalaEarPink);
      earInner.scale.set(0.9, 0.9, 0.3);
      earInner.position.z = 0.06;
      earGroup.add(earOuter, earInner);
      earGroup.position.set(x, 1.1, -0.05);
      earGroup.rotation.y = x > 0 ? 0.3 : -0.3;
      return earGroup;
    };
    this.player.add(createEar(0.45));
    this.player.add(createEar(-0.45));

    // Big Black Nose
    const noseGeo = new THREE.SphereGeometry(0.18, 12, 12);
    noseGeo.scale(1, 1.4, 0.8);
    const nose = new THREE.Mesh(noseGeo, this.toonMaterials.koalaNose);
    nose.position.set(0, 0.75, 0.52);
    this.player.add(nose);

    // GANGSTER SUNGLASSES (Thug Life style)
    const shadesGroup = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(0.72, 0.18, 0.08);
    const frame = new THREE.Mesh(frameGeo, this.toonMaterials.shadesBlack);
    const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.05), this.toonMaterials.shadesBlack);
    lensL.position.set(-0.18, -0.02, 0.02);
    const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.05), this.toonMaterials.shadesBlack);
    lensR.position.set(0.18, -0.02, 0.02);
    shadesGroup.add(frame, lensL, lensR);
    shadesGroup.position.set(0, 0.88, 0.48);
    shadesGroup.rotation.x = 0.05;
    this.player.add(shadesGroup);

    // GOLD BLING CHAIN ($)
    const chainTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.04, 8, 18),
      this.toonMaterials.goldChain
    );
    chainTorus.rotation.x = Math.PI / 2 + 0.3;
    chainTorus.position.set(0, 0.45, 0.15);
    this.player.add(chainTorus);

    // Arms & Legs
    const limbGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
    this.leftArm = new THREE.Mesh(limbGeo, this.toonMaterials.koalaFur);
    this.leftArm.position.set(-0.52, 0.2, 0.1);
    this.leftArm.rotation.z = 0.4;
    this.rightArm = new THREE.Mesh(limbGeo, this.toonMaterials.koalaFur);
    this.rightArm.position.set(0.52, 0.2, 0.1);
    this.rightArm.rotation.z = -0.4;

    this.leftLeg = new THREE.Mesh(limbGeo, this.toonMaterials.koalaFur);
    this.leftLeg.position.set(-0.25, -0.65, 0);
    this.rightLeg = new THREE.Mesh(limbGeo, this.toonMaterials.koalaFur);
    this.rightLeg.position.set(0.25, -0.65, 0);

    this.player.add(this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);

    // Initial position in parkour course
    this.player.position.set(0, 1.2, 0);
    this.scene.add(this.player);
  }

  /* --- WORLD: PARK, CONCRETE JUNGLE, TREES, ROCKS, FOOD STANDS --- */
  initWorld() {
    // 1. Ground: Mixed Grass & Concrete paths
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const ground = new THREE.Mesh(groundGeo, this.toonMaterials.groundGrass);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Concrete Parkour Plaza / Walkway
    const plazaGeo = new THREE.BoxGeometry(16, 0.3, 180);
    const plaza = new THREE.Mesh(plazaGeo, this.toonMaterials.concreteFloor);
    plaza.position.set(0, 0.15, -60);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 2. Climbable Trees (High verticality)
    const treePositions = [
      { x: -7, z: -10, h: 10 }, { x: 7, z: -16, h: 12 },
      { x: -6, z: -28, h: 14 }, { x: 8, z: -38, h: 13 },
      { x: -5, z: -52, h: 16 }, { x: 6, z: -66, h: 15 },
      { x: -8, z: -80, h: 14 }, { x: 7, z: -95, h: 16 },
      { x: -4, z: -110, h: 15 }, { x: 5, z: -125, h: 17 }
    ];

    treePositions.forEach(pos => {
      this.createTree(pos.x, pos.z, pos.h);
    });

    // 3. Bushes (Stealth Zones)
    const bushPositions = [
      { x: -3, z: -8, r: 2.2 }, { x: 4, z: -22, r: 2.5 },
      { x: -5, z: -44, r: 2.8 }, { x: 3, z: -60, r: 2.4 },
      { x: -4, z: -88, r: 2.6 }, { x: 4, z: -105, r: 2.5 }
    ];
    bushPositions.forEach(b => this.createBush(b.x, b.z, b.r));

    // 4. Parkour Rocks & Boulders (Varying heights to jump between)
    const rockDefs = [
      { x: 3, y: 1.5, z: -6, sx: 3, sy: 3, sz: 3 },
      { x: -4, y: 2.2, z: -20, sx: 4, sy: 4.4, sz: 4 },
      { x: 4, y: 3.0, z: -32, sx: 4.5, sy: 6, sz: 4.5 },
      { x: -3, y: 3.8, z: -46, sx: 5, sy: 7.6, sz: 5 },
      { x: 5, y: 4.5, z: -72, sx: 5, sy: 9, sz: 5 },
      { x: -4, y: 5.5, z: -100, sx: 6, sy: 11, sz: 6 },
      { x: 0, y: 6.5, z: -118, sx: 7, sy: 13, sz: 6 }
    ];
    rockDefs.forEach(r => this.createRock(r.x, r.y, r.z, r.sx, r.sy, r.sz));

    // 5. Concrete Walls & Gates (Parkour obstacles)
    this.createConcreteWall(-15, 4, -40, 10, 8, 2);
    this.createConcreteWall(15, 4, -40, 10, 8, 2);
    this.createConcreteWall(-12, 5, -85, 12, 10, 2);
    this.createConcreteWall(12, 5, -85, 12, 10, 2);

    // 6. Food Stands (Hotdogs / Snacks for Speed Boost!)
    this.createFoodStand(6, -12, 'HOTDOG KRAAM');
    this.createFoodStand(-6, -55, 'PRETZEL BAR');
    this.createFoodStand(7, -90, 'FRITATUUR BETON');

    // 7. Snacks items in world to collect
    const snackLocations = [
      { x: 0, y: 1.2, z: -10 },
      { x: 4, y: 6.5, z: -32 },
      { x: -6, y: 1.2, z: -55 },
      { x: 5, y: 9.5, z: -72 },
      { x: -4, y: 11.5, z: -100 }
    ];
    snackLocations.forEach((loc, i) => this.createSnack(loc.x, loc.y, loc.z, i));

    // 8. Archetype Enemies
    // A: Dierenvanger met Vangnet
    this.createEnemy(-4, -18, 'catcher', [-6, 6]);
    this.createEnemy(5, -48, 'catcher', [-4, 6]);
    // B: Beveiliger / Politie
    this.createEnemy(0, -38, 'police', [-3, 3]);
    this.createEnemy(0, -82, 'police', [-5, 5]);
    // C: Dierverzorger / Asielmedewerker
    this.createEnemy(-3, -70, 'keeper', [-5, 4]);
    this.createEnemy(4, -108, 'keeper', [-4, 4]);

    // 9. Scatter Animals (Duiven / Vogels die wegvliegen)
    for (let i = 0; i < 8; i++) {
      this.createBird((Math.random() - 0.5) * 14, -(15 + Math.random() * 90));
    }

    // 10. Finish Area: Concrete Lookout Tower + Golden Eucalyptus Tree!
    this.createFinishTower(0, -145);
  }

  createTree(x, z, height) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.7, 0.9, height, 10);
    const trunk = new THREE.Mesh(trunkGeo, this.toonMaterials.woodTrunk);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Branches / Canopies (Leaf Spheres)
    const leavesGeo = new THREE.SphereGeometry(3.5, 8, 8);
    const canopy = new THREE.Mesh(leavesGeo, this.toonMaterials.leavesGreen);
    canopy.position.y = height + 1.5;
    canopy.castShadow = true;
    treeGroup.add(canopy);

    // Extra side canopy for jumping
    const sideCanopy = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), this.toonMaterials.leavesGreen);
    sideCanopy.position.set(1.5, height - 1.0, 0);
    sideCanopy.castShadow = true;
    treeGroup.add(sideCanopy);

    treeGroup.position.set(x, 0, z);
    this.scene.add(treeGroup);

    this.trees.push({
      group: treeGroup,
      x: x,
      z: z,
      height: height,
      radius: 1.1
    });
  }

  createBush(x, z, radius) {
    const bushGroup = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(radius, 1);
    const bush = new THREE.Mesh(geo, this.toonMaterials.bushGreen);
    bush.position.y = radius * 0.7;
    bush.scale.set(1.2, 0.9, 1.2);
    bush.castShadow = true;
    bushGroup.add(bush);
    bushGroup.position.set(x, 0, z);
    this.scene.add(bushGroup);

    this.bushes.push({ x: x, z: z, radius: radius });
  }

  createRock(x, y, z, sx, sy, sz) {
    const geo = new THREE.DodecahedronGeometry(1, 1);
    const rock = new THREE.Mesh(geo, this.toonMaterials.rockGrey);
    rock.position.set(x, y, z);
    rock.scale.set(sx, sy, sz);
    rock.castShadow = true;
    rock.receiveShadow = true;
    this.scene.add(rock);

    this.rocks.push({
      x: x,
      y: y + sy * 0.85, // Top surface height
      z: z,
      radius: Math.max(sx, sz) * 0.8
    });
  }

  createConcreteWall(x, y, z, sx, sy, sz) {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const wall = new THREE.Mesh(geo, this.toonMaterials.wallConcrete);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);

    this.rocks.push({
      x: x,
      y: y + sy / 2,
      z: z,
      radius: Math.max(sx, sz) / 2
    });
  }

  createFoodStand(x, z, label) {
    const stand = new THREE.Group();
    // Counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.5, 2), this.toonMaterials.woodTrunk);
    counter.position.y = 0.75;
    counter.castShadow = true;
    stand.add(counter);

    // Awning roof (Red and White striped comic look)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 2.8), this.toonMaterials.stallRoofRed);
    roof.position.y = 2.8;
    stand.add(roof);

    // Vendor human figure
    const vendor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8), this.toonMaterials.enemySkin);
    vendor.position.set(0, 1.2, -0.5);
    stand.add(vendor);

    stand.position.set(x, 0, z);
    this.scene.add(stand);
  }

  createSnack(x, y, z, id) {
    const snackGroup = new THREE.Group();
    // Donut / Hotdog model
    const donut = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.15, 8, 16),
      new THREE.MeshToonMaterial({ color: 0xff69b4 })
    );
    donut.rotation.x = Math.PI / 2;
    snackGroup.add(donut);

    snackGroup.position.set(x, y, z);
    this.scene.add(snackGroup);
    this.snacks.push({ group: snackGroup, id: id, collected: false });
  }

  createEnemy(x, z, type, patrolRange) {
    const enemyGroup = new THREE.Group();
    let suitMat = this.toonMaterials.enemySuitBlue;
    if (type === 'keeper') suitMat = this.toonMaterials.enemySuitGreen;
    if (type === 'police') suitMat = new THREE.MeshToonMaterial({ color: 0x263238 });

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.3, 8), suitMat);
    body.position.y = 0.9;
    body.castShadow = true;
    enemyGroup.add(body);

    // Head & Cap
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), this.toonMaterials.enemySkin);
    head.position.y = 1.75;
    enemyGroup.add(head);

    // Tool: Net for catcher, Flashlight for Police, Box for Keeper
    if (type === 'catcher') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), this.toonMaterials.woodTrunk);
      pole.position.set(0.4, 1.2, 0.4);
      pole.rotation.x = 0.3;
      const net = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.05, 8, 12), this.toonMaterials.shadesBlack);
      net.position.set(0.4, 2.0, 0.7);
      enemyGroup.add(pole, net);
    }

    enemyGroup.position.set(x, 0, z);
    this.scene.add(enemyGroup);

    this.enemies.push({
      group: enemyGroup,
      type: type,
      baseX: x,
      baseZ: z,
      patrolMin: patrolRange[0],
      patrolMax: patrolRange[1],
      patrolSpeed: 1.8 + Math.random() * 0.8,
      direction: 1,
      alert: false
    });
  }

  createBird(x, z) {
    const bird = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 6),
      new THREE.MeshToonMaterial({ color: 0x546e7a })
    );
    bird.rotation.x = Math.PI / 2;
    bird.position.set(x, 0.2, z);
    this.scene.add(bird);
    this.birds.push({ mesh: bird, x: x, z: z, fled: false, flyVel: new THREE.Vector3() });
  }

  createFinishTower(x, z) {
    const tower = new THREE.Group();
    // Huge concrete parkour tower
    const towerGeo = new THREE.BoxGeometry(14, 20, 14);
    const towerMesh = new THREE.Mesh(towerGeo, this.toonMaterials.wallConcrete);
    towerMesh.position.y = 10;
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    tower.add(towerMesh);

    // Golden Eucalyptus Tree on the top!
    const goldenTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.0, 7, 8),
      this.toonMaterials.goldChain
    );
    goldenTrunk.position.y = 23.5;
    tower.add(goldenTrunk);

    const goldenCanopy = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 12, 12),
      this.toonMaterials.goldTree
    );
    goldenCanopy.position.y = 28;
    tower.add(goldenCanopy);

    tower.position.set(x, 0, z);
    this.scene.add(tower);

    this.finishArea = {
      x: x,
      z: z,
      targetY: 20.0,
      radius: 9.0
    };
  }

  /* --- INPUT & EVENT LISTENERS --- */
  setupEvents() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' && this.isPlaying) {
        this.handleJump();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer Lock & Mouse Look
    const startBtn = document.getElementById('btn-start');
    startBtn.addEventListener('click', () => {
      sfx.init();
      this.startGame();
      this.container.requestPointerLock();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.resetGame();
      this.container.requestPointerLock();
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.resetGame();
      this.container.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.container);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || !this.isPlaying) return;
      const sensitivity = 0.0028;
      this.mouse.yaw -= e.movementX * sensitivity;
      this.mouse.pitch -= e.movementY * sensitivity;
      // Clamp pitch so camera doesn't flip
      this.mouse.pitch = Math.max(-0.4, Math.min(0.9, this.mouse.pitch));
    });
  }

  startGame() {
    this.isPlaying = true;
    this.isGameOver = false;
    this.isVictory = false;
    this.startTime = Date.now();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    showComicPopup("START PARKOUR!");
  }

  resetGame() {
    this.player.position.set(0, 1.2, 0);
    this.playerVelocity.set(0, 0, 0);
    this.isClimbing = false;
    this.currentClimbTree = null;
    this.isStealth = false;
    this.sugarRushTimer = 0;
    this.snacksCollected = 0;
    document.getElementById('snacks-count').innerText = '0';
    this.snacks.forEach(s => {
      s.collected = false;
      s.group.visible = true;
    });
    this.startGame();
  }

  handleJump() {
    if (this.isClimbing) {
      // Tree-to-tree / outward catapult leap!
      this.isClimbing = false;
      this.currentClimbTree = null;
      const jumpDir = new THREE.Vector3(
        -Math.sin(this.mouse.yaw),
        0.8,
        -Math.cos(this.mouse.yaw)
      ).normalize();
      const leapPower = this.sugarRushTimer > 0 ? 18 : 13;
      this.playerVelocity.copy(jumpDir.multiplyScalar(leapPower));
      sfx.playJump();
      showComicPopup("LEAP!");
    } else if (this.isGrounded) {
      const jumpVel = this.sugarRushTimer > 0 ? 13 : 9.5;
      this.playerVelocity.y = jumpVel;
      this.isGrounded = false;
      sfx.playJump();
      showComicPopup("HOP!");
    }
  }

  /* --- MAIN GAME TICK --- */
  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isPlaying && !this.isGameOver && !this.isVictory) {
      this.updatePlayer(delta);
      this.updateStealthAndBushes();
      this.updateSnacks(delta);
      this.updateEnemies(delta);
      this.updateBirds(delta);
      this.updateHUD();
      this.checkWinCondition();
    }

    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  /* --- PLAYER MOVEMENT, CLIMBING & PHYSICS --- */
  updatePlayer(delta) {
    if (this.sugarRushTimer > 0) {
      this.sugarRushTimer -= delta;
      document.getElementById('rush-meter').style.width = `${(this.sugarRushTimer / 6) * 100}%`;
    }

    // Speed modifiers
    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    let moveSpeed = isSprinting ? 11 : 7;
    if (this.sugarRushTimer > 0) moveSpeed *= 1.45;
    if (this.isStealth) moveSpeed *= 0.85;

    // 1. Check Tree Proximity for Climbing
    let nearTree = null;
    for (const tree of this.trees) {
      const dx = this.player.position.x - tree.x;
      const dz = this.player.position.z - tree.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < tree.radius + 0.6 && this.player.position.y < tree.height + 2) {
        nearTree = tree;
        break;
      }
    }

    // If near tree and moving forward or climbing
    if (nearTree && (this.keys['KeyW'] || this.isClimbing)) {
      if (!this.isClimbing) {
        this.isClimbing = true;
        this.currentClimbTree = nearTree;
        showComicPopup("CLIMB!");
      }
    }

    if (this.isClimbing && this.currentClimbTree) {
      // Climbing Mode (Climb up & down tree trunk)
      let climbVel = 0;
      if (this.keys['KeyW']) climbVel = 5.5;
      if (this.keys['KeyS']) climbVel = -5.0;

      this.player.position.y += climbVel * delta;
      if (Math.abs(climbVel) > 0.1) sfx.playClimb();

      // Clamp to tree height
      if (this.player.position.y > this.currentClimbTree.height + 1.2) {
        this.player.position.y = this.currentClimbTree.height + 1.2;
      }
      if (this.player.position.y < 1.0) {
        this.isClimbing = false;
        this.currentClimbTree = null;
      }

      // Hug trunk facing outward
      const angle = Math.atan2(this.player.position.x - this.currentClimbTree.x, this.player.position.z - this.currentClimbTree.z);
      this.player.rotation.y = angle;
      this.playerVelocity.set(0, 0, 0);

      // Swing limbs while climbing
      this.leftArm.rotation.x = Math.sin(Date.now() * 0.015) * 0.8;
      this.rightArm.rotation.x = -Math.sin(Date.now() * 0.015) * 0.8;
      return;
    }

    // 2. Normal Ground & Airborne Movement
    const forward = new THREE.Vector3(-Math.sin(this.mouse.yaw), 0, -Math.cos(this.mouse.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.mouse.yaw), 0, -Math.sin(this.mouse.yaw)).normalize();
    const moveDir = new THREE.Vector3();

    if (this.keys['KeyW']) moveDir.add(forward);
    if (this.keys['KeyS']) moveDir.sub(forward);
    if (this.keys['KeyD']) moveDir.add(right);
    if (this.keys['KeyA']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.player.position.x += moveDir.x * moveSpeed * delta;
      this.player.position.z += moveDir.z * moveSpeed * delta;

      // Rotate koala smoothly toward walking direction
      const targetRotation = Math.atan2(moveDir.x, moveDir.z);
      this.player.rotation.y = targetRotation;

      // Arm & leg running animation
      const walkTime = Date.now() * (isSprinting ? 0.018 : 0.012);
      this.leftLeg.rotation.x = Math.sin(walkTime) * 0.7;
      this.rightLeg.rotation.x = -Math.sin(walkTime) * 0.7;
      this.leftArm.rotation.x = -Math.sin(walkTime) * 0.7;
      this.rightArm.rotation.x = Math.sin(walkTime) * 0.7;
    } else {
      // Idle pose
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // Gravity
    this.playerVelocity.y -= 22 * delta;
    this.player.position.y += this.playerVelocity.y * delta;

    // Platform & Rock collision check
    let surfaceHeight = 0.8;
    for (const rock of this.rocks) {
      const dx = this.player.position.x - rock.x;
      const dz = this.player.position.z - rock.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < rock.radius && this.player.position.y >= rock.y - 1.0) {
        if (rock.y > surfaceHeight) {
          surfaceHeight = rock.y;
        }
      }
    }

    // Ground check
    if (this.player.position.y <= surfaceHeight) {
      this.player.position.y = surfaceHeight;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  /* --- STEALTH & BUSH MECHANIC --- */
  updateStealthAndBushes() {
    let insideBush = false;
    for (const bush of this.bushes) {
      const dx = this.player.position.x - bush.x;
      const dz = this.player.position.z - bush.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bush.radius && this.player.position.y < 2.0) {
        insideBush = true;
        break;
      }
    }

    this.isStealth = insideBush;
    const stealthBadge = document.getElementById('stealth-indicator');
    const vignette = document.getElementById('bush-vignette');

    if (this.isStealth) {
      stealthBadge.innerText = 'VERBORGEN (STEALTH)';
      stealthBadge.className = 'badge badge-stealth';
      vignette.classList.remove('hidden');
    } else {
      stealthBadge.innerText = 'ZICHTBAAR';
      stealthBadge.className = 'badge badge-normal';
      vignette.classList.add('hidden');
    }
  }

  /* --- SNACKS & SPEED BOOST --- */
  updateSnacks(delta) {
    this.snacks.forEach(s => {
      if (s.collected) return;
      s.group.rotation.y += 2.0 * delta;
      const dist = this.player.position.distanceTo(s.group.position);
      if (dist < 1.4) {
        s.collected = true;
        s.group.visible = false;
        this.snacksCollected++;
        this.sugarRushTimer = 6.0; // 6 seconds turbo speed!
        document.getElementById('snacks-count').innerText = this.snacksCollected;
        sfx.playSnack();
        showComicPopup("SUGAR RUSH! 🌭");
      }
    });
  }

  /* --- ENEMY AI PATROLS & DETECTION --- */
  updateEnemies(delta) {
    let anyAlert = false;

    this.enemies.forEach(e => {
      // Patrol movement
      e.group.position.x += e.direction * e.patrolSpeed * delta;
      if (e.group.position.x > e.baseX + e.patrolMax) {
        e.direction = -1;
        e.group.rotation.y = Math.PI;
      } else if (e.group.position.x < e.baseX + e.patrolMin) {
        e.direction = 1;
        e.group.rotation.y = 0;
      }

      // Detection
      const dist = this.player.position.distanceTo(e.group.position);
      // If player is on the ground, not in stealth, and within detection radius
      if (!this.isStealth && dist < 7.5 && this.player.position.y < 3.0) {
        anyAlert = true;
        e.alert = true;
        // Chase player
        const toPlayer = new THREE.Vector3()
          .subVectors(this.player.position, e.group.position)
          .setY(0)
          .normalize();
        e.group.position.add(toPlayer.multiplyScalar(e.patrolSpeed * 1.35 * delta));
        e.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Caught by enemy!
        if (dist < 1.3) {
          this.triggerGameOver(e.type);
        }
      } else {
        e.alert = false;
      }
    });

    const alarmBox = document.getElementById('alarm-box');
    if (anyAlert) {
      alarmBox.classList.remove('hidden');
    } else {
      alarmBox.classList.add('hidden');
    }
  }

  /* --- SCATTER BIRDS --- */
  updateBirds(delta) {
    this.birds.forEach(b => {
      const dist = this.player.position.distanceTo(new THREE.Vector3(b.x, 0.5, b.z));
      if (dist < 5.0 && !b.fled) {
        b.fled = true;
        b.flyVel.set((Math.random() - 0.5) * 6, 8, -(Math.random() * 8 + 4));
        showComicPopup("WOOSH!");
      }
      if (b.fled) {
        b.mesh.position.addScaledVector(b.flyVel, delta);
      }
    });
  }

  /* --- 3RD PERSON CAMERA FOLLOW --- */
  updateCamera() {
    const dist = 4.2;
    const heightOffset = 1.6;

    // Calculate camera target and offset based on mouse pitch/yaw
    const cosPitch = Math.cos(this.mouse.pitch);
    const sinPitch = Math.sin(this.mouse.pitch);
    const camOffset = new THREE.Vector3(
      Math.sin(this.mouse.yaw) * dist * cosPitch,
      heightOffset + sinPitch * dist,
      Math.cos(this.mouse.yaw) * dist * cosPitch
    );

    const targetPos = this.player.position.clone().add(camOffset);
    this.camera.position.lerp(targetPos, 0.15);
    this.camera.lookAt(
      this.player.position.x,
      this.player.position.y + 0.9,
      this.player.position.z
    );
  }

  /* --- HUD: COMPASS & DISTANCE --- */
  updateHUD() {
    if (!this.finishArea) return;
    const dx = this.finishArea.x - this.player.position.x;
    const dz = this.finishArea.z - this.player.position.z;
    const dist = Math.round(Math.sqrt(dx * dx + dz * dz));
    document.getElementById('distance-display').innerText = `${dist}m`;

    // Angle from player heading to target
    const targetAngle = Math.atan2(dx, dz);
    const relativeAngle = targetAngle - this.mouse.yaw;
    const arrow = document.getElementById('compass-arrow');
    arrow.style.transform = `rotate(${relativeAngle * (180 / Math.PI)}deg)`;
  }

  /* --- WIN / LOSS CONDITIONS --- */
  triggerGameOver(enemyType) {
    this.isGameOver = true;
    sfx.playAlert();
    const reason = document.getElementById('gameover-reason');
    if (enemyType === 'catcher') {
      reason.innerText = 'De dierenvanger heeft zijn vangnet over je zonnebril gegooid!';
    } else if (enemyType === 'police') {
      reason.innerText = 'De politiebeveiliger heeft je aangehouden wegens illegaal parkouren!';
    } else {
      reason.innerText = 'De dierverzorger heeft je terug in het koalaperk gelokt!';
    }
    document.getElementById('gameover-screen').classList.remove('hidden');
    document.exitPointerLock();
  }

  checkWinCondition() {
    if (!this.finishArea) return;
    const dx = this.player.position.x - this.finishArea.x;
    const dz = this.player.position.z - this.finishArea.z;
    const dist2D = Math.sqrt(dx * dx + dz * dz);

    // Reached top of tower
    if (dist2D < this.finishArea.radius && this.player.position.y >= this.finishArea.targetY - 1.0) {
      this.isVictory = true;
      sfx.playWin();
      const elapsed = Math.round((Date.now() - this.startTime) / 1000);
      document.getElementById('victory-stats').innerHTML = `
        Tijd: <b>${elapsed} seconden</b><br>
        Snacks Gejat: <b>${this.snacksCollected}/${this.totalSnacks}</b>
      `;
      document.getElementById('victory-screen').classList.remove('hidden');
      document.exitPointerLock();
      showComicPopup("GEWONNEN! 🏆");
    }
  }
}

// Start Game on load
window.addEventListener('DOMContentLoaded', () => {
  new BetonproeverijGame();
});
