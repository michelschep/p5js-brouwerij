'use strict';

// ---------------------------------------------------------------------------
// Base Particle
// ---------------------------------------------------------------------------
class Particle {
  constructor(x, y, vx, vy, sz, col, lifetime) {
    this.x        = x;
    this.y        = y;
    this.vx       = vx;
    this.vy       = vy;
    this.sz       = sz;
    this.col      = col;   // p5 Color object
    this.lifetime = lifetime;
    this.maxLife  = lifetime;
    this.active   = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    if (this.lifetime <= 0) this.active = false;
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 255);
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), a);
    ellipse(this.x, this.y, this.sz, this.sz);
  }

  isDead() { return !this.active; }
}

// ---------------------------------------------------------------------------
// GrainParticle – falling grain kernels at Moutmolen
// ---------------------------------------------------------------------------
class GrainParticle extends Particle {
  constructor(x, y) {
    super(x, y, random(-0.8, 0.8), random(1.5, 3), random(3, 6), color(139, 105, 20), 55);
    this.angle = random(TWO_PI);
  }

  update() {
    this.vy += 0.12;
    super.update();
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 210);
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    fill(139, 105, 20, a);
    ellipse(0, 0, this.sz * 1.6, this.sz);
    pop();
  }
}

// ---------------------------------------------------------------------------
// SteamParticle – rising steam clouds
// ---------------------------------------------------------------------------
class SteamParticle extends Particle {
  constructor(x, y) {
    super(x, y, random(-0.4, 0.4), random(-1.2, -0.4), random(10, 22), color(255, 255, 255), 75);
    this.wobble = random(TWO_PI);
  }

  update() {
    this.wobble += 0.06;
    this.x += sin(this.wobble) * 0.3;
    super.update();
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 55);
    noStroke();
    fill(220, 230, 255, a);
    ellipse(this.x, this.y, this.sz, this.sz);
  }
}

// ---------------------------------------------------------------------------
// BubbleParticle – CO₂ bubbles rising in fermenter / boil
// ---------------------------------------------------------------------------
class BubbleParticle extends Particle {
  constructor(x, y, tankW) {
    let bx = x + random(-tankW * 0.3, tankW * 0.3);
    super(bx, y, 0, random(-1.2, -0.4), random(4, 10), color(126, 200, 227), 85);
    this.wobble = random(TWO_PI);
    this.wobbleSpeed = random(0.04, 0.12);
  }

  update() {
    this.wobble += this.wobbleSpeed;
    this.x += sin(this.wobble) * 0.5;
    this.lifetime--;
    if (this.lifetime <= 0) this.active = false;
    this.y += this.vy;
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 160);
    noFill();
    stroke(126, 200, 227, a);
    strokeWeight(1.2);
    ellipse(this.x, this.y, this.sz, this.sz);
    noStroke();
  }
}

// ---------------------------------------------------------------------------
// HopParticle – hop pellets falling into boil kettle
// ---------------------------------------------------------------------------
class HopParticle extends Particle {
  constructor(x, y) {
    super(x + random(-25, 25), y - 15, random(-0.4, 0.4), random(0.8, 2), random(5, 9), color(90, 138, 60), 100);
  }

  update() {
    this.vy += 0.07;
    super.update();
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 220);
    push();
    translate(this.x, this.y);
    noStroke();
    fill(90, 138, 60, a);
    ellipse(0, 0, this.sz, this.sz * 0.65);
    pop();
  }
}

// ---------------------------------------------------------------------------
// TrubParticle – spiralling into whirlpool centre
// ---------------------------------------------------------------------------
class TrubParticle extends Particle {
  constructor(cx, cy, angle, radius) {
    super(
      cx + cos(angle) * radius,
      cy + sin(angle) * radius,
      0, 0,
      random(3, 7), color(139, 105, 20), 130
    );
    this.cx = cx;
    this.cy = cy;
    this.angle  = angle;
    this.radius = radius;
    this.angSpeed = 0.06;
    this.radSpeed = -0.25;
  }

  update() {
    this.angle  += this.angSpeed;
    this.radius  = max(0, this.radius + this.radSpeed);
    this.x = this.cx + cos(this.angle) * this.radius;
    this.y = this.cy + sin(this.angle) * this.radius;
    this.lifetime--;
    if (this.lifetime <= 0 || this.radius < 1) this.active = false;
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 190);
    noStroke();
    fill(139, 105, 20, a);
    ellipse(this.x, this.y, this.sz, this.sz);
  }
}

// ---------------------------------------------------------------------------
// FlowParticle – liquid flowing through a pipe
// ---------------------------------------------------------------------------
class FlowParticle extends Particle {
  constructor(x, y, tx, ty, liqColor) {
    let dx  = tx - x;
    let dy  = ty - y;
    let len = max(0.001, sqrt(dx * dx + dy * dy));
    let spd = 2.2;
    super(x, y, (dx / len) * spd, (dy / len) * spd, 5, liqColor, 80);
    this.tx = tx;
    this.ty = ty;
  }

  update() {
    super.update();
    if (dist(this.x, this.y, this.tx, this.ty) < 4) this.active = false;
  }

  draw() {
    let a = map(this.lifetime, 0, this.maxLife, 0, 200);
    noStroke();
    fill(red(this.col), green(this.col), blue(this.col), a);
    ellipse(this.x, this.y, this.sz, this.sz);
  }
}

// ---------------------------------------------------------------------------
// Global particle pool
// ---------------------------------------------------------------------------
let particles = [];

function spawnParticle(p) {
  if (particles.length < MAX_PARTICLES) particles.push(p);
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (let p of particles) p.draw();
}

function clearParticles() {
  particles = [];
}
