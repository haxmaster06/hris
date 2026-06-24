"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Briefcase, 
  UserPlus, 
  Kanban, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  Clock 
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

export default function RecruitmentDashboard() {
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
  const { data: vacanciesData } = useQuery({
    queryKey: ["vacancies-stats"],
    queryFn: () => api.get("/vacancies").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["candidates-stats"],
    queryFn: () => api.get("/candidates").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ["applications-stats"],
    queryFn: () => api.get("/applications").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: approvalsData } = useQuery({
    queryKey: ["approvals-stats"],
    queryFn: () => api.get("/hiring-approvals").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const totalVacancies = Array.isArray(vacanciesData) ? vacanciesData.length : 0;
  const activeVacancies = Array.isArray(vacanciesData) ? vacanciesData.filter((v: any) => v.status === "published").length : 0;
  const totalCandidates = Array.isArray(candidatesData) ? candidatesData.length : 0;
  const activeApplications = Array.isArray(applicationsData) ? applicationsData.filter((a: any) => a.status !== "hired" && a.status !== "rejected").length : 0;
  const pendingApprovals = Array.isArray(approvalsData) ? approvalsData.filter((a: any) => a.status === "pending").length : 0;

  const navigationCards = [
    {
      title: "Job Vacancies",
      description: "Create, publish, and close master job vacancies for hiring positions.",
      icon: Briefcase,
      href: "/recruitment/vacancies",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500 text-white"
    },
    {
      title: "Candidate Directory",
      description: "Manage candidate talent pool, upload resumes, and review applicant dossiers.",
      icon: UserPlus,
      href: "/recruitment/candidates",
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500 text-white"
    },
    {
      title: "Kanban Pipeline",
      description: "Visualize applicant progress across hiring stages (Applied -> Hired) via Kanban.",
      icon: Kanban,
      href: "/recruitment/pipeline",
      color: "from-fuchsia-500/10 to-pink-500/10 border-fuchsia-200 dark:border-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400",
      iconBg: "bg-fuchsia-500 text-white"
    },
    {
      title: "Hiring Approvals",
      description: "Review and sign off on hiring requests (HR -> Manager -> Director workflow).",
      icon: CheckSquare,
      href: "/recruitment/approvals",
      color: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500 text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title="Recruitment Hub" 
        subtitle="Manage vacancies, coordinate candidate pipelines, schedule interviews, and process hiring workflows."
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Published Vacancies</span>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeVacancies} <span className="text-xs font-normal text-zinc-400">/ {totalVacancies} total</span></p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Talent Pool</span>
              <Users className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalCandidates}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active Candidates</span>
              <TrendingUp className="h-4 w-4 text-fuchsia-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeApplications}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Pending Approvals</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{pendingApprovals}</p>
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
      </main>
    </div>
  );
}
