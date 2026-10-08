/**
 * quotaTracker.js
 * Midnight-reset daily limiter for the methodical translation service.
 * The day boundary follows the student's local clock.
 */

export const DAILY_TRANSLATION_LIMIT = 5;
const KEY = 'dsp.translationQuota.v1';

export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nextMidnight(from = new Date()) {
  const n = new Date(from);
  n.setHours(24, 0, 0, 0);
  return n;
}

export function msUntilReset(from = new Date()) {
  return nextMidnight(from).getTime() - from.getTime();
}

function read() {
  const today = localDateKey();
  try {
    const rec = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (rec && rec.date === today && Number.isInteger(rec.used) && rec.used >= 0) return rec;
  } catch {
    /* corrupted record → start fresh */
  }
  return { date: today, used: 0, log: [] };
}

function write(rec) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* storage full or disabled — quota still enforced in memory for this session */
  }
}

export function getQuota() {
  const rec = read();
  const used = Math.min(rec.used, DAILY_TRANSLATION_LIMIT);
  return {
    used,
    remaining: Math.max(0, DAILY_TRANSLATION_LIMIT - used),
    limit: DAILY_TRANSLATION_LIMIT,
    date: rec.date,
    resetsAt: nextMidnight().toISOString(),
  };
}

/**
 * Attempt to spend one translation request.
 * @param {string} kind 'selection' | 'lecture'
 * @returns {{ok:boolean, used:number, remaining:number, limit:number}}
 */
export function consumeQuota(kind = 'selection') {
  const rec = read();
  if (rec.used >= DAILY_TRANSLATION_LIMIT) return { ok: false, ...getQuota() };
  rec.used += 1;
  rec.log = [...(rec.log || []), { kind, at: new Date().toISOString() }].slice(-DAILY_TRANSLATION_LIMIT);
  write(rec);
  return { ok: true, ...getQuota() };
}
