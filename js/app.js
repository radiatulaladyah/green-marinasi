/* app.js — router, Beranda, Upah Harian (kunci riwayat), Cadangan data */
const NAV = [
  ['dashboard', 'Beranda', 'home'],
  ['sales', 'Omzet', 'cash'],
  ['courier', 'Kurir', 'truck'],
  ['wage', 'Upah', 'coin'],
  ['employees', 'Karyawan', 'users'],
  ['reports', 'Laporan', 'chart']
];

const Wage = {
  init() {
    $('w-date').value = U.today();
    $('w-date').addEventListener('change', () => this.render());
    $('w-act').addEventListener('click', () => { const d = $('w-date').value; this.lockOf(d) ? this.unlock(d) : this.lock(d); });
    $('w-hist').addEventListener('click', e => { const b = e.target.closest('button[data-d]'); if (b) { $('w-date').value = b.dataset.d; this.render(); scrollTo({ top: 0, behavior: 'smooth' }); } });
  },
  lockOf: d => Store.get().locks.find(l => l.date === d),
  live(d) {
    const s = Sales.byDate(d); if (!s) return null;
    const db = Store.get(), T = db.settings.target;
    // Kurir tidak mendapatkan upah berdasarkan omzet (sesuai aturan nomor 1 & revisi), kurir mendapatkan ongkir
    const nonCourierActive = db.employees.filter(e => e.active && !(e.role || '').toLowerCase().includes('kurir'));
    const rows = Salary.rows(nonCourierActive, s.omzet, T);
    return { date: d, omzet: s.omzet, target: T, pct: Salary.percent(s.omzet, T), rows, total: Salary.total(rows) };
  },
  forDate(d) { return this.lockOf(d) || this.live(d); },       // snapshot terkunci selalu menang
  lock(d) {
    const x = this.live(d);
    if (!x) return U.toast('Belum ada omzet pada tanggal ini.', 'err');
    if (!x.rows.length) return U.toast('Tidak ada karyawan aktif untuk dihitung.', 'err');
    const db = Store.get(); db.locks = db.locks.filter(l => l.date !== d);
    db.locks.push({ ...x, table: JSON.parse(JSON.stringify(Salary.TABLE)), lockedAt: new Date().toISOString() });
    Store.save(); U.toast('Perhitungan upah dikunci.'); this.render();
  },
  unlock(d) {
    if (!confirm(`Buka kunci upah ${U.dmy(d)}?\n\nAngka akan dihitung ulang dari omzet dan data karyawan saat ini.`)) return;
    const db = Store.get(); db.locks = db.locks.filter(l => l.date !== d); Store.save(); U.toast('Kunci dibuka.'); this.render();
  },
  render() {
    const d = $('w-date').value || U.today(), x = this.forDate(d), lk = this.lockOf(d), s = Sales.byDate(d);
    const act = $('w-act'), k = (l, v, sub) => `<div class="card kpi"><div class="lbl">${l}</div><div class="v">${v}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
    if (!x) {
      $('w-sum').innerHTML = ''; $('w-table').innerHTML = ''; act.hidden = true;
      $('w-banner').innerHTML = `<div class="note">Belum ada omzet pada ${U.dmy(d)}. Catat dulu di menu <a href="#sales">Omzet</a>.</div>`;
    } else {
      $('w-sum').innerHTML = k('Omzet Makanan', U.rp(x.omzet)) + k('Pencapaian', U.pct(x.pct), Salary.status(x.pct).label) + k('Total Upah Karyawan', U.rp(x.total), x.rows.length + ' staf (Dapur/Packing/Admin)');
      const diff = lk && s && s.omzet !== lk.omzet ? ` Omzet tercatat sekarang ${U.rp(s.omzet)}, berbeda dari yang dikunci.` : '';
      $('w-banner').innerHTML = lk
        ? `<div class="note lock">${U.icon('lock')}<span>Terkunci ${new Date(lk.lockedAt).toLocaleString('id-ID')}. Perubahan omzet atau data karyawan tidak memengaruhi angka ini.${diff}</span></div>`
        : '<div class="note"><span>Estimasi upah karyawan operasional non-kurir (Dapur, Packing, Admin). Hak kurir dihitung dari ongkir di menu Kurir.</span></div>';
      act.hidden = false; act.className = 'btn' + (lk ? ' ghost' : ''); act.innerHTML = U.icon('lock') + (lk ? 'Buka kunci' : 'Kunci perhitungan');
      $('w-table').innerHTML = '<thead><tr><th>Nama</th><th>Bagian</th><th>Kelompok</th><th class="n">Upah</th></tr></thead><tbody>' +
        (x.rows.map(r => `<tr><td>${U.esc(r.name)}</td><td>${U.esc(r.role)}</td><td>${r.group}</td><td class="n">${U.rp(r.wage)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">Tidak ada karyawan non-kurir aktif.</td></tr>') +
        `</tbody><tfoot><tr><td colspan="3">Total estimasi upah</td><td class="n">${U.rp(x.total)}</td></tr></tfoot>`;
    }
    const locks = [...Store.get().locks].sort((a, b) => b.date.localeCompare(a.date));
    $('w-hist').innerHTML = locks.length
      ? '<table><thead><tr><th>Tanggal</th><th class="n">Omzet</th><th class="n">Capaian</th><th class="n">Karyawan</th><th class="n">Total upah</th><th></th></tr></thead><tbody>' +
        locks.map(l => `<tr><td>${U.dmy(l.date)}</td><td class="n">${U.rp(l.omzet)}</td><td class="n">${U.pct(l.pct)}</td><td class="n">${l.rows.length}</td><td class="n">${U.rp(l.total)}</td><td><button class="btn ghost sm" data-d="${l.date}">Lihat</button></td></tr>`).join('') + '</tbody></table>'
      : '<div class="empty">Belum ada upah yang dikunci.</div>';
  }
};

const Dash = {
  r: '7',
  init() { $('d-seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { this.r = b.dataset.r; this.render(); } }); },
  render() {
    const db = Store.get(), T = db.settings.target, today = U.today(), s = Sales.byDate(today), all = db.sales;
    $('d-date').textContent = U.parse(today).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const pct = s ? Salary.percent(s.omzet, T) : 0, st = Salary.status(pct), diff = s ? s.omzet - T : 0, w = s ? Wage.forDate(today) : null;
    
    // HERO: OMZET PENJUALAN GREEN MARINASI
    $('d-hero').innerHTML = s
      ? `<div><span class="lbl">Omzet Penjualan Makanan Hari Ini</span><div class="big">${U.rp(s.omzet)}</div><span class="chip ${st.key}">${st.label}</span></div>
         <div><div class="pb"><i style="width:${Math.min(pct, 100)}%"></i></div><div class="split"><span>${U.pct(pct)} dari target ${U.rp(T)}</span><span>${diff >= 0 ? 'Lebih' : 'Kurang'} ${U.rp(Math.abs(diff))}</span></div></div>`
      : `<div><span class="lbl">Omzet Penjualan Makanan Hari Ini</span><div class="big">Belum dicatat</div><a class="btn" href="#sales" style="background:#fff;color:var(--g900)">Catat omzet hari ini</a></div>
         <div><div class="pb"><i style="width:0"></i></div><div class="split"><span>0% dari target ${U.rp(T)}</span></div></div>`;

    // Data Penjualan Green Marinasi
    const month = all.filter(x => x.date.startsWith(today.slice(0, 7))), mt = month.reduce((a, x) => a + x.omzet, 0), sum = all.reduce((a, x) => a + x.omzet, 0);
    const best = all.reduce((b, x) => !b || x.omzet > b.omzet ? x : b, null);
    
    // A. KPIS PENJUALAN GREEN MARINASI
    const k = (ic, l, v, sub) => `<div class="card kpi"><div class="lbl">${U.icon(ic)}${l}</div><div class="v">${v}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
    $('d-kpis').innerHTML =
      k('cash', 'Omzet Harian', s ? U.rp(s.omzet) : '—', 'Murni belanja makanan') +
      k('target', 'Target Harian', U.rp(T), 'Acuan Rp6.000.000') +
      k('trend', 'Pencapaian Target', s ? U.pct(pct) : '—', s ? st.label : 'Belum ada data') +
      k('cash', 'Selisih Target', s ? (diff >= 0 ? '+' : '−') + U.rp(Math.abs(diff)) : '—', s ? (diff >= 0 ? 'Di atas target' : 'Di bawah target') : '');

    // B. KPIS HAK KURIR HARI INI
    const todayOrders = db.orders.filter(o => o.date === today);
    const courierSummary = Courier.summarizeCouriers(todayOrders);
    const courierDetails = courierSummary.couriers.map(c => `${c.courierName}: ${U.rp(c.totalIncome)}`).join(' · ') || 'Belum ada pengantaran';

    $('d-courier-kpis').innerHTML =
      k('coin', 'Total Ongkir Pelanggan', U.rp(todayOrders.reduce((a, o) => a + (Number(o.ongkir) || 0), 0)), 'Seluruh pesanan hari ini') +
      k('coin', 'Total Hak Kurir', U.rp(courierSummary.totalOngkir), 'Pesanan berhasil') +
      k('truck', 'Pengantaran Berhasil', courierSummary.totalDelivered + ' pesanan', 'Sukses diantar') +
      k('users', 'Rincian Tiap Kurir', courierSummary.couriers.length ? courierSummary.couriers.length + ' kurir bertugas' : '0 kurir', courierDetails);

    // C. RINGKASAN TAMBAHAN & TOTAL PEMBAYARAN PELANGGAN
    const todayFood = s ? s.omzet : 0;
    const todayOngkir = todayOrders.reduce((a, o) => a + (Number(o.ongkir) || 0), 0);
    const todayTotalCust = todayFood + todayOngkir;

    $('d-extra').innerHTML =
      k('cash', 'Total Bayar Pelanggan Hari Ini', U.rp(todayTotalCust), `Makanan ${U.rp(todayFood)} + Ongkir ${U.rp(todayOngkir)}`) +
      k('cash', 'Total Omzet Bulan Ini', U.rp(mt), month.length + ' hari tercatat') +
      k('chart', 'Rata-rata Omzet Harian', all.length ? U.rp(sum / all.length) : '—') +
      k('coin', 'Estimasi Upah Staf Operasional', w ? U.rp(w.total) : '—', w ? (w.lockedAt ? 'Sudah dikunci' : 'Belum dikunci') : '');

    // GRAFIK OMZET
    document.querySelectorAll('#d-seg button').forEach(b => b.classList.toggle('on', b.dataset.r === this.r));
    let labels = [], vals = [], tg = T;
    if (this.r === 'm') {
      const g = {}; all.forEach(x => { const m = x.date.slice(0, 7); g[m] = g[m] || { t: 0, n: 0 }; g[m].t += x.omzet; g[m].n++; });
      const ks = Object.keys(g).sort().slice(-12); labels = ks.map(Charts.month); vals = ks.map(m => g[m].t); tg = ks.map(m => g[m].n * T);
    } else {
      for (let i = +this.r - 1; i >= 0; i--) { const d = U.addDays(today, -i), x = Sales.byDate(d); labels.push(d.slice(8) + '/' + d.slice(5, 7)); vals.push(x ? x.omzet : 0); }
    }
    Charts.bars('c-dash', labels, vals, tg);
  }
};

const Backup = {
  init() {
    $('b-export').onclick = () => {
      U.download(`green-marinasi-backup-${U.today()}.json`, JSON.stringify(Store.get(), null, 2), 'application/json');
      U.toast('Cadangan diunduh.');
    };
    $('b-import').addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const o = JSON.parse(rd.result); if (!Store.valid(o)) throw new Error('format');
          if (!confirm(`Pulihkan data dari file ini?\n\n${o.sales.length} data omzet, ${(o.orders || []).length} pesanan kurir, ${o.employees.length} karyawan, ${(o.locks || []).length} upah terkunci.\n\nData saat ini di perangkat ini akan DIGANTI.`)) return;
          Store.replace(o); App.refresh(); U.toast('Data berhasil dipulihkan.');
        } catch (_) { U.toast('File tidak valid. Gunakan file cadangan Green Marinasi (.json).', 'err'); }
        finally { e.target.value = ''; }
      };
      rd.readAsText(file);
    });
  }
};

const App = {
  view: 'dashboard',
  init() {
    Store.load();
    // Render Sidebar Nav
    $('nav-side').innerHTML = NAV.map(([k, l, i]) => `
      <a href="#${k}" data-v="${k}">
        ${U.icon(i)}
        <span>${l}</span>
      </a>
    `).join('');

    // Render Bottom Nav (Mobile)
    $('nav-bottom').innerHTML = NAV.map(([k, l, i]) => `
      <a href="#${k}" data-v="${k}">
        <span class="nb-icon-box">${U.icon(i)}</span>
        <span>${l}</span>
      </a>
    `).join('');

    Sales.init(); CourierUI.init(); Employees.init(); Wage.init(); Reports.init(); Backup.init(); Dash.init();
    addEventListener('hashchange', () => this.route()); this.route();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  },
  route() {
    const k = location.hash.slice(1);
    this.view = NAV.some(n => n[0] === k) ? k : 'dashboard';
    
    // Aktifkan view
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'v-' + this.view));
    
    // Tandai tombol menu aktif
    document.querySelectorAll('[data-v]').forEach(a => a.classList.toggle('on', a.dataset.v === this.view));

    // Update label tag pada mobile top bar jika ada
    const activeItem = NAV.find(n => n[0] === this.view);
    const tagEl = $('mobile-view-tag');
    if (tagEl && activeItem) {
      tagEl.textContent = activeItem[1];
    }

    this.refresh();
    scrollTo(0, 0);
  },
  refresh() {
    ({
      dashboard: () => Dash.render(),
      sales: () => Sales.render(),
      courier: () => CourierUI.render(),
      wage: () => Wage.render(),
      employees: () => Employees.render(),
      reports: () => Reports.render()
    })[this.view]();
  }
};
addEventListener('load', () => App.init());
