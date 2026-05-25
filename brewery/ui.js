'use strict';

class UIManager {
  constructor() {
    this.tooltip    = null;
    this.popup      = null;
    this.popupTimer = 0;
  }

  update(tanks, bs, dt) {
    this.tooltip = null;
    for (let t of tanks) {
      if (t.hovered) { this.tooltip = { tank: t }; break; }
    }
    if (this.popup) {
      this.popupTimer -= dt * bs.speed;
      if (this.popupTimer <= 0) this.popup = null;
    }
  }

  showPopup(tank, bs) {
    this.popup      = { tank, bs };
    this.popupTimer = 6;
  }

  draw(bs) {
    if (this.tooltip) this._drawTooltip(this.tooltip.tank, bs);
    if (this.popup)   this._drawPopup(this.popup.tank, this.popup.bs);
  }

  _drawTooltip(t, bs) {
    let active = t.isActive(bs);
    let lines  = [
      t.name,
      active            ? '\u26a1 Actief'          :
      t.isPast(bs)      ? '\u2713 Gereed'           : '\u25cb Wacht',
    ];
    if (active) {
      lines.push('Temp: ' + nf(bs.temp, 1, 0) + '\u00b0C');
      lines.push('Stap: ' + STEP_DEFS[bs.step].name);
    }

    let pw = 150, ph = lines.length * 17 + 12;
    let tx = constrain(t.x - pw / 2, 4, CANVAS_W - pw - 4);
    let ty = constrain(t.y - t.h / 2 - ph - 8, ZONE.FACTORY_TOP + 4, ZONE.FACTORY_BOT - ph - 4);

    push();
    fill(8, 22, 52, 225);
    stroke(COL.tankOutline); strokeWeight(1);
    rect(tx, ty, pw, ph, 5);

    noStroke(); textSize(10); textFont('Arial'); textAlign(LEFT, TOP);
    for (let i = 0; i < lines.length; i++) {
      fill(i === 0 ? (active ? COL.highlight : COL.text) : '#9AAFC0');
      text(lines[i], tx + 8, ty + 8 + i * 17);
    }
    pop();
  }

  _drawPopup(t, bs) {
    let def  = STEP_DEFS[t.id];
    let desc = STEP_DESCRIPTIONS[t.id] || '';
    let lines = [
      '=== ' + t.name + ' ===',
      'Stap: ' + def.name,
      'Temp: ' + def.tempStart + '\u2013' + def.tempEnd + '\u00b0C',
      'Duur: ' + def.realTime,
      '',
    ].concat(desc.split('\n'));

    let pw = 230, ph = lines.length * 16 + 14;
    let px = constrain(t.x - pw / 2, 4, CANVAS_W - pw - 4);
    let py = constrain(t.y - ph / 2, ZONE.FACTORY_TOP + 4, ZONE.FACTORY_BOT - ph - 4);

    push();
    fill(4, 16, 40, 245);
    stroke(COL.highlight); strokeWeight(1.5);
    rect(px, py, pw, ph, 6);

    textSize(11); textFont('monospace'); textAlign(LEFT, TOP); noStroke();
    fill(COL.highlight);
    text(lines[0], px + 8, py + 8);
    fill(COL.text); textSize(10);
    for (let i = 1; i < lines.length; i++)
      text(lines[i], px + 8, py + 8 + i * 16);
    pop();
  }
}
