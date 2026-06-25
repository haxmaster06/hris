"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { GitPullRequest, Award, UserPlus, ClipboardList, ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function EmployeeLifecycleLandingPage() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch metrics data
  const { data: events } = useQuery({
    queryKey: ["lifecycle-events-metrics"],
    queryFn: async () => {
      const res = await api.get("/lifecycle-events");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: onboardingTasks } = useQuery({
    queryKey: ["all-onboarding-tasks-count"],
    queryFn: async () => {
      // Fetch employees first to count pending onboarding
      const res = await api.get("/employees?status=probation");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  // Compute counts
  const totalPromotions = Array.isArray(events) ? events.filter((e: any) => e.event_type === "promotion").length : 0;
  const totalMutations = Array.isArray(events) ? events.filter((e: any) => e.event_type === "mutation").length : 0;
  const pendingOnboarding = Array.isArray(onboardingTasks) ? onboardingTasks.length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Employee Lifecycle"
        subtitle="Manajemen siklus hidup karyawan: Onboarding, Promosi, Mutasi, dan Karir."
        backUrl="/dashboard"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Promosi</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalPromotions}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Mutasi & Demotion</span>
              <GitPullRequest className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalMutations}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Karyawan Baru (Onboarding)</span>
              <UserPlus className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{pendingOnboarding}</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Card 1: Career Events */}
          <Link
            href="/employee-lifecycle/events"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                <Award className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Manajemen Karir Karyawan
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Buat dan eksekusi draf usulan promosi, mutasi divisi, pembaruan status kontrak kerja, hingga penyesuaian gaji karyawan.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Onboarding */}
          <Link
            href="/employee-lifecycle/onboarding"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-4">
              <span className="p-3 inline-flex rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                <ClipboardList className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-900 dark:group-hover:text-white flex items-center gap-1.5">
                  Proses Onboarding Karyawan
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  Kelola daftar tugas (checklist) orientasi karyawan baru, penyiapan fasilitas komputer, pembuatan akun email perusahaan, hingga training wajib.
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
