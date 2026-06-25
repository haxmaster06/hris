"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  Eye,
  Megaphone,
  XCircle,
  Briefcase
} from "lucide-react";
import Link from "next/link";

import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";

interface Vacancy {
  id: string;
  company_id: string;
  company?: { name: string };
  branch_id?: string;
  branch?: { name: string };
  department_id?: string;
  department?: { name: string };
  position_id: string;
  position?: { name: string };
  title: string;
  description: string;
  requirements: string;
  slots: number;
  status: "draft" | "published" | "closed";
}

export default function VacancyManagement() {
  const t = useTranslations("recruitment.vacancies");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filter/Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  // Form State
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formPositionId, setFormPositionId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formReqs, setFormReqs] = useState("");
  const [formSlots, setFormSlots] = useState(1);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch Data
  const { data: vacancies, isLoading } = useQuery<Vacancy[]>({
    queryKey: ["vacancies"],
    queryFn: () => api.get("/vacancies").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => api.get("/companies").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => api.get("/branches").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.get("/positions").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/vacancies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast.success(t("toast.createSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.createFailed"));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/vacancies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast.success(t("toast.updateSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.updateFailed"));
    }
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/vacancies/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast.success(t("toast.publishSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.publishFailed"));
    }
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/vacancies/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast.success(t("toast.closeSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.closeFailed"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vacancies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacancies"] });
      toast.success(t("toast.deleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.deleteFailed"));
    }
  });

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  const handleOpenCreate = () => {
    setSelectedVacancy(null);
    setFormCompanyId("");
    setFormBranchId("");
    setFormDeptId("");
    setFormPositionId("");
    setFormTitle("");
    setFormDesc("");
    setFormReqs("");
    setFormSlots(1);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setFormCompanyId(vacancy.company_id);
    setFormBranchId(vacancy.branch_id || "");
    setFormDeptId(vacancy.department_id || "");
    setFormPositionId(vacancy.position_id);
    setFormTitle(vacancy.title);
    setFormDesc(vacancy.description);
    setFormReqs(vacancy.requirements);
    setFormSlots(vacancy.slots);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      company_id: formCompanyId,
      branch_id: formBranchId || null,
      department_id: formDeptId || null,
      position_id: formPositionId,
      title: formTitle,
      description: formDesc,
      requirements: formReqs,
      slots: formSlots,
    };

    if (selectedVacancy) {
      updateMutation.mutate({ id: selectedVacancy.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t("toast.confirmDelete"))) {
      deleteMutation.mutate(id);
    }
  };

  const filteredVacancies = Array.isArray(vacancies)
    ? vacancies.filter((vac) => {
        const matchesSearch = vac.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? vac.status === statusFilter : true;
        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("pageTitle")}
        subtitle={t("subtitle")}
        backUrl="/recruitment"
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Search & Filters */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">{t("statusAll")}</option>
                <option value="draft">{t("statusDraft")}</option>
                <option value="published">{t("statusPublished")}</option>
                <option value="closed">{t("statusClosed")}</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> {t("addVacancy")}
          </button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="h-64 flex flex-col justify-center items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">{tCommon("loading")}</p>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="h-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl flex flex-col justify-center items-center gap-3">
            <Briefcase className="h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">{t("noVacancies")}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-zinc-500 dark:text-zinc-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                <tr>
                  <th className="px-6 py-4">{t("thTitle")}</th>
                  <th className="px-6 py-4">{t("thDept")}</th>
                  <th className="px-6 py-4">{t("thSlots")}</th>
                  <th className="px-6 py-4">{t("thStatus")}</th>
                  <th className="px-6 py-4 text-right">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredVacancies.map((vacancy) => (
                  <tr key={vacancy.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-950 dark:text-zinc-50">{vacancy.title}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{vacancy.company?.name || "Global"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-900 dark:text-zinc-200 font-medium">{vacancy.position?.name || "N/A"}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{vacancy.department?.name || "General"}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-200 font-semibold">{vacancy.slots}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        vacancy.status === "published" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                          : vacancy.status === "closed"
                          ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                          : "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                      }`}>
                        {vacancy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {vacancy.status === "draft" && (
                          <button
                            onClick={() => publishMutation.mutate(vacancy.id)}
                            className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                            title="Publish Vacancy"
                          >
                            <Megaphone className="h-4 w-4" />
                          </button>
                        )}
                        {vacancy.status === "published" && (
                          <button
                            onClick={() => closeMutation.mutate(vacancy.id)}
                            className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                            title="Close Vacancy"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(vacancy)}
                          className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title="Edit Vacancy"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vacancy.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Delete Vacancy"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Vacancy Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedVacancy ? t("modalEditTitle") : t("modalAddTitle")}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formCompany")}</label>
                <select
                  required
                  value={formCompanyId}
                  onChange={(e) => setFormCompanyId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">{t("formCompany")}</option>
                  {Array.isArray(companies) && companies.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formBranch")}</label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="">{t("formBranchOpt")}</option>
                    {Array.isArray(branches) && branches.filter((b: any) => b.company_id === formCompanyId).map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formDept")}</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="">{t("formDeptOpt")}</option>
                    {Array.isArray(departments) && departments.filter((d: any) => d.company_id === formCompanyId).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formPosition")}</label>
                  <select
                    required
                    value={formPositionId}
                    onChange={(e) => setFormPositionId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="">{t("formPosition")}</option>
                    {Array.isArray(positions) && positions.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formSlots")}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formSlots}
                    onChange={(e) => setFormSlots(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formTitle")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("formTitlePlaceholder")}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formDesc")}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t("formDescPlaceholder")}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("formReqs")}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t("formReqsPlaceholder")}
                  value={formReqs}
                  onChange={(e) => setFormReqs(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-50 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? tCommon("loading") : tCommon("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
