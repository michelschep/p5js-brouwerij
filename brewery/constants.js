'use strict';

const CANVAS_W = 1460;
const CANVAS_H = 800;

const ZONE = {
  HEADER_TOP:  0,
  HEADER_BOT:  80,
  FACTORY_TOP: 80,
  FACTORY_BOT: 650,
  DASH_TOP:    650,
  DASH_BOT:    800,
};

const COL = {
  bgHeader:    '#1E3A5F',
  bgFactory:   '#0D1B2A',
  bgDash:      '#0A1520',
  tankOutline: '#7A8B9A',
  pipe:        '#2A3540',
  pipeActive:  '#4A6070',
  text:        '#D0D8E0',
  highlight:   '#FFD700',

  // Liquid color per step index
  liquid: [
    '#8B6914', // 0: moutmolen  – dry grain
    '#F5E6A3', // 1: maischen   – light yellow
    '#D4A017', // 2: lauteren   – amber
    '#B8860B', // 3: koken      – dark amber
    '#B8860B', // 4: whirlpool  – dark amber
    '#D4A017', // 5: koeling    – amber
    '#C8A838', // 6: vergisting – cloudy gold
    '#F2C94C', // 7: lagering   – clear gold
    '#FFD700', // 8: filtering  – crystal gold
    '#FFD700', // 9: bottelen   – crystal gold
  ],
};

const TANK_DEFS = [
  { id: 0, name: 'Moutmolen',  x: 100,  y: 300, w: 80,  h: 100, circle: false },
  { id: 1, name: 'Maischtank', x: 260,  y: 300, w: 120, h: 140, circle: false },
  { id: 2, name: 'Loutervat',  x: 440,  y: 300, w: 120, h: 140, circle: false },
  { id: 3, name: 'Kookketel',  x: 620,  y: 300, w: 120, h: 140, circle: false },
  { id: 4, name: 'Whirlpool',  x: 800,  y: 300, w: 100, h: 100, circle: true  },
  { id: 5, name: 'Koeler',     x: 960,  y: 300, w: 80,  h: 120, circle: false },
  { id: 6, name: 'Gärtank',   x: 1120, y: 280, w: 100, h: 160, circle: false },
  { id: 7, name: 'Lagertank',  x: 1120, y: 500, w: 100, h: 160, circle: false },
  { id: 8, name: 'Filterunit', x: 1280, y: 380, w: 80,  h: 100, circle: false },
  { id: 9, name: 'Bottelarij', x: 1380, y: 380, w: 80,  h: 120, circle: false },
];

const STEP_DEFS = [
  { name: 'Moutwerij',  tankId: 0, duration: 10, realTime: '48u+',    tempStart: 20,  tempEnd: 50  },
  { name: 'Maischen',   tankId: 1, duration: 30, realTime: '90 min',  tempStart: 52,  tempEnd: 78  },
  { name: 'Lauteren',   tankId: 2, duration: 20, realTime: '60 min',  tempStart: 76,  tempEnd: 76  },
  { name: 'Koken',      tankId: 3, duration: 30, realTime: '90 min',  tempStart: 76,  tempEnd: 100 },
  { name: 'Whirlpool',  tankId: 4, duration: 10, realTime: '20 min',  tempStart: 98,  tempEnd: 95  },
  { name: 'Koeling',    tankId: 5, duration: 15, realTime: '30 min',  tempStart: 95,  tempEnd: 10  },
  { name: 'Vergisting', tankId: 6, duration: 45, realTime: '7-14 d',  tempStart: 10,  tempEnd: 9   },
  { name: 'Lagering',   tankId: 7, duration: 30, realTime: '6 weken', tempStart: 2,   tempEnd: 0   },
  { name: 'Filtering',  tankId: 8, duration: 10, realTime: '2 uur',   tempStart: 1,   tempEnd: 1   },
  { name: 'Bottelen',   tankId: 9, duration: 10, realTime: '1 uur',   tempStart: 5,   tempEnd: 5   },
];

const MAX_PARTICLES = 200;

const STEP_DESCRIPTIONS = [
  'Gerst → mout. Kiemen activeren\nenzymen (amylase, protease).',
  'Moutmeel + warm water.\nZetmeel → vergistbare suikers.',
  'Scheiding wort en draf.\nSparging: heet water (76°C).',
  'Koken 60-90 min. Hop toevoegen.\nIsomerisatie alfa-zuren → IBU.',
  'Centrifugeer trub naar midden.\nHeldere wort via drain eruit.',
  'Koeling 95 → 10°C.\nSnelle afkoeling = infectiepreventie.',
  'Gist gepitcht. Suikers →\nethanol + CO₂. 9°C, 7-14 dagen.',
  'Rijpen 0-2°C, 4-8 weken.\nSmaak rondt af, gist zakt neer.',
  'Restgist/eiwitten gefilterd via\nkiezelgoer of membraanfilter.',
  'Eindproduct in flessen/vaten.\nCO₂: ~2.6 vol. Proost! 🍺',
];
