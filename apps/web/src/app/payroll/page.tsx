"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Coins, Calendar, Wallet, Landmark, ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PayrollLandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch metrics data
  const { data: components } = useQuery({
    queryKey: ["payroll-components-metrics"],
    queryFn: async () => {
      const res = await api.get("/payroll-components");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: loans } = useQuery({
    queryKey: ["employee-loans-metrics"],
    queryFn: async () => {
      const res = await api.get("/employee-loans?status=approved");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: periods } = useQuery({
    queryKey: ["payroll-periods-metrics"],
    queryFn: async () => {
      const res = await api.get("/payroll-periods");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const totalComponents = Array.isArray(components) ? components.length : 0;
  const activeLoans = Array.isArray(loans) ? loans.filter((l: any) => l.status === "approved" && l.remaining_amount > 0).length : 0;
  const draftPeriods = Array.isArray(periods) ? periods.filter((p: any) => p.status === "draft").length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Penggajian (Payroll)"
        subtitle="Kelola struktur penggajian karyawan: Master komponen, periode penggajian, kalkulasi PPh 21 & BPJS, serta pinjaman kasbon."
        backUrl="/dashboard"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Komponen Gaji Aktif</span>
              <Coins className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalComponents}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Periode Gaji Berjalan</span>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{draftPeriods}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Pinjaman/Kasbon Aktif</span>
              <Wallet className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeLoans}</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Card 1: Components */}
          <Link
            href="/payroll/components"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                <Coins className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Komponen Gaji
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Kelola formula dan master tunjangan, potongan tetap/tidak tetap, BPJS Ketenagakerjaan/Kesehatan, serta perpajakan PPh 21 karyawan.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Periods */}
          <Link
            href="/payroll/periods"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500">
                <Calendar className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Proses & Periode Gaji
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Buka periode bulanan, kalkulasi otomatis seluruh gaji, konvergensi pajak gross-up PPh 21, persetujuan direksi, hingga slip gaji terbit.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Salary Setup */}
          <Link
            href="/payroll/salary"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500">
                <Landmark className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Gaji & Tunjangan Karyawan
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Definisikan gaji pokok karyawan secara spesifik, alokasi tunjangan tetap per individu, serta penentuan opsi perhitungan pajak (Gross/Nett/Gross-Up).
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Loans */}
          <Link
            href="/payroll/loans"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                <Wallet className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Pinjaman Karyawan (Kasbon)
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Kelola pengajuan pinjaman karyawan, tenor cicilan bulanan, pencairan dana, serta integrasi pemotongan otomatis saat payroll dijalankan.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Back button */}
        <div className="flex justify-center pt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 py-2.5 px-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard Utama
          </Link>
        </div>
      </main>
    </div>
  );
}
