/* courier-ui.js — UI & Kontrol Pengantaran & Rekap Penghasilan Kurir */
const CourierUI = {
  editing: null,

  init() {
    const f = $('order-form');
    f.date.value = U.today();
    f.addEventListener('submit', e => { e.preventDefault(); this.submitOrder(); });
    $('of-cancel').onclick = () => this.resetOrderForm();

    // Event listener tabel pesanan (edit, hapus, ganti status langsung)
    $('order-table').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const id = b.dataset.id;
      if (b.dataset.act === 'edit') this.editOrder(id);
      if (b.dataset.act === 'del') this.removeOrder(id);
    });

    $('order-table').addEventListener('change', e => {
      const sel = e.target.closest('select[data-act="status"]');
      if (!sel) return;
      this.updateOrderStatus(sel.dataset.id, sel.value);
    });

    // Event listener filter kurir
    ['cf-period', 'cf-date', 'cf-from', 'cf-to', 'cf-courier', 'cf-status'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('change', () => this.render());
    });

    $('cf-date').value = U.today();
    $('cf-to').value = U.today();
    $('cf-from').value = U.addDays(U.today(), -6);

    // Event modal / setting gaji pokok di masa depan
    if ($('btn-courier-base')) {
      $('btn-courier-base').onclick = () => this.promptBaseSalary();
    }
  },

  promptBaseSalary() {
    const db = Store.get();
    const current = db.settings.courierBaseSalary || 0;
    const input = prompt('Atur gaji pokok kurir (default Rp0 untuk saat ini):\n\nNominal (Rp):', current);
    if (input === null) return;
    const num = Number(input.trim());
    if (isNaN(num) || num < 0) {
      return U.toast('Nominal gaji pokok tidak valid.', 'err');
    }
    db.settings.courierBaseSalary = Math.round(num);
    Store.save();
    U.toast('Pengaturan gaji pokok kurir diperbarui.');
    this.render();
  },

  getCourierNames() {
    const db = Store.get();
    // Ambil dari daftar karyawan dengan role Kurir, atau dari pesanan yang ada
    const fromEmp = db.employees.filter(e => (e.role || '').toLowerCase().includes('kurir')).map(e => e.name.trim());
    const fromOrd = db.orders.map(o => (o.courierName || '').trim()).filter(Boolean);
    const set = new Set([...fromEmp, ...fromOrd, 'Kurir A', 'Kurir B']);
    return Array.from(set).filter(Boolean).sort();
  },

  populateCourierSelects() {
    const list = this.getCourierNames();
    const curSelect = $('of-courier').value;
    $('of-courier').innerHTML = list.map(c => `<option value="${U.esc(c)}">${U.esc(c)}</option>`).join('');
    if (curSelect && list.includes(curSelect)) $('of-courier').value = curSelect;

    const filterSel = $('cf-courier');
    const curFilter = filterSel.value;
    filterSel.innerHTML = '<option value="all">Semua Kurir</option>' + list.map(c => `<option value="${U.esc(c)}">${U.esc(c)}</option>`).join('');
    if (curFilter) filterSel.value = curFilter;
  },

  resetOrderForm() {
    const f = $('order-form');
    this.editing = null;
    f.reset();
    f.date.value = U.today();
    $('of-title').textContent = 'Catat Pengantaran';
    $('of-cancel').hidden = true;
  },

  editOrder(id) {
    const o = Store.get().orders.find(x => x.id === id);
    if (!o) return;
    this.editing = id;
    const f = $('order-form');
    f.orderNo.value = o.orderNo || '';
    f.date.value = o.date;
    f.foodAmount.value = o.foodAmount || '';
    f.ongkir.value = o.ongkir || 0;
    f.courierName.value = o.courierName;
    f.status.value = o.status;
    f.note.value = o.note || '';
    $('of-title').textContent = 'Edit Pengantaran ' + (o.orderNo || '');
    $('of-cancel').hidden = false;
    f.scrollIntoView({ behavior: 'smooth' });
  },

  removeOrder(id) {
    const o = Store.get().orders.find(x => x.id === id);
    if (!o) return;
    if (!confirm(`Hapus data pesanan ${o.orderNo || ''} (Kurir: ${o.courierName})?`)) return;
    const db = Store.get();
    db.orders = db.orders.filter(x => x.id !== id);
    if (this.editing === id) this.resetOrderForm();
    Store.save();
    U.toast('Pesanan berhasil dihapus.');
    this.render();
  },

  updateOrderStatus(id, newStatus) {
    const o = Store.get().orders.find(x => x.id === id);
    if (!o) return;
    const oldStatus = o.status;
    if (oldStatus === newStatus) return;

    o.status = newStatus;
    o.history = o.history || [];
    o.history.push({
      from: oldStatus,
      to: newStatus,
      at: new Date().toISOString()
    });
    o.updatedAt = new Date().toISOString();

    Store.save();
    U.toast(`Status ${o.orderNo || 'pesanan'} diubah ke "${Courier.STATUS_LABELS[newStatus]}".`);
    this.render();
  },

  submitOrder() {
    const f = $('order-form');
    const orderNo = f.orderNo.value.trim().toUpperCase() || ('GM' + Date.now().toString().slice(-4));
    const date = f.date.value;
    const food = Math.max(0, Number(f.foodAmount.value) || 0);
    const ongkir = Number(f.ongkir.value);
    const courierName = f.courierName.value.trim();
    const status = f.status.value;
    const note = f.note.value.trim();

    if (!date) return U.toast('Pilih tanggal pengantaran.', 'err');
    if (!courierName) return U.toast('Pilih kurir pengantar.', 'err');
    if (isNaN(ongkir) || ongkir < 0) return U.toast('Nominal ongkir harus angka 0 atau lebih.', 'err');

    const db = Store.get();
    if (this.editing) {
      const o = db.orders.find(x => x.id === this.editing);
      if (o) {
        if (o.status !== status) {
          o.history = o.history || [];
          o.history.push({ from: o.status, to: status, at: new Date().toISOString() });
        }
        Object.assign(o, { orderNo, date, foodAmount: food, ongkir, courierName, status, note, updatedAt: new Date().toISOString() });
      }
      U.toast('Data pengantaran diperbarui.');
    } else {
      db.orders.push({
        id: U.uid(),
        orderNo,
        date,
        foodAmount: food,
        ongkir,
        courierName,
        status,
        note,
        history: [{ from: null, to: status, at: new Date().toISOString() }],
        createdAt: new Date().toISOString()
      });
      U.toast('Pengantaran berhasil dicatat.');
    }

    Store.save();
    this.resetOrderForm();
    this.render();
  },

  getFilterRange() {
    const p = $('cf-period').value;
    const d = $('cf-date').value || U.today();
    if (p === 'day') return [d, d];
    if (p === 'week') {
      const off = (U.parse(d).getDay() + 6) % 7;
      const f = U.addDays(d, -off);
      return [f, U.addDays(f, 6)];
    }
    if (p === 'month') {
      return [d.slice(0, 7) + '-01', d.slice(0, 7) + '-31'];
    }
    return [$('cf-from').value, $('cf-to').value];
  },

  render() {
    this.populateCourierSelects();

    const p = $('cf-period').value;
    $('cf-dl').hidden = p === 'range';
    $('cf-fl').hidden = $('cf-tl').hidden = p !== 'range';

    const [from, to] = this.getFilterRange();
    const selCourier = $('cf-courier').value;
    const selStatus = $('cf-status').value;

    const db = Store.get();
    const filtered = Courier.filterOrders(db.orders, {
      fromDate: from,
      toDate: to,
      courierName: selCourier,
      status: selStatus
    }).sort((a, b) => (b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '')));

    // Hitung ringkasan kurir
    const baseSalaries = {};
    if (db.settings.courierBaseSalary) {
      this.getCourierNames().forEach(name => {
        baseSalaries[name] = db.settings.courierBaseSalary;
      });
    }

    const summary = Courier.summarizeCouriers(filtered, baseSalaries);

    // Render KPI Kurir
    const k = (ic, l, v, s) => `<div class="card kpi"><div class="lbl">${U.icon(ic)}${l}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
    $('c-kpis').innerHTML =
      k('coin', 'Total Hak Kurir', U.rp(summary.totalOngkir), 'Hanya dari pesanan BERHASIL') +
      k('truck', 'Pengantaran Berhasil', summary.totalDelivered, 'Pesanan sukses diantar') +
      k('bag', 'Total Belanja Pelanggan', U.rp(summary.totalFood), 'Omzet makanan Green Marinasi') +
      k('cash', 'Total Bayar Pelanggan', U.rp(summary.totalCustomerPayment), 'Belanja makanan + ongkir');

    // Render Tabel Rekap Kurir
    const ct = $('courier-summary-table');
    if (!summary.couriers.length) {
      ct.innerHTML = '<tbody><tr><td class="empty">Belum ada aktivitas kurir pada periode ini.</td></tr></tbody>';
    } else {
      ct.innerHTML = '<thead><tr><th>Nama Kurir</th><th class="n">Berhasil Diantar</th><th class="n">Gagal/Batal</th><th class="n">Total Ongkir</th>' +
        (db.settings.courierBaseSalary ? '<th class="n">Gaji Pokok</th>' : '') +
        '<th class="n">Total Penghasilan</th></tr></thead><tbody>' +
        summary.couriers.map(c => `
          <tr>
            <td><b>${U.esc(c.courierName)}</b></td>
            <td class="n"><span class="chip s3">${c.deliveredCount} pesanan</span></td>
            <td class="n">${c.failedCount ? `<span class="chip s1">${c.failedCount}</span>` : '0'}</td>
            <td class="n"><b>${U.rp(c.totalOngkir)}</b></td>
            ${db.settings.courierBaseSalary ? `<td class="n">${U.rp(c.baseSalary)}</td>` : ''}
            <td class="n" style="color:var(--g800);font-weight:700">${U.rp(c.totalIncome)}</td>
          </tr>
        `).join('') +
        `</tbody><tfoot><tr>
          <td>Total Seluruh Kurir</td>
          <td class="n">${summary.totalDelivered} pesanan</td>
          <td class="n"></td>
          <td class="n">${U.rp(summary.totalOngkir)}</td>
          ${db.settings.courierBaseSalary ? `<td class="n">${U.rp(summary.couriers.length * db.settings.courierBaseSalary)}</td>` : ''}
          <td class="n">${U.rp(summary.couriers.reduce((a, b) => a + b.totalIncome, 0))}</td>
        </tr></tfoot>`;
    }

    // Render Tabel Riwayat Pengantaran
    const ot = $('order-table');
    if (!filtered.length) {
      ot.innerHTML = '<tbody><tr><td class="empty">Tidak ada data pesanan pada filter ini.</td></tr></tbody>';
    } else {
      ot.innerHTML = '<thead><tr><th>Pesanan</th><th>Tanggal</th><th>Kurir</th><th class="n">Belanja Makanan</th><th class="n">Ongkir Kurir</th><th>Status Pengantaran</th><th>Catatan & Riwayat</th><th></th></tr></thead><tbody>' +
        filtered.map(o => {
          const statusClass = {
            berhasil: 's3',
            menunggu: 's2',
            dalam_perjalanan: 's2',
            gagal: 's1',
            dibatalkan: 'off'
          }[o.status] || 'off';

          const histTip = (o.history && o.history.length > 1)
            ? `<div class="s" title="Riwayat perubahan status">Riwayat: ${o.history.map(h => (h.from ? Courier.STATUS_LABELS[h.from] : 'Awal') + ' → ' + Courier.STATUS_LABELS[h.to]).join(', ')}</div>`
            : '';

          return `
            <tr>
              <td><b>${U.esc(o.orderNo || '—')}</b></td>
              <td>${U.dmy(o.date)}</td>
              <td>${U.esc(o.courierName)}</td>
              <td class="n">${U.rp(o.foodAmount || 0)}</td>
              <td class="n"><b>${U.rp(o.ongkir || 0)}</b></td>
              <td>
                <select data-act="status" data-id="${o.id}" class="chip ${statusClass}" style="border:1px solid #cdd8d1;min-height:36px;padding:4px 8px;font-weight:700">
                  <option value="berhasil"${o.status === 'berhasil' ? ' selected' : ''}>Berhasil</option>
                  <option value="menunggu"${o.status === 'menunggu' ? ' selected' : ''}>Menunggu</option>
                  <option value="dalam_perjalanan"${o.status === 'dalam_perjalanan' ? ' selected' : ''}>Dalam Perjalanan</option>
                  <option value="gagal"${o.status === 'gagal' ? ' selected' : ''}>Gagal</option>
                  <option value="dibatalkan"${o.status === 'dibatalkan' ? ' selected' : ''}>Dibatalkan</option>
                </select>
              </td>
              <td>${U.esc(o.note || '')}${histTip}</td>
              <td>
                <div class="acts">
                  <button class="btn ghost sm" data-act="edit" data-id="${o.id}" aria-label="Edit">${U.icon('edit')}</button>
                  <button class="btn ghost sm del" data-act="del" data-id="${o.id}" aria-label="Hapus">${U.icon('trash')}</button>
                </div>
              </td>
            </tr>
          `;
        }).join('') + '</tbody>';
    }
  }
};

