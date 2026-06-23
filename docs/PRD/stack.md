🔷 FRONTEND
Next.js (App Router)
TypeScript
TailwindCSS
TanStack Query (server state)
Zustand (client state ringan)
ShadCN UI (opsional, tapi dimodif total biar gak generic)
React Hook Form + Zod

Kenapa ini cocok:

SSR + SPA hybrid (HRIS butuh speed + SEO internal tools gak penting)
gampang modular per module (Employee, Payroll, dll)
siap dipisah ke microfrontend kalau nanti gede
🔷 BACKEND
Laravel 11/12 (API-first mode)
PHP 8.3+
Modular Monolith architecture (WAJIB)
Spatie Permission (RBAC cepat jadi)
Laravel Horizon (queue management)

Kenapa Laravel:

HRIS itu CRUD heavy + workflow heavy
Laravel paling cepat buat complex business logic
cocok untuk evolusi ke microservices
🔷 DATABASE
PostgreSQL (WAJIB, jangan MySQL kalau serius enterprise)

Tambahan:

Row Level Security (RLS)
UUID v7 primary key
JSONB untuk fleksibilitas HR attributes
🔷 CACHE + QUEUE
Redis

Dipakai untuk:

session
queue payroll
notification
caching report
🔷 FILE STORAGE
S3 Compatible Storage
AWS S3 / MinIO
🔷 SEARCH ENGINE (optional tapi powerful)
OpenSearch / Elasticsearch

Dipakai untuk:

employee search
candidate search
document search
🔷 REALTIME / EVENT
Redis Streams (MVP)
Kafka (kalau sudah enterprise scale)
🔷 DEVOPS
Docker (mandatory)
Kubernetes (phase 2+)
Nginx / Traefik
GitHub Actions CI/CD
🔷 MONITORING
Grafana
Prometheus
Sentry (frontend + backend error tracking)
Loki (logs)
🧱 ARSITEKTUR YANG HARUS DIPAKAI
PHASE 1 (sekarang lo harus ini)

Modular Monolith

Struktur:

backend/
 ├── Modules/
 │    ├── Employee
 │    ├── Payroll
 │    ├── Attendance
 │    ├── Recruitment
 │    ├── Training
 │    ├── Core (Auth, Tenant, RBAC)

RULE:

tidak boleh cross module direct DB access
komunikasi via service layer
PHASE 2

Event-driven monolith

Tambah:

domain_events table
queue workers
async processing
PHASE 3

Microservices split

Pisah jadi:

employee-service
payroll-service
attendance-service
notification-service

🧠 STRATEGIC INSIGHT (INI YANG PENTING)

HRIS itu 70%:

Workflow + Permission + Reporting

bukan:

UI atau fancy frontend

Jadi stack harus optimize ke:

1. Complex authorization

→ Laravel + Spatie + custom policy

2. Complex reporting

→ PostgreSQL + materialized view

3. Workflow engine

→ event + queue + state machine

🚀 FINAL ARCHITECTURE SUMMARY
[Next.js Frontend]
        ↓
   [API Gateway]
        ↓
[Laravel Modular Monolith]
        ↓
 ├── PostgreSQL (core data)
 ├── Redis (cache + queue)
 ├── S3 (documents)
 ├── OpenSearch (search)