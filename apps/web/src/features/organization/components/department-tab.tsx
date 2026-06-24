"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Edit2, Trash2, Plus, Loader2, Eye, FolderGit2 } from "lucide-react";

interface Department {
  id: string;
  branch_id: string;
  branch?: { name: string };
  parent_id: string | null;
  parent?: { name: string };
  name: string;
  code: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function DepartmentTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ branch_id: "", parent_id: "", name: "", code: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Departments
  const { data: deptsData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Fetch Branches
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newDept: any) => api.post("/departments", newDept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create department");
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updated: { id: string; data: any }) =>
      api.put(`/departments/${updated.id}`, updated.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update department");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete department");
    },
  });

  const handleOpenCreate = () => {
    setSelectedDept(null);
    setFormData({
      branch_id: Array.isArray(branchesData) && branchesData.length > 0 ? branchesData[0].id : "",
      parent_id: "",
      name: "",
      code: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      branch_id: dept.branch_id,
      parent_id: dept.parent_id || "",
      name: dept.name,
      code: dept.code,
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (dept: Department) => {
    setSelectedDept(dept);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedDept(null);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      branch_id: formData.branch_id,
      parent_id: formData.parent_id === "" ? null : formData.parent_id,
      name: formData.name,
      code: formData.code,
    };
    if (selectedDept) {
      updateMutation.mutate({ id: selectedDept.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredDepts = Array.isArray(deptsData)
    ? deptsData.filter((d: Department) => {
        const matchesSearch =
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBranch = filterBranch ? d.branch_id === filterBranch : true;
        return matchesSearch && matchesBranch;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
        <div className="flex flex-1 gap-3 max-w-2xl">
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[150px] px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2"
          />
          {/* Branch Filter */}
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="">All Branches</option>
            {Array.isArray(branchesData) &&
              branchesData.map((b: Branch) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* Data Table */}
      {isLoadingDepts ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <p className="text-zinc-500 text-sm">No departments found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Department Name</th>
                <th className="px-6 py-3 hidden md:table-cell">Branch</th>
                <th className="px-6 py-3 hidden md:table-cell">Parent Dept</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
              {filteredDepts.map((dept: Department) => (
                <tr key={dept.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                  <td className="px-6 py-4 font-mono font-medium">{dept.code}</td>
                  <td className="px-6 py-4 font-semibold flex items-center gap-1.5">
                    {dept.parent_id && <FolderGit2 className="h-3.5 w-3.5 text-zinc-400" />}
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-zinc-500">{dept.branch?.name || "-"}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-zinc-500">
                    {dept.parent?.name || <span className="text-zinc-400 italic">None (Root)</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenView(dept)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                        title="View Infolist"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
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

      {/* View Infolist Modal */}
      {isViewModalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Department Detail (Infolist)</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Department Code</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedDept.code}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Department Name</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedDept.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Branch Location</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedDept.branch?.name || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Parent Department</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedDept.parent?.name || "None (Root)"}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <button
                onClick={closeModal}
                className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold hover:opacity-85"
              >
                Close View
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
                {selectedDept ? "Edit Department" : "Add New Department"}
              </h3>
              <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Branch</label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                >
                  <option value="" disabled>Select Branch</option>
                  {Array.isArray(branchesData) &&
                    branchesData.map((b: Branch) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Parent Department</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                >
                  <option value="">None (Root Department)</option>
                  {Array.isArray(deptsData) &&
                    deptsData
                      .filter((d: Department) => d.id !== selectedDept?.id) // Prevent self parent selection in UI
                      .map((d: Department) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. IT-01"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Information Technology"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <button
                type="button"
                onClick={closeModal}
                className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold hover:opacity-85"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {selectedDept ? "Update Department" : "Create Department"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
