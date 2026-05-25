'use strict';

// ─── Confetti particle ────────────────────────────────────────────────────────
class ConfettiParticle extends Particle {
  constructor(x, y) {
    const COLS = [
      color(255, 215,   0),  // gold
      color(220,  50,  50),  // red
      color( 50, 180,  80),  // green
      color( 70, 130, 220),  // blue
      color(200,  80, 200),  // purple
      color(255, 160,  20),  // orange
    ];
    super(x, y, random(-2.5, 2.5), random(-4, -0.8),
          random(8, 15), random(COLS), 210);
    this.angle  = random(TWO_PI);
    this.spin   = random(-0.18, 0.18);
    this.aspect = random(0.28, 0.60);
  }

  update() {
    this.vy    += 0.09;
    this.vx    *= 0.995;
    this.angle += this.spin;
    super.update();
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 220);
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(red(this.col), green(this.col), blue(this.col), a);
    noStroke();
    rect(-this.sz / 2, -this.sz * this.aspect / 2, this.sz, this.sz * this.aspect, 1);
    pop();
  }
}

// ─── State ────────────────────────────────────────────────────────────────────
let _confettiTimer = 0;

function resetEndScreen() { _confettiTimer = 0; }

// ─── Main entry point ─────────────────────────────────────────────────────────
function drawEndScreen(bs) {
  // Spawn confetti bursts periodically
  _confettiTimer -= deltaTime / 1000;
  if (_confettiTimer <= 0) {
    _confettiTimer = 0.8;
    for (let i = 0; i < 18; i++) {
      spawnParticle(new ConfettiParticle(
        random(CANVAS_W * 0.1, CANVAS_W * 0.9),
        random(ZONE.HEADER_BOT + 20, ZONE.FACTORY_BOT - 60)
      ));
    }
  }

  // Dark overlay over factory
  push();
  fill(4, 10, 18, 210);
  noStroke();
  rect(0, ZONE.HEADER_BOT, CANVAS_W, ZONE.FACTORY_BOT - ZONE.HEADER_BOT);
  pop();

  // Centre bottle
  let bx = CANVAS_W / 2;
  let by = (ZONE.HEADER_BOT + ZONE.FACTORY_BOT) / 2 + 15;
  _drawBottle(bx, by);

  // Celebration text
  push();
  fill(COL.highlight);
  textFont('monospace');
  textSize(30);
  textAlign(CENTER, CENTER);
  noStroke();
  drawingContext.shadowBlur  = 30;
  drawingContext.shadowColor = '#FFD700';
  text('\uD83C\uDF89 Proost! \uD83C\uDF7A', CANVAS_W / 2, ZONE.HEADER_BOT + 32);
  drawingContext.shadowBlur = 0;

  fill('#8AAAC8');
  textSize(11);
  text('Kloster Riddagshausen · Braunschweig · Reinheitsgebot 1516', CANVAS_W / 2, ZONE.FACTORY_BOT - 18);
  pop();
}

// ─── Beer bottle ─────────────────────────────────────────────────────────────
function _drawBottle(cx, cy) {
  const BW  = 90;   // body width
  const BH  = 128;  // body height
  const SH  = 55;   // shoulder height
  const NH  = 96;   // neck height
  const NW  = 20;   // neck width
  const CW  = 26;   // cap width
  const CH  = 20;   // cap height
  const totH = CH + NH + SH + BH;

  const capY  = cy - totH / 2;
  const neckY = capY + CH;
  const shlY  = neckY + NH;   // top of shoulder = bottom of neck
  const bodY  = shlY + SH;    // top of body
  const botY  = bodY + BH;    // bottom of bottle

  push();
  const GR = 126, GG = 68, GB = 3;

  // ── Single-pass bottle silhouette ────────────────────────────
  fill(GR, GG, GB, 215); stroke(55, 28, 2); strokeWeight(2);
  beginShape();
    vertex(cx - BW/2 + 8, botY);          // bottom-left corner
    vertex(cx + BW/2 - 8, botY);          // bottom-right corner
    vertex(cx + BW/2,     botY - 10);     // right body side start
    vertex(cx + BW/2,     bodY);          // top-right of body

    // Right shoulder: smoothly inward from body width to neck width
    bezierVertex(
      cx + BW/2,     bodY - SH * 0.45,   // stay at body width briefly
      cx + NW/2 + 2, shlY + SH * 0.30,   // then pull in toward neck
      cx + NW/2,     shlY                 // arrive at neck width
    );

    vertex(cx + NW/2,  neckY);            // right neck going up
    vertex(cx + CW/2,  neckY);            // cap flare right
    vertex(cx + CW/2,  capY + 3);         // cap top-right
    vertex(cx,         capY);             // cap centre top (slight dome)
    vertex(cx - CW/2,  capY + 3);         // cap top-left
    vertex(cx - CW/2,  neckY);            // cap flare left
    vertex(cx - NW/2,  neckY);            // left neck start

    // Left shoulder: mirror of right
    bezierVertex(
      cx - NW/2 - 2, shlY + SH * 0.30,
      cx - BW/2,     bodY - SH * 0.45,
      cx - BW/2,     bodY
    );

    vertex(cx - BW/2,     botY - 10);
    vertex(cx - BW/2 + 8, botY);
  endShape(CLOSE);

  // ── Beer fill (clipped to body) ───────────────────────────────
  let bc = color(COL.liquid[9]);
  fill(red(bc), green(bc), blue(bc), 210); noStroke();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(cx - BW/2 + 3, bodY + 3, BW - 6, BH - 6);
  drawingContext.clip();
  rect(cx - BW/2 + 3, bodY + 3, BW - 6, BH - 6, 0, 0, 8, 8);
  drawingContext.restore();

  // ── Neck ring ────────────────────────────────────────────────
  fill(GR - 10, GG - 5, GB); stroke(55, 28, 2); strokeWeight(1);
  rect(cx - NW/2 - 1, shlY - 5, NW + 2, 6);

  // ── Crown cap (white/ivory like Weihenstephaner) ──────────────
  fill(240, 238, 228); stroke(170, 165, 150); strokeWeight(1.5);
  beginShape();
    vertex(cx - CW/2,  neckY);
    vertex(cx + CW/2,  neckY);
    vertex(cx + CW/2,  capY + 3);
    vertex(cx,         capY);
    vertex(cx - CW/2,  capY + 3);
  endShape(CLOSE);
  // Cap ridges
  stroke(200, 195, 182); strokeWeight(0.7);
  for (let i = 1; i < 9; i++) {
    let rx = cx - CW/2 + i * CW / 9;
    line(rx, neckY - 2, rx, capY + 5);
  }
  fill(255, 255, 255, 80); noStroke();
  triangle(cx - CW/2 + 4, capY + 8, cx, capY + 1, cx, capY + 8);

  // ── Glass highlights ─────────────────────────────────────────
  noStroke();
  fill(255, 255, 255, 42);
  rect(cx - BW/2 + 8, bodY + 16, BW/6, BH - 32, 3);
  fill(255, 255, 255, 28);
  rect(cx - NW/2 + 3, neckY + 10, NW/3, NH - 20, 2);

  // ── Label ────────────────────────────────────────────────────
  _drawBeerLabel(cx, bodY + BH * 0.44, BW - 8, BH * 0.86);

  // ── Drop shadow ───────────────────────────────────────────────
  fill(0, 0, 0, 60); noStroke();
  ellipse(cx, botY + 7, BW * 1.1, 14);

  pop();
}

// ─── Riddagshausen label ─────────────────────────────────────────────────────
function _drawBeerLabel(cx, cy, lw, lh) {
  let lx = cx - lw / 2;
  let ly = cy - lh / 2;

  push();

  // ── Background + border ──────────────────────────────────────
  fill('#F2DFA0'); stroke('#7A5810'); strokeWeight(2);
  rect(lx, ly, lw, lh, 3);
  // Inner double border
  noFill(); stroke('#9B6E14'); strokeWeight(1);
  rect(lx + 4, ly + 4, lw - 8, lh - 8, 2);
  // Gold corner ornaments
  _labelCorners(lx, ly, lw, lh);

  let yy = ly + 11;
  textAlign(CENTER, TOP); noStroke();

  // ── "KLOSTER" ────────────────────────────────────────────────
  fill('#8B1A1A');
  textFont('monospace'); textSize(7);
  text('\u2015\u2015 KLOSTER \u2015\u2015', cx, yy);
  yy += 10;

  // ── Monastery illustration ───────────────────────────────────
  _monasteryIcon(cx, yy, lw * 0.82, 44);
  yy += 48;

  // ── Main name ────────────────────────────────────────────────
  fill('#160800');
  textFont('monospace'); textSize(9);
  drawingContext.shadowBlur  = 3;
  drawingContext.shadowColor = 'rgba(120,80,10,0.5)';
  text('RIDDAGSHAUSEN', cx, yy);
  drawingContext.shadowBlur = 0;
  yy += 12;

  // ── Divider with hop motif ───────────────────────────────────
  stroke('#9B6E14'); strokeWeight(0.8);
  line(lx + 6, yy + 3, lx + lw - 6, yy + 3);
  fill('#5A7A2A'); noStroke();
  ellipse(cx - 3, yy + 3, 3, 5); ellipse(cx + 3, yy + 3, 3, 5);
  yy += 8;

  // ── Beer style ───────────────────────────────────────────────
  fill('#4A2A08'); noStroke();
  textFont('Arial'); textSize(6.5);
  text('BAYERISCHES HELLES LAGER', cx, yy);
  yy += 10;

  // ── Location ─────────────────────────────────────────────────
  fill('#6B4414'); textSize(6.5);
  text('Braunschweig \u00b7 seit 1145', cx, yy);
  yy += 10;

  // ── Hop & grain row ──────────────────────────────────────────
  _hopRow(cx, yy, lw * 0.55);
  yy += 14;

  // ── ABV + Volume ─────────────────────────────────────────────
  fill('#1E0E00');
  textFont('monospace'); textSize(7);
  text('5,2% vol  \u00b7  0,5 L', cx, yy);
  yy += 11;

  // ── Reinheitsgebot ───────────────────────────────────────────
  fill('#7A5820'); textFont('Arial'); textSize(5.5);
  text('Reinheitsgebot 1516', cx, yy);

  pop();
}

// ─── Label corner ornaments ───────────────────────────────────────────────────
function _labelCorners(lx, ly, lw, lh) {
  let mx = lx + lw / 2;
  let my = ly + lh / 2;
  push();
  stroke('#9B6E14'); strokeWeight(0.8); noFill();
  let s = 7;
  for (let [ox, oy] of [[lx+4,ly+4],[lx+lw-4,ly+4],[lx+4,ly+lh-4],[lx+lw-4,ly+lh-4]]) {
    let sx = ox < mx ? 1 : -1;
    let sy = oy < my ? 1 : -1;
    line(ox, oy, ox + sx * s, oy);
    line(ox, oy, ox, oy + sy * s);
  }
  pop();
}

// ─── Monastery silhouette ────────────────────────────────────────────────────
function _monasteryIcon(cx, topY, iw, ih) {
  push();
  let ix = cx - iw / 2;

  // Sky tint
  fill('#D4C890'); noStroke();
  rect(ix, topY, iw, ih, 2);

  // Main nave (body)
  fill('#B8A065'); stroke('#7A5820'); strokeWeight(1);
  rect(ix + iw * .22, topY + ih * .25, iw * .56, ih * .75);

  // Left side wing
  rect(ix + iw * .05, topY + ih * .40, iw * .18, ih * .60);

  // Right side wing
  rect(ix + iw * .77, topY + ih * .40, iw * .18, ih * .60);

  // ── Central tower ────────────────────────────────────────────
  fill('#C8AE72'); stroke('#7A5820');
  rect(ix + iw * .38, topY, iw * .24, ih * .65);

  // Tower pointed roof
  fill('#8B1A1A'); stroke('#6A1414'); strokeWeight(1);
  triangle(
    ix + iw * .38,              topY + ih * .08,
    ix + iw * .62,              topY + ih * .08,
    ix + iw * .50,              topY - ih * .12
  );
  // Cross on top
  stroke('#F2DFA0'); strokeWeight(1.5);
  line(cx, topY - ih * .12, cx, topY - ih * .22);
  line(cx - iw * .04, topY - ih * .17, cx + iw * .04, topY - ih * .17);

  // ── Gothic entrance arch ─────────────────────────────────────
  fill('#2A1400'); noStroke();
  // Pointed arch: two arcs
  let ax  = cx;
  let ay  = topY + ih * .85;
  let aw  = iw * .22;
  let ah  = ih * .38;
  beginShape();
  vertex(ax - aw / 2, ay);
  bezierVertex(ax - aw / 2, ay - ah, ax, ay - ah * 1.1, ax, ay - ah);
  bezierVertex(ax, ay - ah * 1.1, ax + aw / 2, ay - ah, ax + aw / 2, ay);
  endShape(CLOSE);

  // ── Rose window ──────────────────────────────────────────────
  noFill(); stroke('#8B1A1A'); strokeWeight(1);
  let ry = topY + ih * .35;
  let rr = iw * .09;
  ellipse(cx, ry, rr * 2, rr * 2);
  // Six spokes
  for (let i = 0; i < 6; i++) {
    let a = i * PI / 3;
    line(cx, ry, cx + cos(a) * rr, ry + sin(a) * rr);
  }
  // Inner circle
  ellipse(cx, ry, rr * 0.5, rr * 0.5);

  // ── Small arched windows (wings) ─────────────────────────────
  fill('#1A0C00'); noStroke();
  for (let wx of [ix + iw * .14, ix + iw * .82]) {
    let wy = topY + ih * .58;
    let ww = iw * .09, wh = ih * .22;
    // Pointed mini arch
    beginShape();
    vertex(wx - ww / 2, wy);
    bezierVertex(wx - ww / 2, wy - wh, wx, wy - wh * 1.08, wx, wy - wh * .9);
    bezierVertex(wx, wy - wh * 1.08, wx + ww / 2, wy - wh, wx + ww / 2, wy);
    endShape(CLOSE);
  }

  // Ground line
  stroke('#7A5820'); strokeWeight(1.5); noFill();
  line(ix, topY + ih, ix + iw, topY + ih);

  pop();
}

// ─── Decorative hop row ───────────────────────────────────────────────────────
function _hopRow(cx, y, width) {
  push();
  let hw = width / 2;
  for (let side of [-1, 1]) {
    let bx = cx + side * hw * .55;
    // Stem
    stroke('#5A7A2A'); strokeWeight(1); noFill();
    line(bx, y - 2, bx, y + 10);
    // Hop cone leaves
    fill('#6A8A30'); stroke('#4A6A20'); strokeWeight(0.7);
    ellipse(bx,      y + 4,  6, 8);
    ellipse(bx - 3,  y + 8,  5, 7);
    ellipse(bx + 3,  y + 8,  5, 7);
    // Grain stalk (other side)
    let gx = cx - side * hw * .55;
    stroke('#9B8020'); strokeWeight(1.2);
    line(gx, y + 12, gx, y - 2);
    fill('#B89428'); stroke('#8B6818'); strokeWeight(0.6);
    for (let k = 0; k < 4; k++) {
      ellipse(gx + (k % 2 === 0 ? 3 : -3), y + 10 - k * 3.5, 4, 3);
    }
  }
  pop();
}
