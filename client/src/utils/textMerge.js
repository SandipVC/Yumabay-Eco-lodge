/**
 * Shared text-merge + path helpers for the bilingual CMS.
 *
 * `deepMerge` is the single source of truth for layering CMS translation
 * overrides (and live in-context edits) on top of the static en/es defaults.
 * It is intentionally identical in behaviour to the merge that used to live
 * inside LanguageContext (kept here so the in-context editor can reuse it).
 */

export function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep-merge `override` on top of `base`.
 * - Plain objects merge recursively.
 * - Arrays merge element-wise; missing elements fall back to base.
 * - Primitives: override wins, EXCEPT a blank string is treated as
 *   "use the base value" (so clearing a field reverts to the default).
 */
export function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base) && Array.isArray(override)) {
    const out = [];
    const len = Math.max(base.length, override.length);
    for (let i = 0; i < len; i++) {
      out[i] = deepMerge(base[i], override[i]);
    }
    return out;
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const out = { ...base };
    for (const k of Object.keys(override)) {
      out[k] = deepMerge(base[k], override[k]);
    }
    return out;
  }
  // Primitive — keep base if override is empty string (blank = "use default").
  if (typeof override === 'string' && override === '' && typeof base === 'string' && base !== '') {
    return base;
  }
  return override;
}

/**
 * Read a nested value by dotted path, e.g. getByPath(obj, 'properties.items.0.name').
 * Returns undefined if any segment is missing.
 */
export function getByPath(obj, path) {
  if (obj == null) return undefined;
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Set a nested value by dotted path, creating intermediate containers as needed.
 * A numeric next-segment creates an array (so it deep-merges element-wise against
 * the array defaults); anything else creates a plain object. Mutates `obj`.
 */
export function setByPath(obj, path, value) {
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const wantArray = /^\d+$/.test(parts[i + 1]);
    if (cur[key] == null || typeof cur[key] !== 'object') {
      cur[key] = wantArray ? [] : {};
    }
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
  return obj;
}
