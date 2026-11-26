// Sky Courier — terrain: sky, mountains, hills, fields, river, road, runway.
// One clear job: build a seeded valley and draw it in parallax layers.

import { COLORS, GROUND_LINE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { clamp, lerp, makeRng, smoothstep } from './random.js';

export function buildTerrain(seed, length, mountainCount) {
  const rng = makeRng(seed);
  const peaks = [];
  for (let i = 0; i < mountainCount; i++) {
    peaks.push({
      x: rng.range(900, length - 900),
      width: rng.range(420, 780),
      height: rng.range(150, 300),
    });
  }
  peaks.sort((a, b) => a.x - b.x);
  const fields = [];
  let fx = 0;
  const palette = [COLORS.fieldA, COLORS.fieldB, COLORS.fieldC, '#a8c95e', '#d8b64e'];
  while (fx < length + 400) {
    const w = rng.range(220, 460);
    fields.push({ x: fx, width: w, color: rng.pick(palette) });
    fx += w;
  }
  const riverBends = [];
  for (let x = 0; x < length + 400; x += 260) {
    riverBends.push({ x, offset: rng.range(-70, 70) });
  }
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    clouds.push({
      x: rng.range(0, length),
      y: rng.range(40, 260),
      scale: rng.range(0.6, 1.7),
      speed: rng.range(4, 14),
      layer: rng.int(0, 2),
    });
  }
  const trees = [];
  for (let i = 0; i < 90; i++) {
    trees.push({ x: rng.range(0, length), y: rng.range(0, 46), s: rng.range(0.7, 1.4) });
  }
  return { length, peaks, fields, riverBends, clouds, trees, seed };
}

export function groundHeightAt(terrain, worldX) {
  let h = 0;
  for (const p of terrain.peaks) {
    const d = Math.abs(worldX - p.x) / (p.width / 2);
    if (d < 1) h += p.height * (1 - d * d);
  }
  const wave = 26 * Math.sin(worldX * 0.0016 + terrain.seed % 7)
    + 14 * Math.sin(worldX * 0.004 + 1.7);
  return GROUND_LINE - Math.max(0, h) - wave * 0.4;
}

export function riverOffsetAt(terrain, worldX) {
  const bends = terrain.riverBends;
  if (worldX <= bends[0].x) return bends[0].offset;
  for (let i = 1; i < bends.length; i++) {
    if (worldX <= bends[i].x) {
      const t = (worldX - bends[i - 1].x) / (bends[i].x - bends[i - 1].x);
      return lerp(bends[i - 1].offset, bends[i].offset, smoothstep(t));
    }
  }
  return bends[bends.length - 1].offset;
}

function drawSky(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(0.55, COLORS.skyMid);
  sky.addColorStop(0.85, COLORS.skyLow);
  sky.addColorStop(1, '#ffe9bd');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  const sunX = 1060;
  const sunY = 108 + Math.sin(time * 0.05) * 4;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 150);
  glow.addColorStop(0, 'rgba(255, 243, 176, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 214, 120, 0.45)');
  glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 160, sunY - 160, 320, 320);
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(ctx, x, y, s, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y + 6 * s, 20 * s, 0, Math.PI * 2);
  ctx.arc(x - 28 * s, y + 8 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 4 * s, y - 14 * s, 20 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBirds(ctx, cameraX, time) {
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 50, 80, 0.75)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const bx = ((i * 317 + 200 - cameraX * 0.2 - time * 12) % 1400 + 1400) % 1400 - 60;
    const by = 120 + i * 26 + Math.sin(time * 1.4 + i * 2) * 8;
    const flap = Math.sin(time * 9 + i * 3) * 4;
    ctx.beginPath();
    ctx.moveTo(bx - 9, by - flap);
    ctx.quadraticCurveTo(bx, by + 3, bx, by);
    ctx.quadraticCurveTo(bx, by + 3, bx + 9, by - flap);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMountains(ctx, cameraX, terrain, parallax, baseY, color, scale) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_HEIGHT);
  const step = 60;
  for (let sx = -step; sx <= VIEW_WIDTH + step; sx += step) {
    const wx = sx + cameraX * parallax;
    const ridge = 120 * scale * (0.5 + 0.5 * Math.sin(wx * 0.004 + 2.1))
      + 70 * scale * Math.sin(wx * 0.011 + 0.6)
      + 40 * scale * Math.sin(wx * 0.023 + 4.0);
    ctx.lineTo(sx, baseY - ridge);
  }
  ctx.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let sx = -step; sx <= VIEW_WIDTH + step; sx += step * 3) {
    const wx = sx + cameraX * parallax;
    const ridge = 120 * scale * (0.5 + 0.5 * Math.sin(wx * 0.004 + 2.1))
      + 70 * scale * Math.sin(wx * 0.011 + 0.6);
    if (ridge > 150 * scale) {
      ctx.beginPath();
      ctx.moveTo(sx - 26, baseY - ridge + 34 * scale);
      ctx.lineTo(sx, baseY - ridge);
      ctx.lineTo(sx + 26, baseY - ridge + 34 * scale);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawFields(ctx, cameraX, terrain) {
  const groundTop = GROUND_LINE;
  ctx.fillStyle = '#7a5c38';
  ctx.fillRect(0, groundTop, VIEW_WIDTH, VIEW_HEIGHT - groundTop);
  for (const f of terrain.fields) {
    const sx = f.x - cameraX;
    if (sx + f.width < -50 || sx > VIEW_WIDTH + 50) continue;
    ctx.fillStyle = f.color;
    ctx.fillRect(sx, groundTop + 6, f.width, VIEW_HEIGHT - groundTop - 6);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(sx, groundTop + 6, f.width, 3);
  }
  const riverY = groundTop + 34;
  ctx.strokeStyle = COLORS.river;
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let sx = -20; sx <= VIEW_WIDTH + 20; sx += 20) {
    const wx = sx + cameraX;
    const y = riverY + riverOffsetAt(terrain, wx) * 0.35;
    if (sx === -20) ctx.moveTo(sx, y);
    else ctx.lineTo(sx, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let sx = -20; sx <= VIEW_WIDTH + 20; sx += 40) {
    const wx = sx + cameraX;
    const y = riverY + riverOffsetAt(terrain, wx) * 0.35 - 4;
    if (sx === -20) ctx.moveTo(sx, y);
    else ctx.lineTo(sx, y);
  }
  ctx.stroke();
  const roadY = groundTop + 62;
  ctx.strokeStyle = COLORS.road;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(0, roadY);
  ctx.lineTo(VIEW_WIDTH, roadY);
  ctx.stroke();
  ctx.strokeStyle = '#f5e9c8';
  ctx.lineWidth = 2;
  ctx.setLineDash([16, 14]);
  ctx.beginPath();
  ctx.moveTo(0, roadY);
  ctx.lineTo(VIEW_WIDTH, roadY);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const t of terrain.trees) {
    const sx = t.x - cameraX;
    if (sx < -10 || sx > VIEW_WIDTH + 10) continue;
    const ty = groundTop + 10 + t.y * 0.45;
    ctx.fillStyle = '#2f7a33';
    ctx.beginPath();
    ctx.arc(sx, ty, 7 * t.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a4630';
    ctx.fillRect(sx - 1.5, ty + 4, 3, 7);
  }
}

function drawRunway(ctx, cameraX, terrain, runway) {
  const sx = runway.x - cameraX;
  if (sx + runway.width < -40 || sx > VIEW_WIDTH + 40) return;
  const y = groundHeightAt(terrain, runway.x + runway.width / 2);
  ctx.fillStyle = COLORS.runway;
  ctx.fillRect(sx, y - 4, runway.width, 10);
  ctx.fillStyle = '#f8f8f8';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(sx + 24 + i * ((runway.width - 48) / 6), y - 1, (runway.width - 48) / 12, 4);
  }
  ctx.fillStyle = '#ffcf3d';
  ctx.fillRect(sx - 4, y - 4, 6, 10);
  ctx.fillRect(sx + runway.width - 2, y - 4, 6, 10);
  const wx = sx + runway.width + 26;
  const wy = y - 58;
  ctx.strokeStyle = '#8a8f98';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(wx, y - 4);
  ctx.lineTo(wx, wy);
  ctx.stroke();
  ctx.fillStyle = '#ff7a3c';
  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.lineTo(wx + 34, wy + 8);
  ctx.lineTo(wx, wy + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c94f43';
  ctx.fillRect(sx - 90, y - 46, 78, 42);
  ctx.fillStyle = '#7a2d24';
  ctx.beginPath();
  ctx.moveTo(sx - 90, y - 46);
  ctx.lineTo(sx - 51, y - 66);
  ctx.lineTo(sx - 12, y - 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(sx - 78, y - 34, 16, 14);
  ctx.fillRect(sx - 52, y - 34, 16, 14);
}

export function drawTerrain(ctx, cameraX, terrain, runway, time) {
  drawSky(ctx, time);
  drawBirds(ctx, cameraX, time);
  for (const c of terrain.clouds) {
    if (c.layer !== 0) continue;
    const sx = ((c.x - cameraX * 0.15 + time * c.speed) % (VIEW_WIDTH + 320) + VIEW_WIDTH + 320) % (VIEW_WIDTH + 320) - 160;
    drawCloud(ctx, sx, c.y, c.scale, 0.55);
  }
  drawMountains(ctx, cameraX, terrain, 0.25, 560, COLORS.mountainFar, 1.15);
  drawMountains(ctx, cameraX, terrain, 0.45, 600, COLORS.mountainNear, 0.8);
  ctx.fillStyle = COLORS.hill;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_LINE);
  for (let sx = 0; sx <= VIEW_WIDTH; sx += 40) {
    const wx = sx + cameraX * 0.7;
    ctx.lineTo(sx, GROUND_LINE - 34 - 22 * Math.sin(wx * 0.003 + 1.2));
  }
  ctx.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
  ctx.lineTo(0, VIEW_HEIGHT);
  ctx.closePath();
  ctx.fill();
  drawFields(ctx, cameraX, terrain);
  for (const c of terrain.clouds) {
    if (c.layer === 0) continue;
    const sx = ((c.x - cameraX * 0.35 + time * c.speed) % (VIEW_WIDTH + 320) + VIEW_WIDTH + 320) % (VIEW_WIDTH + 320) - 160;
    drawCloud(ctx, sx, c.y + 60, c.scale, 0.9);
  }
  drawRunway(ctx, cameraX, terrain, runway);
}

export function drawMountainObstacles(ctx, cameraX, terrain) {
  for (const p of terrain.peaks) {
    const sx = p.x - cameraX;
    if (sx < -p.width || sx > VIEW_WIDTH + p.width) continue;
    const baseY = groundHeightAt(terrain, p.x);
    ctx.fillStyle = '#4d5c85';
    ctx.beginPath();
    ctx.moveTo(sx - p.width / 2, baseY + 8);
    ctx.lineTo(sx, baseY - p.height);
    ctx.lineTo(sx + p.width / 2, baseY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sx - p.width * 0.16, baseY - p.height * 0.68);
    ctx.lineTo(sx, baseY - p.height);
    ctx.lineTo(sx + p.width * 0.16, baseY - p.height * 0.68);
    ctx.lineTo(sx + p.width * 0.07, baseY - p.height * 0.6);
    ctx.lineTo(sx, baseY - p.height * 0.66);
    ctx.lineTo(sx - p.width * 0.07, baseY - p.height * 0.6);
    ctx.closePath();
    ctx.fill();
  }
}
