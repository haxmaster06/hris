"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Sparkles, Grid, GitMerge, Award, BookOpen, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function TalentLandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch count statistics
  const { data: skills } = useQuery({
    queryKey: ["talent-skills-metrics"],
    queryFn: async () => {
      const res = await api.get("/skills");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: succession } = useQuery({
    queryKey: ["talent-succession-metrics"],
    queryFn: async () => {
      const res = await api.get("/succession-plans");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: careerPaths } = useQuery({
    queryKey: ["talent-career-paths-metrics"],
    queryFn: async () => {
      const res = await api.get("/career-paths");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const totalSkills = Array.isArray(skills) ? skills.length : 0;
  const totalSuccession = Array.isArray(succession) ? succession.length : 0;
  const totalPaths = Array.isArray(careerPaths) ? careerPaths.length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Pengembangan Talenta (Talent & Career)"
        subtitle="Analisis matriks kompetensi keahlian staf, petakan rute karir promosi jabatan, dan susun suksesi suksesor board."
        backUrl="/dashboard"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Kompetensi Keahlian</span>
              <BookOpen className="h-4 w-4 text-fuchsia-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalSkills}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Rute Karir Aktif</span>
              <GitMerge className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalPaths}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Staf Masuk Suksesi Board</span>
              <Award className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalSuccession}</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Link
            href="/talent/skills"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 mb-2">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-fuchsia-600 transition-colors">
                Matriks Keahlian
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Visualisasikan matriks kompetensi karyawan dengan peta visual (Heatmap Grid).
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Buka Menu</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/talent/career-path"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <GitMerge className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                Peta Rute Karir
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Tinjau visualisasi pohon (Career Tree/Graph) rute promosi dan kenaikan jabatan.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Buka Menu</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/talent/succession"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <Grid className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-emerald-600 transition-colors">
                Board Suksesi
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Susun pool kandidat suksesor melalui visualisasi pemetaan board 9-Box Grid.
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
