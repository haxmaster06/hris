"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { Loader2, CheckSquare, Square, Plus, Trash2, UserCheck, Calendar, ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  employee_number: string;
  status: string;
  join_date: string;
  position?: { name: string };
  department?: { name: string };
}

interface OnboardingTask {
  id: string;
  category: string;
  task_name: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [taskData, setTaskData] = useState({
    category: "document",
    task_name: "",
    description: "",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    sort_order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch employees under probation / contract (new hires)
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["onboarding-employees"],
    queryFn: async () => {
      const res = await api.get("/employees?include=position,department");
      const list = res.data.data?.data || res.data.data || [];
      // Filter new hires (probation / contract status, or we show all for onboarding checklists if exist)
      return list.filter((e: Employee) => e.status === "probation" || e.status === "contract" || e.status === "applicant");
    },
    enabled: isAuthenticated,
  });

  // Automatically select first employee if not selected
  useEffect(() => {
    if (Array.isArray(employees) && employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  // Fetch tasks of selected employee
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["onboarding-tasks", selectedEmployeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${selectedEmployeeId}/onboarding`);
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && !!selectedEmployeeId,
  });

  // Toggle complete mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: (payload: { taskId: string; isCompleted: boolean }) =>
      api.patch(`/employees/${selectedEmployeeId}/onboarding/${payload.taskId}/complete`, {
        is_completed: payload.isCompleted
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks", selectedEmployeeId] });
      toast.success("Status tugas orientasi berhasil diperbarui.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengubah status tugas.");
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (newTask: any) => api.post(`/employees/${selectedEmployeeId}/onboarding`, newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks", selectedEmployeeId] });
      toast.success("Tugas onboarding berhasil ditambahkan.");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menambahkan tugas onboarding.");
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.delete(`/employees/${selectedEmployeeId}/onboarding/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks", selectedEmployeeId] });
      toast.success("Tugas onboarding berhasil dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus tugas.");
    }
  });

  const handleToggleComplete = (task: OnboardingTask) => {
    toggleCompleteMutation.mutate({ taskId: task.id, isCompleted: !task.is_completed });
  };

  const handleDelete = (taskId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tugas onboarding ini?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleOpenCreate = () => {
    setTaskData({
      category: "document",
      task_name: "",
      description: "",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      sort_order: 0
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    createTaskMutation.mutate(taskData);
  };

  // Calculate progress
  const completedCount = Array.isArray(tasks) ? tasks.filter((t: OnboardingTask) => t.is_completed).length : 0;
  const totalCount = Array.isArray(tasks) ? tasks.length : 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const selectedEmployee = employees?.find((e: Employee) => e.id === selectedEmployeeId);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "document":
        return "Dokumen & KTP";
      case "equipment":
        return "Fasilitas & Laptop";
      case "account":
        return "Akun & Email";
      case "orientation":
        return "Orientasi Kantor";
      case "training":
        return "Training Wajib";
      default:
        return category;
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Proses Onboarding Karyawan"
        subtitle="Kelola dan pantau tugas orientasi serta persiapan fasilitas karyawan baru."
        backUrl="/employee-lifecycle"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left panel: Employee List */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider select-none">Karyawan Baru</h3>
            {isLoadingEmployees ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : !employees || employees.length === 0 ? (
              <p className="text-xs text-zinc-500 italic select-none">Tidak ada karyawan baru aktif.</p>
            ) : (
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {employees.map((emp: Employee) => {
                  const empName = `${emp.first_name} ${emp.last_name || ""}`;
                  const isSelected = emp.id === selectedEmployeeId;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-zinc-950 text-white dark:bg-zinc-900 border-zinc-950 dark:border-zinc-800"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      <h4 className="text-sm font-bold truncate">{empName}</h4>
                      <p className={`text-[10px] ${isSelected ? "text-zinc-400" : "text-zinc-500"} mt-0.5`}>
                        {emp.position?.name || "No Position"} &bull; {emp.department?.name || "-"}
                      </p>
                      <p className={`text-[9px] font-mono mt-1 ${isSelected ? "text-zinc-450" : "text-zinc-400"}`}>
                        Bergabung: {emp.join_date}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Checklist details */}
          <div className="md:col-span-2 space-y-6">
            {selectedEmployeeId && selectedEmployee ? (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Employee details & progress */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-150 dark:border-zinc-900 pb-5 select-none">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                      Checklist Onboarding: {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      NIP: {selectedEmployee.employee_number} &bull; {selectedEmployee.position?.name || "No Position"}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Tugas
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 select-none">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-500 dark:text-zinc-400">Progress Orientasi</span>
                    <span className="text-zinc-950 dark:text-zinc-50">
                      {completedCount} / {totalCount} Tugas ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Task List */}
                {isLoadingTasks ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                  </div>
                ) : !tasks || tasks.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl">
                    <p className="text-zinc-500 text-xs select-none">Belum ada tugas onboarding yang ditugaskan.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-900">
                    {tasks.map((task: OnboardingTask) => (
                      <div key={task.id} className="py-4.5 flex items-start gap-4 group">
                        {/* Checkbox Icon */}
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="mt-0.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer transition-colors"
                        >
                          {task.is_completed ? (
                            <CheckSquare className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h4 className={`text-sm font-bold ${task.is_completed ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100"}`}>
                              {task.task_name}
                            </h4>
                            <span className="text-[10px] font-mono text-zinc-450 dark:text-zinc-500">
                              Kategori: {getCategoryLabel(task.category)}
                            </span>
                          </div>
                          {task.description && (
                            <p className={`text-xs ${task.is_completed ? "text-zinc-400" : "text-zinc-550 dark:text-zinc-400"}`}>
                              {task.description}
                            </p>
                          )}
                          {task.due_date && (
                            <p className="text-[10px] text-zinc-450 flex items-center gap-1 select-none">
                              <Calendar className="h-3.5 w-3.5" /> Batas Waktu: {task.due_date}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 transition-opacity cursor-pointer self-center"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-12 shadow-sm text-center">
                <p className="text-zinc-500 text-sm select-none">Silakan pilih karyawan baru di sebelah kiri.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Tambah Tugas Onboarding Baru</h3>
                <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-650 text-xl cursor-pointer">&times;</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Kategori</label>
                  <select
                    value={taskData.category}
                    onChange={(e) => setTaskData({ ...taskData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="document">Dokumen (KTP, Kontrak, dll)</option>
                    <option value="equipment">Fasilitas (Laptop, Meja, dll)</option>
                    <option value="account">Akun (Email, Slack, dll)</option>
                    <option value="orientation">Orientasi Kantor</option>
                    <option value="training">Training / Pelatihan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nama Tugas</label>
                  <input
                    type="text"
                    required
                    value={taskData.task_name}
                    onChange={(e) => setTaskData({ ...taskData, task_name: e.target.value })}
                    placeholder="e.g. Penyerahan Salinan Buku Tabungan"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Deskripsi Detail</label>
                  <textarea
                    value={taskData.description}
                    onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                    placeholder="Petunjuk pengerjaan tugas..."
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Batas Waktu (Due Date)</label>
                  <input
                    type="date"
                    required
                    value={taskData.due_date}
                    onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
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
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Tambah Tugas
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
