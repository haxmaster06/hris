# ====================================================
#  HBM CORP - HRIS SYSTEM EXECUTOR (NEXUS HR)
#  PowerShell Script untuk menjalankan semua server
# ====================================================

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot "apps/api"
$frontendPath = Join-Path $projectRoot "apps/web"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   HBM CORP - HRIS SYSTEM EXECUTOR (NEXUS HR)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Clean Development Environment ----
$rebuildCache = $false
Write-Host "Apakah Anda ingin membersihkan cache Laravel? (Sangat direkomendasikan jika ada perubahan file .env / config)" -ForegroundColor Cyan
Write-Host ">> Tekan [Y] dalam 3 detik untuk membersihkan cache..." -ForegroundColor Yellow
Write-Host ">> Atau diamkan / tekan tombol lain untuk langsung masuk (STARTUP INSTAN)..." -ForegroundColor Yellow

$timeout = 3
$startTime = [DateTime]::Now
while (([DateTime]::Now - $startTime).TotalSeconds -lt $timeout) {
    if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)
        if ($key.Key -eq [ConsoleKey]::Y) {
            $rebuildCache = $true
            break
        } else {
            break
        }
    }
    Start-Sleep -Milliseconds 100
}

if ($rebuildCache) {
    Write-Host "[CLEAN] Membersihkan cache lama..." -ForegroundColor Yellow
    try {
        Push-Location $backendPath
        php artisan optimize:clear
        Pop-Location
        Write-Host "  [OK] Cache Laravel berhasil dibersihkan." -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Gagal membersihkan cache otomatis." -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] Melewati pembersihan cache untuk startup instan..." -ForegroundColor Green
}
Write-Host ""

# ---- Port Cleaning: Bebaskan port yang bentrok ----
$ports = @(3030, 7030)
Write-Host "[PORT CHECK] Memeriksa dan membebaskan port yang akan digunakan..." -ForegroundColor Yellow
foreach ($port in $ports) {
    $targetPids = @()
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            $targetPids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        }
    } catch {
        # Fallback menggunakan netstat jika Get-NetTCPConnection bermasalah
        $netstat = netstat -ano | Select-String -Pattern ":$port\s+"
        foreach ($line in $netstat) {
            $parts = $line.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
            if ($parts.Length -ge 5) {
                $pidStr = $parts[-1].Trim()
                if ($pidStr -match '^\d+$' -and $pidStr -ne '0') {
                    $targetPids += [int]$pidStr
                }
            }
        }
        $targetPids = $targetPids | Select-Object -Unique
    }

    foreach ($targetPid in $targetPids) {
        if ($targetPid -gt 0) {
            $proc = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  -> Port $port sedang digunakan oleh PID $targetPid ($($proc.Name)). Menghentikan proses..." -ForegroundColor Yellow
                try {
                    Stop-Process -Id $targetPid -Force -ErrorAction Stop
                    Write-Host "  [OK] PID $targetPid berhasil dihentikan." -ForegroundColor Green
                    Start-Sleep -Seconds 1
                } catch {
                    Write-Host "  [ERR] Gagal menghentikan PID $targetPid secara otomatis." -ForegroundColor Red
                }
            }
        }
    }
}
Write-Host "  [OK] Semua port bersih dan siap digunakan." -ForegroundColor Green
Write-Host ""

# Mencari lokasi wt.exe secara paksa jika tidak ada di PATH
$wtPath = "wt.exe"
if (!(Get-Command wt -ErrorAction SilentlyContinue)) {
    $wtPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\wt.exe"
}

if (Test-Path $wtPath) {
    Write-Host "[INFO] Windows Terminal terdeteksi. Menambahkan tab ke jendela ini..." -ForegroundColor Green
    
    # Jalankan server menggunakan Windows Terminal (wt.exe)
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$backendPath`" --title `"BACKEND-API`" cmd /k `"php artisan serve --port=7030`""
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$backendPath`" --title `"QUEUE`" cmd /k `"php artisan queue:listen`""
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$frontendPath`" --title `"FRONTEND-WEB`" cmd /k `"npm run dev -- -p 3030`""
} else {
    Write-Host "[WARN] Windows Terminal tidak ditemukan. Membuka Multi-Window..." -ForegroundColor Yellow

    # Jalankan server menggunakan Command Prompt biasa (cmd.exe)
    Start-Process cmd -ArgumentList "/k cd /d `"$backendPath`" && php artisan serve --port=7030" -WindowStyle Normal
    Start-Process cmd -ArgumentList "/k cd /d `"$backendPath`" && php artisan queue:listen" -WindowStyle Normal
    Start-Process cmd -ArgumentList "/k cd /d `"$frontendPath`" && npm run dev -- -p 3030" -WindowStyle Normal
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  SISTEM HRIS NEXUS HR TELAH DIAKTIFKAN!" -ForegroundColor Green
Write-Host "  --------------------------------------------------"
Write-Host "  Frontend Web:  http://localhost:3030"
Write-Host "  Backend API:   http://localhost:7030"
Write-Host "  --------------------------------------------------"
Write-Host "  Server:  PHP Built-in Web Server" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
