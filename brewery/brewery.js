'use strict';

class BreweryState {
  constructor() {
    this.step         = 0;
    this.stepTime     = 0;
    this.totalTime    = 0;
    this.stepProgress = 0;
    this.speed        = 1.0;
    this.paused       = false;
    this.done         = false;

    // Chemistry
    this.sg   = 1.000;
    this.abv  = 0.0;
    this.temp = 20;
    this.ibu  = 0;
    this.ph   = 7.0;
    this.co2  = 0;
    this.bottles = 0;

    // History (rolling 60-point buffers for sparklines)
    this.hist = { temp: [], sg: [], abv: [], ibu: [], ph: [] };
    this._histTimer = 0;
    this._histInt   = 0.5;  // record every 0.5 sim-seconds
  }

  update(dt) {
    if (this.paused || this.done) return;
    let sdt = dt * this.speed;
    this.stepTime  += sdt;
    this.totalTime += sdt;

    let def = STEP_DEFS[this.step];
    this.stepProgress = min(1, this.stepTime / def.duration);

    this._updateChem();

    this._histTimer += sdt;
    if (this._histTimer >= this._histInt) {
      this._histTimer = 0;
      this._record();
    }

    if (this.stepTime >= def.duration) this._advance();
  }

  _updateChem() {
    let s = this.step;
    let p = this.stepProgress;
    let def = STEP_DEFS[s];

    this.temp = lerp(def.tempStart, def.tempEnd, p);

    if (s < 1)      { this.sg = 1.000; this.abv = 0; this.co2 = 0; }
    else if (s < 6) { this.sg = 1.048; this.abv = 0; this.co2 = 0; }
    else if (s === 6) {
      this.sg  = lerp(1.048, 1.010, p);
      this.abv = lerp(0, 5.2, p);
      this.co2 = abs(sin(p * PI * 3)) * 0.9 + 0.1;
    } else {
      this.sg  = 1.010; this.abv = 5.2; this.co2 = 0;
    }

    if      (s === 0)       this.ph = 7.0;
    else if (s === 1)       this.ph = lerp(7.0, 5.3, p);
    else if (s < 6)         this.ph = 5.3;
    else if (s === 6)       this.ph = lerp(5.3, 4.2, p);
    else                    this.ph = 4.2;

    if      (s === 3) this.ibu = lerp(0, 18, p);
    else if (s > 3)   this.ibu = 18;
    else              this.ibu = 0;

    if (s === 9) this.bottles = floor(p * 500);
  }

  _record() {
    const MAX = 60;
    let push = (arr, v) => { arr.push(v); if (arr.length > MAX) arr.shift(); };
    push(this.hist.temp, this.temp);
    push(this.hist.sg,   this.sg);
    push(this.hist.abv,  this.abv);
    push(this.hist.ibu,  this.ibu);
    push(this.hist.ph,   this.ph);
  }

  _advance() {
    if (this.step >= STEP_DEFS.length - 1) { this.done = true; return; }
    this.step++;
    this.stepTime     = 0;
    this.stepProgress = 0;
    clearParticles();
  }

  nextStep() { this._advance(); }

  reset() {
    this.step         = 0;
    this.stepTime     = 0;
    this.totalTime    = 0;
    this.stepProgress = 0;
    this.speed        = 1.0;
    this.paused       = false;
    this.done         = false;
    this.sg = 1.000; this.abv = 0; this.temp = 20;
    this.ibu = 0; this.ph = 7.0; this.co2 = 0; this.bottles = 0;
    this.hist = { temp: [], sg: [], abv: [], ibu: [], ph: [] };
    clearParticles();
  }

  getActiveTankId() { return STEP_DEFS[this.step].tankId; }
  getLiquidColor()  { return COL.liquid[this.step]; }
}
