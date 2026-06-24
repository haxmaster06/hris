"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
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
  ChevronRight
} from "lucide-react";

export default function DashboardLauncher() {
  const router = useRouter();
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

  // Categorized mega menu items
  const categories = [
    {
      title: "Core HR & Organization",
      color: "bg-blue-500",
      items: [
        {
          title: "Organization Hub",
          desc: "Corporate entities, branches, departments, divisions, positions, and salary grades.",
          icon: Building2,
          href: "/organization",
          subLinks: []
        },
        {
          title: "Employee Directory",
          desc: "Employee directory profiles, career log histories, and new member onboarding.",
          icon: Users,
          href: "/employees",
          subLinks: []
        }
      ]
    },
    {
      title: "Workforce & Operations",
      color: "bg-amber-500",
      items: [
        {
          title: "Attendance & Leave",
          desc: "Check-in/out tracking, shift logs, leave balances, and day-off approvals.",
          icon: Clock,
          href: "/attendance-leave",
          subLinks: []
        },
        {
          title: "Docs & Reports",
          desc: "Secure storage of dossier files and CSV report generation engines.",
          icon: FolderLock,
          href: "/documents-reports",
          subLinks: []
        }
      ]
    },
    {
      title: "Talent & Development",
      color: "bg-fuchsia-500",
      items: [
        {
          title: "Recruitment Hub",
          desc: "Job openings pipeline, talent pool records, interview logs, and director approvals.",
          icon: Briefcase,
          href: "/recruitment",
          subLinks: [
            { name: "Vacancies", href: "/recruitment/vacancies" },
            { name: "Candidates", href: "/recruitment/candidates" },
            { name: "Pipeline", href: "/recruitment/pipeline" },
            { name: "Approvals", href: "/recruitment/approvals" }
          ]
        },
        {
          title: "Training Hub",
          desc: "Define master course catalogs, schedule sessions, and evaluate participants.",
          icon: GraduationCap,
          href: "/training",
          subLinks: [
            { name: "Courses", href: "/training/master" },
            { name: "Sessions", href: "/training/sessions" }
          ]
        },
        {
          title: "Certification Hub",
          desc: "Track matrix obligations, upload PDF credentials, and check renewal dates.",
          icon: Award,
          href: "/certification",
          subLinks: [
            { name: "License Master", href: "/certification/master" },
            { name: "Employee Logs", href: "/certification/employee" }
          ]
        }
      ]
    },
    {
      title: "Administration & Security",
      color: "bg-indigo-500",
      items: [
        {
          title: "Users & Security",
          desc: "Tenant user account listings, password resets, and Spatie RBAC permission mappings.",
          icon: ShieldCheck,
          href: "/users",
          subLinks: []
        },
        ...(isSuperAdmin ? [{
          title: "High Level Control",
          desc: "Manage multiple organization tenant databases, provisioning, and routing.",
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
      item.title === "Attendance & Leave" || item.title === "Docs & Reports"
    );
    return { ...cat, items: filteredItems };
  }).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black font-sans transition-colors duration-200">
      <Header 
        title="Nexus HR" 
        subtitle="Manage organization personnel, track compliance, and view operational analytics."
      />

      {/* Main Body */}
      <main className="flex-1 flex flex-col justify-start px-6 py-12 max-w-6xl mx-auto w-full">
        
        {/* Mega Menu Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {visibleCategories.map((cat) => (
              <div key={cat.title} className="flex flex-col space-y-4">
                {/* Category Title Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/60 dark:border-zinc-900/60">
                  <span className={`h-2 w-2 rounded-full ${cat.color}`} />
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {cat.title}
                  </h4>
                </div>

                {/* Category Modules Items */}
                <div className="flex flex-col space-y-4">
                  {cat.items.map((mod) => {
                    const Icon = mod.icon;
                    return (
                      <div key={mod.title} className="flex flex-col">
                        <Link
                          href={mod.href}
                          className="flex items-start gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all duration-200 group text-left"
                        >
                          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-450 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40 transition-colors">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-black text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                              {mod.title}
                            </h5>
                            <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1 leading-normal font-medium">
                              {mod.desc}
                            </p>
                          </div>
                        </Link>

                        {/* Sub-links for Deep Navigation */}
                        {mod.subLinks.length > 0 && (
                          <div className="mt-1.5 pl-10 pr-2 flex flex-wrap gap-x-2 gap-y-1">
                            {mod.subLinks.map((sub) => (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                className="text-[10px] font-bold text-zinc-400 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors flex items-center gap-0.5 border border-zinc-200/60 dark:border-zinc-900 px-2 py-0.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900"
                              >
                                <ChevronRight className="h-2.5 w-2.5" />
                                {sub.name}
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
              Direct Access Portal • Click modules or sub-items to manage tenant resources
            </div>
            <div className="font-semibold uppercase tracking-wider text-[9px] text-zinc-500">
              Active Company: {companyName || tenantId}
            </div>
          </div>
      </main>
    </div>
  );
}
