"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { 
  Package, CheckCircle, AlertTriangle, PenTool, 
  ArrowUpRight, ClipboardList, Database, RefreshCw 
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function AssetsDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("assets.dashboard");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch all assets for counting metrics
  const { data: assets = [] } = useQuery({
    queryKey: ["assets-dashboard-list"],
    queryFn: async () => {
      const res = await api.get("/assets?per_page=100");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch recent assignments
  const { data: recentAssignments = [] } = useQuery({
    queryKey: ["assets-dashboard-assignments"],
    queryFn: async () => {
      const res = await api.get("/asset-assignments?per_page=5");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  if (!mounted || !isAuthenticated) return null;

  const totalAssets = Array.isArray(assets) ? assets.length : 0;
  const assignedAssets = Array.isArray(assets) ? assets.filter((a: any) => a.status === "assigned").length : 0;
  const availableAssets = Array.isArray(assets) ? assets.filter((a: any) => a.status === "available").length : 0;
  const maintenanceAssets = Array.isArray(assets) ? assets.filter((a: any) => a.status === "maintenance").length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        backUrl="/dashboard"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">{t("totalAssets")}</span>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalAssets}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">{t("assigned")}</span>
              <RefreshCw className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{assignedAssets}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">{t("available")}</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{availableAssets}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">{t("maintenance")}</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{maintenanceAssets}</p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/assets/registry"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-blue-600 transition-colors">
                Asset Registry
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Register corporate hardware (laptops, phones, monitors), set serial numbers, log physical conditions, and warehouse inventory.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open Registry</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/assets/assignments"
            className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 group-hover:text-indigo-600 transition-colors">
                Assignments & Handovers
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Assign laptops or equipment to corporate staff, generate and upload BAST hand-over logs, and track physical item check-ins.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View Assignments</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>

        {/* Recent Assignments Table */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Recent Asset Check-Out Activity
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-400 font-medium">
                  <th className="pb-3 pr-4">Asset Tag</th>
                  <th className="pb-3 pr-4">Asset Name</th>
                  <th className="pb-3 pr-4">Assigned To</th>
                  <th className="pb-3 pr-4">Handover Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
                {recentAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 italic">
                      No active assignments.
                    </td>
                  </tr>
                ) : (
                  recentAssignments.map((assign: any) => (
                    <tr key={assign.id} className="text-zinc-700 dark:text-zinc-300">
                      <td className="py-3 pr-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {assign.asset?.asset_number}
                      </td>
                      <td className="py-3 pr-4 font-medium">{assign.asset?.name}</td>
                      <td className="py-3 pr-4">
                        {assign.employee ? `${assign.employee.first_name} ${assign.employee.last_name || ""}` : "Staff Profile"}
                      </td>
                      <td className="py-3 pr-4">
                        {new Date(assign.assigned_date).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          assign.status === "returned"
                            ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                            : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {assign.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
