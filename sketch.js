let totalPhases = 48;
let phaseIndex = 0;
let fontMain;
let palette;             // blended palette for this frame
let controlPalettes = []; // fixed "stops" we blend between
let mySound;

function preload() {
  fontMain = loadFont("assets/SourceSans3-Black.ttf");
  mySound  = loadSound("assets/bgm.mp3");
}

function setup() {
  createCanvas(1550, 800);
  textAlign(CENTER, CENTER);
  if (fontMain) textFont(fontMain);

  buildControlPalettes();   // define 3–4 key palettes to blend across
  frameRate(3);             // smooth but not too fast
}

function draw() {
  // advance phase automatically
  phaseIndex = (phaseIndex + 1) % totalPhases;

  // compute smoothly blended palette for this phase
  palette = smoothPaletteForPhase(phaseIndex, totalPhases);

  // draw frame
  background(palette.night);
  drawStars(140);

  const d = min(width, height) * 0.6;
  const cx = width * 0.5;
  const cy = height * 0.45;

  push();
  translate(cx, cy);
  drawMoon(d, phaseIndex, totalPhases);
  pop();

  drawManifesto(["You are my crescent moon."], cx, cy, d);
}

// --- Sound toggle (M) and save (S) ---
function keyPressed() {
  if (key === 'S' || key === 's') {
    saveCanvas(`moon_phase_${nf(phaseIndex, 3)}_of_${totalPhases}`, "png");
  }
  if (key === 'M' || key === 'm') {
    const ctx = getAudioContext();
    if (ctx.state !== 'running') ctx.resume().then(toggleSound);
    else toggleSound();
  }
}

function toggleSound() {
  if (!mySound) return;
  if (mySound.isPlaying()) mySound.pause();
  else mySound.loop();
}

// ---------- Modules ----------
function drawStars(count) {
  noStroke();
  fill(255, 220);
  for (let i = 0; i < count; i++) {
    const x = random(width);
    const y = random(height * 0.65);
    const s = random(1, 2.5);
    circle(x, y, s);
  }
}

function drawMoon(d, idx, total) {
  noStroke();

  // base disc
  fill(palette.moon);
  circle(0, 0, d);

  // phase shadow (classic two-circle)
  const k = map(idx, 0, total - 1, -1, 1);       // -1(new) .. 1(full)
  const shadowOffset = k * (d * 0.45);
  fill(palette.shadow);
  circle(shadowOffset, 0, d);

  // faint rim
  noFill();
  circle(0, 0, d * 1.02);
  noStroke();
}

function drawManifesto(lines, cx, cy, d) {
  const base = min(width, height) * 0.05;
  const leading = base * 1.2;

  fill(palette.text);
  textSize(base);

  const yStart = cy + d * 0.45 + leading * 1.2;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], width * 0.5, yStart + i * leading);
  }

  textSize(base * 0.45);
  fill(255, 160);
  text("S: save • M: music", width / 2, height - 20);
}

// ---------- Smooth palette blending ----------
// Define a few control palettes from darkest → lightest → darkest.
// We'll blend across them smoothly every frame.
function buildControlPalettes() {
  controlPalettes = [
    { night: color(17, 27, 61),   moon: color(241, 229, 215), shadow: color(17, 27, 61),   text: color(241, 229, 215) },
    { night: color(39, 40, 77),   moon: color(245, 209, 166), shadow: color(39, 40, 77),   text: color(245, 209, 166) },
    { night: color(48, 66, 100),  moon: color(246, 204, 156), shadow: color(48, 66, 100),  text: color(246, 204, 156) },
    { night: color(96, 117, 151), moon: color(246, 201, 148), shadow: color(96, 117, 151), text: color(246, 201, 148) }
  ];
}

// Returns a blended palette for this phase.
// We mirror the phase across the midpoint: 0..1..0, then
// interpolate between adjacent control palettes using lerpColor.
function smoothPaletteForPhase(idx, total) {
  const stops = controlPalettes.length;
  if (stops === 0) buildControlPalettes();

  // progress across whole cycle
  const t = idx / (total - 1);              // 0..1
  const u = (t <= 0.5) ? t * 2 : (1 - t) * 2; // 0..1..0 mirrored

  // which two palette stops are we between?
  const pos = u * (stops - 1);              // 0..(stops-1)
  const i0 = floor(pos);
  const i1 = constrain(i0 + 1, 0, stops - 1);
  const f  = constrain(pos - i0, 0, 1);     // blend factor 0..1

  const a = controlPalettes[i0];
  const b = controlPalettes[i1];

  return {
    night : lerpColor(a.night,  b.night,  f),
    moon  : lerpColor(a.moon,   b.moon,   f),
    shadow: lerpColor(a.shadow, b.shadow, f),
    text  : lerpColor(a.text,   b.text,   f)
  };
}