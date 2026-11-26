// Sky Courier — rings, stars, storm clouds and fuel cans.
// One clear job: everything the pilot flies through or dodges.

import { PLANE_SCREEN_X, RING } from './config.js';
import { groundHeightAt } from './terrain.js';
import { clamp, makeRng } from './random.js';

export function buildCourse(level, terrain, seed) {
  const rng = makeRng(seed + 77);
  const rings = [];
  const spacing = (level.length - 1600) / level.rings;
  for (let i = 0; i < level.rings; i++) {
    const x = 1100 + i * spacing + rng.range(-90, 90);
    const y = clamp(150 + rng.range(0, 1) * 320 + 90 * Math.sin(i * 1.3), 110, 520);
    rings.push({ x, y, radius: level.ringRadius, passed: false, index: i });
  }
  const stars = [];
  for (let i = 0; i < level.stars; i++) {
    stars.push({
      x: rng.range(900, level.length - 700),
      y: rng.range(110, 520),
      taken: false,
      spin: rng.range(0, Math.PI * 2),
    });
  }
  const storms = [];
  for (let i = 0; i < level.storms; i++) {
    storms.push({
      x: rng.range(1200, level.length - 800),
      y: rng.range(120, 380),
      radius: rng.range(52, 84),
      drift: rng.range(-12, 12),
    });
  }
  const fuels = [];
  const fuelCount = Math.max(2, Math.floor(level.rings / 2));
  for (let i = 0; i < fuelCount; i++) {
    fuels.push({
      x: 1500 + i * ((level.length - 2600) / fuelCount) + rng.range(-60, 60),
      y: rng.range(140, 480),
      taken: false,
    });
  }
  return { rings, stars, storms, fuels };
}

export function nextRing(course) {
  return course.rings.find((r) => !r.passed) || null;
}

export function checkRingPass(course, planeX, planeY) {
  const ring = nextRing(course);
  if (!ring) return null;
  const dx = planeX - ring.x;
  const dy = planeY - ring.y;
  if (Math.hypot(dx, dy) < ring.radius) {
    ring.passed = true;
    return ring;
  }
  return null;
}

export function checkPickups(course, planeX, planeY) {
  const got = { stars: 0, fuel: 0 };
  for (const s of course.stars) {
    if (!s.taken && Math.hypot(planeX - s.x, planeY - s.y) < 46) {
      s.taken = true;
      got.stars++;
    }
  }
  for (const f of course.fuels) {
    if (!f.taken && Math.hypot(planeX - f.x, planeY - f.y) < 52) {
      f.taken = true;
      got.fuel++;
    }
  }
  return got;
}

export function checkStormHit(course, planeX, planeY) {
  for (const s of course.storms) {
    if (Math.hypot(planeX - s.x, planeY - s.y) < s.radius * 0.8) return s;
  }
  return null;
}

export function checkMountainHit(terrain, planeX, planeY) {
  const groundY = groundHeightAt(terrain, planeX);
  if (planeY + 14 >= groundY) return { groundY };
  return null;
}

export function updateStorms(course, dt) {
  for (const s of course.storms) {
    s.x += s.drift * dt;
    s.y += Math.sin(s.x * 0.01) * 6 * dt;
  }
}

function drawStarShape(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawCourse(ctx, cameraX, course, time, planeY) {
  const target = nextRing(course);
  if (target) {
    const tx = target.x - cameraX;
    if (tx > 420 && tx < 1400) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 210, 62, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.moveTo(PLANE_SCREEN_X + 60, planeY || 300);
      ctx.lineTo(tx, target.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  for (const ring of course.rings) {
    const sx = ring.x - cameraX;
    if (sx < -120 || sx > 1400) continue;
    const isNext = ring === target;
    const pulse = isNext ? 1 + 0.08 * Math.sin(time * 5) : 1;
    const r = ring.radius * pulse;
    ctx.save();
    if (ring.passed) ctx.globalAlpha = 0.25;
    const glow = ctx.createRadialGradient(sx, ring.y, r * 0.4, sx, ring.y, r * 1.5);
    glow.addColorStop(0, isNext ? 'rgba(255, 210, 62, 0.35)' : 'rgba(140, 200, 255, 0.18)');
    glow.addColorStop(1, 'rgba(255, 210, 62, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - r * 1.6, ring.y - r * 1.6, r * 3.2, r * 3.2);
    ctx.strokeStyle = isNext ? '#ffd23e' : '#9fc6ee';
    ctx.lineWidth = isNext ? 7 : 4;
    ctx.beginPath();
    ctx.arc(sx, ring.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = isNext ? '#fff3b0' : '#d6e9ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, ring.y, r - 9, 0, Math.PI * 2);
    ctx.stroke();
    if (isNext) {
      ctx.fillStyle = '#ffd23e';
      ctx.font = 'bold 15px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RING ' + (ring.index + 1), sx, ring.y - r - 12);
      ctx.beginPath();
      ctx.moveTo(sx - 8, ring.y - r - 34 + Math.sin(time * 6) * 4);
      ctx.lineTo(sx + 8, ring.y - r - 34 + Math.sin(time * 6) * 4);
      ctx.lineTo(sx, ring.y - r - 22 + Math.sin(time * 6) * 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  for (const s of course.stars) {
    if (s.taken) continue;
    const sx = s.x - cameraX;
    if (sx < -40 || sx > 1320) continue;
    const spin = time * 2 + s.spin;
    ctx.save();
    ctx.translate(sx, s.y + Math.sin(time * 3 + s.spin) * 4);
    ctx.rotate(Math.sin(spin) * 0.3);
    ctx.fillStyle = '#ffe14d';
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = 14;
    drawStarShape(ctx, 0, 0, 17, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff8c8';
    drawStarShape(ctx, 0, 0, 9, 0);
    ctx.fill();
    ctx.restore();
  }
  for (const f of course.fuels) {
    if (f.taken) continue;
    const sx = f.x - cameraX;
    if (sx < -40 || sx > 1320) continue;
    const bob = Math.sin(time * 3 + f.x) * 5;
    ctx.save();
    ctx.translate(sx, f.y + bob);
    ctx.fillStyle = '#ff8c42';
    ctx.strokeStyle = '#7a2d12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-13, -16, 26, 32, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('F', 0, 5);
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(-13, -20, 26, 4);
    ctx.restore();
  }
  for (const s of course.storms) {
    const sx = s.x - cameraX;
    if (sx < -160 || sx > 1440) continue;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#4a4a5e';
    ctx.beginPath();
    ctx.arc(sx, s.y, s.radius * 0.62, 0, Math.PI * 2);
    ctx.arc(sx - s.radius * 0.5, s.y + 10, s.radius * 0.45, 0, Math.PI * 2);
    ctx.arc(sx + s.radius * 0.5, s.y + 8, s.radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a6a82';
    ctx.beginPath();
    ctx.arc(sx, s.y - s.radius * 0.25, s.radius * 0.45, 0, Math.PI * 2);
    ctx.arc(sx + s.radius * 0.3, s.y - s.radius * 0.15, s.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    if (Math.sin(time * 9 + s.x) > 0.86) {
      ctx.strokeStyle = '#ffe14d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - 6, s.y + s.radius * 0.4);
      ctx.lineTo(sx + 4, s.y + s.radius * 0.8);
      ctx.lineTo(sx - 2, s.y + s.radius * 1.05);
      ctx.stroke();
    }
    ctx.restore();
  }
}
