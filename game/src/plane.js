// Sky Courier — the cargo plane: physics, banking, propeller, trail.
// One clear job: how the plane flies and how it looks.

import { PLANE, PLANE_SCREEN_X } from './config.js';
import { clamp, lerp } from './random.js';

export function createPlane(level) {
  return {
    x: 0,
    y: 300,
    speed: PLANE.cruiseSpeed,
    throttle: 0.6,
    pitch: 0,
    fuel: level.fuelStart,
    damage: 0,
    propAngle: 0,
    trail: [],
    boost: false,
    bank: 0,
  };
}

export function updatePlane(plane, input, dt, level, time) {
  const targetThrottle = input.right ? 1 : input.left ? 0.15 : plane.throttle;
  plane.throttle = lerp(plane.throttle, targetThrottle, clamp(dt * 3, 0, 1));
  plane.boost = input.mouseBoost;
  const targetSpeed = PLANE.minSpeed + plane.throttle * (PLANE.maxSpeed - PLANE.minSpeed)
    + (plane.boost && plane.fuel > 0 ? 60 : 0);
  plane.speed = lerp(plane.speed, targetSpeed, clamp(dt * 0.9, 0, 1));
  plane.speed = clamp(plane.speed, PLANE.minSpeed * 0.6, PLANE.maxSpeed + 60);
  let climb = 0;
  if (input.up) climb -= 1;
  if (input.down) climb += 1;
  if (climb === 0 && input.mouseSteer) climb = clamp((input.mouseY - plane.y) / 140, -1, 1);
  const windPush = (level.wind || 0) * 0.35 * Math.sin(time * 0.7) * dt;
  plane.pitch = lerp(plane.pitch, climb, clamp(dt * 5, 0, 1));
  const lift = (plane.speed - PLANE.stallSpeed) / PLANE.cruiseSpeed;
  let vy = plane.pitch * PLANE.climbRate * clamp(lift, 0.25, 1.4);
  if (plane.speed < PLANE.stallSpeed) vy += PLANE.sinkRate * (1 - plane.speed / PLANE.stallSpeed);
  vy += windPush * 60;
  plane.y = clamp(plane.y + vy * dt, 60, 640);
  plane.x += plane.speed * dt;
  plane.bank = lerp(plane.bank, clamp(plane.pitch * 0.5, -0.5, 0.5), clamp(dt * 6, 0, 1));
  plane.propAngle += dt * (18 + plane.throttle * 30);
  const burn = PLANE.fuelBurn * (0.4 + plane.throttle) * dt + (plane.boost ? PLANE.boostBurn * dt : 0);
  plane.fuel = Math.max(0, plane.fuel - burn);
  if (plane.fuel <= 0) plane.speed = Math.max(PLANE.minSpeed * 0.6, plane.speed - 60 * dt);
  plane.trail.push({ x: PLANE_SCREEN_X - 52, y: plane.y + 4, life: 1 });
  if (plane.trail.length > 26) plane.trail.shift();
  for (const p of plane.trail) p.life -= dt * 1.6;
  plane.trail = plane.trail.filter((p) => p.life > 0);
}

export function drawPlaneTrail(ctx, plane) {
  for (const p of plane.trail) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life) * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 + (1 - p.life) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawPlane(ctx, plane, time) {
  const x = PLANE_SCREEN_X;
  const y = plane.y;
  drawPlaneTrail(ctx, plane);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(plane.bank * 0.55 + plane.pitch * 0.12);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#f4ead2';
  ctx.beginPath();
  ctx.ellipse(0, 0, 52, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c94f43';
  ctx.beginPath();
  ctx.moveTo(38, -6);
  ctx.quadraticCurveTo(56, 0, 38, 8);
  ctx.lineTo(30, 8);
  ctx.lineTo(30, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b6cb0';
  ctx.beginPath();
  ctx.ellipse(12, -9, 20, 9, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 230, 255, 0.9)';
  ctx.beginPath();
  ctx.ellipse(14, -10, 13, 6, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c94f43';
  ctx.fillRect(-14, 10, 34, 5);
  ctx.fillStyle = '#8a2f26';
  ctx.fillRect(-14, 15, 34, 3);
  ctx.fillStyle = '#e8b23a';
  ctx.beginPath();
  ctx.moveTo(-34, -4);
  ctx.lineTo(-52, -22);
  ctx.lineTo(-46, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4ead2';
  ctx.fillRect(-48, -2, 10, 16);
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(-52, 12, 6, 12);
  ctx.fillRect(-44, 12, 6, 12);
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(-8, -2, 18, 5);
  ctx.fillStyle = '#2b2b2b';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SKY', 2, 12);
  const px = 54;
  ctx.save();
  ctx.translate(px, 0);
  ctx.rotate(plane.propAngle);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(-3, -26, 6, 52);
  ctx.fillRect(-26, -3, 52, 6);
  ctx.restore();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, 0, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.arc(px, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (plane.damage > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 14);
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.arc(x - 30, y + 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
