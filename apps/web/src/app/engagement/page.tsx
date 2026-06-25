"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { MessageSquare, ClipboardList, Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function EngagementLandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("engagement.dashboard");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: surveys = [] } = useQuery({
    queryKey: ["engagement-surveys-metrics"],
    queryFn: async () => {
      const res = await api.get("/surveys");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["engagement-feedbacks-metrics"],
    queryFn: async () => {
      const res = await api.get("/feedbacks");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: awards = [] } = useQuery({
    queryKey: ["engagement-awards-metrics"],
    queryFn: async () => {
      const res = await api.get("/awards");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const activeSurveys = Array.isArray(surveys) 
    ? surveys.filter((s: any) => s.status === "published").length 
    : 0;
  const pendingFeedbacks = Array.isArray(feedbacks) 
    ? feedbacks.filter((f: any) => f.status === "submitted" || f.status === "reviewed").length 
    : 0;
  const totalAwards = Array.isArray(awards) ? awards.length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        backUrl="/dashboard"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("activeSurveys")}</span>
              <ClipboardList className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeSurveys}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("recentFeedback")}</span>
              <MessageSquare className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{pendingFeedbacks}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("awardsWall")}</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalAwards}</p>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Link
            href="/engagement/surveys"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                Surveys Manager
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Build new employee engagement surveys, view analytics charts, and manage target audiences.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open Module</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/engagement/feedback"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-emerald-600 transition-colors">
                Suggestion Box
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Log feedback, file complaints (anonymous or named), and review HR resolutions.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open Module</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/engagement/awards"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-amber-600 transition-colors">
                Awards Wall
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Appreciate achievements, log certificate pathways, and praise top-performing corporate staff.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open Wall</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
