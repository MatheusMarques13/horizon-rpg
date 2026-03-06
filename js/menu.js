// === MENU & PARTICLES ===
const pEl = document.getElementById('particles');
for (let i = 0; i < 35; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.left = Math.random() * 100 + '%';
  p.style.animationDuration = (6 + Math.random() * 10) + 's';
  p.style.animationDelay = Math.random() * 10 + 's';
  pEl.appendChild(p);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startBattle() {
  initGame();
  showScreen('battleScreen');
}
