/* courier.js — Logika murni perhitungan ongkir & hak kurir (dapat diuji di Node.js) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Courier = factory();
})(this, function () {
  // Status pengantaran yang diakui:
  // 'menunggu', 'dalam_perjalanan', 'berhasil', 'gagal', 'dibatalkan'
  const STATUS = {
    WAITING: 'menunggu',
    IN_TRANSIT: 'dalam_perjalanan',
    DELIVERED: 'berhasil',
    FAILED: 'gagal',
    CANCELLED: 'dibatalkan'
  };

  const STATUS_LABELS = {
    menunggu: 'Menunggu',
    dalam_perjalanan: 'Dalam Perjalanan',
    berhasil: 'Berhasil',
    gagal: 'Gagal',
    dibatalkan: 'Dibatalkan'
  };

  /**
   * Cek apakah pesanan sah dan berhasil diantar sehingga ongkir menjadi hak kurir
   */
  function isDelivered(order) {
    return order && order.status === STATUS.DELIVERED;
  }

  /**
   * Hitung total ongkir & jumlah pengantaran berhasil untuk satu kurir atau daftar pesanan
   * @param {Array} orders - Daftar pesanan
   * @param {string} [courierName] - Opsional nama kurir spesifik
   * @param {number} [baseSalary=0] - Gaji pokok opsional (mendukung ekstensi masa depan)
   */
  function calculateCourierIncome(orders, courierName, baseSalary = 0) {
    let deliveredCount = 0;
    let totalOngkir = 0;
    const history = [];

    (orders || []).forEach(o => {
      if (!courierName || o.courierName === courierName) {
        if (isDelivered(o)) {
          const ongkir = Number(o.ongkir) || 0;
          totalOngkir += ongkir;
          deliveredCount++;
          history.push(o);
        }
      }
    });

    return {
      courierName: courierName || 'Semua Kurir',
      deliveredCount,
      totalOngkir,
      baseSalary: Number(baseSalary) || 0,
      totalIncome: totalOngkir + (Number(baseSalary) || 0),
      deliveredOrders: history
    };
  }

  /**
   * Rekap ringkasan seluruh kurir dari daftar pesanan
   * Mengembalikan rincian per kurir dan akumulasi total hak seluruh kurir
   */
  function summarizeCouriers(orders, courierBaseSalaries = {}) {
    const map = {};
    let totalDeliveredAll = 0;
    let totalOngkirAll = 0;
    let totalAllFood = 0;
    let totalAllCustPay = 0;

    (orders || []).forEach(o => {
      const food = Number(o.foodAmount) || 0;
      const ongkir = Number(o.ongkir) || 0;
      totalAllFood += food;
      totalAllCustPay += (food + ongkir);

      const name = (o.courierName || 'Tanpa Kurir').trim();
      if (!map[name]) {
        map[name] = {
          courierName: name,
          deliveredCount: 0,
          failedCount: 0,
          totalOngkir: 0,
          orders: []
        };
      }
      map[name].orders.push(o);

      if (isDelivered(o)) {
        map[name].deliveredCount++;
        map[name].totalOngkir += ongkir;
        totalDeliveredAll++;
        totalOngkirAll += ongkir;
      } else {
        map[name].failedCount++;
      }
    });

    const couriers = Object.values(map).map(c => {
      const baseSalary = courierBaseSalaries[c.courierName] || 0;
      return {
        courierName: c.courierName,
        deliveredCount: c.deliveredCount,
        failedCount: c.failedCount,
        totalOrders: c.orders.length,
        totalOngkir: c.totalOngkir,
        baseSalary,
        totalIncome: c.totalOngkir + baseSalary,
        orders: c.orders
      };
    });

    return {
      couriers,
      totalDelivered: totalDeliveredAll,
      totalOngkir: totalOngkirAll,
      totalFood: totalAllFood,
      totalCustomerPayment: totalAllCustPay
    };
  }

  /**
   * Filter pesanan berdasarkan kriteria tanggal & kurir
   */
  function filterOrders(orders, { fromDate, toDate, courierName, status } = {}) {
    return (orders || []).filter(o => {
      if (fromDate && o.date < fromDate) return false;
      if (toDate && o.date > toDate) return false;
      if (courierName && courierName !== 'all' && o.courierName !== courierName) return false;
      if (status && status !== 'all' && o.status !== status) return false;
      return true;
    });
  }

  return {
    STATUS,
    STATUS_LABELS,
    isDelivered,
    calculateCourierIncome,
    summarizeCouriers,
    filterOrders
  };
});

