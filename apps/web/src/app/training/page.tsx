"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Award,
  GraduationCap,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

export default function TrainingDashboard() {
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
  const { data: trainings } = useQuery({
    queryKey: ["trainings-list"],
    queryFn: () => api.get("/trainings").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions-list"],
    queryFn: () => api.get("/training-sessions").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const totalTrainings = Array.isArray(trainings) ? trainings.length : 0;
  const totalSessions = Array.isArray(sessions) ? sessions.length : 0;
  
  // Calculate active sessions (Scheduled or Ongoing)
  const activeSessions = Array.isArray(sessions) 
    ? sessions.filter((s: any) => s.status === "Scheduled" || s.status === "Ongoing").length 
    : 0;

  const completedSessions = Array.isArray(sessions)
    ? sessions.filter((s: any) => s.status === "Completed").length
    : 0;

  const navigationCards = [
    {
      title: "Master Trainings",
      description: "Manage core training curriculum, category tracks, and internal/external configurations.",
      icon: BookOpen,
      href: "/training/master",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500 text-white"
    },
    {
      title: "Training Sessions",
      description: "Schedule training calendars, assign trainers, venues, and track execution status.",
      icon: Calendar,
      href: "/training/sessions",
      color: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500 text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title="Training Hub" 
        subtitle="Establish corporate learning programs, plan training sessions, coordinate attendees, and log passing performance scores."
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Master Courses</span>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalTrainings}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Scheduled Sesi</span>
              <Calendar className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalSessions}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active / Ongoing</span>
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeSessions}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Sessions Completed</span>
              <Award className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{completedSessions}</p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`flex flex-col p-6 rounded-2xl border bg-gradient-to-br ${card.color} hover:scale-[1.01] hover:shadow-md transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg} shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  {card.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Recent & Upcoming Training Sessions */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-zinc-500" />
            Recent & Active Sessions
          </h2>

          {Array.isArray(sessions) && sessions.length > 0 ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {session.training?.name || "Learning Session"}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(session.start_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        Trainer: {session.trainer}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.venue}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                      ${session.status === "Completed" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" : ""}
                      ${session.status === "Scheduled" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" : ""}
                      ${session.status === "Ongoing" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
                      ${session.status === "Cancelled" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" : ""}
                    `}>
                      {session.status}
                    </span>
                    <Link
                      href={`/training/sessions/${session.id}/participants`}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      title="Manage Participants"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-600">
              No training sessions scheduled yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
