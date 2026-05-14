// ===============================================================
//  斬 - Chanbara Online 改
//  3D Online Sword Fighting Game (Three.js + PeerJS)
//  -------------------------------------------------------------
//  - 人型ヒューマノイドキャラ
//  - マウスで刀を自由に振り回せる物理ベース剣戟
//  - 部位ダメージ・致命傷システム
//  - スタミナ・気合・必殺技
//  - アイテム（回復薬・煙幕・手裏剣・パワーアップ）
//  - 複数マップ（道場・桜庭・雪山・城下町）
//  - AI/オンライン/練習
// ===============================================================
import * as THREE from 'three';

// =================================================================
//  Sword Definitions
// =================================================================
const SWORDS = [
  {
    id: 'katana', name: '打刀',
    desc: '標準的な刀。\n攻守の均衡に優れる。',
    bladeLength: 1.05, bladeColor: 0xdfe6ec, guardColor: 0x222222, gripColor: 0x111111,
    reach: 1.65, damage: 22, speed: 1.0, heavyDamage: 38, heavySpeed: 0.62,
    stamCost: 14, kiGain: 12,
  },
  {
    id: 'tachi', name: '太刀',
    desc: '反りの強い長刀。\n間合いは広いが少し重い。',
    bladeLength: 1.30, bladeColor: 0xe8eef3, guardColor: 0x3a2a18, gripColor: 0x2a1a0a,
    reach: 1.95, damage: 24, speed: 0.85, heavyDamage: 44, heavySpeed: 0.55,
    stamCost: 18, kiGain: 14,
  },
  {
    id: 'wakizashi', name: '脇差',
    desc: '短く軽快。\n手数で押し切る。',
    bladeLength: 0.75, bladeColor: 0xdadfe4, guardColor: 0x551111, gripColor: 0x331010,
    reach: 1.30, damage: 16, speed: 1.40, heavyDamage: 28, heavySpeed: 0.95,
    stamCost: 9, kiGain: 9,
  },
  {
    id: 'nodachi', name: '野太刀',
    desc: '巨大な大太刀。\n一撃必殺、ただし鈍重。',
    bladeLength: 1.55, bladeColor: 0xc8d0d6, guardColor: 0x1c1c1c, gripColor: 0x0a0a0a,
    reach: 2.20, damage: 30, speed: 0.70, heavyDamage: 58, heavySpeed: 0.40,
    stamCost: 26, kiGain: 18,
  },
  {
    id: 'kogarasu', name: '小烏丸',
    desc: '銘刀。鋭く軽妙、\n一閃の冴え。',
    bladeLength: 1.10, bladeColor: 0xf0f4f8, guardColor: 0x8b6e2e, gripColor: 0x2a1f12,
    reach: 1.70, damage: 26, speed: 1.08, heavyDamage: 42, heavySpeed: 0.68,
    stamCost: 15, kiGain: 14,
  },
  {
    id: 'murasame', name: '村雨',
    desc: '水を呼ぶ妖刀。\n会心の確率が高い。',
    bladeLength: 1.10, bladeColor: 0xa8d8e8, guardColor: 0x1c4060, gripColor: 0x0a2030,
    reach: 1.70, damage: 24, speed: 1.05, heavyDamage: 40, heavySpeed: 0.65,
    stamCost: 14, kiGain: 13, crit: 0.30,
  },
  {
    id: 'kusanagi', name: '草薙',
    desc: '神話の霊剣。\n必殺技で雷を呼ぶ。',
    bladeLength: 1.20, bladeColor: 0xfff4c8, guardColor: 0xb08a3e, gripColor: 0x3a2818,
    reach: 1.80, damage: 28, speed: 0.95, heavyDamage: 50, heavySpeed: 0.55,
    stamCost: 18, kiGain: 20, special: 'thunder',
  },
];

// =================================================================
//  Map Definitions
// =================================================================
const MAPS = [
  { id: 'dojo',    name: '道場',     desc: '静謐なる修練の場。\n標準フィールド。',           sky: 0x2a1a14, fog: [0x2a1a14, 30, 90], floor: 'wood',  weather: 'none'   },
  { id: 'sakura',  name: '桜庭',     desc: '舞い散る花弁の中で。\n春爛漫の戦い。',           sky: 0xf6c0c8, fog: [0xf6c0c8, 30, 95], floor: 'stone', weather: 'sakura' },
  { id: 'snow',    name: '雪山',     desc: '吹雪く銀世界。\n足取りはやや鈍る。',             sky: 0xb8c8d8, fog: [0xb8c8d8, 18, 60], floor: 'snow',  weather: 'snow', moveMult: 0.85 },
  { id: 'castle',  name: '城下町',   desc: '夜半の天守の影。\n篝火が朱に染める。',           sky: 0x141022, fog: [0x141022, 25, 80], floor: 'tile',  weather: 'embers' },
  { id: 'bamboo',  name: '竹林',     desc: '青き竹の囁き。\n緑陰の幽玄なる立合い。',         sky: 0x244018, fog: [0x244018, 22, 75], floor: 'moss',  weather: 'leaves' },
  { id: 'beach',   name: '夕陽の浜', desc: '波音が響く黄昏。\n砂浜は踏ん張りが効かぬ。',     sky: 0xc06030, fog: [0xc06030, 35,100], floor: 'sand',  weather: 'none', moveMult: 0.92 },
];

// =================================================================
//  Item Definitions
// =================================================================
const ITEMS = [
  { id: 'potion',   name: '回復薬',  icon: '薬', desc: '体力を 40 回復',          color: 0xd23030 },
  { id: 'smoke',    name: '煙玉',    icon: '煙', desc: '視界を遮り 緊急回避',     color: 0x666666 },
  { id: 'shuriken', name: '手裏剣',  icon: '撃', desc: '遠距離飛び道具',          color: 0x404040 },
  { id: 'kiboost',  name: '気合丹',  icon: '丹', desc: '気合ゲージを満タンに',    color: 0xd3b54a },
];

// =================================================================
//  Game State
// =================================================================
const STATE = {
  mode: null,            // 'ai' | 'host' | 'join' | 'practice'
  swordId: 'katana',
  enemySwordId: 'katana',
  mapId: 'dojo',
  enemyMapId: null,
  playerName: '武芸者',
  enemyName: '相手',
  peer: null,
  conn: null,
  isHost: false,
  inGame: false,
  myScore: 0,
  enemyScore: 0,
  round: 1,
  maxRounds: 3,
  hits: 0,
  crits: 0,
  blocks: 0,
};

// =================================================================
//  Three.js setup
// =================================================================
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
scene.background = new THREE.Color(0xb98a5e);
scene.fog = new THREE.Fog(0xa07a52, 30, 90);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 250);

// 動的ライト（マップごとに作り直す）
let hemi, sun, fill;

function setupLights(skyColor=0xfff1d6, groundColor=0x4a3826, sunColor=0xffd5a0, sunIntensity=1.1) {
  if (hemi) scene.remove(hemi);
  if (sun) scene.remove(sun);
  if (fill) scene.remove(fill);
  hemi = new THREE.HemisphereLight(skyColor, groundColor, 0.7);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(sunColor, sunIntensity);
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
  fill = new THREE.DirectionalLight(0x8aa0c0, 0.25);
  fill.position.set(-10, 12, -8);
  scene.add(fill);
}
setupLights();

// =================================================================
//  Arena Builders
// =================================================================
const arenaGroup = new THREE.Group();
scene.add(arenaGroup);
const weatherGroup = new THREE.Group();
scene.add(weatherGroup);

function clearGroup(g) {
  while (g.children.length) {
    const c = g.children.pop();
    c.traverse?.(o => { o.geometry?.dispose?.(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m=>m.dispose?.()); else o.material.dispose?.(); } });
  }
}

function makeFloorTexture(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  if (kind === 'wood') {
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(0,0,1024,1024);
    for (let y=0; y<1024; y+=64) {
      const sh = 90 + (Math.random()*40)|0;
      ctx.fillStyle = `rgb(${sh+30},${sh},${sh-30})`;
      ctx.fillRect(0,y,1024,60);
      for (let i=0;i<14;i++) {
        ctx.strokeStyle = `rgba(40,25,15,${0.05+Math.random()*0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y+Math.random()*60);
        ctx.bezierCurveTo(300, y+Math.random()*60, 700, y+Math.random()*60, 1024, y+Math.random()*60);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(20,12,6,0.5)'; ctx.fillRect(0,y+60,1024,4);
    }
  } else if (kind === 'stone') {
    ctx.fillStyle = '#7a7060'; ctx.fillRect(0,0,1024,1024);
    for (let i=0;i<60;i++) {
      const x=Math.random()*1024, y=Math.random()*1024, r=20+Math.random()*60;
      ctx.fillStyle = `rgba(${90+Math.random()*40|0},${80+Math.random()*30|0},${70+Math.random()*30|0},0.7)`;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    for (let i=0;i<500;i++) {
      ctx.fillStyle = `rgba(40,30,20,${Math.random()*0.2})`;
      ctx.fillRect(Math.random()*1024,Math.random()*1024,2,2);
    }
  } else if (kind === 'snow') {
    ctx.fillStyle = '#e8eef4'; ctx.fillRect(0,0,1024,1024);
    for (let i=0;i<2000;i++) {
      ctx.fillStyle = `rgba(${180+Math.random()*60|0},${190+Math.random()*60|0},${210+Math.random()*40|0},${Math.random()*0.6})`;
      ctx.fillRect(Math.random()*1024,Math.random()*1024,3,3);
    }
    for (let i=0;i<20;i++) {
      ctx.strokeStyle = `rgba(150,170,190,${0.1+Math.random()*0.15})`;
      ctx.lineWidth = 2+Math.random()*4;
      ctx.beginPath();
      ctx.moveTo(0,Math.random()*1024);
      ctx.bezierCurveTo(300,Math.random()*1024,700,Math.random()*1024,1024,Math.random()*1024);
      ctx.stroke();
    }
  } else if (kind === 'tile') {
    ctx.fillStyle = '#2a2018'; ctx.fillRect(0,0,1024,1024);
    for (let y=0;y<1024;y+=128) for (let x=0;x<1024;x+=128) {
      ctx.fillStyle = `rgb(${40+Math.random()*15|0},${30+Math.random()*15|0},${25+Math.random()*15|0})`;
      ctx.fillRect(x+3,y+3,122,122);
    }
  } else if (kind === 'moss') {
    ctx.fillStyle = '#3a5028'; ctx.fillRect(0,0,1024,1024);
    for (let i=0;i<3000;i++) {
      ctx.fillStyle = `rgba(${40+Math.random()*40|0},${80+Math.random()*60|0},${30+Math.random()*40|0},${Math.random()*0.6})`;
      ctx.fillRect(Math.random()*1024,Math.random()*1024,3,3);
    }
  } else if (kind === 'sand') {
    ctx.fillStyle = '#d8b888'; ctx.fillRect(0,0,1024,1024);
    for (let i=0;i<3000;i++) {
      ctx.fillStyle = `rgba(${180+Math.random()*40|0},${150+Math.random()*40|0},${100+Math.random()*40|0},${Math.random()*0.5})`;
      ctx.fillRect(Math.random()*1024,Math.random()*1024,2,2);
    }
    for (let i=0;i<30;i++) {
      ctx.strokeStyle = `rgba(200,170,120,${0.1+Math.random()*0.15})`;
      ctx.lineWidth = 1+Math.random()*2;
      ctx.beginPath();
      ctx.moveTo(0,Math.random()*1024);
      ctx.bezierCurveTo(300,Math.random()*1024,700,Math.random()*1024,1024,Math.random()*1024);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#888'; ctx.fillRect(0,0,1024,1024);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4,4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildArena(mapDef) {
  clearGroup(arenaGroup);
  clearGroup(weatherGroup);

  // 空・霧の更新
  scene.background = new THREE.Color(mapDef.sky);
  scene.fog = new THREE.Fog(mapDef.fog[0], mapDef.fog[1], mapDef.fog[2]);

  // マップに応じてライトの色味を変える
  if (mapDef.id === 'dojo')   setupLights(0xfff1d6, 0x4a3826, 0xffd5a0, 1.1);
  if (mapDef.id === 'sakura') setupLights(0xffd0d8, 0x6b3848, 0xffe8e0, 1.0);
  if (mapDef.id === 'snow')   setupLights(0xc8d8e8, 0x607080, 0xeef4ff, 0.95);
  if (mapDef.id === 'castle') setupLights(0x303048, 0x1a1428, 0xff8040, 0.7);
  if (mapDef.id === 'bamboo') setupLights(0xb0d090, 0x304018, 0xe0f0c0, 1.0);
  if (mapDef.id === 'beach')  setupLights(0xffc090, 0x603020, 0xffa050, 1.15);

  // Ground
  const groundGeom = new THREE.PlaneGeometry(80, 80, 1, 1);
  const groundTex = makeFloorTexture(mapDef.floor);
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.85, metalness: 0.05 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  arenaGroup.add(ground);

  // Combat ring (circle)
  const ringRadius = 9;
  const ringGeom = new THREE.CircleGeometry(ringRadius, 64);
  const ringCanvas = document.createElement('canvas');
  ringCanvas.width = ringCanvas.height = 512;
  const rctx = ringCanvas.getContext('2d');
  // 床の色味に応じた円
  const ringBase = { dojo:'#c8b07a', sakura:'#e8c8a8', snow:'#d8e0e8', castle:'#403028', bamboo:'#506838', beach:'#e8c898' }[mapDef.id] || '#c8b07a';
  rctx.fillStyle = ringBase; rctx.fillRect(0,0,512,512);
  for (let i=0;i<512;i+=32) { rctx.fillStyle=`rgba(80,60,30,0.12)`; rctx.fillRect(i,0,1,512); rctx.fillRect(0,i,512,1); }
  for (let i=0;i<400;i++) { rctx.fillStyle=`rgba(70,50,25,${Math.random()*0.15})`; rctx.fillRect(Math.random()*512,Math.random()*512,2,1); }
  const ringTex = new THREE.CanvasTexture(ringCanvas);
  ringTex.colorSpace = THREE.SRGBColorSpace;
  const ringMat = new THREE.MeshStandardMaterial({ map: ringTex, roughness: 0.9 });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.01;
  ring.receiveShadow = true;
  arenaGroup.add(ring);

  // 朱の境界線
  const borderGeom = new THREE.RingGeometry(ringRadius - 0.1, ringRadius + 0.1, 64);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0x8b2e2e, side: THREE.DoubleSide });
  const border = new THREE.Mesh(borderGeom, borderMat);
  border.rotation.x = -Math.PI/2;
  border.position.y = 0.02;
  arenaGroup.add(border);

  // 中央紋
  const crestGeom = new THREE.RingGeometry(1.0, 1.15, 48);
  const crest = new THREE.Mesh(crestGeom, new THREE.MeshBasicMaterial({ color: 0x6b4423, side: THREE.DoubleSide, transparent: true, opacity: 0.45 }));
  crest.rotation.x = -Math.PI/2;
  crest.position.y = 0.025;
  arenaGroup.add(crest);

  // 4本の柱
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.8 });
  for (let i=0;i<4;i++) {
    const a = (i/4)*Math.PI*2 + Math.PI/4;
    const px = Math.cos(a)*13, pz = Math.sin(a)*13;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 0.5), pillarMat);
    pillar.position.set(px, 4, pz);
    pillar.castShadow = true;
    arenaGroup.add(pillar);

    // 屋根を支える梁
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.4), pillarMat);
    beam.position.set(px, 7.8, pz);
    beam.rotation.y = a;
    arenaGroup.add(beam);
  }

  // マップ別装飾
  if (mapDef.id === 'dojo') {
    // 提灯
    for (let i=0;i<4;i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4;
      const lx = Math.cos(a)*13, lz = Math.sin(a)*13;
      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.55, 12),
        new THREE.MeshStandardMaterial({ color: 0xe8c070, emissive: 0xb08040, emissiveIntensity: 0.7, roughness: 0.6 })
      );
      lantern.position.set(lx, 7.5, lz);
      arenaGroup.add(lantern);
      const light = new THREE.PointLight(0xffb060, 0.4, 10, 2);
      light.position.set(lx, 7.4, lz);
      arenaGroup.add(light);
    }
    // 遠景の山
    for (let i=0; i<10; i++) {
      const a = (i/10)*Math.PI*2; const r = 55 + Math.random()*5; const h = 6 + Math.random()*4;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(8, h, 4), new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }));
      mountain.position.set(Math.cos(a)*r, h/2-1, Math.sin(a)*r);
      mountain.rotation.y = Math.random()*Math.PI;
      arenaGroup.add(mountain);
    }
  } else if (mapDef.id === 'sakura') {
    // 桜の木
    for (let i=0;i<10;i++) {
      const a = (i/10)*Math.PI*2 + Math.random()*0.3;
      const r = 16 + Math.random()*8;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 5, 8), new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 }));
      trunk.position.set(Math.cos(a)*r, 2.5, Math.sin(a)*r);
      trunk.castShadow = true;
      arenaGroup.add(trunk);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(3+Math.random()*1.2, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffb8c8, roughness: 0.85 }));
      foliage.position.set(Math.cos(a)*r, 6, Math.sin(a)*r);
      foliage.castShadow = true;
      arenaGroup.add(foliage);
    }
  } else if (mapDef.id === 'snow') {
    // 雪を被った松
    for (let i=0;i<12;i++) {
      const a = (i/12)*Math.PI*2 + Math.random()*0.2;
      const r = 16 + Math.random()*10;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 4, 6), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 }));
      trunk.position.set(Math.cos(a)*r, 2, Math.sin(a)*r);
      arenaGroup.add(trunk);
      for (let k=0;k<3;k++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.0-k*0.4, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0xeef4ff, roughness: 0.95 }));
        cone.position.set(Math.cos(a)*r, 3.5+k*1.4, Math.sin(a)*r);
        cone.castShadow = true;
        arenaGroup.add(cone);
      }
    }
  } else if (mapDef.id === 'castle') {
    // 城（背景）
    const castleBase = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 12), new THREE.MeshStandardMaterial({ color: 0x504030, roughness: 0.9 }));
    castleBase.position.set(0, 3, -28);
    arenaGroup.add(castleBase);
    for (let k=0;k<3;k++) {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(8-k*1.5, 3, 4), new THREE.MeshStandardMaterial({ color: 0x2a1418, roughness: 0.9 }));
      roof.position.set(0, 7+k*3, -28);
      roof.rotation.y = Math.PI/4;
      arenaGroup.add(roof);
    }
    // 篝火
    for (let i=0;i<4;i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4;
      const fx = Math.cos(a)*11, fz = Math.sin(a)*11;
      const fire = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7028 }));
      fire.position.set(fx, 1.2, fz);
      arenaGroup.add(fire);
      const fl = new THREE.PointLight(0xff6020, 1.5, 14, 2);
      fl.position.set(fx, 1.4, fz);
      arenaGroup.add(fl);
      // 火の演出オブジェクトとして残す
      fire.userData.flicker = true;
    }
  } else if (mapDef.id === 'bamboo') {
    // 竹
    for (let i=0;i<30;i++) {
      const a = Math.random()*Math.PI*2;
      const r = 12 + Math.random()*14;
      const bambooMat = new THREE.MeshStandardMaterial({ color: 0x5a8038, roughness: 0.7 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 9, 8), bambooMat);
      trunk.position.set(Math.cos(a)*r, 4.5, Math.sin(a)*r);
      trunk.castShadow = true;
      arenaGroup.add(trunk);
      // 葉束
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), new THREE.MeshStandardMaterial({ color: 0x6ba040, roughness: 0.8 }));
      leaves.position.set(Math.cos(a)*r, 8.5, Math.sin(a)*r);
      arenaGroup.add(leaves);
    }
  } else if (mapDef.id === 'beach') {
    // 鳥居
    const torimat = new THREE.MeshStandardMaterial({ color: 0xb02828, roughness: 0.8 });
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,7,8), torimat);
    pole1.position.set(-3, 3.5, -16); arenaGroup.add(pole1);
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,7,8), torimat);
    pole2.position.set(3, 3.5, -16); arenaGroup.add(pole2);
    const top = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 0.5), torimat);
    top.position.set(0, 7, -16); arenaGroup.add(top);
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 0.5), torimat);
    top2.position.set(0, 6.4, -16); arenaGroup.add(top2);
    // 海
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshStandardMaterial({ color: 0x4878a0, roughness: 0.3, metalness: 0.4 }));
    sea.rotation.x = -Math.PI/2;
    sea.position.set(0, -0.1, -50);
    arenaGroup.add(sea);
  }

  // 天候パーティクル
  buildWeather(mapDef.weather);
}

// =================================================================
//  Weather Particles
// =================================================================
const weatherParticles = [];
function buildWeather(type) {
  weatherParticles.length = 0;
  if (!type || type === 'none') return;
  let count = 80;
  let color = 0xffffff;
  if (type === 'sakura') { count = 120; color = 0xff9bb4; }
  if (type === 'snow')   { count = 200; color = 0xffffff; }
  if (type === 'leaves') { count = 80;  color = 0x88c060; }
  if (type === 'embers') { count = 60;  color = 0xff7030; }
  for (let i=0;i<count;i++) {
    const size = type==='snow' ? 0.08 : (type==='embers'?0.05:0.10);
    const geom = type==='snow' ? new THREE.SphereGeometry(size, 5, 4) : new THREE.PlaneGeometry(size*1.6, size);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const p = new THREE.Mesh(geom, mat);
    p.position.set((Math.random()-0.5)*60, Math.random()*15+5, (Math.random()-0.5)*60);
    p.userData = {
      vy: -(0.4 + Math.random()*0.8) * (type==='snow'?0.7:1),
      vx: (Math.random()-0.5)*0.3,
      vz: (Math.random()-0.5)*0.3,
      spin: (Math.random()-0.5)*3,
      type,
    };
    weatherGroup.add(p);
    weatherParticles.push(p);
  }
}
function updateWeather(dt) {
  for (const p of weatherParticles) {
    p.position.y += p.userData.vy * dt * 4;
    p.position.x += p.userData.vx * dt * 2;
    p.position.z += p.userData.vz * dt * 2;
    p.rotation.z += p.userData.spin * dt;
    if (p.userData.type === 'embers') {
      p.position.y += dt*2; // 上昇
      p.material.opacity = Math.max(0, 0.8 - (p.position.y - 1)*0.05);
    }
    if (p.position.y < 0 || p.position.y > 25) {
      p.position.set((Math.random()-0.5)*60, p.userData.type==='embers' ? 0 : 18+Math.random()*4, (Math.random()-0.5)*60);
      if (p.userData.type === 'embers') p.material.opacity = 0.85;
    }
  }
}

// 初期マップ
buildArena(MAPS[0]);

// =================================================================
//  Sword Mesh
// =================================================================
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
    new THREE.MeshStandardMaterial({ color: swordDef.guardColor, roughness: 0.5, metalness: 0.5 })
  );
  tsuba.position.y = 0.0;
  tsuba.castShadow = true;
  group.add(tsuba);
  // Blade (slightly curved feel via thinner box)
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, swordDef.bladeLength, 0.012),
    new THREE.MeshStandardMaterial({
      color: swordDef.bladeColor, roughness: 0.18, metalness: 0.9,
      emissive: 0x000000, emissiveIntensity: 0,
    })
  );
  blade.position.y = 0.025 + swordDef.bladeLength/2;
  blade.castShadow = true;
  group.add(blade);
  // Blade edge highlight
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, swordDef.bladeLength*0.98, 0.013),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 })
  );
  edge.position.set(0.022, 0.025 + swordDef.bladeLength/2, 0);
  group.add(edge);
  // Tip
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.10, 6),
    blade.material
  );
  tip.position.y = 0.025 + swordDef.bladeLength + 0.05;
  group.add(tip);

  group.userData.bladeLength = swordDef.bladeLength;
  group.userData.blade = blade;
  return group;
}

// =================================================================
//  Humanoid Character Builder (より人間らしく)
// =================================================================
function buildCharacter(opts) {
  const { color, swordDef } = opts;
  const root = new THREE.Group();

  const skinColor = 0xe5c298;
  const clothColor = color;
  const darkCloth = new THREE.Color(color).multiplyScalar(0.55).getHex();
  const beltColor = 0x2a1a0a;

  // 上半身 (haori) — 台形シェイプを2分割でうまく
  const torsoMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.85 });
  const torsoLower = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.30, 0.40, 12), torsoMat);
  torsoLower.position.y = 1.05;
  torsoLower.castShadow = true;
  root.add(torsoLower);
  const torsoUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.32, 12), torsoMat);
  torsoUpper.position.y = 1.34;
  torsoUpper.castShadow = true;
  root.add(torsoUpper);

  // 肩当て (襟)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.04, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.7 }));
  collar.position.set(0, 1.55, 0);
  collar.rotation.x = Math.PI/2;
  root.add(collar);

  // 帯
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.10, 14), new THREE.MeshStandardMaterial({ color: beltColor, roughness: 0.9 }));
  belt.position.y = 0.83;
  belt.castShadow = true;
  root.add(belt);

  // 袴 (上が細く下が広い)
  const hakama = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.46, 0.80, 12), new THREE.MeshStandardMaterial({ color: darkCloth, roughness: 0.9 }));
  hakama.position.y = 0.40;
  hakama.castShadow = true;
  root.add(hakama);

  // 首
  const neckMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.10, 10), neckMat);
  neck.position.y = 1.58;
  root.add(neck);

  // 頭 (やや楕円)
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.74;
  root.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), neckMat);
  head.scale.set(1, 1.1, 1.05);
  head.castShadow = true;
  headGroup.add(head);

  // 目
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101010 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeMat);
  lEye.position.set(-0.055, 0.02, 0.15);
  headGroup.add(lEye);
  const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeMat);
  rEye.position.set(0.055, 0.02, 0.15);
  headGroup.add(rEye);
  // 眉
  const browMat = new THREE.MeshBasicMaterial({ color: 0x1a0c08 });
  const lBrow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.008, 0.005), browMat);
  lBrow.position.set(-0.055, 0.06, 0.15);
  lBrow.rotation.z = 0.15;
  headGroup.add(lBrow);
  const rBrow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.008, 0.005), browMat);
  rBrow.position.set(0.055, 0.06, 0.15);
  rBrow.rotation.z = -0.15;
  headGroup.add(rBrow);
  // 口
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.005), browMat);
  mouth.position.set(0, -0.05, 0.16);
  headGroup.add(mouth);

  // 髪 (頭頂)
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x141008, roughness: 0.95 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 10, 0, Math.PI*2, 0, Math.PI/1.9), hairMat);
  hair.position.set(0, 0.02, -0.005);
  hair.castShadow = true;
  headGroup.add(hair);
  // 髷
  const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.10, 8), hairMat);
  knot.position.set(0, 0.20, -0.04);
  knot.rotation.z = Math.PI/2;
  headGroup.add(knot);

  // 腕 (上腕＋前腕で関節)
  const armMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

  function buildArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side*0.36, 1.48, 0);
    // 上腕
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.32, 10), armMat);
    upperArm.position.y = -0.16;
    upperArm.castShadow = true;
    shoulder.add(upperArm);
    // 肘
    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    shoulder.add(elbow);
    // 前腕
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.30, 10), armMat);
    forearm.position.y = -0.15;
    forearm.castShadow = true;
    elbow.add(forearm);
    // 手
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat);
    hand.position.y = -0.32;
    hand.scale.set(0.85, 1, 0.7);
    hand.castShadow = true;
    elbow.add(hand);

    return { shoulder, elbow, upperArm, forearm, hand };
  }
  const lArm = buildArm(-1);
  const rArm = buildArm(1);
  root.add(lArm.shoulder);
  root.add(rArm.shoulder);

  // 脚 (太もも＋ふくらはぎ＋足袋)
  const legMat = new THREE.MeshStandardMaterial({ color: darkCloth, roughness: 0.9 });
  const sockMat = new THREE.MeshStandardMaterial({ color: 0xf0eadc, roughness: 0.7 });
  function buildLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side*0.14, 0.62, 0);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.085, 0.34, 10), legMat);
    thigh.position.y = -0.17;
    thigh.castShadow = true;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.34;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.32, 10), legMat);
    shin.position.y = -0.16;
    shin.castShadow = true;
    knee.add(shin);
    // 足袋
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.06, 0.22), sockMat);
    foot.position.set(0, -0.34, 0.04);
    foot.castShadow = true;
    knee.add(foot);
    return { hip, knee, thigh, shin, foot };
  }
  const lLeg = buildLeg(-1);
  const rLeg = buildLeg(1);
  root.add(lLeg.hip);
  root.add(rLeg.hip);

  // 刀 (右手に装備)
  const swordPivot = new THREE.Group();
  swordPivot.position.set(0, -0.32, 0);
  const sword = buildSwordMesh(swordDef);
  swordPivot.add(sword);
  rArm.elbow.add(swordPivot);

  // 鞘 (帯の左側に差す)
  const sayaGroup = new THREE.Group();
  sayaGroup.position.set(-0.32, 0.83, 0.08);
  sayaGroup.rotation.z = 0.2;
  sayaGroup.rotation.x = -0.1;
  const sayaLen = swordDef.bladeLength + 0.10;
  const saya = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, sayaLen, 10), new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: 0.7 }));
  saya.position.y = sayaLen/2;
  sayaGroup.add(saya);
  root.add(sayaGroup);

  root.userData = {
    parts: {
      torsoUpper, torsoLower, headGroup, hair,
      lShoulder: lArm.shoulder, lElbow: lArm.elbow, lHand: lArm.hand,
      rShoulder: rArm.shoulder, rElbow: rArm.elbow, rHand: rArm.hand,
      lHip: lLeg.hip, lKnee: lLeg.knee,
      rHip: rLeg.hip, rKnee: rLeg.knee,
      swordPivot, sword, saya: sayaGroup,
    },
    swordDef
  };

  // 初期姿勢: 構え
  lArm.shoulder.rotation.x = 0.1;
  lArm.shoulder.rotation.z = 0.15;
  lArm.elbow.rotation.x = -0.6;
  rArm.shoulder.rotation.x = -0.2;
  rArm.shoulder.rotation.z = -0.15;
  rArm.elbow.rotation.x = -1.0;
  // 刀を構える位置・角度
  swordPivot.rotation.x = -0.4;
  swordPivot.rotation.z = -0.2;

  return root;
}

// =================================================================
//  Fighter Class
// =================================================================
class Fighter {
  constructor({ swordDef, color, isPlayer, name }) {
    this.swordDef = swordDef;
    this.mesh = buildCharacter({ color, swordDef });
    this.isPlayer = isPlayer;
    this.name = name;
    this.hp = 100;
    this.maxHp = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.ki = 0;
    this.maxKi = 100;
    this.facing = isPlayer ? 0 : Math.PI;
    this.velocity = new THREE.Vector3();
    this.position = this.mesh.position;
    this.state = 'idle';
    this.stateTime = 0;
    this.attackPhase = 0;
    this.attackHitFrame = false;
    this.guardActive = false;
    this.dodgeDir = new THREE.Vector3();
    this.lastHitTime = 0;
    this.invulnUntil = 0;
    this.animClock = 0;
    this.cooldown = 0;
    this.swingYaw = 0;    // マウスで操作される刀の振り
    this.swingPitch = 0;
    this.swingPower = 0;  // 直近のスイング速度
    this.smokeUntil = 0;
    this.boostUntil = 0;
    this.lastDamageBy = '';
    this.specialUntil = 0;
    this.items = {};
    this.itemKey = 0;
  }

  setStance(facing) {
    this.facing = facing;
    this.mesh.rotation.y = facing;
  }

  attack(type='light') {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge' || this.state === 'dead') return false;
    if (this.cooldown > 0) return false;
    const cost = type === 'heavy' ? this.swordDef.stamCost * 1.7 : this.swordDef.stamCost;
    if (this.stamina < cost) return false;
    this.stamina -= cost;
    this.state = type === 'heavy' ? 'heavy' : 'attack';
    this.stateTime = 0;
    this.attackPhase = 0;
    this.attackHitFrame = false;
    return true;
  }

  guard(on) {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge' || this.state === 'dead') {
      this.guardActive = false;
      return;
    }
    this.guardActive = on;
    this.state = on ? 'guard' : 'idle';
  }

  dodge(dir) {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge' || this.state === 'dead') return false;
    if (this.cooldown > 0) return false;
    if (this.stamina < 22) return false;
    this.stamina -= 22;
    this.state = 'dodge';
    this.stateTime = 0;
    this.invulnUntil = performance.now() + 320;
    this.dodgeDir.copy(dir).normalize();
    return true;
  }

  special() {
    if (this.ki < this.maxKi) return false;
    if (this.state === 'dead') return false;
    this.ki = 0;
    this.state = 'heavy';
    this.stateTime = 0;
    this.attackPhase = 0;
    this.attackHitFrame = false;
    this.specialUntil = performance.now() + 700;
    return true;
  }

  takeHit(damage, attacker, opts={}) {
    if (this.state === 'dead') return false;
    if (performance.now() < this.invulnUntil) return 'miss';
    if (this.guardActive && this.state === 'guard') {
      // 強斬りなら受け崩し
      const isHeavy = opts.heavy;
      if (isHeavy && Math.random() < 0.55) {
        this.hp = Math.max(0, this.hp - damage*0.5);
        this.state = 'hit';
        this.stateTime = 0;
        return 'break';
      }
      this.hp = Math.max(0, this.hp - damage*0.12);
      this.stamina = Math.max(0, this.stamina - 12);
      return 'guard';
    }
    let dmg = damage;
    // クリティカル
    const critChance = (this.swordDef && attacker?.swordDef?.crit) || (attacker?.swordDef?.crit) || 0.10;
    let crit = false;
    if (Math.random() < (attacker?.swordDef?.crit || 0.10)) { dmg *= 1.7; crit = true; }
    if (opts.special) { dmg *= 1.4; crit = true; }
    if (attacker && performance.now() < attacker.boostUntil) dmg *= 1.35;
    this.hp = Math.max(0, this.hp - dmg);
    this.state = 'hit';
    this.stateTime = 0;
    this.invulnUntil = performance.now() + 230;
    this.ki = Math.min(this.maxKi, this.ki + 8);
    if (this.hp <= 0) { this.state = 'dead'; this.stateTime = 0; }
    return crit ? 'crit' : true;
  }

  update(dt) {
    this.stateTime += dt;
    this.animClock += dt;
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    // スタミナ回復
    if (this.state !== 'attack' && this.state !== 'heavy' && this.state !== 'dodge') {
      this.stamina = Math.min(this.maxStamina, this.stamina + 22*dt);
    }

    const p = this.mesh.userData.parts;
    const lerp = (a,b,t)=>a + (b-a)*t;

    // 目標角度
    let tRShoulderX = -0.2, tRShoulderZ = -0.15;
    let tLShoulderX = 0.10, tLShoulderZ = 0.15;
    let tRElbowX = -1.0, tLElbowX = -0.6;
    let tSwordX = -0.4, tSwordZ = -0.2, tSwordY = 0;
    let tTorsoY = 0, tTorsoX = 0;

    // 歩行
    const moving = (Math.abs(this.velocity.x) + Math.abs(this.velocity.z)) > 0.5;
    if (moving && (this.state === 'idle' || this.state === 'guard')) {
      const w = this.animClock * 9;
      p.lHip.rotation.x = Math.sin(w)*0.5;
      p.rHip.rotation.x = -Math.sin(w)*0.5;
      p.lKnee.rotation.x = Math.max(0, Math.sin(w)*0.4);
      p.rKnee.rotation.x = Math.max(0, -Math.sin(w)*0.4);
      tLShoulderX += Math.sin(w+Math.PI)*0.2;
      tRShoulderX += Math.sin(w)*0.05;
    } else {
      p.lHip.rotation.x = lerp(p.lHip.rotation.x, 0, 0.2);
      p.rHip.rotation.x = lerp(p.rHip.rotation.x, 0, 0.2);
      p.lKnee.rotation.x = lerp(p.lKnee.rotation.x, 0, 0.2);
      p.rKnee.rotation.x = lerp(p.rKnee.rotation.x, 0, 0.2);
    }

    if (this.state === 'attack') {
      const dur = 0.45 / this.swordDef.speed;
      this.attackPhase = Math.min(1, this.stateTime / dur);
      if (this.attackPhase < 0.32) {
        const t = this.attackPhase/0.32;
        tRShoulderX = lerp(-0.2, -2.4, t);
        tRElbowX   = lerp(-1.0, -2.0, t);
        tSwordX    = lerp(-0.4, -1.6, t);
        tTorsoY    = lerp(0, -0.3, t);
      } else if (this.attackPhase < 0.6) {
        const t = (this.attackPhase-0.32)/0.28;
        tRShoulderX = lerp(-2.4, 1.5, t);
        tRElbowX   = lerp(-2.0, -0.2, t);
        tSwordX    = lerp(-1.6, 0.7, t);
        tTorsoY    = lerp(-0.3, 0.25, t);
        if (!this.attackHitFrame && t > 0.25) {
          this.attackHitFrame = true;
          tryHit(this, this.swordDef.damage);
        }
      } else {
        const t = (this.attackPhase-0.6)/0.4;
        tRShoulderX = lerp(1.5, -0.2, t);
        tRElbowX   = lerp(-0.2, -1.0, t);
        tSwordX    = lerp(0.7, -0.4, t);
        tTorsoY    = lerp(0.25, 0, t);
      }
      if (this.attackPhase >= 1) { this.state = 'idle'; this.cooldown = 0.15; }
    } else if (this.state === 'heavy') {
      const dur = 0.72 / this.swordDef.heavySpeed;
      this.attackPhase = Math.min(1, this.stateTime / dur);
      const isSpecial = performance.now() < this.specialUntil;
      if (this.attackPhase < 0.42) {
        const t = this.attackPhase/0.42;
        tRShoulderX = lerp(-0.2, -2.8, t);
        tRElbowX   = lerp(-1.0, -2.4, t);
        tSwordX    = lerp(-0.4, -1.9, t);
        tTorsoY    = lerp(0, -0.5, t);
      } else if (this.attackPhase < 0.68) {
        const t = (this.attackPhase-0.42)/0.26;
        tRShoulderX = lerp(-2.8, 1.8, t);
        tRElbowX   = lerp(-2.4, 0.0, t);
        tSwordX    = lerp(-1.9, 1.0, t);
        tTorsoY    = lerp(-0.5, 0.35, t);
        if (!this.attackHitFrame && t > 0.3) {
          this.attackHitFrame = true;
          const dmg = this.swordDef.heavyDamage * (isSpecial ? 1.4 : 1.0);
          tryHit(this, dmg, { heavy: true, special: isSpecial });
          if (isSpecial && this.swordDef.special === 'thunder') {
            spawnThunder(this);
          }
        }
      } else {
        const t = (this.attackPhase-0.68)/0.32;
        tRShoulderX = lerp(1.8, -0.2, t);
        tRElbowX   = lerp(0.0, -1.0, t);
        tSwordX    = lerp(1.0, -0.4, t);
        tTorsoY    = lerp(0.35, 0, t);
      }
      if (this.attackPhase >= 1) { this.state = 'idle'; this.cooldown = 0.32; }
    } else if (this.state === 'guard') {
      // 両手で刀を立てる
      tRShoulderX = -1.4; tRShoulderZ = -0.6;
      tLShoulderX = -1.3; tLShoulderZ = 0.7;
      tRElbowX = -0.4;
      tLElbowX = -1.2;
      tSwordX = 1.2; tSwordZ = 0.5;
    } else if (this.state === 'dodge') {
      const dur = 0.32;
      const t = Math.min(1, this.stateTime/dur);
      const speed = (1 - t)*12;
      this.mesh.position.x += this.dodgeDir.x * speed * dt;
      this.mesh.position.z += this.dodgeDir.z * speed * dt;
      tTorsoX = Math.sin(t*Math.PI)*0.25;
      if (t >= 1) { this.state = 'idle'; this.cooldown = 0.1; }
    } else if (this.state === 'hit') {
      const t = Math.min(1, this.stateTime/0.30);
      tTorsoY = Math.sin(t*Math.PI)*-0.4;
      tRShoulderX = lerp(-0.2, 0.7, Math.sin(t*Math.PI));
      if (t >= 1) { this.state = 'idle'; this.cooldown = 0.1; }
    } else if (this.state === 'dead') {
      const t = Math.min(1, this.stateTime/0.8);
      this.mesh.rotation.x = lerp(0, -Math.PI/2.2, t);
      this.mesh.position.y = lerp(0, 0.2, t);
    } else {
      // idle - 待機時、ユーザーのマウス操作（swingYaw/Pitch）を反映
      if (this.isPlayer) {
        tRShoulderX = -0.2 + this.swingPitch * 1.4;
        tRShoulderZ = -0.15 + this.swingYaw * 0.7;
        tRElbowX = -1.0 + this.swingPitch * 0.4;
        tSwordX = -0.4 + this.swingPitch * 0.6;
        tSwordZ = -0.2 + this.swingYaw * 0.5;
      }
    }

    // Apply
    p.rShoulder.rotation.x = lerp(p.rShoulder.rotation.x, tRShoulderX, 0.4);
    p.rShoulder.rotation.z = lerp(p.rShoulder.rotation.z, tRShoulderZ, 0.4);
    p.lShoulder.rotation.x = lerp(p.lShoulder.rotation.x, tLShoulderX, 0.4);
    p.lShoulder.rotation.z = lerp(p.lShoulder.rotation.z, tLShoulderZ, 0.4);
    p.rElbow.rotation.x = lerp(p.rElbow.rotation.x, tRElbowX, 0.4);
    p.lElbow.rotation.x = lerp(p.lElbow.rotation.x, tLElbowX, 0.4);
    p.swordPivot.rotation.x = lerp(p.swordPivot.rotation.x, tSwordX, 0.45);
    p.swordPivot.rotation.z = lerp(p.swordPivot.rotation.z, tSwordZ, 0.45);
    p.swordPivot.rotation.y = lerp(p.swordPivot.rotation.y, tSwordY, 0.45);
    p.torsoUpper.rotation.y = lerp(p.torsoUpper.rotation.y, tTorsoY, 0.3);
    p.torsoUpper.rotation.x = lerp(p.torsoUpper.rotation.x, tTorsoX, 0.3);
    p.headGroup.rotation.y = lerp(p.headGroup.rotation.y, tTorsoY*0.5, 0.3);

    // 鞘の表示: 抜刀していたら隠す
    if (p.saya) p.saya.visible = true;
  }

  getBladeWorldEnds() {
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
    return new THREE.Vector3(this.mesh.position.x, 1.05, this.mesh.position.z);
  }

  getPartCenter(part) {
    // part: 'head' | 'torso' | 'legs'
    const y = part === 'head' ? 1.74 : part === 'torso' ? 1.15 : 0.45;
    return new THREE.Vector3(this.mesh.position.x, y, this.mesh.position.z);
  }
}

// =================================================================
//  Spawn / Combat helpers
// =================================================================
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
  // アイテム初期所持
  player.items = { potion: 2, smoke: 1, shuriken: 3, kiboost: 1 };
  enemy.items = { potion: 2, smoke: 1, shuriken: 2, kiboost: 1 };
  scene.add(player.mesh);
  scene.add(enemy.mesh);

  // HUD刀名・マップ名
  document.getElementById('sword-tag-l').textContent = pDef.name;
  document.getElementById('sword-tag-r').textContent = eDef.name;
  const mapDef = MAPS.find(m=>m.id===STATE.mapId) || MAPS[0];
  document.getElementById('map-tag').textContent = mapDef.name;
}

// =================================================================
//  Hit detection
// =================================================================
const tmpVecA = new THREE.Vector3();
const tmpVecB = new THREE.Vector3();
function distancePointToSegment(p, a, b) {
  const ab = tmpVecA.copy(b).sub(a);
  const ap = tmpVecB.copy(p).sub(a);
  const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.lengthSq()));
  const proj = a.clone().add(ab.multiplyScalar(t));
  return p.distanceTo(proj);
}

function tryHit(attacker, damage, opts={}) {
  const target = attacker === player ? enemy : player;
  if (!target || target.state === 'dead') return;
  if (performance.now() < target.smokeUntil && Math.random() < 0.5) return; // 煙幕回避
  const { base, tip } = attacker.getBladeWorldEnds();
  // 部位ごとに判定
  const parts = ['head', 'torso', 'legs'];
  let bestPart = null;
  let bestDist = 999;
  for (const pt of parts) {
    const c = target.getPartCenter(pt);
    const d = distancePointToSegment(c, base, tip);
    if (d < bestDist) { bestDist = d; bestPart = pt; }
  }
  if (bestDist < 0.6) {
    // 部位倍率
    let mult = 1.0;
    if (bestPart === 'head') mult = 1.8;
    if (bestPart === 'legs') mult = 0.75;
    const finalDmg = damage * mult;
    const result = target.takeHit(finalDmg, attacker, opts);
    if (result === true || result === 'crit') {
      STATE.hits++;
      if (result === 'crit') STATE.crits++;
      onHitEffect(target.getCenter(), result === 'crit');
      if (target === player) flashScreen();
      let label = '斬！';
      if (bestPart === 'head') label = '頭！';
      if (result === 'crit') label = opts.special ? '必殺！' : (bestPart==='head' ? '致命！' : '会心！');
      if (target.hp <= 0) label = '一閃！';
      showCenterMsg(label, 600);
      playSound('hit', result === 'crit' ? 1.5 : 1.0);
    } else if (result === 'guard') {
      STATE.blocks++;
      onGuardSpark(target);
      showCenterMsg('受け', 250);
      playSound('clang');
    } else if (result === 'break') {
      onHitEffect(target.getCenter(), false);
      showCenterMsg('受け崩し！', 500);
      playSound('clang', 1.2);
    }
    if (STATE.conn && STATE.isHost) {
      sendNet({ t: 'hit', target: target===player?'host':'guest', dmg: finalDmg, result, part: bestPart });
    }
  }
}

// =================================================================
//  VFX
// =================================================================
const sparkPool = [];
function onGuardSpark(target) {
  const center = target.getCenter();
  for (let i=0; i<10; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffd070 })
    );
    s.position.copy(center).add(new THREE.Vector3((Math.random()-0.5)*0.6, 0.2+(Math.random()-0.5)*0.4, (Math.random()-0.5)*0.6));
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*4, 1+Math.random()*3, (Math.random()-0.5)*4), life: 0.4 };
    scene.add(s); sparkPool.push(s);
  }
}
function onHitEffect(center, crit=false) {
  const color = crit ? 0xff5020 : 0xc8351c;
  for (let i=0; i<(crit?22:14); i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 5),
      new THREE.MeshBasicMaterial({ color })
    );
    s.position.copy(center);
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*6, Math.random()*5, (Math.random()-0.5)*6), life: 0.6 };
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
function addSlashTrail(fighter, big=false) {
  const ends = fighter.getBladeWorldEnds();
  const points = [ends.base.clone(), ends.tip.clone()];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: big ? 0xfff0a0 : 0xefe6d4, transparent: true, opacity: big? 0.9 : 0.7, linewidth: 2 });
  const line = new THREE.Line(geom, mat);
  line.userData = { life: big ? 0.30 : 0.18 };
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

// 雷
function spawnThunder(fighter) {
  const center = fighter.getCenter();
  const light = new THREE.PointLight(0xc8e0ff, 5, 30, 2);
  light.position.set(center.x, 8, center.z);
  scene.add(light);
  setTimeout(()=>{ scene.remove(light); }, 250);
  // 落雷ライン
  const points = [];
  let x = center.x, z = center.z;
  for (let y=15; y>=0; y-=0.6) {
    x += (Math.random()-0.5)*0.5;
    z += (Math.random()-0.5)*0.5;
    points.push(new THREE.Vector3(x, y, z));
  }
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xeef4ff, transparent: true, opacity: 1 });
  const line = new THREE.Line(geom, mat);
  line.userData = { life: 0.4 };
  scene.add(line);
  trailLines.push(line);
  playSound('thunder');
}

// =================================================================
//  Projectiles (手裏剣)
// =================================================================
const projectiles = [];
function spawnShuriken(owner, direction) {
  const geom = new THREE.OctahedronGeometry(0.12, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8, roughness: 0.3 });
  const m = new THREE.Mesh(geom, mat);
  m.position.copy(owner.getCenter()).add(direction.clone().multiplyScalar(0.6));
  m.position.y = 1.3;
  m.userData = { v: direction.clone().multiplyScalar(18), life: 1.5, owner };
  scene.add(m);
  projectiles.push(m);
  playSound('throw');
}
function updateProjectiles(dt) {
  for (let i=projectiles.length-1; i>=0; i--) {
    const p = projectiles[i];
    p.userData.life -= dt;
    if (p.userData.life <= 0) { scene.remove(p); projectiles.splice(i,1); continue; }
    p.position.addScaledVector(p.userData.v, dt);
    p.rotation.x += dt*20;
    p.rotation.y += dt*15;
    // 衝突判定
    const target = p.userData.owner === player ? enemy : player;
    if (target && target.state !== 'dead') {
      const d = p.position.distanceTo(target.getCenter());
      if (d < 0.6) {
        target.takeHit(14, p.userData.owner, {});
        onHitEffect(target.getCenter(), false);
        playSound('hit', 0.8);
        if (target === player) flashScreen();
        scene.remove(p);
        projectiles.splice(i,1);
        continue;
      }
    }
  }
}

// =================================================================
//  Sound (Web Audio synth)
// =================================================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioReady = false;
function ensureAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  audioReady = true;
}
function playSound(type, gain=1.0) {
  if (!audioReady) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  if (type === 'hit') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(160, now); o.frequency.exponentialRampToValueAtTime(40, now+0.15);
    g.gain.setValueAtTime(0.3*gain, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.18);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.2);
  } else if (type === 'clang') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(1800, now); o.frequency.exponentialRampToValueAtTime(800, now+0.12);
    g.gain.setValueAtTime(0.2*gain, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.22);
  } else if (type === 'swing') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(700, now); o.frequency.exponentialRampToValueAtTime(120, now+0.15);
    g.gain.setValueAtTime(0.15*gain, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.16);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.17);
  } else if (type === 'throw') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(900, now); o.frequency.exponentialRampToValueAtTime(200, now+0.2);
    g.gain.setValueAtTime(0.18, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.22);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.23);
  } else if (type === 'thunder') {
    const buf = ctx.createBuffer(1, ctx.sampleRate*0.6, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.6, now);
    src.connect(g).connect(ctx.destination); src.start(now);
  } else if (type === 'win') {
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f, now+i*0.12);
      g.gain.setValueAtTime(0, now+i*0.12); g.gain.linearRampToValueAtTime(0.18, now+i*0.12+0.01); g.gain.exponentialRampToValueAtTime(0.001, now+i*0.12+0.3);
      o.connect(g).connect(ctx.destination); o.start(now+i*0.12); o.stop(now+i*0.12+0.31);
    });
  } else if (type === 'lose') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(220, now); o.frequency.exponentialRampToValueAtTime(80, now+0.8);
    g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.9);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.95);
  } else if (type === 'item') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(660, now); o.frequency.exponentialRampToValueAtTime(1320, now+0.18);
    g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.22);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.23);
  } else if (type === 'start') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(80, now); o.frequency.linearRampToValueAtTime(800, now+0.3);
    g.gain.setValueAtTime(0.18, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.35);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.36);
  }
}

// =================================================================
//  Camera
// =================================================================
const camState = {
  yaw: 0,
  pitch: 0.18,
  distance: 5.0,
  height: 2.0,
  lookHeight: 1.4,
  shake: 0,
};
function updateCamera() {
  if (!player) return;
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const yaw = camState.yaw;
  const pitch = camState.pitch;
  const dist = camState.distance;
  const camX = px - Math.sin(yaw)*Math.cos(pitch)*dist;
  const camZ = pz - Math.cos(yaw)*Math.cos(pitch)*dist;
  const camY = camState.height + Math.sin(pitch)*dist*0.5;
  let sx=0, sy=0;
  if (camState.shake > 0) {
    sx = (Math.random()-0.5)*camState.shake;
    sy = (Math.random()-0.5)*camState.shake;
    camState.shake = Math.max(0, camState.shake - 0.06);
  }
  camera.position.set(camX+sx, camY+sy, camZ);
  camera.lookAt(px, camState.lookHeight, pz);
}

// =================================================================
//  Input
// =================================================================
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  ensureAudio();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

let mouseLocked = false;
canvas.addEventListener('click', () => {
  if (STATE.inGame && !mouseLocked) canvas.requestPointerLock();
  ensureAudio();
});
document.addEventListener('pointerlockchange', () => {
  mouseLocked = (document.pointerLockElement === canvas);
});

// マウスは「視点」と「刀のスイング」両方を司る。
//   - 通常移動：カメラ視点
//   - 左ボタン押下中：刀のスイングを直接操作（マウス動かしながら振る）
let leftHeld = false;
let lastSwingTime = 0;
let lastSwingMagnitude = 0;
let pendingSwing = null;
window.addEventListener('mousemove', (e) => {
  if (!mouseLocked || !STATE.inGame) return;
  if (leftHeld && player && player.state === 'idle') {
    // 刀をマウスで振る
    player.swingYaw   = Math.max(-1.2, Math.min(1.2, player.swingYaw + e.movementX * 0.006));
    player.swingPitch = Math.max(-1.0, Math.min(1.0, player.swingPitch + e.movementY * 0.006));
    const mag = Math.hypot(e.movementX, e.movementY);
    lastSwingMagnitude = lastSwingMagnitude*0.85 + mag*0.15;
    // 十分な勢いがあれば自動で斬る
    if (lastSwingMagnitude > 28 && performance.now() - lastSwingTime > 350) {
      lastSwingTime = performance.now();
      const heavy = (lastSwingMagnitude > 60) || keys['ShiftLeft'] || keys['ShiftRight'];
      if (player.attack(heavy?'heavy':'light')) {
        addSlashTrail(player, heavy);
        playSound('swing', heavy?1.4:1.0);
        sendNet({ t: 'act', a: heavy?'heavy':'light' });
      }
    }
  } else {
    camState.yaw -= e.movementX * 0.0028;
    camState.pitch = Math.max(-0.1, Math.min(0.6, camState.pitch + e.movementY * 0.0022));
  }
});

window.addEventListener('mousedown', (e) => {
  if (!STATE.inGame || !mouseLocked) return;
  ensureAudio();
  if (e.button === 0) {
    leftHeld = true;
    // 即斬撃も入る（押した瞬間に軽い斬撃）
    const heavy = keys['ShiftLeft'] || keys['ShiftRight'];
    if (player.attack(heavy?'heavy':'light')) {
      addSlashTrail(player, heavy);
      playSound('swing', heavy?1.4:1.0);
      sendNet({ t: 'act', a: heavy?'heavy':'light' });
    }
  } else if (e.button === 2) {
    player.guard(true);
    sendNet({ t: 'act', a: 'guard', v: true });
  }
});
window.addEventListener('mouseup', (e) => {
  if (!STATE.inGame) return;
  if (e.button === 0) {
    leftHeld = false;
    // スイング解除：少しずつ元に戻す
    player.swingYaw *= 0.3;
    player.swingPitch *= 0.3;
  }
  if (e.button === 2) {
    player.guard(false);
    sendNet({ t: 'act', a: 'guard', v: false });
  }
});
window.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', (e) => {
  if (!STATE.inGame) return;
  if (e.code === 'Space') {
    const dir = getMoveDirVector();
    if (dir.lengthSq() < 0.01) dir.set(-Math.sin(camState.yaw), 0, -Math.cos(camState.yaw));
    if (player.dodge(dir)) {
      sendNet({ t: 'act', a: 'dodge', dx: dir.x, dz: dir.z });
    }
  } else if (e.code === 'KeyQ') {
    // 必殺技
    if (player.special()) {
      addSlashTrail(player, true);
      playSound('swing', 1.6);
      camState.shake = 0.35;
      sendNet({ t: 'act', a: 'special' });
    }
  } else if (e.code === 'KeyE') {
    // アイテム使用
    useCurrentItem(player);
  } else if (e.code === 'Digit1') { player.itemKey = 0; updateItemBar(); }
  else if (e.code === 'Digit2') { player.itemKey = 1; updateItemBar(); }
  else if (e.code === 'Digit3') { player.itemKey = 2; updateItemBar(); }
  else if (e.code === 'Digit4') { player.itemKey = 3; updateItemBar(); }
  else if (e.code === 'Escape') {
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

// =================================================================
//  Item Bar
// =================================================================
function useCurrentItem(fighter) {
  const item = ITEMS[fighter.itemKey];
  if (!item) return;
  if (!fighter.items[item.id] || fighter.items[item.id] <= 0) {
    if (fighter === player) showCenterMsg('無し', 350);
    return;
  }
  fighter.items[item.id]--;
  if (item.id === 'potion') {
    fighter.hp = Math.min(fighter.maxHp, fighter.hp + 40);
    showCenterMsg('回復', 500);
    onItemEffect(fighter, 0x44d266);
  } else if (item.id === 'smoke') {
    fighter.smokeUntil = performance.now() + 2500;
    spawnSmoke(fighter);
    showCenterMsg('煙幕', 500);
  } else if (item.id === 'shuriken') {
    const dir = new THREE.Vector3(Math.sin(fighter.facing), 0, Math.cos(fighter.facing));
    spawnShuriken(fighter, dir);
    showCenterMsg('手裏剣', 350);
  } else if (item.id === 'kiboost') {
    fighter.ki = fighter.maxKi;
    fighter.boostUntil = performance.now() + 6000;
    onItemEffect(fighter, 0xd3b54a);
    showCenterMsg('気合充填', 500);
  }
  playSound('item');
  if (fighter === player) updateItemBar();
  sendNet({ t: 'item', id: item.id });
}

function onItemEffect(fighter, color) {
  const center = fighter.getCenter();
  for (let i=0;i<18;i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color }));
    s.position.copy(center).add(new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.8+0.5, (Math.random()-0.5)*0.6));
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*2, 1+Math.random()*3, (Math.random()-0.5)*2), life: 0.7 };
    scene.add(s); sparkPool.push(s);
  }
}

function spawnSmoke(fighter) {
  const center = fighter.getCenter();
  for (let i=0;i<30;i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.35+Math.random()*0.2, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0x707070, transparent: true, opacity: 0.7 }));
    s.position.copy(center).add(new THREE.Vector3((Math.random()-0.5)*1.2, Math.random()*1.5, (Math.random()-0.5)*1.2));
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*0.5, 0.3+Math.random()*0.5, (Math.random()-0.5)*0.5), life: 2.3 };
    scene.add(s); sparkPool.push(s);
  }
}

function updateItemBar() {
  const bar = document.getElementById('item-bar');
  if (!bar) return;
  bar.innerHTML = '';
  ITEMS.forEach((it, idx) => {
    const slot = document.createElement('div');
    slot.className = 'item-slot' + (player && player.itemKey === idx ? ' active' : '');
    const count = player ? (player.items[it.id]||0) : 0;
    slot.innerHTML = `<div class="item-key">${idx+1}</div><div class="item-icon">${it.icon}</div><div class="item-count">${count}</div><div style="font-size:9px;letter-spacing:0.1em;margin-top:2px;">${it.name}</div>`;
    bar.appendChild(slot);
  });
}

// =================================================================
//  AI
// =================================================================
class AIController {
  constructor(self, target) {
    this.self = self;
    this.target = target;
    this.decisionTimer = 0;
    this.action = 'approach';
    this.actionTime = 0;
    this.reactionTimer = 0;
    this.aggression = 0.55 + Math.random()*0.25;
    this.itemTimer = 4 + Math.random()*4;
  }
  update(dt) {
    if (!this.self || !this.target || this.self.state === 'dead' || this.target.state === 'dead') return;
    this.decisionTimer -= dt;
    this.actionTime += dt;
    this.reactionTimer -= dt;
    this.itemTimer -= dt;

    const dx = this.target.mesh.position.x - this.self.mesh.position.x;
    const dz = this.target.mesh.position.z - this.self.mesh.position.z;
    const desiredFacing = Math.atan2(dx, dz);
    let diff = desiredFacing - this.self.facing;
    while (diff > Math.PI) diff -= Math.PI*2;
    while (diff < -Math.PI) diff += Math.PI*2;
    this.self.facing += diff * Math.min(1, dt*8);
    this.self.mesh.rotation.y = this.self.facing;

    const dist = Math.hypot(dx, dz);
    const reach = this.self.swordDef.reach;

    // 反応
    if ((this.target.state === 'attack' || this.target.state === 'heavy') && this.reactionTimer <= 0) {
      this.reactionTimer = 0.4 + Math.random()*0.4;
      if (Math.random() < 0.50 && dist < reach + 1.4) {
        const sideDir = new THREE.Vector3(Math.cos(this.self.facing), 0, -Math.sin(this.self.facing));
        if (Math.random()<0.5) sideDir.multiplyScalar(-1);
        this.self.dodge(sideDir);
        return;
      } else if (Math.random() < 0.55) {
        this.self.guard(true);
        setTimeout(()=>{ if (this.self.state==='guard') this.self.guard(false); }, 380);
      }
    }

    // アイテム使用
    if (this.itemTimer <= 0) {
      this.itemTimer = 5 + Math.random()*5;
      if (this.self.hp < 40 && this.self.items.potion > 0) {
        this.self.itemKey = 0; useCurrentItem(this.self);
      } else if (this.self.ki >= this.self.maxKi*0.9 && this.self.items.kiboost === 0 && Math.random() < 0.5) {
        // 必殺
        if (dist < reach*1.1) {
          this.self.special();
          addSlashTrail(this.self, true);
        }
      } else if (Math.random() < 0.4 && this.self.items.shuriken > 0 && dist > 2.5) {
        this.self.itemKey = 2; useCurrentItem(this.self);
      } else if (this.self.ki < 50 && this.self.items.kiboost > 0 && Math.random() < 0.3) {
        this.self.itemKey = 3; useCurrentItem(this.self);
      }
    }

    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.25 + Math.random()*0.35;
      if (dist > reach * 1.1) this.action = 'approach';
      else if (dist < reach * 0.6) this.action = Math.random() < 0.3 ? 'retreat' : 'attack';
      else {
        if (Math.random() < this.aggression) this.action = Math.random() < 0.20 ? 'heavy' : 'attack';
        else this.action = Math.random() < 0.4 ? 'circle' : 'guard_brief';
      }
    }

    if (this.self.state === 'idle' || this.self.state === 'guard') {
      const speed = 2.8;
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
        if (this.self.attack('light')) { addSlashTrail(this.self); playSound('swing', 0.7); }
        this.action = 'recover';
      } else if (this.action === 'heavy') {
        this.self.guard(false);
        if (this.self.attack('heavy')) { addSlashTrail(this.self, true); playSound('swing', 0.9); }
        this.action = 'recover';
      } else if (this.action === 'guard_brief') {
        this.self.guard(true);
        setTimeout(()=>{ if (this.self.state==='guard') this.self.guard(false); }, 320+Math.random()*320);
        this.action = 'recover';
      }
    }
  }
}
let ai = null;

// =================================================================
//  Round management
// =================================================================
let roundActive = false;
let roundStartTime = 0;

function startRound() {
  player.mesh.position.set(0, 0, 3.5);
  enemy.mesh.position.set(0, 0, -3.5);
  player.setStance(0);
  enemy.setStance(Math.PI);
  player.hp = player.maxHp; enemy.hp = enemy.maxHp;
  player.state = 'idle'; enemy.state = 'idle';
  player.stamina = player.maxStamina; enemy.stamina = enemy.maxStamina;
  player.ki = 0; enemy.ki = 0;
  player.swingYaw = 0; player.swingPitch = 0;
  player.mesh.rotation.x = 0; enemy.mesh.rotation.x = 0;
  camState.yaw = 0; camState.pitch = 0.18;
  updateHUD();
  updateItemBar();
  document.getElementById('round-text').textContent = `第 ${['一','二','三','四','五'][STATE.round-1]||STATE.round} 番 勝負`;
  document.getElementById('score-text').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
  showCenterMsg('始め！', 800);
  playSound('start');
  roundActive = true;
  roundStartTime = performance.now();
}

function endRound(winnerIsPlayer) {
  if (!roundActive) return;
  roundActive = false;
  camState.shake = 0.5;
  if (winnerIsPlayer) STATE.myScore++; else STATE.enemyScore++;
  showCenterMsg(winnerIsPlayer ? '勝！' : '敗！', 1400);
  if (STATE.conn && STATE.isHost) {
    const over = STATE.myScore >= 2 || STATE.enemyScore >= 2;
    sendNet({ t: 'round', myScore: STATE.enemyScore, enemyScore: STATE.myScore, round: STATE.round+1, over });
  }
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
  const statsEl = document.getElementById('result-stats');
  statsEl.innerHTML = `斬撃命中 ${STATE.hits} ／ 会心 ${STATE.crits} ／ 受け ${STATE.blocks}`;
  document.getElementById('result').classList.remove('hidden');
  playSound(won ? 'win' : 'lose');
  const vg = document.getElementById('kill-vignette');
  if (vg) { vg.classList.remove('active'); }
}

function exitToMenu() {
  STATE.inGame = false;
  roundActive = false;
  STATE.myScore = 0; STATE.enemyScore = 0; STATE.round = 1;
  STATE.hits = 0; STATE.crits = 0; STATE.blocks = 0;
  document.exitPointerLock?.();
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('kill-vignette')?.classList.remove('active');
  if (STATE.conn) { try { STATE.conn.close(); } catch(e){} STATE.conn = null; }
  if (STATE.peer) { try { STATE.peer.destroy(); } catch(e){} STATE.peer = null; }
}

function updateHUD() {
  document.getElementById('hp-fill-l').style.width = `${(player.hp/player.maxHp)*100}%`;
  document.getElementById('hp-fill-r').style.width = `${(enemy.hp/enemy.maxHp)*100}%`;
  document.getElementById('hp-name-l').textContent = STATE.playerName;
  document.getElementById('hp-name-r').textContent = STATE.enemyName;
  document.getElementById('stam-fill-l').style.width = `${(player.stamina/player.maxStamina)*100}%`;
  document.getElementById('stam-fill-r').style.width = `${(enemy.stamina/enemy.maxStamina)*100}%`;
  document.getElementById('ki-fill-l').style.width = `${(player.ki/player.maxKi)*100}%`;
  document.getElementById('ki-fill-r').style.width = `${(enemy.ki/enemy.maxKi)*100}%`;
  document.getElementById('score-text').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
  // 致命傷ビネット (HP < 25%)
  const vg = document.getElementById('kill-vignette');
  if (vg) {
    if (player.hp/player.maxHp < 0.25 && player.hp > 0) vg.classList.add('active');
    else vg.classList.remove('active');
  }
}

function showCenterMsg(text, ms=600) {
  const el = document.getElementById('center-msg');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(showCenterMsg._t);
  showCenterMsg._t = setTimeout(() => el.classList.remove('show'), ms);
}

function flashScreen() {
  const f = document.getElementById('hit-flash');
  if (!f) return;
  f.classList.add('active');
  setTimeout(() => f.classList.remove('active'), 120);
  camState.shake = 0.25;
}

// =================================================================
//  Game start
// =================================================================
function startGame(mode) {
  STATE.mode = mode;
  STATE.inGame = true;
  STATE.myScore = 0; STATE.enemyScore = 0; STATE.round = 1;
  STATE.hits = 0; STATE.crits = 0; STATE.blocks = 0;
  // マップを構築
  const mapDef = MAPS.find(m=>m.id===STATE.mapId) || MAPS[0];
  buildArena(mapDef);
  spawnFighters(STATE.swordId, STATE.enemySwordId);
  if (mode === 'ai') {
    ai = new AIController(enemy, player);
  } else {
    ai = null;
  }
  hideAllOverlays();
  document.getElementById('hud').classList.remove('hidden');
  startRound();
}

function hideAllOverlays() {
  ['loading','menu','sword-select','map-select','room-join','room-host','result'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

// =================================================================
//  Game Loop
// =================================================================
let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime)/1000);
  lastTime = now;

  if (STATE.inGame && player && enemy) {
    // プレイヤー移動
    if (player.state === 'idle' || player.state === 'guard') {
      const dir = getMoveDirVector();
      const mapDef = MAPS.find(m=>m.id===STATE.mapId) || MAPS[0];
      const moveMult = mapDef.moveMult || 1.0;
      const baseSpeed = (player.state === 'guard') ? 1.6 : 3.4;
      const speed = baseSpeed * moveMult * (performance.now() < player.boostUntil ? 1.2 : 1.0);
      if (dir.lengthSq() > 0.01) {
        dir.normalize();
        player.mesh.position.x += dir.x * speed * dt;
        player.mesh.position.z += dir.z * speed * dt;
        player.velocity.set(dir.x*speed, 0, dir.z*speed);
        // 体の向き: 移動方向を加味しつつカメラ前方向に寄せる
        player.setStance(camState.yaw);
      } else {
        player.velocity.set(0,0,0);
        player.setStance(camState.yaw);
      }
    }
    // クランプ to ring
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
    // 体同士の重なり防止
    const between = Math.hypot(px-ex, pz-ez);
    if (between < 1.0 && between > 0.01) {
      const ox = (px-ex)/between, oz = (pz-ez)/between;
      const overlap = (1.0 - between) * 0.5;
      player.mesh.position.x += ox*overlap;
      player.mesh.position.z += oz*overlap;
      enemy.mesh.position.x -= ox*overlap;
      enemy.mesh.position.z -= oz*overlap;
    }

    if (ai) ai.update(dt);

    if (STATE.conn && !STATE.isHost && roundActive) {
      sendNet({ t: 'pose', x: player.mesh.position.x, z: player.mesh.position.z, f: player.facing });
    }

    player.update(dt);
    enemy.update(dt);
    updateHUD();

    // スイング減衰
    if (!leftHeld && player.state === 'idle') {
      player.swingYaw *= 0.92;
      player.swingPitch *= 0.92;
    }

    if (roundActive && (player.hp <= 0 || enemy.hp <= 0)) {
      endRound(enemy.hp <= 0);
    }

    updateCamera();
    updateSparks(dt);
    updateTrails(dt);
    updateProjectiles(dt);
    updateWeather(dt);
  } else {
    // メニュー時のカメラ回転
    const t = performance.now()/1000;
    camera.position.set(Math.sin(t*0.1)*10, 5, Math.cos(t*0.1)*10);
    camera.lookAt(0, 1.2, 0);
    updateWeather(dt);
  }

  // 照準は試合中だけ
  const ch = document.getElementById('crosshair');
  if (ch) ch.classList.toggle('hidden', !(STATE.inGame && mouseLocked));

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
});

// =================================================================
//  UI Wiring — Sword Select
// =================================================================
function setupSwordSelect() {
  const list = document.getElementById('sword-list');
  list.innerHTML = '';
  SWORDS.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'sword-card' + (s.id === STATE.swordId ? ' selected' : '');
    card.dataset.id = s.id;
    card.dataset.idx = idx;
    const dmgPct   = Math.min(100, s.damage*2.5);
    const spdPct   = Math.min(100, s.speed*60);
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
    card.addEventListener('click', () => selectSword(s.id));
    card.addEventListener('dblclick', () => { selectSword(s.id); confirmSword(); });
    list.appendChild(card);
  });
  updateSwordCurrentLabel();
}
function selectSword(id) {
  STATE.swordId = id;
  document.querySelectorAll('#sword-list .sword-card').forEach(c => c.classList.toggle('selected', c.dataset.id===id));
  updateSwordCurrentLabel();
}
function updateSwordCurrentLabel() {
  const sw = SWORDS.find(s => s.id === STATE.swordId);
  const el = document.getElementById('sword-current-name');
  if (el && sw) el.textContent = sw.name;
}
function confirmSword() {
  document.getElementById('sword-select').classList.add('hidden');
  // モード別の次画面
  if (STATE.mode === 'ai' || STATE.mode === 'practice') {
    // マップ選択へ
    setupMapSelect();
    document.getElementById('map-select').classList.remove('hidden');
  } else if (STATE.mode === 'host') {
    document.getElementById('room-host').classList.remove('hidden');
    hostRoom();
  } else if (STATE.mode === 'join') {
    document.getElementById('room-join').classList.remove('hidden');
  }
}
document.getElementById('sword-back').addEventListener('click', () => {
  document.getElementById('sword-select').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
});
document.getElementById('sword-confirm').addEventListener('click', confirmSword);

// キーボード操作: 矢印 + Enter
document.addEventListener('keydown', (e) => {
  const ss = document.getElementById('sword-select');
  const ms = document.getElementById('map-select');
  if (ss && !ss.classList.contains('hidden')) {
    const idx = SWORDS.findIndex(s=>s.id===STATE.swordId);
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      selectSword(SWORDS[(idx+1)%SWORDS.length].id); e.preventDefault();
    } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      selectSword(SWORDS[(idx-1+SWORDS.length)%SWORDS.length].id); e.preventDefault();
    } else if (e.code === 'Enter') {
      confirmSword(); e.preventDefault();
    }
  } else if (ms && !ms.classList.contains('hidden')) {
    const idx = MAPS.findIndex(m=>m.id===STATE.mapId);
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      selectMap(MAPS[(idx+1)%MAPS.length].id); e.preventDefault();
    } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      selectMap(MAPS[(idx-1+MAPS.length)%MAPS.length].id); e.preventDefault();
    } else if (e.code === 'Enter') {
      confirmMap(); e.preventDefault();
    }
  }
});

// =================================================================
//  Map Select
// =================================================================
function makeMapThumb(mapDef) {
  const c = document.createElement('canvas');
  c.width = 280; c.height = 90;
  const ctx = c.getContext('2d');
  // sky
  const sky = '#' + mapDef.sky.toString(16).padStart(6,'0');
  const g = ctx.createLinearGradient(0,0,0,90);
  g.addColorStop(0, sky);
  g.addColorStop(1, '#3a2418');
  ctx.fillStyle = g; ctx.fillRect(0,0,280,90);
  // floor
  const fl = { dojo:'#7a5a3a', sakura:'#a0786a', snow:'#e0e8f0', castle:'#1e1818', bamboo:'#3a5028', beach:'#d8b888' }[mapDef.id] || '#666';
  ctx.fillStyle = fl; ctx.fillRect(0, 60, 280, 30);
  // map-specific accents
  if (mapDef.id === 'dojo') {
    ctx.fillStyle = '#e8c070';
    ctx.fillRect(40, 30, 14, 16); ctx.fillRect(220, 30, 14, 16);
  } else if (mapDef.id === 'sakura') {
    for (let i=0;i<25;i++) { ctx.fillStyle = `rgba(255,184,200,${0.5+Math.random()*0.5})`; ctx.fillRect(Math.random()*280, Math.random()*60, 3, 3); }
    ctx.fillStyle = '#ffb8c8'; ctx.beginPath(); ctx.arc(60, 35, 18, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(200, 35, 18, 0, Math.PI*2); ctx.fill();
  } else if (mapDef.id === 'snow') {
    ctx.fillStyle = '#eef4ff';
    for (let i=0;i<3;i++) { ctx.beginPath(); ctx.moveTo(50+i*70, 60); ctx.lineTo(60+i*70, 30); ctx.lineTo(70+i*70, 60); ctx.fill(); }
    for (let i=0;i<40;i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random()})`; ctx.fillRect(Math.random()*280, Math.random()*60, 2, 2); }
  } else if (mapDef.id === 'castle') {
    ctx.fillStyle = '#403020'; ctx.fillRect(110, 25, 60, 35);
    ctx.fillStyle = '#2a1418'; ctx.beginPath(); ctx.moveTo(105, 30); ctx.lineTo(140, 14); ctx.lineTo(175, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff7028'; ctx.beginPath(); ctx.arc(40, 55, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(240, 55, 4, 0, Math.PI*2); ctx.fill();
  } else if (mapDef.id === 'bamboo') {
    for (let i=0;i<8;i++) { ctx.fillStyle = '#5a8038'; ctx.fillRect(20+i*32, 10, 4, 60); }
  } else if (mapDef.id === 'beach') {
    ctx.fillStyle = '#4878a0'; ctx.fillRect(0, 50, 280, 12);
    ctx.fillStyle = '#b02828'; ctx.fillRect(100, 24, 4, 36); ctx.fillRect(176, 24, 4, 36); ctx.fillRect(94, 20, 92, 5);
  }
  return c.toDataURL();
}

function setupMapSelect() {
  const list = document.getElementById('map-list');
  list.innerHTML = '';
  MAPS.forEach(m => {
    const card = document.createElement('div');
    card.className = 'map-card' + (m.id === STATE.mapId ? ' selected' : '');
    card.dataset.id = m.id;
    const thumb = makeMapThumb(m);
    card.innerHTML = `
      <img class="map-thumb" src="${thumb}" alt="${m.name}" />
      <div class="map-name">${m.name}</div>
      <div class="map-desc">${m.desc.replace(/\n/g,'<br>')}</div>
    `;
    card.addEventListener('click', () => selectMap(m.id));
    card.addEventListener('dblclick', () => { selectMap(m.id); confirmMap(); });
    list.appendChild(card);
  });
  updateMapCurrentLabel();
}
function selectMap(id) {
  STATE.mapId = id;
  document.querySelectorAll('#map-list .map-card').forEach(c => c.classList.toggle('selected', c.dataset.id===id));
  updateMapCurrentLabel();
}
function updateMapCurrentLabel() {
  const m = MAPS.find(x=>x.id===STATE.mapId);
  const el = document.getElementById('map-current-name');
  if (el && m) el.textContent = m.name;
}
function confirmMap() {
  document.getElementById('map-select').classList.add('hidden');
  if (STATE.mode === 'ai') {
    STATE.enemySwordId = SWORDS[Math.floor(Math.random()*SWORDS.length)].id;
    STATE.enemyName = 'AI 武芸者';
    startGame('ai');
  } else if (STATE.mode === 'practice') {
    STATE.enemySwordId = STATE.swordId;
    STATE.enemyName = '案山子';
    startGame('practice');
  }
}
document.getElementById('map-back').addEventListener('click', () => {
  document.getElementById('map-select').classList.add('hidden');
  setupSwordSelect();
  document.getElementById('sword-select').classList.remove('hidden');
});
document.getElementById('map-confirm').addEventListener('click', confirmMap);

// =================================================================
//  Menu Wiring
// =================================================================
document.querySelectorAll('#menu .ink-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    ensureAudio();
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

// =================================================================
//  Networking (PeerJS)
// =================================================================
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
      conn.send({ t: 'hello', name: STATE.playerName, sword: STATE.swordId, map: STATE.mapId });
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
      sendNet({ t: 'start', name: STATE.playerName, sword: STATE.swordId, map: STATE.mapId });
      document.getElementById('room-host').classList.add('hidden');
      startGame('online');
    }
  } else if (data.t === 'start') {
    STATE.enemyName = data.name || '相手';
    STATE.enemySwordId = data.sword || 'katana';
    if (data.map) STATE.mapId = data.map;
    document.getElementById('room-join').classList.add('hidden');
    startGame('online');
  } else if (data.t === 'pose' && STATE.isHost) {
    if (enemy) {
      enemy.mesh.position.x = data.x;
      enemy.mesh.position.z = data.z;
      enemy.facing = data.f;
      enemy.mesh.rotation.y = data.f;
    }
  } else if (data.t === 'state' && !STATE.isHost) {
    if (player && enemy) {
      enemy.mesh.position.x = data.host.x;
      enemy.mesh.position.z = data.host.z;
      enemy.facing = data.host.f;
      enemy.mesh.rotation.y = data.host.f;
      enemy.hp = data.host.hp;
      player.hp = data.guest.hp;
      enemy.stamina = data.host.stamina ?? enemy.stamina;
      enemy.ki = data.host.ki ?? enemy.ki;
      player.stamina = data.guest.stamina ?? player.stamina;
      player.ki = data.guest.ki ?? player.ki;
      if (data.host.state && enemy.state !== data.host.state && (data.host.state==='attack'||data.host.state==='heavy')) {
        enemy.attack(data.host.state==='heavy'?'heavy':'light');
        addSlashTrail(enemy);
      }
      if (data.host.guard !== undefined) enemy.guard(data.host.guard);
    }
  } else if (data.t === 'act') {
    if (STATE.isHost && enemy) {
      if (data.a === 'light') { enemy.attack('light'); addSlashTrail(enemy); }
      else if (data.a === 'heavy') { enemy.attack('heavy'); addSlashTrail(enemy, true); }
      else if (data.a === 'guard') { enemy.guard(!!data.v); }
      else if (data.a === 'dodge') { enemy.dodge(new THREE.Vector3(data.dx,0,data.dz)); }
      else if (data.a === 'special') { enemy.special(); addSlashTrail(enemy, true); }
    }
  } else if (data.t === 'item') {
    // 相手のアイテム使用エフェクト
    const other = STATE.isHost ? enemy : player; // 受信側にとっての相手
    if (other) {
      // 簡易再現
      if (data.id === 'shuriken') {
        const dir = new THREE.Vector3(Math.sin(other.facing), 0, Math.cos(other.facing));
        spawnShuriken(other, dir);
      } else if (data.id === 'smoke') {
        other.smokeUntil = performance.now() + 2500;
        spawnSmoke(other);
      } else if (data.id === 'potion') {
        onItemEffect(other, 0x44d266);
      } else if (data.id === 'kiboost') {
        onItemEffect(other, 0xd3b54a);
      }
    }
  } else if (data.t === 'round') {
    if (!STATE.isHost) {
      STATE.myScore = data.myScore;
      STATE.enemyScore = data.enemyScore;
      STATE.round = data.round;
      updateHUD();
      if (data.over) showResult();
    }
  }
}

setInterval(() => {
  if (STATE.conn && STATE.isHost && STATE.inGame && player && enemy) {
    sendNet({
      t: 'state',
      host: { x: player.mesh.position.x, z: player.mesh.position.z, f: player.facing, hp: player.hp, state: player.state, guard: player.guardActive, stamina: player.stamina, ki: player.ki },
      guest:{ x: enemy.mesh.position.x, z: enemy.mesh.position.z, f: enemy.facing, hp: enemy.hp, state: enemy.state, guard: enemy.guardActive, stamina: enemy.stamina, ki: enemy.ki }
    });
  }
}, 50);

// =================================================================
//  Init
// =================================================================
setTimeout(() => {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
}, 400);
