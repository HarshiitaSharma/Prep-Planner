// Spaced-repetition reminders: revise each finished topic 1, 3, 7 and 21 days later.
// Completion is detected from the topic bubbles in the DOM; data lives in its own
// localStorage key, so script.js and its data format are untouched.
(() => {
  const KEY = 'prep-revisions-v1';
  const GAPS = [1, 3, 7, 21];
  const list = document.getElementById('subjectList');
  const hero = document.querySelector('.hero');
  if (!list || !hero) return;

  const card = document.createElement('section');
  card.className = 'card';
  hero.after(card);

  const pad = (n) => String(n).padStart(2, '0');
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => key(new Date());
  const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d); };
  const diff = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
  const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };
  const dueOn = (r) => addDays(r.last, GAPS[r.stage]);

  // Record a topic the moment it is ticked off (capture runs before script.js re-renders).
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act="toggle"]');
    if (!btn || btn.classList.contains('done')) return;
    const topic = btn.closest('.topic'), subj = btn.closest('.subject');
    if (!topic || !subj) return;
    const items = load();
    items[topic.dataset.tid] = {
      text: topic.querySelector('.t-text').textContent,
      subject: subj.querySelector('.s-name').textContent,
      last: today(), stage: 0,
    };
    save(items);
  }, true);

  // Drop reminders for topics that were un-ticked or deleted.
  function prune() {
    const items = load(); let changed = false;
    for (const id of Object.keys(items)) {
      const b = list.querySelector(`[data-tid="${id}"] .bubble`);
      if (!b || !b.classList.contains('done')) { delete items[id]; changed = true; }
    }
    if (changed) save(items);
  }

  function render() {
    const items = load(), t = today();
    const all = Object.entries(items).map(([id, r]) => ({ id, ...r, due: dueOn(r) }));
    const due = all.filter(r => r.due <= t).sort((a, b) => a.due.localeCompare(b.due));
    const soon = all.length - due.length;
    card.style.display = all.length ? '' : 'none';
    card.innerHTML = `
      <div class="card-head"><h2>Revise today</h2>
        <span class="muted">${due.length} due · ${soon} upcoming</span></div>
      ${due.length ? due.map(r => {
        const late = diff(t, r.due);
        return `<div class="rev-item"><div class="r-main"><span>${esc(r.text)}</span>
          <span class="r-sub">${esc(r.subject)} · revision ${r.stage + 1} of ${GAPS.length}
          ${late > 0 ? `<span class="r-late"> · ${late}d late</span>` : ''}</span></div>
          <button class="btn ghost" data-rev="${r.id}">Revised ✓</button></div>`;
      }).join('') : '<p class="muted">Nothing due. Finished topics will show up here when it is time to revise them.</p>'}`;
  }

  card.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rev]');
    if (!b) return;
    const items = load(), r = items[b.dataset.rev];
    if (!r) return;
    r.stage += 1; r.last = today();
    if (r.stage >= GAPS.length) delete items[b.dataset.rev];
    save(items); render();
  });

  new MutationObserver(() => { prune(); render(); }).observe(list, { childList: true });
  prune(); render();
})();
