"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Users2, 
  BookOpen, 
  Briefcase, 
  History, 
  Calendar, 
  Mail, 
  Layers 
} from "lucide-react";
import Link from "next/link";
import { 
  FamilySection, 
  EducationSection, 
  ExperienceSection 
} from "@/features/employees/components/sub-resources";

type TabName = "personal" | "family" | "education" | "experience" | "career-history";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;
  const { isAuthenticated } = useAuthStore();
  const { isAdmin, isSelf } = useAuthorization();
  const [activeTab, setActiveTab] = useState<TabName>("personal");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin && !isSelf(employeeId)) {
      router.push("/dashboard");
      toast.error("Access denied. You can only view your own profile.");
    }
  }, [isAuthenticated, isAdmin, employeeId, router]);

  // Fetch Employee Profile
  const { data: employee, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => api.get(`/employees/${employeeId}`).then((res) => res.data.data),
    enabled: isAuthenticated && !!employeeId,
  });

  // Fetch Career histories
  const { data: histories, isLoading: isLoadingHistories } = useQuery({
    queryKey: ["employee-histories", employeeId],
    queryFn: () => api.get(`/employees/${employeeId}/histories`).then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && !!employeeId && activeTab === "career-history",
  });

  if (!mounted || !isAuthenticated) return null;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 dark:bg-black font-sans space-y-4">
        <p className="text-zinc-500 text-sm">Employee profile not found.</p>
        <Link href="/employees" className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  const tabs: { name: TabName; label: string; icon: any }[] = [
    { name: "personal", label: "Personal Info", icon: User },
    { name: "family", label: "Family", icon: Users2 },
    { name: "education", label: "Education", icon: BookOpen },
    { name: "experience", label: "Work Experience", icon: Briefcase },
    { name: "career-history", label: "Career Logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/employees"
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Back to Directory"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">Employee Profile</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">View personal dossiers, sub-resources and trace audit logs.</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Core Profile Banner Card */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-950 text-white dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center text-3xl font-bold border border-zinc-200 dark:border-zinc-800">
            {employee.first_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                {employee.first_name} {employee.last_name}
              </h2>
              <span className={`inline-flex self-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                employee.status === "permanent"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              }`}>
                {employee.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">NIP: {employee.employee_number}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-zinc-400" />
                {employee.department?.name || "-"} &bull; {employee.position?.name || "-"}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" />
                Joined {employee.join_date}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-2 flex flex-wrap gap-1 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.name
                    ? "bg-zinc-950 text-white dark:bg-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm">
          {activeTab === "personal" && (
            <div className="space-y-6">
              <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-500" />
                Personal Dossier
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Gender</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{employee.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Birth Date</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.birth_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Join Date</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.join_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Company</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.company?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Branch Office</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.branch?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Department</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.department?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Job Position</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.position?.name || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "family" && <FamilySection employeeId={employeeId} />}

          {activeTab === "education" && <EducationSection employeeId={employeeId} />}

          {activeTab === "experience" && <ExperienceSection employeeId={employeeId} />}

          {activeTab === "career-history" && (
            <div className="space-y-6">
              <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2">
                <History className="h-5 w-5 text-zinc-500" />
                Career History Logs
              </h3>

              {isLoadingHistories ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : histories.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No career history logs found (this profile hasn't undergone mutations or status changes).</p>
              ) : (
                <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-3 space-y-8">
                  {histories.map((log: any) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 bg-zinc-950 dark:bg-white border-2 border-white dark:border-black h-3.5 w-3.5 rounded-full"></span>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                            {log.type}
                          </span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Effective: {log.effective_date}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Changed from <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{log.old_value || "None"}"</span> to <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{log.new_value}"</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
