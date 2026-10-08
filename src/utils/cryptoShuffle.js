/**
 * cryptoShuffle.js
 * Cryptographically-strong randomisation utilities used by the examination
 * engine's anti-pattern shield.
 */

/** Uniform integer in [0, maxExclusive) using rejection sampling (no modulo bias). */
export function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('maxExclusive must be a positive integer');
  }
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== 'function') {
    return Math.floor(Math.random() * maxExclusive);
  }
  const RANGE = 0x100000000; // 2^32
  const limit = RANGE - (RANGE % maxExclusive);
  const buf = new Uint32Array(1);
  let x;
  do {
    c.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % maxExclusive;
}

/** Fisher–Yates shuffle driven by crypto.getRandomValues. Returns a new array. */
export function cryptoShuffle(input) {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick n distinct random elements. */
export function pickRandom(input, n) {
  return cryptoShuffle(input).slice(0, Math.max(0, n));
}

/**
 * Produce the index of the correct answer for each of `count` questions so that:
 *  - every option position is used (almost) equally often, and
 *  - the same position never appears more than twice in a row.
 * This removes the classic "C is usually right" bias and mechanical guessing.
 */
export function balancedAnswerSlots(count, optionsPerQuestion = 4) {
  if (count <= 0) return [];
  const pool = [];
  for (let i = 0; i < count; i++) pool.push(i % optionsPerQuestion);

  for (let attempt = 0; attempt < 60; attempt++) {
    const slots = cryptoShuffle(pool);
    if (!hasLongRun(slots, 2)) return slots;
    // Try to repair runs by swapping with a later, different value.
    for (let i = 2; i < slots.length; i++) {
      if (slots[i] === slots[i - 1] && slots[i] === slots[i - 2]) {
        for (let j = i + 1; j < slots.length; j++) {
          if (slots[j] !== slots[i]) {
            [slots[i], slots[j]] = [slots[j], slots[i]];
            break;
          }
        }
      }
    }
    if (!hasLongRun(slots, 2)) return slots;
  }
  return cryptoShuffle(pool);
}

function hasLongRun(arr, maxRun) {
  let run = 1;
  for (let i = 1; i < arr.length; i++) {
    run = arr[i] === arr[i - 1] ? run + 1 : 1;
    if (run > maxRun) return true;
  }
  return false;
}
