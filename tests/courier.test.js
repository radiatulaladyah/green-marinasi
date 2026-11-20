// Jalankan: node tests/courier.test.js
const assert = require('assert');
const Courier = require('../js/courier.js');

console.log('=== PENGUJIAN LOGIKA KURIR & ONGKIR GREEN MARINASI ===\n');

// DATA UJI SESUAI BUTIR 7 PROMPT-REVISI:
// Pesanan:
// - GM001: ongkir Rp5.000, Kurir A, berhasil.
// - GM002: ongkir Rp7.000, Kurir A, berhasil.
// - GM003: ongkir Rp8.000, Kurir A, berhasil.
// - GM004: ongkir Rp10.000, Kurir B, berhasil.
// - GM005: ongkir Rp6.000, Kurir B, berhasil.
// - GM006: ongkir Rp9.000, Kurir B, gagal.

const testOrders = [
  { id: '1', orderNo: 'GM001', date: '2026-11-21', foodAmount: 50000, ongkir: 5000, courierName: 'Kurir A', status: 'berhasil' },
  { id: '2', orderNo: 'GM002', date: '2026-11-21', foodAmount: 60000, ongkir: 7000, courierName: 'Kurir A', status: 'berhasil' },
  { id: '3', orderNo: 'GM003', date: '2026-11-21', foodAmount: 70000, ongkir: 8000, courierName: 'Kurir A', status: 'berhasil' },
  { id: '4', orderNo: 'GM004', date: '2026-11-21', foodAmount: 80000, ongkir: 10000, courierName: 'Kurir B', status: 'berhasil' },
  { id: '5', orderNo: 'GM005', date: '2026-11-21', foodAmount: 40000, ongkir: 6000, courierName: 'Kurir B', status: 'berhasil' },
  { id: '6', orderNo: 'GM006', date: '2026-11-21', foodAmount: 90000, ongkir: 9000, courierName: 'Kurir B', status: 'gagal' }
];

// Test 1: Hitung Kurir A
const resA = Courier.calculateCourierIncome(testOrders, 'Kurir A');
assert.strictEqual(resA.deliveredCount, 3, 'Kurir A harus punya 3 pengantaran berhasil');
assert.strictEqual(resA.totalOngkir, 20000, 'Ongkir Kurir A harus Rp20.000');
assert.strictEqual(resA.totalIncome, 20000, 'Penghasilan Kurir A harus Rp20.000');
console.log('✔ Test 1 LULUS: Penghasilan Kurir A = Rp20.000 (3 pesanan berhasil)');

// Test 2: Hitung Kurir B
const resB = Courier.calculateCourierIncome(testOrders, 'Kurir B');
assert.strictEqual(resB.deliveredCount, 2, 'Kurir B harus punya 2 pengantaran berhasil (GM006 gagal tidak dihitung)');
assert.strictEqual(resB.totalOngkir, 16000, 'Ongkir Kurir B harus Rp16.000');
assert.strictEqual(resB.totalIncome, 16000, 'Penghasilan Kurir B harus Rp16.000');
console.log('✔ Test 2 LULUS: Penghasilan Kurir B = Rp16.000 (GM006 gagal tidak dihitung)');

// Test 3: Rekap Seluruh Kurir
const summary = Courier.summarizeCouriers(testOrders);
assert.strictEqual(summary.totalDelivered, 5, 'Total pesanan berhasil harus 5');
assert.strictEqual(summary.totalOngkir, 36000, 'Total hak seluruh kurir harus Rp36.000');
console.log('✔ Test 3 LULUS: Total hak seluruh kurir = Rp36.000');

// Test 4: Pemisahan Omzet Green Marinasi vs Ongkir Hak Kurir vs Total Pelanggan
// Total food = 50 + 60 + 70 + 80 + 40 + 90 = 390.000
// Total ongkir = 5+7+8+10+6+9 = 45.000
assert.strictEqual(summary.totalFood, 390000, 'Total belanja makanan (omzet murni)');
assert.strictEqual(summary.totalCustomerPayment, 435000, 'Total pembayaran pelanggan = Makanan + Ongkir');
console.log('✔ Test 4 LULUS: Omzet makanan = Rp390.000, Hak kurir berhasil = Rp36.000, Total pembayaran pelanggan = Rp435.000');

// Test 5: Perubahan status dari Berhasil ke Gagal/Dibatalkan
const dynamicOrders = JSON.parse(JSON.stringify(testOrders));
// Ubah GM005 jadi dibatalkan
dynamicOrders[4].status = 'dibatalkan';
const resBAfterCancel = Courier.calculateCourierIncome(dynamicOrders, 'Kurir B');
assert.strictEqual(resBAfterCancel.deliveredCount, 1, 'Setelah GM005 batal, kurir B sisa 1 berhasil');
assert.strictEqual(resBAfterCancel.totalOngkir, 10000, 'Setelah GM005 batal, kurir B sisa Rp10.000');
console.log('✔ Test 5 LULUS: Penyesuaian otomatis jika status berubah ke batal/gagal');

// Test 6: Fleksibilitas penambahan gaji pokok di masa depan
const resAWithBase = Courier.calculateCourierIncome(testOrders, 'Kurir A', 50000);
assert.strictEqual(resAWithBase.totalIncome, 70000, 'Total penghasilan Kurir A dengan gaji pokok Rp50.000 = Rp70.000');
console.log('✔ Test 6 LULUS: Struktur mendukung gaji pokok kurir di masa depan');

console.log('\nSEMUA PENGUJIAN KURIR LULUS DENGAN SEMPURNA!\n');

