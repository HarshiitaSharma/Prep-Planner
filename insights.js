// Read-only "Insights" card built from the data script.js keeps in localStorage.
(() => {
  const anchor = document.getElementById('exportBtn')?.closest('section');
  if (!anchor) return;
  const card = document.createElement('section');
  card.className = 'card';
  anchor.before(card);

  const pad = (n) => String(n).padStart(2, '0');
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hm = (m) => `${Math.floor(m / 60)}h ${pad(Math.round(m % 60))}m`;

  function render() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem('prep-state-v1')) || {}; } catch {}
    const study = s.study || {}, mocks = [...(s.mocks || [])].sort((a, b) => a.date.localeCompare(b.date));
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return key(d); });
    const week = days.reduce((t, k) => t + (study[k] || 0), 0);
    const hit = days.filter(k => (study[k] || 0) >= (s.target || 4) * 60).length;
    const best = Object.entries(study).sort((a, b) => b[1] - a[1])[0];

    const pct = (m) => (m.max > 0 ? m.score / m.max * 100 : 0);
    let trend = '—', cls = '';
    if (mocks.length >= 4) {
      const avg = (a) => a.reduce((t, m) => t + pct(m), 0) / a.length;
      const last = mocks.slice(-3), prev = mocks.slice(-6, -3);
      const delta = avg(last) - avg(prev);
      trend = `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)} pts`;
      cls = delta >= 0 ? 'up' : 'down';
    }
    const weakest = (s.subjects || []).filter(x => x.topics.length)
      .map(x => ({ n: x.name, p: x.topics.filter(t => t.done).length / x.topics.length }))
      .sort((a, b) => a.p - b.p)[0];

    const rows = [
      ['Studied, last 7 days', hm(week)],
      ['Daily average', hm(week / 7)],
      ['Target days hit (of 7)', String(hit)],
      ['Longest single day', best ? hm(best[1]) : '—'],
      ['Mock trend (last 3 vs prev 3)', `<span class="${cls}">${trend}</span>`],
      ['Least-covered subject', weakest ? `${weakest.n.replace(/</g, '&lt;')} (${Math.round(weakest.p * 100)}%)` : '—'],
    ];
    card.innerHTML = `<div class="card-head"><h2>Insights</h2></div><div class="ins-grid">` +
      rows.map(([l, v]) => `<div class="ins"><b>${v}</b><span>${l}</span></div>`).join('') + '</div>';
  }
  // script.js saves on every change; refresh right after any interaction.
  ['click', 'change', 'input'].forEach(ev => document.addEventListener(ev, () => setTimeout(render, 50)));
  render();
})();
