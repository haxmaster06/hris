"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Edit2, Trash2, Plus, Loader2, Eye } from "lucide-react";

interface Position {
  id: string;
  department_id: string;
  department?: { name: string };
  name: string;
  code: string;
  job_description: string;
}

interface Department {
  id: string;
  name: string;
}

export default function PositionTab() {
  const queryClient = useQueryClient();
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [formData, setFormData] = useState({ department_id: "", name: "", code: "", job_description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entityName = t("modules.organization.positions");

  // Fetch Positions
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await api.get("/positions");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Fetch Departments
  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Create
  const createMutation = useMutation({
    mutationFn: (newPos: typeof formData) => api.post("/positions", newPos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success(t("common.createdSuccess", { entity: entityName }));
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("common.failedCreate", { entity: entityName }));
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: (updated: { id: string; data: typeof formData }) =>
      api.put(`/positions/${updated.id}`, updated.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success(t("common.updatedSuccess", { entity: entityName }));
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("common.failedUpdate", { entity: entityName }));
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success(t("common.deletedSuccess", { entity: entityName }));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("common.failedDelete", { entity: entityName }));
    },
  });

  const handleOpenCreate = () => {
    setSelectedPos(null);
    setFormData({
      department_id: Array.isArray(deptsData) && deptsData.length > 0 ? deptsData[0].id : "",
      name: "",
      code: "",
      job_description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pos: Position) => {
    setSelectedPos(pos);
    setFormData({
      department_id: pos.department_id,
      name: pos.name,
      code: pos.code,
      job_description: pos.job_description || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (pos: Position) => {
    setSelectedPos(pos);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedPos(null);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("common.confirmDelete", { entity: entityName }))) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (selectedPos) {
      updateMutation.mutate({ id: selectedPos.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPositions = Array.isArray(positionsData)
    ? positionsData.filter((p: Position) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept ? p.department_id === filterDept : true;
        return matchesSearch && matchesDept;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
        <div className="flex flex-1 gap-3 max-w-2xl">
          <input
            type="text"
            placeholder={t("common.search") + "..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[150px] px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
          />
          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 focus:outline-none"
          >
            <option value="">{t("common.allDepartments")}</option>
            {Array.isArray(deptsData) &&
              deptsData.map((d: Department) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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

      {/* Table */}
      {isLoadingPositions ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : filteredPositions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950 select-none">
          <p className="text-zinc-500 text-sm">{t("common.noData")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900 select-none">
              <tr>
                <th className="px-6 py-3">{t("common.code")}</th>
                <th className="px-6 py-3">{entityName + " " + t("common.name")}</th>
                <th className="px-6 py-3 hidden md:table-cell">{t("modules.organization.departments")}</th>
                <th className="px-6 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
              {filteredPositions.map((pos: Position) => (
                <tr key={pos.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                  <td className="px-6 py-4 font-mono font-medium">{pos.code}</td>
                  <td className="px-6 py-4 font-semibold">{pos.name}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-zinc-500">{pos.department?.name || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenView(pos)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
                        title={t("common.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(pos)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                        title={t("common.edit")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(pos.id)}
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

      {/* View Infolist */}
      {isViewModalOpen && selectedPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{entityName + " " + t("common.view")}</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-650 text-xl cursor-pointer">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">{entityName + " " + t("common.code")}</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedPos.code}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">{entityName + " " + t("common.name")}</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedPos.name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">{t("modules.organization.departments")}</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedPos.department?.name || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Job Description</p>
                <p className="text-sm text-zinc-655 dark:text-zinc-400">{selectedPos.job_description || "-"}</p>
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

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedPos ? t("common.edit") + " " + entityName : t("common.create") + " " + entityName}
              </h3>
              <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 text-xl cursor-pointer">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t("modules.organization.departments")}</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                >
                  <option value="" disabled>{t("login.pleaseSelect")}</option>
                  {Array.isArray(deptsData) &&
                    deptsData.map((d: Department) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{entityName + " " + t("common.code")}</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. SR-ENG"
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
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Job Description</label>
                <textarea
                  value={formData.job_description}
                  onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                  placeholder="Key responsibilities and duties..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
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
                {selectedPos ? t("common.save") : t("common.create")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
