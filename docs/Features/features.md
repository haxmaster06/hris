# 📋 Nexus HR — Module & Feature List

Nexus HR dirancang dengan pendekatan modular yang komprehensif, mendukung pengelolaan seluruh siklus kerja karyawan mulai dari perekrutan hingga offboarding (Joiner-Mover-Leaver).

---

## 🗺️ Ringkasan Kategori Modul

Berikut adalah pemetaan modul-modul Nexus HR berdasarkan kategori fungsionalnya:

| Kategori | No. | Modul Utama | Cakupan Fitur Utama |
| :--- | :--- | :--- | :--- |
| **Core HR & Lifecycle** | 1, 14, 19 | 🏢 Core HR <br> 📂 Document Management <br> 🔄 Employee Lifecycle | Organization, Employee Profile, ESS, Dokumen Kepegawaian, Joiner-Mover-Leaver |
| **Talent & Development** | 2, 7, 8, 9 | 📢 Recruitment / ATS <br> 🎓 Learning & Development <br> 📜 Certification <br> 🧠 Talent Management | Vacancy, Candidates, Onboarding, Training, Sertifikasi, Skill Matrix, Career Path |
| **Time & Attendance** | 3, 4 | 🕒 Attendance Management <br> 📅 Leave & Time Off | Check In/Out, GPS/Face Recognition, Shift, Cuti, Public Holidays, Calendars |
| **Compensation & Payroll** | 5, 12 | 💸 Payroll <br> 🎁 Compensation & Benefits | Basic Salary, Allowances, Tax/BPJS, Payroll Run, Reimbursement, Claims |
| **Performance & Engagement** | 6, 10, 11 | 🎯 Performance Management <br> 🏆 Employee Engagement <br> ⚠️ Disciplinary | KPI, Performance Review, Appraisal, Surveys, Feedback, SP1-SP3, Investigation |
| **Governance & Security** | 13, 15, 16, 17, 18 | 📦 Asset Management <br> 🔁 Workflow Engine <br> 📈 Reporting & Analytics <br> 🔍 Compliance & Audit <br> 🔐 Security & Access Control | Asset Registry/Assignment, Approval Flow, Operational Reports, Audit Trail, RBAC, MFA |
| **Integration** | 20 | 🔗 Integration | Payroll Bank, Accounting, ERP, Biometric Devices, LDAP, WhatsApp Gateway |

---

## ⚙️ Rincian Fitur Per Modul

### 1. Core HR

#### 🏢 Organization Management
* **Multi-Company** — Pengelolaan multi-perusahaan/tenant secara terisolasi.
* **Multi-Branch** — Pengelolaan banyak cabang di bawah perusahaan yang sama.
* **Hierarchical Structure** — Konfigurasi Department, Division, Position, dan Job Grade.
* **Cost Center** — Pengelompokan pusat biaya untuk alokasi budget dan payroll.
* **Reporting Structure** — Definisi garis pelaporan (atasan langsung/indirect).
* **Organization Chart** — Visualisasi bagan organisasi secara interaktif.

#### 👥 Employee Management
* **Employee Master Data** — Database terpusat informasi karyawan.
* **Employee Numbering** — Sistem penomoran otomatis nomor induk karyawan (NIK).
* **Employment Status** — Pengelolaan status kerja (Permanent, Contract, Internship, Probation).
* **Employee Profile** — Detail profil lengkap termasuk data pribadi dan kontak.
* **Family Information** — Data anggota keluarga untuk kebutuhan benefit/pajak.
* **Education History** — Riwayat pendidikan formal dan informal.
* **Work Experience** — Riwayat pengalaman kerja sebelum bergabung.
* **Emergency Contact** — Kontak darurat karyawan yang dapat dihubungi.
* **Employment History** — Log riwayat perubahan kontrak kerja.
* **Promotion & Transfer History** — Log riwayat promosi, mutasi, dan demosi.
* **Salary History** — Rekaman riwayat penyesuaian gaji karyawan.
* **Employee Timeline** — Lini masa perjalanan karier karyawan dari masuk hingga keluar.

#### 💻 Employee Self Service (ESS)
* **Profile Update** — Pengajuan pembaruan data mandiri oleh karyawan.
* **View Payslip** — Akses dan download slip gaji bulanan secara mandiri.
* **Apply Leave** — Pengajuan cuti dan izin secara online.
* **View Attendance** — Pemantauan riwayat kehadiran pribadi secara real-time.
* **Download Documents** — Akses dokumen kepegawaian pribadi (kontrak, pakta, dll).
* **Submit Requests** — Pengajuan klaim benefit, reimbursement, dan surat keterangan.

---

### 2. Recruitment / ATS

#### 📢 Vacancy Management
* **Job Posting** — Pembuatan lowongan pekerjaan baru (Draft, Publish, Archive).
* **Internal Vacancy** — Publikasi lowongan khusus untuk karyawan internal perusahaan.
* **External Vacancy** — Integrasi lowongan dengan portal karir eksternal.

#### 👤 Candidate Management
* **Candidate Database** — Penyimpanan database pelamar yang masuk ke sistem.
* **Talent Pool** — Pengelompokan kandidat potensial untuk kebutuhan mendatang.
* **Resume Repository** — Penyimpanan dan parsing file resume/CV pelamar.

#### ⚙️ Recruitment Process
* **Screening** — Penyaringan awal kelayakan kandidat berdasarkan kualifikasi.
* **Interview Scheduling** — Penjadwalan interview terintegrasi kalender user/interviewer.
* **Interview Evaluation** — Form penilaian hasil interview terstandarisasi.
* **Assessment Test** — Integrasi tes kompetensi dan psikotes untuk kandidat.
* **Offering Letter** — Pembuatan dan pengiriman surat penawaran kerja otomatis.
* **Hiring Approval** — Alur persetujuan rekrutmen berjenjang sebelum pembuatan karyawan.

#### 🚀 Onboarding
* **Onboarding Checklist** — Daftar tugas persiapan penyambutan karyawan baru.
* **Equipment Preparation** — Permintaan inventaris alat kerja (laptop, id card, meja).
* **Account Provisioning** — Pembuatan akun sistem (Email, HRIS, Akses internal).
* **Orientation Schedule** — Jadwal orientasi dan pengenalan perusahaan.

---

### 3. Attendance Management

#### 🕒 Attendance
* **Check In & Check Out** — Pencatatan waktu masuk dan pulang kerja.
* **Break Time** — Pengelolaan durasi dan kepatuhan waktu istirahat.
* **Attendance Correction** — Pengajuan koreksi absen jika terjadi kendala teknis.

#### 📲 Attendance Methods
* **GPS Geolocation** — Absensi berbasis koordinat lokasi (radius kantor/WFA).
* **QR Code** — Absensi cepat dengan scanning kode QR unik di area kerja.
* **Face Recognition** — Autentikasi kehadiran menggunakan pemindaian wajah.
* **Fingerprint Integration** — Sinkronisasi otomatis data mesin sidik jari fisik.
* **Mobile & Web Attendance** — Fleksibilitas absensi melalui aplikasi mobile dan portal web.

#### 🔄 Shift Management
* **Fixed Shift** — Pengaturan jadwal kerja reguler/tetap.
* **Rotating Shift** — Penjadwalan dinamis/bergilir untuk operasional 24/7.
* **Flexible Shift** — Pengaturan waktu kerja fleksibel berdasarkan total jam kerja.

#### 📊 Attendance Monitoring
* **Late Tracking** — Pemantauan keterlambatan masuk kerja.
* **Early Leave** — Deteksi pulang mendahului jam operasional.
* **Absent Management** — Pengelompokan ketidakhadiran tanpa keterangan (Mangkir).
* **Overtime calculation** — Perhitungan lembur otomatis terintegrasi dengan payroll.

---

### 4. Leave & Time Off

#### 📅 Leave Types
* **Annual Leave** — Kuota cuti tahunan reguler karyawan.
* **Sick Leave** — Izin sakit dengan bukti surat dokter terlampir.
* **Marriage Leave** — Cuti khusus pernikahan karyawan.
* **Maternity & Paternity Leave** — Cuti melahirkan untuk ibu dan cuti mendampingi untuk ayah.
* **Special Leave** — Cuti duka cita, ibadah keagamaan, atau keperluan mendesak lainnya.

#### ⚙️ Leave Features
* **Leave Request** — Formulir pengajuan cuti secara digital.
* **Leave Approval** — Alur persetujuan cuti oleh atasan langsung dan HR.
* **Leave Balance** — Informasi kuota cuti tersisa secara real-time.
* **Leave Carry Forward** — Konfigurasi transfer sisa cuti tahun lalu ke tahun baru.
* **Leave Encashment** — Pencairan sisa kuota cuti menjadi uang tunai (pada payroll).

#### 🗓️ Calendar
* **Public Holiday** — Integrasi hari libur nasional resmi pemerintah.
* **Company Holiday** — Penetapan libur khusus kebijakan internal perusahaan.
* **Team Leave Calendar** — Kalender bersama untuk melihat siapa saja anggota tim yang sedang cuti.

---

### 5. Payroll

#### 💸 Salary Structure
* **Basic Salary** — Gaji pokok berdasarkan perjanjian kontrak kerja.
* **Allowance** — Tunjangan tetap (jabatan, keluarga) dan tidak tetap (transport, makan).
* **Incentive & Bonus** — Kompensasi tambahan berbasis performa atau event tertentu.
* **Deductions** — Potongan gaji (keterlambatan, ketidakhadiran, kasbon).
* **Tax (PPh 21)** — Perhitungan pajak penghasilan karyawan otomatis (Metode Gross/Nett/Mix).
* **Insurance & BPJS** — Potongan BPJS Kesehatan, Ketenagakerjaan (JKK, JK, JHT, JP).
* **Loan & Penalty** — Cicilan pinjaman internal karyawan dan denda kedisiplinan.

#### ⚙️ Payroll Processing
* **Payroll Run** — Pemrosesan kalkulasi gaji masal bulanan secara otomatis.
* **Payroll Approval** — Verifikasi dan persetujuan rekapitulasi gaji oleh manajemen.
* **Payroll Locking** — Penguncian data payroll yang telah disetujui untuk mencegah perubahan data.

#### 📄 Output
* **Payslip** — Slip gaji digital detail yang dikirimkan ke ESS karyawan.
* **Payroll Journal** — Dokumen akuntansi penggajian yang siap di-import ke sistem ERP/Finance.
* **Payroll Report** — Laporan rekapitulasi gaji per departemen atau per perusahaan.

---

### 6. Performance Management

#### 🎯 KPI Management
* **KPI Definition** — Penentuan Key Performance Indicators untuk tiap posisi.
* **KPI Assignment** — Alokasi target KPI ke karyawan secara individual atau tim.
* **KPI Tracking** — Pemantauan progres pencapaian target secara berkala.

#### 📝 Performance Review
* **Self Assessment** — Penilaian mandiri oleh karyawan terhadap kinerjanya.
* **Manager Review** — Evaluasi objektif oleh atasan langsung terhadap bawahan.
* **HR Review** — Review kalibrasi dan validasi oleh departemen HR.

#### ⚖️ Appraisal
* **Annual & Quarterly Review** — Siklus evaluasi performa tahunan atau triwulanan.
* **Rating System** — Pembobotan nilai performa karyawan (contoh: 9-Box Grid, Bell Curve).

#### 🕰️ Performance History
* **Historical Review** — Penyimpanan rekam jejak penilaian performa tahun-tahun sebelumnya.
* **Improvement Plan (PIP)** — Pembuatan rencana aksi perbaikan untuk karyawan underperform.

---

### 7. Learning & Development

#### 🎓 Training Management
* **Internal Training** — Penyelenggaraan kelas pelatihan mandiri oleh perusahaan.
* **External Training** — Pengikutsertaan karyawan pada seminar/pelatihan pihak ketiga.

#### 📋 Training Planning
* **Annual Training Plan** — Rencana program pelatihan kerja dalam satu tahun.
* **Budget Planning** — Alokasi anggaran biaya pengembangan karyawan.

#### 🚀 Training Execution
* **Schedule & Venues** — Pengaturan waktu pelaksanaan dan lokasi kelas pelatihan.
* **Participants** — Pengelolaan daftar peserta pelatihan berdasarkan kebutuhan kompetensi.
* **Attendance Tracking** — Pencatatan absensi peserta di kelas pelatihan.

#### 📊 Evaluation
* **Pre-Test & Post-Test** — Pengujian tingkat pemahaman sebelum dan sesudah pelatihan.
* **Training Effectiveness** — Evaluasi dampak pelatihan terhadap performa kerja di lapangan.

---

### 8. Certification Management

#### 📜 Certification Registry
* **Certificate Number** — Pencatatan nomor lisensi/sertifikat keahlian resmi.
* **Issuer Info** — Rekaman lembaga resmi penerbit sertifikat.
* **Validity Period** — Masa berlaku sertifikat keahlian.

#### 🔍 Tracking
* **Expiry Monitoring** — Deteksi otomatis sertifikat yang mendekati kadaluwarsa.
* **Renewal Reminder** — Notifikasi pengingat perpanjangan sertifikat ke karyawan dan atasan.

#### 🗂️ Competency Matrix
* **Position Requirement** — Syarat sertifikasi wajib untuk memegang jabatan tertentu.
* **Certification Requirement** — Pemetaan gap sertifikasi yang dimiliki vs dibutuhkan.

---

### 9. Talent Management

#### 🧠 Competency Management
* **Skill Matrix** — Pemetaan tingkat keahlian (soft/hard skills) per karyawan.
* **Competency Assessment** — Evaluasi tingkat kompetensi standar jabatan.

#### 📈 Career Path
* **Career Planning** — Pemetaan visual rencana karir jangka panjang karyawan.
* **Promotion Planning** — Jalur promosi berdasarkan hasil appraisal dan penilaian kompetensi.
* **Succession Planning** — Rencana suksesi untuk posisi kunci/strategis.
* **Replacement Candidate** — Identifikasi kandidat internal pengganti.
* **Talent Pool** — Pengelompokan karyawan berkinerja tinggi (High Performers).

#### 🔍 High Potential (HiPo) Tracking
* **HiPo Identification** — Penyaringan karyawan dengan potensi kepemimpinan tinggi.
* **Talent Mapping** — Visualisasi penempatan talenta menggunakan matriks 9-box.

---

### 10. Employee Engagement

#### 📊 Survey
* **Employee Satisfaction Survey** — Survei berkala tingkat kepuasan kerja karyawan.
* **Pulse Survey** — Survei singkat dan cepat untuk topik-topik khusus.

#### 💬 Feedback
* **Suggestion Box** — Saluran kotak saran digital anonim/teridentifikasi.
* **Feedback Submission** — Pengajuan keluhan atau masukan konstruktif ke perusahaan.

#### 🏆 Recognition
* **Employee Awards** — Program penghargaan periodik (contoh: Employee of the Month).
* **Achievement Tracking** — Catatan prestasi dan kontribusi khusus karyawan di luar tugas harian.

---

### 11. Disciplinary Management

#### ⚠️ Warning System
* **Verbal Warning** — Pencatatan teguran lisan formal pertama.
* **SP1, SP2, SP3** — Penerbitan Surat Peringatan tertulis bertingkat dengan konsekuensinya.

#### 🔍 Investigation
* **Incident Recording** — Dokumentasi kronologi pelanggaran tata tertib kerja.
* **Disciplinary Committee Notes** — Rekaman sidang disiplin dan berita acara pemeriksaan.

---

### 12. Compensation & Benefits

#### 🎁 Benefits
* **Health Insurance** — Pengelolaan jaminan asuransi kesehatan swasta.
* **BPJS Management** — Pelaporan kepesertaan BPJS Kesehatan & Ketenagakerjaan.
* **Allowances** — Pengaturan tunjangan makan, transportasi, telekomunikasi, dll.

#### 💳 Claims
* **Medical Claims** — Pengajuan penggantian biaya pengobatan rawat jalan/inap.
* **Reimbursement** — Penggantian biaya operasional dinas/perjalanan bisnis.

#### 💰 Bonus Management
* **Annual Bonus** — Pembagian bonus tahunan berdasarkan kinerja perusahaan.
* **Performance Bonus** — Bonus khusus pencapaian KPI individu melampaui target.

---

### 13. Asset Management

#### 📦 Asset Registry
* **IT Devices** — Katalog perangkat keras kerja (Laptop, Desktop, Monitor).
* **Communication & Mobility** — Inventaris Handphone, Tablet, SIM Card, dan Kendaraan Dinas.

#### 🔄 Asset Assignment
* **Employee Asset Allocation** — Peminjaman aset dinas ke karyawan dengan bukti serah terima (BAST).
* **Asset Return** — Pengembalian aset saat karyawan mutasi atau resign.

---

### 14. Document Management

#### 📂 Employee Documents
* **Identity Files** — Penyimpanan digital dokumen KTP, NPWP, KK, BPJS.
* **Employment Documents** — Arsip digital kontrak kerja (PKWT/PKWTT) dan NDA.
* **Education Files** — Salinan ijazah, transkrip nilai, dan sertifikat kelulusan.

#### ⚙️ Features
* **Secure Upload** — Unggah dokumen aman ke storage terisolasi per tenant (S3/MinIO).
* **Versioning** — Pencatatan riwayat pembaruan dokumen (contoh: perpanjangan kontrak).
* **Expiry Reminder** — Alarm otomatis untuk dokumen yang memiliki masa berlaku terbatas.

---

### 15. Workflow & Approval Engine

#### 🔁 Approval Flow
* **Leave Approval** — Persetujuan izin dan cuti berjenjang.
* **Overtime Approval** — Validasi permintaan lembur sebelum eksekusi.
* **Recruitment Approval** — Alur persetujuan penambahan tenaga kerja baru.
* **Payroll Approval** — Verifikasi berjenjang rekap gaji bulanan.
* **Training Approval** — Izin keikutsertaan pelatihan pengembangan.

#### 🛠️ Workflow Builder
* **Dynamic Approval Level** — Penentuan jumlah tahap approval secara dinamis.
* **Conditional Approval** — Alur persetujuan berdasarkan kriteria tertentu (contoh: nominal klaim, durasi cuti).

---

### 16. Reporting & Analytics

#### 📈 Operational Reports
* **Attendance Report** — Rekap kehadiran, keterlambatan, dan lembur bulanan.
* **Leave Report** — Laporan pemakaian cuti dan sisa saldo cuti.
* **Payroll Report** — Rekapitulasi biaya gaji, pajak PPh 21, dan BPJS.

#### 📊 HR Analytics
* **Turnover Rate** — Analisis tingkat keluar masuk karyawan per departemen.
* **Retention Rate** — Metrik loyalitas karyawan dalam kurun waktu tertentu.
* **Headcount Growth** — Grafik pertumbuhan jumlah tenaga kerja.
* **Training Effectiveness** — ROI dari program pelatihan yang dijalankan.

#### 🖥️ Executive Dashboard
* **Workforce Summary** — Ringkasan demografi, rasio gender, usia, dan masa kerja.
* **Cost Analysis** — Visualisasi pengeluaran kompensasi dan benefit perusahaan.
* **Attrition Analysis** — Prediksi dan identifikasi alasan utama pengunduran diri.

---

### 17. Compliance & Audit

#### 🔍 Audit Trail
* **Data Changes Log** — Catatan detail aktivitas input, update, dan delete data (siapa, kapan, apa).
* **Approval History** — Log riwayat proses approval lengkap dengan timestamps.
* **Login History** — Pencatatan waktu masuk sistem, alamat IP, dan perangkat yang digunakan.

#### 📋 Compliance Monitoring
* **Contract Expiry** — Deteksi dini kontrak kerja PKWT yang akan segera habis.
* **Certification Expiry** — Pengawasan sertifikasi wajib operasional perusahaan agar tidak melanggar regulasi.
* **Training Compliance** — Pemenuhan standar minimal training wajib (misal: K3/Safety).

---

### 18. Security & Access Control

#### 🔐 Role-Based Access Control (RBAC)
* **Role Management** — Pembuatan peran pengguna (Admin, Manager, Employee, HR, Director).
* **Permission Management** — Konfigurasi hak akses modul hingga tingkat aksi (Create, Read, Update, Delete).

#### 🛡️ Security Features
* **MFA (Multi-Factor Authentication)** — Lapisan keamanan tambahan saat login.
* **Session Control** — Batasan waktu aktif session dan auto-logout saat idle.
* **Device Tracking** — Deteksi login dari perangkat baru tidak dikenal.

---

### 19. Employee Lifecycle Management

#### 👶 Joiner
* **Recruitment Sync** — Penarikan otomatis data kandidat lulus seleksi.
* **Hiring** — Proses penerimaan resmi ke perusahaan.
* **Onboarding Execution** — Pelaksanaan checklist hari pertama kerja.

#### 🏃 Mover
* **Promotion** — Kenaikan jabatan, pangkat, atau tanggung jawab.
* **Mutation & Transfer** — Perpindahan tugas antar cabang atau antar departemen.
* **Demotion** — Penurunan jabatan karena alasan kinerja atau pelanggaran.

#### 🚪 Leaver
* **Resignation** — Alur pengajuan pengunduran diri atas kemauan sendiri.
* **Termination (PHK)** — Proses pemutusan hubungan kerja oleh perusahaan.
* **Retirement** — Manajemen transisi karyawan memasuki usia pensiun.

---

### 20. Integration

#### 🔗 HR Ecosystem
* **Payroll Bank Integration** — Ekspor file transfer massal sesuai format perbankan (Mandiri, BCA, BRI, BNI).
* **Accounting System** — Integrasi jurnal akuntansi gaji ke software General Ledger.
* **ERP System** — Sinkronisasi data karyawan dengan ERP utama perusahaan.
* **Biometric Device** — Konektivitas API langsung dengan mesin absensi sidik jari/wajah.
* **Communication Gateways** — Integrasi Email internal dan WhatsApp Gateway untuk notifikasi instan.
* **Active Directory / LDAP** — Sinkronisasi kredensial masuk karyawan dengan domain kantor.
* **Single Sign-On (SSO)** — Login cepat dengan satu akun terintegrasi (Microsoft Azure AD / Google Workspace).