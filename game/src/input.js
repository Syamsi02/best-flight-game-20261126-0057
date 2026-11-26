// Sky Courier — keyboard and mouse input.
// One clear job: turn keys and pointer moves into one input state.

import { KEYS } from './config.js';

export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    mouseSteer: false,
    mouseBoost: false,
    mouseY: 300,
    mouseX: 380,
    pressed: new Set(),
  };
}

function matches(code, list) {
  return list.indexOf(code) !== -1;
}

export function attachInput(input, canvas, callbacks) {
  const down = (e) => {
    if (matches(e.code, KEYS.up)) input.up = true;
    if (matches(e.code, KEYS.down)) input.down = true;
    if (matches(e.code, KEYS.left)) input.left = true;
    if (matches(e.code, KEYS.right)) input.right = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) !== -1) e.preventDefault();
    if (!e.repeat) {
      input.pressed.add(e.code);
      if (callbacks.onKey) callbacks.onKey(e.code);
    }
  };
  const up = (e) => {
    if (matches(e.code, KEYS.up)) input.up = false;
    if (matches(e.code, KEYS.down)) input.down = false;
    if (matches(e.code, KEYS.left)) input.left = false;
    if (matches(e.code, KEYS.right)) input.right = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
    input.mouseBoost = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const scaleX = canvas.width / rect.width;
    input.mouseY = (e.clientY - rect.top) * scaleY;
    input.mouseX = (e.clientX - rect.left) * scaleX;
    input.mouseSteer = true;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      input.mouseBoost = true;
      if (callbacks.onClick) callbacks.onClick();
    }
  });
  window.addEventListener('mouseup', () => {
    input.mouseBoost = false;
  });
  canvas.addEventListener('mouseleave', () => {
    input.mouseSteer = false;
  });
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    input.mouseY = (t.clientY - rect.top) * (canvas.height / rect.height);
    input.mouseSteer = true;
    input.mouseBoost = true;
    if (callbacks.onClick) callbacks.onClick();
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    input.mouseY = (t.clientY - rect.top) * (canvas.height / rect.height);
    input.mouseSteer = true;
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => {
    input.mouseBoost = false;
  });
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}

export function consumePress(input, code) {
  if (input.pressed.has(code)) {
    input.pressed.delete(code);
    return true;
  }
  return false;
}

export function clearPresses(input) {
  input.pressed.clear();
}
