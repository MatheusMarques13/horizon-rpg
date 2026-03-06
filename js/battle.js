// === BATTLE ENGINE ===
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');
let W, H, heroSprite, gobSprite;
let animFrame = 0, heroShake = 0, enemyShake = 0, heroFlash = 0, enemyFlash = 0;
let heroAttacking = false, enemyAttacking = false, atkT = 0;
let heroX, heroY, enemyX, enemyY, capeWave = 0;

function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  heroX = W * 0.25; heroY = H * 0.50;
  enemyX = W * 0.72; enemyY = H * 0.42;
}
window.addEventListener('resize', resizeCanvas);

function initSprites() {
  heroSprite = createSprite(heroPixels, HERO_PALETTE, 4);
  gobSprite = createSprite(gobPixels, GOBLIN_PALETTE, 4);
}

// === DRAWING ===
function drawGround() {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  sky.addColorStop(0, '#080612'); sky.addColorStop(0.5, '#1a1428'); sky.addColorStop(1, '#2a1f3a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.5);
  const grd = ctx.createLinearGradient(0, H * 0.45, 0, H);
  grd.addColorStop(0, '#1a2010'); grd.addColorStop(0.3, '#1f2a14'); grd.addColorStop(1, '#0a0f06');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(-50, H * 0.48); ctx.lineTo(W + 50, H * 0.45); ctx.lineTo(W + 50, H); ctx.lineTo(-50, H); ctx.fill();
  ctx.strokeStyle = 'rgba(200,170,110,0.04)'; ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) { const y = H * 0.48 + i * (H * 0.06); const sq = 1 - (i / 20); ctx.beginPath(); ctx.moveTo(W * 0.5 - W * sq * 0.6, y); ctx.lineTo(W * 0.5 + W * sq * 0.6, y); ctx.stroke(); }
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(W * 0.5 + i * 40, H * 0.45); ctx.lineTo(W * 0.5 + i * 180, H); ctx.stroke(); }
  const hg = ctx.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, W * 0.4);
  hg.addColorStop(0, 'rgba(200,170,110,0.06)'); hg.addColorStop(1, 'transparent');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(200,180,140,0.3)';
  for (let i = 0; i < 50; i++) { const sx = ((42 * i * 7 + 13) % 1000) / 1000 * W; const sy = ((42 * i * 3 + 37) % 1000) / 1000 * H * 0.4; ctx.fillRect(Math.floor(sx), Math.floor(sy), ((i % 3) + 1) * 0.5, ((i % 3) + 1) * 0.5); }
  ctx.fillStyle = '#12101a'; ctx.beginPath(); ctx.moveTo(0, H * 0.48);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, H * 0.46 - Math.sin(x * 0.005) * 20 - Math.sin(x * 0.012) * 15 - Math.sin(x * 0.003) * 30);
  ctx.lineTo(W, H * 0.48); ctx.fill();
}

function drawShadow(x, y, w) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 5, w * 0.4, w * 0.1, 0, 0, Math.PI * 2); ctx.fill(); }
function getIdle(t, sp) { return Math.sin(t * sp) * 3; }
function drawFlash(sprite, x, y) { const tc = document.createElement('canvas'); tc.width = sprite.width; tc.height = sprite.height; const tctx = tc.getContext('2d'); tctx.drawImage(sprite, 0, 0); tctx.globalCompositeOperation = 'source-atop'; tctx.fillStyle = 'rgba(255,255,255,0.7)'; tctx.fillRect(0, 0, tc.width, tc.height); ctx.drawImage(tc, x - tc.width / 2, y - tc.height); }

function drawCapeTrail(x, y) {
  capeWave += 0.04; ctx.save(); ctx.globalAlpha = 0.45;
  const colors = ['#69292f','#69292f','#572125','#572125','#422626','#422626','#361f21','#361f21'];
  for (let i = 0; i < 8; i++) {
    const wave = Math.sin(capeWave + i * 0.6) * (4 + i * 2);
    const cx = x + heroSprite.width * 0.25 + i * 8 + wave;
    const cy = y - heroSprite.height * 0.6 + i * 22;
    ctx.fillStyle = colors[i]; ctx.fillRect(Math.floor(cx), Math.floor(cy), 14 - i, 14 - i);
  }
  ctx.restore();
}

function drawSlash(x, y) {
  ctx.save(); ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 2; ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.moveTo(x - 25, y - 40); ctx.lineTo(x + 30, y + 30); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(x - 18, y - 45); ctx.lineTo(x + 35, y + 20); ctx.stroke();
  ctx.restore();
}

function drawBattle() {
  ctx.clearRect(0, 0, W, H); drawGround(); animFrame++;
  const hi = getIdle(animFrame, 0.04), ei = getIdle(animFrame + 50, 0.05);
  let hx = heroX + heroShake, hy = heroY + hi, ex = enemyX + enemyShake, ey = enemyY + ei;
  if (heroAttacking) { atkT++; if (atkT < 8) hx += atkT * 12; else if (atkT < 16) hx += (16 - atkT) * 12; else { heroAttacking = false; atkT = 0; } }
  if (enemyAttacking) { atkT++; if (atkT < 8) ex -= atkT * 8; else if (atkT < 16) ex -= (16 - atkT) * 8; else { enemyAttacking = false; atkT = 0; } }
  drawCapeTrail(hx, hy);
  drawShadow(hx, hy + 4, heroSprite.width * 0.55);
  if (heroFlash > 0) { drawFlash(heroSprite, hx, hy); heroFlash--; } else ctx.drawImage(heroSprite, hx - heroSprite.width / 2, hy - heroSprite.height);
  if (heroAttacking && atkT >= 6 && atkT <= 12) drawSlash(hx + heroSprite.width * 0.55, hy - heroSprite.height * 0.4);
  drawShadow(ex, ey + 4, gobSprite.width * 0.55);
  if (enemyFlash > 0) { drawFlash(gobSprite, ex, ey); enemyFlash--; } else { ctx.save(); ctx.translate(ex + gobSprite.width / 2, ey - gobSprite.height); ctx.scale(-1, 1); ctx.drawImage(gobSprite, 0, 0); ctx.restore(); }
  if (heroShake !== 0) { heroShake *= -0.7; if (Math.abs(heroShake) < 0.5) heroShake = 0; }
  if (enemyShake !== 0) { enemyShake *= -0.7; if (Math.abs(enemyShake) < 0.5) enemyShake = 0; }
  requestAnimationFrame(drawBattle);
}

// === GAME LOGIC ===
const enemyTypes = [
  { name: 'Goblin', hp: 50, atk: 8 },
  { name: 'Goblin Guerreiro', hp: 70, atk: 12 },
  { name: 'Goblin Xamã', hp: 60, atk: 16 },
  { name: 'Goblin Chefe', hp: 100, atk: 20 },
  { name: 'Goblin Rei', hp: 150, atk: 28 },
];
let player, eData, defending, turnCount;

function initGame() {
  player = { hp: 100, maxHp: 100, mp: 50, maxMp: 50, atk: 18, xp: 0, xpNext: 30, level: 1 };
  turnCount = 0; defending = false;
  resizeCanvas(); initSprites(); spawnEnemy();
  document.getElementById('battleLog').innerHTML = '<div class="log-system">Uma sombra se move no horizonte...</div>';
  drawBattle();
}

function spawnEnemy() {
  const idx = Math.min(turnCount, enemyTypes.length - 1);
  const b = enemyTypes[idx];
  eData = { name: b.name, hp: b.hp + turnCount * 10, maxHp: b.hp + turnCount * 10, atk: b.atk + turnCount * 2 };
  updateHUD();
}

function updateHUD() {
  document.getElementById('pName').textContent = `Viajante — Nv.${player.level}`;
  document.getElementById('pHpBar').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('pHpVal').textContent = `${Math.max(0, player.hp)}/${player.maxHp}`;
  document.getElementById('pMpBar').style.width = (player.mp / player.maxMp * 100) + '%';
  document.getElementById('pMpVal').textContent = `${player.mp}/${player.maxMp}`;
  document.getElementById('pXpBar').style.width = (player.xp / player.xpNext * 100) + '%';
  document.getElementById('pXpVal').textContent = `${player.xp}/${player.xpNext}`;
  document.getElementById('eName').textContent = eData.name;
  document.getElementById('eHpBar').style.width = (Math.max(0, eData.hp) / eData.maxHp * 100) + '%';
  document.getElementById('eHpVal').textContent = `${Math.max(0, eData.hp)}/${eData.maxHp}`;
}

function log(msg, type = 'system') {
  const el = document.getElementById('battleLog');
  el.innerHTML += `<div class="log-${type}">${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

let busy = false;
function doAction(action) {
  if (player.hp <= 0 || busy) return;
  busy = true; defending = false; let dmg;
  switch (action) {
    case 'attack':
      dmg = player.atk + Math.floor(Math.random() * 6); eData.hp -= dmg;
      heroAttacking = true; atkT = 0;
      setTimeout(() => { enemyShake = 14; enemyFlash = 10; }, 350);
      log(`Lâmina corta ${eData.name} — <strong>${dmg}</strong> dano`, 'player'); break;
    case 'magic':
      if (player.mp < 20) { log('MP insuficiente...', 'system'); busy = false; return; }
      player.mp -= 20; dmg = player.atk * 2 + Math.floor(Math.random() * 10); eData.hp -= dmg;
      setTimeout(() => { enemyShake = 20; enemyFlash = 14; }, 100);
      log(`Luz do horizonte! <strong>${dmg}</strong> dano arcano`, 'player'); break;
    case 'heal':
      if (player.mp < 15) { log('MP insuficiente...', 'system'); busy = false; return; }
      player.mp -= 15; const heal = 30 + player.level * 5;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      log(`Recupera <strong>${heal}</strong> HP`, 'heal'); break;
    case 'defend':
      defending = true; log('Postura defensiva.', 'player'); break;
  }
  updateHUD();
  if (eData.hp <= 0) {
    const xp = 15 + turnCount * 5; player.xp += xp;
    log(`${eData.name} cai. +${xp} XP`, 'system');
    if (player.xp >= player.xpNext) levelUp();
    turnCount++; spawnEnemy();
    log(`${eData.name} aparece...`, 'enemy');
    updateHUD(); busy = false; return;
  }
  setTimeout(() => {
    let ed = eData.atk + Math.floor(Math.random() * 6);
    if (defending) ed = Math.floor(ed / 2);
    player.hp -= ed;
    enemyAttacking = true; atkT = 0;
    setTimeout(() => { heroShake = 12; heroFlash = 10; }, 350);
    log(`${eData.name} ataca — <strong>${ed}</strong>${defending ? ' (def)' : ''}`, 'enemy');
    if (player.hp <= 0) { player.hp = 0; log('Você cai... escuridão.', 'system'); log('<strong>Fim. Volte ao menu.</strong>', 'system'); }
    updateHUD(); busy = false;
  }, 700);
}

function levelUp() {
  player.level++; player.xp = 0; player.xpNext = Math.floor(player.xpNext * 1.5);
  player.maxHp += 20; player.hp = player.maxHp;
  player.maxMp += 10; player.mp = player.maxMp;
  player.atk += 5;
  log(`Nível ${player.level}! Stats aumentaram.`, 'system');
}
