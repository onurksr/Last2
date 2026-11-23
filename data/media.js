'use strict';
const crypto = require('crypto');

// Render -> Environment -> TMDB_API_KEY. Both v3 API keys and v4 read tokens work.
const TMDB_KEY = String(process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN || '').trim();
const hasTmdb = () => Boolean(TMDB_KEY);
const tmdbHeaders = TMDB_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${TMDB_KEY}` } : {};

const fold = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const cache = new Map();
const getC = k => { const h = cache.get(k); return h && h.exp > Date.now() ? h.v : undefined; };
const setC = (k, v, ms) => cache.set(k, { v, exp: Date.now() + ms });
const shuffle = a => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [x[i], x[j]] = [x[j], x[i]]; } return x; };

const stats = { songRequests: 0, songSuccess: 0, filmRequests: 0, filmSuccess: 0, filmNoFrames: 0, lastFilmError: '' };
async function getJson(url, headers = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal, headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

function titleScore(candidate, wanted) {
  const a = fold(candidate), b = fold(wanted);
  if (!a || !b) return 0;
  if (a === b) return 10;
  if (a.includes(b) || b.includes(a)) return 7;
  const aa = new Set(a.split(' ')), bb = b.split(' ');
  const common = bb.filter(w => aa.has(w)).length;
  return common / Math.max(1, bb.length) * 5;
}
function artistScore(candidate, wanted) {
  const a = fold(candidate), b = fold(wanted);
  if (!a || !b) return 0;
  if (a === b) return 7;
  if (a.includes(b) || b.includes(a)) return 5;
  const first = b.split(' ')[0];
  return first.length > 3 && a.split(' ').includes(first) ? 2 : 0;
}

async function resolveSong(item) {
  stats.songRequests++;
  const key = 's:' + item.id;
  const hit = getC(key);
  if (hit !== undefined) { if (hit) stats.songSuccess++; return hit; }
  let url = null;
  const queries = [item.artist + ' ' + item.title, item.title + ' ' + item.artist, item.title];
  for (const country of ['TR', 'US']) {
    for (const term of queries) {
      try {
        const j = await getJson('https://itunes.apple.com/search?' + new URLSearchParams({ media: 'music', entity: 'song', limit: '25', country, term }));
        const ranked = (j.results || []).filter(x => x.previewUrl).map(x => ({
          x,
          score: titleScore(x.trackName, item.title) * 1.25 + artistScore(x.artistName, item.artist)
        })).sort((a, b) => b.score - a.score);
        if (ranked[0] && ranked[0].score >= 9) { url = ranked[0].x.previewUrl; break; }
      } catch (e) { /* Try the next query/provider. */ }
    }
    if (url) break;
  }
  if (!url) {
    for (const term of [`track:"${item.title}" artist:"${item.artist}"`, `${item.title} ${item.artist}`]) {
      try {
        const j = await getJson('https://api.deezer.com/search?' + new URLSearchParams({ limit: '25', q: term }));
        const ranked = (j.data || []).filter(x => x.preview).map(x => ({
          x,
          score: titleScore(x.title, item.title) * 1.25 + artistScore(x.artist && x.artist.name, item.artist)
        })).sort((a, b) => b.score - a.score);
        if (ranked[0] && ranked[0].score >= 9) { url = ranked[0].x.preview; break; }
      } catch (e) { /* Continue; the catalog will skip unavailable previews. */ }
    }
  }
  if (url) stats.songSuccess++;
  setC(key, url, url ? 6 * 3600e3 : 90e3);
  return url;
}

function tmdbUrl(path, params = {}) {
  const u = new URL('https://api.themoviedb.org/3' + path);
  if (!tmdbHeaders.Authorization) u.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') u.searchParams.set(k, String(v));
  return u.toString();
}

async function resolveFilm(item, n = 5) {
  stats.filmRequests++;
  const key = 'f:' + item.id;
  const hit = getC(key);
  if (hit !== undefined) { if (hit && hit.length) stats.filmSuccess++; return hit; }

  let pool = Array.isArray(item.images) ? item.images.filter(u => typeof u === 'string' && /^https:\/\//i.test(u)) : [];
  if (pool.length < n && hasTmdb()) {
    try {
      let movieId = item.tmdb || null;
      if (!movieId) {
        const candidates = [];
        for (const query of [...new Set([item.en, item.title].filter(Boolean))]) {
          let data = await getJson(tmdbUrl('/search/movie', { query, year: item.year, include_adult: false }), tmdbHeaders);
          if (!data.results?.length) data = await getJson(tmdbUrl('/search/movie', { query, include_adult: false }), tmdbHeaders);
          candidates.push(...(data.results || []));
        }
        const wanted = item.en || item.title;
        candidates.sort((a, b) => {
          const sa = Math.max(titleScore(a.title, wanted), titleScore(a.original_title, wanted)) + (String(a.release_date || '').startsWith(String(item.year)) ? 4 : 0);
          const sb = Math.max(titleScore(b.title, wanted), titleScore(b.original_title, wanted)) + (String(b.release_date || '').startsWith(String(item.year)) ? 4 : 0);
          return sb - sa;
        });
        movieId = candidates[0]?.id || null;
      }
      if (movieId) {
        // Scene-like wide backdrops, not portrait posters. Accept English, Turkish and textless images.
        const images = await getJson(tmdbUrl(`/movie/${movieId}/images`, { include_image_language: 'en,tr,null' }), tmdbHeaders);
        const backdrops = (images.backdrops || [])
          .filter(x => x.file_path && x.width >= 500 && (x.aspect_ratio || x.width / Math.max(1, x.height)) >= 1.25)
          .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0) || (b.width || 0) - (a.width || 0));
        const tmdbImages = backdrops.map(x => 'https://image.tmdb.org/t/p/w1280' + x.file_path);
        pool = [...new Set([...pool, ...tmdbImages])];
        // A single valid backdrop is still a playable round; do not discard a film just because it has <3 images.
        if (!pool.length) {
          const details = await getJson(tmdbUrl(`/movie/${movieId}`, { language: 'en-US' }), tmdbHeaders);
          if (details.backdrop_path) pool.push('https://image.tmdb.org/t/p/w1280' + details.backdrop_path);
        }
      }
      stats.lastFilmError = '';
    } catch (e) {
      stats.lastFilmError = String(e && e.message || 'TMDB isteği başarısız').slice(0, 80);
      console.warn('[media] Film görseli alınamadı:', stats.lastFilmError);
    }
  } else if (!hasTmdb() && pool.length === 0) {
    stats.lastFilmError = 'TMDB_API_KEY ortam değişkeni tanımlı değil';
  }
  pool = [...new Set(pool)].filter(u => /^https:\/\//i.test(u));
  if (!pool.length && hasTmdb() && !stats.lastFilmError) stats.lastFilmError = 'TMDB uygun geniş sahne karesi döndürmedi';
  if (pool.length) {
    stats.filmSuccess++;
    setC(key, pool, 12 * 3600e3);
    return shuffle(pool).slice(0, n);
  }
  stats.filmNoFrames++;
  setC(key, null, 60e3);
  return null;
}

const PXUA = { 'User-Agent': 'PartiOdasi/1.0 (party game)' };
const PX_W = [20, 40, 60, 120];
const px = { ok: 0, fail: 0, checked: 0, running: false };
async function imgOk(url) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 7000);
  try {
    const r = await fetch(url, { signal: c.signal, headers: PXUA });
    const ok = r.ok && /^image\//.test(r.headers.get('content-type') || '');
    await r.arrayBuffer().catch(() => {});
    return ok;
  } catch (e) { return false; } finally { clearTimeout(t); }
}
async function resolvePixel(item) {
  const key = 'p:' + item.title, hit = getC(key);
  if (hit !== undefined) return hit;
  let res = null;
  try {
    const j = await getJson('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(item.title.replace(/ /g, '_')), PXUA);
    const src = j.thumbnail && j.thumbnail.source;
    if (src && src.includes('/wikipedia/commons/') && /\/\d+px-/.test(src) && !/\.svg/i.test(src)) {
      const small = PX_W.map(w => src.replace(/\/\d+px-/, '/' + w + 'px-'));
      const oks = await Promise.all([...small, src].map(imgOk));
      if (oks.every(Boolean)) res = [...small, src];
      else if (oks[4]) res = [src, src, src, src, src];
    }
  } catch (e) { res = null; }
  setC(key, res, res ? 6 * 3600e3 : 600e3);
  return res;
}
async function pixelCheck(items) {
  if (px.running) return;
  px.running = true; px.ok = 0; px.fail = 0; px.checked = 0;
  const q = [...items];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (q.length) { const r = await resolvePixel(q.shift()); px[r ? 'ok' : 'fail']++; px.checked++; }
  }));
  px.running = false;
}
const pixelStats = () => ({ ...px });
const mediaStatus = () => ({ tmdbConfigured: hasTmdb(), ...stats, pixel: pixelStats() });

module.exports = { fold, hasTmdb, resolveSong, resolveFilm, resolvePixel, pixelCheck, pixelStats, mediaStatus };
