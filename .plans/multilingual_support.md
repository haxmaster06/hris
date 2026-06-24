# Planning: Fitur 2 Bahasa (Multilingual i18n — EN/ID)

## Ringkasan

Menambahkan dukungan **2 bahasa** (English & Bahasa Indonesia) ke seluruh frontend Next.js HRIS Platform menggunakan library **`next-intl`**. Strategi yang digunakan adalah **cookie-based locale** tanpa mengubah URL path (`localePrefix: 'never'`), sehingga URL tetap bersih tanpa prefix `/en/` atau `/id/`. Bahasa disimpan di cookie `NEXT_LOCALE` dan di Zustand store untuk reaktivitas UI.

**Default bahasa: Bahasa Indonesia (ID)**.

---

## Referensi Dokumen

- Knowledge Item: "HRIS Next.js Frontend Patterns & Templates"
- Library: [next-intl](https://next-intl.dev) — standard i18n untuk Next.js App Router
- Existing project: `apps/web/src/` — 40 file `.tsx`, ~22 halaman

---

## Kondisi Existing (Current State)

1. **Semua teks UI hardcoded** dalam bahasa Inggris di setiap file `.tsx`
2. **Tidak ada infrastruktur i18n** — tidak ada file terjemahan, tidak ada context/provider bahasa
3. **Layout root** (`layout.tsx`) menggunakan `lang="en"` hardcoded
4. **Teks tersebar di 40 file TSX** termasuk:
   - 22 page files (`page.tsx`)
   - 5 component files (Header, AppLauncherOverlay, AuthGuard, CompanyLogo, providers)
   - 6 feature components (organization tabs, employee modals)
   - 3 utility files (toast, api, utils)
   - 1 login form
5. **Zustand stores**: `authStore.ts`, `themeStore.ts` — akan ditambah `localeStore.ts`
6. **Providers**: `providers.tsx` membungkus `QueryClientProvider` + `ThemeProvider`
7. **Next.js config**: Masih kosong (`next.config.ts`)
8. **Zod validation messages** hardcoded dalam bahasa Inggris

---

## Target Akhir (Desired State)

1. **User bisa switch** antara English (EN) dan Bahasa Indonesia (ID) dari header
2. **Pilihan bahasa persisten** — disimpan di cookie `NEXT_LOCALE` + Zustand, survive refresh
3. **Seluruh UI label, placeholder, toast, error message, form validation** ter-translate
4. **URL tidak berubah** — tidak ada `/en/` atau `/id/` prefix
5. **Default bahasa**: **Bahasa Indonesia (ID)** — user baru langsung melihat UI dalam Bahasa Indonesia
6. **Translation files** terstruktur per-namespace (per-module) untuk maintainability
7. **Type-safe** — compile-time checking pada translation keys
8. **Zero breaking change** — perilaku dan flow bisnis identik, hanya bahasa berubah
9. **Zod validation messages** — ikut diterjemahkan ke kedua bahasa (factory function pattern)
10. **Toast messages** — ikut diterjemahkan, caller passing `t("key")` sebagai parameter
11. **Data dari API** (nama department, role, dsb.) — tetap dalam bahasa asli database, hanya UI label yang di-translate

---

## Keputusan yang Telah Dikonfirmasi

> [!NOTE]
> **Strategi URL**: Cookie-based locale tanpa URL prefix. URL `/dashboard` tetap sama untuk semua bahasa. Upgrade ke URL-based (`/en/`, `/id/`) dimungkinkan di masa depan.

> [!NOTE]
> **Default Bahasa**: ✅ **Bahasa Indonesia (ID)** — dikonfirmasi oleh user. User baru langsung melihat UI dalam Bahasa Indonesia tanpa perlu manual switch.

> [!NOTE]
> **Scope Terjemahan yang Dikonfirmasi**:
> - ✅ **Zod validation messages** — IKUT diterjemahkan (factory function pattern)
> - ✅ **Toast messages** — IKUT diterjemahkan (caller passing `t("key")`)
> - ✅ **Data dari API** — TETAP dalam bahasa asli database, hanya UI label yang di-translate
> - ✅ **Total scope**: 40 file TSX, ~600+ translation keys, 2 file JSON (en.json + id.json)

---

## Proposed Changes

### Arsitektur i18n Overview

```
apps/web/
├── messages/                        # [NEW] Translation files
│   ├── en.json                      # English translations (default)
│   └── id.json                      # Bahasa Indonesia translations
├── src/
│   ├── i18n/                        # [NEW] i18n configuration
│   │   ├── routing.ts               # Locale routing config
│   │   └── request.ts               # Server-side locale resolution
│   ├── stores/
│   │   └── localeStore.ts           # [NEW] Zustand locale state
│   ├── components/
│   │   ├── providers.tsx            # [MODIFY] Wrap with NextIntlClientProvider
│   │   ├── Header.tsx               # [MODIFY] Add language switcher button
│   │   ├── AppLauncherOverlay.tsx   # [MODIFY] Use translation keys
│   │   └── ...
│   └── app/
│       ├── layout.tsx               # [MODIFY] Dynamic lang attribute
│       ├── login/                   # [MODIFY] Use translation keys
│       ├── dashboard/               # [MODIFY] Use translation keys
│       └── ...                      # [MODIFY] All pages use t() function
├── middleware.ts                     # [NEW] next-intl middleware
└── next.config.ts                   # [MODIFY] Add next-intl plugin
```

---

### Fase 1: Infrastruktur i18n Core

Setup fondasi i18n tanpa mengubah file existing apapun.

---

#### Step 1.1: Install dependency `next-intl`

- **Aksi:** `npm install next-intl`
- **File:** `apps/web/package.json` (auto-updated by npm)
- **Validasi:** Package muncul di `dependencies`

---

#### Step 1.2: Konfigurasi Next.js Plugin

- **File:** `apps/web/next.config.ts`
- **Aksi:** MODIFY
- **Detail:**

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
```

- **Risiko:** Minimal — plugin hanya menambahkan alias untuk `i18n/request.ts`

---

#### Step 1.3: Buat Routing Configuration

- **File:** `apps/web/src/i18n/routing.ts` [NEW]
- **Aksi:** CREATE
- **Detail:**

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "id", // Default: Bahasa Indonesia
  localePrefix: "never", // No URL prefix — cookie-based only
});

export type Locale = (typeof routing.locales)[number];
```

---

#### Step 1.4: Buat Request Configuration (Server-side locale resolution)

- **File:** `apps/web/src/i18n/request.ts` [NEW]
- **Aksi:** CREATE
- **Detail:**

```typescript
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing, type Locale } from "./routing";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  // Validate cookie value against supported locales
  const locale: Locale = routing.locales.includes(localeCookie as Locale)
    ? (localeCookie as Locale)
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

---

#### Step 1.5: Buat Middleware

- **File:** `apps/web/middleware.ts` [NEW]
- **Aksi:** CREATE
- **Detail:**

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, static files, etc.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

---

#### Step 1.6: Buat Translation Files (Messages)

- **File:** `apps/web/messages/en.json` [NEW]
- **File:** `apps/web/messages/id.json` [NEW]
- **Aksi:** CREATE

Struktur menggunakan **namespace per-module** agar mudah di-maintain:

```json
// messages/en.json
{
  "common": {
    "appName": "Nexus HR",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "back": "Back",
    "close": "Close",
    "confirm": "Confirm",
    "yes": "Yes",
    "no": "No",
    "noData": "No data available",
    "actions": "Actions",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "allStatuses": "All Statuses",
    "allDepartments": "All Departments",
    "signIn": "Sign In",
    "signOut": "Log Out",
    "company": "Company",
    "toggleTheme": "Toggle Theme",
    "copyright": "© {year} HBM Corp. All rights reserved."
  },
  "login": {
    "pageTitle": "Login — Nexus HR",
    "welcome": "Welcome back",
    "subtitle": "Please enter your credentials to access your tenant dashboard.",
    "selectCompany": "Select Company",
    "loadingCompanies": "Loading companies...",
    "pleaseSelect": "Please select a company",
    "emailAddress": "Email Address",
    "password": "Password",
    "signingIn": "Signing you in...",
    "corporatePortal": "Corporate HR Portal",
    "successMessage": "Welcome back! Login successful.",
    "errorCredentials": "Invalid credentials or company mismatch.",
    "errorLoadTenants": "Failed to load active tenants from database.",
    "brandTagline": "Universal HRIS Platform",
    "brandDescription": "Enterprise-grade integrated Human Resource Information System for HBM Corp, featuring a secure and dynamic modular architecture.",
    "versionBadge": "Nexus HR v1.0 MVP"
  },
  "validation": {
    "required": "This field is required",
    "selectCompany": "Please select a company",
    "invalidEmail": "Invalid email address",
    "passwordMin": "Password must be at least 6 characters"
  },
  "dashboard": {
    "pageTitle": "Nexus HR",
    "subtitle": "Manage organization personnel, track compliance, and view operational analytics.",
    "footerNote": "Direct Access Portal • Click modules or sub-items to manage tenant resources",
    "activeCompany": "Active Company: {company}"
  },
  "launcher": {
    "title": "Enterprise App Launcher",
    "hint": "Press Esc or Ctrl+K to close • Direct access to all active human resource modules",
    "openLauncher": "Open App Launcher (Ctrl+K)"
  },
  "categories": {
    "coreHr": "Core HR & Organization",
    "coreHrDesc": "Manage organizational setup, corporate hierarchy, and personnel directories.",
    "workforce": "Workforce & Operations",
    "workforceDesc": "Track logs of daily check-ins, leaves, and document archives.",
    "talent": "Talent & Development",
    "talentDesc": "Acquire candidates, manage training, and audit professional compliance licenses.",
    "admin": "Administration & Security",
    "adminDesc": "RBAC tenant security, user credentials management, and audit trails."
  },
  "modules": {
    "organization": {
      "title": "Organization Hub",
      "desc": "Corporate entities, branches, departments, divisions, positions, and salary grades.",
      "configureSubtitle": "Configure legal entities, branch locations, and organizational structures.",
      "totalBranches": "Total Branches",
      "departments": "Departments",
      "activePositions": "Active Positions",
      "salaryGrades": "Salary Grades",
      "companies": "Companies",
      "legalEntity": "Legal Entity (Entitas Legal)",
      "branches": "Branches",
      "divisions": "Divisions",
      "positions": "Positions",
      "grades": "Grades"
    },
    "employees": {
      "title": "Employee Directory",
      "desc": "Employee directory profiles, career log histories, and new member onboarding.",
      "viewSubtitle": "View corporate directory, add team members, and check career logs.",
      "totalStaff": "Total Staff",
      "permanent": "Permanent",
      "contract": "Contract",
      "probation": "Probation",
      "searchPlaceholder": "Search by name or employee ID...",
      "onboard": "Onboard Employee",
      "noResults": "No employees found matching filters.",
      "nipId": "NIP / ID",
      "fullName": "Full Name",
      "department": "Department",
      "viewProfile": "View Profile",
      "archiveSuccess": "Employee profile archived successfully",
      "archiveFailed": "Failed to delete employee",
      "confirmDelete": "Are you sure you want to delete this employee?",
      "accessDenied": "Access denied. Admin privileges required."
    },
    "attendance": {
      "title": "Attendance & Leave",
      "desc": "Check-in/out tracking, shift logs, leave balances, and day-off approvals."
    },
    "documents": {
      "title": "Docs & Reports",
      "desc": "Secure storage of dossier files and CSV report generation engines."
    },
    "recruitment": {
      "title": "Recruitment Hub",
      "desc": "Job openings pipeline, talent pool records, interview logs, and director approvals.",
      "vacancies": "Vacancies",
      "candidates": "Candidates",
      "pipeline": "Pipeline",
      "approvals": "Approvals"
    },
    "training": {
      "title": "Training Hub",
      "desc": "Define master course catalogs, schedule sessions, and evaluate participants.",
      "courses": "Courses",
      "sessions": "Sessions"
    },
    "certification": {
      "title": "Certification Hub",
      "desc": "Track matrix obligations, upload PDF credentials, and check renewal dates.",
      "licenseMaster": "License Master",
      "employeeLogs": "Employee Logs"
    },
    "users": {
      "title": "Users & Security",
      "desc": "Tenant user account listings, password resets, and Spatie RBAC permission mappings."
    },
    "hlc": {
      "title": "High Level Control",
      "desc": "Manage multiple organization tenant databases, provisioning, and routing."
    }
  },
  "profile": {
    "title": "User Account Profile",
    "activeTenant": "Active Tenant:",
    "activePermissions": "Active Permissions ({count})",
    "noRoles": "No Assigned Roles",
    "noPermissions": "No permissions found",
    "viewEmployee": "View Employee Profile",
    "noLinkedEmployee": "No Linked Employee Profile",
    "noLinkedTooltip": "System account has no linked employee profile",
    "logoutSession": "Log Out Session",
    "logoutSuccess": "Successfully logged out."
  },
  "language": {
    "label": "Language",
    "en": "English",
    "id": "Bahasa Indonesia",
    "switchSuccess": "Language changed to {language}"
  }
}
```

```json
// messages/id.json — contoh sebagian (struktur identik, value dalam Bahasa Indonesia)
{
  "common": {
    "appName": "Nexus HR",
    "loading": "Memuat...",
    "save": "Simpan",
    "cancel": "Batal",
    "delete": "Hapus",
    "edit": "Ubah",
    "view": "Lihat",
    "create": "Buat",
    "search": "Cari",
    "filter": "Filter",
    "back": "Kembali",
    "close": "Tutup",
    "confirm": "Konfirmasi",
    "yes": "Ya",
    "no": "Tidak",
    "noData": "Tidak ada data tersedia",
    "actions": "Aksi",
    "status": "Status",
    "active": "Aktif",
    "inactive": "Tidak Aktif",
    "allStatuses": "Semua Status",
    "allDepartments": "Semua Departemen",
    "signIn": "Masuk",
    "signOut": "Keluar",
    "company": "Perusahaan",
    "toggleTheme": "Ganti Tema",
    "copyright": "© {year} HBM Corp. Semua hak dilindungi."
  },
  "login": {
    "pageTitle": "Masuk — Nexus HR",
    "welcome": "Selamat Datang Kembali",
    "subtitle": "Masukkan kredensial Anda untuk mengakses dashboard tenant.",
    "selectCompany": "Pilih Perusahaan",
    "loadingCompanies": "Memuat daftar perusahaan...",
    "pleaseSelect": "Silakan pilih perusahaan",
    "emailAddress": "Alamat Email",
    "password": "Kata Sandi",
    "signingIn": "Sedang masuk...",
    "corporatePortal": "Portal HR Perusahaan",
    "successMessage": "Selamat datang kembali! Login berhasil.",
    "errorCredentials": "Kredensial tidak valid atau tidak sesuai perusahaan.",
    "errorLoadTenants": "Gagal memuat daftar tenant aktif dari database.",
    "brandTagline": "Platform HRIS Universal",
    "brandDescription": "Sistem Informasi Sumber Daya Manusia terpadu kelas perusahaan untuk HBM Corp, menyajikan arsitektur modular yang aman dan dinamis.",
    "versionBadge": "Nexus HR v1.0 MVP"
  },
  "validation": {
    "required": "Kolom ini wajib diisi",
    "selectCompany": "Silakan pilih perusahaan",
    "invalidEmail": "Alamat email tidak valid",
    "passwordMin": "Kata sandi minimal 6 karakter"
  },
  "dashboard": {
    "pageTitle": "Nexus HR",
    "subtitle": "Kelola personel organisasi, pantau kepatuhan, dan lihat analitik operasional.",
    "footerNote": "Portal Akses Langsung • Klik modul atau sub-item untuk mengelola sumber daya tenant",
    "activeCompany": "Perusahaan Aktif: {company}"
  },
  "launcher": {
    "title": "Peluncur Aplikasi",
    "hint": "Tekan Esc atau Ctrl+K untuk menutup • Akses langsung ke semua modul sumber daya manusia",
    "openLauncher": "Buka Peluncur Aplikasi (Ctrl+K)"
  },
  "categories": {
    "coreHr": "HR Inti & Organisasi",
    "coreHrDesc": "Kelola struktur organisasi, hierarki perusahaan, dan direktori personel.",
    "workforce": "Tenaga Kerja & Operasional",
    "workforceDesc": "Pantau log check-in harian, cuti, dan arsip dokumen.",
    "talent": "Talenta & Pengembangan",
    "talentDesc": "Rekrut kandidat, kelola pelatihan, dan audit lisensi kepatuhan profesional.",
    "admin": "Administrasi & Keamanan",
    "adminDesc": "Keamanan tenant RBAC, manajemen kredensial pengguna, dan jejak audit."
  },
  "modules": {
    "organization": {
      "title": "Pusat Organisasi",
      "desc": "Entitas legal, cabang, departemen, divisi, jabatan, dan golongan gaji.",
      "configureSubtitle": "Konfigurasi entitas legal, lokasi cabang, dan struktur organisasi.",
      "totalBranches": "Total Cabang",
      "departments": "Departemen",
      "activePositions": "Posisi Aktif",
      "salaryGrades": "Golongan Gaji",
      "companies": "Perusahaan",
      "legalEntity": "Entitas Legal",
      "branches": "Cabang",
      "divisions": "Divisi",
      "positions": "Jabatan",
      "grades": "Golongan"
    },
    "employees": {
      "title": "Direktori Karyawan",
      "desc": "Profil karyawan, riwayat karier, dan onboarding anggota baru.",
      "viewSubtitle": "Lihat direktori perusahaan, tambah anggota tim, dan cek log karier.",
      "totalStaff": "Total Staf",
      "permanent": "Tetap",
      "contract": "Kontrak",
      "probation": "Percobaan",
      "searchPlaceholder": "Cari berdasarkan nama atau ID karyawan...",
      "onboard": "Tambah Karyawan",
      "noResults": "Tidak ditemukan karyawan yang sesuai filter.",
      "nipId": "NIP / ID",
      "fullName": "Nama Lengkap",
      "department": "Departemen",
      "viewProfile": "Lihat Profil",
      "archiveSuccess": "Profil karyawan berhasil diarsipkan",
      "archiveFailed": "Gagal menghapus karyawan",
      "confirmDelete": "Apakah Anda yakin ingin menghapus karyawan ini?",
      "accessDenied": "Akses ditolak. Diperlukan hak admin."
    },
    "attendance": {
      "title": "Kehadiran & Cuti",
      "desc": "Pelacakan check-in/out, log shift, saldo cuti, dan persetujuan libur."
    },
    "documents": {
      "title": "Dokumen & Laporan",
      "desc": "Penyimpanan aman berkas dossier dan mesin generasi laporan CSV."
    },
    "recruitment": {
      "title": "Pusat Rekrutmen",
      "desc": "Pipeline lowongan kerja, rekam talent pool, log wawancara, dan persetujuan direktur.",
      "vacancies": "Lowongan",
      "candidates": "Kandidat",
      "pipeline": "Pipeline",
      "approvals": "Persetujuan"
    },
    "training": {
      "title": "Pusat Pelatihan",
      "desc": "Definisikan katalog kursus master, jadwalkan sesi, dan evaluasi peserta.",
      "courses": "Kursus",
      "sessions": "Sesi"
    },
    "certification": {
      "title": "Pusat Sertifikasi",
      "desc": "Pantau kewajiban matriks, unggah kredensial PDF, dan cek tanggal perpanjangan.",
      "licenseMaster": "Master Lisensi",
      "employeeLogs": "Log Karyawan"
    },
    "users": {
      "title": "Pengguna & Keamanan",
      "desc": "Daftar akun pengguna tenant, reset kata sandi, dan pemetaan hak akses RBAC Spatie."
    },
    "hlc": {
      "title": "Kontrol Level Tinggi",
      "desc": "Kelola database tenant multi-organisasi, provisioning, dan routing."
    }
  },
  "profile": {
    "title": "Profil Akun Pengguna",
    "activeTenant": "Tenant Aktif:",
    "activePermissions": "Hak Akses Aktif ({count})",
    "noRoles": "Tidak Ada Role Ditetapkan",
    "noPermissions": "Tidak ada hak akses ditemukan",
    "viewEmployee": "Lihat Profil Karyawan",
    "noLinkedEmployee": "Tidak Ada Profil Karyawan Terkait",
    "noLinkedTooltip": "Akun sistem tidak memiliki profil karyawan terkait",
    "logoutSession": "Keluar Sesi",
    "logoutSuccess": "Berhasil keluar."
  },
  "language": {
    "label": "Bahasa",
    "en": "English",
    "id": "Bahasa Indonesia",
    "switchSuccess": "Bahasa diubah ke {language}"
  }
}
```

---

### Fase 2: Integrasi Provider & Store

Menghubungkan infrastruktur i18n ke React tree dan state management.

---

#### Step 2.1: Buat Zustand Locale Store

- **File:** `apps/web/src/stores/localeStore.ts` [NEW]
- **Aksi:** CREATE
- **Detail:**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/i18n/routing";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "id" as Locale, // Default: Bahasa Indonesia
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "nexus-hr-locale",
    }
  )
);
```

- **Risiko:** Tidak ada — store berdiri sendiri tanpa dependency existing

---

#### Step 2.2: Modifikasi Root Layout — Dynamic `lang` attribute

- **File:** `apps/web/src/app/layout.tsx` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
  - Import `NextIntlClientProvider` dan `getMessages`, `getLocale` dari `next-intl`
  - Wrap children dengan `NextIntlClientProvider`
  - Set `<html lang={locale}>` secara dinamis
  
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { AuthGuard } from "@/components/AuthGuard";
import "./globals.css";

// ... font config tetap sama ...

export const metadata: Metadata = {
  title: "Nexus HR — Enterprise HRIS Platform",
  description: "Enterprise Human Resource Information System by HBM Corp",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AuthGuard>{children}</AuthGuard>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- **Dampak:** Layout berubah dari sync ke async function (diperlukan oleh `getLocale`/`getMessages`)
- **Risiko:** Minimal — Next.js App Router mendukung async layout natively

---

### Fase 3: Komponen Language Switcher

Menambahkan UI untuk berpindah bahasa di header.

---

#### Step 3.1: Buat LanguageSwitcher Component

- **File:** `apps/web/src/components/LanguageSwitcher.tsx` [NEW]
- **Aksi:** CREATE
- **Detail:**
  - Dropdown button kecil di header (sebelah theme toggle)
  - Tampilkan flag emoji + kode bahasa aktif (🇺🇸 EN / 🇮🇩 ID)
  - On click: set cookie `NEXT_LOCALE`, update Zustand store, refresh halaman
  - Desain: konsisten dengan theme toggle button existing (rounded-lg, border, hover effects)

```typescript
// Pseudocode visual component
<button onClick={switchLanguage}>
  {locale === "en" ? "🇺🇸 EN" : "🇮🇩 ID"}
</button>
```

- **Mekanisme switch:**
  1. Set cookie `NEXT_LOCALE` = new locale
  2. Update `useLocaleStore` 
  3. `router.refresh()` — triggers server re-render with new locale

---

#### Step 3.2: Integrasikan LanguageSwitcher ke Header

- **File:** `apps/web/src/components/Header.tsx` [MODIFY]
- **Aksi:** MODIFY
- **Detail:**
  - Import `LanguageSwitcher`
  - Tempatkan di antara theme toggle dan user badge di section right actions
  - Tidak mengubah layout atau behavior existing

---

### Fase 4: Migrasi Halaman & Komponen (Per-Module)

Fase terbesar — mengganti semua hardcoded string dengan `t()` function calls.

**Pola migrasi per file:**
1. Import `useTranslations` hook dari `next-intl`
2. Inisialisasi `const t = useTranslations("namespace")`
3. Replace setiap hardcoded string dengan `t("key")`
4. Untuk string dengan variabel, gunakan `t("key", { variable: value })`

---

#### Step 4.1: Migrasi Global Components

| File | Namespace | Estimasi Keys |
|------|-----------|--------------|
| `Header.tsx` | `common`, `profile`, `language` | ~25 keys |
| `AppLauncherOverlay.tsx` | `launcher`, `categories`, `modules` | ~35 keys |
| `AuthGuard.tsx` | (minimal) | ~2 keys |
| `CompanyLogo.tsx` | (tidak ada teks) | 0 keys |

---

#### Step 4.2: Migrasi Login Page

| File | Namespace | Estimasi Keys |
|------|-----------|--------------|
| `login/page.tsx` | `login` | ~8 keys |
| `login/login-form.tsx` | `login`, `validation` | ~15 keys |

---

#### Step 4.3: Migrasi Dashboard

| File | Namespace | Estimasi Keys |
|------|-----------|--------------|
| `dashboard/page.tsx` | `dashboard`, `categories`, `modules` | ~30 keys |

---

#### Step 4.4: Migrasi Organization Module

| File | Namespace | Estimasi Keys |
|------|-----------|--------------|
| `organization/page.tsx` | `modules.organization` | ~15 keys |
| `organization/components/company-tab.tsx` | `modules.organization` | ~10 keys |
| `organization/components/branch-tab.tsx` | `modules.organization` | ~10 keys |
| `organization/components/department-tab.tsx` | `modules.organization` | ~10 keys |
| `organization/components/division-tab.tsx` | `modules.organization` | ~10 keys |
| `organization/components/position-tab.tsx` | `modules.organization` | ~10 keys |
| `organization/components/grade-tab.tsx` | `modules.organization` | ~10 keys |

---

#### Step 4.5: Migrasi Employee Module

| File | Namespace | Estimasi Keys |
|------|-----------|--------------|
| `employees/page.tsx` | `modules.employees` | ~20 keys |
| `employees/[id]/page.tsx` | `modules.employees` | ~15 keys |
| `features/employees/components/employee-form-modal.tsx` | `modules.employees` | ~20 keys |
| `features/employees/components/sub-resources.tsx` | `modules.employees` | ~15 keys |

---

#### Step 4.6: Migrasi Remaining Modules

| File | Namespace | Estimasi Keys |
|------|-----------|--------------|
| `attendance-leave/page.tsx` | `modules.attendance` | ~10 keys |
| `documents-reports/page.tsx` | `modules.documents` | ~10 keys |
| `recruitment/page.tsx` + sub-pages (5 files) | `modules.recruitment` | ~30 keys |
| `training/page.tsx` + sub-pages (3 files) | `modules.training` | ~20 keys |
| `certification/page.tsx` + sub-pages (2 files) | `modules.certification` | ~15 keys |
| `users/page.tsx` | `modules.users` | ~15 keys |
| `high-level-control/page.tsx` | `modules.hlc` | ~10 keys |

---

### Fase 5: Migrasi Utilitas & Validasi

---

#### Step 5.1: Toast Messages

- **File:** `apps/web/src/lib/toast.ts` [NO CHANGE]
- Toast wrapper tetap sama — string message di-passing dari caller
- Setiap caller yang memanggil `toast.success(...)` akan menggunakan `t("key")` dari `useTranslations`
- **Tidak perlu modifikasi toast utility itu sendiri**

---

#### Step 5.2: Zod Validation Messages (WAJIB — dikonfirmasi user)

- **File:** Setiap file yang menggunakan Zod schema
- **Pola:**

```typescript
// Sebelum
const schema = zod.object({
  email: zod.string().email("Invalid email address"),
});

// Sesudah — menggunakan custom error map atau parameter
const schema = zod.object({
  email: zod.string().email(t("validation.invalidEmail")),
});
```

- **Risiko:** Zod schema biasanya didefinisikan di luar component. Perlu refactor schema menjadi factory function yang menerima `t` function.
- **Pola Factory Function:**

```typescript
// Sebelum (hardcoded, di luar component):
const loginSchema = zod.object({
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

// Sesudah (factory function, dipanggil di dalam component):
function createLoginSchema(t: (key: string) => string) {
  return zod.object({
    email: zod.string().email(t("validation.invalidEmail")),
    password: zod.string().min(6, t("validation.passwordMin")),
  });
}

// Usage di dalam component:
function LoginForm() {
  const t = useTranslations();
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  // ... useForm({ resolver: zodResolver(loginSchema) })
}
```

- **File yang terdampak**: `login/login-form.tsx`, dan semua file lain yang menggunakan Zod schema
- **Penting**: Wrap `createLoginSchema(t)` dengan `useMemo` agar schema tidak di-recreate setiap render

---

### Fase 6: Testing & Polish

---

#### Step 6.1: Verifikasi Build

- Jalankan `npm run build` — pastikan tidak ada error
- Pastikan semua translation keys valid dan tidak ada missing key warning

---

#### Step 6.2: Manual Testing Checklist

- [ ] Switch dari EN → ID → EN via LanguageSwitcher
- [ ] Refresh halaman — bahasa tetap sesuai pilihan terakhir
- [ ] Login page: semua label, placeholder, error message ter-translate
- [ ] Dashboard: semua kategori dan modul ter-translate
- [ ] App Launcher popup: semua item ter-translate
- [ ] Organization page: tab names, metric labels ter-translate
- [ ] Employee page: table headers, filter labels, modal ter-translate
- [ ] Profile popup: semua label ter-translate
- [ ] Toast messages: muncul dalam bahasa aktif
- [ ] Dark mode + bahasa Indonesia: tidak ada visual glitch

---

## Dampak ke Sistem Existing

| Area | Dampak | Severity |
|------|--------|----------|
| URL Structure | **Tidak berubah** — cookie-based | ✅ Aman |
| Business Logic | **Tidak berubah** — hanya UI labels | ✅ Aman |
| API Calls | **Tidak berubah** | ✅ Aman |
| Auth Flow | **Tidak berubah** | ✅ Aman |
| Zustand Stores | **Ditambah** `localeStore.ts` | ✅ Aman |
| Root Layout | **Berubah** sync → async | ⚠️ Minor |
| next.config.ts | **Berubah** — tambah plugin | ⚠️ Minor |
| Header.tsx | **Berubah** — tambah switcher + t() | ⚠️ Minor |
| Semua page.tsx | **Berubah** — hardcoded → t() | ⚠️ Medium (banyak file) |
| Build Process | **Berubah** — next-intl plugin | ✅ Aman |
| Bundle Size | **Bertambah** ~15-20KB (next-intl + messages JSON) | ✅ Minimal |

---

## Risiko & Mitigasi

| Risiko | Probabilitas | Mitigasi |
|--------|-------------|----------|
| Missing translation key → error | Medium | next-intl menampilkan key name sebagai fallback; test menyeluruh |
| Layout shift saat switch bahasa (ID text lebih panjang) | Low | Review responsive layout; gunakan flexible container |
| Cookie `NEXT_LOCALE` tidak di-set saat pertama kali | Low | Default ke `id` (Bahasa Indonesia) via `routing.defaultLocale` |
| Middleware conflict dengan existing routes | Low | Matcher mengecualikan `/api` dan `/_next` |
| Zod validation schema perlu refactor | Medium | Buat factory function pattern; tidak mengubah validation behavior |
| Performance — loading seluruh translation file | Low | next-intl hanya loads messages untuk active locale; file ~5-8KB per locale |

---

## Checklist Verifikasi Akhir

- [ ] `npm run build` berhasil tanpa error
- [ ] Semua 22 halaman menampilkan teks yang benar di kedua bahasa
- [ ] Language switcher bekerja dan persisten setelah refresh
- [ ] `<html lang="">` attribute berubah sesuai locale aktif
- [ ] Tidak ada hardcoded English text tersisa di UI (kecuali brand name "Nexus HR")
- [ ] Dark mode dan responsive layout tetap berfungsi normal
- [ ] Tidak ada console warnings terkait missing translation keys
- [ ] File `.plans/multilingual_support.md` telah di-push ke GitHub sebagai issue
