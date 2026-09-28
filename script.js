(() => {
  const KEY = 'prep-state-v1';
  const $ = (id) => document.getElementById(id);
  const uid = () => Math.random().toString(36).slice(2, 9);

  // ---------- State ----------
  const blank = () => ({
    exam: { name: '', date: '' },
    subjects: [],          // { id, name, topics: [{ id, text, done }] }
    study: {},             // { 'YYYY-MM-DD': minutes }
    target: 4,             // hours per day
    mocks: [],             // { id, name, date, score, max }
  });

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      return raw ? { ...blank(), ...raw } : blank();
    } catch { return blank(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }

  let state = load();
  const openSubjects = new Set(state.subjects.map(s => s.id));

  // ---------- Helpers ----------
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => dateKey(new Date());

  function parseKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function daysUntil(key) {
    const t = parseKey(todayKey());
    return Math.round((parseKey(key) - t) / 86400000);
  }
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
  function fmtMinutes(min) {
    const m = Math.max(0, Math.round(min));
    return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
  }
  function el(tag, attrs = {}, text) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // ---------- Hero / countdown ----------
  function totals() {
    let done = 0, all = 0;
    state.subjects.forEach(s => s.topics.forEach(t => { all++; if (t.done) done++; }));
    return { done, all };
  }

  function renderHero() {
    const { done, all } = totals();
    const pct = all ? Math.round((done / all) * 100) : 0;
    $('overallPct').textContent = `${pct}%`;
    $('topicTally').textContent = `${done} / ${all} topics`;

    const numEl = $('daysNum');
    const wordEl = $('daysWord');
    const noteEl = $('paceNote');
    const paceEl = $('paceNum');

    if (!state.exam.date) {
      numEl.textContent = '—';
      wordEl.textContent = 'days to go';
      paceEl.textContent = '—';
      noteEl.textContent = 'Set your exam date and add subjects to see the pace you need.';
      return;
    }

    const left = daysUntil(state.exam.date);
    if (left < 0) {
      numEl.textContent = '0';
      wordEl.textContent = 'exam date has passed';
      paceEl.textContent = '—';
      noteEl.textContent = 'This exam date is in the past. Update the date to plan the next attempt.';
      return;
    }
    numEl.textContent = String(left);
    wordEl.textContent = left === 1 ? 'day to go' : 'days to go';

    const remaining = all - done;
    if (!all) {
      paceEl.textContent = '—';
      noteEl.textContent = 'Add subjects and topics to calculate your weekly pace.';
      return;
    }
    if (!remaining) {
      paceEl.textContent = '0';
      noteEl.textContent = 'Every topic is covered. Use the remaining time for revision and mock tests.';
      return;
    }

    // keep the last two weeks (or 20% of the time, whichever is smaller) for revision
    const buffer = left > 14 ? Math.min(14, Math.floor(left * 0.2)) : 0;
    const studyDays = Math.max(left - buffer, 1);
    const perWeek = remaining / (studyDays / 7);
    paceEl.textContent = perWeek < 10 ? perWeek.toFixed(1) : String(Math.ceil(perWeek));
    noteEl.textContent = buffer
      ? `${remaining} topics left across ${studyDays} study days, with the final ${buffer} days kept for revision.`
      : `${remaining} topics left and only ${left} days remaining. Prioritise the high-weightage ones first.`;
  }

  $('examName').addEventListener('input', (e) => { state.exam.name = e.target.value; save(); });
  $('examDate').addEventListener('change', (e) => { state.exam.date = e.target.value; save(); renderHero(); });

  // ---------- Syllabus ----------
  function renderSubjects() {
    const list = $('subjectList');
    $('subjectEmpty').style.display = state.subjects.length ? 'none' : 'block';

    list.innerHTML = state.subjects.map(s => {
      const done = s.topics.filter(t => t.done).length;
      const pct = s.topics.length ? Math.round((done / s.topics.length) * 100) : 0;
      const topicsHtml = s.topics.map(t => `
        <li class="topic ${t.done ? 'done' : ''}" data-tid="${t.id}">
          <button class="bubble ${t.done ? 'done' : ''}" data-act="toggle" aria-label="Mark ${escapeHtml(t.text)} ${t.done ? 'not done' : 'done'}" aria-pressed="${t.done}"></button>
          <span class="t-text">${escapeHtml(t.text)}</span>
          <button class="x-btn" data-act="del-topic" aria-label="Delete topic">×</button>
        </li>`).join('');

      return `
        <details class="subject" data-sid="${s.id}" ${openSubjects.has(s.id) ? 'open' : ''}>
          <summary>
            <span class="s-name">${escapeHtml(s.name)}</span>
            <span class="meter"><i style="width:${pct}%"></i></span>
            <span class="s-frac">${done}/${s.topics.length}</span>
          </summary>
          <div class="subject-body">
            <ul class="topics">${topicsHtml || '<li class="muted" style="padding:8px 0">No topics yet.</li>'}</ul>
            <div class="add-topic">
              <input type="text" placeholder="Add topics (comma-separated)" maxlength="300">
              <button class="btn" data-act="add-topic">Add</button>
            </div>
            <button class="remove-subject" data-act="del-subject">Remove subject</button>
          </div>
        </details>`;
    }).join('');
  }

  function addSubject(name) {
    const clean = name.trim();
    if (!clean) return;
    if (state.subjects.some(s => s.name.toLowerCase() === clean.toLowerCase())) return;
    const subject = { id: uid(), name: clean, topics: [] };
    state.subjects.push(subject);
    openSubjects.add(subject.id);
  }

  $('addSubjectBtn').addEventListener('click', () => {
    addSubject($('subjectInput').value);
    $('subjectInput').value = '';
    save(); renderSubjects(); renderHero();
  });
  $('subjectInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('addSubjectBtn').click();
  });

  $('templates').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tpl]');
    if (!btn) return;
    btn.dataset.tpl.split(',').forEach(addSubject);
    save(); renderSubjects(); renderHero();
  });

  const subjectList = $('subjectList');

  subjectList.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.dataset || !d.dataset.sid) return;
    if (d.open) openSubjects.add(d.dataset.sid); else openSubjects.delete(d.dataset.sid);
  }, true);

  function addTopicsFrom(subjectEl) {
    const sid = subjectEl.dataset.sid;
    const input = subjectEl.querySelector('.add-topic input');
    const subject = state.subjects.find(s => s.id === sid);
    const names = input.value.split(',').map(t => t.trim()).filter(Boolean);
    if (!subject || !names.length) return;
    names.forEach(text => subject.topics.push({ id: uid(), text, done: false }));
    save(); renderSubjects(); renderHero();
    const again = subjectList.querySelector(`[data-sid="${sid}"] .add-topic input`);
    if (again) again.focus();
  }

  subjectList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const subjectEl = btn.closest('.subject');
    const subject = state.subjects.find(s => s.id === subjectEl.dataset.sid);
    if (!subject) return;
    const act = btn.dataset.act;

    if (act === 'toggle') {
      const topic = subject.topics.find(t => t.id === btn.closest('.topic').dataset.tid);
      if (topic) topic.done = !topic.done;
    } else if (act === 'del-topic') {
      const tid = btn.closest('.topic').dataset.tid;
      subject.topics = subject.topics.filter(t => t.id !== tid);
    } else if (act === 'add-topic') {
      addTopicsFrom(subjectEl);
      return;
    } else if (act === 'del-subject') {
      if (!confirm(`Remove "${subject.name}" and its ${subject.topics.length} topics?`)) return;
      state.subjects = state.subjects.filter(s => s.id !== subject.id);
    }
    save(); renderSubjects(); renderHero();
  });

  subjectList.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('.add-topic input')) {
      addTopicsFrom(e.target.closest('.subject'));
    }
  });

  // ---------- Study log ----------
  function streak() {
    let count = 0;
    const d = new Date();
    if (!(state.study[dateKey(d)] > 0)) d.setDate(d.getDate() - 1); // today may not be logged yet
    while (state.study[dateKey(d)] > 0) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  function renderStudy() {
    const today = state.study[todayKey()] || 0;
    const targetMin = state.target * 60;
    $('todayTime').textContent = fmtMinutes(today);
    $('todayMeter').style.width = `${Math.min(100, (today / targetMin) * 100)}%`;
    const s = streak();
    $('streakLabel').textContent = `streak: ${s} day${s === 1 ? '' : 's'}`;
    $('targetInput').value = state.target;
    drawStudyChart(targetMin);
  }

  function drawStudyChart(targetMin) {
    const svg = $('studyChart');
    svg.innerHTML = '';
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ key: dateKey(d), label: d.getDate(), min: state.study[dateKey(d)] || 0 });
    }
    const W = 560, H = 150, padL = 30, padB = 20, padT = 10;
    const maxMin = Math.max(targetMin, ...days.map(d => d.min), 60) * 1.1;
    const bw = (W - padL) / days.length;
    const y = (m) => padT + (H - padT - padB) * (1 - m / maxMin);

    svg.appendChild(el('line', { x1: padL, x2: W, y1: y(0), y2: y(0), stroke: '#D3DBEC', 'stroke-width': 1.5 }));
    svg.appendChild(el('line', { x1: padL, x2: W, y1: y(targetMin), y2: y(targetMin), stroke: '#D9363E', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    svg.appendChild(el('text', { x: 0, y: y(targetMin) + 3 }, `${state.target}h`));

    days.forEach((d, i) => {
      const x = padL + i * bw + bw * 0.18;
      const h = y(0) - y(d.min);
      const hit = d.min >= targetMin;
      svg.appendChild(el('rect', {
        x, y: y(d.min), width: bw * 0.64, height: Math.max(h, d.min ? 2 : 0),
        rx: 2, fill: hit ? '#2E9E6B' : '#1B2559',
      }));
      svg.appendChild(el('text', { x: x + bw * 0.32, y: H - 5, 'text-anchor': 'middle' }, String(d.label)));
    });
  }

  document.querySelector('.quick-add').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const key = todayKey();
    state.study[key] = Math.max(0, (state.study[key] || 0) + Number(btn.dataset.add));
    save(); renderStudy();
  });

  $('targetInput').addEventListener('change', (e) => {
    const v = Number(e.target.value);
    state.target = v > 0 ? Math.min(16, v) : 4;
    save(); renderStudy();
  });

  // ---------- Mock tests ----------
  function renderMocks() {
    const mocks = [...state.mocks].sort((a, b) => a.date.localeCompare(b.date));
    const pct = (m) => (m.max > 0 ? (m.score / m.max) * 100 : 0);

    if (mocks.length) {
      const avg = mocks.reduce((s, m) => s + pct(m), 0) / mocks.length;
      const best = Math.max(...mocks.map(pct));
      $('mockSummary').textContent = `avg ${avg.toFixed(1)}% · best ${best.toFixed(1)}%`;
    } else {
      $('mockSummary').textContent = 'no tests yet';
    }

    $('mockList').innerHTML = [...mocks].reverse().map(m => `
      <li class="mock-item" data-mid="${m.id}">
        <span class="m-name">${escapeHtml(m.name)}</span>
        <span class="m-date">${escapeHtml(m.date)}</span>
        <span class="m-score">${m.score}/${m.max}</span>
        <span class="m-pct">${pct(m).toFixed(1)}%</span>
        <button class="x-btn" style="opacity:1" data-act="del-mock" aria-label="Delete test">×</button>
      </li>`).join('');

    drawMockChart(mocks, pct);
  }

  function drawMockChart(mocks, pct) {
    const svg = $('mockChart');
    svg.innerHTML = '';
    const W = 560, H = 170, padL = 34, padR = 12, padT = 12, padB = 22;
    const y = (v) => padT + (H - padT - padB) * (1 - v / 100);

    [0, 25, 50, 75, 100].forEach(v => {
      svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), stroke: '#DDE5F3', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: 0, y: y(v) + 3 }, `${v}%`));
    });

    if (!mocks.length) {
      svg.appendChild(el('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle' }, 'Log a mock test to see your trend'));
      return;
    }

    const step = mocks.length > 1 ? (W - padL - padR) / (mocks.length - 1) : 0;
    const pts = mocks.map((m, i) => ({
      x: mocks.length > 1 ? padL + i * step : (padL + W - padR) / 2,
      y: y(Math.min(100, pct(m))),
      m,
    }));

    if (pts.length > 1) {
      svg.appendChild(el('polyline', {
        points: pts.map(p => `${p.x},${p.y}`).join(' '),
        fill: 'none', stroke: '#1B2559', 'stroke-width': 2.5, 'stroke-linejoin': 'round',
      }));
    }
    pts.forEach(p => {
      const c = el('circle', { cx: p.x, cy: p.y, r: 5.5, fill: '#FFE45C', stroke: '#1B2559', 'stroke-width': 2 });
      const t = el('title', {});
      t.textContent = `${p.m.name}: ${p.m.score}/${p.m.max} (${pct(p.m).toFixed(1)}%)`;
      c.appendChild(t);
      svg.appendChild(c);
    });
  }

  $('addMockBtn').addEventListener('click', () => {
    const name = $('mockName').value.trim() || `Mock ${state.mocks.length + 1}`;
    const date = $('mockDate').value || todayKey();
    const score = parseFloat($('mockScore').value);
    const max = parseFloat($('mockMax').value);
    if (Number.isNaN(score) || Number.isNaN(max) || max <= 0) { $('mockScore').focus(); return; }
    state.mocks.push({ id: uid(), name, date, score, max });
    $('mockName').value = '';
    $('mockScore').value = '';
    save(); renderMocks();
  });

  $('mockList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act="del-mock"]');
    if (!btn) return;
    const id = btn.closest('.mock-item').dataset.mid;
    state.mocks = state.mocks.filter(m => m.id !== id);
    save(); renderMocks();
  });

  // ---------- Backup ----------
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `prep-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.subjects) || !Array.isArray(data.mocks)) throw new Error('bad file');
      if (!confirm('Replace your current data with this backup?')) return;
      state = { ...blank(), ...data };
      save();
      openSubjects.clear();
      state.subjects.forEach(s => openSubjects.add(s.id));
      init();
    } catch {
      alert('That file does not look like a Prep backup.');
    } finally {
      e.target.value = '';
    }
  });

  // ---------- Init ----------
  function init() {
    $('examName').value = state.exam.name;
    $('examDate').value = state.exam.date;
    $('mockDate').value = todayKey();
    renderHero();
    renderSubjects();
    renderStudy();
    renderMocks();
  }
  init();
})();
