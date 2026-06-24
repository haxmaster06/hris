"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Edit2, Trash2, Plus, Loader2, Eye } from "lucide-react";

interface Division {
  id: string;
  name: string;
  code: string;
  description: string;
}

export default function DivisionTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDiv, setSelectedDiv] = useState<Division | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Divisions
  const { data: divisionsData, isLoading } = useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const res = await api.get("/divisions");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Create
  const createMutation = useMutation({
    mutationFn: (newDiv: typeof formData) => api.post("/divisions", newDiv),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      toast.success("Division created successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create division");
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: (updated: { id: string; data: typeof formData }) =>
      api.put(`/divisions/${updated.id}`, updated.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      toast.success("Division updated successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update division");
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/divisions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      toast.success("Division deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete division");
    },
  });

  const handleOpenCreate = () => {
    setSelectedDiv(null);
    setFormData({ name: "", code: "", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (div: Division) => {
    setSelectedDiv(div);
    setFormData({
      name: div.name,
      code: div.code,
      description: div.description || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (div: Division) => {
    setSelectedDiv(div);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedDiv(null);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this division?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (selectedDiv) {
      updateMutation.mutate({ id: selectedDiv.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredDivisions = Array.isArray(divisionsData)
    ? divisionsData.filter(
        (d: Division) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search divisions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Division
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : filteredDivisions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <p className="text-zinc-500 text-sm">No divisions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Division Name</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
              {filteredDivisions.map((div: Division) => (
                <tr key={div.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                  <td className="px-6 py-4 font-mono font-medium">{div.code}</td>
                  <td className="px-6 py-4 font-semibold">{div.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenView(div)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                        title="View Infolist"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(div)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(div.id)}
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

      {/* View Infolist */}
      {isViewModalOpen && selectedDiv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Division Detail (Infolist)</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Division Code</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedDiv.code}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Division Name</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedDiv.name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Description</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedDiv.description || "-"}</p>
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

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedDiv ? "Edit Division" : "Add New Division"}
              </h3>
              <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-600">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Division Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. DIV-IT"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Division Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Technology Division"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details of division responsibility..."
                  rows={3}
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
                {selectedDiv ? "Update Division" : "Create Division"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
