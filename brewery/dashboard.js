'use strict';

class ChemDashboard {
  constructor() {
    this.y = ZONE.DASH_TOP;
    this.h = ZONE.DASH_BOT - ZONE.DASH_TOP;
  }

  draw(bs) {
    push();

    // Background + top border
    fill(COL.bgDash);
    noStroke();
    rect(0, this.y, CANVAS_W, this.h);
    stroke(COL.tankOutline);
    strokeWeight(1);
    line(0, this.y, CANVAS_W, this.y);

    let panelW = CANVAS_W / 6;
    let py     = this.y;

    this._drawTempGauge (panelW * 0, py, bs.temp,  0,   105, '°C', 'Temperatuur', color(255, 107, 53));
    this._drawSGPanel   (panelW * 1, py, bs.sg);
    this._drawBarPanel  (panelW * 2, py, bs.abv,   0,   6,   '% ABV', 'Alcohol',    color(242, 201, 76));
    this._drawBarPanel  (panelW * 3, py, bs.ibu,   0,   25,  ' IBU',  'Bitterheid', color(90, 138, 60));
    this._drawPhGauge   (panelW * 4, py, bs.ph,    3.5, 8,   ' pH',   'pH',         color(126, 200, 227));
    if (bs.step === 9) this._drawBottleCounter(panelW * 5, py, bs.bottles);
    else               this._drawCO2Panel     (panelW * 5, py, bs.co2);

    // Full-width temperature sparkline
    this._drawSparkline(bs.hist.temp, 0, 105, color(255, 107, 53), 'T°C', py);

    pop();
  }

  // Semi-circle gauge
  _drawTempGauge(x, py, val, lo, hi, unit, label, col) {
    let cx = x + (CANVAS_W / 6) / 2;
    let cy = py + 62;
    let r  = 38;
    push();
    fill(COL.text); noStroke();
    textAlign(CENTER, TOP); textSize(9);
    text(label, cx, py + 4);

    // track
    stroke(30, 50, 70); strokeWeight(7); noFill();
    arc(cx, cy, r * 2, r * 2, PI, TWO_PI);

    // value arc
    let endA = map(val, lo, hi, PI, TWO_PI);
    stroke(col); strokeWeight(7);
    arc(cx, cy, r * 2, r * 2, PI, endA);

    // text
    fill(COL.text); noStroke();
    textAlign(CENTER, CENTER); textSize(12); textFont('monospace');
    text(nf(val, 1, 0) + unit, cx, cy + 16);
    pop();
  }

  _drawPhGauge(x, py, val, lo, hi, unit, label, col) {
    this._drawTempGauge(x, py, val, lo, hi, unit, label, col);
  }

  // Specific gravity panel
  _drawSGPanel(x, py, sg) {
    let cx  = x + (CANVAS_W / 6) / 2;
    let bx  = x + 18;
    let by  = py + 22;
    let bw  = (CANVAS_W / 6) - 36;
    let bh  = 18;
    push();
    fill(COL.text); noStroke();
    textAlign(CENTER, TOP); textSize(9);
    text('Specific Gravity', cx, py + 4);

    fill(30, 50, 70); noStroke();
    rect(bx, by, bw, bh, 3);
    let tw = map(sg, 1.000, 1.060, 0, bw);
    fill(color(212, 160, 23));
    rect(bx, by, tw, bh, 3);

    fill(COL.text);
    textAlign(CENTER, CENTER); textSize(15); textFont('monospace');
    text(nf(sg, 1, 3), cx, by + bh + 14);

    textSize(8);
    textAlign(LEFT, TOP);  text('OG 1.048', bx,          by + bh + 28);
    textAlign(RIGHT, TOP); text('FG 1.010', bx + bw,     by + bh + 28);
    pop();
  }

  // Generic horizontal bar
  _drawBarPanel(x, py, val, lo, hi, unit, label, col) {
    let cx = x + (CANVAS_W / 6) / 2;
    let bx = x + 18;
    let by = py + 22;
    let bw = (CANVAS_W / 6) - 36;
    let bh = 18;
    push();
    fill(COL.text); noStroke();
    textAlign(CENTER, TOP); textSize(9);
    text(label, cx, py + 4);

    fill(30, 50, 70); noStroke();
    rect(bx, by, bw, bh, 3);
    let tw = map(val, lo, hi, 0, bw);
    fill(col);
    rect(bx, by, max(0, tw), bh, 3);

    fill(COL.text);
    textAlign(CENTER, CENTER); textSize(13); textFont('monospace');
    text(nf(val, 1, 1) + unit, cx, by + bh + 14);
    pop();
  }

  // CO₂ pulsing circle
  _drawCO2Panel(x, py, co2) {
    let cx = x + (CANVAS_W / 6) / 2;
    push();
    fill(COL.text); noStroke();
    textAlign(CENTER, TOP); textSize(9);
    text('CO\u2082 Productie', cx, py + 4);

    let r = 18 + co2 * 22;
    fill(50, 180, 255, 80 + co2 * 160);
    noStroke();
    ellipse(cx, py + 62, r * 2, r * 2);

    fill(COL.text);
    textAlign(CENTER, CENTER); textSize(10);
    text(co2 > 0.05 ? 'Actief' : 'Inactief', cx, py + 100);
    pop();
  }

  // Bottle counter
  _drawBottleCounter(x, py, bottles) {
    let cx = x + (CANVAS_W / 6) / 2;
    push();
    fill(COL.text); noStroke();
    textAlign(CENTER, TOP); textSize(9);
    text('Flessen gevuld', cx, py + 4);

    fill(COL.highlight);
    textAlign(CENTER, CENTER); textSize(26); textFont('monospace');
    text(bottles, cx, py + 55);

    fill(COL.text); textSize(10);
    text('flessen 🍺', cx, py + 80);
    pop();
  }

  // Sparkline at the very bottom of the dashboard
  _drawSparkline(data, lo, hi, col, label, py) {
    if (data.length < 2) return;
    let gx = 10, gy = py + 112, gw = CANVAS_W - 20, gh = 30;
    push();
    fill(10, 25, 45); noStroke();
    rect(gx, gy, gw, gh, 3);

    stroke(col); strokeWeight(1.5); noFill();
    beginShape();
    for (let i = 0; i < data.length; i++) {
      let px = map(i, 0, data.length - 1, gx + 4, gx + gw - 4);
      let py2 = map(data[i], lo, hi, gy + gh - 4, gy + 4);
      vertex(px, py2);
    }
    endShape();

    fill(COL.text); noStroke(); textSize(8); textAlign(LEFT, CENTER);
    text(label, gx + 4, gy + gh / 2);
    pop();
  }
}
