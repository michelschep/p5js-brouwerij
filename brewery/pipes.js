'use strict';

const PIPE_CONNS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 6, to: 7 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
];

class Pipe {
  constructor(fromTank, toTank) {
    this.from      = fromTank;
    this.to        = toTank;
    this.flowTimer = 0;
    this.flowInt   = 0.25;  // seconds between flow particle spawns
  }

  // Connection points at tank edges
  _pts() {
    let f = this.from, t = this.to;
    if (f.x < t.x) {
      // left-to-right
      return { sx: f.x + f.w / 2, sy: f.y, ex: t.x - t.w / 2, ey: t.y };
    } else if (f.x === t.x) {
      // vertical (Gärtank → Lagertank)
      return { sx: f.x, sy: f.y + f.h / 2, ex: t.x, ey: t.y - t.h / 2 };
    }
    // fallback right-to-left (unused)
    return { sx: f.x - f.w / 2, sy: f.y, ex: t.x + t.w / 2, ey: t.y };
  }

  isActive(bs) {
    return this.from.id === bs.getActiveTankId();
  }

  update(bs, dt) {
    if (!this.isActive(bs)) { this.flowTimer = 0; return; }
    this.flowTimer += dt * bs.speed;
    if (this.flowTimer >= this.flowInt) {
      this.flowTimer = 0;
      let pts = this._pts();
      spawnParticle(new FlowParticle(
        pts.sx, pts.sy, pts.ex, pts.ey,
        color(COL.liquid[bs.step])
      ));
    }
  }

  draw(bs) {
    let pts    = this._pts();
    let active = this.isActive(bs);

    push();
    strokeCap(ROUND);
    noFill();

    // Pipe body
    stroke(active ? '#3A5565' : COL.pipe);
    strokeWeight(8);
    this._path(pts);

    // Active highlight overlay
    if (active) {
      stroke(255, 215, 0, 55);
      strokeWeight(4);
      this._path(pts);
    }
    pop();
  }

  _path(pts) {
    let sameX = pts.sx === pts.ex;
    let sameY = pts.sy === pts.ey;

    if (sameX || sameY) {
      line(pts.sx, pts.sy, pts.ex, pts.ey);
    } else {
      beginShape();
      vertex(pts.sx, pts.sy);
      bezierVertex(pts.sx + 30, pts.sy, pts.ex - 30, pts.ey, pts.ex, pts.ey);
      endShape();
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level pipe list
// ---------------------------------------------------------------------------
let pipes = [];

function createPipes(tankArr) {
  pipes = [];
  for (let c of PIPE_CONNS) {
    let f = tankArr.find(t => t.id === c.from);
    let g = tankArr.find(t => t.id === c.to);
    if (f && g) pipes.push(new Pipe(f, g));
  }
}
