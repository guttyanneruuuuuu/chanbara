// ===============================================================
//  斬 - 神 Chanbara (Mobile Edition)
//  3D Online Sword Fighting - Three.js + PeerJS
//  -------------------------------------------------------------
//  - 背面視点・キャラは画面に背中を向ける
//  - 指のスワイプで刀を直接振り回す
//  - 部位ダメージ → 首切断/腕切断/胴体切断 で部位飛ばし
//  - 断面真っ赤・血しぶき大量噴出
//  - ヒット時にスマホ振動 (vibrate)
//  - 広大なマップ・各種地形
//  - シンプルで爽快なリトライ重視ゲーム
// ===============================================================
import * as THREE from 'three';

// =================================================================
//  Sword Definitions
// =================================================================
const SWORDS = [
  { id:'katana',    name:'打刀',   desc:'標準的な刀。\n攻守の均衡に優れる。',         bladeLength:1.05, bladeColor:0xdfe6ec, guardColor:0x222222, gripColor:0x111111, reach:1.85, damage:24, speed:1.0,  heavyDamage:42, heavySpeed:0.62, stamCost:14, kiGain:12 },
  { id:'tachi',     name:'太刀',   desc:'反りの強い長刀。\n間合いは広いが少し重い。', bladeLength:1.30, bladeColor:0xe8eef3, guardColor:0x3a2a18, gripColor:0x2a1a0a, reach:2.15, damage:26, speed:0.85, heavyDamage:48, heavySpeed:0.55, stamCost:18, kiGain:14 },
  { id:'wakizashi', name:'脇差',   desc:'短く軽快。\n手数で押し切る。',               bladeLength:0.78, bladeColor:0xdadfe4, guardColor:0x551111, gripColor:0x331010, reach:1.50, damage:18, speed:1.45, heavyDamage:30, heavySpeed:0.95, stamCost:9,  kiGain:9 },
  { id:'nodachi',   name:'野太刀', desc:'巨大な大太刀。\n一撃必殺、ただし鈍重。',     bladeLength:1.55, bladeColor:0xc8d0d6, guardColor:0x1c1c1c, gripColor:0x0a0a0a, reach:2.40, damage:33, speed:0.70, heavyDamage:62, heavySpeed:0.40, stamCost:24, kiGain:18 },
  { id:'kogarasu',  name:'小烏丸', desc:'銘刀。鋭く軽妙、\n一閃の冴え。',             bladeLength:1.10, bladeColor:0xf0f4f8, guardColor:0x8b6e2e, gripColor:0x2a1f12, reach:1.90, damage:28, speed:1.10, heavyDamage:46, heavySpeed:0.68, stamCost:15, kiGain:14 },
  { id:'murasame',  name:'村雨',   desc:'水を呼ぶ妖刀。\n会心の確率が高い。',         bladeLength:1.10, bladeColor:0xa8d8e8, guardColor:0x1c4060, gripColor:0x0a2030, reach:1.90, damage:25, speed:1.05, heavyDamage:44, heavySpeed:0.65, stamCost:14, kiGain:13, crit:0.32 },
  { id:'kusanagi',  name:'草薙',   desc:'神話の霊剣。\n必殺で雷を呼ぶ。',             bladeLength:1.22, bladeColor:0xfff4c8, guardColor:0xb08a3e, gripColor:0x3a2818, reach:2.00, damage:30, speed:0.95, heavyDamage:54, heavySpeed:0.55, stamCost:18, kiGain:20, special:'thunder' },
];

// =================================================================
//  Map Definitions (広いマップ)
// =================================================================
const MAPS = [
  { id:'dojo',   name:'道場',     desc:'静謐なる修練の場。\n標準フィールド。',         sky:0x2a1a14, fog:[0x2a1a14, 60, 200], floor:'wood',  weather:'none'   },
  { id:'sakura', name:'桜庭',     desc:'舞い散る花弁の中で。\n春爛漫の戦い。',         sky:0xf6c0c8, fog:[0xf6c0c8, 60, 200], floor:'stone', weather:'sakura' },
  { id:'snow',   name:'雪山',     desc:'吹雪く銀世界。\n足取りはやや鈍る。',           sky:0xb8c8d8, fog:[0xb8c8d8, 40, 160], floor:'snow',  weather:'snow', moveMult:0.88 },
  { id:'castle', name:'城下町',   desc:'夜半の天守の影。\n篝火が朱に染める。',         sky:0x141022, fog:[0x141022, 50, 180], floor:'tile',  weather:'embers' },
  { id:'bamboo', name:'竹林',     desc:'青き竹の囁き。\n緑陰の幽玄なる立合い。',       sky:0x244018, fog:[0x244018, 45, 170], floor:'moss',  weather:'leaves' },
  { id:'beach',  name:'夕陽の浜', desc:'波音が響く黄昏。\n砂浜は踏ん張りが効かぬ。',   sky:0xc06030, fog:[0xc06030, 70, 220], floor:'sand',  weather:'none', moveMult:0.93 },
  { id:'hell',   name:'血染め畑', desc:'血の池の畔。\n戦いの果ての地。',               sky:0x401010, fog:[0x401010, 40, 160], floor:'blood', weather:'embers' },
];

// =================================================================
//  Items
// =================================================================
const ITEMS = [
  { id:'potion',   name:'回復薬', icon:'薬', desc:'体力を 40 回復',       color:0xd23030 },
  { id:'smoke',    name:'煙玉',   icon:'煙', desc:'視界を遮り 緊急回避',  color:0x666666 },
  { id:'shuriken', name:'手裏剣', icon:'撃', desc:'遠距離飛び道具',       color:0x404040 },
  { id:'kiboost',  name:'気合丹', icon:'丹', desc:'気合ゲージを満タンに', color:0xd3b54a },
];

// =================================================================
//  State
// =================================================================
const STATE = {
  mode: null,
  swordId: 'katana',
  enemySwordId: 'katana',
  mapId: 'dojo',
  playerName: '武芸者',
  enemyName: '相手',
  peer: null, conn: null, isHost: false,
  inGame: false,
  myScore: 0, enemyScore: 0, round: 1, maxRounds: 3,
  hits: 0, crits: 0, blocks: 0, dismembers: 0,
  combo: 0, bestCombo: 0, comboExpireAt: 0, feverUntil: 0,
};
const COMBO_WINDOW_MS = 1800;
const FEVER_TRIGGER_COMBO = 5;
const FEVER_DURATION_MS = 6000;

// =================================================================
//  Three.js setup
// =================================================================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb98a5e);
scene.fog = new THREE.Fog(0xa07a52, 60, 200);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 600);

let hemi, sun, fill;
function setupLights(skyColor=0xfff1d6, groundColor=0x4a3826, sunColor=0xffd5a0, sunIntensity=1.1) {
  if (hemi) scene.remove(hemi);
  if (sun) scene.remove(sun);
  if (fill) scene.remove(fill);
  hemi = new THREE.HemisphereLight(skyColor, groundColor, 0.75);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(sunColor, sunIntensity);
  sun.position.set(20, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  fill = new THREE.DirectionalLight(0x8aa0c0, 0.30);
  fill.position.set(-12, 14, -10);
  scene.add(fill);
}
setupLights();

// =================================================================
//  Arena
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
        ctx.beginPath(); ctx.moveTo(0, y+Math.random()*60);
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
  } else if (kind === 'snow') {
    ctx.fillStyle = '#e8eef4'; ctx.fillRect(0,0,1024,1024);
    for (let i=0;i<2500;i++) {
      ctx.fillStyle = `rgba(${180+Math.random()*60|0},${190+Math.random()*60|0},${210+Math.random()*40|0},${Math.random()*0.6})`;
      ctx.fillRect(Math.random()*1024,Math.random()*1024,3,3);
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
    for (let i=0;i<3500;i++) {
      ctx.fillStyle = `rgba(${180+Math.random()*40|0},${150+Math.random()*40|0},${100+Math.random()*40|0},${Math.random()*0.5})`;
      ctx.fillRect(Math.random()*1024,Math.random()*1024,2,2);
    }
  } else if (kind === 'blood') {
    ctx.fillStyle = '#4a1818'; ctx.fillRect(0,0,1024,1024);
    for (let i=0;i<300;i++) {
      const r = 30+Math.random()*100;
      ctx.fillStyle = `rgba(${150+Math.random()*60|0},${20+Math.random()*30|0},${20+Math.random()*30|0},${0.4+Math.random()*0.4})`;
      ctx.beginPath(); ctx.arc(Math.random()*1024, Math.random()*1024, r, 0, Math.PI*2); ctx.fill();
    }
  } else {
    ctx.fillStyle = '#888'; ctx.fillRect(0,0,1024,1024);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12,12);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ARENA_SIZE = 240;   // 広いマップ
const RING_RADIUS = 22;   // 戦闘可能範囲

function buildArena(mapDef) {
  clearGroup(arenaGroup);
  clearGroup(weatherGroup);

  scene.background = new THREE.Color(mapDef.sky);
  scene.fog = new THREE.Fog(mapDef.fog[0], mapDef.fog[1], mapDef.fog[2]);

  if (mapDef.id === 'dojo')   setupLights(0xfff1d6, 0x4a3826, 0xffd5a0, 1.1);
  if (mapDef.id === 'sakura') setupLights(0xffd0d8, 0x6b3848, 0xffe8e0, 1.0);
  if (mapDef.id === 'snow')   setupLights(0xc8d8e8, 0x607080, 0xeef4ff, 0.95);
  if (mapDef.id === 'castle') setupLights(0x303048, 0x1a1428, 0xff8040, 0.75);
  if (mapDef.id === 'bamboo') setupLights(0xb0d090, 0x304018, 0xe0f0c0, 1.0);
  if (mapDef.id === 'beach')  setupLights(0xffc090, 0x603020, 0xffa050, 1.15);
  if (mapDef.id === 'hell')   setupLights(0x603030, 0x200808, 0xff5030, 0.90);

  // Ground (広大に)
  const groundGeom = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE, 1, 1);
  const groundTex = makeFloorTexture(mapDef.floor);
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.88, metalness: 0.04 });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  arenaGroup.add(ground);

  // 戦闘リング
  const ringGeom = new THREE.CircleGeometry(RING_RADIUS, 80);
  const ringCanvas = document.createElement('canvas');
  ringCanvas.width = ringCanvas.height = 512;
  const rctx = ringCanvas.getContext('2d');
  const ringBase = { dojo:'#c8b07a', sakura:'#e8c8a8', snow:'#d8e0e8', castle:'#403028', bamboo:'#506838', beach:'#e8c898', hell:'#502020' }[mapDef.id] || '#c8b07a';
  rctx.fillStyle = ringBase; rctx.fillRect(0,0,512,512);
  for (let i=0;i<512;i+=32) { rctx.fillStyle=`rgba(80,60,30,0.10)`; rctx.fillRect(i,0,1,512); rctx.fillRect(0,i,512,1); }
  for (let i=0;i<400;i++) { rctx.fillStyle=`rgba(70,50,25,${Math.random()*0.15})`; rctx.fillRect(Math.random()*512,Math.random()*512,2,1); }
  const ringTex = new THREE.CanvasTexture(ringCanvas);
  ringTex.colorSpace = THREE.SRGBColorSpace;
  const ringMat = new THREE.MeshStandardMaterial({ map: ringTex, roughness: 0.9, transparent: true, opacity: 0.85 });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.01;
  ring.receiveShadow = true;
  arenaGroup.add(ring);

  // 境界
  const borderGeom = new THREE.RingGeometry(RING_RADIUS - 0.15, RING_RADIUS + 0.15, 80);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0x8b2e2e, side: THREE.DoubleSide });
  const border = new THREE.Mesh(borderGeom, borderMat);
  border.rotation.x = -Math.PI/2;
  border.position.y = 0.02;
  arenaGroup.add(border);

  // マップ別装飾
  if (mapDef.id === 'dojo') {
    // 提灯柱4本
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.8 });
    for (let i=0;i<4;i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4;
      const px = Math.cos(a)*26, pz = Math.sin(a)*26;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 10, 0.7), pillarMat);
      pillar.position.set(px, 5, pz);
      pillar.castShadow = true;
      arenaGroup.add(pillar);
      const lantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 0.7, 12),
        new THREE.MeshStandardMaterial({ color: 0xe8c070, emissive: 0xb08040, emissiveIntensity: 0.9, roughness: 0.6 })
      );
      lantern.position.set(px, 9.5, pz);
      arenaGroup.add(lantern);
      const light = new THREE.PointLight(0xffb060, 0.6, 16, 2);
      light.position.set(px, 9.4, pz);
      arenaGroup.add(light);
    }
    // 遠景の山
    for (let i=0; i<14; i++) {
      const a = (i/14)*Math.PI*2; const r = 90 + Math.random()*10; const h = 14 + Math.random()*8;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(14, h, 5), new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }));
      mountain.position.set(Math.cos(a)*r, h/2-1, Math.sin(a)*r);
      mountain.rotation.y = Math.random()*Math.PI;
      arenaGroup.add(mountain);
    }
  } else if (mapDef.id === 'sakura') {
    for (let i=0;i<22;i++) {
      const a = (i/22)*Math.PI*2 + Math.random()*0.3;
      const r = 28 + Math.random()*22;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 6, 8), new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 }));
      trunk.position.set(Math.cos(a)*r, 3, Math.sin(a)*r);
      trunk.castShadow = true;
      arenaGroup.add(trunk);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(3.5+Math.random()*1.5, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffb8c8, roughness: 0.85 }));
      foliage.position.set(Math.cos(a)*r, 7, Math.sin(a)*r);
      foliage.castShadow = true;
      arenaGroup.add(foliage);
    }
  } else if (mapDef.id === 'snow') {
    for (let i=0;i<25;i++) {
      const a = (i/25)*Math.PI*2 + Math.random()*0.2;
      const r = 26 + Math.random()*22;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 5, 6), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 }));
      trunk.position.set(Math.cos(a)*r, 2.5, Math.sin(a)*r);
      arenaGroup.add(trunk);
      for (let k=0;k<3;k++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.5-k*0.5, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0xeef4ff, roughness: 0.95 }));
        cone.position.set(Math.cos(a)*r, 4.5+k*1.7, Math.sin(a)*r);
        cone.castShadow = true;
        arenaGroup.add(cone);
      }
    }
  } else if (mapDef.id === 'castle') {
    // 城
    const castleBase = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 16), new THREE.MeshStandardMaterial({ color: 0x504030, roughness: 0.9 }));
    castleBase.position.set(0, 4, -50);
    castleBase.castShadow = true;
    arenaGroup.add(castleBase);
    for (let k=0;k<4;k++) {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(12-k*2, 4, 4), new THREE.MeshStandardMaterial({ color: 0x2a1418, roughness: 0.9 }));
      roof.position.set(0, 10+k*4, -50);
      roof.rotation.y = Math.PI/4;
      arenaGroup.add(roof);
    }
    for (let i=0;i<6;i++) {
      const a = (i/6)*Math.PI*2 + Math.PI/6;
      const fx = Math.cos(a)*20, fz = Math.sin(a)*20;
      const fire = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7028 }));
      fire.position.set(fx, 1.6, fz);
      arenaGroup.add(fire);
      const fl = new THREE.PointLight(0xff6020, 2.0, 22, 2);
      fl.position.set(fx, 1.8, fz);
      arenaGroup.add(fl);
    }
  } else if (mapDef.id === 'bamboo') {
    for (let i=0;i<70;i++) {
      const a = Math.random()*Math.PI*2;
      const r = 26 + Math.random()*30;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 11, 8), new THREE.MeshStandardMaterial({ color: 0x5a8038, roughness: 0.7 }));
      trunk.position.set(Math.cos(a)*r, 5.5, Math.sin(a)*r);
      trunk.castShadow = true;
      arenaGroup.add(trunk);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshStandardMaterial({ color: 0x6ba040, roughness: 0.8 }));
      leaves.position.set(Math.cos(a)*r, 10, Math.sin(a)*r);
      arenaGroup.add(leaves);
    }
  } else if (mapDef.id === 'beach') {
    const torimat = new THREE.MeshStandardMaterial({ color: 0xb02828, roughness: 0.8 });
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,9,8), torimat);
    pole1.position.set(-5, 4.5, -28); arenaGroup.add(pole1);
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,9,8), torimat);
    pole2.position.set(5, 4.5, -28); arenaGroup.add(pole2);
    const top = new THREE.Mesh(new THREE.BoxGeometry(12, 0.6, 0.6), torimat);
    top.position.set(0, 9, -28); arenaGroup.add(top);
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 0.6), torimat);
    top2.position.set(0, 8.2, -28); arenaGroup.add(top2);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), new THREE.MeshStandardMaterial({ color: 0x4878a0, roughness: 0.3, metalness: 0.4 }));
    sea.rotation.x = -Math.PI/2;
    sea.position.set(0, -0.1, -90);
    arenaGroup.add(sea);
  } else if (mapDef.id === 'hell') {
    // 鬼火
    for (let i=0;i<10;i++) {
      const a = (i/10)*Math.PI*2;
      const r = 20 + Math.random()*30;
      const fire = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
      fire.position.set(Math.cos(a)*r, 2.2 + Math.random()*2, Math.sin(a)*r);
      arenaGroup.add(fire);
      const fl = new THREE.PointLight(0xff2020, 2.5, 20, 2);
      fl.position.copy(fire.position);
      arenaGroup.add(fl);
    }
    // 黒い石
    for (let i=0;i<30;i++) {
      const a = Math.random()*Math.PI*2;
      const r = 26 + Math.random()*40;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1+Math.random()*1.5, 0), new THREE.MeshStandardMaterial({ color: 0x2a1010, roughness: 1 }));
      rock.position.set(Math.cos(a)*r, 1, Math.sin(a)*r);
      arenaGroup.add(rock);
    }
  }

  buildWeather(mapDef.weather);
}

// =================================================================
//  Weather
// =================================================================
const weatherParticles = [];
function buildWeather(type) {
  weatherParticles.length = 0;
  if (!type || type === 'none') return;
  let count = 200;
  let color = 0xffffff;
  if (type === 'sakura') { count = 220; color = 0xff9bb4; }
  if (type === 'snow')   { count = 380; color = 0xffffff; }
  if (type === 'leaves') { count = 150; color = 0x88c060; }
  if (type === 'embers') { count = 120; color = 0xff7030; }
  for (let i=0;i<count;i++) {
    const size = type==='snow' ? 0.1 : (type==='embers'?0.06:0.12);
    const geom = type==='snow' ? new THREE.SphereGeometry(size, 5, 4) : new THREE.PlaneGeometry(size*1.6, size);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const p = new THREE.Mesh(geom, mat);
    p.position.set((Math.random()-0.5)*100, Math.random()*22+6, (Math.random()-0.5)*100);
    p.userData = {
      vy: -(0.5 + Math.random()*0.9) * (type==='snow'?0.7:1),
      vx: (Math.random()-0.5)*0.4,
      vz: (Math.random()-0.5)*0.4,
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
      p.position.y += dt*2.5;
      p.material.opacity = Math.max(0, 0.8 - (p.position.y - 1)*0.04);
    }
    if (p.position.y < 0 || p.position.y > 30) {
      p.position.set((Math.random()-0.5)*100, p.userData.type==='embers' ? 0 : 25+Math.random()*4, (Math.random()-0.5)*100);
      if (p.userData.type === 'embers') p.material.opacity = 0.85;
    }
  }
}

buildArena(MAPS[0]);

// =================================================================
//  Sword Mesh
// =================================================================
function buildSwordMesh(swordDef) {
  const group = new THREE.Group();
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.30, 10),
    new THREE.MeshStandardMaterial({ color: swordDef.gripColor, roughness: 0.9 })
  );
  grip.position.y = -0.15;
  grip.castShadow = true;
  group.add(grip);
  const tsuba = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.028, 14),
    new THREE.MeshStandardMaterial({ color: swordDef.guardColor, roughness: 0.5, metalness: 0.6 })
  );
  group.add(tsuba);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, swordDef.bladeLength, 0.014),
    new THREE.MeshStandardMaterial({
      color: swordDef.bladeColor, roughness: 0.18, metalness: 0.9,
      emissive: 0x000000, emissiveIntensity: 0,
    })
  );
  blade.position.y = 0.025 + swordDef.bladeLength/2;
  blade.castShadow = true;
  group.add(blade);
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, swordDef.bladeLength*0.98, 0.015),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
  );
  edge.position.set(0.024, 0.025 + swordDef.bladeLength/2, 0);
  group.add(edge);
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.028, 0.10, 6),
    blade.material
  );
  tip.position.y = 0.025 + swordDef.bladeLength + 0.05;
  group.add(tip);
  group.userData = { bladeLength: swordDef.bladeLength, blade };
  return group;
}

// =================================================================
//  Humanoid Builder (severable parts)
// =================================================================
function buildCharacter(opts) {
  const { color, swordDef } = opts;
  const root = new THREE.Group();
  const skinColor = 0xe5c298;
  const clothColor = color;
  const darkCloth = new THREE.Color(color).multiplyScalar(0.55).getHex();
  const beltColor = 0x2a1a0a;

  // torso
  const torsoMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.85 });
  const torsoLower = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.30, 0.40, 12), torsoMat);
  torsoLower.position.y = 1.05;
  torsoLower.castShadow = true;
  root.add(torsoLower);
  const torsoUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.32, 12), torsoMat);
  torsoUpper.position.y = 1.34;
  torsoUpper.castShadow = true;
  root.add(torsoUpper);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.04, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.7 }));
  collar.position.set(0, 1.55, 0);
  collar.rotation.x = Math.PI/2;
  root.add(collar);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.10, 14), new THREE.MeshStandardMaterial({ color: beltColor, roughness: 0.9 }));
  belt.position.y = 0.83;
  belt.castShadow = true;
  root.add(belt);

  const hakama = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.46, 0.80, 12), new THREE.MeshStandardMaterial({ color: darkCloth, roughness: 0.9 }));
  hakama.position.y = 0.40;
  hakama.castShadow = true;
  root.add(hakama);

  // Neck
  const neckMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.10, 10), neckMat);
  neck.position.y = 1.58;
  root.add(neck);

  // Head group (severable)
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.74;
  root.add(headGroup);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), neckMat);
  head.scale.set(1, 1.1, 1.05);
  head.castShadow = true;
  headGroup.add(head);

  // 顔 (背中向きなので簡素でOKだが残す)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101010 });
  const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeMat);
  lEye.position.set(-0.055, 0.02, 0.15);
  headGroup.add(lEye);
  const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeMat);
  rEye.position.set(0.055, 0.02, 0.15);
  headGroup.add(rEye);

  // 髪
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x141008, roughness: 0.95 });
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 10, 0, Math.PI*2, 0, Math.PI/1.9), hairMat);
  hair.position.set(0, 0.02, -0.005);
  hair.castShadow = true;
  headGroup.add(hair);
  const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.10, 8), hairMat);
  knot.position.set(0, 0.20, -0.04);
  knot.rotation.z = Math.PI/2;
  headGroup.add(knot);

  // 首切断面 (頭側)
  const headStump = new THREE.Mesh(
    new THREE.CircleGeometry(0.08, 12),
    new THREE.MeshBasicMaterial({ color: 0xc8201c, side: THREE.DoubleSide })
  );
  headStump.position.y = -0.06;
  headStump.rotation.x = Math.PI/2;
  headStump.visible = false;
  headGroup.add(headStump);

  // 首切断面 (胴側) - 後で表示
  const neckStump = new THREE.Mesh(
    new THREE.CircleGeometry(0.08, 12),
    new THREE.MeshBasicMaterial({ color: 0xc8201c, side: THREE.DoubleSide })
  );
  neckStump.position.set(0, 1.64, 0);
  neckStump.rotation.x = -Math.PI/2;
  neckStump.visible = false;
  root.add(neckStump);

  // Arms (severable)
  const armMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

  function buildArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side*0.36, 1.48, 0);
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.32, 10), armMat);
    upperArm.position.y = -0.16;
    upperArm.castShadow = true;
    shoulder.add(upperArm);
    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    shoulder.add(elbow);
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.30, 10), armMat);
    forearm.position.y = -0.15;
    forearm.castShadow = true;
    elbow.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat);
    hand.position.y = -0.32;
    hand.scale.set(0.85, 1, 0.7);
    hand.castShadow = true;
    elbow.add(hand);
    // 肩切断面 (体側)
    const shoulderStump = new THREE.Mesh(
      new THREE.CircleGeometry(0.085, 12),
      new THREE.MeshBasicMaterial({ color: 0xc8201c, side: THREE.DoubleSide })
    );
    shoulderStump.position.set(side*0.36, 1.48, 0);
    shoulderStump.rotation.z = side*Math.PI/2;
    shoulderStump.visible = false;
    root.add(shoulderStump);
    return { shoulder, elbow, upperArm, forearm, hand, shoulderStump };
  }
  const lArm = buildArm(-1);
  const rArm = buildArm(1);
  root.add(lArm.shoulder);
  root.add(rArm.shoulder);

  // Legs
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

  // 刀
  const swordPivot = new THREE.Group();
  swordPivot.position.set(0, -0.32, 0);
  const sword = buildSwordMesh(swordDef);
  swordPivot.add(sword);
  rArm.elbow.add(swordPivot);

  // 鞘
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
      torsoUpper, torsoLower, headGroup, hair, neck, neckStump,
      lShoulder: lArm.shoulder, lElbow: lArm.elbow, lHand: lArm.hand, lShoulderStump: lArm.shoulderStump,
      rShoulder: rArm.shoulder, rElbow: rArm.elbow, rHand: rArm.hand, rShoulderStump: rArm.shoulderStump,
      lHip: lLeg.hip, lKnee: lLeg.knee,
      rHip: rLeg.hip, rKnee: rLeg.knee,
      swordPivot, sword, saya: sayaGroup,
    },
    swordDef,
    severed: { head:false, lArm:false, rArm:false },
  };

  // 構え
  lArm.shoulder.rotation.x = 0.1;
  lArm.shoulder.rotation.z = 0.15;
  lArm.elbow.rotation.x = -0.6;
  rArm.shoulder.rotation.x = -0.2;
  rArm.shoulder.rotation.z = -0.15;
  rArm.elbow.rotation.x = -1.0;
  swordPivot.rotation.x = -0.4;
  swordPivot.rotation.z = -0.2;

  return root;
}

// =================================================================
//  Severed pieces (頭/腕が吹き飛ぶ)
// =================================================================
const debrisList = [];

function spawnSeveredHead(fighter) {
  const p = fighter.mesh.userData.parts;
  if (fighter.mesh.userData.severed.head) return;
  fighter.mesh.userData.severed.head = true;
  // 頭部を世界座標で取得して切り離す
  p.headGroup.updateWorldMatrix(true, false);
  const worldPos = new THREE.Vector3();
  p.headGroup.getWorldPosition(worldPos);
  // 元の位置からシーンに移動
  fighter.mesh.remove(p.headGroup);
  scene.add(p.headGroup);
  p.headGroup.position.copy(worldPos);
  // 切断面を表示
  const stump = p.headGroup.children.find(c => c.material && c.material.color && c.material.color.getHex() === 0xc8201c);
  if (stump) stump.visible = true;
  p.neckStump.visible = true;
  // 物理
  const facing = fighter.facing;
  p.headGroup.userData.body = {
    v: new THREE.Vector3((Math.random()-0.5)*3, 5+Math.random()*3, Math.sin(facing)*4 + (Math.random()-0.5)*3),
    spin: new THREE.Vector3((Math.random()-0.5)*8, (Math.random()-0.5)*8, (Math.random()-0.5)*8),
    life: 9999, isHead: true,
  };
  debrisList.push(p.headGroup);
  // 血しぶき
  spawnBloodGeyser(worldPos, 50);
  // 大量画面血
  showBloodOverlay();
  bigVibrate();
  STATE.dismembers++;
}

function spawnSeveredArm(fighter, side) {
  const p = fighter.mesh.userData.parts;
  const key = side==='l'?'lArm':'rArm';
  if (fighter.mesh.userData.severed[key]) return;
  fighter.mesh.userData.severed[key] = true;
  const shoulder = side==='l' ? p.lShoulder : p.rShoulder;
  const stump = side==='l' ? p.lShoulderStump : p.rShoulderStump;
  shoulder.updateWorldMatrix(true, false);
  const worldPos = new THREE.Vector3();
  shoulder.getWorldPosition(worldPos);
  const worldQuat = new THREE.Quaternion();
  shoulder.getWorldQuaternion(worldQuat);
  fighter.mesh.remove(shoulder);
  scene.add(shoulder);
  shoulder.position.copy(worldPos);
  shoulder.quaternion.copy(worldQuat);
  stump.visible = true;
  // 体側に切断面の血のテクスチャ
  const sideMul = side==='l' ? -1 : 1;
  shoulder.userData.body = {
    v: new THREE.Vector3(sideMul*(2+Math.random()*3), 4+Math.random()*3, Math.sin(fighter.facing)*3 + (Math.random()-0.5)*2),
    spin: new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10),
    life: 9999, isArm: true,
  };
  debrisList.push(shoulder);
  spawnBloodGeyser(worldPos, 35);
  showBloodOverlay();
  bigVibrate();
  STATE.dismembers++;
}

function updateDebris(dt) {
  for (let i=debrisList.length-1; i>=0; i--) {
    const d = debrisList[i];
    const b = d.userData.body;
    if (!b) continue;
    b.v.y -= 18*dt; // 重力
    d.position.addScaledVector(b.v, dt);
    d.rotation.x += b.spin.x*dt;
    d.rotation.y += b.spin.y*dt;
    d.rotation.z += b.spin.z*dt;
    if (d.position.y < 0.15) {
      d.position.y = 0.15;
      b.v.y *= -0.3;
      b.v.x *= 0.7;
      b.v.z *= 0.7;
      b.spin.multiplyScalar(0.6);
      // 着地時に小さい血
      if (Math.abs(b.v.y) > 1) spawnBloodSplat(d.position.clone());
    }
    // 落ちた首から血を垂らす
    if (b.isHead && Math.random() < 0.3) {
      spawnBloodDrip(d.position.clone());
    }
  }
}

// =================================================================
//  Fighter
// =================================================================
class Fighter {
  constructor({ swordDef, color, isPlayer, name }) {
    this.swordDef = swordDef;
    this.mesh = buildCharacter({ color, swordDef });
    this.isPlayer = isPlayer;
    this.name = name;
    this.hp = 100; this.maxHp = 100;
    this.stamina = 100; this.maxStamina = 100;
    this.ki = 0; this.maxKi = 100;
    this.facing = isPlayer ? 0 : Math.PI;
    this.velocity = new THREE.Vector3();
    this.position = this.mesh.position;
    this.state = 'idle';
    this.stateTime = 0;
    this.attackPhase = 0;
    this.attackHitFrame = false;
    this.guardActive = false;
    this.dodgeDir = new THREE.Vector3();
    this.invulnUntil = 0;
    this.animClock = 0;
    this.cooldown = 0;
    this.swingYaw = 0;
    this.swingPitch = 0;
    this.swingPower = 0;
    this.swingRoll = 0;
    this.slashDirX = 0;
    this.slashDirY = 0;
    this.jumpVel = 0;
    this.jumpCooldown = 0;
    this.groundY = 0;
    this.smokeUntil = 0;
    this.boostUntil = 0;
    this.specialUntil = 0;
    this.items = {};
    this.itemKey = 0;
  }

  setStance(facing) {
    this.facing = facing;
    this.mesh.rotation.y = facing;
  }

  setHandedness() {
    const p = this.mesh.userData.parts;
    if (!p?.swordPivot || !p?.lElbow || !p?.rElbow) return;
    if (p.swordPivot.parent !== p.rElbow) {
      p.swordPivot.removeFromParent();
      p.rElbow.add(p.swordPivot);
    }
    p.swordPivot.position.set(0, -0.32, 0);
    if (p.saya) {
      p.saya.position.x = -0.32;
      p.saya.rotation.z = 0.2;
    }
  }

  attack(type='light') {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge' || this.state === 'dead') return false;
    if (this.cooldown > 0) return false;
    // 両手持ち前提なので、両腕を失った時だけ攻撃不可
    if (this.mesh.userData?.severed?.lArm && this.mesh.userData?.severed?.rArm) return false;
    const cost = type === 'heavy' ? this.swordDef.stamCost * 1.7 : this.swordDef.stamCost;
    if (this.stamina < cost) return false;
    this.stamina -= cost;
    this.state = type === 'heavy' ? 'heavy' : 'attack';
    this.stateTime = 0;
    this.attackPhase = 0;
    this.attackHitFrame = false;
    this.slashDirX = Math.max(-1.3, Math.min(1.3, this.swingYaw));
    this.slashDirY = Math.max(-1.3, Math.min(1.3, this.swingPitch));
    return true;
  }

  guard(on) {
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge' || this.state === 'dead') {
      this.guardActive = false; return;
    }
    this.guardActive = on;
    this.state = on ? 'guard' : 'idle';
  }

  dodge(dir) {
    const isAirborne = this.mesh.position.y > this.groundY + 0.02;
    if (this.state === 'attack' || this.state === 'heavy' || this.state === 'hit' || this.state === 'dodge' || this.state === 'dead' || isAirborne) return false;
    if (this.cooldown > 0) return false;
    if (this.stamina < 22) return false;
    this.stamina -= 22;
    this.state = 'dodge';
    this.stateTime = 0;
    this.invulnUntil = performance.now() + 340;
    this.dodgeDir.copy(dir).normalize();
    return true;
  }

  jump(power = 6.6) {
    if (this.state === 'dead') return false;
    if (this.jumpCooldown > 0) return false;
    if (this.mesh.position.y > this.groundY + 0.02) return false;
    if (this.stamina < 10) return false;
    this.stamina -= 10;
    this.jumpVel = Math.max(5.6, power);
    this.jumpCooldown = 0.28;
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
      const isHeavy = opts.heavy;
      if (isHeavy && Math.random() < 0.55) {
        this.hp = Math.max(0, this.hp - damage*0.5);
        this.state = 'hit'; this.stateTime = 0;
        return 'break';
      }
      this.hp = Math.max(0, this.hp - damage*0.12);
      this.stamina = Math.max(0, this.stamina - 12);
      return 'guard';
    }
    let dmg = damage;
    let crit = false;
    if (Math.random() < (attacker?.swordDef?.crit || 0.10)) { dmg *= 1.7; crit = true; }
    if (opts.special) { dmg *= 1.4; crit = true; }
    if (attacker && performance.now() < attacker.boostUntil) dmg *= 1.35;
    this.hp = Math.max(0, this.hp - dmg);
    this.state = 'hit'; this.stateTime = 0;
    this.invulnUntil = performance.now() + 230;
    this.ki = Math.min(this.maxKi, this.ki + 8);
    if (this.hp <= 0) { this.state = 'dead'; this.stateTime = 0; }
    return crit ? 'crit' : true;
  }

  update(dt) {
    this.stateTime += dt;
    this.animClock += dt;
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.jumpCooldown > 0) this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    if (this.mesh.position.y > this.groundY + 0.001 || this.jumpVel > 0) {
      this.jumpVel -= 20 * dt;
      this.mesh.position.y += this.jumpVel * dt;
      if (this.mesh.position.y <= this.groundY) {
        this.mesh.position.y = this.groundY;
        this.jumpVel = 0;
      }
    }
    if (this.state !== 'attack' && this.state !== 'heavy' && this.state !== 'dodge') {
      this.stamina = Math.min(this.maxStamina, this.stamina + 26*dt);
    }
    const p = this.mesh.userData.parts;
    const lerp = (a,b,t)=>a + (b-a)*t;

    const hand = 1;
    let tWeaponShoulderX = -0.35, tWeaponShoulderZ = -0.1 * hand;
    let tOffShoulderX = -0.25, tOffShoulderZ = 0.1 * hand;
    let tWeaponElbowX = -1.0, tOffElbowX = -0.6;
    let tSwordX = -0.4, tSwordZ = -0.04 * hand, tSwordY = 0;
    let tTorsoY = 0, tTorsoX = 0;

    const moving = (Math.abs(this.velocity.x) + Math.abs(this.velocity.z)) > 0.5;
    const airborne = this.mesh.position.y > this.groundY + 0.02;
    if (moving && (this.state === 'idle' || this.state === 'guard') && !airborne) {
      const w = this.animClock * 9;
      p.lHip.rotation.x = Math.sin(w)*0.5;
      p.rHip.rotation.x = -Math.sin(w)*0.5;
      p.lKnee.rotation.x = Math.max(0, Math.sin(w)*0.4);
      p.rKnee.rotation.x = Math.max(0, -Math.sin(w)*0.4);
      tOffShoulderX += Math.sin(w+Math.PI)*0.2;
      tWeaponShoulderX += Math.sin(w)*0.05;
    } else if (!airborne) {
      p.lHip.rotation.x = lerp(p.lHip.rotation.x, 0, 0.2);
      p.rHip.rotation.x = lerp(p.rHip.rotation.x, 0, 0.2);
      p.lKnee.rotation.x = lerp(p.lKnee.rotation.x, 0, 0.2);
      p.rKnee.rotation.x = lerp(p.rKnee.rotation.x, 0, 0.2);
    }
    if (airborne) {
      p.lHip.rotation.x = lerp(p.lHip.rotation.x, -0.4, 0.25);
      p.rHip.rotation.x = lerp(p.rHip.rotation.x, -0.4, 0.25);
      p.lKnee.rotation.x = lerp(p.lKnee.rotation.x, 0.65, 0.25);
      p.rKnee.rotation.x = lerp(p.rKnee.rotation.x, 0.65, 0.25);
      tTorsoX += 0.08;
    }

    if (this.state === 'attack') {
      const dur = 0.40 / this.swordDef.speed;
      this.attackPhase = Math.min(1, this.stateTime / dur);
      if (this.attackPhase < 0.30) {
        const t = this.attackPhase/0.30;
        tWeaponShoulderX = lerp(-0.2, -2.4, t);
        tWeaponElbowX   = lerp(-1.0, -2.0, t);
        tSwordX    = lerp(-0.4, -1.6, t);
        tTorsoY    = lerp(0, -0.3, t);
      } else if (this.attackPhase < 0.6) {
        const t = (this.attackPhase-0.30)/0.30;
        tWeaponShoulderX = lerp(-2.4, 1.5, t);
        tWeaponElbowX   = lerp(-2.0, -0.2, t);
        tSwordX    = lerp(-1.6, 0.7, t);
        tTorsoY    = lerp(-0.3, 0.25, t);
        if (!this.attackHitFrame && t > 0.25) {
          this.attackHitFrame = true;
          tryHit(this, this.swordDef.damage);
        }
      } else {
        const t = (this.attackPhase-0.6)/0.4;
        tWeaponShoulderX = lerp(1.5, -0.2, t);
        tWeaponElbowX   = lerp(-0.2, -1.0, t);
        tSwordX    = lerp(0.7, -0.4, t);
        tTorsoY    = lerp(0.25, 0, t);
      }
      if (this.attackPhase >= 1) { this.state = 'idle'; this.cooldown = 0.12; }
    } else if (this.state === 'heavy') {
      const dur = 0.65 / this.swordDef.heavySpeed;
      this.attackPhase = Math.min(1, this.stateTime / dur);
      const isSpecial = performance.now() < this.specialUntil;
      if (this.attackPhase < 0.40) {
        const t = this.attackPhase/0.40;
        tWeaponShoulderX = lerp(-0.2, -2.8, t);
        tWeaponElbowX   = lerp(-1.0, -2.4, t);
        tSwordX    = lerp(-0.4, -1.9, t);
        tTorsoY    = lerp(0, -0.5, t);
      } else if (this.attackPhase < 0.68) {
        const t = (this.attackPhase-0.40)/0.28;
        tWeaponShoulderX = lerp(-2.8, 1.8, t);
        tWeaponElbowX   = lerp(-2.4, 0.0, t);
        tSwordX    = lerp(-1.9, 1.0, t);
        tTorsoY    = lerp(-0.5, 0.35, t);
        if (!this.attackHitFrame && t > 0.3) {
          this.attackHitFrame = true;
          const dmg = this.swordDef.heavyDamage * (isSpecial ? 1.4 : 1.0);
          tryHit(this, dmg, { heavy: true, special: isSpecial });
          if (isSpecial && this.swordDef.special === 'thunder') spawnThunder(this);
        }
      } else {
        const t = (this.attackPhase-0.68)/0.32;
        tWeaponShoulderX = lerp(1.8, -0.2, t);
        tWeaponElbowX   = lerp(0.0, -1.0, t);
        tSwordX    = lerp(1.0, -0.4, t);
        tTorsoY    = lerp(0.35, 0, t);
      }
      if (this.attackPhase >= 1) { this.state = 'idle'; this.cooldown = 0.28; }
    } else if (this.state === 'guard') {
      tWeaponShoulderX = -1.4; tWeaponShoulderZ = -0.45 * hand;
      tOffShoulderX = -1.3; tOffShoulderZ = 0.45 * hand;
      tWeaponElbowX = -0.45; tOffElbowX = -0.65;
      tSwordX = 1.1; tSwordZ = 0.0;
    } else if (this.state === 'dodge') {
      const dur = 0.32;
      const t = Math.min(1, this.stateTime/dur);
      const speed = (1 - t)*14;
      this.mesh.position.x += this.dodgeDir.x * speed * dt;
      this.mesh.position.z += this.dodgeDir.z * speed * dt;
      tTorsoX = Math.sin(t*Math.PI)*0.25;
      if (t >= 1) { this.state = 'idle'; this.cooldown = 0.08; }
    } else if (this.state === 'hit') {
      const t = Math.min(1, this.stateTime/0.25);
      tTorsoY = Math.sin(t*Math.PI)*-0.4;
      tWeaponShoulderX = lerp(-0.2, 0.7, Math.sin(t*Math.PI));
      if (t >= 1) { this.state = 'idle'; this.cooldown = 0.08; }
    } else if (this.state === 'dead') {
      const t = Math.min(1, this.stateTime/0.8);
      this.mesh.rotation.x = lerp(0, -Math.PI/2.2, t);
      this.mesh.position.y = lerp(0, 0.2, t);
    } else {
      // idle - スワイプ反映
      if (this.isPlayer) {
        tWeaponShoulderX = -0.4 + this.swingPitch * 1.45;
        tOffShoulderX = -0.3 + this.swingPitch * 1.2;
        tWeaponShoulderZ = (-0.12 + this.swingYaw * 0.85) * hand;
        tOffShoulderZ = (0.12 + this.swingYaw * 0.75) * hand;
        tWeaponElbowX = -1.05 + this.swingPitch * 0.72;
        tOffElbowX = -0.95 + this.swingPitch * 0.58;
        tSwordX = -0.45 + this.swingPitch * 1.1;
        tSwordZ = (-0.04 + this.swingYaw * 1.35) * hand;
        tSwordY = this.swingRoll * 1.4 + this.swingYaw * 0.28;
      }
    }

    if (this.state === 'attack' || this.state === 'heavy') {
      const dirYaw = this.slashDirX * 0.55;
      const dirPitch = this.slashDirY * 0.28;
      tWeaponShoulderZ += dirYaw;
      tOffShoulderZ += dirYaw * 0.85;
      tSwordZ += dirYaw * 1.4;
      tSwordY += dirYaw * 0.7;
      tWeaponShoulderX += dirPitch;
      tOffShoulderX += dirPitch * 0.8;
      tSwordX += dirPitch * 0.9;
    }

    const weaponShoulder = hand > 0 ? p.rShoulder : p.lShoulder;
    const offShoulder = hand > 0 ? p.lShoulder : p.rShoulder;
    const weaponElbow = hand > 0 ? p.rElbow : p.lElbow;
    const offElbow = hand > 0 ? p.lElbow : p.rElbow;

    weaponShoulder.rotation.x = lerp(weaponShoulder.rotation.x, tWeaponShoulderX, 0.5);
    weaponShoulder.rotation.z = lerp(weaponShoulder.rotation.z, tWeaponShoulderZ, 0.5);
    offShoulder.rotation.x = lerp(offShoulder.rotation.x, tOffShoulderX, 0.4);
    offShoulder.rotation.z = lerp(offShoulder.rotation.z, tOffShoulderZ, 0.4);
    weaponElbow.rotation.x = lerp(weaponElbow.rotation.x, tWeaponElbowX, 0.5);
    offElbow.rotation.x = lerp(offElbow.rotation.x, tOffElbowX, 0.4);
    p.swordPivot.rotation.x = lerp(p.swordPivot.rotation.x, tSwordX, 0.55);
    p.swordPivot.rotation.z = lerp(p.swordPivot.rotation.z, tSwordZ, 0.55);
    p.swordPivot.rotation.y = lerp(p.swordPivot.rotation.y, tSwordY, 0.55);
    p.torsoUpper.rotation.y = lerp(p.torsoUpper.rotation.y, tTorsoY, 0.35);
    p.torsoUpper.rotation.x = lerp(p.torsoUpper.rotation.x, tTorsoX, 0.35);
    if (!this.mesh.userData.severed.head) p.headGroup.rotation.y = lerp(p.headGroup.rotation.y, tTorsoY*0.5, 0.3);
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

  getCenter() { return new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + 1.05, this.mesh.position.z); }

  getPartCenter(part) {
    const y = this.mesh.position.y + (part === 'head' ? 1.74 : part === 'torso' ? 1.15 : part === 'lArm' ? 1.30 : part === 'rArm' ? 1.30 : 0.45);
    let dx = 0;
    if (part === 'lArm') dx = -0.36;
    if (part === 'rArm') dx = 0.36;
    // 体の向きに合わせて回転
    const cos = Math.cos(this.facing), sin = Math.sin(this.facing);
    return new THREE.Vector3(this.mesh.position.x + dx*cos, y, this.mesh.position.z - dx*sin);
  }
}

// =================================================================
//  Spawn
// =================================================================
let player = null;
let enemy = null;

function spawnFighters(playerSwordId, enemySwordId) {
  if (player) scene.remove(player.mesh);
  if (enemy) scene.remove(enemy.mesh);
  // debrisも掃除
  for (const d of debrisList) scene.remove(d);
  debrisList.length = 0;

  const pDef = SWORDS.find(s => s.id === playerSwordId) || SWORDS[0];
  const eDef = SWORDS.find(s => s.id === enemySwordId) || SWORDS[0];
  player = new Fighter({ swordDef: pDef, color: 0x294b6d, isPlayer: true, name: STATE.playerName });
  enemy  = new Fighter({ swordDef: eDef, color: 0x6d2929, isPlayer: false, name: STATE.enemyName });
  player.setHandedness();
  enemy.setHandedness();
  player.mesh.position.set(0, 0, 4);
  enemy.mesh.position.set(0, 0, -4);
  player.setStance(Math.PI); // 自分は北を向く(画面奥)
  enemy.setStance(0);
  player.hp = player.maxHp; enemy.hp = enemy.maxHp;
  player.items = { potion: 2, smoke: 1, shuriken: 3, kiboost: 1 };
  enemy.items = { potion: 2, smoke: 1, shuriken: 2, kiboost: 1 };
  scene.add(player.mesh);
  scene.add(enemy.mesh);

  const mapDef = MAPS.find(m=>m.id===STATE.mapId) || MAPS[0];
  const tagL = document.getElementById('hp-name-l'); if (tagL) tagL.textContent = STATE.playerName + ' (' + pDef.name + ')';
  const tagR = document.getElementById('hp-name-r'); if (tagR) tagR.textContent = STATE.enemyName + ' (' + eDef.name + ')';
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
  if (performance.now() < target.smokeUntil && Math.random() < 0.5) return;
  const { base, tip } = attacker.getBladeWorldEnds();
  // 距離チェック
  const distBetween = Math.hypot(attacker.mesh.position.x - target.mesh.position.x, attacker.mesh.position.z - target.mesh.position.z);
  if (distBetween > attacker.swordDef.reach + 1.0) return;
  // 部位ごと判定
  const parts = ['head', 'torso', 'lArm', 'rArm', 'legs'];
  let bestPart = null;
  let bestDist = 999;
  for (const pt of parts) {
    const c = target.getPartCenter(pt);
    const d = distancePointToSegment(c, base, tip);
    if (d < bestDist) { bestDist = d; bestPart = pt; }
  }
  if (bestDist < 0.7) {
    let mult = 1.0;
    if (bestPart === 'head') mult = 1.9;
    if (bestPart === 'legs') mult = 0.75;
    if (bestPart === 'lArm' || bestPart === 'rArm') mult = 0.85;
    const finalDmg = damage * mult;
    const result = target.takeHit(finalDmg, attacker, opts);
    if (result === true || result === 'crit') {
      STATE.hits++;
      if (result === 'crit') STATE.crits++;
      if (attacker === player && target === enemy) registerPlayerCombo();
      if (target === player) resetPlayerCombo();
      // 切断判定
      let label = '斬！';
      if (bestPart === 'head' && (result === 'crit' || opts.heavy || target.hp <= 0)) {
        spawnSeveredHead(target);
        label = '首！！';
        showCenterMsg(label, 800);
      } else if ((bestPart === 'lArm' || bestPart === 'rArm') && (opts.heavy || result === 'crit') && !target.mesh.userData.severed[bestPart]) {
        spawnSeveredArm(target, bestPart==='lArm'?'l':'r');
        label = (bestPart==='lArm'?'左':'右') + '腕！！';
        showCenterMsg(label, 700);
      } else {
        if (bestPart === 'head') label = '頭！';
        if (result === 'crit') label = opts.special ? '必殺！' : (bestPart==='head' ? '致命！' : '会心！');
        if (target.hp <= 0) label = '一閃！';
        showCenterMsg(label, 600);
      }
      onHitEffect(target.getCenter(), result === 'crit', bestPart);
      if (target === player) {
        flashScreen();
        bigVibrate();
        camState.shake = 0.55;
      } else {
        // 攻撃側プレイヤー → 敵にヒット時の "爽快感" 演出
        if (attacker === player) {
          // ヒットストップ (ragdoll blade風: 一瞬時間が止まる)
          const stopMs = result === 'crit' ? 130 : (opts.heavy ? 110 : 75);
          camState.hitStop = Math.max(camState.hitStop, stopMs / 1000);
          // カメラシェイク (威力に比例)
          camState.shake = Math.max(camState.shake, result === 'crit' || opts.heavy ? 0.50 : 0.32);
          // 振動: スマホに来る "切った手応え" を波形で
          slashVibrate(result === 'crit' || opts.heavy ? 'strong' : 'light');
          // 小さく画面フラッシュ (会心時のみ)
          if (result === 'crit') flashScreen();
        }
      }
      playSound('hit', result === 'crit' ? 1.5 : 1.0);
    } else if (result === 'guard') {
      STATE.blocks++;
      onGuardSpark(target);
      showCenterMsg('受け', 250);
      playSound('clang');
      if (attacker === player) hitVibrate(15);
    } else if (result === 'break') {
      onHitEffect(target.getCenter(), false, bestPart);
      showCenterMsg('受け崩し！', 500);
      playSound('clang', 1.2);
      if (attacker === player) hitVibrate(40);
    }
    if (STATE.conn && STATE.isHost) {
      sendNet({ t: 'hit', target: target===player?'host':'guest', dmg: finalDmg, result, part: bestPart });
    }
  }
}

// =================================================================
//  Vibration (Ragdoll Blade風: 切れた瞬間にスマホがビリッ)
// =================================================================
function hitVibrate(ms=30) {
  try { navigator.vibrate?.(ms); } catch(e){}
}
function bigVibrate() {
  // 致命傷・必殺など
  try { navigator.vibrate?.([25, 25, 60, 25, 90, 30, 50]); } catch(e){}
}
// 斬撃ヒット時の振動 (ragdoll blade的な "切った感触" を再現するパターン)
function slashVibrate(kind='light') {
  try {
    if (kind === 'strong') {
      // 当たった瞬間 → 短い余韻 → 強いキック の二段構え
      navigator.vibrate?.([18, 18, 70]);
    } else {
      // 軽い斬り: 鋭く短く
      navigator.vibrate?.([28]);
    }
  } catch(e){}
}

// =================================================================
//  Blood VFX
// =================================================================
const sparkPool = [];
function onGuardSpark(target) {
  const center = target.getCenter();
  for (let i=0; i<14; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffd070 })
    );
    s.position.copy(center).add(new THREE.Vector3((Math.random()-0.5)*0.6, 0.2+(Math.random()-0.5)*0.4, (Math.random()-0.5)*0.6));
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*4, 1+Math.random()*3, (Math.random()-0.5)*4), life: 0.4 };
    scene.add(s); sparkPool.push(s);
  }
}

function onHitEffect(center, crit=false, part='torso') {
  // 血しぶき
  const partY = part === 'head' ? 1.7 : part === 'torso' ? 1.2 : part === 'lArm' || part === 'rArm' ? 1.3 : 0.5;
  const c = new THREE.Vector3(center.x, partY, center.z);
  spawnBloodGeyser(c, crit ? 50 : 28);
  if (crit) {
    // 致命傷っぽい大量血
    spawnBloodGeyser(c, 30);
  }
}

function spawnBloodGeyser(center, count) {
  for (let i=0; i<count; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.04 + Math.random()*0.05, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xb8181c })
    );
    s.position.copy(center);
    const speed = 4 + Math.random()*5;
    const angle = Math.random()*Math.PI*2;
    s.userData = {
      v: new THREE.Vector3(
        Math.cos(angle)*speed*0.4,
        2 + Math.random()*5,
        Math.sin(angle)*speed*0.4
      ),
      life: 0.9 + Math.random()*0.6,
      blood: true,
    };
    scene.add(s); sparkPool.push(s);
  }
  // ヒット衝撃のオレンジ火花
  for (let i=0; i<6; i++) {
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xffa050 })
    );
    s.position.copy(center);
    s.userData = { v: new THREE.Vector3((Math.random()-0.5)*5, 1+Math.random()*3, (Math.random()-0.5)*5), life: 0.3 };
    scene.add(s); sparkPool.push(s);
  }
}

// 床に小さい血だまり
function spawnBloodSplat(pos) {
  const splat = new THREE.Mesh(
    new THREE.CircleGeometry(0.3 + Math.random()*0.4, 14),
    new THREE.MeshBasicMaterial({ color: 0x8b1010, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  splat.rotation.x = -Math.PI/2;
  splat.position.set(pos.x, 0.02, pos.z);
  scene.add(splat);
  // 自動消去なしで床に残る
  setTimeout(()=>{
    // 30秒後フェード
    let op = 0.85;
    const fadeId = setInterval(()=>{
      op -= 0.05;
      splat.material.opacity = op;
      if (op <= 0) { clearInterval(fadeId); scene.remove(splat); splat.geometry.dispose(); splat.material.dispose(); }
    }, 100);
  }, 25000);
}
function spawnBloodDrip(pos) {
  const s = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0xa01010 })
  );
  s.position.copy(pos);
  s.userData = { v: new THREE.Vector3((Math.random()-0.5)*0.5, 0, (Math.random()-0.5)*0.5), life: 0.6, blood: true };
  scene.add(s); sparkPool.push(s);
}

function updateSparks(dt) {
  for (let i=sparkPool.length-1; i>=0; i--) {
    const s = sparkPool[i];
    s.userData.life -= dt;
    if (s.userData.life <= 0) {
      // 血なら床にスプラット残し
      if (s.userData.blood && s.position.y > 0.15) spawnBloodSplat(s.position);
      scene.remove(s); sparkPool.splice(i,1); continue;
    }
    s.userData.v.y -= 13*dt;
    s.position.addScaledVector(s.userData.v, dt);
    if (s.position.y < 0.05 && s.userData.blood) {
      spawnBloodSplat(s.position);
      scene.remove(s); sparkPool.splice(i,1); continue;
    }
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
  const mat = new THREE.LineBasicMaterial({ color: big ? 0xfff0a0 : 0xefe6d4, transparent: true, opacity: big? 0.95 : 0.75, linewidth: 2 });
  const line = new THREE.Line(geom, mat);
  line.userData = { life: big ? 0.32 : 0.20 };
  scene.add(line);
  trailLines.push(line);
}
function updateTrails(dt) {
  for (let i=trailLines.length-1; i>=0; i--) {
    const l = trailLines[i];
    l.userData.life -= dt;
    l.material.opacity = Math.max(0, l.userData.life*3);
    if (l.userData.life <= 0) { scene.remove(l); trailLines.splice(i,1); }
  }
}

function spawnThunder(fighter) {
  const center = fighter.getCenter();
  const light = new THREE.PointLight(0xc8e0ff, 6, 40, 2);
  light.position.set(center.x, 10, center.z);
  scene.add(light);
  setTimeout(()=>{ scene.remove(light); }, 280);
  const points = [];
  let x = center.x, z = center.z;
  for (let y=18; y>=0; y-=0.6) {
    x += (Math.random()-0.5)*0.6;
    z += (Math.random()-0.5)*0.6;
    points.push(new THREE.Vector3(x, y, z));
  }
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xeef4ff, transparent: true, opacity: 1 });
  const line = new THREE.Line(geom, mat);
  line.userData = { life: 0.45 };
  scene.add(line);
  trailLines.push(line);
  playSound('thunder');
  camState.shake = 0.5;
  bigVibrate();
}

// =================================================================
//  Projectiles
// =================================================================
const projectiles = [];
function spawnShuriken(owner, direction) {
  const geom = new THREE.OctahedronGeometry(0.14, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8, roughness: 0.3 });
  const m = new THREE.Mesh(geom, mat);
  m.position.copy(owner.getCenter()).add(direction.clone().multiplyScalar(0.6));
  m.position.y = 1.3;
  m.userData = { v: direction.clone().multiplyScalar(22), life: 2.0, owner };
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
    const target = p.userData.owner === player ? enemy : player;
    if (target && target.state !== 'dead') {
      const d = p.position.distanceTo(target.getCenter());
      if (d < 0.7) {
        target.takeHit(16, p.userData.owner, {});
        onHitEffect(target.getCenter(), false, 'torso');
        playSound('hit', 0.8);
        if (target === player) flashScreen();
        else if (p.userData.owner === player) hitVibrate(30);
        scene.remove(p); projectiles.splice(i,1);
        continue;
      }
    }
  }
}

// =================================================================
//  Sound
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
    o.type = 'sawtooth'; o.frequency.setValueAtTime(180, now); o.frequency.exponentialRampToValueAtTime(50, now+0.15);
    g.gain.setValueAtTime(0.35*gain, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.20);
    o.connect(g).connect(ctx.destination); o.start(now); o.stop(now+0.21);
  } else if (type === 'clang') {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(1800, now); o.frequency.exponentialRampToValueAtTime(800, now+0.12);
    g.gain.setValueAtTime(0.22*gain, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
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
//  Camera (Third-person, behind player's back) - Ragdoll Blade風に少し引いて全体を見せる
// =================================================================
const camState = {
  yaw: 0,            // プレイヤーの向き（背面方向）
  pitch: 0.36,       // 少し上から見下ろす (3/4視点に寄せる)
  distance: 9.5,     // 引いてキャラを小さく見せる
  height: 3.4,
  lookHeight: 1.25,
  shake: 0,
  hitStop: 0,        // ヒットストップ用 (タイムスケールに乗る)
};
function updateCamera() {
  if (!player) return;
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const yaw = camState.yaw;
  const pitch = camState.pitch;
  const dist = camState.distance;
  // カメラはプレイヤーの後ろ（yaw方向の反対側）
  const camX = px - Math.sin(yaw)*Math.cos(pitch)*dist;
  const camZ = pz - Math.cos(yaw)*Math.cos(pitch)*dist;
  const camY = camState.height + Math.sin(pitch)*dist*0.5;
  let sx=0, sy=0;
  if (camState.shake > 0) {
    // ragdoll blade的に揺れを少し大きめにし、減衰を緩く (爽快感重視)
    const amp = camState.shake;
    sx = (Math.random()-0.5)*amp*1.3;
    sy = (Math.random()-0.5)*amp*1.3;
    camState.shake = Math.max(0, camState.shake - 0.045);
  }
  camera.position.set(camX+sx, camY+sy, camZ);
  // プレイヤーより少し前方を見る（敵の方向）
  const lookFwdX = px + Math.sin(yaw)*3;
  const lookFwdZ = pz + Math.cos(yaw)*3;
  camera.lookAt(lookFwdX, camState.lookHeight, lookFwdZ);
}

// =================================================================
//  Mobile Input - One-Finger Unified Control (Ragdoll Blade style)
//  ── 1本指で「移動」と「刀振り」を兼ねる。指の速度で挙動が変わる。
//     ゆっくり    → キャラ移動 (指の方向へ歩く)
//     素早く払う  → 刀の一閃 (斬撃発動)
//     継続的にぐるぐる → 刀をぐるぐる回す (溜め)
// =================================================================
const touchState = {
  active: false,
  id: -1,
  startX: 0, startY: 0,   // 指の最初の位置 (相対移動の原点)
  curX: 0,   curY: 0,     // 現在の指の位置
  lastX: 0,  lastY: 0,    // 前フレームの位置
  vx: 0,     vy: 0,       // 瞬間速度 (px/frame)
  vMag: 0,                // 平滑化した速度
  vMagPeak: 0,            // 直近のピーク速度
  lastMoveTime: 0,
  lastSwingTime: 0,
  lastAng: undefined,
  totalMove: 0,
  // 移動方向 (画面座標 -1..1)
  moveDx: 0, moveDy: 0,
  moveMag: 0,
  moveRadius: 1,
};
// stickState はレガシー互換用 (使われなくなったが他コードからの参照を残すため)
const stickState = { active:false, dx:0, dy:0, mag:0 };
const swipeState = { active:false, vMag:0, lastSwingTime:0, lastAng:undefined };
const JUMP_POWER = 6.6;
const JUMP_FLICK_MIN_DY = -14;
const JUMP_FLICK_DIRECTIONAL_RATIO = 1.15;
const JUMP_FLICK_MIN_VELOCITY = 12;
const SLASH_DIR_MAX = 1.4;
const SLASH_DIR_SPEED_DIVISOR = 20;

// ─── Ragdoll Blade風: 1本指で「移動 + 刀振り」を兼ねる ─────────
// 指を画面に置く → 起点を記録
// 指をゆっくり動かす → キャラがその方向に歩く (起点からのオフセット = 移動方向)
// 指を素早く払う (高速度)   → 刀の一閃 (斬撃発動)
// 振った後も指を離さなければ続けて動かせる (連続戦闘)
// ボタン(必殺/避/受/薬) の上から始めたタッチは無視 (ボタン優先)
function setupUnifiedTouch() {
  function isOnUI(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    if (el.closest('.action-zone')) return true;
    if (el.closest('.item-bar')) return true;
    if (el.closest('.hud-top')) return true;
    return false;
  }

  function startTouch(clientX, clientY, id) {
    ensureAudio();
    if (!STATE.inGame) return false;
    if (isOnUI(clientX, clientY)) return false;
    touchState.active = true;
    touchState.id = id;
    touchState.startX = clientX;
    touchState.startY = clientY;
    touchState.curX = clientX;
    touchState.curY = clientY;
    touchState.lastX = clientX;
    touchState.lastY = clientY;
    touchState.vx = 0; touchState.vy = 0;
    touchState.vMag = 0;
    touchState.vMagPeak = 0;
    touchState.totalMove = 0;
    touchState.lastAng = undefined;
    touchState.lastMoveTime = performance.now();
    touchState.moveDx = 0; touchState.moveDy = 0; touchState.moveMag = 0;
    touchState.moveRadius = Math.min(140, Math.min(window.innerWidth, window.innerHeight) * 0.22);
    showFingerIndicator(clientX, clientY, 'idle');
    hideControlHint();
    // 旧API互換
    swipeState.active = true;
    return true;
  }

  function moveTouch(clientX, clientY) {
    if (!touchState.active) return;
    const now = performance.now();
    const dt = Math.max(1, now - touchState.lastMoveTime); // ms
    const dx = clientX - touchState.lastX;
    const dy = clientY - touchState.lastY;
    touchState.lastX = touchState.curX = clientX;
    touchState.lastY = touchState.curY = clientY;
    touchState.lastMoveTime = now;
    touchState.vx = dx;
    touchState.vy = dy;
    const mag = Math.hypot(dx, dy);
    // 指速度の指数移動平均 (反応速度と滑らかさの両立)
    touchState.vMag = touchState.vMag * 0.55 + mag * 0.45;
    touchState.vMagPeak = Math.max(touchState.vMagPeak * 0.92, touchState.vMag);
    touchState.totalMove += mag;
    swipeState.vMag = touchState.vMag; // 互換

    // 移動ベクトル: 起点からの相対 (デッドゾーン付き)
    const ox = clientX - touchState.startX;
    const oy = clientY - touchState.startY;
    const omag = Math.hypot(ox, oy);
    const maxR = touchState.moveRadius;
    const dead = 14;
    if (omag > dead) {
      const eff = Math.min(omag - dead, maxR) / maxR;
      touchState.moveDx = (ox / omag) * eff;
      touchState.moveDy = (oy / omag) * eff;
      touchState.moveMag = eff;
    } else {
      touchState.moveDx = 0; touchState.moveDy = 0; touchState.moveMag = 0;
    }
    // 互換用 (AI/ネット側で利用)
    stickState.dx = touchState.moveDx;
    stickState.dy = touchState.moveDy;
    stickState.mag = touchState.moveMag;

    // 刀の腕姿勢を指の動きに連動させる (Ragdoll Blade風の "腕が指に引っ張られる" 感じ)
    if (player && (player.state === 'idle' || player.state === 'guard')) {
      // 指の相対位置(起点基準)を刀の向きへ直接マップ（横・縦・斜めすべて対応）
      const targetYaw = Math.max(-1.5, Math.min(1.5, (ox / maxR) * 1.45));
      const targetPitch = Math.max(-1.35, Math.min(1.35, (oy / maxR) * 1.25));
      player.swingYaw = player.swingYaw * 0.62 + targetYaw * 0.38 + dx * 0.008;
      player.swingPitch = player.swingPitch * 0.62 + targetPitch * 0.38 + dy * 0.008;
      player.slashDirX = Math.max(-SLASH_DIR_MAX, Math.min(SLASH_DIR_MAX, dx / SLASH_DIR_SPEED_DIVISOR));
      player.slashDirY = Math.max(-SLASH_DIR_MAX, Math.min(SLASH_DIR_MAX, dy / SLASH_DIR_SPEED_DIVISOR));
      // ぐるぐる検出: 角度の連続変化で roll を貯める
      const ang = Math.atan2(dy, dx);
      if (touchState.lastAng !== undefined) {
        let da = ang - touchState.lastAng;
        while (da > Math.PI)  da -= Math.PI*2;
        while (da < -Math.PI) da += Math.PI*2;
        player.swingRoll = Math.max(-2.2, Math.min(2.2, player.swingRoll + da * 0.9));
      }
      touchState.lastAng = ang;

      // 上フリックでジャンプ
      const isUpwardFlick = dy < JUMP_FLICK_MIN_DY;
      const isVerticallyDominant = Math.abs(dy) > Math.abs(dx) * JUMP_FLICK_DIRECTIONAL_RATIO;
      const hasMinimumVelocity = touchState.vMag > JUMP_FLICK_MIN_VELOCITY;
      if (isUpwardFlick && isVerticallyDominant && hasMinimumVelocity) {
        if (player.jump(JUMP_POWER)) {
          playSound('dodge', 1.05);
          sendNet({ t: 'act', a: 'jump', p: JUMP_POWER });
          showFingerIndicator(clientX, clientY, 'swing');
        }
      }

      // 速度が一定以上 → 斬撃発動 (フリック判定)
      const SWING_THRESHOLD = 16;   // 軽斬り
      const HEAVY_THRESHOLD = 44;   // 強斬り
      if (touchState.vMag > SWING_THRESHOLD && (now - touchState.lastSwingTime) > 230) {
        touchState.lastSwingTime = now;
        swipeState.lastSwingTime = now;
        const heavy = touchState.vMag > HEAVY_THRESHOLD;
        if (player.attack(heavy ? 'heavy' : 'light')) {
          addSlashTrail(player, heavy);
          playSound('swing', heavy ? 1.4 : 1.0);
          sendNet({ t: 'act', a: heavy ? 'heavy' : 'light' });
          // 振りインジケータを光らせる
          showFingerIndicator(clientX, clientY, 'swing');
        }
      } else {
        // 速度に応じて移動 or 待機の見た目を切替
        showFingerIndicator(clientX, clientY, touchState.moveMag > 0.05 ? 'walk' : 'idle');
      }
    } else {
      showFingerIndicator(clientX, clientY, 'idle');
    }
  }

  function endTouch() {
    touchState.active = false;
    touchState.id = -1;
    touchState.vMag = 0;
    touchState.vMagPeak = 0;
    touchState.moveDx = 0; touchState.moveDy = 0; touchState.moveMag = 0;
    touchState.lastAng = undefined;
    stickState.dx = 0; stickState.dy = 0; stickState.mag = 0;
    swipeState.active = false;
    swipeState.vMag = 0;
    hideFingerIndicator();
  }

  // タッチイベント
  canvas.addEventListener('touchstart', (e) => {
    if (!STATE.inGame) return;
    for (const t of e.changedTouches) {
      if (touchState.active) break;
      if (startTouch(t.clientX, t.clientY, t.identifier)) { e.preventDefault(); break; }
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (!touchState.active) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== touchState.id) continue;
      moveTouch(t.clientX, t.clientY);
      e.preventDefault();
      break;
    }
  }, { passive: false });

  function onTouchEnd(e) {
    if (!touchState.active) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== touchState.id) continue;
      endTouch();
      e.preventDefault();
      break;
    }
  }
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

  // マウス (デバッグ・PC)
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    startTouch(e.clientX, e.clientY, -3);
  });
  window.addEventListener('mousemove', (e) => {
    if (!touchState.active || touchState.id !== -3) return;
    moveTouch(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', (e) => {
    if (touchState.active && touchState.id === -3) endTouch();
  });
}

// 指インジケータ表示制御
function showFingerIndicator(x, y, mode) {
  const el = document.getElementById('finger-indicator');
  if (!el) return;
  el.style.transform = `translate(${x}px, ${y}px)`;
  el.classList.remove('hidden', 'swing', 'walk');
  if (mode === 'swing') el.classList.add('swing');
  else if (mode === 'walk') el.classList.add('walk');
}
function hideFingerIndicator() {
  const el = document.getElementById('finger-indicator');
  el?.classList.add('hidden');
  el?.classList.remove('swing', 'walk');
}
let _controlHintShown = false;
function showControlHint() {
  if (_controlHintShown) return;
  _controlHintShown = true;
  const el = document.getElementById('control-hint');
  if (!el) return;
  el.classList.add('show');
  clearTimeout(showControlHint._t);
  showControlHint._t = setTimeout(() => el.classList.remove('show'), 4200);
}
function hideControlHint() {
  const el = document.getElementById('control-hint');
  el?.classList.remove('show');
}

// 旧 setupSwipeSword は no-op (canvas タッチは setupUnifiedTouch に統合)
function setupSwipeSword() { /* deprecated */ }

// アクションボタン
function setupActionButtons() {
  function bindHold(el, onDown, onUp) {
    if (!el) return;
    el.addEventListener('touchstart', e => { ensureAudio(); onDown(); e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend',   e => { onUp&&onUp(); e.preventDefault(); }, { passive: false });
    el.addEventListener('mousedown',  e => { ensureAudio(); onDown(); });
    el.addEventListener('mouseup',    e => { onUp&&onUp(); });
    el.addEventListener('mouseleave', e => { onUp&&onUp(); });
  }
  const btnGuard = document.getElementById('btn-guard');
  bindHold(btnGuard,
    () => { if (player) { player.guard(true); sendNet({ t: 'act', a: 'guard', v: true }); } },
    () => { if (player) { player.guard(false); sendNet({ t: 'act', a: 'guard', v: false }); } }
  );
  const btnDodge = document.getElementById('btn-dodge');
  btnDodge?.addEventListener('touchstart', e => {
    ensureAudio();
    if (!player) return;
    const dir = getMoveDirVector();
    if (dir.lengthSq() < 0.01) dir.set(Math.sin(camState.yaw+Math.PI), 0, Math.cos(camState.yaw+Math.PI));
    if (player.dodge(dir)) sendNet({ t: 'act', a: 'dodge', dx: dir.x, dz: dir.z });
    e.preventDefault();
  }, { passive: false });
  btnDodge?.addEventListener('click', e => {
    ensureAudio();
    if (!player) return;
    const dir = getMoveDirVector();
    if (dir.lengthSq() < 0.01) dir.set(Math.sin(camState.yaw+Math.PI), 0, Math.cos(camState.yaw+Math.PI));
    if (player.dodge(dir)) sendNet({ t: 'act', a: 'dodge', dx: dir.x, dz: dir.z });
  });

  const btnSpecial = document.getElementById('btn-special');
  function doSpecial() {
    ensureAudio();
    if (!player) return;
    if (player.special()) {
      addSlashTrail(player, true);
      playSound('swing', 1.6);
      camState.shake = 0.4;
      bigVibrate();
      sendNet({ t: 'act', a: 'special' });
    }
  }
  btnSpecial?.addEventListener('touchstart', e => { doSpecial(); e.preventDefault(); }, { passive: false });
  btnSpecial?.addEventListener('click', doSpecial);

  const btnItem = document.getElementById('btn-item');
  function doItem() { ensureAudio(); if (player) useCurrentItem(player); }
  btnItem?.addEventListener('touchstart', e => { doItem(); e.preventDefault(); }, { passive: false });
  btnItem?.addEventListener('click', doItem);

  const btnJump = document.getElementById('btn-jump');
  function doJump() {
    ensureAudio();
    if (!player) return;
    if (player.jump(JUMP_POWER)) {
      playSound('dodge', 1.05);
      sendNet({ t: 'act', a: 'jump', p: JUMP_POWER });
    }
  }
  btnJump?.addEventListener('touchstart', e => { doJump(); e.preventDefault(); }, { passive: false });
  btnJump?.addEventListener('click', doJump);

  const btnMenu = document.getElementById('btn-menu');
  btnMenu?.addEventListener('click', () => exitToMenu());
}

function getMoveDirVector() {
  // 指の起点からの相対オフセット(touchState.moveDx/Dy) をワールド座標に変換 (カメラのyaw基準)
  // 指が速く動いている瞬間 (=刀振り中) は移動量を抑える → 振りと歩きの干渉を減らす
  const dir = new THREE.Vector3();
  if (!touchState.active || touchState.moveMag < 0.05) return dir;
  // 刀の高速スイング中は移動寄与を減らす (停止に近づける)
  const swingDamp = Math.max(0, 1 - touchState.vMag / 60);
  const yaw = camState.yaw;
  const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  // 指を画面奥(上方向=dy負)へ動かしたら前進、横は左右に対応
  dir.addScaledVector(fwd, -touchState.moveDy * swingDamp);
  dir.addScaledVector(right, touchState.moveDx * swingDamp);
  return dir;
}

setupUnifiedTouch();
setupActionButtons();

// キーボード対応 (任意)
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; ensureAudio(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('keydown', (e) => {
  if (!STATE.inGame) return;
  if (e.code === 'Escape') exitToMenu();
  else if (e.code === 'KeyQ') {
    if (player && player.special()) { addSlashTrail(player, true); playSound('swing', 1.6); camState.shake = 0.4; bigVibrate(); sendNet({ t: 'act', a: 'special' }); }
  } else if (e.code === 'Space') {
    if (!player) return;
    const dir = new THREE.Vector3(Math.sin(camState.yaw+Math.PI), 0, Math.cos(camState.yaw+Math.PI));
    if (player.dodge(dir)) sendNet({ t: 'act', a: 'dodge', dx: dir.x, dz: dir.z });
  } else if (e.code === 'KeyE') {
    if (player) useCurrentItem(player);
  } else if (e.code === 'KeyF') {
    if (player) player.guard(!player.guardActive);
  } else if (e.code === 'KeyR') {
    if (player && player.jump(JUMP_POWER)) { playSound('dodge', 1.05); sendNet({ t: 'act', a: 'jump', p: JUMP_POWER }); }
  }
});

// =================================================================
//  Items
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
    slot.innerHTML = `<div class="item-icon">${it.icon}</div><div class="item-count">${count}</div>`;
    slot.addEventListener('click', () => {
      if (!player) return;
      player.itemKey = idx;
      updateItemBar();
      useCurrentItem(player);
    });
    bar.appendChild(slot);
  });
}

// =================================================================
//  AI
// =================================================================
class AIController {
  constructor(self, target) {
    this.self = self; this.target = target;
    this.decisionTimer = 0; this.action = 'approach';
    this.actionTime = 0; this.reactionTimer = 0;
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

    if ((this.target.state === 'attack' || this.target.state === 'heavy') && this.reactionTimer <= 0) {
      this.reactionTimer = 0.4 + Math.random()*0.4;
      if (Math.random() < 0.45 && dist < reach + 1.4) {
        const sideDir = new THREE.Vector3(Math.cos(this.self.facing), 0, -Math.sin(this.self.facing));
        if (Math.random()<0.5) sideDir.multiplyScalar(-1);
        this.self.dodge(sideDir);
        return;
      } else if (Math.random() < 0.5) {
        this.self.guard(true);
        setTimeout(()=>{ if (this.self.state==='guard') this.self.guard(false); }, 380);
      }
    }

    if (this.itemTimer <= 0) {
      this.itemTimer = 5 + Math.random()*5;
      if (this.self.hp < 40 && this.self.items.potion > 0) {
        this.self.itemKey = 0; useCurrentItem(this.self);
      } else if (this.self.ki >= this.self.maxKi*0.9 && Math.random() < 0.5) {
        if (dist < reach*1.1) { this.self.special(); addSlashTrail(this.self, true); }
      } else if (Math.random() < 0.4 && this.self.items.shuriken > 0 && dist > 3) {
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
      const speed = 3.0;
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
//  Rounds
// =================================================================
let roundActive = false;

function resetPlayerCombo() {
  STATE.combo = 0;
  STATE.comboExpireAt = 0;
}

function registerPlayerCombo() {
  const now = performance.now();
  STATE.combo = (now <= STATE.comboExpireAt) ? (STATE.combo + 1) : 1;
  STATE.comboExpireAt = now + COMBO_WINDOW_MS;
  STATE.bestCombo = Math.max(STATE.bestCombo, STATE.combo);
  player.ki = Math.min(player.maxKi, player.ki + Math.min(STATE.combo * 0.7, 6));
  if (STATE.combo >= FEVER_TRIGGER_COMBO && now >= STATE.feverUntil) {
    STATE.feverUntil = now + FEVER_DURATION_MS;
    player.boostUntil = Math.max(player.boostUntil, STATE.feverUntil);
    showCenterMsg('覚醒！', 900);
    playSound('item', 1.15);
    slashVibrate('strong');
  }
}

function startRound() {
  player.mesh.position.set(0, 0, 4);
  enemy.mesh.position.set(0, 0, -4);
  player.setStance(Math.PI);
  enemy.setStance(0);
  player.hp = player.maxHp; enemy.hp = enemy.maxHp;
  player.state = 'idle'; enemy.state = 'idle';
  player.stamina = player.maxStamina; enemy.stamina = enemy.maxStamina;
  player.ki = 0; enemy.ki = 0;
  resetPlayerCombo();
  STATE.feverUntil = 0;
  player.swingYaw = 0; player.swingPitch = 0; player.swingRoll = 0;
  player.mesh.rotation.x = 0; enemy.mesh.rotation.x = 0;
  player.mesh.userData.severed = { head:false, lArm:false, rArm:false };
  enemy.mesh.userData.severed = { head:false, lArm:false, rArm:false };
  camState.yaw = Math.PI; camState.pitch = 0.20;
  // debris クリア
  for (const d of debrisList) scene.remove(d);
  debrisList.length = 0;
  // 画面血消す
  const bo = document.getElementById('blood-overlay');
  bo?.classList.remove('show'); bo?.classList.remove('fade');
  updateHUD();
  updateItemBar();
  document.getElementById('round-text').textContent = `第 ${['一','二','三','四','五'][STATE.round-1]||STATE.round} 番`;
  document.getElementById('score-text').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
  showCenterMsg('始め！', 800);
  playSound('start');
  roundActive = true;
}

function endRound(winnerIsPlayer) {
  if (!roundActive) return;
  roundActive = false;
  camState.shake = 0.55;
  bigVibrate();
  if (winnerIsPlayer) STATE.myScore++; else STATE.enemyScore++;
  showCenterMsg(winnerIsPlayer ? '勝！' : '敗！', 1400);
  if (STATE.conn && STATE.isHost) {
    const over = STATE.myScore >= 2 || STATE.enemyScore >= 2;
    sendNet({ t: 'round', myScore: STATE.enemyScore, enemyScore: STATE.myScore, round: STATE.round+1, over });
  }
  setTimeout(() => {
    if (STATE.myScore >= 2 || STATE.enemyScore >= 2) showResult();
    else { STATE.round++; startRound(); }
  }, 1800);
}

function showResult() {
  STATE.inGame = false;
  document.getElementById('hud').classList.add('hidden');
  const won = STATE.myScore > STATE.enemyScore;
  document.getElementById('result-title').textContent = won ? '勝' : '敗';
  document.getElementById('result-title').style.color = won ? '#8b2e2e' : '#3a2a18';
  document.getElementById('result-score').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
  document.getElementById('result-stats').innerHTML = `斬撃命中 ${STATE.hits} ／ 会心 ${STATE.crits} ／ 受け ${STATE.blocks} ／ 部位切断 ${STATE.dismembers} ／ 最大連撃 ${STATE.bestCombo}`;
  document.getElementById('result').classList.remove('hidden');
  playSound(won ? 'win' : 'lose');
  document.getElementById('kill-vignette')?.classList.remove('active');
}

function exitToMenu() {
  STATE.inGame = false;
  roundActive = false;
  STATE.myScore = 0; STATE.enemyScore = 0; STATE.round = 1;
  STATE.hits = 0; STATE.crits = 0; STATE.blocks = 0; STATE.dismembers = 0;
  resetPlayerCombo();
  STATE.bestCombo = 0;
  STATE.feverUntil = 0;
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('kill-vignette')?.classList.remove('active');
  document.getElementById('blood-overlay')?.classList.remove('show');
  if (STATE.conn) { try { STATE.conn.close(); } catch(e){} STATE.conn = null; }
  if (STATE.peer) { try { STATE.peer.destroy(); } catch(e){} STATE.peer = null; }
}

function updateHUD() {
  if (!player || !enemy) return;
  document.getElementById('hp-fill-l').style.width = `${(player.hp/player.maxHp)*100}%`;
  document.getElementById('hp-fill-r').style.width = `${(enemy.hp/enemy.maxHp)*100}%`;
  document.getElementById('stam-fill-l').style.width = `${(player.stamina/player.maxStamina)*100}%`;
  document.getElementById('stam-fill-r').style.width = `${(enemy.stamina/enemy.maxStamina)*100}%`;
  document.getElementById('ki-fill-l').style.width = `${(player.ki/player.maxKi)*100}%`;
  document.getElementById('ki-fill-r').style.width = `${(enemy.ki/enemy.maxKi)*100}%`;
  document.getElementById('score-text').textContent = `${STATE.myScore} - ${STATE.enemyScore}`;
  const comboEl = document.getElementById('combo-text');
  if (comboEl) {
    const fever = performance.now() < STATE.feverUntil;
    comboEl.classList.toggle('fever', fever);
    if (STATE.combo >= 2) comboEl.textContent = fever ? `${STATE.combo} 連撃 - 覚醒中` : `${STATE.combo} 連撃`;
    else comboEl.textContent = fever ? '覚醒中' : '';
  }
  // 必殺ボタン光らせる
  const spBtn = document.getElementById('btn-special');
  if (spBtn) spBtn.classList.toggle('ready', player.ki >= player.maxKi);
  // ビネット
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
  setTimeout(() => f.classList.remove('active'), 100);
  camState.shake = 0.32;
}

function showBloodOverlay() {
  const bo = document.getElementById('blood-overlay');
  if (!bo) return;
  bo.classList.remove('fade');
  bo.classList.add('show');
  clearTimeout(showBloodOverlay._t);
  showBloodOverlay._t = setTimeout(() => {
    bo.classList.add('fade');
    bo.classList.remove('show');
  }, 600);
}

// =================================================================
//  Start
// =================================================================
function startGame(mode) {
  STATE.mode = mode;
  STATE.inGame = true;
  STATE.myScore = 0; STATE.enemyScore = 0; STATE.round = 1;
  STATE.hits = 0; STATE.crits = 0; STATE.blocks = 0; STATE.dismembers = 0;
  resetPlayerCombo();
  STATE.bestCombo = 0;
  STATE.feverUntil = 0;
  const mapDef = MAPS.find(m=>m.id===STATE.mapId) || MAPS[0];
  buildArena(mapDef);
  spawnFighters(STATE.swordId, STATE.enemySwordId);
  if (mode === 'ai') ai = new AIController(enemy, player);
  else ai = null;
  hideAllOverlays();
  document.getElementById('hud').classList.remove('hidden');
  _controlHintShown = false;
  showControlHint();
  startRound();
  // 横向き推奨
  try {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{});
  } catch(e){}
}

function hideAllOverlays() {
  ['loading','menu','sword-select','map-select','room-join','room-host','result'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

// =================================================================
//  Loop
// =================================================================
let lastTime = performance.now();
function loop() {
  const now = performance.now();
  let dt = Math.min(0.05, (now - lastTime)/1000);
  lastTime = now;

  // ヒットストップ: 一瞬時間が止まる (ragdoll blade風の "切った瞬間" の手応え)
  if (camState.hitStop > 0) {
    camState.hitStop = Math.max(0, camState.hitStop - dt);
    // ゲームロジック側は dt を 0 に近づけて静止 (描画とカメラシェイクは生かす)
    dt = dt * 0.05;
  }

  if (STATE.inGame && player && enemy) {
    if (STATE.combo > 0 && performance.now() > STATE.comboExpireAt) resetPlayerCombo();
    // プレイヤー移動 (スティック入力)
    if (player.state === 'idle' || player.state === 'guard') {
      const dir = getMoveDirVector();
      const mapDef = MAPS.find(m=>m.id===STATE.mapId) || MAPS[0];
      const moveMult = mapDef.moveMult || 1.0;
      const baseSpeed = (player.state === 'guard') ? 1.8 : 3.8;
      const speed = baseSpeed * moveMult * (performance.now() < player.boostUntil ? 1.2 : 1.0);
      if (dir.lengthSq() > 0.01) {
        const mag = Math.min(1, dir.length());
        dir.normalize();
        player.mesh.position.x += dir.x * speed * mag * dt;
        player.mesh.position.z += dir.z * speed * mag * dt;
        player.velocity.set(dir.x*speed*mag, 0, dir.z*speed*mag);
      } else {
        player.velocity.set(0,0,0);
      }
    }
    // 状態に関わらず常に相手方向へ向き、カメラを背中側へ追従させる
    if (player.state !== 'dead' && enemy.state !== 'dead') {
      const towardEnemyYaw = Math.atan2(
        enemy.mesh.position.x - player.mesh.position.x,
        enemy.mesh.position.z - player.mesh.position.z
      );
      player.setStance(towardEnemyYaw);
      camState.yaw = towardEnemyYaw;
    }
    // リング内クランプ
    const px = player.mesh.position.x, pz = player.mesh.position.z;
    const d = Math.hypot(px, pz);
    if (d > RING_RADIUS - 0.5) {
      player.mesh.position.x = px * (RING_RADIUS-0.5)/d;
      player.mesh.position.z = pz * (RING_RADIUS-0.5)/d;
    }
    const ex = enemy.mesh.position.x, ez = enemy.mesh.position.z;
    const ed = Math.hypot(ex, ez);
    if (ed > RING_RADIUS - 0.5) {
      enemy.mesh.position.x = ex * (RING_RADIUS-0.5)/ed;
      enemy.mesh.position.z = ez * (RING_RADIUS-0.5)/ed;
    }
    // 重なり防止
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
      sendNet({ t: 'pose', x: player.mesh.position.x, y: player.mesh.position.y, z: player.mesh.position.z, f: player.facing });
    }

    player.update(dt);
    enemy.update(dt);
    updateHUD();

    // 指を離した時の刀の戻り (構えに戻る)
    if (!touchState.active && player.state === 'idle') {
      player.swingYaw   *= 0.82;
      player.swingPitch *= 0.82;
      player.swingRoll  *= 0.82;
      player.slashDirX *= 0.75;
      player.slashDirY *= 0.75;
    }
    // 触れていない時の vMag 減衰 (誤発火防止)
    if (!touchState.active) {
      touchState.vMag *= 0.7;
      touchState.vMagPeak *= 0.8;
    }

    if (roundActive && (player.hp <= 0 || enemy.hp <= 0)) {
      endRound(enemy.hp <= 0);
    }

    updateCamera();
    updateSparks(dt);
    updateTrails(dt);
    updateProjectiles(dt);
    updateDebris(dt);
    updateWeather(dt);
  } else {
    // メニュー時のカメラ回転
    const t = performance.now()/1000;
    camera.position.set(Math.sin(t*0.1)*14, 6, Math.cos(t*0.1)*14);
    camera.lookAt(0, 1.4, 0);
    updateWeather(dt);
  }

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
//  Sword Select UI
// =================================================================
function setupSwordSelect() {
  const list = document.getElementById('sword-list');
  list.innerHTML = '';
  SWORDS.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'sword-card' + (s.id === STATE.swordId ? ' selected' : '');
    card.dataset.id = s.id;
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
  if (STATE.mode === 'ai' || STATE.mode === 'practice') {
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

// キーボード Enter / 矢印
document.addEventListener('keydown', (e) => {
  const ss = document.getElementById('sword-select');
  const ms = document.getElementById('map-select');
  if (ss && !ss.classList.contains('hidden')) {
    const idx = SWORDS.findIndex(s=>s.id===STATE.swordId);
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { selectSword(SWORDS[(idx+1)%SWORDS.length].id); e.preventDefault(); }
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { selectSword(SWORDS[(idx-1+SWORDS.length)%SWORDS.length].id); e.preventDefault(); }
    else if (e.code === 'Enter') { confirmSword(); e.preventDefault(); }
  } else if (ms && !ms.classList.contains('hidden')) {
    const idx = MAPS.findIndex(m=>m.id===STATE.mapId);
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { selectMap(MAPS[(idx+1)%MAPS.length].id); e.preventDefault(); }
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { selectMap(MAPS[(idx-1+MAPS.length)%MAPS.length].id); e.preventDefault(); }
    else if (e.code === 'Enter') { confirmMap(); e.preventDefault(); }
  }
});

// =================================================================
//  Map Select
// =================================================================
function makeMapThumb(mapDef) {
  const c = document.createElement('canvas');
  c.width = 280; c.height = 70;
  const ctx = c.getContext('2d');
  const sky = '#' + mapDef.sky.toString(16).padStart(6,'0');
  const g = ctx.createLinearGradient(0,0,0,70);
  g.addColorStop(0, sky); g.addColorStop(1, '#3a2418');
  ctx.fillStyle = g; ctx.fillRect(0,0,280,70);
  const fl = { dojo:'#7a5a3a', sakura:'#a0786a', snow:'#e0e8f0', castle:'#1e1818', bamboo:'#3a5028', beach:'#d8b888', hell:'#4a1818' }[mapDef.id] || '#666';
  ctx.fillStyle = fl; ctx.fillRect(0, 46, 280, 24);
  if (mapDef.id === 'dojo') {
    ctx.fillStyle = '#e8c070';
    ctx.fillRect(40, 22, 12, 14); ctx.fillRect(220, 22, 12, 14);
  } else if (mapDef.id === 'sakura') {
    for (let i=0;i<22;i++) { ctx.fillStyle = `rgba(255,184,200,${0.5+Math.random()*0.5})`; ctx.fillRect(Math.random()*280, Math.random()*46, 3, 3); }
    ctx.fillStyle = '#ffb8c8'; ctx.beginPath(); ctx.arc(60, 28, 14, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(200, 28, 14, 0, Math.PI*2); ctx.fill();
  } else if (mapDef.id === 'snow') {
    ctx.fillStyle = '#eef4ff';
    for (let i=0;i<3;i++) { ctx.beginPath(); ctx.moveTo(50+i*70, 46); ctx.lineTo(60+i*70, 20); ctx.lineTo(70+i*70, 46); ctx.fill(); }
  } else if (mapDef.id === 'castle') {
    ctx.fillStyle = '#403020'; ctx.fillRect(110, 18, 60, 30);
    ctx.fillStyle = '#2a1418'; ctx.beginPath(); ctx.moveTo(105, 22); ctx.lineTo(140, 8); ctx.lineTo(175, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff7028'; ctx.beginPath(); ctx.arc(40, 40, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(240, 40, 3, 0, Math.PI*2); ctx.fill();
  } else if (mapDef.id === 'bamboo') {
    for (let i=0;i<8;i++) { ctx.fillStyle = '#5a8038'; ctx.fillRect(20+i*32, 8, 4, 50); }
  } else if (mapDef.id === 'beach') {
    ctx.fillStyle = '#4878a0'; ctx.fillRect(0, 38, 280, 10);
    ctx.fillStyle = '#b02828'; ctx.fillRect(100, 18, 4, 30); ctx.fillRect(176, 18, 4, 30); ctx.fillRect(94, 14, 92, 5);
  } else if (mapDef.id === 'hell') {
    for (let i=0;i<5;i++) { ctx.fillStyle = '#ff3030'; ctx.beginPath(); ctx.arc(40+i*50, 30, 4, 0, Math.PI*2); ctx.fill(); }
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
//  Menu wiring
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
document.getElementById('result-menu').addEventListener('click', () => exitToMenu());

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
  STATE.peer.on('open', () => { document.getElementById('host-status').textContent = '部屋を開きました。合言葉を伝えてください。'; });
  STATE.peer.on('error', (err) => { console.error(err); document.getElementById('host-status').textContent = 'エラー: ' + err.type; });
  STATE.peer.on('connection', (conn) => {
    STATE.conn = conn;
    conn.on('open', () => { conn.send({ t: 'hello', name: STATE.playerName, sword: STATE.swordId, map: STATE.mapId }); });
    conn.on('data', (data) => onNetData(data));
    conn.on('close', () => { showCenterMsg('相手が抜けました', 2000); setTimeout(exitToMenu, 1500); });
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
    conn.on('close', () => { showCenterMsg('相手が抜けました', 2000); setTimeout(exitToMenu, 1500); });
    conn.on('error', (err) => { document.getElementById('join-status').textContent = 'エラー: ' + err; });
  });
  STATE.peer.on('error', (err) => { console.error(err); document.getElementById('join-status').textContent = '接続失敗: ' + err.type; });
}
function sendNet(msg) {
  if (STATE.conn && STATE.conn.open) { try { STATE.conn.send(msg); } catch(e){} }
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
      enemy.mesh.position.y = data.y ?? enemy.mesh.position.y;
      enemy.mesh.position.z = data.z;
      enemy.facing = data.f;
      enemy.mesh.rotation.y = data.f;
    }
  } else if (data.t === 'state' && !STATE.isHost) {
      if (player && enemy) {
        enemy.mesh.position.x = data.host.x;
        enemy.mesh.position.y = data.host.y ?? enemy.mesh.position.y;
        enemy.mesh.position.z = data.host.z;
        enemy.facing = data.host.f;
        enemy.mesh.rotation.y = data.host.f;
        enemy.hp = data.host.hp;
        player.hp = data.guest.hp;
        player.mesh.position.y = data.guest.y ?? player.mesh.position.y;
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
      else if (data.a === 'jump') { enemy.jump(data.p || JUMP_POWER); }
    }
  } else if (data.t === 'item') {
    const other = STATE.isHost ? enemy : player;
    if (other) {
      if (data.id === 'shuriken') {
        const dir = new THREE.Vector3(Math.sin(other.facing), 0, Math.cos(other.facing));
        spawnShuriken(other, dir);
      } else if (data.id === 'smoke') { other.smokeUntil = performance.now() + 2500; spawnSmoke(other); }
      else if (data.id === 'potion') onItemEffect(other, 0x44d266);
      else if (data.id === 'kiboost') onItemEffect(other, 0xd3b54a);
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
      host: { x: player.mesh.position.x, y: player.mesh.position.y, z: player.mesh.position.z, f: player.facing, hp: player.hp, state: player.state, guard: player.guardActive, stamina: player.stamina, ki: player.ki },
      guest:{ x: enemy.mesh.position.x, y: enemy.mesh.position.y, z: enemy.mesh.position.z, f: enemy.facing, hp: enemy.hp, state: enemy.state, guard: enemy.guardActive, stamina: enemy.stamina, ki: enemy.ki }
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
