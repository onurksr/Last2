const assert = require('node:assert/strict');
process.env.TMDB_API_KEY = 'test-key';
const media = require('../data/media');

(async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async input => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/movie/123/images')) {
      return { ok: true, json: async () => ({ backdrops: [
        { file_path: '/scene-one.jpg', width: 1920, height: 1080, aspect_ratio: 1.78, iso_639_1: null, vote_count: 2 }
      ] }) };
    }
    if (url.includes('itunes.apple.com/search')) {
      return { ok: true, json: async () => ({ results: [
        { trackName: 'Bad Guy', artistName: 'Billie Eilish', previewUrl: 'https://audio.example/bad-guy.m4a' }
      ] }) };
    }
    throw new Error('Unexpected test URL: ' + url);
  };
  try {
    const frames = await media.resolveFilm({ id: 'test-film', title: 'Test Film', en: 'Test Film', year: 2020, tmdb: 123 });
    assert.equal(frames.length, 1, 'Tek uygun backdrop da filmi oynatabilmeli');
    assert.equal(frames[0], 'https://image.tmdb.org/t/p/w1280/scene-one.jpg');
    const audio = await media.resolveSong({ id: 'test-song', title: 'Bad Guy', artist: 'Billie Eilish' });
    assert.equal(audio, 'https://audio.example/bad-guy.m4a');
    assert.ok(calls.some(x => x.includes('/movie/123/images')));
    console.log('Media resolution tests passed: single-frame film fallback + iTunes preview.');
  } finally {
    global.fetch = originalFetch;
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
