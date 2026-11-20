/* reports.js — laporan harian/mingguan/bulanan/rentang + ekspor CSV */
const Reports = {
  init() {
    ['r-type', 'r-date', 'r-from', 'r-to'].forEach(id => $(id).addEventListener('change', () => this.render()));
    $('r-date').value = U.today(); $('r-to').value = U.today(); $('r-from').value = U.addDays(U.today(), -6);
    $('r-csv').onclick = () => this.csv();
  },

  range() {
    const t = $('r-type').value, d = $('r-date').value || U.today();
    if (t === 'day') return [d, d];
    if (t === 'week') { const off = (U.parse(d).getDay() + 6) % 7, f = U.addDays(d, -off); return [f, U.addDays(f, 6)]; }   // Senin–Minggu
    if (t === 'month') return [d.slice(0, 7) + '-01', d.slice(0, 7) + '-31'];
    return [$('r-from').value, $('r-to').value];
  },

  calc() {
    const [from, to] = this.range(); if (!from || !to || from > to) return null;
    const db = Store.get();
    const T = db.settings.target;
    
    // Perhitungan omzet makanan
    const rows = db.sales.filter(s => s.date >= from && s.date <= to).sort((a, b) => a.date.localeCompare(b.date)).map(s => {
      const p = Salary.percent(s.omzet, T), w = Wage.forDate(s.date);
      // Pesanan kurir pada tanggal ini
      const dayOrders = db.orders.filter(o => o.date === s.date);
      const courierSummary = Courier.summarizeCouriers(dayOrders);
      return {
        date: s.date,
        omzet: s.omzet,
        pct: p,
        status: Salary.status(p).label,
        wage: w ? w.total : 0,
        locked: !!(w && w.lockedAt),
        note: s.note || '',
        courierHak: courierSummary.totalOngkir,
        courierDelivered: courierSummary.totalDelivered,
        totalCustomerPay: s.omzet + courierSummary.totalOngkir
      };
    });

    // Ringkasan periode kurir secara menyeluruh
    const periodOrders = db.orders.filter(o => o.date >= from && o.date <= to);
    const periodCourierSummary = Courier.summarizeCouriers(periodOrders);

    const totalOmzet = rows.reduce((a, r) => a + r.omzet, 0), days = rows.length;
    const totalCourierHak = periodCourierSummary.totalOngkir;
    const totalCustPay = totalOmzet + totalCourierHak;

    return {
      from, to, T, rows,
      total: totalOmzet,
      days,
      avg: days ? totalOmzet / days : 0,
      targetTotal: T * days,
      pct: days ? totalOmzet * 100 / (T * days) : 0,
      hit: rows.filter(r => r.omzet >= T).length,
      miss: rows.filter(r => r.omzet < T).length,
      wage: rows.reduce((a, r) => a + r.wage, 0),
      courierHak: totalCourierHak,
      courierDelivered: periodCourierSummary.totalDelivered,
      totalCustomerPay: totalCustPay
    };
  },

  render() {
    const t = $('r-type').value;
    $('r-dl').hidden = t === 'range'; $('r-fl').hidden = $('r-tl').hidden = t !== 'range';
    $('r-csv').innerHTML = U.icon('down') + 'Ekspor CSV'; $('b-export').innerHTML = U.icon('down') + 'Unduh cadangan (JSON)'; $('b-imp-l').innerHTML = U.icon('up') + 'Pulihkan dari JSON';
    const r = this.calc();
    if (!r) { $('r-range').textContent = 'Pilih rentang tanggal yang valid.'; $('r-kpis').innerHTML = ''; $('r-table').innerHTML = ''; Charts.bars('c-rep', [], [], 0); return; }
    $('r-range').textContent = r.from === r.to ? U.dmy(r.from) : `${U.dmy(r.from)} – ${U.dmy(t === 'month' ? U.iso(new Date(U.parse(r.from).getFullYear(), U.parse(r.from).getMonth() + 1, 0)) : r.to)}`;
    
    const k = (ic, l, v, s) => `<div class="card kpi"><div class="lbl">${U.icon(ic)}${l}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
    $('r-kpis').innerHTML =
      k('cash', 'Total Omzet Makanan', U.rp(r.total), 'Omzet murni Green Marinasi') +
      k('target', 'Total Target', U.rp(r.targetTotal), 'Target × hari tercatat') +
      k('trend', 'Rata-rata Omzet / Hari', U.rp(r.avg), r.days + ' hari tercatat') +
      k('chart', 'Pencapaian Target', r.days ? U.pct(r.pct) : '—') +
      k('coin', 'Total Hak Kurir (Ongkir)', U.rp(r.courierHak), `${r.courierDelivered} pengantaran berhasil`) +
      k('cash', 'Total Pembayaran Pelanggan', U.rp(r.totalCustomerPay), 'Belanja makanan + total ongkir') +
      k('coin', 'Total Upah Karyawan Operasional', U.rp(r.wage), 'Dapur, Packing, Admin') +
      k('users', 'Karyawan Aktif', Store.get().employees.filter(e => e.active).length);

    Charts.bars('c-rep', r.rows.map(x => x.date.slice(8) + '/' + x.date.slice(5, 7)), r.rows.map(x => x.omzet), r.T);
    
    $('r-table').innerHTML = r.rows.length
      ? '<thead><tr><th>Tanggal</th><th class="n">Omzet Makanan</th><th class="n">Capaian</th><th class="n">Hak Kurir</th><th class="n">Total Bayar Pelanggan</th><th class="n">Upah Operasional</th></tr></thead><tbody>' +
        r.rows.map(x => `
          <tr>
            <td>${U.dmy(x.date)}</td>
            <td class="n">${U.rp(x.omzet)}</td>
            <td class="n">${U.pct(x.pct)}</td>
            <td class="n"><b>${U.rp(x.courierHak)}</b></td>
            <td class="n">${U.rp(x.totalCustomerPay)}</td>
            <td class="n">${U.rp(x.wage)}${x.locked ? ` <span class="lk">${U.icon('lock')}</span>` : ''}</td>
          </tr>
        `).join('') +
        `</tbody><tfoot><tr>
          <td>Total</td>
          <td class="n">${U.rp(r.total)}</td>
          <td class="n">${U.pct(r.pct)}</td>
          <td class="n">${U.rp(r.courierHak)}</td>
          <td class="n">${U.rp(r.totalCustomerPay)}</td>
          <td class="n">${U.rp(r.wage)}</td>
        </tr></tfoot>`
      : '<tbody><tr><td class="empty">Tidak ada data omzet pada rentang ini.</td></tr></tbody>';
  },

  csv() {
    const r = this.calc(); if (!r || !r.rows.length) return U.toast('Tidak ada data untuk diekspor.', 'err');
    const q = v => '"' + String(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""') + '"';
    const n2 = x => x.toFixed(2).replace('.', ',');
    const L = ['sep=;', ['Tanggal', 'Omzet Makanan (GM)', 'Target GM', 'Pencapaian (%)', 'Status Target', 'Hak Kurir (Ongkir)', 'Total Bayar Pelanggan', 'Upah Staf Operasional', 'Catatan'].join(';')];
    r.rows.forEach(x => L.push([x.date, x.omzet, r.T, n2(x.pct), x.status, x.courierHak, x.totalCustomerPay, x.wage, q(x.note)].join(';')));
    L.push(['TOTAL', r.total, r.targetTotal, n2(r.pct), '', r.courierHak, r.totalCustomerPay, r.wage, ''].join(';'));
    U.download(`laporan-green-marinasi-${r.from}_${r.to.slice(0, 7) === r.from.slice(0, 7) && r.to.endsWith('-31') ? r.from.slice(0, 7) : r.to}.csv`, '\ufeff' + L.join('\r\n'), 'text/csv;charset=utf-8');
    U.toast('CSV diunduh. Buka dengan Microsoft Excel.');
  }
};
