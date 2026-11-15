// ===============================================================
// @file: test-results.js
// @filepath: dashboard_engine/_framework/_templates/test-results/test-results.js
// @version: 1.0.0
// @updated: 2026-11-14 07:07:33 PM CST
// @author: Greg Paskal & Claude
// @company: MissionWares®
// @description: The Test Results page type's renderer. Reads the two files the mAi Framework's FW_TestRunResults writes
//   in _docs/_test_results/: results-data.js (window.MAI_RESULTS, one record per run, read again every 8 seconds) and
//   run-status.js (window.MAI_RUN_STATUS, the run in progress, read again every 4 seconds). Draws the run in progress,
//   the latest run with what failed, was blocked by the provider or is suspect, each suite across the last 12 runs, and
//   the full history. Disk is the truth: a file is loaded again by script re-injection, as the engine's own pages do,
//   and the page redraws only when the newest record changes. A STAMPED file: changed only at the engine home.
// @dependencies: ../_test_results/results-data.js, ../_test_results/run-status.js (both written by the framework)
// @tags: dashboard, test-results, mai-framework, live, page-type
// @changeLog:
// Date        Author         Version        Description
// ----------  -------------  -------------  --------------------------
// 2026-11-14  Greg & Claude  1.0.0          The Test Results page type, harvested from Automation-JAV-Framework results.html 1.2.4 (Greg: add the Results page, call it Test Results): views and polling unchanged; rs- renamed tr-; a missing data file named on the page; TR_TEMPLATE_VERSION announced
// ===============================================================
(function () {
  'use strict';
  var VERSION = '1.0.0';
  // The page type announces itself, like the engine does: type TR_TEMPLATE_VERSION in the console. Must equal @version above.
  window.TR_TEMPLATE_VERSION = VERSION;

  var DATA = '../_test_results/results-data.js';
  var STATUS = '../_test_results/run-status.js';
  var DATA_EVERY = 8000;
  var STATUS_EVERY = 4000;
  var GRID_RUNS = 12;
  var STALE_SECONDS = 30;
  var lastSig = null;

  // Text made safe for the page
  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }

  // A count, or a dash when the run did not report it
  function n(value) {
    return value === null || value === undefined ? '-' : esc(value);
  }

  function byId(id) { return document.getElementById(id); }

  // Passed when tests ran, none failed or errored, and the build succeeded; a run the framework records carries no
  // build result (null: the framework sees its tests, not Maven), so its tests alone decide
  function passed(run) {
    var buildOk = run.build === 'SUCCESS' || run.build === null || run.build === undefined;
    return buildOk && run.tests !== null && run.tests !== undefined && run.failures === 0 && run.errors === 0;
  }

  function fact(label, value) {
    return '<div class="tr-fact"><span class="k">' + esc(label) + '</span><span class="v">' + value + '</span></div>';
  }

  // A count in its warning color when it is not zero
  function marked(value, cls) {
    return '<span class="' + (value ? cls : '') + '">' + n(value) + '</span>';
  }

  function renderLatest(runs) {
    var run = runs[runs.length - 1];
    var ok = passed(run);
    var html = '<div class="tr-verdict ' + (ok ? 'tr-pass' : 'tr-fail') + '">' + (ok ? 'PASSED' : (run.tests === null || run.tests === undefined ? 'BUILD FAILED BEFORE TESTS' : 'FAILED')) + '</div>';
    html += '<div class="tr-facts">';
    html += fact('WHEN', esc(run.at));
    html += fact('KIND', esc(run.kind) + (run.label ? ' &middot; ' + esc(run.label) : ''));
    html += fact('FRAMEWORK', n(run.framework));
    html += fact('CONFIG / POM', n(run.config) + ' / ' + n(run.pom));
    html += fact('TESTS', n(run.tests));
    html += fact('FAILURES', marked(run.failures, 'tr-fail'));
    html += fact('ERRORS', marked(run.errors, 'tr-fail'));
    html += fact('SKIPPED', n(run.skipped));
    html += fact('BLOCKED', marked(run.blocked, 'tr-blocked'));
    html += fact('SUSPECT', (run.suspectSteps === null || run.suspectSteps === undefined) ? '-' : '<span class="' + (run.suspectSteps ? 'tr-suspect' : '') + '">' + esc(run.suspectSteps) + ' steps &middot; ' + esc(run.suspectCases) + ' test cases &middot; ' + esc(run.suspectSuites) + ' suites</span>');
    html += fact('CHECKSTYLE', n(run.checkstyle));
    html += fact('TOTAL TIME', n(run.totalTime));
    html += '</div>';
    if (run.failed && run.failed.length) {
      html += '<ul class="tr-fails">';
      run.failed.forEach(function (f) {
        html += '<li class="tr-failed">' + esc(f.suite) + ' &middot; ' + esc(f.test) + ' (' + esc(f.kind) + ')<span class="tr-dim">' + esc(f.first) + '</span></li>';
      });
      html += '</ul>';
    }
    if (run.blockedTests && run.blockedTests.length) {
      html += '<ul class="tr-fails">';
      run.blockedTests.forEach(function (b) {
        html += '<li class="tr-blocked">BLOCKED &middot; ' + esc(b.test) + ' (' + esc(b.outcome) + ')<span class="tr-dim">' + esc(b.first) + '</span></li>';
      });
      html += '</ul>';
    }
    if (run.suspectTests && run.suspectTests.length) {
      html += '<ul class="tr-fails">';
      run.suspectTests.forEach(function (s) {
        html += '<li class="tr-suspect">SUSPECT &middot; ' + esc(s.suite) + ' &middot; ' + esc(s.test) + ' (' + esc(s.steps) + ' step' + (s.steps === 1 ? '' : 's') + ')<span class="tr-dim">' + esc(s.first) + '</span></li>';
      });
      html += '</ul>';
    }
    byId('tr-latest').innerHTML = html;
    byId('tr-latest-tag').textContent = runs.length + ' run' + (runs.length === 1 ? '' : 's') + ' recorded';
  }

  function renderSuites(runs) {
    var recent = runs.slice(-GRID_RUNS).reverse();
    var names = [];
    recent.forEach(function (run) {
      (run.suites || []).forEach(function (s) { if (names.indexOf(s.name) < 0) { names.push(s.name); } });
    });
    names.sort();
    if (!names.length) { byId('tr-suites').innerHTML = '<span class="tr-empty">No suite results yet.</span>'; return; }
    var html = '<table class="tr-table"><tr><th>SUITE</th>';
    recent.forEach(function (run) {
      html += '<th class="num" title="' + esc(run.at) + '">' + esc(String(run.at || '').slice(5, 16)) + '<br><span class="tr-dim">' + esc(run.kind) + '</span></th>';
    });
    html += '</tr>';
    names.forEach(function (name) {
      html += '<tr><td>' + esc(name) + '</td>';
      recent.forEach(function (run) {
        var s = (run.suites || []).filter(function (x) { return x.name === name; })[0];
        if (!s) { html += '<td class="num tr-cell-none">-</td>'; return; }
        var bad = (s.failures || 0) + (s.errors || 0);
        var title = s.tests + ' run, ' + s.failures + ' failed, ' + s.errors + ' errors, ' + s.skipped + ' skipped';
        html += '<td class="num' + (bad ? ' tr-cell-fail' : '') + '" title="' + esc(title) + '">' + esc(Number(s.seconds || 0).toFixed(1)) + (bad ? ' (' + bad + ')' : '') + '</td>';
      });
      html += '</tr>';
    });
    html += '</table>';
    byId('tr-suites').innerHTML = html;
  }

  function renderHistory(runs) {
    var html = '<table class="tr-table"><tr><th>WHEN</th><th>KIND</th><th>LABEL</th><th>FRAMEWORK</th><th class="num">TESTS</th><th class="num">FAIL</th><th class="num">ERR</th><th class="num">SKIP</th><th class="num">CHECKSTYLE</th><th class="num">TIME</th><th>VERDICT</th></tr>';
    runs.slice().reverse().forEach(function (run) {
      var ok = passed(run);
      html += '<tr><td>' + esc(run.at) + '</td><td>' + esc(run.kind) + '</td><td>' + esc(run.label) + '</td><td>' + n(run.framework) + '</td>';
      html += '<td class="num">' + n(run.tests) + '</td><td class="num' + (run.failures ? ' tr-fail' : '') + '">' + n(run.failures) + '</td><td class="num' + (run.errors ? ' tr-fail' : '') + '">' + n(run.errors) + '</td><td class="num">' + n(run.skipped) + '</td>';
      html += '<td class="num">' + n(run.checkstyle) + '</td><td class="num">' + n(run.totalTime) + '</td><td class="' + (ok ? 'tr-pass' : 'tr-fail') + '">' + (ok ? 'passed' : 'failed') + '</td></tr>';
    });
    html += '</table>';
    byId('tr-history').innerHTML = html;
    var good = runs.filter(passed).length;
    byId('tr-history-tag').textContent = good + ' of ' + runs.length + ' passed, newest first';
  }

  // Redraw only when the newest record changed, or when nothing is drawn yet
  function render(found) {
    if (!found && !window.MAI_RESULTS) {
      byId('tr-latest-tag').textContent = 'no _docs/_test_results/results-data.js yet: the framework writes it when a run finishes';
      return;
    }
    var runs = window.MAI_RESULTS || [];
    var sig = runs.length + ':' + (runs.length ? runs[runs.length - 1].epoch : 0);
    var drawn = document.querySelector('#tr-latest .tr-verdict');
    if (sig === lastSig && drawn) { return; }
    lastSig = sig;
    if (!runs.length) { byId('tr-latest-tag').textContent = 'no runs recorded yet'; return; }
    renderLatest(runs);
    renderSuites(runs);
    renderHistory(runs);
  }

  // Load a data file again: remove the last script tag, add a fresh one with a cache-busting query
  function reload(id, src, done) {
    var old = byId(id);
    if (old) { old.remove(); }
    var s = document.createElement('script');
    s.id = id;
    s.src = src + '?t=' + Date.now();
    s.onload = function () { done(true); };
    s.onerror = function () { done(false); };
    document.body.appendChild(s);
  }

  function loadData() { reload('tr-data', DATA, render); }

  // ===== The live run panel =====
  function clock(seconds) {
    var total = Math.max(0, Math.round(seconds || 0));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function renderLive() {
    var st = window.MAI_RUN_STATUS;
    var box = byId('tr-live');
    if (!st) { return; }
    var age = Math.round(Date.now() / 1000 - st.epoch);
    var html;
    if (st.state === 'running') {
      box.classList.add('tr-live');
      var pct = (st.total ? Math.round(100 * st.executing / st.total) : 0);
      html = '<div class="tr-verdict tr-running">RUNNING &middot; ' + esc(st.phase).toUpperCase() + '</div>';
      html += '<div class="tr-facts">';
      html += fact('LABEL', esc(st.label));
      html += fact('SUITE', n(st.suite));
      html += fact('TEST CASE', st.total ? esc(st.executing) + ' of ' + esc(st.total) + ' (' + pct + '%)' : '-');
      html += fact('ELAPSED', esc(clock(st.elapsedSeconds)));
      html += fact('FAILURES SO FAR', marked(st.failuresSoFar, 'tr-fail'));
      html += fact('ERRORS SO FAR', marked(st.errorsSoFar, 'tr-fail'));
      html += fact('BLOCKED SO FAR', marked(st.blockedSoFar, 'tr-blocked'));
      html += fact('SUSPECT SO FAR', marked(st.suspectSoFar, 'tr-suspect'));
      html += '</div>';
      if (st.testCase) { html += '<div class="tr-facts">' + fact('NOW', esc(st.testCase)) + '</div>'; }
      html += '<div class="tr-bar"><div class="tr-bar-fill" style="width:' + pct + '%"></div></div>';
      if (age > STALE_SECONDS) { html += '<div class="tr-facts tr-stale">No update for ' + age + ' seconds: the run may have stopped.</div>'; }
    } else {
      box.classList.remove('tr-live');
      var ok = st.state === 'finished';
      html = '<span class="' + (ok ? 'tr-pass' : 'tr-fail') + '">Last run ' + (ok ? 'finished' : 'finished with failures') + '</span> <span class="tr-dim">&middot; ' + esc(st.label) + ' &middot; ' + esc(st.updated) + ' &middot; ' + esc(clock(st.elapsedSeconds)) + '</span>';
    }
    box.innerHTML = html;
    byId('tr-live-tag').textContent = 'updated ' + st.updated;
  }

  function loadLive() { reload('tr-status', STATUS, renderLive); }

  function boot() {
    loadData();
    setInterval(loadData, DATA_EVERY);
    loadLive();
    setInterval(loadLive, STATUS_EVERY);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();