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
  BookOpen
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";

interface Training {
  id: string;
  name: string;
  code: string;
  category: "Leadership" | "Technical" | "Safety" | "Compliance";
  type: "Internal" | "External";
  description?: string;
}

export default function MasterTrainingManagement() {
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
      toast.success("Master Training created successfully");
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create training");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/trainings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Master Training updated successfully");
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update training");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/trainings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      toast.success("Training deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete training");
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
    if (confirm("Are you sure you want to delete this master training?")) {
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
        title="Master Training Courses"
        subtitle="Configure training tracks, categories, curriculum codes, and types."
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
                placeholder="Search by name or code..."
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
              <option value="">All Categories</option>
              <option value="Leadership">Leadership</option>
              <option value="Technical">Technical</option>
              <option value="Safety">Safety</option>
              <option value="Compliance">Compliance</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">All Types</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> Add Course
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
            <h3 className="text-md font-bold text-zinc-700 dark:text-zinc-300">No courses found</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">Try expanding your search parameters or add a new course.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Course Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Course Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
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
                        {training.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${training.type === "Internal" ? "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" : "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"}
                      `}>
                        {training.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">{training.description || "-"}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(training)}
                          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title="Edit Course"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(training.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Delete Course"
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
                {selectedTraining ? "Edit Master Course" : "Add Master Course"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRN-ISO-9001"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ISO 9001 Quality Management System"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="Leadership">Leadership</option>
                    <option value="Technical">Technical</option>
                    <option value="Safety">Safety</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Describe the learning objectives or prerequisite requirements..."
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
                  {selectedTraining ? "Save Changes" : "Create Master Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
