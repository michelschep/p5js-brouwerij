'use strict';

// =============================================================================
// Drawing Utilities
// All visual helpers operate in p5 global draw context.
// Gradients are lazily cached on Tank instances to avoid per-frame recreation.
// =============================================================================

function _mkMetalGrad(lx, rx) {
  let g = drawingContext.createLinearGradient(lx, 0, rx, 0);
  g.addColorStop(0.00, 'rgba(20,32,42,0.98)');
  g.addColorStop(0.10, 'rgba(68,86,98,0.90)');
  g.addColorStop(0.25, 'rgba(162,178,190,0.54)');
  g.addColorStop(0.40, 'rgba(196,212,222,0.36)');   // main specular (most transparent → liquid shows)
  g.addColorStop(0.56, 'rgba(122,140,153,0.58)');
  g.addColorStop(0.72, 'rgba(146,162,173,0.46)');   // secondary highlight
  g.addColorStop(0.90, 'rgba(52,68,80,0.84)');
  g.addColorStop(1.00, 'rgba(14,24,34,0.98)');
  return g;
}

function _mkLiqGrad(lx, rx, hexCol) {
  let c  = color(hexCol);
  let rv = red(c)|0, gv = green(c)|0, bv = blue(c)|0;
  let g  = drawingContext.createLinearGradient(lx, 0, rx, 0);
  g.addColorStop(0.00, `rgba(${(rv*.55)|0},${(gv*.55)|0},${(bv*.55)|0},0.80)`);
  g.addColorStop(0.28, `rgba(${rv},${gv},${bv},0.90)`);
  g.addColorStop(0.50, `rgba(${min(rv+50,255)|0},${min(gv+44,255)|0},${min(bv+28,255)|0},0.97)`);
  g.addColorStop(0.72, `rgba(${rv},${gv},${bv},0.90)`);
  g.addColorStop(1.00, `rgba(${(rv*.55)|0},${(gv*.55)|0},${(bv*.55)|0},0.80)`);
  return g;
}

// Draw one standard cylinder and return geometry used by subclass overlays.
// Stays strictly within the w×h bounding box (pipe anchors are unaffected).
function _drawCylBody(inst, bs, active) {
  let { x, y, w, h } = inst;
  let lx   = x - w / 2;
  let ly   = y - h / 2;
  let eh   = max(w * 0.22, 13);      // top/bottom ellipse height
  let bTop = ly + eh * 0.5;          // rect body starts here
  let bH   = h - eh;                 // rect body height

  push();

  // ── 1. Liquid fill (drawn behind the metallic overlay) ────────
  let liqCol = bs ? COL.liquid[bs.step] : COL.liquid[0];
  if (inst.fillLevel > 0) {
    let lh   = bH * inst.fillLevel;
    let lTop = bTop + bH - lh;
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(lx + 2, bTop, w - 4, bH);
    drawingContext.clip();
    drawingContext.fillStyle = _mkLiqGrad(lx, lx + w, liqCol);
    drawingContext.fillRect(lx + 2, lTop, w - 4, lh);
    drawingContext.restore();
  }

  // ── 2. Metallic gradient overlay (semi-transparent → liquid shows) ─
  if (!inst._mGrad) inst._mGrad = _mkMetalGrad(lx, lx + w);
  drawingContext.fillStyle = inst._mGrad;
  noStroke();
  rect(lx, bTop, w, bH, 0, 0, 2, 2);

  // ── 3. Conical bottom (GaerTank, LagerTank) ───────────────────
  let coneH = inst.conical ? h * 0.28 : 0;
  let flatBotY = bTop + bH;
  if (inst.conical) {
    let coneBot = ly + h - 6;
    // Liquid in cone
    if (inst.fillLevel > 0) {
      let c = color(liqCol);
      fill(red(c)*.65|0, green(c)*.65|0, blue(c)*.65|0, 170);
      noStroke();
      triangle(lx, flatBotY, lx + w, flatBotY, x, coneBot);
    }
    // Metal overlay on cone
    let cg = drawingContext.createLinearGradient(lx, 0, lx + w, 0);
    cg.addColorStop(0,   'rgba(20,32,42,0.97)');
    cg.addColorStop(0.38,'rgba(115,132,144,0.58)');
    cg.addColorStop(0.62,'rgba(115,132,144,0.58)');
    cg.addColorStop(1,   'rgba(20,32,42,0.97)');
    drawingContext.fillStyle = cg;
    noStroke();
    triangle(lx, flatBotY, lx + w, flatBotY, x, coneBot);
    stroke(44, 58, 70); strokeWeight(1.5); noFill();
    triangle(lx, flatBotY, lx + w, flatBotY, x, coneBot);
    // Valve stub
    stroke(58, 72, 84); strokeWeight(4);
    line(x, coneBot, x, coneBot + 6);
    fill(68, 82, 94); stroke(52, 66, 78); strokeWeight(1);
    ellipse(x, coneBot + 8, 10, 6);
  }

  // ── 4. Bottom ellipse ─────────────────────────────────────────
  if (!inst.conical) {
    fill(38, 52, 64); stroke(26, 40, 52); strokeWeight(1.2);
    ellipse(x, flatBotY, w, eh);
    // Bottom valve
    stroke(55, 68, 80); strokeWeight(4);
    line(x, flatBotY + eh * 0.4, x, flatBotY + eh * 0.4 + 7);
    fill(65, 78, 90); stroke(50, 63, 75); strokeWeight(1);
    ellipse(x, flatBotY + eh * 0.4 + 9, 9, 6);
  }

  // ── 5. Top dome ───────────────────────────────────────────────
  let dg = drawingContext.createRadialGradient(x - w * .12, bTop - eh * .15, 2, x, bTop, w * .6);
  dg.addColorStop(0,   '#BCC8D4');
  dg.addColorStop(0.5, '#788898');
  dg.addColorStop(1,   '#2A3A4A');
  drawingContext.fillStyle = dg;
  stroke(44, 58, 70); strokeWeight(1.5);
  ellipse(x, bTop, w, eh);
  // Manway
  fill(58, 72, 84); stroke(42, 56, 68); strokeWeight(1);
  ellipse(x, bTop, w * .26, eh * .48);
  fill(74, 88, 100); noStroke();
  ellipse(x, bTop, w * .16, eh * .30);

  // ── 6. Outline ────────────────────────────────────────────────
  if (active) { drawingContext.shadowBlur = 20; drawingContext.shadowColor = '#FFD700'; }
  noFill();
  stroke(active ? '#FFD700' : '#566878');
  strokeWeight(active ? 2.5 : 1.5);
  rect(lx, bTop, w, bH, 0, 0, 2, 2);
  drawingContext.shadowBlur = 0;

  // ── 7. Weld seams ─────────────────────────────────────────────
  stroke(48, 62, 74); strokeWeight(0.7); noFill();
  line(lx + 2, bTop + bH * .30, lx + w - 2, bTop + bH * .30);
  line(lx + 2, bTop + bH * .64, lx + w - 2, bTop + bH * .64);

  // ── 8. Support legs ───────────────────────────────────────────
  let legBot = flatBotY + (inst.conical ? coneH + 6 : eh * .5);
  let legH   = 13;
  stroke(46, 60, 72); strokeWeight(5); strokeCap(ROUND);
  line(lx + w * .20, legBot, lx + w * .14, legBot + legH);
  line(lx + w * .80, legBot, lx + w * .86, legBot + legH);
  strokeWeight(3);
  line(lx + w * .07, legBot + legH, lx + w * .21, legBot + legH);
  line(lx + w * .79, legBot + legH, lx + w * .93, legBot + legH);

  // ── 9. Liquid surface shimmer ─────────────────────────────────
  if (inst.fillLevel > 0) {
    let lTop = bTop + bH - bH * inst.fillLevel;
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(lx + 2, bTop, w - 4, bH);
    drawingContext.clip();
    stroke(255, 255, 255, 55); strokeWeight(1.5); noFill();
    line(lx + 5, lTop, lx + w - 5, lTop);
    drawingContext.restore();
  }

  // ── 10. Nozzle on side (top-right) ───────────────────────────
  stroke(56, 70, 82); strokeWeight(3);
  line(lx + w, bTop + 14, lx + w + 8, bTop + 14);
  fill(64, 78, 90); stroke(50, 64, 76); strokeWeight(1);
  ellipse(lx + w + 10, bTop + 14, 7, 10);

  pop();
  return { lx, ly, bTop, bH, eh };
}

// =============================================================================
// Base Tank
// =============================================================================
class Tank {
  constructor(def) {
    this.id        = def.id;
    this.name      = def.name;
    this.x         = def.x;
    this.y         = def.y;
    this.w         = def.w;
    this.h         = def.h;
    this.isCircle  = def.circle;
    this.conical   = false;
    this.fillLevel = 0;
    this.hovered   = false;
    this._mGrad    = null;  // cached metallic gradient
  }

  isActive(bs) { return bs.getActiveTankId() === this.id; }
  isPast(bs)   { return bs.getActiveTankId() >  this.id; }

  update(bs) {
    this.hovered = this._hitTest();
    if      (this.isActive(bs)) this.fillLevel = bs.stepProgress;
    else if (this.isPast(bs))   this.fillLevel = 1;
    else                        this.fillLevel = 0;
  }

  _hitTest() {
    if (this.isCircle)
      return dist(mouseX, mouseY, this.x, this.y) < this.w * 0.5;
    return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 &&
           mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2;
  }

  draw(bs) {
    let active = this.isActive(bs);
    if (this.isCircle) this._drawCircular(bs, active);
    else               _drawCylBody(this, bs, active);
    this._drawLabel(bs);
  }

  _drawCircular(bs, active) {
    // Whirlpool: drawn as top-down view of a round vessel
    let r = this.w / 2;
    push();
    if (active) { drawingContext.shadowBlur = 20; drawingContext.shadowColor = '#FFD700'; }

    // Outer ring (vessel wall, metallic)
    let ringGrad = drawingContext.createRadialGradient(this.x, this.y, r * .6, this.x, this.y, r);
    ringGrad.addColorStop(0, 'rgba(80,100,114,0.0)');
    ringGrad.addColorStop(0.7,'rgba(60,78,90,0.5)');
    ringGrad.addColorStop(1, 'rgba(18,28,38,0.98)');
    drawingContext.fillStyle = ringGrad;
    noStroke();
    ellipse(this.x, this.y, this.w, this.h);

    // Inner liquid surface
    if (this.fillLevel > 0) {
      let liqCol = bs ? COL.liquid[bs.step] : COL.liquid[0];
      let c = color(liqCol);
      let innerR = r * 0.85;
      fill(red(c), green(c), blue(c), 210);
      noStroke();
      ellipse(this.x, this.y, innerR * 2, innerR * 2);
      // Surface highlight
      fill(255, 255, 255, 45);
      ellipse(this.x - r * .2, this.y - r * .15, innerR * .6, innerR * .3);
    }

    // Vessel rim
    noFill();
    stroke(active ? '#FFD700' : '#566878');
    strokeWeight(active ? 3 : 2);
    ellipse(this.x, this.y, this.w, this.h);
    drawingContext.shadowBlur = 0;

    // Inner rim detail
    noFill(); stroke(55, 70, 82); strokeWeight(1);
    ellipse(this.x, this.y, this.w * .88, this.h * .88);
    pop();
  }

  _drawLabel(bs) {
    push();
    noStroke();
    fill(COL.text);
    textAlign(CENTER, TOP);
    textSize(10);
    textFont('monospace');
    text(this.name, this.x, this.y + this.h / 2 + 6);
    pop();
  }

  spawnParticles() {}
}

// =============================================================================
// MoutmolenTank  (step 0) – grain mill
// =============================================================================
class MoutmolenTank extends Tank {
  draw(bs) {
    let active = this.isActive(bs);
    let lx = this.x - this.w / 2;
    let ly = this.y - this.h / 2;
    push();
    if (active) { drawingContext.shadowBlur = 20; drawingContext.shadowColor = '#FFD700'; }

    // Motor housing (right side)
    fill(50, 64, 76); stroke(36, 50, 62); strokeWeight(1);
    rect(lx + this.w - 2, ly + this.h * .35, 14, this.h * .3, 2);
    fill(64, 78, 90);
    ellipse(lx + this.w + 8, ly + this.h * .50, 8, 8);

    // Mill body (steel box)
    if (!this._mGrad) this._mGrad = _mkMetalGrad(lx, lx + this.w);
    drawingContext.fillStyle = this._mGrad;
    noStroke();
    rect(lx, ly + this.h * .38, this.w - 2, this.h * .62, 2, 2, 3, 3);

    // Hopper (inverted trapezoid above mill body)
    let hopTopW = this.w * .8;
    let hopBotW = this.w * .40;
    let hopTop  = ly;
    let hopBot  = ly + this.h * .38;
    let hopGrad = drawingContext.createLinearGradient(lx, 0, lx + this.w, 0);
    hopGrad.addColorStop(0, 'rgba(28,40,50,0.96)'); hopGrad.addColorStop(.3,'rgba(130,145,157,0.7)');
    hopGrad.addColorStop(.6,'rgba(160,174,185,0.55)'); hopGrad.addColorStop(1,'rgba(28,40,50,0.96)');
    drawingContext.fillStyle = hopGrad;
    noStroke();
    beginShape();
    vertex(this.x - hopTopW / 2, hopTop);
    vertex(this.x + hopTopW / 2, hopTop);
    vertex(this.x + hopBotW / 2, hopBot);
    vertex(this.x - hopBotW / 2, hopBot);
    endShape(CLOSE);
    stroke(44, 58, 70); strokeWeight(1.5); noFill();
    beginShape();
    vertex(this.x - hopTopW / 2, hopTop);
    vertex(this.x + hopTopW / 2, hopTop);
    vertex(this.x + hopBotW / 2, hopBot);
    vertex(this.x - hopBotW / 2, hopBot);
    endShape(CLOSE);

    // Roller gap + rollers
    let rolY = ly + this.h * .52;
    stroke(36, 50, 62); strokeWeight(1);
    fill(30, 42, 54);
    rect(lx + 6, rolY, this.w - 18, this.h * .18, 2);
    fill(62, 76, 88); stroke(48, 62, 74);
    ellipse(lx + this.w * .30, rolY + this.h * .09, this.w * .22, this.h * .14);
    ellipse(lx + this.w * .68, rolY + this.h * .09, this.w * .22, this.h * .14);

    // Output chute at bottom
    fill(46, 60, 72); stroke(34, 48, 60); strokeWeight(1);
    rect(lx + this.w * .30, ly + this.h * .82, this.w * .40, this.h * .18, 0, 0, 3, 3);

    // Outline
    noFill();
    stroke(active ? '#FFD700' : '#566878');
    strokeWeight(active ? 2.5 : 1.5);
    rect(lx, ly + this.h * .38, this.w - 2, this.h * .62, 2, 2, 3, 3);
    drawingContext.shadowBlur = 0;
    pop();
    this._drawLabel(bs);
  }

  spawnParticles(bs) {
    if (bs.step === 0 && frameCount % 4 === 0)
      spawnParticle(new GrainParticle(
        this.x + random(-this.w * .15, this.w * .15),
        this.y - this.h * .1
      ));
  }
}

// =============================================================================
// MaischTank  (step 1)
// =============================================================================
class MaischTank extends Tank {
  spawnParticles(bs) {
    if (bs.step === 1 && frameCount % 5 === 0)
      spawnParticle(new SteamParticle(
        this.x + random(-this.w * .28, this.w * .28), this.y - this.h / 2
      ));
  }
}

// =============================================================================
// LauterTank  (step 2) – slightly wider aspect, same cylinder
// =============================================================================
class LauterTank extends Tank {}

// =============================================================================
// BoilKettle  (step 3) – heating band + lid detail
// =============================================================================
class BoilKettle extends Tank {
  draw(bs) {
    let active = this.isActive(bs);
    let geo = _drawCylBody(this, bs, active);

    // Heating jacket band around lower body (wider outline rect)
    push();
    let bandTop = geo.bTop + geo.bH * .55;
    let bandH   = geo.bH * .42;
    noFill(); stroke(120, 90, 50); strokeWeight(3.5);
    rect(geo.lx - 4, bandTop, this.w + 8, bandH, 2);
    stroke(80, 60, 30); strokeWeight(1);
    rect(geo.lx - 4, bandTop, this.w + 8, bandH, 2);
    // Steam outlet on top
    stroke(70, 85, 95); strokeWeight(4);
    line(this.x + this.w * .2, geo.bTop - geo.eh * .5, this.x + this.w * .2, geo.bTop - geo.eh * .5 - 14);
    fill(80, 95, 105); stroke(65, 80, 90); strokeWeight(1);
    ellipse(this.x + this.w * .2, geo.bTop - geo.eh * .5 - 16, 10, 6);
    pop();

    this._drawLabel(bs);
  }

  spawnParticles(bs) {
    if (bs.step !== 3) return;
    if (frameCount % 4 === 0) spawnParticle(new BubbleParticle(this.x, this.y + this.h * .25, this.w));
    if (frameCount % 7 === 0) spawnParticle(new SteamParticle(this.x + random(-this.w*.3,this.w*.3), this.y - this.h / 2));
    if (bs.stepProgress < .65 && frameCount % 18 === 0) spawnParticle(new HopParticle(this.x, this.y - this.h / 2));
  }
}

// =============================================================================
// WhirlpoolTank  (step 4) – circular top-view vessel
// =============================================================================
class WhirlpoolTank extends Tank {
  constructor(def) { super(def); this.spinAngle = 0; }

  update(bs) {
    super.update(bs);
    if (bs.step === 4) this.spinAngle += 0.04;
  }

  draw(bs) {
    this._drawCircular(bs, this.isActive(bs));

    // Spiral swirl overlay when active
    if (bs.step === 4) {
      push();
      noFill(); strokeWeight(1);
      for (let arm = 0; arm < 3; arm++) {
        stroke(255, 215, 0, 60);
        beginShape();
        let baseA = this.spinAngle + arm * TWO_PI / 3;
        for (let i = 0; i < 40; i++) {
          let t = i / 39;
          let r = t * this.w * .38;
          let a = baseA + t * TWO_PI * 1.2;
          vertex(this.x + cos(a) * r, this.y + sin(a) * r);
        }
        endShape();
      }
      // Tangential inlet pipe stub
      stroke(58, 72, 84); strokeWeight(5);
      line(this.x + this.w * .5, this.y, this.x + this.w * .5 + 14, this.y);
      fill(68, 82, 94); stroke(54, 68, 80); strokeWeight(1);
      ellipse(this.x + this.w * .5 + 16, this.y, 8, 12);
      pop();
    }

    this._drawLabel(bs);
  }

  spawnParticles(bs) {
    if (bs.step === 4 && frameCount % 6 === 0)
      spawnParticle(new TrubParticle(this.x, this.y, random(TWO_PI), this.w * .42));
  }
}

// =============================================================================
// CoolerTank  (step 5) – plate heat exchanger (not cylindrical)
// =============================================================================
class CoolerTank extends Tank {
  draw(bs) {
    let active = this.isActive(bs);
    let lx = this.x - this.w / 2;
    let ly = this.y - this.h / 2;
    let t  = bs ? bs.stepProgress : 0;
    push();
    if (active) { drawingContext.shadowBlur = 20; drawingContext.shadowColor = '#FFD700'; }

    // End frames (thick plates)
    fill(50, 65, 77); stroke(36, 50, 62); strokeWeight(1);
    rect(lx,             ly, 8, this.h, 2);
    rect(lx + this.w - 8, ly, 8, this.h, 2);

    // Plate stack background
    fill(28, 40, 52); noStroke();
    rect(lx + 8, ly, this.w - 16, this.h);

    // Corrugated plates (horizontal lines)
    let numPlates = 12;
    for (let i = 0; i < numPlates; i++) {
      let py = ly + (this.h / (numPlates + 1)) * (i + 1);
      // Hot side (red) vs cold side (blue) — alternating
      let warm = color(220, 80, 50);
      let cool = color(60, 110, 220);
      let col  = lerpColor(warm, cool, constrain(t + (i / numPlates) * .4, 0, 1));
      stroke(col); strokeWeight(1.4);
      for (let xi = 0; xi < this.w - 18; xi += 4) {
        let off = sin((xi + frameCount * 0.5) * .5) * 1.2;
        line(lx + 9 + xi, py + off, lx + 9 + xi + 3, py - off);
      }
    }

    // Tie bolts (corners)
    fill(55, 68, 80); stroke(42, 55, 67); strokeWeight(1);
    for (let bx of [lx + 4, lx + this.w - 4]) {
      for (let by of [ly + 8, ly + this.h - 8]) {
        ellipse(bx, by, 6, 6);
      }
    }
    // Inlet (hot, top-right) and outlet (cold, bottom-left) nozzles
    stroke(200, 80, 50); strokeWeight(3);
    line(lx + this.w, ly + 10, lx + this.w + 10, ly + 10);
    stroke(60, 110, 220); strokeWeight(3);
    line(lx, ly + this.h - 10, lx - 10, ly + this.h - 10);
    stroke(60, 110, 220); strokeWeight(3);
    line(lx + this.w, ly + this.h - 10, lx + this.w + 10, ly + this.h - 10);
    stroke(200, 80, 50); strokeWeight(3);
    line(lx, ly + 10, lx - 10, ly + 10);

    // Outline
    noFill();
    stroke(active ? '#FFD700' : '#566878');
    strokeWeight(active ? 2.5 : 1.5);
    rect(lx, ly, this.w, this.h, 2);
    drawingContext.shadowBlur = 0;
    pop();
    this._drawLabel(bs);
  }
}

// =============================================================================
// GaerTank  (step 6) – conical fermenter + cooling jacket bands
// =============================================================================
class GaerTank extends Tank {
  constructor(def) { super(def); this.conical = true; }

  draw(bs) {
    let active = this.isActive(bs);
    let geo = _drawCylBody(this, bs, active);

    // Cooling jacket bands (2 bands)
    push();
    noFill(); stroke(60, 110, 180); strokeWeight(3);
    rect(geo.lx - 3, geo.bTop + geo.bH * .12, this.w + 6, geo.bH * .22, 2);
    rect(geo.lx - 3, geo.bTop + geo.bH * .52, this.w + 6, geo.bH * .22, 2);
    // Jacket inlet/outlet stubs
    stroke(55, 100, 165); strokeWeight(3);
    line(geo.lx - 3, geo.bTop + geo.bH * .16, geo.lx - 11, geo.bTop + geo.bH * .16);
    line(geo.lx - 3, geo.bTop + geo.bH * .56, geo.lx - 11, geo.bTop + geo.bH * .56);
    pop();

    this._drawLabel(bs);
  }

  spawnParticles(bs) {
    if (bs.step !== 6) return;
    let rate = sin(bs.stepProgress * PI);
    if (frameCount % 5 === 0 && random() < rate * .85)
      spawnParticle(new BubbleParticle(this.x, this.y + this.h * .3, this.w));
  }
}

// =============================================================================
// LagerTank  (step 7) – conical + cooling jacket + ice overlay
// =============================================================================
class LagerTank extends Tank {
  constructor(def) {
    super(def);
    this.conical = true;
    this._ice = [];
    for (let i = 0; i < 8; i++)
      this._ice.push({ ox: (i % 4 - 1.5) * 20, oy: (floor(i/4) - .5) * 36, r: 5 + (i % 3) * 2.5 });
  }

  draw(bs) {
    let active = this.isActive(bs);
    let geo = _drawCylBody(this, bs, active);

    // Cooling jacket (single wide band, for Lager the whole body is jacketed)
    push();
    noFill(); stroke(80, 130, 200); strokeWeight(2.5);
    rect(geo.lx - 4, geo.bTop + geo.bH * .08, this.w + 8, geo.bH * .82, 2);
    // Small insulation bumps
    stroke(60, 100, 170); strokeWeight(1.2);
    for (let i = 0; i < 5; i++) {
      let bumpY = geo.bTop + geo.bH * (.12 + i * .16);
      line(geo.lx - 4, bumpY, geo.lx + this.w + 4, bumpY);
    }
    pop();

    // Ice crystal overlay (step 7)
    if (bs && bs.step === 7 && bs.stepProgress > .05) {
      let alpha = bs.stepProgress * 170;
      push();
      stroke(200, 230, 255, alpha); strokeWeight(0.8); noFill();
      for (let ic of this._ice) {
        let cx = this.x + ic.ox, cy = this.y + ic.oy;
        for (let k = 0; k < 6; k++) {
          let ang = k * PI / 3;
          line(cx, cy, cx + cos(ang) * ic.r, cy + sin(ang) * ic.r);
        }
      }
      pop();
    }

    this._drawLabel(bs);
  }
}

// =============================================================================
// FilterTank  (step 8) – filter column with turbid→clear gradient
// =============================================================================
class FilterTank extends Tank {
  draw(bs) {
    let active = this.isActive(bs);
    let geo = _drawCylBody(this, bs, active);

    if (bs && bs.step === 8 && this.fillLevel > 0) {
      push();
      let t    = bs.stepProgress;
      let lh   = geo.bH * this.fillLevel;
      let lTop = geo.bTop + geo.bH - lh;
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(geo.lx + 2, geo.bTop, this.w - 4, geo.bH);
      drawingContext.clip();
      // Vertical turbid→clear gradient
      let vg = drawingContext.createLinearGradient(0, geo.bTop + geo.bH, 0, lTop);
      let liqC = color(COL.liquid[8]);
      let rv = red(liqC)|0, gv = green(liqC)|0, bv = blue(liqC)|0;
      vg.addColorStop(0,   `rgba(${rv},${gv},${bv},0.95)`);
      vg.addColorStop(constrain(t, .05, .95), `rgba(${rv},${gv},${bv},0.30)`);
      vg.addColorStop(1,   `rgba(${min(rv+60,255)|0},${min(gv+55,255)|0},${min(bv+20,255)|0},0.12)`);
      drawingContext.fillStyle = vg;
      drawingContext.fillRect(geo.lx + 2, lTop, this.w - 4, lh);
      // Filter media dots
      stroke(100, 120, 90, 120); strokeWeight(1.5); noFill();
      for (let fi = 0; fi < 3; fi++) {
        let fy = geo.bTop + geo.bH * (.3 + fi * .22);
        for (let fj = 0; fj < 4; fj++) {
          ellipse(geo.lx + this.w * (.2 + fj * .2), fy, 3, 3);
        }
      }
      drawingContext.restore();
      pop();
    }

    this._drawLabel(bs);
  }
}

// =============================================================================
// BottleStation  (step 9) – filling carousel + bottles
// =============================================================================
class BottleStation extends Tank {
  draw(bs) {
    let active = this.isActive(bs);
    let geo = _drawCylBody(this, bs, active);

    if (bs && bs.step === 9 && bs.stepProgress > .02) {
      push();
      let count  = max(1, floor(bs.stepProgress * 4) + 1);
      let startX = this.x - this.w * .3;
      let botY   = geo.bTop + geo.bH * .85;
      let spacing = this.w * .55 / max(count - 1, 1);
      for (let i = 0; i < count; i++) {
        let bx = (count === 1) ? this.x : startX + i * spacing;
        // Filling head (inverted triangle / nozzle)
        fill(70, 85, 97); stroke(56, 70, 82); strokeWeight(1);
        triangle(bx - 5, botY - 16, bx + 5, botY - 16, bx, botY - 6);
        // Beer stream
        if (bs.stepProgress > .1) {
          stroke(220, 180, 30, 160); strokeWeight(2);
          line(bx, botY - 6, bx, botY - 1);
        }
        // Bottle
        fill(180, 148, 20); stroke(140, 110, 16); strokeWeight(1);
        rect(bx - 4, botY, 8, 16, 1);      // body
        rect(bx - 2, botY - 6, 4, 8, 1);   // neck
        fill(220, 185, 30, 180); noStroke();
        rect(bx - 3, botY + 6, 6, 8, 1);   // beer
        // Label
        fill(240, 220, 160); noStroke();
        rect(bx - 3, botY + 3, 6, 5);
      }
      // Bottle counter
      fill(COL.highlight); noStroke(); textSize(9); textFont('monospace');
      textAlign(CENTER, TOP);
      text(bs.bottles + ' st', this.x, geo.bTop + geo.bH * .94);
      pop();
    }

    this._drawLabel(bs);
  }
}

// =============================================================================
// Factory function
// =============================================================================
function createTank(def) {
  switch (def.id) {
    case 0: return new MoutmolenTank(def);
    case 1: return new MaischTank(def);
    case 2: return new LauterTank(def);
    case 3: return new BoilKettle(def);
    case 4: return new WhirlpoolTank(def);
    case 5: return new CoolerTank(def);
    case 6: return new GaerTank(def);
    case 7: return new LagerTank(def);
    case 8: return new FilterTank(def);
    case 9: return new BottleStation(def);
    default: return new Tank(def);
  }
}
