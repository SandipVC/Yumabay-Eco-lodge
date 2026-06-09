/**
 * useAssets — fetches the CMS asset map from /api/cms/assets.
 *
 * Uses a module-level cache (30 s TTL) so every component that calls this
 * hook in the same page load shares a single network request.
 *
 * Shape of assets:
 * {
 *   hero:       { video, poster },
 *   about:      { main, accent },
 *   properties: [ "/images/...", ... ],   // 5 slots indexed 0-4
 *   gallery:    [ { src, label, cat }, ... ],
 *   lounge:     [ "/images/...", ... ],   // 4 slots indexed 0-3
 * }
 */
import { useState, useEffect } from 'react';

let _cache = null;
let _cacheTs = 0;
const TTL = 30_000; // 30 s

let _promise = null; // de-duplicate in-flight requests

async function _fetch() {
  const res = await fetch('/api/cms/assets');
  if (!res.ok) throw new Error('CMS asset fetch failed');
  return res.json();
}

function _load() {
  if (_promise) return _promise;
  _promise = _fetch()
    .then(data => {
      _cache   = data;
      _cacheTs = Date.now();
      _promise = null;
      return data;
    })
    .catch(err => {
      _promise = null;
      throw err;
    });
  return _promise;
}

export function invalidateAssetsCache() {
  _cache   = null;
  _cacheTs = 0;
}

export function useAssets() {
  const fresh  = _cache && (Date.now() - _cacheTs < TTL);
  const [assets,  setAssets]  = useState(fresh ? _cache : null);
  const [loading, setLoading] = useState(!fresh);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (_cache && Date.now() - _cacheTs < TTL) {
      setAssets(_cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    _load()
      .then(data => { setAssets(data); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }, []);

  function refresh() {
    invalidateAssetsCache();
    setLoading(true);
    setError(null);
    _load()
      .then(data => { setAssets(data); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }

  return { assets, loading, error, refresh };
}
