"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Edit2, Trash2, Plus, Loader2, Eye, ToggleLeft, ToggleRight } from "lucide-react";

interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  company_id: string | null;
  company?: { name: string };
  is_active: boolean;
}

interface Company {
  id: string;
  name: string;
}

export default function CostCenterTab() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCC, setSelectedCC] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    company_id: "",
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entityName = t("modules.organization.costCenters") || "Cost Center";

  // Fetch Cost Centers
  const { data: ccData, isLoading: isLoadingCC } = useQuery({
    queryKey: ["cost-centers"],
    queryFn: async () => {
      const res = await api.get("/cost-centers?include=company");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Fetch Companies
  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await api.get("/companies");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newCC: any) => api.post("/cost-centers", newCC),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success(t("common.createdSuccess", { entity: entityName }));
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("common.failedCreate", { entity: entityName }));
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updated: { id: string; data: any }) =>
      api.put(`/cost-centers/${updated.id}`, updated.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success(t("common.updatedSuccess", { entity: entityName }));
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("common.failedUpdate", { entity: entityName }));
    },
  });

  // Toggle Active Status
  const toggleActiveMutation = useMutation({
    mutationFn: (cc: CostCenter) =>
      api.put(`/cost-centers/${cc.id}`, {
        code: cc.code,
        name: cc.name,
        company_id: cc.company_id,
        is_active: !cc.is_active
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success(t("common.updatedSuccess", { entity: entityName }));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("common.failedUpdate", { entity: entityName }));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cost-centers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      toast.success(t("common.deletedSuccess", { entity: entityName }));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("common.failedDelete", { entity: entityName }));
    },
  });

  const handleOpenCreate = () => {
    setSelectedCC(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      company_id: Array.isArray(companiesData) && companiesData.length > 0 ? companiesData[0].id : "",
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cc: CostCenter) => {
    setSelectedCC(cc);
    setFormData({
      code: cc.code,
      name: cc.name,
      description: cc.description || "",
      company_id: cc.company_id || "",
      is_active: cc.is_active
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (cc: CostCenter) => {
    setSelectedCC(cc);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedCC(null);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("common.confirmDelete", { entity: entityName }))) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (cc: CostCenter) => {
    toggleActiveMutation.mutate(cc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      company_id: formData.company_id === "" ? null : formData.company_id,
      is_active: formData.is_active
    };
    if (selectedCC) {
      updateMutation.mutate({ id: selectedCC.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredCC = Array.isArray(ccData)
    ? ccData.filter((c: CostCenter) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = filterCompany ? c.company_id === filterCompany : true;
        return matchesSearch && matchesCompany;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
        <div className="flex flex-1 gap-3 max-w-2xl">
          <input
            type="text"
            placeholder={t("common.search") + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[150px] px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2"
          />
          {/* Company Filter */}
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="">{t("common.allCompanies") || "Semua Perusahaan"}</option>
            {Array.isArray(companiesData) &&
              companiesData.map((c: Company) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("common.create") + " " + entityName}
        </button>
      </div>

      {/* Data Table */}
      {isLoadingCC ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : filteredCC.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950 select-none">
          <p className="text-zinc-500 text-sm">{t("common.noData")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900 select-none">
              <tr>
                <th className="px-6 py-3">{t("common.code")}</th>
                <th className="px-6 py-3">{entityName + " " + t("common.name")}</th>
                <th className="px-6 py-3 hidden md:table-cell">{t("modules.organization.companies") || "Perusahaan"}</th>
                <th className="px-6 py-3">{t("common.status") || "Status"}</th>
                <th className="px-6 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
              {filteredCC.map((cc: CostCenter) => (
                <tr key={cc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                  <td className="px-6 py-4 font-mono font-medium">{cc.code}</td>
                  <td className="px-6 py-4 font-semibold">{cc.name}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-zinc-500">{cc.company?.name || "-"}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(cc)}
                      className="text-zinc-500 dark:text-zinc-450 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                      title={cc.is_active ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {cc.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <ToggleRight className="h-5 w-5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-zinc-450 font-medium">
                          <ToggleLeft className="h-5 w-5" /> Inactive
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenView(cc)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
                        title={t("common.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(cc)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                        title={t("common.edit")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cc.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 cursor-pointer"
                        title={t("common.delete")}
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

      {/* View Modal */}
      {isViewModalOpen && selectedCC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{entityName + " " + t("common.view")}</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-650 text-xl cursor-pointer">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">{t("common.code")}</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedCC.code}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">{entityName + " " + t("common.name")}</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedCC.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.organization.companies") || "Perusahaan"}</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedCC.company?.name || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Status</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedCC.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">{t("common.description")}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedCC.description || "-"}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <button
                onClick={closeModal}
                className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold hover:opacity-85 cursor-pointer"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedCC 
                  ? t("common.edit") + " " + entityName 
                  : t("common.create") + " " + entityName}
              </h3>
              <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 text-xl cursor-pointer">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t("modules.organization.companies") || "Perusahaan"}</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                >
                  <option value="">{t("login.pleaseSelect") || "Silahkan Pilih"}</option>
                  {Array.isArray(companiesData) &&
                    companiesData.map((c: Company) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t("common.code")}</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CC-HQ-OPS"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{entityName + " " + t("common.name")}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Headquarters Operations"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t("common.description")}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details of cost allocation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded dark:bg-zinc-900 border-zinc-300 focus:ring-zinc-950 h-4 w-4 text-zinc-950"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t("common.active") || "Aktif"}</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={closeModal}
                className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold hover:opacity-85 cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {selectedCC ? t("common.save") : t("common.create")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
