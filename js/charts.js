/* charts.js — pembungkus Chart.js */
const Charts = {
  inst: {},
  fmt: v => v >= 1e6 ? (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt' : v >= 1e3 ? (v / 1e3) + ' rb' : v,
  month: k => { const [y, m] = k.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }); },

  bars(id, labels, vals, targets) {
    const el = $(id), box = el.parentElement;
    if (typeof Chart === 'undefined') { el.style.display = 'none'; box.dataset.msg = 'Grafik belum bisa dimuat. Pastikan js/vendor/chart.umd.js ada, atau hubungkan perangkat ke internet.'; return; }
    el.style.display = ''; delete box.dataset.msg;
    const tl = Array.isArray(targets) ? targets : labels.map(() => targets);
    if (this.inst[id]) this.inst[id].destroy();
    this.inst[id] = new Chart(el, {
      type: 'bar',
      data: { labels, datasets: [
        { type: 'bar', label: 'Omzet', data: vals, backgroundColor: vals.map((v, i) => tl[i] > 0 && v >= tl[i] ? '#15803d' : '#86efac'), borderRadius: 6, maxBarThickness: 38, order: 2 },
        { type: 'line', label: 'Target', data: tl, borderColor: '#d97706', borderDash: [6, 5], borderWidth: 2, pointRadius: 0, order: 1 }
      ] },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 10 } },
          tooltip: { callbacks: { label: c => ' ' + c.dataset.label + ': ' + U.rp(c.parsed.y) } } },
        scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
          y: { beginAtZero: true, grid: { color: '#eef2ef' }, ticks: { callback: v => Charts.fmt(v) } } }
      }
    });
  }
};
