// Adds CSV downloads for mock tests and the study log next to the JSON backup.
(() => {
  const row = document.querySelector('.backup-row');
  if (!row) return;
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const state = () => { try { return JSON.parse(localStorage.getItem('prep-state-v1')) || {}; } catch { return {}; } };
  const download = (name, rows) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(cell).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
  };
  const add = (label, fn) => {
    const b = document.createElement('button');
    b.className = 'btn ghost'; b.textContent = label; b.addEventListener('click', fn); row.appendChild(b);
  };
  add('Mocks CSV', () => download('mocks.csv', [['date', 'name', 'score', 'max', 'percent'],
    ...(state().mocks || []).sort((a, b) => a.date.localeCompare(b.date))
      .map(m => [m.date, m.name, m.score, m.max, (m.score / m.max * 100).toFixed(1)])]));
  add('Study CSV', () => download('study-log.csv', [['date', 'minutes'],
    ...Object.entries(state().study || {}).sort().map(([d, m]) => [d, m])]));
})();
