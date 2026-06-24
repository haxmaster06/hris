"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Edit2, Trash2, Plus, Loader2, Eye } from "lucide-react";

interface Company {
  id: string;
  name: string;
  code: string;
  tax_number: string;
  address: string;
}

export default function CompanyTab() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", tax_number: "", address: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Companies
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await api.get("/companies");
      return res.data.data?.data || res.data.data || [];
    },
  });

  // Create Company Mutation
  const createMutation = useMutation({
    mutationFn: (newCompany: typeof formData) => api.post("/companies", newCompany),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Legal Entity created successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create legal entity");
    },
  });

  // Update Company Mutation
  const updateMutation = useMutation({
    mutationFn: (updated: { id: string; data: typeof formData }) =>
      api.put(`/companies/${updated.id}`, updated.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Legal Entity updated successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update legal entity");
    },
  });

  // Delete Company Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Legal Entity deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete legal entity");
    },
  });

  const handleOpenCreate = () => {
    setSelectedCompany(null);
    setFormData({ name: "", code: "", tax_number: "", address: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      tax_number: company.tax_number || "",
      address: company.address || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (company: Company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedCompany(null);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this legal entity?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (selectedCompany) {
      updateMutation.mutate({ id: selectedCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredCompanies = Array.isArray(companiesData)
    ? companiesData.filter(
        (c: Company) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Table Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Legal Entity
        </button>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <p className="text-zinc-500 text-sm">No legal entities found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3 hidden md:table-cell">Tax Number</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
              {filteredCompanies.map((company: Company) => (
                <tr key={company.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                  <td className="px-6 py-4 font-mono font-medium">{company.code}</td>
                  <td className="px-6 py-4 font-semibold">{company.name}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-zinc-500">{company.tax_number || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenView(company)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                        title="View Infolist"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(company)}
                        className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
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
      {isViewModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Legal Entity Detail (Infolist)</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-650 text-xl">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Legal Entity Code</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedCompany.code}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Legal Entity Name</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedCompany.name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Tax Registration Number</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selectedCompany.tax_number || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Address</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedCompany.address || "-"}</p>
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
                {selectedCompany ? "Edit Legal Entity" : "Add New Legal Entity"}
              </h3>
              <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-650 text-xl">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Legal Entity Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. HBM"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. PT HBM Manufacturing"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tax Number</label>
                <input
                  type="text"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  placeholder="e.g. 01.234.567.8-901.000"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950"
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
                {selectedCompany ? "Update Legal Entity" : "Create Legal Entity"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
