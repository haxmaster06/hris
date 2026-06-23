# ====================================================
#  HBM CORP - ERP INTERNAL SYSTEM EXECUTOR
#  PowerShell Script untuk menjalankan semua server
# ====================================================

$projectRoot = $PSScriptRoot
$shopfloorPath = Join-Path $projectRoot "shop-floor-web"
$frontendPath = Join-Path $projectRoot "frontend-erp"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   HBM CORP - ERP INTERNAL SYSTEM EXECUTOR" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Clean Development Environment ----
$rebuildCache = $false
Write-Host "Apakah Anda ingin membangun ulang cache? (Sangat direkomendasikan jika ada perubahan file .env / config)" -ForegroundColor Cyan
Write-Host ">> Tekan [Y] dalam 3 detik untuk membangun ulang cache..." -ForegroundColor Yellow
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

Push-Location $projectRoot
if ($rebuildCache) {
    Write-Host "[CLEAN] Membersihkan cache lama untuk mencegah konflik path Windows vs WSL..." -ForegroundColor Yellow
    try {
        # Step 1: Clear ALL cache from both Windows & WSL context
        php artisan optimize:clear
        Write-Host "  [OK] Cache Windows dibersihkan" -ForegroundColor Green
        
        # Step 2: Rebuild cache via WSL context (CRITICAL - RoadRunner uses /mnt/d/ paths)
        Write-Host "[OPTIMIZE] Membangun cache di konteks WSL secara terpadu..." -ForegroundColor Yellow
        wsl sh -c "php artisan route:clear && php artisan config:cache && php artisan event:cache && php artisan view:clear && php artisan filament:cache-components"
        Write-Host "  [OK] Config, Event, Filament cached & Views cleared (WSL context)" -ForegroundColor Green
        
        Write-Host "[OPTIMIZE] OPcache CLI + JIT aktif untuk RoadRunner Workers" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Gagal mengoptimalkan cache otomatis." -ForegroundColor Yellow
    }
} else {
    Write-Host "[SKIP] Melewati pembangunan cache untuk startup instan (0.1 detik)..." -ForegroundColor Green
}
Pop-Location
Write-Host ""

# ---- Port Cleaning: Bebaskan port yang bentrok ----
$ports = @(3000, 5090, 5100, 5120, 5173, 5400)
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

# ---- Backend: Deteksi WSL & Laragon Apache ----
$wslRunning = $false
try {
    $wslCheck = wsl -l -v 2>$null | Out-String
    # Mengatasi bug encoding UTF-16 LE dari WSL di PowerShell (menghilangkan null bytes)
    $wslCheckClean = $wslCheck -replace [char]0, ""
    if ($wslCheckClean -match "Ubuntu") {
        $wslRunning = $true
    }
} catch {
    $wslRunning = $false
}

$apacheRunning = Get-Process httpd -ErrorAction SilentlyContinue

if ($wslRunning) {
    Write-Host "[BACKEND] Lingkungan WSL (Ubuntu) Terdeteksi!" -ForegroundColor Green
    Write-Host "          Laravel Octane (RoadRunner) akan dijalankan sebagai server backend utama (HIGH PERFORMANCE)" -ForegroundColor Cyan
} elseif ($apacheRunning) {
    Write-Host "[BACKEND] Laragon Apache sudah berjalan di port 5090 (mod_php + OPcache)" -ForegroundColor Green
    Write-Host "          Jika belum, buka Laragon > Start All Services" -ForegroundColor DarkGray
} else {
    Write-Host "[BACKEND] WSL & Laragon Apache tidak terdeteksi!" -ForegroundColor Red
    Write-Host "          Akan menggunakan fallback server: php artisan serve --port=5090" -ForegroundColor Yellow
}
Write-Host ""

# Mencari lokasi wt.exe secara paksa jika tidak ada di PATH
$wtPath = "wt.exe"
if (!(Get-Command wt -ErrorAction SilentlyContinue)) {
    $wtPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\wt.exe"
}

if (Test-Path $wtPath) {
    Write-Host "[INFO] Windows Terminal terdeteksi. Menambahkan tab ke jendela ini..." -ForegroundColor Green

    # Backend Launching Logic
    if ($wslRunning) {
        Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$projectRoot`" --title `"OCTANE-WSL`" cmd /k `"wsl php artisan octane:start --workers=4 --port=5090`""
    } elseif (!$apacheRunning) {
        Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$projectRoot`" --title `"BACKEND`" cmd /k `"php artisan serve --port=5090`""
    }

    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$projectRoot`" --title `"QUEUE`" cmd /k `"php artisan queue:listen`""
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$projectRoot`" --title `"REVERB`" cmd /k `"php artisan reverb:start`""
    $systemAdminPath = Join-Path $projectRoot "system-admin-panel"
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$systemAdminPath`" --title `"SYSTEM-ADMIN`" cmd /k `"npm run dev`""
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$projectRoot`" --title `"VITE-BACKEND`" cmd /k `"npm run dev`""
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$shopfloorPath`" --title `"SHOPFLOOR`" cmd /k `"npm run dev`""
    Start-Process $wtPath -ArgumentList "-w 0 nt -d `"$frontendPath`" --title `"FRONTEND-ERP`" cmd /k `"npm run dev -- -p 3000`""
} else {
    Write-Host "[WARN] Windows Terminal tidak ditemukan. Membuka Multi-Window..." -ForegroundColor Yellow

    $systemAdminPath = Join-Path $projectRoot "system-admin-panel"
    Start-Process cmd -ArgumentList "/k cd /d `"$systemAdminPath`" && npm run dev" -WindowStyle Normal
    
    if ($wslRunning) {
        Start-Process cmd -ArgumentList "/k cd /d `"$projectRoot`" && wsl php artisan octane:start --workers=4 --port=5090" -WindowStyle Normal
    } elseif (!$apacheRunning) {
        Start-Process cmd -ArgumentList "/k cd /d `"$projectRoot`" && php artisan serve --port=5090" -WindowStyle Normal
    }
    
    Start-Process cmd -ArgumentList "/k cd /d `"$projectRoot`" && php artisan queue:listen" -WindowStyle Normal
    Start-Process cmd -ArgumentList "/k cd /d `"$projectRoot`" && php artisan reverb:start" -WindowStyle Normal
    Start-Process cmd -ArgumentList "/k cd /d `"$projectRoot`" && npm run dev" -WindowStyle Normal
    Start-Process cmd -ArgumentList "/k cd /d `"$shopfloorPath`" && npm run dev" -WindowStyle Normal
    Start-Process cmd -ArgumentList "/k cd /d `"$frontendPath`" && npm run dev -- -p 3000" -WindowStyle Normal
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  SISTEM ERP TELAH DIAKTIFKAN!" -ForegroundColor Green
Write-Host "  --------------------------------------------------"
Write-Host "  Frontend ERP: http://localhost:3000"
Write-Host "  Backend:      http://localhost:5090/admin"
Write-Host "  Admin Panel:  http://localhost:5120/system"
Write-Host "  Shop Floor:   http://localhost:5400"
Write-Host "  WebSocket:    Port 5100"
Write-Host "  Vite HMR:     Port 5173"
Write-Host "  --------------------------------------------------"
if ($wslRunning) {
    Write-Host "  Server:  Laravel Octane + RoadRunner WSL (OPcache CLI + JIT)" -ForegroundColor Green
} elseif ($apacheRunning) {
    Write-Host "  Server:  Apache + mod_php + OPcache (HIGH PERF)" -ForegroundColor Cyan
} else {
    Write-Host "  Server:  artisan serve (fallback)" -ForegroundColor Yellow
}
Write-Host "  Cache:   Config, Event, View, Filament cached (WSL context)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""

# ---- Auto Warm-up Workers (Background) ----
if ($wslRunning) {
    Write-Host "[WARMUP] Menunggu Octane siap, lalu memanaskan semua RoadRunner workers..." -ForegroundColor Yellow
    Write-Host "         (Proses ini berjalan di background, Anda bisa langsung bekerja)" -ForegroundColor DarkGray
    
    # Run warmup in background after 15s delay for Octane to fully start
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 15
        wsl bash /mnt/d/HBM/Project/ERP_INTERNAL_HBM/warmup-workers.sh 5090
    } | Out-Null
}

