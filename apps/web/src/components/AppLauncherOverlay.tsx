"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { 
  Building2, 
  Users, 
  Clock, 
  FolderLock, 
  Briefcase, 
  GraduationCap, 
  Award, 
  ShieldCheck, 
  X,
  ChevronRight,
  Settings,
  GitPullRequest,
  Coins,
  Gift,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Laptop,
  MessageSquare
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface AppLauncherOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppLauncherOverlay({ isOpen, onClose }: AppLauncherOverlayProps) {
  const { user } = useAuthStore();
  const t = useTranslations();
  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");
  const isSuperAdmin = user?.roles?.includes("Super Admin");

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: "24px", y: "36px" });
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcut (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => {
        // Find the toggle button (waffle menu button) in the header
        const button = document.querySelector('[title*="App Launcher"]');
        if (button && modalRef.current) {
          const buttonRect = button.getBoundingClientRect();
          const modalRect = modalRef.current.getBoundingClientRect();
          // Calculate center of button relative to the modal's top-left corner
          const x = buttonRect.left + buttonRect.width / 2 - modalRect.left;
          const y = buttonRect.top + buttonRect.height / 2 - modalRect.top;
          setOrigin({ x: `${x}px`, y: `${y}px` });
        }
        // Small delay to trigger the transition after DOM is updated
        setTimeout(() => setActive(true), 20);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setActive(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 350); // Matches transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  // Categorized mega menu items with translation keys
  const categories = [
    {
      titleKey: "categories.coreHr",
      descKey: "categories.coreHrDesc",
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
      descKey: "categories.workforceDesc",
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
        },
        {
          titleKey: "modules.assets.title",
          descKey: "modules.assets.desc",
          icon: Laptop,
          href: "/assets",
          subLinks: [
            { nameKey: "modules.assets.registry", href: "/assets/registry" },
            { nameKey: "modules.assets.assignments", href: "/assets/assignments" }
          ]
        }
      ]
    },
    {
      titleKey: "categories.talent",
      descKey: "categories.talentDesc",
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
        },
        {
          titleKey: "modules.performance.title",
          descKey: "modules.performance.desc",
          icon: TrendingUp,
          href: "/performance",
          subLinks: [
            { nameKey: "modules.performance.kpi", href: "/performance/kpi" },
            { nameKey: "modules.performance.periods", href: "/performance/periods" },
            { nameKey: "modules.performance.reviews", href: "/performance/reviews" },
            { nameKey: "modules.performance.pip", href: "/performance/pip" }
          ]
        },
        {
          titleKey: "modules.disciplinary.title",
          descKey: "modules.disciplinary.desc",
          icon: ShieldAlert,
          href: "/disciplinary",
          subLinks: [
            { nameKey: "modules.disciplinary.cases", href: "/disciplinary" }
          ]
        },
        {
          titleKey: "modules.talent.title",
          descKey: "modules.talent.desc",
          icon: Sparkles,
          href: "/talent",
          subLinks: [
            { nameKey: "modules.talent.skills", href: "/talent/skills" },
            { nameKey: "modules.talent.careerPath", href: "/talent/career-path" },
            { nameKey: "modules.talent.succession", href: "/talent/succession" }
          ]
        },
        {
          titleKey: "modules.engagement.title",
          descKey: "modules.engagement.desc",
          icon: MessageSquare,
          href: "/engagement",
          subLinks: [
            { nameKey: "modules.engagement.surveys", href: "/engagement/surveys" },
            { nameKey: "modules.engagement.feedback", href: "/engagement/feedback" },
            { nameKey: "modules.engagement.awards", href: "/engagement/awards" }
          ]
        }
      ]
    },
    ...(isAdmin ? [
      {
        titleKey: "categories.admin",
        descKey: "categories.adminDesc",
        color: "bg-indigo-500",
        items: [
          {
            titleKey: "modules.users.title",
            descKey: "modules.users.desc",
            icon: ShieldCheck,
            href: "/users",
            subLinks: []
          },
          {
            titleKey: "modules.workflows.title",
            descKey: "modules.workflows.desc",
            icon: Settings,
            href: "/settings/workflows",
            subLinks: []
          },
          {
            titleKey: "modules.audit.title",
            descKey: "modules.audit.desc",
            icon: FolderLock,
            href: "/audit-trail",
            subLinks: [
              { nameKey: "modules.audit.loginHistory", href: "/audit-trail/login-history" }
            ]
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
    ] : [])
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
    <div 
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 md:p-6 overflow-y-auto transition-all duration-350 ease-out ${
        active 
          ? "bg-black/60 dark:bg-black/85 backdrop-blur-md opacity-100 pointer-events-auto" 
          : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
      }`}
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div 
        ref={modalRef}
        style={{ 
          transformOrigin: `${origin.x} ${origin.y}`,
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
        className={`relative w-full max-w-6xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 md:p-8 shadow-2xl my-8 z-10 transition-all duration-350 ${
          active 
            ? "scale-100 opacity-100 blur-none" 
            : "scale-[0.05] opacity-0 blur-md"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-zinc-200/60 dark:border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-black text-sm shadow-md">
              N
            </div>
            <div>
              <h3 className="font-extrabold text-md text-zinc-900 dark:text-zinc-50 tracking-tight">
                {t("launcher.title")}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {t("launcher.hint")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors shadow-sm cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
                        onClick={onClose}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200 group text-left"
                      >
                        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40 transition-colors">
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
                              onClick={onClose}
                              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-950 dark:text-zinc-550 dark:hover:text-zinc-200 transition-colors flex items-center gap-0.5 border border-zinc-200/60 dark:border-zinc-900 px-2 py-0.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900"
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
      </div>
    </div>
  );
}
