'use strict';

// ---------------------------------------------------------------------------
// Base Tank
// ---------------------------------------------------------------------------
class Tank {
  constructor(def) {
    this.id       = def.id;
    this.name     = def.name;
    this.x        = def.x;
    this.y        = def.y;
    this.w        = def.w;
    this.h        = def.h;
    this.isCircle = def.circle;
    this.fillLevel = 0;
    this.hovered   = false;
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
    if (this.isCircle) {
      return dist(mouseX, mouseY, this.x, this.y) < this.w * 0.5;
    }
    return mouseX > this.x - this.w / 2 && mouseX < this.x + this.w / 2 &&
           mouseY > this.y - this.h / 2 && mouseY < this.y + this.h / 2;
  }

  draw(bs) {
    let active = this.isActive(bs);
    push();
    if (active) {
      drawingContext.shadowBlur  = 22;
      drawingContext.shadowColor = '#FFD700';
    }
    if (this.isCircle) this._drawCircle(bs, active);
    else               this._drawRect(bs, active);

    // label
    drawingContext.shadowBlur = 0;
    noStroke();
    fill(COL.text);
    textAlign(CENTER, TOP);
    textSize(10);
    textFont('monospace');
    text(this.name, this.x, this.y + this.h / 2 + 6);
    pop();
  }

  _drawRect(bs, active) {
    let lx = this.x - this.w / 2;
    let ly = this.y - this.h / 2;

    // body
    fill(10, 25, 55);
    stroke(COL.tankOutline);
    strokeWeight(active ? 2.5 : 1.5);
    rect(lx, ly, this.w, this.h, 4);

    // liquid fill
    if (this.fillLevel > 0) {
      let lh  = this.h * this.fillLevel;
      let lyy = ly + this.h - lh;
      noStroke();
      fill(this._liquidColor(bs));
      rect(lx + 2, lyy, this.w - 4, lh - 2, 0, 0, 3, 3);
    }

    // outline on top
    noFill();
    stroke(active ? COL.highlight : COL.tankOutline);
    strokeWeight(active ? 2.5 : 1.5);
    rect(lx, ly, this.w, this.h, 4);
  }

  _drawCircle(bs, active) {
    let r = this.w / 2;

    fill(10, 25, 55);
    stroke(COL.tankOutline);
    strokeWeight(active ? 2.5 : 1.5);
    ellipse(this.x, this.y, this.w, this.h);

    if (this.fillLevel > 0) {
      let lh  = this.h * this.fillLevel;
      let lyy = this.y + this.h / 2 - lh;
      noStroke();
      fill(this._liquidColor(bs));

      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.arc(this.x, this.y, r - 2, 0, TWO_PI);
      drawingContext.clip();
      rect(this.x - r, lyy, this.w, lh);
      drawingContext.restore();
    }

    noFill();
    stroke(active ? COL.highlight : COL.tankOutline);
    strokeWeight(active ? 2.5 : 1.5);
    ellipse(this.x, this.y, this.w, this.h);
  }

  _liquidColor(bs) {
    return COL.liquid[bs.step] || COL.liquid[0];
  }

  spawnParticles() {}  // override in subclasses
}

// ---------------------------------------------------------------------------
// MoutmolenTank  (step 0) – falling grain kernels
// ---------------------------------------------------------------------------
class MoutmolenTank extends Tank {
  spawnParticles(bs) {
    if (bs.step === 0 && frameCount % 4 === 0)
      spawnParticle(new GrainParticle(
        this.x + random(-this.w * 0.3, this.w * 0.3),
        this.y - this.h * 0.4
      ));
  }
}

// ---------------------------------------------------------------------------
// MaischTank  (step 1) – steam + temperature colour
// ---------------------------------------------------------------------------
class MaischTank extends Tank {
  spawnParticles(bs) {
    if (bs.step === 1 && frameCount % 5 === 0)
      spawnParticle(new SteamParticle(
        this.x + random(-this.w * 0.3, this.w * 0.3),
        this.y - this.h / 2
      ));
  }
}

// ---------------------------------------------------------------------------
// BoilKettle  (step 3) – boiling bubbles + steam + hop drops
// ---------------------------------------------------------------------------
class BoilKettle extends Tank {
  spawnParticles(bs) {
    if (bs.step !== 3) return;
    if (frameCount % 4 === 0)
      spawnParticle(new BubbleParticle(this.x, this.y + this.h * 0.25, this.w));
    if (frameCount % 7 === 0)
      spawnParticle(new SteamParticle(
        this.x + random(-this.w * 0.35, this.w * 0.35),
        this.y - this.h / 2
      ));
    if (bs.stepProgress < 0.65 && frameCount % 18 === 0)
      spawnParticle(new HopParticle(this.x, this.y - this.h / 2));
  }
}

// ---------------------------------------------------------------------------
// WhirlpoolTank  (step 4) – spiralling trub + rotation indicator
// ---------------------------------------------------------------------------
class WhirlpoolTank extends Tank {
  constructor(def) {
    super(def);
    this.spinAngle = 0;
  }

  update(bs) {
    super.update(bs);
    if (bs.step === 4) this.spinAngle += 0.04;
  }

  draw(bs) {
    super.draw(bs);
    if (bs.step === 4) {
      push();
      noFill();
      stroke(255, 215, 0, 90);
      strokeWeight(1.2);
      let r = this.w * 0.28;
      for (let i = 0; i < 3; i++) {
        let a = this.spinAngle + i * TWO_PI / 3;
        line(
          this.x + cos(a) * r * 0.25, this.y + sin(a) * r * 0.25,
          this.x + cos(a) * r,        this.y + sin(a) * r
        );
      }
      pop();
    }
  }

  spawnParticles(bs) {
    if (bs.step === 4 && frameCount % 6 === 0) {
      let r = this.w * 0.42;
      spawnParticle(new TrubParticle(this.x, this.y, random(TWO_PI), r));
    }
  }
}

// ---------------------------------------------------------------------------
// CoolerTank  (step 5) – warm→cool colour bands
// ---------------------------------------------------------------------------
class CoolerTank extends Tank {
  draw(bs) {
    super.draw(bs);
    if (bs.step === 5) {
      push();
      let t = bs.stepProgress;
      let warm = color(255, 80, 50);
      let cool = color(50, 100, 255);
      let lx = this.x - this.w / 2 + 4;
      let lines = 5;
      for (let i = 0; i < lines; i++) {
        let f = i / (lines - 1);
        stroke(lerpColor(warm, cool, constrain(t + f * 0.3, 0, 1)));
        strokeWeight(1.8);
        let xp = lx + (this.w - 8) * f;
        line(xp, this.y - this.h / 2 + 6, xp, this.y + this.h / 2 - 6);
      }
      pop();
    }
  }
}

// ---------------------------------------------------------------------------
// GaerTank  (step 6) – CO₂ bubble animation
// ---------------------------------------------------------------------------
class GaerTank extends Tank {
  spawnParticles(bs) {
    if (bs.step !== 6) return;
    let rate = sin(bs.stepProgress * PI);
    if (frameCount % 5 === 0 && random() < rate * 0.85)
      spawnParticle(new BubbleParticle(this.x, this.y + this.h * 0.3, this.w));
  }
}

// ---------------------------------------------------------------------------
// LagerTank  (step 7) – ice crystal overlay
// ---------------------------------------------------------------------------
class LagerTank extends Tank {
  constructor(def) {
    super(def);
    // Precompute ice crystal positions (stable, not recomputed each frame)
    this._ice = [];
    for (let i = 0; i < 9; i++) {
      this._ice.push({
        ox: (i % 3 - 1) * 28 + sin(i * 1.7) * 8,
        oy: (floor(i / 3) - 1) * 40 + cos(i * 2.3) * 6,
        r:  6 + (i % 4) * 2,
      });
    }
  }

  draw(bs) {
    super.draw(bs);
    if (bs.step === 7 && bs.stepProgress > 0.05) {
      let a = bs.stepProgress * 160;
      push();
      stroke(200, 230, 255, a);
      strokeWeight(0.8);
      for (let ic of this._ice) {
        let cx = this.x + ic.ox;
        let cy = this.y + ic.oy;
        for (let k = 0; k < 6; k++) {
          let ang = k * PI / 3;
          line(cx, cy, cx + cos(ang) * ic.r, cy + sin(ang) * ic.r);
        }
      }
      pop();
    }
  }
}

// ---------------------------------------------------------------------------
// FilterTank  (step 8) – turbid→clear gradient arrow
// ---------------------------------------------------------------------------
class FilterTank extends Tank {
  draw(bs) {
    super.draw(bs);
    if (bs.step === 8 && this.fillLevel > 0) {
      push();
      let t  = bs.stepProgress;
      let lx = this.x - this.w / 2 + 2;
      let ly = this.y - this.h / 2 + 2;
      let lw = this.w - 4;
      let lh = this.h * this.fillLevel - 2;
      // Turbid side → clear side gradient
      let turbid = color(200, 168, 56, 120);
      let clear  = color(255, 215, 0, 200);
      for (let i = 0; i < lw; i++) {
        let f = i / lw;
        stroke(lerpColor(turbid, clear, constrain(f / max(0.01, t), 0, 1)));
        strokeWeight(1);
        line(lx + i, ly + lh, lx + i, ly);
      }
      pop();
    }
  }
}

// ---------------------------------------------------------------------------
// BottleStation  (step 9) – mini bottle row
// ---------------------------------------------------------------------------
class BottleStation extends Tank {
  draw(bs) {
    super.draw(bs);
    if (bs.step === 9 && bs.stepProgress > 0.02) {
      push();
      let count  = floor(bs.stepProgress * 5);
      let startX = this.x - this.w / 2 + 8;
      let botY   = this.y + this.h / 2 - 10;
      for (let i = 0; i < count; i++) {
        let bx = startX + i * 13;
        // bottle body
        fill(200, 160, 20);
        noStroke();
        rect(bx, botY - 20, 9, 18, 2);
        // neck
        rect(bx + 2, botY - 28, 5, 10, 1);
        // beer inside
        fill(255, 215, 0, 180);
        rect(bx + 1, botY - 5, 7, 10, 1);
      }
      pop();
    }
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------
function createTank(def) {
  switch (def.id) {
    case 0: return new MoutmolenTank(def);
    case 1: return new MaischTank(def);
    case 2: return new Tank(def);
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
