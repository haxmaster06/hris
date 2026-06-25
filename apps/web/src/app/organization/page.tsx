"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Building2, GitPullRequest, Award, ShieldAlert } from "lucide-react";
import Header from "@/components/Header";
import CompanyTab from "@/features/organization/components/company-tab";
import BranchTab from "@/features/organization/components/branch-tab";
import DepartmentTab from "@/features/organization/components/department-tab";
import DivisionTab from "@/features/organization/components/division-tab";
import PositionTab from "@/features/organization/components/position-tab";
import GradeTab from "@/features/organization/components/grade-tab";
import CostCenterTab from "@/features/organization/components/cost-center-tab";
import OrgChart from "@/features/organization/components/org-chart";

type TabName = "companies" | "branches" | "departments" | "divisions" | "positions" | "grades" | "costCenters" | "orgChart";

export default function OrganizationPage() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabName>("companies");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch summaries for metrics
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await api.get("/positions");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const res = await api.get("/grades");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const tabs: { name: TabName; label: string }[] = [
    { name: "companies", label: t("modules.organization.legalEntity") },
    { name: "branches", label: t("modules.organization.branches") },
    { name: "departments", label: t("modules.organization.departments") },
    { name: "divisions", label: t("modules.organization.divisions") },
    { name: "positions", label: t("modules.organization.positions") },
    { name: "grades", label: t("modules.organization.grades") },
    { name: "costCenters", label: t("modules.organization.costCenters") || "Cost Center" },
    { name: "orgChart", label: t("modules.organization.orgChart") || "Org Chart" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title={t("modules.organization.title")} 
        subtitle={t("modules.organization.configureSubtitle")} 
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Metric Overview Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("modules.organization.totalBranches")}</span>
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{branches?.length || 0}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("modules.organization.departments")}</span>
              <GitPullRequest className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{departments?.length || 0}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("modules.organization.activePositions")}</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{positions?.length || 0}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("modules.organization.salaryGrades")}</span>
              <ShieldAlert className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{grades?.length || 0}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-zinc-200 dark:border-zinc-900">
          <div className="flex flex-wrap -mb-px gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.name
                    ? "border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content rendering */}
        <div className="transition-all duration-200">
          {activeTab === "companies" && <CompanyTab />}
          {activeTab === "branches" && <BranchTab />}
          {activeTab === "departments" && <DepartmentTab />}
          {activeTab === "divisions" && <DivisionTab />}
          {activeTab === "positions" && <PositionTab />}
          {activeTab === "grades" && <GradeTab />}
          {activeTab === "costCenters" && <CostCenterTab />}
          {activeTab === "orgChart" && <OrgChart />}
        </div>
      </main>
    </div>
  );
}
