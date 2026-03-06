// === SPRITE ENGINE ===
function createSprite(data, pal, scale) {
  const h = data.length, w = data[0].length;
  const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
  const x = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
    const ci = data[y][i]; if (ci === 0) continue;
    x.fillStyle = pal[ci]; x.fillRect(i * scale, y * scale, scale, scale);
  }
  return c;
}

// === HERO — 48x72, 36 colors, extracted from original artwork ===
const HERO_PALETTE = {
  0:'transparent',
  1:'#514a3f',
  2:'#361f21',
  3:'#69292f',
  4:'#7a6857',
  5:'#37312c',
  6:'#3c362f',
  7:'#5c5042',
  8:'#242020',
  9:'#463d36',
  10:'#572125',
  11:'#714c45',
  12:'#742c31',
  13:'#90504a',
  14:'#2a2829',
  15:'#5f242a',
  16:'#847b6a',
  17:'#3f3b33',
  18:'#422626',
  19:'#381318',
  20:'#685944',
  21:'#522e2e',
  22:'#43181d',
  23:'#6e1f24',
  24:'#4e433a',
  25:'#6e604e',
  26:'#ada087',
  27:'#2f2f31',
  28:'#1a1d1f',
  29:'#64262d',
  30:'#4e1c20',
  31:'#6e2a30',
  32:'#1f2224',
  33:'#373839',
  34:'#42423c',
  35:'#301418',
  36:'#625749',
};
