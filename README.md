# best-flight-game-20261126-0057

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/Syamsi02/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/Syamsi02/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Sky Courier — a complete, original 2D canvas flight game. Fly a little cargo plane through glowing delivery rings, collect stars, dodge mountains and storm clouds, watch your fuel, and land on the runway to finish each run.

## Run it

```sh
open game/index.html in a desktop browser (or serve game/ with any static server)
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=fgwhnby2&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>

# Sky Courier

A complete, original 2D canvas flight game. Fly a little cargo plane through
glowing delivery rings, collect stars, dodge mountains and storm clouds,
watch your fuel, and land on the runway to finish each run.

Play it: open `game/index.html` in a desktop browser (or serve `game/` with
any static server). No network requests, no build step.

## Controls

- **Up / Down** (or **W / S**): climb / descend
- **Left / Right** (or **A / D**): throttle down / up
- **Mouse**: move to steer toward the pointer, hold click for boost
- **P**: pause — **R**: restart — **Enter**: start / next level — **M**: mute

## How a run works

1. Fly through the glowing rings in order — each one is a cargo drop.
2. Stars are bonus points, fuel cans top the tank back up.
3. Mountains and storm clouds damage the plane; three hits ends the run.
4. When every ring is done, the runway lights up: land gently on it
   (slow and level) to bank the delivery bonus and move to the next level.
5. Three levels: Green Valley, River Rapids, Storm Peaks — faster winds,
   more storms, tighter rings.

## Screenshots

Deterministic posed shots, no play needed:

- `game/index.html?shot=start&seed=1` — title screen over the runway
- `game/index.html?shot=play&seed=1` — mid-flight through a ring
- `game/index.html?shot=end&seed=1` — landing / score screen

## Files

- `game/index.html` — page shell, canvas, HUD shell
- `game/style.css` — page and canvas styling
- `game/src/config.js` — tuning constants and the three levels
- `game/src/random.js` — seeded random numbers
- `game/src/terrain.js` — sky, mountains, fields, river, road, runway
- `game/src/plane.js` — plane physics and drawing
- `game/src/rings.js` — rings, stars, storms, fuel cans
- `game/src/hud.js` — HUD, gauges, compass, minimap, screens
- `game/src/audio.js` — tiny WebAudio synth (engine hum, chimes)
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — deterministic posed screenshots
- `game/src/main.js` — game loop, state machine, scoring

Referral code for the make.fun bounty: `fgwhnby2`
