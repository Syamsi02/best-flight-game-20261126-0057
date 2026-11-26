// Sky Courier — HUD, gauges, compass strip, minimap and menu screens.
// One clear job: everything drawn on top of the world.

import { COLORS, LEVELS, PLANE_SCREEN_X, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { clamp } from './random.js';
import { nextRing } from './rings.js';

export function altitudeFeet(planeY) {
  return Math.max(0, Math.round((610 - planeY) * 8));
}

export function speedKnots(speed) {
  return Math.round(speed * 0.9);
}

export function headingDegrees(distance, wind) {
  const base = 90 + Math.sin(distance * 0.0004) * 6 + (wind || 0) * 0.1;
  return ((Math.round(base) % 360) + 360) % 360;
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.hudPanel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawGauge(ctx, x, y, r, label, valueText, frac, color) {
  ctx.save();
  ctx.translate(x, y);
  panel(ctx, -r - 8, -r - 8, r * 2 + 16, r * 2 + 16);
  ctx.fillStyle = '#0d2036';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dfe9f5';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
    ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.stroke();
  }
  const needle = -Math.PI * 0.75 + clamp(frac, 0, 1) * Math.PI * 1.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(needle) * (r - 10), Math.sin(needle) * (r - 10));
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(valueText, 0, r * 0.52);
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.fillText(label, 0, -r - 14);
  ctx.restore();
}

function drawCompass(ctx, heading) {
  const w = 340;
  const h = 30;
  const x = (VIEW_WIDTH - w) / 2;
  const y = 14;
  panel(ctx, x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.clip();
  const points = [
    [0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'],
    [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW'], [360, 'N'],
  ];
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  for (const [deg, label] of points) {
    let d = deg - heading;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    const px = x + w / 2 + d * 2.1;
    if (px < x - 10 || px > x + w + 10) continue;
    ctx.fillStyle = d === 0 ? COLORS.hudAccent : COLORS.hudText;
    ctx.fillText(label, px, y + 20);
  }
  ctx.restore();
  ctx.fillStyle = COLORS.hudAccent;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 6, y + h - 2);
  ctx.lineTo(x + w / 2 + 6, y + h - 2);
  ctx.lineTo(x + w / 2, y + h + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(heading).padStart(3, '0') + '°', x + w / 2, y + h + 24);
}

function drawMinimap(ctx, level, terrain, course, planeX, runway) {
  const w = 300;
  const h = 54;
  const x = VIEW_WIDTH - w - 16;
  const y = VIEW_HEIGHT - h - 16;
  panel(ctx, x, y, w, h);
  const scale = w / level.length;
  ctx.fillStyle = '#3f7d3a';
  ctx.fillRect(x + 6, y + h - 16, w - 12, 8);
  ctx.fillStyle = '#4aa3d8';
  ctx.beginPath();
  ctx.moveTo(x + 6, y + h - 18);
  for (let i = 0; i <= 24; i++) {
    ctx.lineTo(x + 6 + (i / 24) * (w - 12), y + h - 20 + Math.sin(i * 0.9) * 3);
  }
  ctx.lineTo(x + w - 6, y + h - 16);
  ctx.closePath();
  ctx.fill();
  for (const r of course.rings) {
    ctx.fillStyle = r.passed ? '#7ee081' : '#ffd23e';
    ctx.beginPath();
    ctx.arc(x + 6 + r.x * scale, y + 14, r.passed ? 3 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f4f8ff';
  ctx.fillRect(x + 6 + runway.x * scale, y + h - 18, runway.width * scale, 6);
  const px = x + 6 + clamp(planeX, 0, level.length) * scale;
  ctx.fillStyle = '#ff5a4e';
  ctx.beginPath();
  ctx.moveTo(px, y + 4);
  ctx.lineTo(px - 6, y + 16);
  ctx.lineTo(px + 6, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MAP — ' + level.name.toUpperCase(), x + 8, y + 12);
}

export function drawHud(ctx, state) {
  const { plane, level, course, score, levelIndex, time } = state;
  const heading = headingDegrees(plane.x, level.wind);
  panel(ctx, 16, 14, 250, 64);
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALTITUDE', 30, 32);
  ctx.fillText('SPEED', 30, 58);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.fillText(altitudeFeet(plane.y).toLocaleString() + ' ft', 118, 34);
  ctx.fillText(speedKnots(plane.speed) + ' kt', 118, 60);
  drawCompass(ctx, heading);
  panel(ctx, VIEW_WIDTH - 266, 14, 250, 64);
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.fillText('SCORE', VIEW_WIDTH - 252, 32);
  ctx.fillText('RINGS', VIEW_WIDTH - 252, 58);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(score).padStart(6, '0'), VIEW_WIDTH - 30, 34);
  const done = course.rings.filter((r) => r.passed).length;
  ctx.fillText(done + ' / ' + course.rings.length, VIEW_WIDTH - 30, 60);
  ctx.textAlign = 'left';
  const fuelW = 190;
  const fuelX = 16;
  const fuelY = 92;
  panel(ctx, fuelX, fuelY, fuelW + 20, 30);
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.fillText('FUEL', fuelX + 12, fuelY + 19);
  const frac = plane.fuel / 100;
  ctx.fillStyle = '#12283f';
  ctx.beginPath();
  ctx.roundRect(fuelX + 58, fuelY + 9, fuelW - 58, 12, 6);
  ctx.fill();
  ctx.fillStyle = frac > 0.25 ? COLORS.fuelOk : COLORS.fuelLow;
  ctx.beginPath();
  ctx.roundRect(fuelX + 58, fuelY + 9, Math.max(8, (fuelW - 58) * frac), 12, 6);
  ctx.fill();
  if (plane.damage > 0) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 13px Verdana, sans-serif';
    ctx.fillText('DAMAGE ' + plane.damage + ' / ' + 3, fuelX + 12, fuelY + 46);
  }
  drawGauge(ctx, 78, VIEW_HEIGHT - 92, 46, 'ALT', String(altitudeFeet(plane.y)), clamp((610 - plane.y) / 550, 0, 1), '#7db8e8');
  drawGauge(ctx, 188, VIEW_HEIGHT - 92, 46, 'SPD', String(speedKnots(plane.speed)), clamp(plane.speed / 340, 0, 1), '#7ee081');
  drawMinimap(ctx, level, state.terrain, course, plane.x, state.runway);
  const target = nextRing(course);
  if (target) {
    const dx = target.x - plane.x;
    const arrowY = 178;
    ctx.fillStyle = COLORS.hudAccent;
    ctx.font = 'bold 13px Verdana, sans-serif';
    ctx.textAlign = 'center';
    const label = dx > 0 ? 'NEXT RING → ' + Math.round(dx / 10) * 10 + ' m' : 'RING BEHIND YOU — TURN BACK';
    ctx.fillText(label, PLANE_SCREEN_X + 40, arrowY);
  } else {
    ctx.fillStyle = '#7ee081';
    ctx.font = 'bold 15px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ALL RINGS DONE — LAND ON THE RUNWAY!', VIEW_WIDTH / 2, 150);
  }
  panel(ctx, 12, 126, 420, 24);
  panel(ctx, VIEW_WIDTH - 150, 126, 138, 24);
  ctx.fillStyle = 'rgba(244,248,255,0.9)';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LEVEL ' + (levelIndex + 1) + ' — ' + level.name.toUpperCase(), 16, 140);
  if (level.wind > 0) {
    ctx.fillStyle = '#9fc3e8';
    ctx.fillText('WIND ' + level.wind + ' kt →', 300, 140);
  }
  ctx.fillStyle = 'rgba(244,248,255,0.9)';
  ctx.textAlign = 'right';
  ctx.fillText('TIME ' + formatTime(time), VIEW_WIDTH - 16, 140);
  ctx.textAlign = 'left';
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function screenShade(ctx, alpha) {
  ctx.fillStyle = 'rgba(6, 18, 34, ' + alpha + ')';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function bigTitle(ctx, text, y, size, color) {
  ctx.font = 'bold ' + size + 'px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillText(text, VIEW_WIDTH / 2 + 3, y + 3);
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_WIDTH / 2, y);
}

export function drawTitleScreen(ctx, best) {
  screenShade(ctx, 0.45);
  bigTitle(ctx, 'SKY COURIER', 170, 84, '#ffd23e');
  ctx.font = 'bold 22px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f8ff';
  ctx.fillText('Fly the mail run. Thread the rings. Land it clean.', VIEW_WIDTH / 2, 214);
  panel(ctx, VIEW_WIDTH / 2 - 330, 250, 660, 210);
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 14px Verdana, sans-serif';
  ctx.textAlign = 'left';
  const lines = [
    ['Up / Down  or  W / S', 'climb and descend'],
    ['Left / Right  or  A / D', 'throttle down and up'],
    ['Mouse', 'steer toward the pointer — hold click to boost'],
    ['P', 'pause      R  restart      M  mute'],
    ['Goal', 'fly every ring, grab stars, land on the runway'],
  ];
  lines.forEach(([k, v], i) => {
    ctx.fillStyle = COLORS.hudAccent;
    ctx.fillText(k, VIEW_WIDTH / 2 - 300, 286 + i * 32);
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText(v, VIEW_WIDTH / 2 - 90, 286 + i * 32);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7ee081';
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillText('▶  PRESS ENTER OR CLICK TO FLY', VIEW_WIDTH / 2, 510);
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 15px Verdana, sans-serif';
  LEVELS.forEach((lv, i) => {
    ctx.fillText((i + 1) + '. ' + lv.name + ' — ' + lv.rings + ' rings', VIEW_WIDTH / 2, 548 + i * 24);
  });
  if (best > 0) {
    ctx.fillStyle = COLORS.hudAccent;
    ctx.fillText('BEST SCORE: ' + best.toLocaleString(), VIEW_WIDTH / 2, 640);
  }
}

export function drawPauseScreen(ctx) {
  screenShade(ctx, 0.55);
  bigTitle(ctx, 'PAUSED', 300, 64, '#f4f8ff');
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9fc3e8';
  ctx.fillText('Press P to keep flying — R to restart the level', VIEW_WIDTH / 2, 360);
}

export function drawLevelComplete(ctx, state) {
  screenShade(ctx, 0.5);
  bigTitle(ctx, 'DELIVERY COMPLETE!', 220, 56, '#7ee081');
  ctx.font = 'bold 22px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.hudText;
  const rows = [
    'Level: ' + state.level.name,
    'Rings: ' + state.course.rings.filter((r) => r.passed).length + ' / ' + state.course.rings.length,
    'Stars: ' + state.starsCollected + '   Fuel left: ' + Math.round(state.plane.fuel) + '%',
    'Time: ' + formatTime(state.time) + '  (par ' + formatTime(state.level.parSeconds) + ')',
    'Level score: ' + state.levelScore.toLocaleString(),
    'Total score: ' + state.score.toLocaleString(),
  ];
  rows.forEach((row, i) => ctx.fillText(row, VIEW_WIDTH / 2, 290 + i * 38));
  ctx.fillStyle = '#7ee081';
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillText('PRESS ENTER FOR THE NEXT LEVEL', VIEW_WIDTH / 2, 560);
}

export function drawGameOver(ctx, state) {
  screenShade(ctx, 0.6);
  bigTitle(ctx, 'CRASHED!', 220, 72, '#ff5a4e');
  ctx.font = 'bold 22px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(state.crashReason, VIEW_WIDTH / 2, 290);
  ctx.fillText('Rings flown: ' + state.course.rings.filter((r) => r.passed).length + ' / ' + state.course.rings.length, VIEW_WIDTH / 2, 340);
  ctx.fillText('Score: ' + state.score.toLocaleString(), VIEW_WIDTH / 2, 388);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillText('PRESS R TO FLY AGAIN', VIEW_WIDTH / 2, 480);
}

export function drawFinalScore(ctx, state) {
  screenShade(ctx, 0.55);
  bigTitle(ctx, 'ALL DELIVERIES DONE!', 180, 60, '#ffd23e');
  ctx.font = 'bold 22px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.hudText;
  const rows = [
    'Three valleys flown, every parcel delivered.',
    'Final score: ' + state.score.toLocaleString(),
    'Stars collected: ' + state.totalStars,
    'Best score: ' + Math.max(state.best, state.score).toLocaleString(),
  ];
  rows.forEach((row, i) => ctx.fillText(row, VIEW_WIDTH / 2, 260 + i * 40));
  ctx.fillStyle = '#7ee081';
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillText('PRESS ENTER TO FLY THE ROUTE AGAIN', VIEW_WIDTH / 2, 480);
  ctx.fillStyle = '#9fc3e8';
  ctx.font = 'bold 14px Verdana, sans-serif';
  ctx.fillText('Thanks for flying Sky Courier.', VIEW_WIDTH / 2, 530);
}

export function drawToast(ctx, toast, time) {
  if (!toast || time - toast.at > 2.2) return;
  const alpha = clamp(1 - (time - toast.at - 1.6) / 0.6, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 26px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(toast.text, VIEW_WIDTH / 2 + 2, 202);
  ctx.fillStyle = toast.color || '#ffd23e';
  ctx.fillText(toast.text, VIEW_WIDTH / 2, 200);
  ctx.restore();
}
