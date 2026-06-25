"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  Clock, 
  FolderLock, 
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Award,
  Settings,
  ChevronRight,
  GitPullRequest,
  Coins,
  Gift
} from "lucide-react";

export default function DashboardLauncher() {
  const router = useRouter();
  const t = useTranslations();
  const { user, tenantId, companyName, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Client-side authentication check
  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return null; // Prevent flash of content
  }

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");
  const isSuperAdmin = user?.roles?.includes("Super Admin");

  // Categorized mega menu items with translation keys
  const categories = [
    {
      titleKey: "categories.coreHr",
      color: "bg-blue-500",
      items: [
        {
          titleKey: "modules.organization.title",
          descKey: "modules.organization.desc",
          icon: Building2,
          href: "/organization",
          subLinks: []
        },
        {
          titleKey: "modules.employees.title",
          descKey: "modules.employees.desc",
          icon: Users,
          href: "/employees",
          subLinks: []
        },
        {
          titleKey: "modules.lifecycle.title",
          descKey: "modules.lifecycle.desc",
          icon: GitPullRequest,
          href: "/employee-lifecycle",
          subLinks: [
            { nameKey: "modules.lifecycle.events", href: "/employee-lifecycle/events" },
            { nameKey: "modules.lifecycle.onboarding", href: "/employee-lifecycle/onboarding" }
          ]
        }
      ]
    },
    {
      titleKey: "categories.workforce",
      color: "bg-amber-500",
      items: [
        {
          titleKey: "modules.attendance.title",
          descKey: "modules.attendance.desc",
          icon: Clock,
          href: "/attendance-leave",
          subLinks: []
        },
        {
          titleKey: "modules.documents.title",
          descKey: "modules.documents.desc",
          icon: FolderLock,
          href: "/documents-reports",
          subLinks: []
        },
        {
          titleKey: "modules.payroll.title",
          descKey: "modules.payroll.desc",
          icon: Coins,
          href: "/payroll",
          subLinks: [
            { nameKey: "modules.payroll.components", href: "/payroll/components" },
            { nameKey: "modules.payroll.periods", href: "/payroll/periods" },
            { nameKey: "modules.payroll.salary", href: "/payroll/salary" },
            { nameKey: "modules.payroll.loans", href: "/payroll/loans" }
          ]
        },
        {
          titleKey: "modules.compensation.title",
          descKey: "modules.compensation.desc",
          icon: Gift,
          href: "/compensation",
          subLinks: [
            { nameKey: "modules.compensation.benefits", href: "/compensation/benefits" },
            { nameKey: "modules.compensation.claims", href: "/compensation/claims" },
            { nameKey: "modules.compensation.bonus", href: "/compensation/bonus" }
          ]
        }
      ]
    },
    {
      titleKey: "categories.talent",
      color: "bg-fuchsia-500",
      items: [
        {
          titleKey: "modules.recruitment.title",
          descKey: "modules.recruitment.desc",
          icon: Briefcase,
          href: "/recruitment",
          subLinks: [
            { nameKey: "modules.recruitment.vacancies", href: "/recruitment/vacancies" },
            { nameKey: "modules.recruitment.candidates", href: "/recruitment/candidates" },
            { nameKey: "modules.recruitment.pipeline", href: "/recruitment/pipeline" },
            { nameKey: "modules.recruitment.approvals", href: "/recruitment/approvals" }
          ]
        },
        {
          titleKey: "modules.training.title",
          descKey: "modules.training.desc",
          icon: GraduationCap,
          href: "/training",
          subLinks: [
            { nameKey: "modules.training.courses", href: "/training/master" },
            { nameKey: "modules.training.sessions", href: "/training/sessions" }
          ]
        },
        {
          titleKey: "modules.certification.title",
          descKey: "modules.certification.desc",
          icon: Award,
          href: "/certification",
          subLinks: [
            { nameKey: "modules.certification.licenseMaster", href: "/certification/master" },
            { nameKey: "modules.certification.employeeLogs", href: "/certification/employee" }
          ]
        }
      ]
    },
    {
      titleKey: "categories.admin",
      color: "bg-indigo-500",
      items: [
        {
          titleKey: "modules.users.title",
          descKey: "modules.users.desc",
          icon: ShieldCheck,
          href: "/users",
          subLinks: []
        },
        ...(isSuperAdmin ? [{
          titleKey: "modules.hlc.title",
          descKey: "modules.hlc.desc",
          icon: Settings,
          href: "/high-level-control",
          subLinks: []
        }] : [])
      ]
    }
  ];

  // Filter categories and items based on role
  const visibleCategories = categories.map(cat => {
    if (isAdmin) return cat;
    // Non-admins only see Attendance and Docs & Reports
    const filteredItems = cat.items.filter(item => 
      item.href === "/attendance-leave" || item.href === "/documents-reports"
    );
    return { ...cat, items: filteredItems };
  }).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black font-sans transition-colors duration-200">
      <Header 
        title={t("dashboard.pageTitle")} 
        subtitle={t("dashboard.subtitle")}
      />

      {/* Main Body */}
      <main className="flex-1 flex flex-col justify-start px-6 py-12 max-w-6xl mx-auto w-full">
        
        {/* Mega Menu Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {visibleCategories.map((cat) => (
            <div key={cat.titleKey} className="flex flex-col space-y-4">
              {/* Category Title Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/60 dark:border-zinc-900/60">
                <span className={`h-2 w-2 rounded-full ${cat.color}`} />
                <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t(cat.titleKey)}
                </h4>
              </div>

              {/* Category Modules Items */}
              <div className="flex flex-col space-y-4">
                {cat.items.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.titleKey} className="flex flex-col">
                      <Link
                        href={mod.href}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all duration-200 group text-left"
                      >
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-450 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40 transition-colors">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                            {t(mod.titleKey)}
                          </h5>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal font-medium">
                            {t(mod.descKey)}
                          </p>
                        </div>
                      </Link>

                      {/* Sub-links for Deep Navigation */}
                      {mod.subLinks.length > 0 && (
                        <div className="mt-1.5 pl-10 pr-2 flex flex-wrap gap-x-2 gap-y-1">
                          {mod.subLinks.map((sub) => (
                            <Link
                              key={sub.nameKey}
                              href={sub.href}
                              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-950 dark:text-zinc-555 dark:hover:text-zinc-200 transition-colors flex items-center gap-0.5 border border-zinc-200/60 dark:border-zinc-900 px-2 py-0.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            >
                              <ChevronRight className="h-2.5 w-2.5" />
                              {t(sub.nameKey)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Metadata */}
        <div className="mt-12 pt-6 border-t border-zinc-200/60 dark:border-zinc-900/60 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-550 font-medium">
          <div>
            {t("dashboard.footerNote")}
          </div>
          <div className="font-semibold uppercase tracking-wider text-[9px] text-zinc-500 select-none">
            {t("dashboard.activeCompany", { company: companyName || tenantId || "" })}
          </div>
        </div>
      </main>
    </div>
  );
}
