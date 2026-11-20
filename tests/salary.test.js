// Jalankan: node tests/salary.test.js
const S = require('../js/salary.js');
const T = 6000000; let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } };
const REF = [[1500000, [25000, 35000, 40000]], [3000000, [40714, 56429, 56667]], [4500000, [56429, 78333, 89524]], [6000000, [71429, 100000, 114286]]];
REF.forEach(([o, exp]) => ['A', 'B', 'C'].forEach((g, i) => ok(S.wage(g, o, T) === exp[i], `titik acuan ${o} ${g}`)));
ok(S.percent(4000000, T).toFixed(2) === '66.67', 'persen 4jt');
ok(S.percent(3100000, T).toFixed(2) === '51.67', 'persen 3,1jt');
['A', 'B', 'C'].forEach(g => {
  ok(S.wage(g, 0, T) === S.TABLE[g][0], 'omzet 0 = upah dasar ' + g);
  ok(S.wage(g, 1000000, T) === S.TABLE[g][0], '<25% = upah dasar ' + g);
  ok(S.wage(g, 9000000, T) === S.TABLE[g][3], '>100% dibatasi ' + g);
  let prev = 0; for (let o = 0; o <= 7000000; o += 50000) { const v = S.wage(g, o, T); ok(v >= prev, 'monoton ' + g + ' ' + o); prev = v; }
});
// snapshot terkunci tidak ikut berubah saat data karyawan diedit
const emps = [{ id: '1', name: 'X', role: 'Dapur', group: 'A' }, { id: '2', name: 'Y', role: 'Kurir', group: 'B' }];
const snap = S.rows(emps, 4000000, T), before = JSON.stringify(snap);
emps[0].group = 'C'; emps.push({ id: '3', name: 'Z', role: 'Packing', group: 'C' });
ok(JSON.stringify(snap) === before, 'snapshot berubah');
console.log('\n| Omzet | Capaian | A | B | C |\n|---|---:|---:|---:|---:|');
[1500000, 2000000, 3000000, 3100000, 4000000, 4500000, 5000000, 6000000, 7000000].forEach(o =>
  console.log(`| ${o.toLocaleString('id-ID')} | ${S.percent(o, T).toFixed(2)}% | ${['A', 'B', 'C'].map(g => S.wage(g, o, T).toLocaleString('id-ID')).join(' | ')} |`));
console.log(fail ? `\n${fail} pengujian GAGAL` : '\nSemua pengujian LULUS');
process.exit(fail ? 1 : 0);
