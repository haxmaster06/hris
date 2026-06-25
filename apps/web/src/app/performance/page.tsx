"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { TrendingUp, Target, Calendar, ClipboardCheck, Sparkles, ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PerformanceLandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("modules.performance");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: kpis } = useQuery({
    queryKey: ["performance-kpis-metrics"],
    queryFn: async () => {
      const res = await api.get("/kpis");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: periods } = useQuery({
    queryKey: ["performance-periods-metrics"],
    queryFn: async () => {
      const res = await api.get("/performance-periods");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: reviews } = useQuery({
    queryKey: ["performance-reviews-metrics"],
    queryFn: async () => {
      const res = await api.get("/performance-reviews");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const totalKpis = Array.isArray(kpis) ? kpis.length : 0;
  const activePeriods = Array.isArray(periods) ? periods.filter((p: any) => p.status === "active" || p.status === "review").length : 0;
  const pendingReviews = Array.isArray(reviews) ? reviews.filter((r: any) => r.status !== "completed").length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Evaluasi Kinerja (Performance)"
        subtitle="Kelola target Key Performance Indicator (KPI), evaluasi kinerja (Appraisal), dan Performance Improvement Plan (PIP) karyawan."
        backUrl="/dashboard"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Master KPI</span>
              <Target className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalKpis}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Periode Evaluasi Aktif</span>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activePeriods}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Evaluasi Menunggu</span>
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{pendingReviews}</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Link
            href="/performance/kpi"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-rose-600 transition-colors">
                {t("kpi")}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Buat dan kelola target Key Performance Indicator (KPI) individual karyawan.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Buka Menu</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/performance/periods"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                {t("periods")}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Atur siklus penilaian periodik (quarterly, semi-annual, atau annual) dan luncurkan proses peninjauan.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Buka Menu</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/performance/reviews"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-amber-600 transition-colors">
                {t("reviews")}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Isi penilaian kinerja mandiri, berikan nilai ulasan manager, dan selesaikan kalibrasi penilaian oleh tim HR.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Buka Menu</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/performance/pip"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-emerald-600 transition-colors">
                {t("pip")}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Pantau rencana peningkatan kinerja terstruktur untuk memulihkan produktivitas personel di bawah target.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Buka Menu</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
