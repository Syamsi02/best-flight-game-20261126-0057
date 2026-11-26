// Sky Courier — deterministic posed screenshots.
// One clear job: turn ?shot=start|play|end&seed=N into one fixed frame
// the screenshot tool can capture, with no timing or mouse dependence.

import { LEVELS, PLANE_SCREEN_X } from './config.js';

export function readShotParams() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seedRaw = params.get('seed');
  const seed = seedRaw ? Number(seedRaw) || 1 : 1;
  return { shot: shot === 'start' || shot === 'play' || shot === 'end' ? shot : null, seed };
}

function posePlaneForShot(game, worldX, y, speed, throttle) {
  game.plane.x = worldX;
  game.plane.y = y;
  game.plane.speed = speed;
  game.plane.throttle = throttle;
  game.plane.propAngle = 1.2;
  game.plane.fuel = 68;
  game.plane.trail = [];
  for (let i = 0; i < 18; i++) {
    game.plane.trail.push({ x: PLANE_SCREEN_X - 52 - i * 7, y: y + 4 + i * 0.4, life: 1 - i / 22 });
  }
  game.cameraX = Math.max(0, worldX - PLANE_SCREEN_X);
}

function poseToast(game, text, color) {
  game.toast = { text, color: color || '#ffd23e', at: game.time };
}

export function applyShotPose(game) {
  const shot = game.shot;
  game.time = 12.4;
  if (shot === 'start') {
    game.startLevel(0);
    game.mode = 'title';
    posePlaneForShot(game, 5200, 92, 210, 0.6);
    game.plane.fuel = 100;
    game.cameraX = Math.max(0, 5200 - PLANE_SCREEN_X);
    return;
  }
  if (shot === 'play') {
    game.startLevel(1);
    game.mode = 'playing';
    const target = game.course.rings[1];
    target.passed = false;
    game.course.rings[0].passed = true;
    posePlaneForShot(game, target.x - 130, target.y + 6, 265, 0.8);
    game.plane.fuel = 68;
    game.score = 1250;
    game.levelScore = 1250;
    game.starsCollected = 3;
    game.totalStars = 3;
    game.time = 34.2;
    poseToast(game, 'RING 1 — CARGO DROPPED!  +250', '#ffd23e');
    return;
  }
  game.startLevel(0);
  game.mode = 'final';
  game.course.rings.forEach((r) => { r.passed = true; });
  posePlaneForShot(game, game.runway.x + 180, 622, 120, 0.2);
  game.plane.fuel = 41;
  game.score = 4850;
  game.levelScore = 2100;
  game.starsCollected = 6;
  game.totalStars = 14;
  game.time = 68.5;
  game.best = 4850;
}
