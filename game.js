// ===============================================================
//  斬 - Chanbara Online
//  3D Online Sword Fighting Game (Three.js + PeerJS)
// ===============================================================
import * as THREE from 'three';

// ---------------- Sword Definitions ----------------
const SWORDS = [
  {
    id: 'katana',
    name: '打刀',
    desc: '標準的な刀。\n攻守のバランスに優れる。',
    bladeLength: 1.05,
    bladeColor: 0xdfe6ec,
    guardColor: 0x222222,
    gripColor: 0x111111,
    reach: 1.55,
    damage: 22,
    speed: 1.0,
    heavyDamage: 38,
    heavySpeed: 0.62,
  },
  {
    id: 'tachi',
    name: '太刀',
    desc: '長く反りの強い刀。\n間合いは広いが少し重い。',
    bladeLength: 1.30,
    bladeColor: 0xe8eef3,
    guardColor: 0x3a2a18,
    gripColor: 0x2a1a0a,
    reach: 1.85,
    damage: 24,
    speed: 0.85,
    heavyDamage: 44,
    heavySpeed: 0.55,
  },
  {
    id: 'wakizashi',
    name: '脇差',
    desc: '短く軽快な刀。\n手数で押す素早さ。',
    bladeLength: 0.75,
    bladeColor: 0xdadfe4,
    guardColor: 0x551111,
    gripColor: 0x331010,
    reach: 1.25,
    damage: 16,
    speed: 1.35,
    heavyDamage: 28,
    heavySpeed: 0.85,
  },
  {
    id: 'nodachi',
    name: '野太刀',
    desc: '巨大な大太刀。\n一撃必殺だが鈍重。',
    bladeLength: 1.55,
    bladeColor: 0xc8d0d6,
    guardColor: 0x1c1c1c,
    gripColor: 0x0a0a0a,
    reach: 2.10,
    damage: 30,
    speed: 0.72,
    heavyDamage: 55,
    heavySpeed: 0.42,
  },
  {
    id: 'kogarasu',
    name: '小烏丸',
    desc: '銘刀。鋭く軽妙、\n一撃の冴えに優れる。',
    bladeLength: 1.10,
    bladeColor: 0xf0f4f8,
    guardColor: 0x8b6e2e,
    gripColor: 0x2a1f12,
    reach: 1.60,
    damage: 26,
    speed: 1.08,
    heavyDamage: 42,
    heavySpeed: 0.68,
  }
];

// ---------------- Game State ----------------
const STATE = {
  mode: null,            // 'ai' | 'host' | 'join' | 'practice'
  swordId: 'katana',
  enemySwordId: 'katana',
  playerName: '武芸者',
  enemyName: '相手',
  peer: null,
  conn: null,
  isHost: false,
  inGame: false,
  myScore: 0,
  enemyScore: 0,
  round: 1,
  maxRounds: 3, // first to 2 wins
};

// ---------------- Three.js setup ----------------
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb98a5e); // 落ち着いた夕方の和の色
scene.fog = new THREE.Fog(0xa07a52, 30, 90);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 200);

// Lights
const hemi = new THREE.HemisphereLight(0xfff1d6, 0x4a3826, 0.65);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd5a0, 1.1);
sun.position.set(15, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0005;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8aa0c0, 0.25);
fill.position.set(-10, 12, -8);
scene.add(fill);

// ---------------- Arena (Dojo style) ----------------
function buildArena() {
  // Ground (wooden floor planks pattern)
  const groundGeom = new THREE.PlaneGeometry(60, 60, 1, 1);
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = 1024; groundCanvas.height = 1024;
  const gctx = groundCanvas.getContext('2d');
  // base wood
  gctx.fillStyle = '#7a5a3a';
  gctx.fillRect(0,0,1024,1024);
  // planks
  for (let y=0; y<1024; y+=64) {
    const shade = 90 + (Math.random()*40)|0;
    gctx.fillStyle = `rgb(${shade+30},${shade},${shade-30})`;
    gctx.fillRect(0, y, 1024, 60);
    // grain
    for (let i=0;i<14;i++) {
      gctx.strokeStyle = `rgba(40,25,15,${0.05+Math.random()*0.08})`;
      gctx.lineWidth = 1;
      gctx.beginPath();
      gctx.moveTo(0, y + Math.random()*60);
      gctx.bezierCurveTo(300, y+Math.random()*60, 700, y+Math.random()*60, 1024, y+Math.random()*60);
      gctx.stroke();
    }
    // plank seam
    gctx.fillStyle = 'rgba(20,12,6,0.5)';
    gctx.fillRect(0, y+60, 1024, 4);
  }
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(4,4);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.85, metalness: 0.05 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Combat ring (circular tatami-like)
  const ringGeom = new THREE.CircleGeometry(9, 64);
  const ringCanvas = document.createElement('canvas');
  ringCanvas.width = ringCanvas.height = 512;
  const rctx = ringCanvas.getContext('2d');
  rctx.fillStyle = '#c8b07a';
  rctx.fillRect(0,0,512,512);
  // tatami weave pattern
  for (let i=0;i<512;i+=32) {
    rctx.fillStyle = `rgba(80,60,30,0.12)`;
    rctx.fillRect(i,0,1,512);
    rctx.fillRect(0,i,512,1);
  }
  for (let i=0;i<400;i++) {
    rctx.fillStyle = `rgba(70,50,25,${Math.random()*0.15})`;
    rctx.fillRect(Math.random()*512, Math.random()*512, 2, 1);
  }
  const ringTex = new THREE.CanvasTexture(ringCanvas);
  ringTex.colorSpace = THREE.SRGBColorSpace;
  const ringMat = new THREE.MeshStandardMaterial({ map: ringTex, roughness: 0.9 });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.01;
  ring.receiveShadow = true;
  scene.add(ring);

  // Red border circle
  const borderGeom = new THREE.RingGeometry(8.9, 9.1, 64);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0x8b2e2e, side: THREE.DoubleSide });
  const border = new THREE.Mesh(borderGeom, borderMat);
  border.rotation.x = -Math.PI/2;
  border.position.y = 0.02;
  scene.add(border);

  // 4 wooden pillars around
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.8 });
  for (let i=0;i<4;i++) {
    const a = (i/4)*Math.PI*2 + Math.PI/4;
    const px = Math.cos(a)*13, pz = Math.sin(a)*13;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 0.5), pillarMat);
    pillar.position.set(px, 4, pz);
    pillar.castShadow = true;
    scene.add(pillar);
  }

  // Distant mountains (silhouette)
  for (let i=0; i<10; i++) {
    const a = (i/10)*Math.PI*2;
    const r = 55 + Math.random()*5;
    const h = 6 + Math.random()*4;
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(8, h, 4),
      new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 })
    );
    mountain.position.set(Math.cos(a)*r, h/2-1, Math.sin(a)*r);
    mountain.rotation.y = Math.random()*Math.PI;
    scene.add(mountain);
  }

  // Lanterns (subtle warm)
  for (let i=0;i<4;i++) {
    const a = (i/4)*Math.PI*2 + Math.PI/4;
    const lx = Math.cos(a)*13, lz = Math.sin(a)*13;
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: 0xe8c070, emissive: 0xb08040, emissiveIntensity: 0.6, roughness: 0.6 })
    );
    lantern.position.set(lx, 7.5, lz);
    scene.add(lantern);
    const light = new THREE.PointLight(0xffb060, 0.4, 8, 2);
    light.position.set(lx, 7.4, lz);
    scene.add(light);
  }
}
buildArena();

// ---------------- Character ----------------
function buildSwordMesh(swordDef) {
  const group = new THREE.Group();
  // Grip
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: swordDef.gripColor, roughness: 0.9 })
  );
  grip.position.y = -0.14;
  grip.castShadow = true;
  group.add(grip);
  // Tsuba (guard)
  const tsuba = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.10, 0.025, 14),
    new THREE.MeshStandardMaterial({ color: swordDef.guardColor, roughness: 0.5, metalness: 0.4 })
  );
  tsuba.position.y = 0.0;
  tsuba.castShadow = true;
  group.add(tsuba);
  // Blade
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, swordDef.bladeLength, 0.012),
    new THREE.MeshStandardMaterial({ color: swordDef.bladeColor, roughness: 0.18, metalness: 0.85 })
  );
  blade.position.y = 0.025 + swordDef.bladeLength/2;
  blade.castShadow = true;
  group.add(blade);
  // tip
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.10, 4),
    blade.material
  );
  tip.position.y = 0.025 + swordDef.bladeLength + 0.05;
  tip.rotation.z = Math.PI;
  // We want the tip pointing forward (same direction as blade up)
  tip.position.y = 0.025 + swordDef.bladeLength + 0.05;
  tip.rotation.z = 0;
  tip.rotation.x = 0;
  group.add(tip);

  group.userData.bladeLength = swordDef.bladeLength;
  return group;
}

function buildCharacter(opts) {
  const { color, swordDef } = opts;
  const root = new THREE.Group();

  const skinColor = 0xdcb98a;
  const clothColor = color;
  const darkCloth = new THREE.Color(color).multiplyScalar(0.6).getHex();
  const beltColor = 0x2a1a0a;

  // Body (haori-like top)
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.3),
    new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.85 })
  );
  torso.position.y = 1.15;
  torso.castShadow = true;
  root.add(torso);

  // Belt
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.10, 0.32),
    new THREE.MeshStandardMaterial({ color: beltColor, roughness: 0.9 })
  );
  belt.position.y = 0.80;
  belt.castShadow = true;
  root.add(belt);

  // Hakama (pants)
  const hakama = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.42, 0.85, 10),
    new THREE.MeshStandardMaterial({ color: darkCloth, roughness: 0.9 })
  );
  hakama.position.y = 0.38;
  hakama.castShadow = true;
  root.add(hakama);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 })
  );
  head.position.y = 1.70;
  head.castShadow = true;
  root.add(head);

  // Hair (top knot 'chonmage')
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.20, 12, 8, 0, Math.PI*2, 0, Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0x141008, roughness: 0.95 })
  );
  hair.position.y = 1.78;
  hair.castShadow = true;
  root.add(hair);
  const knot = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x141008, roughness: 0.95 })
  );
  knot.position.set(0, 1.94, -0.05);
  root.add(knot);

  // Arms
  const armMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.85 });
  const armGeom = new THREE.BoxGeometry(0.16, 0.55, 0.16);
  const lArmPivot = new THREE.Group();
  lArmPivot.position.set(-0.32, 1.42, 0);
  const lArm = new THREE.Mesh(armGeom, armMat);
  lArm.position.y = -0.28;
  lArm.castShadow = true;
  lArmPivot.add(lArm);
  root.add(lArmPivot);

  const rArmPivot = new THREE.Group();
  rArmPivot.position.set(0.32, 1.42, 0);
  const rArm = new THREE.Mesh(armGeom, armMat);
  rArm.position.y = -0.28;
  rArm.castShadow = true;
  rArmPivot.add(rArm);
  root.add(rArmPivot);

  // Hands
  const handMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), handMat);
  lHand.position.y = -0.58;
  lArmPivot.add(lHand);
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), handMat);
  rHand.position.y = -0.58;
  rArmPivot.add(rHand);

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: darkCloth, roughness: 0.9 });
  const legGeom = new THREE.BoxGeometry(0.16, 0.6, 0.18);
  const lLegPivot = new THREE.Group();
  lLegPivot.position.set(-0.13, 0.62, 0);
  const lLeg = new THREE.Mesh(legGeom, legMat);
  lLeg.position.y = -0.3;
  lLeg.castShadow = true;
  lLegPivot.add(lLeg);
  root.add(lLegPivot);

  const rLegPivot = new THREE.Group();
  rLegPivot.position.set(0.13, 0.62, 0);
  const rLeg = new THREE.Mesh(legGeom, legMat);
  rLeg.position.y = -0.3;
  rLeg.castShadow = true;
  rLegPivot.add(rLeg);
  root.add(rLegPivot);

  // Sword attached to right hand
  const swordPivot = new THREE.Group();
  swordPivot.position.set(0, -0.62, 0);
  const sword = buildSwordMesh(swordDef);
  // The sword's local Y axis points along the blade. Tilt it forward by default.
  swordPivot.add(sword);
  rArmPivot.add(swordPivot);

  // store animation references
  root.userData = {
    parts: { torso, hakama, head, hair, lArmPivot, rArmPivot, lLegPivot, rLegPivot, swordPivot, sword, lHand, rHand },
    swordDef
  };

  // Stance: arms relaxed downward, sword carried at side
  lArmPivot.rotation.x = 0.05;
  rArmPivot.rotation.x = 0.05;
  swordPivot.rotation.x = -0.25; // sword tilted slightly back
  sword.rotation.x = -0.1;

  return root;
}

// ---------------- Combatants ----------------
class Fighter {
  constructor({ swordDef, color, isPlayer, name }) {
    this.swordDef = swordDef;
    this.mesh = buildCharacter({ color, swordDef });
    this.isPlayer = isPlayer;
    this.name = name;
    this.hp = 100;
    this.maxHp = 100;
    this.facing = isPlayer ? 0 : Math.PI; // radians
    this.velocity = new THREE.Vector3();
    this.position = this.mesh.position;
    this.state = 'idle'; // idle | attack | heavy | guard | dodge | hit | dead
    this.stateTime = 0;
    this.attackPhase = 0;     // 0..1 progress
    this.attackHitFrame = false;
    this.guardActive = false;
    this.dodgeDir = new THREE.Vector3();
    this.lastHitTime = 0;
    this.invulnUntil = 0;
    this.animClock = 0;
    this.cooldown = 0;
  }

  setStance(facing) {
    this.facing = facing;
    this.mesh.rotation.y = facing;
  }

  attack(type='light') {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge') return;
    if (this.cooldown > 0) return;
    this.state = type === 'heavy' ? 'heavy' : 'attack';
    this.stateTime = 0;
    this.attackPhase = 0;
    this.attackHitFrame = false;
  }

  guard(on) {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge') {
      this.guardActive = false;
      return;
    }
    this.guardActive = on;
    this.state = on ? 'guard' : 'idle';
  }

  dodge(dir) {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge') return;
    if (this.cooldown > 0) return;
    this.state = 'dodge';
    this.stateTime = 0;
    this.invulnUntil = performance.now() + 280;
    this.dodgeDir.copy(dir).normalize();
  }

  takeHit(damage, attacker) {
    if (this.state === 'dead') return false;
    if (performance.now() < this.invulnUntil) return false;
    // Guarded?
    if (this.guardActive && this.state === 'guard') {
      // Block: take 15% as chip damage
      this.hp = Math.max(0, this.hp - damage*0.15);
      onGuardSpark(this);
      return 'guard';
    }
    this.hp = Math.max(0, this.hp - damage);
    this.state = 'hit';
    this.stateTime = 0;
    this.invulnUntil = performance.now() + 200;
    if (this.hp <= 0) { this.state = 'dead'; this.stateTime = 0; }
    return true;
  }

  update(dt) {
    this.stateTime += dt;
    this.animClock += dt;
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);

    const p = this.mesh.userData.parts;

    // Reset arm/sword pose toward neutral
    const lerp = (a,b,t)=>a + (b-a)*t;
    let targetRArmX = 0.05;
    let targetLArmX = 0.05;
    let targetRArmY = 0.0;
    let targetSwordX = -0.25;
    let targetSwordZ = 0.0;
    let targetTorsoY = 0;

    // Walking bob
    const moving = (Math.abs(this.velocity.x) + Math.abs(this.velocity.z)) > 0.5;
    if (moving && this.state === 'idle') {
      const w = this.animClock * 8;
      p.lLegPivot.rotation.x = Math.sin(w)*0.5;
      p.rLegPivot.rotation.x = -Math.sin(w)*0.5;
      targetLArmX = 0.05 + Math.sin(w+Math.PI)*0.25;
      targetRArmX = 0.05 + Math.sin(w)*0.10;
    } else {
      p.lLegPivot.rotation.x = lerp(p.lLegPivot.rotation.x, 0, 0.2);
      p.rLegPivot.rotation.x = lerp(p.rLegPivot.rotation.x, 0, 0.2);
    }

    // States
    if (this.state === 'attack') {
      const dur = 0.45 / this.swordDef.speed;
      this.attackPhase = Math.min(1, this.stateTime / dur);
      // wind up (0-0.35), strike (0.35-0.6), recover (0.6-1.0)
      let armX, swordX;
      if (this.attackPhase < 0.35) {
        const t = this.attackPhase/0.35;
        armX = lerp(0.05, -2.2, t);
        swordX = lerp(-0.25, -1.2, t);
        targetTorsoY = lerp(0, -0.25, t);
      } else if (this.attackPhase < 0.6) {
        const t = (this.attackPhase-0.35)/0.25;
        armX = lerp(-2.2, 1.7, t);
        swordX = lerp(-1.2, 0.6, t);
        targetTorsoY = lerp(-0.25, 0.20, t);
        if (!this.attackHitFrame && t > 0.3) {
          this.attackHitFrame = true;
          tryHit(this, this.swordDef.damage);
        }
      } else {
        const t = (this.attackPhase-0.6)/0.4;
        armX = lerp(1.7, 0.05, t);
        swordX = lerp(0.6, -0.25, t);
        targetTorsoY = lerp(0.20, 0, t);
      }
      targetRArmX = armX;
      targetSwordX = swordX;
      if (this.attackPhase >= 1) {
        this.state = 'idle';
        this.cooldown = 0.15;
      }
    } else if (this.state === 'heavy') {
      const dur = 0.70 / this.swordDef.heavySpeed;
      this.attackPhase = Math.min(1, this.stateTime / dur);
      let armX, swordX;
      if (this.attackPhase < 0.45) {
        const t = this.attackPhase/0.45;
        armX = lerp(0.05, -2.6, t);
        swordX = lerp(-0.25, -1.5, t);
        targetTorsoY = lerp(0, -0.4, t);
      } else if (this.attackPhase < 0.68) {
        const t = (this.attackPhase-0.45)/0.23;
        armX = lerp(-2.6, 2.0, t);
        swordX = lerp(-1.5, 0.9, t);
        targetTorsoY = lerp(-0.4, 0.3, t);
        if (!this.attackHitFrame && t > 0.35) {
          this.attackHitFrame = true;
          tryHit(this, this.swordDef.heavyDamage);
        }
      } else {
        const t = (this.attackPhase-0.68)/0.32;
        armX = lerp(2.0, 0.05, t);
        swordX = lerp(0.9, -0.25, t);
        targetTorsoY = lerp(0.3, 0, t);
      }
      targetRArmX = armX;
      targetSwordX = swordX;
      if (this.attackPhase >= 1) {
        this.state = 'idle';
        this.cooldown = 0.30;
      }
    } else if (this.state === 'guard') {
      // Hold sword vertically in front
      targetRArmX = -1.1;
      targetLArmX = -1.0;
      targetSwordX = 1.0;
      targetSwordZ = 0.5;
    } else if (this.state === 'dodge') {
      const dur = 0.32;
      const t = Math.min(1, this.stateTime/dur);
      // quick side step
      const speed = (1 - t)*10;
      this.mesh.position.x += this.dodgeDir.x * speed * dt;
      this.mesh.position.z += this.dodgeDir.z * speed * dt;
      targetTorsoY = Math.sin(t*Math.PI)*0.15;
      if (t >= 1) { this.state = 'idle'; this.cooldown = 0.1; }
    } else if (this.state === 'hit') {
      const t = Math.min(1, this.stateTime/0.30);
      targetTorsoY = Math.sin(t*Math.PI)*-0.3;
      targetRArmX = lerp(0.05, 0.8, Math.sin(t*Math.PI));
      if (t >= 1) { this.state = 'idle'; this.cooldown = 0.1; }
    } else if (this.state === 'dead') {
      // fall over
      const t = Math.min(1, this.stateTime/0.8);
      this.mesh.rotation.x = lerp(0, -Math.PI/2, t);
      this.mesh.position.y = lerp(0, 0.3, t);
    }

    // Apply targets
    p.rArmPivot.rotation.x = lerp(p.rArmPivot.rotation.x, targetRArmX, 0.45);
    p.lArmPivot.rotation.x = lerp(p.lArmPivot.rotation.x, targetLArmX, 0.45);
    p.rArmPivot.rotation.y = lerp(p.rArmPivot.rotation.y, targetRArmY, 0.45);
    p.swordPivot.rotation.x = lerp(p.swordPivot.rotation.x, targetSwordX, 0.45);
    p.swordPivot.rotation.z = lerp(p.swordPivot.rotation.z, targetSwordZ, 0.45);
    p.torso.rotation.y = lerp(p.torso.rotation.y, targetTorsoY, 0.3);
    p.head.rotation.y = lerp(p.head.rotation.y, targetTorsoY*0.5, 0.3);
  }

  getBladeWorldEnds() {
    // Compute world positions of blade base & tip for hit detection
    const p = this.mesh.userData.parts;
    const sword = p.sword;
    const bladeLen = this.swordDef.bladeLength;
    const baseLocal = new THREE.Vector3(0, 0.025, 0);
    const tipLocal = new THREE.Vector3(0, 0.025 + bladeLen, 0);
    sword.updateWorldMatrix(true, false);
    const base = baseLocal.applyMatrix4(sword.matrixWorld);
    const tip  = tipLocal.applyMatrix4(sword.matrixWorld);
    return { base, tip };
  }

  getCenter() {
    return new THREE.Vector3(this.mesh.position.x, 1.0, this.mesh.position.z);
  }
}

// Spawn fighters
let player = null;
let enemy = null;

function spawnFighters(playerSwordId, enemySwordId) {
  if (player) scene.remove(player.mesh);
  if (enemy) scene.remove(enemy.mesh);

  const pDef = SWORDS.find(s => s.id === playerSwordId) || SWORDS[0];
  const eDef = SWORDS.find(s => s.id === enemySwordId) || SWORDS[0];
  player = new Fighter({ swordDef: pDef, color: 0x294b6d, isPlayer: true, name: STATE.playerName });
  enemy  = new Fighter({ swordDef: eDef, color: 0x6d2929, isPlayer: false, name: STATE.enemyName });

  player.mesh.position.set(0, 0, 3.5);
  enemy.mesh.position.set(0, 0, -3.5);
  player.setStance(0);
  enemy.setStance(Math.PI);
  player.hp = player.maxHp; enemy.hp = enemy.maxHp;
  scene.add(player.mesh);
  scene.add(enemy.mesh);
}

// ---------------- Hit detection ----------------
const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
function distancePointToSegment(p, a, b) {
  const ab = tmpVecA.copy(b).sub(a);
  const ap = tmpVecB.copy(p).sub(a);
  const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.lengthSq()));
  const proj = a.clone().add(ab.multiplyScalar(t));
  return p.distanceTo(proj);
}

function tryHit(attacker, damage) {
  const target = attacker === player ? enemy : player;
  if (!target || target.state === 'dead') return;
  const { base, tip } = attacker.getBladeWorldEnds();
  const targetCenter = target.getCenter();
  const d = distancePointToSegment(targetCenter, base, tip);
  if (d < 0.55) {
    const result = target.takeHit(damage, attacker);
    if (result === true) {
      onHitEffect(target.getCenter());
      if (target === player) flashScreen();
      showCenterMsg(damage >= 38 ? '一閃！' : '斬！', 500);
    } else if (result === 'guard') {
      onGuardSpark(target);
      showCenterMsg('受け', 250);
    }
    // Network: send hit confirmation as host
    if (STATE.conn && STATE.isHost) {
      sendNet({ t: 'hit', target: target===player?'host':'guest', dmg: damage, result });
    }
  }
}

// ---------------- VFX ----------------
const sparkPool = [];
function onGuardSpark(target) {
  const center = target.getCenter();
  for (let i=0; i<8; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffd070 })
    );
    s.position.copy(center).add(new THREE.Vector3((Math.random()-0.5)*0.6, 0.2+(Math.random()-0.5)*0.4, (Math.random()-0.5)*0.6));
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*4, 1+Math.random()*3, (Math.random()-0.5)*4), life: 0.4 };
    scene.add(s); sparkPool.push(s);
  }
}
function onHitEffect(center) {
  for (let i=0; i<14; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xc8351c })
    );
    s.position.copy(center);
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*5, Math.random()*4, (Math.random()-0.5)*5), life: 0.6 };
    scene.add(s); sparkPool.push(s);
  }
}
function updateSparks(dt) {
  for (let i=sparkPool.length-1; i>=0; i--) {
    const s = sparkPool[i];
    s.userData.life -= dt;
    if (s.userData.life <= 0) { scene.remove(s); sparkPool.splice(i,1); continue; }
    s.userData.v.y -= 9.8*dt;
    s.position.addScaledVector(s.userData.v, dt);
    s.material.opacity = Math.max(0, s.userData.life*2);
    s.material.transparent = true;
  }
}

// Slash trail
const trailLines = [];
function addSlashTrail(fighter) {
  const ends = fighter.getBladeWorldEnds();
  const points = [ends.base.clone(), ends.tip.clone()];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xefe6d4, transparent: true, opacity: 0.6 });
  const line = new THREE.Line(geom, mat);
  line.userData = { life: 0.18 };
  scene.add(line);
  trailLines.push(line);
}
function updateTrails(dt) {
  for (let i=trailLines.length-1; i>=0; i--) {
    const l = trailLines[i];
    l.userData.life -= dt;
    l.material.opacity = Math.max(0, l.userData.life*3);
    if (l.userData.life <= 0) {
      scene.remove(l); trailLines.splice(i,1);
    }
  }
}

// ---------------- Camera (3rd person, behind player) ----------------
const camState = {
  yaw: 0,
  pitch: 0.18,
  distance: 4.5,
  height: 2.0,
  lookHeight: 1.4,
};
function updateCamera() {
  if (!player) return;
  // Lock camera somewhat behind player. yaw is also player facing direction
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const yaw = camState.yaw;
  const pitch = camState.pitch;
  const dist = camState.distance;
  const camX = px - Math.sin(yaw)*Math.cos(pitch)*dist;
  const camZ = pz - Math.cos(yaw)*Math.cos(pitch)*dist;
  const camY = camState.height + Math.sin(pitch)*dist*0.5;
  camera.position.set(camX, camY, camZ);
  camera.lookAt(px, camState.lookHeight, pz);
}

// ---------------- Input ----------------
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

let mouseLocked = false;
canvas.addEventListener('click', () => {
  if (STATE.inGame && !mouseLocked) canvas.requestPointerLock();
});
document.addEventListener('pointerlockchange', () => {
  mouseLocked = (document.pointerLockElement === canvas);
});

window.addEventListener('mousemove', (e) => {
  if (!mouseLocked || !STATE.inGame) return;
  camState.yaw -= e.movementX * 0.0028;
  camState.pitch = Math.max(-0.1, Math.min(0.6, camState.pitch + e.movementY * 0.0022));
});

window.addEventListener('mousedown', (e) => {
  if (!STATE.inGame || !mouseLocked) return;
  if (e.button === 0) {
    const heavy = keys['ShiftLeft'] || keys['ShiftRight'];
    if (heavy) {
      player.attack('heavy');
      sendNet({ t: 'act', a: 'heavy' });
    } else {
      player.attack('light');
      sendNet({ t: 'act', a: 'light' });
    }
    addSlashTrail(player);
  } else if (e.button === 2) {
    player.guard(true);
    sendNet({ t: 'act', a: 'guard', v: true });
  }
});
window.addEventListener('mouseup', (e) => {
  if (!STATE.inGame) return;
  if (e.button === 2) {
    player.guard(false);
    sendNet({ t: 'act', a: 'guard', v: false });
  }
});
window.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (!STATE.inGame) return;
  if (e.code === 'Space') {
    // dodge in current movement direction (default: backwards)
    const dir = getMoveDirVector();
    if (dir.lengthSq() < 0.01) dir.set(-Math.sin(camState.yaw), 0, -Math.cos(camState.yaw));
    player.dodge(dir);
    sendNet({ t: 'act', a: 'dodge', dx: dir.x, dz: dir.z });
  } else if (e.code === 'Escape') {
    exitToMenu();
  }
});

function getMoveDirVector() {
  const dir = new THREE.Vector3();
  const f = new THREE.Vector3(Math.sin(camState.yaw), 0, Math.cos(camState.yaw));
  const r = new THREE.Vector3(Math.cos(camState.yaw), 0, -Math.sin(camState.yaw));
  if (keys['KeyW']) dir.add(f);
  if (keys['KeyS']) dir.sub(f);
  if (keys['KeyA']) dir.sub(r);
  if (keys['KeyD']) dir.add(r);
  return dir;
}

// ---------------- AI ----------------
class AIController {
  constructor(self, target) {
    this.self = self;
    this.target = target;
    this.decisionTimer = 0;
    this.action = 'approach';
    this.actionTime = 0;
    this.reactionTimer = 0;
    this.aggression = 0.55 + Math.random()*0.25;
  }
  update(dt) {
    if (!this.self || !this.target || this.self.state === 'dead' || this.target.state === 'dead') return;
    this.decisionTimer -= dt;
    this.actionTime += dt;
    this.reactionTimer -= dt;

    // Always face target
    const dx = this.target.mesh.position.x - this.self.mesh.position.x;
    const dz = this.target.mesh.position.z - this.self.mesh.position.z;
    const desiredFacing = Math.atan2(dx, dz);
    // smooth face
    let diff = desiredFacing - this.self.facing;
    while (diff > Math.PI) diff -= Math.PI*2;
    while (diff < -Math.PI) diff += Math.PI*2;
    this.self.facing += diff * Math.min(1, dt*8);
    this.self.mesh.rotation.y = this.self.facing;

    const dist = Math.hypot(dx, dz);
    const reach = this.self.swordDef.reach;

    // React to opponent attack
    if ((this.target.state === 'attack' || this.target.state === 'heavy') && this.reactionTimer <= 0) {
      this.reactionTimer = 0.4 + Math.random()*0.4;
      if (Math.random() < 0.45 && dist < reach + 1.2) {
        // dodge
        const sideDir = new THREE.Vector3(Math.cos(this.self.facing), 0, -Math.sin(this.self.facing));
        if (Math.random()<0.5) sideDir.multiplyScalar(-1);
        this.self.dodge(sideDir);
        return;
      } else if (Math.random() < 0.5) {
        this.self.guard(true);
        setTimeout(()=>{ if (this.self.state==='guard') this.self.guard(false); }, 350);
      }
    }

    // Decide periodically
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.25 + Math.random()*0.35;

      if (dist > reach * 1.1) {
        this.action = 'approach';
      } else if (dist < reach * 0.6) {
        this.action = Math.random() < 0.3 ? 'retreat' : 'attack';
      } else {
        // in range
        if (Math.random() < this.aggression) {
          this.action = Math.random() < 0.18 ? 'heavy' : 'attack';
        } else {
          this.action = Math.random() < 0.4 ? 'circle' : 'guard_brief';
        }
      }
    }

    // Execute action
    if (this.self.state === 'idle' || this.self.state === 'guard') {
      const speed = 2.6;
      const fwd = new THREE.Vector3(Math.sin(this.self.facing), 0, Math.cos(this.self.facing));
      const right = new THREE.Vector3(Math.cos(this.self.facing), 0, -Math.sin(this.self.facing));
      if (this.action === 'approach') {
        if (this.self.state==='guard') this.self.guard(false);
        this.self.mesh.position.x += fwd.x*speed*dt;
        this.self.mesh.position.z += fwd.z*speed*dt;
        this.self.velocity.set(fwd.x*speed,0,fwd.z*speed);
      } else if (this.action === 'retreat') {
        if (this.self.state==='guard') this.self.guard(false);
        this.self.mesh.position.x -= fwd.x*speed*0.8*dt;
        this.self.mesh.position.z -= fwd.z*speed*0.8*dt;
        this.self.velocity.set(-fwd.x*speed,0,-fwd.z*speed);
      } else if (this.action === 'circle') {
        const side = (Math.sin(performance.now()/700) > 0) ? 1 : -1;
        this.self.mesh.position.x += right.x*speed*0.7*side*dt;
        this.self.mesh.position.z += right.z*speed*0.7*side*dt;
        this.self.velocity.set(right.x*speed*side,0,right.z*speed*side);
      } else if (this.action === 'attack') {
        this.self.guard(false);
        this.self.attack('light');
        addSlashTrail(this.self);
        this.action = 'recover';
      } else if (this.action === 'heavy') {
        this.self.guard(false);
        this.self.attack('heavy');
        addSlashTrail(this.self);
        this.action = 'recover';
      } else if (this.action === 'guard_brief') {
        this.self.guard(true);
        setTimeout(()=>{ if (this.self.state==='guard') this.self.guard(false); }, 300+Math.random()*300);
        this.action = 'recover';
      }
    }
  }
}
let ai = null;

// ---------------- Round management ----------------
let roundActive = false;
let roundStartTime = 0;

function startRound() {
  // Reset positions
  player.mesh.position.set(0, 0, 3.5);
  enemy.mesh.position.set(0, 0, -3.5);
  player.setStance(0);
  enemy.setStance(Math.PI);
  player.hp = player.maxHp; enemy.hp = enemy.maxHp;
  player.state = 'idle'; enemy.state = 'idle';
  player.mesh.rotation.x = 0; enemy.mesh.rotation.x = 0;
  camState.yaw = 0; camState.pitch = 0.18;
  updateHUD();
  document.getElementById('round-text').textContent = `第 ${['一','二','三','四','五'][STATE.round-1]||STATE.round} 番 勝負`;
  document.getElementById('score-text').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
  showCenterMsg('始め！', 800);
  roundActive = true;
  roundStartTime = performance.now();
}

function endRound(winnerIsPlayer) {
  if (!roundActive) return;
  roundActive = false;
  if (winnerIsPlayer) STATE.myScore++; else STATE.enemyScore++;
  showCenterMsg(winnerIsPlayer ? '勝！' : '敗！', 1400);
  setTimeout(() => {
    if (STATE.myScore >= 2 || STATE.enemyScore >= 2) {
      showResult();
    } else {
      STATE.round++;
      startRound();
    }
  }, 1800);
}

function showResult() {
  STATE.inGame = false;
  document.exitPointerLock?.();
  document.getElementById('hud').classList.add('hidden');
  const won = STATE.myScore > STATE.enemyScore;
  document.getElementById('result-title').textContent = won ? '勝' : '敗';
  document.getElementById('result-title').style.color = won ? '#8b2e2e' : '#3a2a18';
  document.getElementById('result-score').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
  document.getElementById('result').classList.remove('hidden');
}

function exitToMenu() {
  STATE.inGame = false;
  roundActive = false;
  STATE.myScore = 0; STATE.enemyScore = 0; STATE.round = 1;
  document.exitPointerLock?.();
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  if (STATE.conn) { try { STATE.conn.close(); } catch(e){} STATE.conn = null; }
  if (STATE.peer) { try { STATE.peer.destroy(); } catch(e){} STATE.peer = null; }
}

function updateHUD() {
  document.getElementById('hp-fill-l').style.width = `${(player.hp/player.maxHp)*100}%`;
  document.getElementById('hp-fill-r').style.width = `${(enemy.hp/enemy.maxHp)*100}%`;
  document.getElementById('hp-name-l').textContent = STATE.playerName;
  document.getElementById('hp-name-r').textContent = STATE.enemyName;
  document.getElementById('score-text').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
}

function showCenterMsg(text, ms=600) {
  const el = document.getElementById('center-msg');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(showCenterMsg._t);
  showCenterMsg._t = setTimeout(() => el.classList.remove('show'), ms);
}

function flashScreen() {
  let f = document.getElementById('hit-flash');
  if (!f) {
    f = document.createElement('div');
    f.id = 'hit-flash';
    document.body.appendChild(f);
  }
  f.classList.add('active');
  setTimeout(() => f.classList.remove('active'), 120);
}

// ---------------- Game start ----------------
function startGame(mode) {
  STATE.mode = mode;
  STATE.inGame = true;
  STATE.myScore = 0; STATE.enemyScore = 0; STATE.round = 1;
  spawnFighters(STATE.swordId, STATE.enemySwordId);
  if (mode === 'ai') {
    ai = new AIController(enemy, player);
  } else if (mode === 'practice') {
    ai = null;
  } else {
    ai = null;
  }
  hideAllOverlays();
  document.getElementById('hud').classList.remove('hidden');
  startRound();
}

function hideAllOverlays() {
  ['loading','menu','sword-select','room-join','room-host','result'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

// ---------------- Game Loop ----------------
let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime)/1000);
  lastTime = now;

  if (STATE.inGame && player && enemy) {
    // Player movement
    if (player.state === 'idle' || player.state === 'guard') {
      const dir = getMoveDirVector();
      const speed = (player.state === 'guard') ? 1.6 : 3.2;
      if (dir.lengthSq() > 0.01) {
        dir.normalize();
        player.mesh.position.x += dir.x * speed * dt;
        player.mesh.position.z += dir.z * speed * dt;
        player.velocity.set(dir.x*speed, 0, dir.z*speed);
        // face: rotate body towards camera-forward
        player.setStance(camState.yaw);
      } else {
        player.velocity.set(0,0,0);
      }
    }
    // Clamp to ring
    const px = player.mesh.position.x, pz = player.mesh.position.z;
    const d = Math.hypot(px, pz);
    if (d > 8.8) {
      player.mesh.position.x = px * 8.8/d;
      player.mesh.position.z = pz * 8.8/d;
    }
    const ex = enemy.mesh.position.x, ez = enemy.mesh.position.z;
    const ed = Math.hypot(ex, ez);
    if (ed > 8.8) {
      enemy.mesh.position.x = ex * 8.8/ed;
      enemy.mesh.position.z = ez * 8.8/ed;
    }

    // AI
    if (ai) ai.update(dt);

    // Remote control: if guest, send pose to host
    if (STATE.conn && !STATE.isHost && roundActive) {
      sendNet({ t: 'pose', x: player.mesh.position.x, z: player.mesh.position.z, f: player.facing });
    }

    player.update(dt);
    enemy.update(dt);
    updateHUD();

    // round end
    if (roundActive && (player.hp <= 0 || enemy.hp <= 0)) {
      endRound(enemy.hp <= 0);
    }

    updateCamera();
    updateSparks(dt);
    updateTrails(dt);
  } else {
    // Idle scene rotation for menu
    const t = performance.now()/1000;
    camera.position.set(Math.sin(t*0.1)*10, 5, Math.cos(t*0.1)*10);
    camera.lookAt(0, 1.2, 0);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

// Resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

// ===============================================================
//  UI Wiring
// ===============================================================
function setupSwordSelect() {
  const list = document.getElementById('sword-list');
  list.innerHTML = '';
  SWORDS.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'sword-card' + (s.id === STATE.swordId ? ' selected' : '');
    card.dataset.id = s.id;
    const dmgPct = Math.min(100, s.damage*2.5);
    const spdPct = Math.min(100, s.speed*60);
    const reachPct = Math.min(100, s.reach*40);
    card.innerHTML = `
      <div class="sword-name">${s.name}</div>
      <div class="sword-desc">${s.desc.replace(/\n/g,'<br>')}</div>
      <div class="sword-stats">
        <div class="stat-row"><span class="stat-label">威力</span><div class="stat-bar"><div class="stat-fill" style="width:${dmgPct}%"></div></div></div>
        <div class="stat-row"><span class="stat-label">速さ</span><div class="stat-bar"><div class="stat-fill" style="width:${spdPct}%"></div></div></div>
        <div class="stat-row"><span class="stat-label">間合</span><div class="stat-bar"><div class="stat-fill" style="width:${reachPct}%"></div></div></div>
      </div>
    `;
    card.addEventListener('click', () => {
      STATE.swordId = s.id;
      list.querySelectorAll('.sword-card').forEach(c => c.classList.toggle('selected', c.dataset.id===s.id));
    });
    list.appendChild(card);
  });
}

document.getElementById('sword-back').addEventListener('click', () => {
  document.getElementById('sword-select').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
});

document.getElementById('sword-confirm').addEventListener('click', () => {
  // Proceed based on mode
  document.getElementById('sword-select').classList.add('hidden');
  if (STATE.mode === 'ai') {
    // pick random AI sword
    STATE.enemySwordId = SWORDS[Math.floor(Math.random()*SWORDS.length)].id;
    STATE.enemyName = 'AI 武芸者';
    startGame('ai');
  } else if (STATE.mode === 'practice') {
    STATE.enemySwordId = STATE.swordId;
    STATE.enemyName = '案山子';
    startGame('practice');
  } else if (STATE.mode === 'host') {
    document.getElementById('room-host').classList.remove('hidden');
    hostRoom();
  } else if (STATE.mode === 'join') {
    document.getElementById('room-join').classList.remove('hidden');
  }
});

// Menu buttons
document.querySelectorAll('#menu .ink-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = document.getElementById('player-name').value.trim();
    STATE.playerName = name || '武芸者';
    STATE.mode = btn.dataset.mode;
    document.getElementById('menu').classList.add('hidden');
    setupSwordSelect();
    document.getElementById('sword-select').classList.remove('hidden');
  });
});

document.getElementById('join-back').addEventListener('click', () => {
  document.getElementById('room-join').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
});
document.getElementById('host-cancel').addEventListener('click', () => {
  document.getElementById('room-host').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  if (STATE.peer) { try { STATE.peer.destroy(); } catch(e){} STATE.peer = null; }
});
document.getElementById('join-confirm').addEventListener('click', () => {
  const code = document.getElementById('room-code-input').value.trim().toUpperCase();
  if (!code) return;
  joinRoom(code);
});
document.getElementById('copy-code').addEventListener('click', () => {
  const code = document.getElementById('host-code').textContent;
  navigator.clipboard?.writeText(code);
  document.getElementById('host-status').textContent = '合言葉を 写しました';
});

document.getElementById('result-rematch').addEventListener('click', () => {
  document.getElementById('result').classList.add('hidden');
  STATE.myScore = 0; STATE.enemyScore = 0; STATE.round = 1;
  startGame(STATE.mode);
});
document.getElementById('result-menu').addEventListener('click', () => {
  exitToMenu();
});

// ===============================================================
//  Networking (PeerJS)
// ===============================================================
function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i=0; i<5; i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

function hostRoom() {
  const code = makeCode();
  STATE.isHost = true;
  document.getElementById('host-code').textContent = code;
  document.getElementById('host-status').textContent = '相手の参加を 待っています...';
  const peerId = 'chanbara-' + code;
  if (STATE.peer) { try { STATE.peer.destroy(); } catch(e){} }
  STATE.peer = new Peer(peerId, { debug: 1 });
  STATE.peer.on('open', () => {
    document.getElementById('host-status').textContent = '部屋を開きました。合言葉を伝えてください。';
  });
  STATE.peer.on('error', (err) => {
    console.error(err);
    document.getElementById('host-status').textContent = 'エラー: ' + err.type;
  });
  STATE.peer.on('connection', (conn) => {
    STATE.conn = conn;
    conn.on('open', () => {
      // Send hello
      conn.send({ t: 'hello', name: STATE.playerName, sword: STATE.swordId });
    });
    conn.on('data', (data) => onNetData(data));
    conn.on('close', () => {
      showCenterMsg('相手が抜けました', 2000);
      setTimeout(exitToMenu, 1500);
    });
  });
}

function joinRoom(code) {
  STATE.isHost = false;
  document.getElementById('join-status').textContent = '接続中...';
  const peerId = 'chanbara-guest-' + Math.random().toString(36).slice(2,8);
  if (STATE.peer) { try { STATE.peer.destroy(); } catch(e){} }
  STATE.peer = new Peer(peerId, { debug: 1 });
  STATE.peer.on('open', () => {
    const conn = STATE.peer.connect('chanbara-' + code, { reliable: true });
    STATE.conn = conn;
    conn.on('open', () => {
      conn.send({ t: 'hello', name: STATE.playerName, sword: STATE.swordId });
      document.getElementById('join-status').textContent = '接続しました。開始を待っています...';
    });
    conn.on('data', (data) => onNetData(data));
    conn.on('close', () => {
      showCenterMsg('相手が抜けました', 2000);
      setTimeout(exitToMenu, 1500);
    });
    conn.on('error', (err) => {
      document.getElementById('join-status').textContent = 'エラー: ' + err;
    });
  });
  STATE.peer.on('error', (err) => {
    console.error(err);
    document.getElementById('join-status').textContent = '接続失敗: ' + err.type;
  });
}

function sendNet(msg) {
  if (STATE.conn && STATE.conn.open) {
    try { STATE.conn.send(msg); } catch(e){}
  }
}

function onNetData(data) {
  if (!data || !data.t) return;
  if (data.t === 'hello') {
    STATE.enemyName = data.name || '相手';
    STATE.enemySwordId = data.sword || 'katana';
    if (STATE.isHost) {
      // Reply with our info & start
      sendNet({ t: 'start', name: STATE.playerName, sword: STATE.swordId });
      document.getElementById('room-host').classList.add('hidden');
      startGame('online');
    }
  } else if (data.t === 'start') {
    STATE.enemyName = data.name || '相手';
    STATE.enemySwordId = data.sword || 'katana';
    document.getElementById('room-join').classList.add('hidden');
    startGame('online');
  } else if (data.t === 'pose' && STATE.isHost) {
    // Guest is the enemy on host's view
    if (enemy) {
      enemy.mesh.position.x = data.x;
      enemy.mesh.position.z = data.z;
      enemy.facing = data.f;
      enemy.mesh.rotation.y = data.f;
    }
  } else if (data.t === 'state' && !STATE.isHost) {
    // Host sends authoritative state to guest
    // On guest view, "player" is actually the guest, "enemy" is host.
    if (player && enemy) {
      // data.guest -> me (player), data.host -> enemy
      enemy.mesh.position.x = data.host.x;
      enemy.mesh.position.z = data.host.z;
      enemy.facing = data.host.f;
      enemy.mesh.rotation.y = data.host.f;
      enemy.hp = data.host.hp;
      player.hp = data.guest.hp;
      if (data.host.state && enemy.state !== data.host.state && (data.host.state==='attack'||data.host.state==='heavy')) {
        enemy.attack(data.host.state==='heavy'?'heavy':'light');
        addSlashTrail(enemy);
      }
      if (data.host.guard !== undefined) enemy.guard(data.host.guard);
    }
  } else if (data.t === 'act') {
    // Guest's action arrived to host
    if (STATE.isHost && enemy) {
      if (data.a === 'light') { enemy.attack('light'); addSlashTrail(enemy); }
      else if (data.a === 'heavy') { enemy.attack('heavy'); addSlashTrail(enemy); }
      else if (data.a === 'guard') { enemy.guard(!!data.v); }
      else if (data.a === 'dodge') { enemy.dodge(new THREE.Vector3(data.dx,0,data.dz)); }
    }
  } else if (data.t === 'hit' && !STATE.isHost) {
    // Host informs guest of hit result
    // already handled by state sync
  } else if (data.t === 'round') {
    // round result sync from host
    if (!STATE.isHost) {
      STATE.myScore = data.myScore;
      STATE.enemyScore = data.enemyScore;
      STATE.round = data.round;
      updateHUD();
      if (data.over) showResult();
    }
  }
}

// Host periodically sends state to guest
setInterval(() => {
  if (STATE.conn && STATE.isHost && STATE.inGame && player && enemy) {
    sendNet({
      t: 'state',
      host: { x: player.mesh.position.x, z: player.mesh.position.z, f: player.facing, hp: player.hp, state: player.state, guard: player.guardActive },
      guest:{ x: enemy.mesh.position.x, z: enemy.mesh.position.z, f: enemy.facing, hp: enemy.hp, state: enemy.state, guard: enemy.guardActive }
    });
  }
}, 50);

// Host sends round info
const origEndRound = endRound;
window.__endRoundOriginal = origEndRound;

// ---------------- Init ----------------
// Hide loading after a tick
setTimeout(() => {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
}, 400);
