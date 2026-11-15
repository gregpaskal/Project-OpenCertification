// ===============================================================
// @file: ask-link.js
// @filepath: dashboard_engine/_framework/_parts/ask/ask-link.js
// @version: 1.1.0
// @updated: 2026-11-13 04:16:58 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Ask part's link: the ONE piece of a dashboard that talks to a model. Every page asks it through
//   window.AskLink, so the connection can be swapped (a future AiAssist broker) without touching any page. Today it
//   reaches Ollama on this Mac directly, which only works when the page is served by the AiAssist Dashboard Host
//   (http://localhost:8765/...): a page opened from disk sends Origin null and Ollama refuses it (proven by
//   Project-AI-Local's ask spike, 2026-11-03). A STAMPED file: copied into every project with the engine, changed only
//   at the engine home.
//   API: where() · reach() · models() · chat(request, onToken) returning { promise, stop } · base().
// @tags: dashboard, ask, ollama, connection, local-ai, shared-part
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-03  Greg & Claude  1.0.0          First (Project-AI-Local): reach, list models, stream a chat with a stop, timings from Ollama's own counters
// 2026-11-13  Greg & Claude  1.1.0          Harvested into the engine as the shared Ask part (Greg: Ask becomes a shared part, Guide first); behavior unchanged
// ===============================================================
(function () {
  'use strict';
  var HOSTS = ['http://127.0.0.1:11434', 'http://localhost:11434'];
  var REACH_MS = 4000;
  var base = null;

  // Where the page runs decides whether a model can be reached at all
  function where() {
    var p = window.location.protocol;
    if (p === 'file:') { return { served: false, reason: 'file', url: null }; }
    return { served: p === 'http:' || p === 'https:', reason: 'served', url: window.location.origin };
  }

  function timed(url, ms, opts) {
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, ms);
    var o = opts || {};
    o.signal = ctl.signal;
    return fetch(url, o).finally(function () { clearTimeout(timer); });
  }

  // Find Ollama: the first host that answers /api/version. Resolves { ok, version, ms, base } or { ok:false, why }
  function reach() {
    var w = where();
    if (!w.served) { return Promise.resolve({ ok: false, why: 'file' }); }
    var i = 0;
    var t0 = performance.now();
    function next() {
      if (i >= HOSTS.length) { return Promise.resolve({ ok: false, why: 'down' }); }
      var h = HOSTS[i++];
      return timed(h + '/api/version', REACH_MS).then(function (r) {
        if (r.status === 403) { return { ok: false, why: 'refused', status: 403 }; }
        if (!r.ok) { return next(); }
        return r.json().then(function (j) { base = h; return { ok: true, version: j.version, ms: Math.round(performance.now() - t0), base: h }; });
      }, function () { return next(); });
    }
    return next();
  }

  // The models on this Mac, largest first: [{ name, gb, family, params, quant }]
  function models() {
    if (!base) { return Promise.reject(new Error('Ollama not reached yet')); }
    return timed(base + '/api/tags', 8000).then(function (r) { return r.json(); }).then(function (j) {
      return (j.models || []).map(function (m) { var d = m.details || {}; return { name: m.name, gb: m.size / 1e9, family: d.family || '', params: d.parameter_size || '', quant: d.quantization_level || '' }; }).sort(function (a, b) { return b.gb - a.gb; });
    });
  }

  // One streamed chat. request: { model, messages, options }. onToken(text) gets each piece as it arrives.
  // Returns { promise, stop }: promise resolves { text, stopped, firstMs, totalMs, tokens, tps, loadS }.
  function chat(request, onToken) {
    var ctl = new AbortController();
    var stopped = false;
    var t0 = performance.now();
    var first = null;
    var text = '';
    var done = null;
    var body = { model: request.model, messages: request.messages, stream: true, options: request.options || {}, keep_alive: request.keepAlive || '15m' };
    var promise = fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal }).then(function (r) {
      if (!r.ok) { return r.text().then(function (t) { throw new Error('Ollama answered ' + r.status + (t ? ': ' + t.slice(0, 160) : '')); }); }
      var reader = r.body.getReader();
      var dec = new TextDecoder();
      var buf = '';
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) { return; }
          buf += dec.decode(res.value, { stream: true });
          var parts = buf.split('\n');
          buf = parts.pop();
          parts.forEach(function (p) {
            if (!p.trim()) { return; }
            var j = JSON.parse(p);
            if (j.error) { throw new Error(j.error); }
            var piece = j.message && j.message.content;
            if (piece) { if (first === null) { first = performance.now() - t0; } text += piece; onToken(piece); }
            if (j.done) { done = j; }
          });
          return pump();
        });
      }
      return pump();
    }).then(function () { return result(); }, function (e) { if (stopped) { return result(); } ctl.abort(); throw e; });
    function result() {
      var total = performance.now() - t0;
      var tps = done && done.eval_duration ? done.eval_count / (done.eval_duration / 1e9) : null;
      return { text: text, stopped: stopped, firstMs: first, totalMs: total, tokens: done ? done.eval_count : null, tps: tps, loadS: done && done.load_duration ? done.load_duration / 1e9 : null };
    }
    return { promise: promise, stop: function () { stopped = true; ctl.abort(); } };
  }

  window.AskLink = { version: '1.1.0', where: where, reach: reach, models: models, chat: chat, base: function () { return base; } };
})();