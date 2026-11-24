// data/film-service.js
'use strict';

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

let _cfg = null;
function cfg() {
  if (_cfg) return _cfg;
  const apiKey = String(process.env.TMDB_API_KEY || '').trim();
  const token  = String(process.env.TMDB_READ_ACCESS_TOKEN || '').trim();
  _cfg = { apiKey, token, hasKey: Boolean(apiKey || token) };
  return _cfg;
}
function hasKey() { return cfg().hasKey; }

const cache = new Map();
const imgCache = new Map();
const CACHE_TTL = 24 * 3600 * 1000;
const IMG_TTL   = 60 * 60 * 1000;

function cGet(m, k) {
  const e = m.get(k);
  if (!e) return null;
  if (e.expires < Date.now()) { m.delete(k); return null; }
  return e.data;
}
function cSet(m, k, data, ttl) {
  m.set(k, { data, expires: Date.now() + ttl });
}

async function tmdb(path, params = {}) {
  const c = cfg();
  if (!c.hasKey) return null;
  const url = new URL(TMDB_API + path);
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  const headers = { Accept: 'application/json' };
  if (c.token) headers.Authorization = 'Bearer ' + c.token;
  else if (c.apiKey) url.searchParams.set('api_key', c.apiKey);

  const key = 'tmdb:' + url.pathname + ':' + url.searchParams.toString();
  const hit = cGet(cache, key);
  if (hit) return hit;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url.toString(), { headers, signal: ctrl.signal });
    if (!res.ok) {
      if (res.status === 401) console.error('[film] TMDB 401 – anahtar geçersiz');
      if (res.status === 429) console.warn('[film] TMDB rate limit');
      return null;
    }
    const data = await res.json();
    cSet(cache, key, data, CACHE_TTL);
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function imageOk(url) {
  if (!url) return false;
  const hit = cGet(imgCache, url);
  if (hit !== null) return hit;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const ok = res.ok && ct.startsWith('image/');
    cSet(imgCache, url, ok, IMG_TTL);
    return ok;
  } catch {
    cSet(imgCache, url, false, IMG_TTL);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function normTitle(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchMovie(title, year) {
  if (!title) return null;
  const data = await tmdb('/search/movie', {
    query: title, language: 'tr-TR', include_adult: 'false',
    year: year || undefined,
  });
  if (!data || !Array.isArray(data.results) || !data.results.length) {
    if (year) {
      const loose = await tmdb('/search/movie', { query: title, language: 'tr-TR', include_adult: 'false' });
      if (loose && Array.isArray(loose.results) && loose.results.length) return loose.results[0];
    }
    return null;
  }
  if (year) {
    const strict = data.results.filter(r => {
      const y = parseInt((r.release_date || '').slice(0, 4), 10);
      return Number.isFinite(y) && Math.abs(y - year) <= 1;
    });
    if (strict.length) return strict[0];
  }
  return data.results[0];
}

async function fetchMovieBundle(tmdbId) {
  const [details, images] = await Promise.all([
    tmdb('/movie/' + tmdbId, { language: 'tr-TR' }),
    tmdb('/movie/' + tmdbId + '/images', { include_image_language: 'tr,en,null' }),
  ]);
  return { details, images };
}

function buildBackdrops(images) {
  if (!images || !Array.isArray(images.backdrops)) return [];
  const seen = new Set();
  return images.backdrops
    .filter(b => b && b.file_path)
    .filter(b => { if (seen.has(b.file_path)) return false; seen.add(b.file_path); return true; })
    .filter(b => {
      const ar = b.aspect_ratio || (b.width && b.height ? b.width / b.height : 0);
      return ar >= 1.4 && ar <= 2.1 && (b.width || 0) >= 640 && (b.height || 0) >= 360;
    })
    .map(b => ({ path: b.file_path, width: b.width, height: b.height, votes: b.vote_average || 0 }))
    .sort((a, b) => b.votes - a.votes);
}

async function resolveFilmScenes(film, want = 5) {
  if (!cfg().hasKey) return null;

  if (Array.isArray(film.images) && film.images.length >= 1) {
    const checks = await Promise.all(
      film.images.slice(0, want).map(async url => ({ url, ok: await imageOk(url) }))
    );
    const verified = checks.filter(c => c.ok).map(c => c.url);
    if (verified.length) {
      return {
        tmdbId: film.tmdbId || null,
        title: film.title, originalTitle: film.title,
        year: String(film.year || ''), overview: '',
        sceneUrls: verified, verifiedCount: verified.length, source: 'custom',
      };
    }
  }

  let tmdbId = film.tmdbId || null;
  if (!tmdbId) {
    const found = await searchMovie(film.title, film.year);
    if (!found) return null;
    tmdbId = found.id;
    film.tmdbId = tmdbId;
  }

  const { details, images } = await fetchMovieBundle(tmdbId);
  if (!details || !images) return null;

  const backdrops = buildBackdrops(images);
  if (!backdrops.length) return null;

  const candidates = backdrops.slice(0, Math.min(backdrops.length, want * 3))
    .map(b => ({ ...b, url: `${TMDB_IMG}/w1280${b.path}` }));

  const checks = await Promise.all(candidates.map(async c => ({ c, ok: await imageOk(c.url) })));
  const verified = checks.filter(x => x.ok).map(x => x.c);
  if (!verified.length) return null;

  const sceneUrls = [];
  for (let i = 0; i < want; i++) sceneUrls.push(verified[i % verified.length].url);

  return {
    tmdbId,
    title: details.title || film.title,
    originalTitle: details.original_title || film.title,
    year: (details.release_date || '').slice(0, 4) || String(film.year || ''),
    overview: details.overview || '',
    sceneUrls, verifiedCount: verified.length, source: 'tmdb',
  };
}

async function status() {
  const c = cfg();
  return {
    tmdbConfigured: c.hasKey,
    usingV3Key: Boolean(c.apiKey) && !c.token,
    usingV4Token: Boolean(c.token),
    cacheSize: cache.size,
    imageCacheSize: imgCache.size,
  };
}

async function testFilm(title, year) {
  const c = cfg();
  if (!c.hasKey) return { ok: false, err: 'TMDB_API_KEY / TMDB_READ_ACCESS_TOKEN tanımlı değil' };
  if (!title) return { ok: false, err: 'title parametresi gerekli (örn: ?title=Inception&year=2010)' };
  const found = await searchMovie(title, year);
  if (!found) return { ok: false, err: 'TMDB aramada film bulunamadı', query: { title, year } };
  const { details, images } = await fetchMovieBundle(found.id);
  const backdrops = buildBackdrops(images);
  const sample = backdrops.slice(0, 5).map(b => ({ url: `${TMDB_IMG}/w1280${b.path}`, votes: b.votes }));
  const validations = await Promise.all(sample.map(async s => ({ url: s.url, ok: await imageOk(s.url) })));
  return {
    ok: true,
    tmdbId: found.id,
    title: details?.title,
    originalTitle: details?.original_title,
    year: (details?.release_date || '').slice(0, 4),
    backdropCount: backdrops.length,
    verifiedCount: validations.filter(v => v.ok).length,
    sampleValidations: validations,
  };
}

module.exports = {
  cfg, hasKey, status, testFilm,
  resolveFilmScenes, imageOk, searchMovie, normTitle,
};
