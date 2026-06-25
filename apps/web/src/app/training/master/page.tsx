"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  BookOpen
} from "lucide-react";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations, useLocale } from "next-intl";

interface Training {
  id: string;
  name: string;
  code: string;
  category: "Leadership" | "Technical" | "Safety" | "Compliance";
  type: "Internal" | "External";
  description?: string;
}

export default function MasterTrainingManagement() {
  const t = useTranslations("training.master");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState<"Leadership" | "Technical" | "Safety" | "Compliance">("Technical");
  const [formType, setFormType] = useState<"Internal" | "External">("Internal");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch trainings
  const { data: trainings, isLoading } = useQuery<Training[]>({
    queryKey: ["trainings"],
    queryFn: () => api.get("/trainings").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/trainings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success(t("toast.createSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.createFailed"));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/trainings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success(t("toast.updateSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.updateFailed"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/trainings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success(t("toast.deleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.deleteFailed"));
    }
  });

  const handleOpenCreate = () => {
    setSelectedTraining(null);
    setFormName("");
    setFormCode("");
    setFormCategory("Technical");
    setFormType("Internal");
    setFormDesc("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (training: Training) => {
    setSelectedTraining(training);
    setFormName(training.name);
    setFormCode(training.code);
    setFormCategory(training.category);
    setFormType(training.type);
    setFormDesc(training.description || "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("toast.confirmDelete"))) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formName,
      code: formCode,
      category: formCategory,
      type: formType,
      description: formDesc
    };

    if (selectedTraining) {
      updateMutation.mutate({ id: selectedTraining.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCategoryLabel = (cat: string) => {
    if (locale === "id") {
      switch (cat) {
        case "Leadership": return "Kepemimpinan";
        case "Technical": return "Teknis";
        case "Safety": return "Keselamatan";
        case "Compliance": return "Kepatuhan";
        default: return cat;
      }
    }
    return cat;
  };

  const getTypeLabel = (type: string) => {
    if (locale === "id") {
      return type === "Internal" ? "Internal" : "Eksternal";
    }
    return type;
  };

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  // Filter implementation
  const filteredTrainings = Array.isArray(trainings) ? trainings.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "" || t.category === categoryFilter;
    const matchesType = typeFilter === "" || t.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  }) : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("pageTitle")}
        subtitle={t("subtitle")}
        backUrl="/training"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 shadow-sm">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">{t("allCategories")}</option>
              <option value="Leadership">{getCategoryLabel("Leadership")}</option>
              <option value="Technical">{getCategoryLabel("Technical")}</option>
              <option value="Safety">{getCategoryLabel("Safety")}</option>
              <option value="Compliance">{getCategoryLabel("Compliance")}</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">{t("allTypes")}</option>
              <option value="Internal">{getTypeLabel("Internal")}</option>
              <option value="External">{getTypeLabel("External")}</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> {t("addCourse")}
          </button>
        </div>

        {/* Data List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl">
            <BookOpen className="h-12 w-12 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-md font-bold text-zinc-700 dark:text-zinc-300">{t("noCourses")}</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">{t("noCoursesDesc")}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.code")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.name")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.category")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.type")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.description")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTrainings.map((training) => (
                  <tr key={training.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{training.code}</td>
                    <td className="px-6 py-4 text-sm text-zinc-950 dark:text-zinc-50">{training.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${training.category === "Leadership" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" : ""}
                        ${training.category === "Technical" ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" : ""}
                        ${training.category === "Safety" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : ""}
                        ${training.category === "Compliance" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" : ""}
                      `}>
                        {getCategoryLabel(training.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${training.type === "Internal" ? "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" : "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"}
                      `}>
                        {getTypeLabel(training.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">{training.description || "-"}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(training)}
                          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title={tCommon("edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(training.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title={tCommon("delete")}
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

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedTraining ? t("modal.editTitle") : t("modal.addTitle")}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formCode")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("modal.codePlaceholder")}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formName")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("modal.namePlaceholder")}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formCategory")}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="Leadership">{getCategoryLabel("Leadership")}</option>
                    <option value="Technical">{getCategoryLabel("Technical")}</option>
                    <option value="Safety">{getCategoryLabel("Safety")}</option>
                    <option value="Compliance">{getCategoryLabel("Compliance")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formType")}</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="Internal">{getTypeLabel("Internal")}</option>
                    <option value="External">{getTypeLabel("External")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formDesc")}</label>
                <textarea
                  placeholder={t("modal.descPlaceholder")}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/95 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {selectedTraining ? t("modal.saveChanges") : t("modal.saveCourse")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
