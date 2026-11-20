/* storage.js — penyimpanan LocalStorage + fungsi bantu umum (U) */
const $ = id => document.getElementById(id);

const ICONS = {
  home:'<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cash:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M14.5 9.2a2.6 2.2 0 0 0-2.5-1.4c-1.4 0-2.5.7-2.5 1.9s1 1.6 2.5 2 2.5.8 2.5 2-1.1 1.9-2.5 1.9a2.7 2.2 0 0 1-2.6-1.4M12 6v1.8M12 16.2V18"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.4-3.4 3-5.5 6.5-5.5s6.1 2.1 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.9.7 3 2.4 3.2 5.2"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trend:'<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  down:'<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  up:'<path d="M12 15V4m0 0L8 8m4-4 4 4M5 20h14"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  truck:'<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  check:'<polyline points="20 6 9 17 4 12"/>',
  bag:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'
};

const U = {
  icon: n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`,
  rp: n => 'Rp' + Math.round(n || 0).toLocaleString('id-ID'),
  pct: n => (Math.round(n * 100) / 100).toLocaleString('id-ID') + '%',
  iso: d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
  today: () => U.iso(new Date()),                       // tanggal lokal, bukan UTC
  parse: s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  dmy: s => U.parse(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
  addDays: (s, n) => { const d = U.parse(s); d.setDate(d.getDate() + n); return U.iso(d); },
  esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
  toast(msg, type) {
    const e = $('toast'); e.textContent = msg; e.className = 'show ' + (type || '');
    clearTimeout(U._t); U._t = setTimeout(() => { e.className = ''; }, 3400);
  },
  download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
};

const Store = (() => {
  const KEY = 'gm_data_v1';
  let db;
  // Nama karyawan awal
  const seedEmployees = () => [
    { id: U.uid(), name: 'Dapur 1', role: 'Dapur', group: 'A', active: true },
    { id: U.uid(), name: 'Dapur 2', role: 'Dapur', group: 'A', active: true },
    { id: U.uid(), name: 'Dapur 3', role: 'Dapur', group: 'A', active: true },
    { id: U.uid(), name: 'Dapur 4', role: 'Dapur', group: 'A', active: true },
    { id: U.uid(), name: 'Packing 1', role: 'Packing', group: 'A', active: true },
    { id: U.uid(), name: 'Packing 2', role: 'Packing', group: 'A', active: true },
    { id: U.uid(), name: 'Kurir A', role: 'Kurir', group: 'A', active: true },
    { id: U.uid(), name: 'Kurir B', role: 'Kurir', group: 'A', active: true },
    { id: U.uid(), name: 'Admin Media Sosial', role: 'Admin Media Sosial', group: 'A', active: true }
  ];

  const fresh = () => ({
    version: 2,
    settings: {
      target: 6000000,
      courierBaseSalary: 0 // Mendukung gaji pokok kurir di masa depan melalui pengaturan
    },
    sales: [],
    employees: seedEmployees(),
    locks: [],
    orders: [] // Daftar transaksi/pesanan pengantaran kurir
  });

  const norm = o => ({
    version: 2,
    settings: {
      target: Number(o && o.settings && o.settings.target) > 0 ? Number(o.settings.target) : 6000000,
      courierBaseSalary: Number(o && o.settings && o.settings.courierBaseSalary) >= 0 ? Number(o.settings.courierBaseSalary) : 0
    },
    sales: Array.isArray(o && o.sales) ? o.sales : [],
    employees: Array.isArray(o && o.employees) ? o.employees : seedEmployees(),
    locks: Array.isArray(o && o.locks) ? o.locks : [],
    orders: Array.isArray(o && o.orders) ? o.orders : []
  });

  function save() { localStorage.setItem(KEY, JSON.stringify(db)); }
  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) { db = fresh(); save(); return; }
    try { db = norm(JSON.parse(raw)); }
    catch (e) { localStorage.setItem(KEY + '_rusak', raw); db = fresh(); save(); }
  }

  const valid = o => !!o && Array.isArray(o.sales) && Array.isArray(o.employees) &&
    o.sales.every(s => /^\d{4}-\d{2}-\d{2}$/.test(s.date) && Number(s.omzet) >= 0) &&
    o.employees.every(e => ['A', 'B', 'C'].includes(e.group)) &&
    (o.locks === undefined || Array.isArray(o.locks)) &&
    (o.orders === undefined || Array.isArray(o.orders));

  return { load, save, valid, get: () => db, replace(o) { db = norm(o); save(); } };
})();
