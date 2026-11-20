# Green Marinasi — Monitoring Omzet & Upah Harian

Aplikasi HTML + CSS + JavaScript (tanpa backend, tanpa login). Data disimpan di LocalStorage browser.

## Struktur
- `index.html` — kerangka halaman · `css/style.css` — seluruh tampilan
- `js/storage.js` — LocalStorage + fungsi bantu (format Rp, tanggal, ikon)
- `js/salary.js` — rumus persentase & upah (murni, bisa diuji) · `js/sales.js` — omzet
- `js/employees.js` — karyawan · `js/reports.js` — laporan & CSV · `js/charts.js` — grafik
- `js/app.js` — navigasi, Beranda, Upah Harian (kunci riwayat), backup/restore
- `js/vendor/chart.umd.js` — Chart.js lokal (CDN hanya cadangan) · `tests/salary.test.js` — uji upah
- `manifest.webmanifest`, `sw.js`, `icon*` — PWA · `jalankan-server.bat` — jalankan server (Windows)

## Menjalankan di laptop (Windows)
1. Instal Python (python.org) bila belum ada. Cek: `python --version`.
2. Buka folder ini, klik dua kali `jalankan-server.bat`, atau di CMD:
   `python -m http.server 8000 --bind 0.0.0.0`
3. Di laptop buka `http://localhost:8000`.
Tanpa Python: pasang ekstensi **Live Server** di VS Code, klik kanan `index.html` → *Open with Live Server*.

## Membuka dari HP Android (Wi-Fi yang sama)
1. Di laptop buka CMD, ketik `ipconfig`. Catat **IPv4 Address** adapter Wi-Fi (mis. `192.168.1.10`).
2. Pastikan laptop dan HP memakai Wi-Fi yang sama.
3. Di Chrome HP buka `http://192.168.1.10:8000` (ganti dengan IPv4 Anda; jangan pakai `localhost`).
4. Windows Firewall: saat muncul peringatan untuk Python, centang **Private networks** lalu *Allow access*.
   Jika tidak muncul: Windows Security → Firewall & network protection → *Allow an app through firewall* → izinkan **python.exe** di jaringan **Private**. Pastikan Wi-Fi diset sebagai Private.
5. Laptop harus tetap menyala dan jendela server tetap terbuka selama HP mengakses aplikasi.

## Data & cadangan
- LocalStorage laptop dan HP **terpisah, tidak sinkron otomatis**. Pindahkan data lewat Laporan → *Unduh cadangan (JSON)* lalu *Pulihkan dari JSON* di perangkat lain.
- Data juga terikat alamat: `localhost:8000` dan `192.168.x.x:8000` dianggap dua penyimpanan berbeda.

## PWA
Instalasi PWA dan service worker hanya aktif di `localhost` atau HTTPS. Lewat `http://192.168.x.x:8000` aplikasi tetap berjalan normal, tetapi tanpa mode offline; gunakan menu Chrome → *Tambahkan ke layar utama* untuk pintasan.

## Aturan yang dipakai (dapat diubah di `js/salary.js`)
- Persentase = omzet ÷ target (Rp6.000.000). ≤25% upah dasar, ≥100% batas acuan 100%, di antaranya interpolasi linear dibulatkan ke rupiah.
- Status: <80% Belum mencapai target · 80–<100% Mendekati · 100–<110% Tercapai · ≥110% Melebihi.
- Nama karyawan awal berupa penanda bagian ("Dapur 1" dst.), semua kelompok A; silakan ganti.
- Upah terkunci menyimpan salinan (nama, bagian, kelompok, upah, tabel acuan) sehingga edit omzet/karyawan tidak mengubahnya.
- Uji rumus: `node tests/salary.test.js`
