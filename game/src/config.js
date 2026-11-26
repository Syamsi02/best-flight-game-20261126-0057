// Sky Courier — tuning constants and level definitions.
// One clear job: every number the game balances on lives here.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const GROUND_LINE = 640;

// The plane sits at this screen x while the world scrolls past it.
export const PLANE_SCREEN_X = 380;

// Shot poses use this seed unless ?seed= says otherwise.
export const DEFAULT_SEED = 20261126;

export const PLANE = {
  maxSpeed: 340,
  minSpeed: 90,
  cruiseSpeed: 210,
  accel: 150,
  climbRate: 260,
  sinkRate: 150,
  stallSpeed: 120,
  maxFuel: 100,
  fuelBurn: 2.4,
  boostBurn: 5.0,
  maxDamage: 3,
};

export const RING = {
  radius: 58,
  score: 250,
  starScore: 100,
  fuelScore: 40,
  landingBonus: 500,
};

export const LEVELS = [
  {
    name: 'Green Valley',
    subtitle: 'Gentle hills, calm skies — learn the ropes.',
    length: 6200,
    rings: 5,
    stars: 8,
    storms: 2,
    mountains: 3,
    wind: 0,
    ringRadius: 62,
    fuelStart: 100,
    parSeconds: 75,
  },
  {
    name: 'River Rapids',
    subtitle: 'A winding river, tighter rings, gusty wind.',
    length: 7800,
    rings: 7,
    stars: 10,
    storms: 5,
    mountains: 5,
    wind: 26,
    ringRadius: 56,
    fuelStart: 95,
    parSeconds: 90,
  },
  {
    name: 'Storm Peaks',
    subtitle: 'High peaks and storm cells — fly it clean.',
    length: 9400,
    rings: 9,
    stars: 12,
    storms: 9,
    mountains: 8,
    wind: 44,
    ringRadius: 50,
    fuelStart: 90,
    parSeconds: 105,
  },
];

export const COLORS = {
  skyTop: '#2f6fb4',
  skyMid: '#7db8e8',
  skyLow: '#ffd9a0',
  sun: '#fff3b0',
  mountainFar: '#7d8fc4',
  mountainNear: '#5a6b9e',
  hill: '#6fae5e',
  fieldA: '#8fc25a',
  fieldB: '#e0c35c',
  fieldC: '#5da24e',
  river: '#4aa3d8',
  road: '#6b5a44',
  runway: '#3c3f4a',
  ringGold: '#ffd23e',
  ringNext: '#ffe98a',
  hudPanel: 'rgba(8, 24, 44, 0.72)',
  hudText: '#f4f8ff',
  hudAccent: '#ffd23e',
  danger: '#ff5a4e',
  fuelOk: '#7ee081',
  fuelLow: '#ff9d3c',
};

export const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  pause: ['KeyP', 'Escape'],
  restart: ['KeyR'],
  confirm: ['Enter', 'Space'],
  mute: ['KeyM'],
};
