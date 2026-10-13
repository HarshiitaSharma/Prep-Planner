// Focus timer. Finished focus sessions are logged through the existing
// quick-add handler in script.js, so the study log, streak and chart update.
(() => {
  const host = document.getElementById('studyChart')?.closest('section');
  if (!host) return;
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-head"><h2>Focus timer</h2><span class="muted" id="pomoMode">focus</span></div>
    <div class="pomo-row">
      <div class="pomo-time" id="pomoTime">25:00</div>
      <div class="pomo-btns"><button class="btn" id="pomoStart">Start</button><button class="btn ghost" id="pomoReset">Reset</button></div>
    </div>
    <div class="pomo-set">
      <label>Focus (min)<input type="number" id="pomoFocus" min="5" max="120" value="25"></label>
      <label>Break (min)<input type="number" id="pomoBreak" min="1" max="60" value="5"></label>
    </div>
    <p class="muted">Each finished focus session is added to your study log automatically.</p>`;
  host.after(card);

  const $ = (id) => document.getElementById(id);
  const baseTitle = document.title;
  let mode = 'focus', running = false, endAt = 0, remaining = 0, timer = null;
  const mins = (id, d) => Math.min(120, Math.max(1, Number($(id).value) || d));
  const total = () => (mode === 'focus' ? mins('pomoFocus', 25) : mins('pomoBreak', 5)) * 60;
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  function show() {
    const s = Math.max(0, Math.ceil(remaining));
    $('pomoTime').textContent = fmt(s);
    $('pomoTime').classList.toggle('is-break', mode === 'break');
    $('pomoMode').textContent = mode;
    $('pomoStart').textContent = running ? 'Pause' : 'Start';
    document.title = running ? `${fmt(s)} · ${mode}` : baseTitle;
  }

  function logMinutes(m) {
    const q = document.querySelector('.quick-add');
    if (!q) return;
    const b = document.createElement('button');
    b.dataset.add = String(m);
    b.hidden = true;
    q.appendChild(b); b.click(); b.remove();
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); o.frequency.value = 880; o.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  function tick() {
    remaining = (endAt - Date.now()) / 1000;
    if (remaining <= 0) {
      clearInterval(timer); running = false;
      if (mode === 'focus') logMinutes(mins('pomoFocus', 25));
      beep();
      mode = mode === 'focus' ? 'break' : 'focus';
      remaining = total();
    }
    show();
  }

  $('pomoStart').addEventListener('click', () => {
    if (running) { clearInterval(timer); running = false; show(); return; }
    endAt = Date.now() + remaining * 1000; running = true;
    timer = setInterval(tick, 250); show();
  });
  $('pomoReset').addEventListener('click', () => {
    clearInterval(timer); running = false; mode = 'focus'; remaining = total(); show();
  });
  ['pomoFocus', 'pomoBreak'].forEach(id => $(id).addEventListener('change', () => {
    if (!running) { remaining = total(); show(); }
  }));
  remaining = total(); show();
})();
