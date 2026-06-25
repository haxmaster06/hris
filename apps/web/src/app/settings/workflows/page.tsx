"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { 
  Plus, Loader2, ArrowLeft, Settings2, Trash2, Eye, ToggleLeft, ToggleRight, AlertCircle, FileText
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";

interface WorkflowDefinition {
  id: string;
  name: string;
  module: string;
  entity_type: string;
  description: string | null;
  is_active: boolean;
  version: number;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Fetch Workflow Definitions
  const { data: workflows, isLoading, error } = useQuery<WorkflowDefinition[]>({
    queryKey: ["workflow-definitions-list"],
    queryFn: async () => {
      const res = await api.get("/workflow-definitions");
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: isAuthenticated && mounted,
  });

  // Toggle Active Status Mutation
  const toggleMutation = useMutation({
    mutationFn: (workflow: WorkflowDefinition) => 
      api.put(`/workflow-definitions/${workflow.id}`, {
        ...workflow,
        is_active: !workflow.is_active,
        steps: [] // backend akan mempertahankan steps jika dikirim kosong atau di-update terpisah
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-definitions-list"] });
      toast.success("Status alur kerja berhasil diperbarui.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengubah status alur kerja.");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/workflow-definitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-definitions-list"] });
      toast.success("Definisi alur kerja berhasil dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus alur kerja.");
    }
  });

  const handleDelete = async (id: string, name: string) => {
    const confirmRes = await Swal.fire({
      title: "Hapus Alur Kerja?",
      text: `Apakah Anda yakin ingin menghapus alur kerja "${name}" secara permanen?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const getModuleLabel = (moduleName: string) => {
    switch (moduleName.toLowerCase()) {
      case "leave": return "Cuti / Absensi";
      case "payroll": return "Penggajian (Payroll)";
      case "claim": return "Klaim Reimbursement";
      case "recruitment": return "Rekrutmen Baru";
      default: return moduleName;
    }
  };

  if (!mounted || !hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/85 bg-white/80 dark:border-zinc-900 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Pengaturan Workflow</h1>
              <p className="text-[10px] text-zinc-500">Konfigurasi persetujuan berjenjang dinamis per modul.</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/settings/workflows/new")}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Buat Alur Baru
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-xs font-semibold">Gagal memuat daftar alur persetujuan. Silakan hubungi admin.</p>
          </div>
        ) : !workflows || workflows.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-12 text-center max-w-xl mx-auto mt-8 shadow-sm space-y-4">
            <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400">
              <Settings2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">Belum Ada Workflow</h3>
              <p className="text-xs text-zinc-500">Buat alur approval pertama Anda untuk mengotomatisasi persetujuan dokumen.</p>
            </div>
            <button
              onClick={() => router.push("/settings/workflows/new")}
              className="mx-auto px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 cursor-pointer"
            >
              Buat Alur Baru
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(workflows || []).map((wf) => (
              <div 
                key={wf.id} 
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold text-zinc-700 dark:text-zinc-350">
                      {getModuleLabel(wf.module)}
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate(wf)}
                      className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {wf.is_active ? (
                        <ToggleRight className="h-7 w-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-7 w-7" />
                      )}
                    </button>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">{wf.name}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {wf.description || "Tidak ada deskripsi disediakan."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Versi {wf.version}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(wf.id, wf.name)}
                      className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-500 hover:text-red-500 cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => router.push(`/settings/workflows/${wf.id}`)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-950 dark:border-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-950 dark:text-zinc-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> Visual Builder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
