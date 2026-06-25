"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Swal from "sweetalert2";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Users2, 
  BookOpen, 
  Briefcase, 
  History, 
  Calendar, 
  Layers 
} from "lucide-react";
import Link from "next/link";
import { 
  FamilySection, 
  EducationSection, 
  ExperienceSection 
} from "@/features/employees/components/sub-resources";
import EmployeeTimeline from "@/features/employees/components/employee-timeline";

type TabName = "personal" | "family" | "education" | "experience" | "career-history" | "timeline";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations();
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
      toast.error(t("modules.employees.accessSelfError"));
    }
  }, [isAuthenticated, isAdmin, employeeId, router, t]);

  // Fetch Employee Profile
  const { data: employee, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
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

  // Request Update Info states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Fetch pending update requests
  const { data: pendingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ["profile-requests", employeeId],
    queryFn: () => api.get("/profile-update-requests?status=pending").then((res) => {
      const list = res.data.data || [];
      return list.filter((r: any) => r.employee_id === employeeId);
    }),
    enabled: isAuthenticated && !!employeeId,
  });

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingRequest(true);
      let submittedCount = 0;

      const fields = [
        { key: "email", val: editEmail, old: employee?.email },
        { key: "phone", val: editPhone, old: employee?.phone },
        { key: "address", val: editAddress, old: employee?.address },
      ];

      for (const field of fields) {
        const trimmedNewVal = (field.val || "").trim();
        const trimmedOldVal = (field.old || "").trim();
        
        if (trimmedNewVal !== trimmedOldVal) {
          await api.post("/profile-update-requests", {
            employee_id: employeeId,
            field_name: field.key,
            new_value: trimmedNewVal,
          });
          submittedCount++;
        }
      }

      if (submittedCount > 0) {
        toast.success(`${submittedCount} pengajuan perubahan data dikirim ke HR.`);
        setIsRequestModalOpen(false);
        refetchRequests();
      } else {
        toast.info("Tidak ada perubahan data terdeteksi.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal mengirim pengajuan perubahan data.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleProcessRequest = async (id: string, action: "approve" | "reject") => {
    const confirmRes = await Swal.fire({
      title: action === "approve" ? "Setujui Perubahan?" : "Tolak Perubahan?",
      input: "text",
      inputLabel: "Catatan / Komentar (Opsional)",
      inputPlaceholder: "Tulis alasan...",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "Ya, Proses" : "Ya, Tolak",
      cancelButtonText: "Batal",
      confirmButtonColor: action === "approve" ? "#059669" : "#dc2626",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      try {
        const response = await api.post(`/profile-update-requests/${id}/${action}`, {
          comments: confirmRes.value || "",
        });

        if (response.data.success) {
          toast.success(action === "approve" ? "Pengajuan disetujui, profil terupdate!" : "Pengajuan ditolak.");
          refetchRequests();
          refetchProfile();
        } else {
          toast.error("Gagal memproses pengajuan.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan sistem saat memproses.");
      }
    }
  };

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
        <p className="text-zinc-500 text-sm">{t("modules.employees.notFound")}</p>
        <Link href="/employees" className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {t("modules.employees.backToDirectory")}
        </Link>
      </div>
    );
  }

  const tabs: { name: TabName; label: string; icon: any }[] = [
    { name: "personal", label: t("modules.employees.personalInfo"), icon: User },
    { name: "family", label: t("modules.employees.family"), icon: Users2 },
    { name: "education", label: t("modules.employees.education"), icon: BookOpen },
    { name: "experience", label: t("modules.employees.experience"), icon: Briefcase },
    { name: "timeline", label: "Timeline", icon: Calendar },
    { name: "career-history", label: t("modules.employees.careerLogs"), icon: History },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 sticky top-0 z-40 select-none">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/employees"
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title={t("modules.employees.backToDirectory")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">{t("modules.employees.profileTitle")}</h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400">{t("modules.employees.profileSubtitle")}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Core Profile Banner Card */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-zinc-950 text-white dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center text-3xl font-bold border border-zinc-200 dark:border-zinc-800 select-none">
            {employee.first_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                {employee.first_name} {employee.last_name}
              </h2>
              <span className={`inline-flex self-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase select-none ${
                employee.status === "permanent"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              }`}>
                {employee.status === "permanent" 
                  ? t("modules.employees.permanent") 
                  : employee.status === "contract" 
                  ? t("modules.employees.contract") 
                  : t("modules.employees.probation")}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono select-none">NIP: {employee.employee_number}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 pt-2 text-xs text-zinc-600 dark:text-zinc-400 select-none">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-zinc-450" />
                {employee.department?.name || "-"} &bull; {employee.position?.name || "-"}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-450" />
                {t("modules.employees.joinDate")}: {employee.join_date}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Update Requests (Admin Only) */}
        {isAdmin && pendingRequests && pendingRequests.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Pending Profile Update Requests ({pendingRequests.length})
            </h4>
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl">
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">
                      Ubah field <span className="font-mono text-indigo-650 dark:text-indigo-400 font-bold">{req.field_name}</span>
                    </p>
                    <p className="text-zinc-500">
                      Nilai Lama: <span className="font-semibold text-zinc-850 dark:text-zinc-300">{req.old_value || "-"}</span>
                    </p>
                    <p className="text-zinc-500">
                      Nilai Baru: <span className="font-semibold text-zinc-850 dark:text-zinc-350">{req.new_value}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcessRequest(req.id, "reject")}
                      className="px-3 py-1 text-xs border border-red-250 hover:bg-red-50 text-red-650 dark:hover:bg-red-950/20 rounded font-semibold cursor-pointer"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => handleProcessRequest(req.id, "approve")}
                      className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer"
                    >
                      Setujui
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-2 flex flex-wrap gap-1 shadow-sm select-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
            <div className="space-y-6 animate-enter">
              <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-900 pb-3 mb-4 select-none">
                <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <User className="h-5 w-5 text-zinc-500" />
                  {t("modules.employees.personalDossier")}
                </h3>
                {!isAdmin && (
                  <button
                    onClick={() => {
                      setEditEmail(employee.email || "");
                      setEditPhone(employee.phone || "");
                      setEditAddress(employee.address || "");
                      setIsRequestModalOpen(true);
                    }}
                    className="inline-flex items-center py-1.5 px-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-lg text-xs font-bold hover:opacity-90 cursor-pointer shadow-sm"
                  >
                    Request Update Info
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.employees.gender")}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{employee.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.employees.birthDate")}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.birth_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.employees.joinDate")}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.join_date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">{t("common.company")}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.company?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.employees.branchOffice")}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.branch?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.employees.department")}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.department?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.employees.jobPosition")}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{employee.position?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Email Address</p>
                  <p className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 truncate" title={employee.email || ""}>{employee.email || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Phone Number</p>
                  <p className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">{employee.phone || "-"}</p>
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Current Address</p>
                  <p className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 leading-relaxed">{employee.address || "-"}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "family" && <FamilySection employeeId={employeeId} />}

          {activeTab === "education" && <EducationSection employeeId={employeeId} />}

          {activeTab === "experience" && <ExperienceSection employeeId={employeeId} />}

          {activeTab === "timeline" && <EmployeeTimeline employeeId={employeeId} />}

          {activeTab === "career-history" && (
            <div className="space-y-6 animate-enter">
              <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center gap-2 select-none">
                <History className="h-5 w-5 text-zinc-500" />
                {t("modules.employees.careerLogsTitle")}
              </h3>

              {isLoadingHistories ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : histories.length === 0 ? (
                <p className="text-xs text-zinc-500 italic select-none">{t("modules.employees.noCareerLogs")}</p>
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
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1 select-none">
                            <Calendar className="h-3.5 w-3.5" />
                            {t("modules.employees.effectiveDate", { date: log.effective_date })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-650 dark:text-zinc-400">
                          {t("modules.employees.changedFromTo", { oldValue: log.old_value || "None", newValue: log.new_value })}
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

      {/* Request Profile Update Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsRequestModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl z-10 animate-page-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 border-b border-zinc-150 dark:border-zinc-900 pb-3 mb-5">
              Request Info Update
            </h3>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. employee@company.com"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="e.g. 628123456789"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Current Address
                </label>
                <textarea
                  required
                  rows={3}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all resize-none"
                  placeholder="Enter full residential address..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="inline-flex items-center gap-1.5 py-2 px-4.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold disabled:opacity-50 shadow-md transition-all cursor-pointer"
                >
                  {isSubmittingRequest && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
