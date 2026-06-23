# 🏢 Universal HRIS Platform (Nexus HR)

> Enterprise Human Resource Information System — Modular Monolith Architecture

---

## 📋 Overview

Universal HRIS (Nexus HR) adalah platform Human Resource Information System (HRIS) tingkat perusahaan yang dirancang dengan arsitektur **Modular Monolith** menggunakan **Laravel 12** di backend dan **Next.js 16 (LTS)** di frontend. Platform ini mendukung multi-tenancy dengan isolasi tingkat database schema (**schema-per-tenant**) menggunakan PostgreSQL.

Seluruh backend dasar untuk Phase 1 MVP telah selesai 100% dan seluruh 67 unit/feature tests berjalan hijau (PASSED).

---

## 🛠️ Technology Stack & Port Configuration

| Layer | Technology | Version | Port | Description |
|-------|------------|---------|------|-------------|
| **Frontend** | Next.js | 16.x (LTS) | `3030` | App Router, TypeScript, TailwindCSS v4 |
| **Backend** | Laravel | 12.x | `7030` | Core API Framework |
| **Database** | PostgreSQL | 16.x | `5432` | Schema-per-tenant support |
| **Caching/Queue** | Redis | 7.x | `6379` | Cache, Horizon Queue, Session |
| **Storage** | MinIO / S3 | - | `9000` / `9001` | Secure file upload & versioning |
| **Auth** | Custom JWT | - | - | Custom auth via `tymon/jwt-auth` |

---

## 📂 Project Structure

```text
hris-platform/
├── apps/
│   ├── api/                    # Laravel 12 Backend API
│   │   ├── Modules/            # Modular Monolith Resource Groups
│   │   │   ├── Core/           # Auth, Tenant, User, RBAC
│   │   │   ├── Organization/   # Company, Branch, Department, Position, etc.
│   │   │   ├── Employee/       # Employee Personal Details & Sub-resources
│   │   │   ├── Attendance/     # Clock-in/out, Shifts & Log Tracking
│   │   │   ├── Leave/          # Leave Requests, Balance & Approvals
│   │   │   ├── Document/       # S3 Isolated Uploads & Signed URL Vault
│   │   │   └── Report/         # Employee, Attendance, & Leave Reports
│   └── web/                    # Next.js 16 Frontend
├── docs/                       # Documentation & PRDs
├── .plans/                     # Step-by-step Technical Planning Files
├── infra/                      # Infrastructure & Docker setups
└── Mockup/                     # Stitch UI Mockup reference
```

---

## 🚀 Quick Start: Server Launcher

Kami menyediakan script launcher otomatis di root folder proyek untuk mempermudah menjalankan seluruh server yang dibutuhkan secara instan.

### Windows (Double-Click Launcher)
Cukup jalankan file **`JALANKAN_HRIS_SYSTEM.bat`** di folder root proyek. File ini akan otomatis memanggil PowerShell script `start-hris-servers.ps1`.

### Fitur Otomatis Launcher:
1. **Laravel Cache Clear Prompt**: Menawarkan pembersihan cache instan dalam 3 detik pertama sebelum menjalankan server.
2. **Port Conflict Checker**: Memeriksa port `3030` (Frontend) dan `7030` (Backend). Jika ada proses lain yang menggunakannya, launcher akan otomatis menghentikan (`kill`) proses tersebut demi mencegah konflik.
3. **Windows Terminal Integration**: Secara otomatis mendeteksi jika Windows Terminal (`wt`) terpasang untuk membuka tiga tab terpisah:
   * **Tab 1**: Backend API Server (`php artisan serve --port=7030`)
   * **Tab 2**: Queue Worker (`php artisan queue:listen`)
   * **Tab 3**: Frontend Web Server (`npm run dev -- -p 3030`)
   * *Jika Windows Terminal tidak terdeteksi, launcher akan otomatis membuka multi-window Command Prompt (`cmd.exe`) biasa.*

---

## ⚙️ Manual Local Installation

### Prerequisites
- Docker & Docker Compose
- PHP 8.4+ & Composer
- Node.js 20+ & npm/pnpm

### Step-by-Step Setup

1. **Jalankan Docker Infrastructure**:
   ```bash
   docker-compose up -d
   ```
   *Layanan database PostgreSQL, Redis, Mailpit, dan MinIO akan aktif di background.*

2. **Backend Setup (apps/api)**:
   ```bash
   cd apps/api
   cp .env.example .env
   composer install --ignore-platform-reqs
   php artisan key:generate
   php artisan jwt:secret
   ```

3. **Database Central Migration & Seeding**:
   ```bash
   php artisan migrate --seed
   ```
   *Ini akan mempersiapkan database pusat (Central Landlord DB) dan menyuntikkan user admin awal.*

4. **Running Tests**:
   ```bash
   php artisan test
   ```
   *Seluruh 67 test suite fitur integrasi dan unit test harus berjalan hijau.*

5. **Frontend Setup (apps/web)**:
   ```bash
   cd ../web
   npm install
   ```

---

## 🔒 Security & Compliance
- **Authentication**: JWT token disimpan di secure `httpOnly` cookie dengan rotasi refresh token.
- **Authorization**: Role-Based Access Control (RBAC) via Spatie Laravel Permission (berbasis UUID v7).
- **Tenant Isolation**: Kuat dengan PostgreSQL schema-per-tenant (`stancl/tenancy`). Berkas terunggah diisolasi menggunakan format path S3 per tenant.
- **Audit Trails**: Log aktivitas immutable untuk kepatuhan compliance yang mencatat setiap operasi mutasi (Create, Update, Delete).
