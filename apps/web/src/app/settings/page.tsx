"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import Link from "next/link";
import { GitPullRequest, Cpu, ChevronRight } from "lucide-react";

export default function SettingsLanding() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!mounted || !isAuthenticated || !isAdmin) {
    return null;
  }

  const settingsOptions = [
    {
      title: t("settings.workflows"),
      description: t("modules.workflows.desc"),
      icon: GitPullRequest,
      href: "/settings/workflows",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: t("settings.integrations"),
      description: t("integration.subtitle"),
      icon: Cpu,
      href: "/settings/integrations",
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black font-sans transition-colors duration-200">
      <Header
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        backUrl="/dashboard"
      />

      <main className="flex-1 flex flex-col justify-start px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <Link
                key={opt.href}
                href={opt.href}
                className="group relative flex items-start gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.01]"
              >
                <div className={`p-3 rounded-xl border ${opt.color} group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight group-hover:text-primary transition-colors">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-1 transition-all duration-300">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
