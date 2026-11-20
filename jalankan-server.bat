@echo off
cd /d "%~dp0"
echo ================================================
echo  Green Marinasi - server lokal (port 8000)
echo  Di HP buka: http://ALAMAT-IPV4-LAPTOP:8000
echo  (cari IPv4 dengan perintah: ipconfig)
echo  Biarkan jendela ini terbuka selama dipakai.
echo ================================================
where python >nul 2>nul && (python -m http.server 8000 --bind 0.0.0.0) || (py -m http.server 8000 --bind 0.0.0.0)
pause
