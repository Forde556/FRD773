/**
 * formatters.js
 * Dental terminology highlighters, measurement regexes and a strict rich-text
 * sanitiser for the student editor.
 */
import { lexiconRegex, lookupTerm } from './dentalLexicon.js';

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------------------------------------------------------------------------
 * Measurements & clinical facts (dimensions, ratios, times, strengths…)
 * ------------------------------------------------------------------------- */
const UNIT =
  '(?:mm|cm|µm|μm|nm|MPa|GPa|kPa|°C|°F|°|%|wt%|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|yrs?|mg|kg|g|ml|mL|µl|ppm|s|min|h)';
const NUM = '\\d+(?:[.,]\\d+)?';
export const MEASURE_SOURCE = `${NUM}(?:\\s?(?:–|-|to)\\s?${NUM})?\\s?${UNIT}(?![A-Za-z0-9])|\\b\\d+(?:\\.\\d+)?\\s?:\\s?\\d+(?:\\.\\d+)?\\b`;
export const measureRegex = () => new RegExp(MEASURE_SOURCE, 'g');

/** Unique measurements found in text, in order of appearance. */
export function extractFacts(text) {
  const out = [];
  const seen = new Set();
  const re = measureRegex();
  let m;
  while ((m = re.exec(text))) {
    const v = m[0].trim();
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Rich text sanitiser — only pastel highlights and basic emphasis survive.
 * ------------------------------------------------------------------------- */
export const HIGHLIGHT_TONES = ['amber', 'mint', 'rose', 'lavender', 'sky'];
const ALLOWED = new Set(['MARK', 'STRONG', 'B', 'EM', 'I', 'U', 'BR']);
const TONES = new Set(HIGHLIGHT_TONES);

export function sanitizeRichHtml(html) {
  if (typeof DOMParser === 'undefined') return escapeHtml(stripHtml(html));
  const doc = new DOMParser().parseFromString(`<div>${html ?? ''}</div>`, 'text/html');
  const root = doc.body.firstChild;
  const out = doc.createElement('div');

  const walk = (node, parent) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        parent.appendChild(doc.createTextNode(child.textContent));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName;
        if (ALLOWED.has(tag)) {
          const name = tag === 'B' ? 'strong' : tag === 'I' ? 'em' : tag.toLowerCase();
          const el = doc.createElement(name);
          if (tag === 'MARK') {
            const tone = child.getAttribute('data-tone');
            el.setAttribute('data-tone', TONES.has(tone) ? tone : 'amber');
          }
          parent.appendChild(el);
          walk(child, el);
        } else if (tag === 'DIV' || tag === 'P') {
          if (parent.childNodes.length) parent.appendChild(doc.createElement('br'));
          walk(child, parent);
        } else if (tag === 'SCRIPT' || tag === 'STYLE') {
          /* drop entirely */
        } else {
          walk(child, parent); // unwrap unknown elements, keep their text
        }
      }
    }
  };
  walk(root, out);
  // Trim trailing <br> left by contentEditable
  while (out.lastChild && out.lastChild.nodeName === 'BR') out.removeChild(out.lastChild);
  return out.innerHTML;
}

export function stripHtml(html) {
  if (typeof DOMParser === 'undefined') return String(html ?? '').replace(/<[^>]*>/g, '');
  const doc = new DOMParser().parseFromString(`<div>${html ?? ''}</div>`, 'text/html');
  return doc.body.textContent || '';
}

/* ---------------------------------------------------------------------------
 * Decorators — applied at display time only, never stored.
 * ------------------------------------------------------------------------- */
function wrapMatches(root, regex, makeNode, skipSelector) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  let n;
  while ((n = walker.nextNode())) {
    if (skipSelector && n.parentElement?.closest(skipSelector)) continue;
    if (n.textContent.trim()) targets.push(n);
  }
  for (const textNode of targets) {
    const text = textNode.textContent;
    regex.lastIndex = 0;
    let m;
    let last = 0;
    const frag = doc.createDocumentFragment();
    let changed = false;
    while ((m = regex.exec(text))) {
      if (m[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      const replacement = makeNode(m, doc);
      if (!replacement) continue;
      changed = true;
      if (m.index > last) frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      frag.appendChild(replacement);
      last = m.index + m[0].length;
    }
    if (!changed) continue;
    if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
  }
}

/**
 * Decorate stored HTML for reading: highlight measurements and, when the
 * bilingual view is active, append the Arabic meaning after each known term.
 */
export function decorateHtml(html, { facts = true, bilingual = false } = {}) {
  if (typeof DOMParser === 'undefined' || (!facts && !bilingual)) return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstChild;

  if (facts) {
    wrapMatches(root, measureRegex(), (m, d) => {
      const s = d.createElement('span');
      s.className = 'fact';
      s.textContent = m[0];
      return s;
    });
  }
  if (bilingual) {
    wrapMatches(
      root,
      lexiconRegex(),
      (m, d) => {
        const entry = lookupTerm(m[1]);
        if (!entry) return null;
        const wrap = d.createElement('span');
        wrap.className = 'term-bi';
        wrap.appendChild(d.createTextNode(m[0]));
        const ar = d.createElement('span');
        ar.className = 'term-ar';
        ar.setAttribute('dir', 'rtl');
        ar.textContent = entry.ar;
        wrap.appendChild(ar);
        return wrap;
      },
      '.fact, .term-bi',
    );
  }
  return root.innerHTML;
}

/* ---------------------------------------------------------------------------
 * Misc
 * ------------------------------------------------------------------------- */
export function formatClock(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHoursMinutes(ms) {
  const totalMin = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} دقيقة`;
  return `${h} ساعة و${m} دقيقة`;
}

export function relativeTimeAr(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'الآن';
  if (min < 60) return `منذ ${min} دقيقة`;
  const h = Math.round(min / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.round(h / 24);
  if (d === 1) return 'منذ يوم';
  return `منذ ${d} أيام`;
}

export function uid(prefix = 'id') {
  const rnd = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rnd}`;
}
