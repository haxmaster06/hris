# 🏢 Universal HRIS Platform (Nexus HR)

> Enterprise Human Resource Information System — Modular Monolith Architecture

---

## 📋 Overview

Universal HRIS (Nexus HR) adalah platform Human Resource Information System (HRIS) tingkat perusahaan yang dirancang dengan arsitektur **Modular Monolith** menggunakan **Laravel 12** di backend dan **Next.js 16 (LTS)** di frontend. Platform ini mendukung multi-tenancy dengan isolasi tingkat database schema (**schema-per-tenant**) menggunakan PostgreSQL.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Description |
|-------|------------|---------|-------------|
| **Backend** | Laravel | 12.x | Core API Framework |
| **Language (BE)** | PHP | 8.4+ | Type safety & performance |
| **Frontend** | Next.js | 16.x (LTS) | App Router, TypeScript |
| **Database** | PostgreSQL | 16.x | Schema-per-tenant support |
| **Caching/Queue** | Redis | 7.x | Cache, Horizon Queue, Session |
| **Storage** | MinIO / S3 | - | Secure file upload & versioning |
| **Auth** | Custom JWT | - | Custom auth via `tymon/jwt-auth` |

---

## 📂 Project Structure

```text
hris-platform/
├── apps/
│   ├── api/                    # Laravel 12 Backend
│   └── web/                    # Next.js 16 Frontend
├── docs/                       # Documentation & PRDs
│   └── PRD/                    # Product Requirement Documents
├── infra/                      # Infrastructure & Docker setups
│   └── docker/
└── Mockup/                     # Stitch UI Mockup reference
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- PHP 8.4+ & Composer
- Node.js 20+ & npm/pnpm

### Setup Development Environment
*(Detail instalasi dan setup local akan diperbarui seiring berjalannya bootstrapping)*

1. Clone repository:
   ```bash
   git clone https://github.com/haxmaster06/hris.git
   cd hris
   ```
2. Setup environment files dan jalankan docker services:
   ```bash
   # Masuk ke infra/docker atau setup root compose
   docker-compose up -d
   ```

---

## 🔒 Security & Compliance
- **Authentication**: JWT token disimpan di secure `httpOnly` cookie dengan rotasi refresh token.
- **Authorization**: Role-Based Access Control (RBAC) via Spatie Laravel Permission.
- **Tenant Isolation**: Kuat dengan PostgreSQL schema-per-tenant (`stancl/tenancy`).
- **Audit Trails**: Log aktivitas immutable untuk kepatuhan compliance.
