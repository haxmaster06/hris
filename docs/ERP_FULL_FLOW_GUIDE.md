# 🏢 ERP Full Flow Guide — Universal HRIS Platform (Nexus HR)

Dokumen ini berfungsi sebagai panduan utama fungsional dan teknis alur proses bisnis di platform Nexus HR.

---

## 🗺️ Peta & Daftar Modul

Sistem terdiri dari modul-modul modular monolith berikut:

```
Platform Modules
├── M01: Identity & Access Management (IAM)
├── M02: Organization Management
├── M03: Employee Management
├── M04: Recruitment Management (Sprint 2.1)
├── M05: Onboarding Management
├── M06: Attendance Management
├── M07: Leave Management
├── M08: Training Management
├── M09: Certification Management
├── M10: Performance Management
├── M11: Disciplinary Management
├── M12: Document Management
├── M13: Asset Management
├── M14: Payroll Management
├── M15: Offboarding Management
├── M16: Notification Center
├── M17: Reporting & Analytics
└── M18: Audit & Compliance
```

---

## ⚙️ Detail per Modul & Alur Integrasi Data

### 1. Identity & Access Management (IAM)
- Mengelola autentikasi berbasis JWT (tymon/jwt-auth) dengan otorisasi berbasis Role & Permission (Spatie) yang dikelola melalui antarmuka tab "Roles & Permissions" (CRUD Role dan mapping Hak Akses).
- Mengamankan modifikasi role `Super Admin` sehingga hanya user ber-role `Super Admin` yang dapat membuat, mengubah, atau menghapus user `Super Admin`.
- Memiliki gerbang pusat **"High Level Control"** (menggantikan nama Landlord Console) pada URL `/high-level-control` untuk mengelola tenant, yang diproteksi ketat dan hanya dapat diakses oleh user ber-role `Super Admin`.
- Menggunakan middleware tenant (`InitializeTenancy`) untuk switch schema database PostgreSQL secara otomatis berdasarkan header request.

### 2. Organization Management
- Mengelola data entitas: Legal Entity (Entitas Legal - pengganti istilah Company internal agar tidak rancu dengan Tenant level atas), Branch, Department, Division, Position, dan Grade.
- Melakukan pencegahan circular dependency pada struktur department hirarkis.

### 3. Employee Management
- Berfungsi sebagai database profil karyawan lengkap (personal info, family, education, work experience).
- Mengelola riwayat karir (`employee_histories`) secara otomatis jika terjadi perubahan posisi, grade, department, branch, atau status kerja.

### 4. Recruitment Management (Sprint 2.1)
Modul rekrutmen mengelola siklus pencarian talenta kerja baru dengan alur:
```
Vacancy Created (Draft) ──> Published ──> Candidate Applies (Job Application)
                                                       │
                                                       ▼
                                            Screening & Evaluation
                                                       │
                                                       ▼
                                            Interview & Scoring
                                                       │
                                                       ▼
                                             Offering Negotiation
                                                       │
                                                       ▼
                                            Hiring Approval Process (HR -> Manager -> Director)
                                                       │
                                                       ▼
                                           Approved ──> Auto-Create Employee
```
- **Persetujuan Penerimaan (Hiring Approval)**: Proses bertingkat yang memerlukan persetujuan dari HR, Manager departemen terkait, dan persetujuan akhir dari Direktur.
- **Pembuatan Karyawan Otomatis**: Ketika Direktur menyetujui tahap akhir, sistem memanggil `EmployeeService` untuk meng-onboard kandidat sebagai karyawan baru (status default: `probation`) dan menghasilkan Nomor Karyawan (`EMP-XXXXXX`) secara otomatis.

### 5. Attendance & Leave
- Mengelola check-in / check-out karyawan dan shift kerja.
- Mengelola alur pengajuan cuti pelamar dengan penghitungan sisa kuota cuti tahunan otomatis.

### 6. Document & Reports
- Unggah file CV resume dan dokumen pendukung secara aman ke storage terisolasi per tenant (MinIO/S3).
- Ekspor laporan data karyawan, kehadiran, dan cuti dalam format file CSV.

### 7. Training Management (M08)
- Mengelola katalog master program pelatihan (Internal/External) dengan pembagian kategori track (`Leadership`, `Technical`, `Safety`, `Compliance`).
- Mengatur penjadwalan kelas training (Training Sessions) lengkap dengan penugasan trainer, alokasi ruang kelas (venue), tanggal pelaksanaan, dan pengelolaan daftar peserta (roster).
- Memfasilitasi input presensi kehadiran kelas (`Attended`, `Absent`) dan evaluasi penilaian nilai hasil ujian peserta dengan status kelulusan (`Pass`, `Fail`).

### 8. Certification Management (M09)
- Mengelola data master sertifikasi profesi beserta masa berlaku lisensi.
- Menyediakan matriks kepatuhan sertifikasi posisi jabatan (Certification Matrix), memetakan jabatan tertentu yang diwajibkan secara hukum/kontrak memiliki sertifikasi tertentu (contoh: Staff QC wajib memiliki sertifikat HACCP).
- Mengelola catatan sertifikat karyawan (Employee Certifications) dengan pengunggahan dokumen PDF/Image bukti kelulusan ke S3/MinIO per tenant, serta melacak masa kedaluwarsa lisensi secara proaktif (Alerts 90, 60, 30, 7 hari).

---

### 🎨 Design Aesthetics & Visual Utilities
- **Vanta.js Integration**: Menyediakan component React `VantaBackground.tsx` yang modular untuk merender animasi latar belakang 3D WebGL (Net, Waves, Fog, Clouds, Halo, Rings, Globe) secara dinamis pada client-side (menggunakan dynamic imports untuk optimasi SSR Next.js).
