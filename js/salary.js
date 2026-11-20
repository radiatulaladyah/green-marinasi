/* salary.js — logika murni (tanpa DOM) agar mudah diuji: node tests/salary.test.js */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Salary = factory();
})(this, function () {
  const TARGET = 6000000;
  const POINTS = [25, 50, 75, 100];                       // titik acuan (%)
  const TABLE = {                                         // upah pada 25% / 50% / 75% / 100%
    A: [25000, 40714, 56429, 71429],
    B: [35000, 56429, 78333, 100000],
    C: [40000, 56667, 89524, 114286]
  };

  function percent(omzet, target) {
    target = target || TARGET;
    return target > 0 ? (omzet * 100) / target : 0;
  }

  function wage(group, omzet, target, table) {
    const w = (table || TABLE)[group];
    if (!w) throw new Error('Kelompok upah tidak dikenal: ' + group);
    const p = percent(omzet, target);
    if (p <= POINTS[0]) return w[0];                      // di bawah/sama 25%: upah dasar
    if (p >= POINTS[3]) return w[3];                      // 100% ke atas: batas maksimum acuan
    let i = 0;
    while (p >= POINTS[i + 1]) i++;                       // ruas [POINTS[i], POINTS[i+1])
    const share = (p - POINTS[i]) / (POINTS[i + 1] - POINTS[i]);
    return Math.round(w[i] + share * (w[i + 1] - w[i]));  // interpolasi linear + pembulatan
  }

  function rows(employees, omzet, target) {
    return employees.map(e => ({ id: e.id, name: e.name, role: e.role, group: e.group, wage: wage(e.group, omzet, target) }));
  }
  const total = list => list.reduce((a, r) => a + r.wage, 0);

  function status(p) {
    if (p >= 110) return { key: 's4', label: 'Melebihi target' };
    if (p >= 100) return { key: 's3', label: 'Target tercapai' };
    if (p >= 80) return { key: 's2', label: 'Mendekati target' };
    return { key: 's1', label: 'Belum mencapai target' };
  }

  return { TARGET, POINTS, TABLE, percent, wage, rows, total, status };
});
