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
- Mengelola data entitas: Legal Entity (Entitas Legal - pengganti istilah Company internal agar tidak rancu dengan Tenant level atas), Branch, Department, Division, Position, Grade, dan **Cost Center** (Pusat Biaya).
- Menyediakan **Bagan Organisasi (Org Chart)** interaktif berbasis Drag-and-Drop HTML5 API untuk memvisualisasikan reporting line dan memicu draf mutasi secara visual.
- Melakukan pencegahan circular dependency pada struktur department hirarkis, serta pencegahan relasi sirkular atasan/bawahan di Bagan Organisasi (atasan tidak boleh melapor ke bawahannya sendiri).

### 3. Employee Management
- Berfungsi sebagai database profil karyawan lengkap (personal info, family, education, work experience, serta **Emergency Contacts** / kontak darurat pendukung).
- Menyimpan data tambahan profil: divisi, grade, dan supervisor (`reports_to`).
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

### 5. Employee Lifecycle & Onboarding
- Mengelola seluruh siklus hidup karir karyawan melalui **Lifecycle Events** (tipe: Promotion, Demotion, Transfer, Termination).
- Eksekusi event karir secara otomatis memperbarui data profil karyawan (departemen, jabatan, divisi, grade, status) di database dan melacak riwayat karir secara dinamis.
- Mengelola **Onboarding Checklist** untuk karyawan baru, melacak progres tugas orientasi secara real-time dengan status kelengkapan.

### 6. Attendance & Leave
- Mengelola check-in / check-out karyawan dan shift kerja.
- Mengelola alur pengajuan cuti pelamar dengan penghitungan sisa kuota cuti tahunan otomatis.

### 7. Document & Reports
- Unggah file CV resume dan dokumen pendukung secara aman ke storage terisolasi per tenant (MinIO/S3).
- Ekspor laporan data karyawan, kehadiran, dan cuti dalam format file CSV.

### 8. Training Management (M08)
- Mengelola katalog master program pelatihan (Internal/External) dengan pembagian kategori track (`Leadership`, `Technical`, `Safety`, `Compliance`).
- Mengatur penjadwalan kelas training (Training Sessions) lengkap dengan penugasan trainer, alokasi ruang kelas (venue), tanggal pelaksanaan, dan pengelolaan daftar peserta (roster).
- Memfasilitasi input presensi kehadiran kelas (`Attended`, `Absent`) dan evaluasi penilaian nilai hasil ujian peserta dengan status kelulusan (`Pass`, `Fail`).

### 9. Certification Management (M09)
- Mengelola data master sertifikasi profesi beserta masa berlaku lisensi.
- Menyediakan matriks kepatuhan sertifikasi posisi jabatan (Certification Matrix), memetakan jabatan tertentu yang diwajibkan secara hukum/kontrak memiliki sertifikasi tertentu (contoh: Staff QC wajib memiliki sertifikat HACCP).
- Mengelola catatan sertifikat karyawan (Employee Certifications) dengan pengunggahan dokumen PDF/Image bukti kelulusan ke S3/MinIO per tenant, serta melacak masa kedaluwarsa lisensi secara proaktif (Alerts 90, 60, 30, 7 hari).

### 10. Payroll & Compensation
- Mengelola komponen penggajian (gaji pokok, tunjangan, potongan BPJS, PPh 21) dan peminjaman kasbon karyawan secara terpusat.
- Kalkulasi bulanan otomatis berbasis PPh 21 TER (Tarif Efektif Rata-rata) dengan metode Gross, Nett, dan Gross-Up.
- Siklus periode gaji bulanan yang terstruktur: Kalkulasi Batch -> Review Hasil -> Approval Direksi -> Kunci/Lock Periode -> Bank Export File Transfer Mandiri/BCA.

### 11. Workflow Engine (Fase 3)
- Mengotomatisasi alur persetujuan dokumen transaksi (seperti Cuti, Klaim Reimbursement, Rekrutmen, dan Gaji) melalui alur bertingkat dinamis.
- Menggunakan visual **Drag & Drop Builder** berbasis HTML5 API bawaan browser untuk mempermudah penyusunan langkah approval.
- Validasi otorisasi approver yang fleksibel berdasarkan: Spesifik User, Role Jabatan, Atasan Langsung (`reports_to`), dan Kepala Departemen (`department_head`).
- Pengecekan kondisi dinamis (**Condition Expression**) secara real-time terhadap field target model (contoh: ajukan langkah eskalasi tambahan jika `total_days` cuti > 5 atau nominal `amount` klaim > 1.000.000).

### 12. Audit Trail & Security (Fase 3)
- Perekaman log audit perubahan database otomatis (Audit Trail) untuk seluruh model yang mewarisi `BaseModel`. Setiap aksi (Created, Updated, Deleted, Restored) dicatat beserta detail nilai lama vs nilai baru (JSON Diff Viewer).
- Pelacakan riwayat login sukses dan gagal beserta deteksi perangkat baru (User-Agent fingerprinting) dan estimasi lokasi geografis IP.
- Penguatan sisi keamanan sesi pengguna lewat deteksi sesi idle (tanpa aktivitas keypress/mousemove) selama 30 menit, memunculkan modal hitung mundur 5 menit terakhir, dan auto-logout paksa.
- **Compliance Service** terintegrasi untuk melacak data kepatuhan kontrak kerja karyawan (`end_date`) dan sertifikasi profesi (`expired_date`) yang akan kedaluwarsa dalam N hari ke depan.

### 13. Performance Management (Fase 4)
- Mengelola penilaian kinerja berkala melalui siklus **Appraisal**: Evaluasi Mandiri (Self-Review), Tinjauan Manajer (Manager Review), dan Kalibrasi HR (HR Calibration).
- **KPI & Target Weights**: Menugaskan bobot target KPI per karyawan dengan formula hitung score otomatis sesuai arah pengukuran (*Higher Better*, *Lower Better*, *Target Exact*).
- **Performance Improvement Plan (PIP)**: Mengotomatiskan pembuatan lembar pemulihan kinerja aktif selama 90 hari apabila rating penilaian appraisal karyawan di bawah batas minimum (Unsatisfactory/Below Standard).

### 14. Disciplinary Management (Fase 4)
- Pencatatan laporan kasus tata tertib staf dengan kode penomoran unik `CASE/{YEAR}/{MONTH}/{AUTO_INCREMENT}`.
- Perekaman **Berita Acara Pemeriksaan (BAP)** investigasi untuk mengumpulkan kesaksian dan bukti-bukti temuan fisik/rekaman.
- Penerbitan Surat Peringatan (SP1, SP2, SP3) dengan kalkulasi tanggal kedaluwarsa otomatis **+6 bulan** sejak diterbitkan.

### 15. Talent & Career Management (Fase 4)
- **Kompetensi & Matriks Keahlian**: Penilaian kompetensi soft/hard skills dan pemetaan visual skill matrix heatmap.
- **Career Tree**: Visualisasi rute pohon jabatan yang menunjukkan jalur suksesi dan promosi jabatan di perusahaan.
- **9-Box Grid**: Mengelompokkan suksesor potensial secara visual berdasarkan plotting nilai Performa vs Potensi.

### 16. Employee Engagement (Fase 5)
- **Survei & Pulse**: Pembuat survei dinamis dengan kuesioner berskala (1-5) atau isian text, lengkap dengan visualisasi grafik hasil respons.
- **Suggestion Box (Kotak Saran)**: Mengirimkan keluhan atau saran secara anonim/terbuka, dan memfasilitasi tindak lanjut respons/resolusi dari divisi HR.
- **Awards Wall (Dinding Penghargaan)**: Pengakuan apresiasi publik atas prestasi karyawan (contoh: Employee of the Month).

### 17. Asset Management (Fase 5)
- Registri inventaris aset kantor (nomor aset, model, kategori, kondisi, dan status ketersediaan).
- Log penugasan peminjaman aset (Check-out) dan pengembalian (Return) lengkap dengan unggahan Berita Acara Serah Terima (BAST).

### 18. Penyempurnaan Celah Fitur Modul (Gaps Fitur - Fase 5)
- **Kehadiran & Cuti**: Pelacakan GPS logs (koordinat map latitude/longitude) pada log absen check-in/out, pengajuan koreksi absen, lembur dinamis, dan carry-forward sisa cuti tahunan otomatis.
- **Wawancara & Evaluasi Rekrutmen**: Unggah CV kandidat, pencatatan wawancara, dan evaluasi detail interviewer berbasis kriteria (Teknis, Komunikasi, Sikap) dan skor keseluruhan 1-5.
- **Dokumen & Versi**: Pencatatan versi dokumen historis (`document_versions`) untuk memulihkan atau meninjau berkas terdahulu serta pelacakan tanggal kedaluwarsa berkas.

---

### 🎨 Design Aesthetics & Visual Utilities
- **Vanta.js Integration**: Menyediakan component React `VantaBackground.tsx` yang modular untuk merender animasi latar belakang 3D WebGL (Net, Waves, Fog, Clouds, Halo, Rings, Globe) secara dinamis pada client-side (menggunakan dynamic imports untuk optimasi SSR Next.js).
