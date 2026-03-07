// === MENU & SCREEN MANAGEMENT ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // Switch BGM based on screen
  if (id === 'menuScreen') {
    AudioEngine.startMenu();
  }
}

function startBattle() {
  showScreen('battleScreen');
  initGame();
}

// Particles
(function initParticles() {
  const c = document.getElementById('particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = (6 + Math.random() * 6) + 's';
    c.appendChild(p);
  }
})();
