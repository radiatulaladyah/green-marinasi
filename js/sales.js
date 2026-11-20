/* sales.js — input, edit, hapus omzet harian */
const Sales = {
  editing: null,
  byDate: d => Store.get().sales.find(s => s.date === d),

  init() {
    const f = $('sales-form');
    f.date.value = U.today();
    f.omzet.addEventListener('input', () => this.live());
    f.addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    $('sf-cancel').onclick = () => this.reset();
    $('sales-table').addEventListener('click', e => {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      b.dataset.act === 'edit' ? this.edit(b.dataset.d) : this.remove(b.dataset.d);
    });
  },

  live() {
    const f = $('sales-form'), el = $('sf-live'), v = f.omzet.value;
    if (v === '' || Number(v) < 0) { el.textContent = ''; return; }
    const p = Salary.percent(Number(v), Store.get().settings.target);
    el.innerHTML = `Pencapaian <b>${U.pct(p)}</b> dari target · ${Salary.status(p).label}`;
  },

  submit() {
    const f = $('sales-form'), date = f.date.value, raw = f.omzet.value.trim(), omzet = Number(raw), note = f.note.value.trim();
    if (!date) return U.toast('Isi tanggal terlebih dahulu.', 'err');
    if (raw === '' || !Number.isFinite(omzet) || omzet < 0) return U.toast('Omzet harus berupa angka 0 atau lebih.', 'err');
    const old = this.byDate(date);
    if (old && this.editing !== date &&
        !confirm(`Tanggal ${U.dmy(date)} sudah memiliki omzet ${U.rp(old.omzet)}.\n\nPerbarui data tersebut dengan nilai baru?`)) return;
    if (old) { old.omzet = Math.round(omzet); old.note = note; old.updatedAt = new Date().toISOString(); }
    else Store.get().sales.push({ date, omzet: Math.round(omzet), note, createdAt: new Date().toISOString() });
    Store.save();
    U.toast(Wage.lockOf(date) ? 'Omzet disimpan. Upah tanggal ini tetap terkunci.' : 'Omzet tersimpan.');
    this.reset(); this.render();
  },

  reset() {
    const f = $('sales-form'); this.editing = null; f.reset();
    f.date.value = U.today(); f.date.readOnly = false;
    $('sf-title').textContent = 'Tambah data'; $('sf-cancel').hidden = true; $('sf-live').textContent = '';
  },

  edit(d) {
    const s = this.byDate(d), f = $('sales-form'); if (!s) return;
    this.editing = d; f.date.value = d; f.date.readOnly = true; f.omzet.value = s.omzet; f.note.value = s.note || '';
    $('sf-title').textContent = 'Edit data ' + U.dmy(d); $('sf-cancel').hidden = false;
    this.live(); scrollTo({ top: 0, behavior: 'smooth' });
  },

  remove(d) {
    const s = this.byDate(d); if (!s) return;
    const lock = Wage.lockOf(d) ? '\n\nUpah yang sudah dikunci pada tanggal ini tidak ikut terhapus.' : '';
    if (!confirm(`Hapus omzet ${U.rp(s.omzet)} pada ${U.dmy(d)}?${lock}`)) return;
    const db = Store.get(); db.sales = db.sales.filter(x => x.date !== d);
    if (this.editing === d) this.reset();
    Store.save(); U.toast('Data omzet dihapus.'); this.render();
  },

  render() {
    const T = Store.get().settings.target, t = $('sales-table');
    const list = [...Store.get().sales].sort((a, b) => b.date.localeCompare(a.date));
    if (!list.length) { t.innerHTML = '<tbody><tr><td class="empty">Belum ada data. Isi form untuk mencatat omzet pertama.</td></tr></tbody>'; return; }
    t.innerHTML = '<thead><tr><th>Tanggal</th><th class="n">Omzet</th><th class="n">Capaian</th><th>Status</th><th>Catatan</th><th></th></tr></thead><tbody>' +
      list.map(s => {
        const p = Salary.percent(s.omzet, T), st = Salary.status(p);
        return `<tr><td>${U.dmy(s.date)}${Wage.lockOf(s.date) ? ` <span class="lk" title="Upah terkunci">${U.icon('lock')}</span>` : ''}</td>
          <td class="n">${U.rp(s.omzet)}</td><td class="n">${U.pct(p)}</td><td><span class="chip ${st.key}">${st.label}</span></td>
          <td>${U.esc(s.note)}</td>
          <td><div class="acts"><button class="btn ghost sm" data-act="edit" data-d="${s.date}" aria-label="Edit">${U.icon('edit')}</button>
          <button class="btn ghost sm del" data-act="del" data-d="${s.date}" aria-label="Hapus">${U.icon('trash')}</button></div></td></tr>`;
      }).join('') + '</tbody>';
  }
};
