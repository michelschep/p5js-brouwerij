'use strict';

let bs;           // BreweryState
let tanks  = [];
let uiMgr;
let dash;
let lastMs = 0;

// ---------------------------------------------------------------------------
function setup() {
  let cnv = createCanvas(CANVAS_W, CANVAS_H);
  cnv.parent('canvasContainer');
  frameRate(60);

  bs = new BreweryState();

  for (let def of TANK_DEFS) tanks.push(createTank(def));
  createPipes(tanks);

  uiMgr = new UIManager();
  dash  = new ChemDashboard();

  // Wire up HTML controls
  select('#playPause').mousePressed(() => {
    bs.paused = !bs.paused;
    select('#playPause').html(bs.paused ? '&#9654; Start' : '&#9208; Pauze');
  });

  select('#nextStep').mousePressed(() => {
    bs.nextStep();
    bs.paused = false;
    select('#playPause').html('&#9208; Pauze');
  });

  select('#reset').mousePressed(() => {
    bs.reset();
    bs.speed = parseFloat(select('#speed').value());
    select('#playPause').html('&#9208; Pauze');
    select('#speedVal').html(nf(bs.speed, 1, 1) + '\u00d7');
    resetEndScreen();
  });

  select('#speed').input(() => {
    bs.speed = parseFloat(select('#speed').value());
    select('#speedVal').html(nf(bs.speed, 1, 1) + '\u00d7');
  });

  lastMs = millis();
}

// ---------------------------------------------------------------------------
function draw() {
  let now = millis();
  let dt  = min((now - lastMs) / 1000, 0.1);
  lastMs  = now;

  bs.update(dt);
  for (let t of tanks)  t.update(bs);
  for (let p of pipes)  p.update(bs, dt);
  updateParticles();
  for (let t of tanks)  t.spawnParticles(bs);
  uiMgr.update(tanks, bs, dt);

  // ── Draw ──────────────────────────────────────────────────────────────────

  background(COL.bgFactory);

  _drawHeader();

  // Dashboard background (drawn before tanks so tanks can overlap it)
  fill(COL.bgDash); noStroke();
  rect(0, ZONE.DASH_TOP, CANVAS_W, CANVAS_H - ZONE.DASH_TOP);

  // Factory / dashboard separator
  stroke(122, 139, 154, 85); strokeWeight(1);
  line(0, ZONE.FACTORY_BOT, CANVAS_W, ZONE.FACTORY_BOT);

  for (let p of pipes)  p.draw(bs);
  for (let t of tanks)  t.draw(bs);
  drawParticles();
  dash.draw(bs);
  uiMgr.draw(bs);

  // End screen overlay (drawn last, on top of everything)
  if (bs.done) drawEndScreen(bs);

  // Step-progress dots strip above tanks
  _drawStepDots();
}

// ---------------------------------------------------------------------------
function _drawHeader() {
  push();
  fill(COL.bgHeader); noStroke();
  rect(0, 0, CANVAS_W, ZONE.HEADER_BOT);

  // Title
  fill(COL.highlight);
  textFont('monospace'); textSize(18); textAlign(LEFT, CENTER); noStroke();
  text('\uD83C\uDF7A DEUTSCHES BRAUEREI', 20, ZONE.HEADER_BOT / 2 - 6);

  // Subtitle
  fill('#8AAAC8'); textSize(9);
  text('Reinheitsgebot 1516 \u00b7 Wasser \u00b7 Malz \u00b7 Hopfen \u00b7 Hefe', 20, ZONE.HEADER_BOT - 10);

  let def = STEP_DEFS[bs.step];

  if (bs.done) {
    // Replace step name + progress with completion banner
    fill(COL.highlight); textSize(15); textAlign(CENTER, CENTER); textFont('monospace');
    drawingContext.shadowBlur  = 12;
    drawingContext.shadowColor = '#FFD700';
    text('\uD83C\uDF89 BROUWEN COMPLEET! Proost! \uD83C\uDF7A', CANVAS_W / 2, ZONE.HEADER_BOT / 2);
    drawingContext.shadowBlur = 0;
  } else {
    // Step name (centre)
    fill(COL.text); textSize(13); textAlign(CENTER, CENTER); textFont('monospace');
    text('Stap ' + (bs.step + 1) + '/10: ' + def.name, CANVAS_W / 2, ZONE.HEADER_BOT / 2 - 8);

    // Progress bar
    let barX = CANVAS_W / 2 - 130, barY = ZONE.HEADER_BOT - 16, barW = 260, barH = 6;
    fill(20, 40, 65); noStroke();
    rect(barX, barY, barW, barH, 3);
    fill(COL.highlight);
    rect(barX, barY, barW * bs.stepProgress, barH, 3);

    // Real-time label
    fill('#7A9AB8'); textSize(9); textAlign(CENTER, TOP);
    text(def.realTime + ' reëel', CANVAS_W / 2, ZONE.HEADER_BOT - 28);
  }

  // Clock (top-right)
  let mins = floor(bs.totalTime / 60);
  let secs = floor(bs.totalTime % 60);
  fill(COL.text); textSize(13); textFont('monospace'); textAlign(RIGHT, CENTER);
  text(nf(mins, 2) + ':' + nf(secs, 2), CANVAS_W - 20, ZONE.HEADER_BOT / 2 - 6);
  fill('#8AAAC8'); textSize(9);
  text(nf(bs.speed, 1, 1) + '\u00d7 snelheid', CANVAS_W - 20, ZONE.HEADER_BOT - 12);
  pop();
}

function _drawStepDots() {
  let dotR = 5;
  let totalW = STEP_DEFS.length * 22;
  let startX = (CANVAS_W - totalW) / 2;
  let dotY   = ZONE.FACTORY_TOP + 14;
  push();
  for (let i = 0; i < STEP_DEFS.length; i++) {
    let cx = startX + i * 22;
    if (i < bs.step) {
      fill(COL.highlight); noStroke();
    } else if (i === bs.step) {
      fill(COL.highlight);
      stroke(255, 255, 255, 180); strokeWeight(1.5);
    } else {
      fill(30, 55, 80); stroke(COL.tankOutline); strokeWeight(1);
    }
    ellipse(cx, dotY, dotR * 2, dotR * 2);
    if (i < STEP_DEFS.length - 1) {
      stroke(i < bs.step ? COL.highlight : COL.pipe); strokeWeight(1);
      line(cx + dotR, dotY, cx + 22 - dotR, dotY);
    }
  }
  pop();
}

// ---------------------------------------------------------------------------
function mouseClicked() {
  if (mouseY < ZONE.FACTORY_TOP || mouseY > ZONE.FACTORY_BOT) return;
  for (let t of tanks) {
    if (t.hovered) { uiMgr.showPopup(t, bs); return; }
  }
}

function windowResized() {
  // Canvas stays fixed; CSS scales it on narrow viewports
}
