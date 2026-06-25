"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Gift, HeartHandshake, FileCheck, CircleDollarSign, ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function CompensationLandingPage() {
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
  const { data: benefits } = useQuery({
    queryKey: ["benefits-metrics"],
    queryFn: async () => {
      const res = await api.get("/benefits");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: claims } = useQuery({
    queryKey: ["claims-metrics"],
    queryFn: async () => {
      const res = await api.get("/claims");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: bonusSchemes } = useQuery({
    queryKey: ["bonus-schemes-metrics"],
    queryFn: async () => {
      const res = await api.get("/bonus-schemes");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const totalBenefits = Array.isArray(benefits) ? benefits.length : 0;
  const pendingClaims = Array.isArray(claims) ? claims.filter((c: any) => c.status === "pending").length : 0;
  const totalSchemes = Array.isArray(bonusSchemes) ? bonusSchemes.length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Kompensasi & Benefit"
        subtitle="Kelola program asuransi & benefit kesehatan karyawan, persetujuan klaim reimbursement, dan skema bonus insentif."
        backUrl="/dashboard"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Program Benefit Aktif</span>
              <HeartHandshake className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-955 dark:text-zinc-50">{totalBenefits}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Klaim Reimbursement Pending</span>
              <FileCheck className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-955 dark:text-zinc-50">{pendingClaims}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Skema Bonus Terdaftar</span>
              <CircleDollarSign className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-955 dark:text-zinc-50">{totalSchemes}</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1: Benefits */}
          <Link
            href="/compensation/benefits"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500">
                <HeartHandshake className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Benefit & Asuransi
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Definisikan program asuransi kesehatan, jaminan pensiun, gym membership, serta pendaftaran (enrollment) benefit individu karyawan.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Claims */}
          <Link
            href="/compensation/claims"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                <FileCheck className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Klaim Reimbursement
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Pantau dan proses klaim reimbursement kacamata, rawat jalan/inap, transpor dinas, lengkap dengan persetujuan atau alasan penolakan klaim.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Bonus Schemes */}
          <Link
            href="/compensation/bonus"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500">
                <CircleDollarSign className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Skema Bonus
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Definisikan skema insentif performa, bonus akhir tahun, THR keagamaan, serta kriteria perhitungan bonus bagi masing-masing departemen.
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
