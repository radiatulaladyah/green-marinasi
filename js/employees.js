/* employees.js — kelola karyawan */
const Employees = {
  editing: null,

  init() {
    const f = $('emp-form');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const nama = f.nama.value.trim(), role = f.role.value.trim(), group = f.group.value, active = f.active.checked;
      if (!nama || !role) return U.toast('Nama dan bagian wajib diisi.', 'err');
      const list = Store.get().employees;
      if (this.editing) { const x = list.find(i => i.id === this.editing); if (x) Object.assign(x, { name: nama, role, group, active }); }
      else list.push({ id: U.uid(), name: nama, role, group, active });
      Store.save(); U.toast(this.editing ? 'Data karyawan diperbarui.' : 'Karyawan ditambahkan.');
      this.reset(); this.render();
    });
    $('ef-cancel').onclick = () => this.reset();
    const t = $('emp-table');
    t.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'SELECT') return;
      const x = Store.get().employees.find(i => i.id === b.dataset.id); if (!x) return;
      if (b.dataset.act === 'edit') this.edit(x);
      else if (b.dataset.act === 'toggle') { x.active = !x.active; Store.save(); this.render(); }
      else if (b.dataset.act === 'del' && confirm(`Hapus karyawan "${x.name}"?\n\nUpah yang sudah dikunci tidak berubah. Jika hanya berhenti sementara, gunakan status Nonaktif.`)) {
        const db = Store.get(); db.employees = db.employees.filter(i => i.id !== x.id);
        if (this.editing === x.id) this.reset(); Store.save(); this.render(); U.toast('Karyawan dihapus.');
      }
    });
    t.addEventListener('change', e => {
      const s = e.target.closest('select[data-act="grp"]'); if (!s) return;
      const x = Store.get().employees.find(i => i.id === s.dataset.id);
      if (x) { x.group = s.value; Store.save(); this.render(); U.toast('Kelompok diubah. Riwayat terkunci tidak berubah.'); }
    });
  },

  reset() {
    this.editing = null; $('emp-form').reset(); $('emp-form').active.checked = true;
    $('ef-title').textContent = 'Tambah karyawan'; $('ef-cancel').hidden = true;
  },

  edit(x) {
    const f = $('emp-form'); this.editing = x.id;
    f.nama.value = x.name; f.role.value = x.role; f.group.value = x.group; f.active.checked = x.active;
    $('ef-title').textContent = 'Edit karyawan'; $('ef-cancel').hidden = false; scrollTo({ top: 0, behavior: 'smooth' });
  },

  render() {
    const db = Store.get(), T = db.settings.target, today = U.today(), s = Sales.byDate(today), list = db.employees;
    const act = list.filter(e => e.active);
    $('emp-sum').textContent = `${act.length} aktif dari ${list.length} karyawan`;

    // Cek pesanan hari ini untuk kurir
    const todayOrders = db.orders.filter(o => o.date === today);

    const est = e => {
      const isCourier = (e.role || '').toLowerCase().includes('kurir');
      if (isCourier) {
        // Kurir: dari akumulasi ongkir pengantaran berhasil
        const courierData = Courier.calculateCourierIncome(todayOrders, e.name, db.settings.courierBaseSalary || 0);
        return `${U.rp(courierData.totalIncome)} <small style="color:var(--mut)">(${courierData.deliveredCount} antar)</small>`;
      }
      return (s && e.active) ? U.rp(Salary.wage(e.group, s.omzet, T)) : '—';
    };

    // Total upah non-kurir
    const nonCourierActive = act.filter(e => !(e.role || '').toLowerCase().includes('kurir'));
    const totalWage = s ? U.rp(Salary.total(Salary.rows(nonCourierActive, s.omzet, T))) : '—';

    if (!list.length) { $('emp-table').innerHTML = '<tbody><tr><td class="empty">Belum ada karyawan. Tambahkan lewat form.</td></tr></tbody>'; return; }
    $('emp-table').innerHTML = '<thead><tr><th>Nama</th><th>Bagian</th><th>Kelompok</th><th>Status</th><th class="n">Penghasilan / Estimasi Hari ini</th><th></th></tr></thead><tbody>' +
      list.map(e => {
        const isCourier = (e.role || '').toLowerCase().includes('kurir');
        return `<tr><td>${U.esc(e.name)}</td><td>${U.esc(e.role)}</td>
        <td>${isCourier ? '<span class="mut">Ongkir</span>' : `<select data-act="grp" data-id="${e.id}" aria-label="Kelompok ${U.esc(e.name)}">${['A', 'B', 'C'].map(g => `<option${g === e.group ? ' selected' : ''}>${g}</option>`).join('')}</select>`}</td>
        <td><button class="chip ${e.active ? 's3' : 'off'}" data-act="toggle" data-id="${e.id}">${e.active ? 'Aktif' : 'Nonaktif'}</button></td>
        <td class="n">${est(e)}</td>
        <td><div class="acts"><button class="btn ghost sm" data-act="edit" data-id="${e.id}" aria-label="Edit">${U.icon('edit')}</button>
        <button class="btn ghost sm del" data-act="del" data-id="${e.id}" aria-label="Hapus">${U.icon('trash')}</button></div></td></tr>`;
      }).join('') +
      `</tbody><tfoot><tr><td colspan="4">Total upah karyawan operasional non-kurir${s ? '' : ' (belum ada omzet hari ini)'}</td><td class="n">${totalWage}</td><td></td></tr></tfoot>`;
  }
};
