// Sky Courier — game loop, state machine, scoring, landings and crashes.
// One clear job: run the game from title screen to final score.

import { LEVELS, PLANE, PLANE_SCREEN_X, RING, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { hashSeed } from './random.js';
import { buildTerrain, drawMountainObstacles, drawTerrain, groundHeightAt } from './terrain.js';
import { createPlane, drawPlane, updatePlane } from './plane.js';
import {
  buildCourse, checkMountainHit, checkPickups, checkRingPass, checkStormHit,
  drawCourse, nextRing, updateStorms,
} from './rings.js';
import {
  drawFinalScore, drawGameOver, drawHud, drawLevelComplete, drawPauseScreen,
  drawTitleScreen, drawToast,
} from './hud.js';
import {
  createAudio, playCrashThud, playFuelGulp, playLandFanfare, playRingChime,
  playStarPing, setEngine, startEngine, toggleMute, unlockAudio,
} from './audio.js';
import { attachInput, consumePress, createInput } from './input.js';
import { applyShotPose, readShotParams } from './shots.js';

const STORAGE_KEY = 'sky-courier-best';

export function loadBest() {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (err) {
    return 0;
  }
}

export function saveBest(score) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(score));
  } catch (err) {
    /* storage unavailable — best score just lives for this session */
  }
}

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const audio = createAudio();
  const input = createInput();
  const seed = readShotParams().seed || 20261126;
  const game = {
    canvas,
    ctx,
    audio,
    input,
    seed,
    mode: 'title',
    levelIndex: 0,
    level: LEVELS[0],
    terrain: null,
    course: null,
    plane: null,
    runway: null,
    cameraX: 0,
    score: 0,
    levelScore: 0,
    starsCollected: 0,
    totalStars: 0,
    time: 0,
    best: loadBest(),
    toast: null,
    crashReason: '',
    shake: 0,
    lastHitAt: -10,
    flash: 0,
    shot: readShotParams().shot,
  };
  game.startLevel = startLevel.bind(null, game);
  return game;
}

function startLevel(game, index) {
  const level = LEVELS[index];
  const levelSeed = hashSeed('sky-courier-' + game.seed + '-' + index);
  game.levelIndex = index;
  game.level = level;
  game.terrain = buildTerrain(levelSeed, level.length, level.mountains);
  game.course = buildCourse(level, game.terrain, levelSeed);
  game.plane = createPlane(level);
  game.plane.y = 280;
  game.runway = { x: level.length - 620, width: 520 };
  game.cameraX = 0;
  game.time = 0;
  game.levelScore = 0;
  game.starsCollected = 0;
  game.toast = null;
  game.shake = 0;
  game.flash = 0;
  game.mode = 'playing';
}

export function showToast(game, text, color) {
  game.toast = { text, color: color || '#ffd23e', at: game.time };
}

function awardRing(game, ring) {
  game.score += RING.score;
  game.levelScore += RING.score;
  showToast(game, 'RING ' + (ring.index + 1) + ' — CARGO DROPPED!  +' + RING.score, '#ffd23e');
  playRingChime(game.audio);
}

function awardPickups(game, got) {
  if (got.stars > 0) {
    game.score += RING.starScore * got.stars;
    game.levelScore += RING.starScore * got.stars;
    game.starsCollected += got.stars;
    game.totalStars += got.stars;
    showToast(game, 'STAR COLLECTED!  +' + RING.starScore * got.stars, '#ffe14d');
    playStarPing(game.audio);
  }
  if (got.fuel > 0) {
    game.plane.fuel = Math.min(100, game.plane.fuel + 35);
    game.score += RING.fuelScore;
    game.levelScore += RING.fuelScore;
    showToast(game, 'FUEL CAN — TANK TOPPED UP!  +' + RING.fuelScore, '#7ee081');
    playFuelGulp(game.audio);
  }
}

function takeHit(game, reason) {
  if (game.time - game.lastHitAt < 1.2) return;
  game.lastHitAt = game.time;
  game.plane.damage += 1;
  game.shake = 14;
  game.flash = 0.35;
  playCrashThud(game.audio);
  if (game.plane.damage >= PLANE.maxDamage) {
    endCrash(game, reason);
  } else {
    showToast(game, reason + ' — HULL ' + game.plane.damage + '/' + PLANE.maxDamage, '#ff5a4e');
    game.plane.speed = Math.max(140, game.plane.speed - 70);
  }
}

function endCrash(game, reason) {
  game.mode = 'gameover';
  game.crashReason = reason;
  if (game.score > game.best) {
    game.best = game.score;
    saveBest(game.score);
  }
  setEngine(game.audio, 0, 0, false);
}

function tryLand(game) {
  const plane = game.plane;
  const runway = game.runway;
  const overRunway = plane.x > runway.x && plane.x < runway.x + runway.width;
  const groundY = groundHeightAt(game.terrain, plane.x);
  const onGround = plane.y + 14 >= groundY - 6;
  if (!overRunway || !onGround) return false;
  const gentle = plane.speed < 250 && Math.abs(plane.pitch) < 0.45;
  if (!gentle) {
    endCrash(game, 'Too fast for the runway — the landing gear gave way.');
    return true;
  }
  const fuelBonus = Math.round(plane.fuel * 3);
  const timeBonus = Math.max(0, Math.round((game.level.parSeconds - game.time) * 5));
  const bonus = RING.landingBonus + fuelBonus + timeBonus;
  game.score += bonus;
  game.levelScore += bonus;
  playLandFanfare(game.audio);
  if (game.score > game.best) {
    game.best = game.score;
    saveBest(game.score);
  }
  if (game.levelIndex + 1 < LEVELS.length) {
    game.mode = 'leveldone';
  } else {
    game.mode = 'final';
  }
  setEngine(game.audio, 0, 0, false);
  return true;
}

function updatePlaying(game, dt) {
  const plane = game.plane;
  updatePlane(plane, game.input, dt, game.level, game.time);
  updateStorms(game.course, dt);
  game.cameraX = Math.max(0, plane.x - PLANE_SCREEN_X);
  game.time += dt;
  const ring = checkRingPass(game.course, plane.x, plane.y);
  if (ring) awardRing(game, ring);
  awardPickups(game, checkPickups(game.course, plane.x, plane.y));
  const storm = checkStormHit(game.course, plane.x, plane.y);
  if (storm) takeHit(game, 'Caught in a storm cell!');
  const mountain = checkMountainHit(game.terrain, plane.x, plane.y);
  if (mountain) {
    if (nextRing(game.course) === null) {
      if (!tryLand(game)) takeHit(game, 'Clipped the ground!');
    } else {
      takeHit(game, 'Clipped the ground!');
    }
  }
  if (game.mode === 'playing' && nextRing(game.course) === null) {
    const runway = game.runway;
    if (plane.x > runway.x - 260 && plane.x < runway.x + runway.width + 200) {
      if (plane.y > 480 && plane.speed < 260) {
        showToast(game, 'RUNWAY AHEAD — SLOW DOWN AND SET HER DOWN', '#7ee081');
      }
    }
  }
  if (game.plane.fuel <= 0 && game.plane.y >= 632) {
    endCrash(game, 'Out of fuel — the courier glided into a field.');
  }
  if (game.plane.x > game.level.length + 400) {
    endCrash(game, 'Flew past the valley — the route ends here.');
  }
  setEngine(game.audio, plane.throttle, plane.speed / PLANE.maxSpeed, true);
  game.shake = Math.max(0, game.shake - dt * 30);
  game.flash = Math.max(0, game.flash - dt);
}

function handleKey(game, code) {
  unlockAudio(game.audio);
  if (code === 'KeyM') {
    toggleMute(game.audio);
    return;
  }
  if (game.mode === 'title') {
    if (code === 'Enter' || code === 'Space') {
      startEngine(game.audio);
      game.startLevel(0);
    }
    return;
  }
  if (game.mode === 'playing') {
    if (code === 'KeyP' || code === 'Escape') game.mode = 'paused';
    if (code === 'KeyR') game.startLevel(game.levelIndex);
    return;
  }
  if (game.mode === 'paused') {
    if (code === 'KeyP' || code === 'Escape') game.mode = 'playing';
    if (code === 'KeyR') game.startLevel(game.levelIndex);
    return;
  }
  if (game.mode === 'leveldone') {
    if (code === 'Enter' || code === 'Space') game.startLevel(game.levelIndex + 1);
    return;
  }
  if (game.mode === 'gameover') {
    if (code === 'KeyR' || code === 'Enter' || code === 'Space') game.startLevel(game.levelIndex);
    return;
  }
  if (game.mode === 'final') {
    if (code === 'Enter' || code === 'Space') {
      game.score = 0;
      game.totalStars = 0;
      game.startLevel(0);
    }
  }
}

function handleClick(game) {
  unlockAudio(game.audio);
  if (game.mode === 'title') {
    startEngine(game.audio);
    game.startLevel(0);
  } else if (game.mode === 'leveldone') {
    game.startLevel(game.levelIndex + 1);
  } else if (game.mode === 'gameover') {
    game.startLevel(game.levelIndex);
  } else if (game.mode === 'final') {
    game.score = 0;
    game.totalStars = 0;
    game.startLevel(0);
  }
}

function drawWorld(game) {
  const { ctx } = game;
  ctx.save();
  if (game.shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  drawTerrain(ctx, game.cameraX, game.terrain, game.runway, game.time);
  drawMountainObstacles(ctx, game.cameraX, game.terrain);
  drawCourse(ctx, game.cameraX, game.course, game.time, game.plane.y);
  drawPlane(ctx, game.plane, game.time);
  ctx.restore();
  if (game.flash > 0) {
    ctx.fillStyle = 'rgba(255, 60, 40, ' + game.flash * 0.5 + ')';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }
}

function drawFrame(game) {
  const { ctx } = game;
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (game.mode === 'title') {
    if (!game.terrain) startLevel(game, 0);
    game.mode = 'title';
    game.cameraX = Math.max(0, game.plane.x - PLANE_SCREEN_X);
    drawWorld(game);
    drawTitleScreen(ctx, game.best);
    return;
  }
  drawWorld(game);
  if (game.mode === 'playing' || game.mode === 'paused') {
    drawHud(ctx, game);
    drawToast(ctx, game.toast, game.time);
    if (game.mode === 'paused') drawPauseScreen(ctx);
  } else if (game.mode === 'leveldone') {
    drawHud(ctx, game);
    drawLevelComplete(ctx, game);
  } else if (game.mode === 'gameover') {
    drawGameOver(ctx, game);
  } else if (game.mode === 'final') {
    drawFinalScore(ctx, game);
  }
}

export function startGame() {
  const canvas = document.getElementById('game');
  const game = createGame(canvas);
  window.__skyCourier = game;
  attachInput(game.input, canvas, {
    onKey: (code) => handleKey(game, code),
    onClick: () => handleClick(game),
  });
  if (game.shot) {
    applyShotPose(game);
    drawFrame(game);
    return game;
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.mode === 'playing') updatePlaying(game, dt);
    if (game.mode === 'title') game.time += dt;
    drawFrame(game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return game;
}

if (typeof document !== 'undefined') {
  startGame();
}
