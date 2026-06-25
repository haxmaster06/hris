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
  Award
} from "lucide-react";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";

interface Certification {
  id: string;
  name: string;
  code: string;
  issuer: string;
  validity_period?: number; // validity in months
}

export default function MasterCertificationManagement() {
  const t = useTranslations("certification.master");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formIssuer, setFormIssuer] = useState("");
  const [formValidity, setFormValidity] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch certifications
  const { data: certifications, isLoading } = useQuery<Certification[]>({
    queryKey: ["certifications"],
    queryFn: () => api.get("/certifications").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/certifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success(t("toast.createSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.createFailed"));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/certifications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success(t("toast.updateSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.updateFailed"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success(t("toast.deleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.deleteFailed"));
    }
  });

  const handleOpenCreate = () => {
    setSelectedCert(null);
    setFormName("");
    setFormCode("");
    setFormIssuer("");
    setFormValidity("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cert: Certification) => {
    setSelectedCert(cert);
    setFormName(cert.name);
    setFormCode(cert.code);
    setFormIssuer(cert.issuer);
    setFormValidity(cert.validity_period !== undefined && cert.validity_period !== null ? String(cert.validity_period) : "");
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
      issuer: formIssuer,
      validity_period: formValidity === "" ? null : Number(formValidity)
    };

    if (selectedCert) {
      updateMutation.mutate({ id: selectedCert.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  // Filter implementation
  const filteredCerts = Array.isArray(certifications) ? certifications.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.issuer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("pageTitle")}
        subtitle={t("subtitle")}
        backUrl="/certification"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 shadow-sm">
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

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> {t("addCert")}
          </button>
        </div>

        {/* Data List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl">
            <Award className="h-12 w-12 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-md font-bold text-zinc-700 dark:text-zinc-300">{t("noCerts")}</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">{t("noCertsDesc")}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.code")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.name")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.issuer")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.validity")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">{tCommon("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{cert.code}</td>
                    <td className="px-6 py-4 text-sm text-zinc-950 dark:text-zinc-50">{cert.name}</td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-200">{cert.issuer}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {cert.validity_period ? `${cert.validity_period} ${t("months")}` : t("lifetime")}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cert)}
                          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title={tCommon("edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id)}
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
                {selectedCert ? t("modal.editTitle") : t("modal.addTitle")}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-sm font-semibold">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.code")}</label>
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
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.name")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("modal.namePlaceholder")}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.issuer")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("modal.issuerPlaceholder")}
                  value={formIssuer}
                  onChange={(e) => setFormIssuer(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.validity")}</label>
                <input
                  type="number"
                  min={1}
                  placeholder={t("modal.validityPlaceholder")}
                  value={formValidity}
                  onChange={(e) => setFormValidity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
                <p className="text-[10px] text-zinc-400 mt-1">{t("modal.validityHint")}</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/95 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {selectedCert ? t("modal.saveChanges") : t("modal.saveCert")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
