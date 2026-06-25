"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { 
  ArrowLeft, Loader2, Save, Plus, Trash2, Move, AlertCircle, Settings, HelpCircle, Shield, User as UserIcon, Users
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";

interface Step {
  id?: string;
  step_order: number;
  name: string;
  approver_type: "role" | "specific_user" | "reports_to" | "department_head";
  approver_role_id?: string | null;
  approver_user_id?: string | null;
  condition_expression?: {
    field: string;
    operator: string;
    value: any;
  } | null;
  is_optional: boolean;
  sla_hours?: number | null;
  on_timeout: "escalate" | "auto_approve" | "auto_reject";
}

interface WorkflowDefinition {
  id: string;
  name: string;
  module: string;
  entity_type: string;
  description: string | null;
  is_active: boolean;
  steps: Step[];
}

export default function WorkflowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Unwraps params promise
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === "new";

  // Local state untuk form alur
  const [name, setName] = useState("");
  const [module, setModule] = useState("leave");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Fetch Users & Roles untuk dropdown
  const { data: users } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: isAuthenticated && mounted,
  });

  const { data: roles } = useQuery({
    queryKey: ["roles-list"],
    queryFn: async () => {
      const res = await api.get("/roles");
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: isAuthenticated && mounted,
  });

  // Fetch Workflow Detail jika edit mode
  const { isLoading: isLoadingDetails } = useQuery<WorkflowDefinition>({
    queryKey: ["workflow-detail", resolvedParams.id],
    queryFn: async () => {
      const res = await api.get(`/workflow-definitions/${resolvedParams.id}`);
      const data = res.data?.data || res.data;
      
      setName(data.name || "");
      setModule(data.module || "leave");
      setDescription(data.description || "");
      setIsActive(data.is_active ?? true);
      
      // Urutkan step berdasarkan step_order
      const sortedSteps = [...(data.steps || [])].sort((a, b) => a.step_order - b.step_order);
      setSteps(sortedSteps);
      return data;
    },
    enabled: isAuthenticated && mounted && !isNew,
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (isNew) {
        return api.post("/workflow-definitions", payload);
      }
      return api.put(`/workflow-definitions/${resolvedParams.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-definitions-list"] });
      toast.success("Alur kerja berhasil disimpan.");
      router.push("/settings/workflows");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan alur kerja.");
    }
  });

  const getEntityTypeForModule = (mod: string) => {
    switch (mod) {
      case "leave": return "Modules\\Leave\\Models\\LeaveRequest";
      case "payroll": return "Modules\\Payroll\\Models\\PayrollPeriod";
      case "claim": return "Modules\\Compensation\\Models\\Claim";
      case "recruitment": return "Modules\\Recruitment\\Models\\JobApplication";
      default: return "Modules\\Leave\\Models\\LeaveRequest";
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nama alur kerja wajib diisi.");
      return;
    }

    if (steps.length === 0) {
      toast.error("Minimal harus memiliki 1 langkah approval.");
      return;
    }

    // Pastikan urutan (step_order) sesuai susunan index terbaru
    const formattedSteps = steps.map((s, idx) => ({
      ...s,
      step_order: idx + 1,
    }));

    const payload = {
      name,
      module,
      entity_type: getEntityTypeForModule(module),
      description,
      is_active: isActive,
      steps: formattedSteps,
    };

    saveMutation.mutate(payload);
  };

  // Step Modifiers
  const addStep = () => {
    const newStep: Step = {
      name: `Persetujuan Langkah ${steps.length + 1}`,
      approver_type: "reports_to",
      step_order: steps.length + 1,
      is_optional: false,
      on_timeout: "escalate",
      sla_hours: 24,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (idx: number) => {
    const updated = steps.filter((_, i) => i !== idx);
    setSteps(updated);
  };

  const updateStepField = (idx: number, field: keyof Step, value: any) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], [field]: value };
    setSteps(updated);
  };

  const updateStepCondition = (idx: number, subField: string, value: any) => {
    const updated = [...steps];
    const currentCond = updated[idx].condition_expression || { field: "total_days", operator: ">", value: "" };
    
    updated[idx] = {
      ...updated[idx],
      condition_expression: {
        ...currentCond,
        [subField]: value
      }
    };
    setSteps(updated);
  };

  const removeCondition = (idx: number) => {
    const updated = [...steps];
    updated[idx].condition_expression = null;
    setSteps(updated);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;

    const reordered = [...steps];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(targetIdx, 0, draggedItem);
    
    setDraggedIndex(targetIdx);
    setSteps(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (!mounted || !hasHydrated || !isAuthenticated || (isLoadingDetails && !isNew)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      {/* Visual Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/85 bg-white/80 dark:border-zinc-900 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/settings/workflows")}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {isNew ? "Buat Workflow Baru" : `Edit Workflow: ${name}`}
              </h1>
              <p className="text-[10px] text-zinc-500">Sesuaikan urutan approval secara linear Drag & Drop.</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-4 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Simpan Alur
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Form Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Settings className="h-4 w-4" /> Informasi Alur Kerja
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-550 dark:text-zinc-400">Nama Alur Kerja</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cuti Manager Level"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-550 dark:text-zinc-400">Modul Target</label>
                  <select
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    disabled={!isNew}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                  >
                    <option value="leave">Cuti / Absensi</option>
                    <option value="payroll">Penggajian (Payroll)</option>
                    <option value="claim">Klaim Reimbursement</option>
                    <option value="recruitment">Rekrutmen Baru</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-550 dark:text-zinc-400">Deskripsi</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tulis detail peruntukan alur approval ini..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">Status Aktif</span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-250/20 rounded-3xl p-5 flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-450">Petunjuk DnD Builder</h4>
                <p className="text-[10px] text-amber-700 dark:text-amber-500/80 leading-relaxed">
                  Susun alur persetujuan dari atas ke bawah. Gunakan icon seret (<Move className="inline h-3 w-3" />) untuk menyusun ulang langkah secara interaktif. Langkah opsional dapat dilewati otomatis jika kondisi ekspresi tidak terpenuhi.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Steps Builder Visual */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">Daftar Jenjang Approval</h3>
                  <p className="text-[10px] text-zinc-500">Urutan linear persetujuan pengajuan dokumen.</p>
                </div>
                <button
                  onClick={addStep}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-950 dark:text-zinc-50 text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Jenjang
                </button>
              </div>

              {steps.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 space-y-2 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
                  <p className="text-xs">Belum ada langkah. Klik tombol Tambah Jenjang di atas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative bg-zinc-50 dark:bg-zinc-900/50 border rounded-2xl p-4 transition-all duration-200 ${
                        draggedIndex === idx 
                          ? "border-zinc-400 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 scale-98 opacity-80" 
                          : "border-zinc-200 dark:border-zinc-850"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Drag Handle & Step Order */}
                        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                          <div className="p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-zinc-400">
                            <Move className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-black text-zinc-950 dark:text-zinc-50">#{idx + 1}</span>
                        </div>

                        {/* Step Details Form */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-zinc-450 dark:text-zinc-500">Nama Langkah</label>
                            <input
                              type="text"
                              value={step.name}
                              onChange={(e) => updateStepField(idx, "name", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-zinc-450 dark:text-zinc-500">Tipe Approver</label>
                            <select
                              value={step.approver_type}
                              onChange={(e) => {
                                updateStepField(idx, "approver_type", e.target.value);
                                updateStepField(idx, "approver_role_id", null);
                                updateStepField(idx, "approver_user_id", null);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none"
                            >
                              <option value="reports_to">Atasan Langsung (reports_to)</option>
                              <option value="department_head">Kepala Departemen (Department Head)</option>
                              <option value="role">Role Jabatan (Spatie Role)</option>
                              <option value="specific_user">Spesifik User</option>
                            </select>
                          </div>

                          {/* Dynamic Inputs Based on Approver Type */}
                          {step.approver_type === "role" && (
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-bold uppercase text-zinc-450 dark:text-zinc-500 flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> Pilih Role
                              </label>
                              <select
                                value={step.approver_role_id || ""}
                                onChange={(e) => updateStepField(idx, "approver_role_id", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none"
                              >
                                <option value="">-- Pilih Role --</option>
                                {(roles || []).map((r: any) => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {step.approver_type === "specific_user" && (
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-bold uppercase text-zinc-450 dark:text-zinc-500 flex items-center gap-1">
                                <UserIcon className="h-3.5 w-3.5" /> Pilih User
                              </label>
                              <select
                                value={step.approver_user_id || ""}
                                onChange={(e) => updateStepField(idx, "approver_user_id", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none"
                              >
                                <option value="">-- Pilih User --</option>
                                {(users || []).map((u: any) => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* SLA Hours */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-zinc-450 dark:text-zinc-500">SLA Batas Waktu (Jam)</label>
                            <input
                              type="number"
                              value={step.sla_hours || ""}
                              onChange={(e) => updateStepField(idx, "sla_hours", e.target.value ? parseInt(e.target.value, 10) : null)}
                              placeholder="e.g. 24"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none"
                            />
                          </div>

                          {/* Action on Timeout */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-zinc-450 dark:text-zinc-500">Tindakan Timeout</label>
                            <select
                              value={step.on_timeout}
                              onChange={(e) => updateStepField(idx, "on_timeout", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none"
                            >
                              <option value="escalate">Eskalasi ke Atasan</option>
                              <option value="auto_approve">Setujui Otomatis</option>
                              <option value="auto_reject">Tolak Otomatis</option>
                            </select>
                          </div>

                          {/* Condition Expression */}
                          <div className="md:col-span-2 py-2 border-t border-zinc-150 dark:border-zinc-850 mt-2 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                                <Shield className="h-3 w-3" /> Ekspresi Kondisi (Opsional)
                              </span>
                              {step.condition_expression ? (
                                <button
                                  type="button"
                                  onClick={() => removeCondition(idx)}
                                  className="text-[9px] text-red-500 font-bold hover:underline cursor-pointer"
                                >
                                  Hapus Kondisi
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateStepCondition(idx, "field", "total_days")}
                                  className="text-[9px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-250 font-bold hover:underline cursor-pointer"
                                >
                                  + Tambah Kondisi
                                </button>
                              )}
                            </div>

                            {step.condition_expression && (
                              <div className="grid grid-cols-3 gap-2 bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-100 dark:border-zinc-850">
                                <input
                                  type="text"
                                  value={step.condition_expression.field || ""}
                                  placeholder="Field (e.g. total_days)"
                                  onChange={(e) => updateStepCondition(idx, "field", e.target.value)}
                                  className="px-2 py-1 border border-zinc-150 dark:border-zinc-850 bg-transparent text-[10px] text-zinc-950 dark:text-zinc-50 focus:outline-none rounded"
                                />
                                <select
                                  value={step.condition_expression.operator || "=="}
                                  onChange={(e) => updateStepCondition(idx, "operator", e.target.value)}
                                  className="px-2 py-1 border border-zinc-150 dark:border-zinc-850 bg-transparent text-[10px] text-zinc-950 dark:text-zinc-50 focus:outline-none rounded"
                                >
                                  <option value="==">Sama Dengan (==)</option>
                                  <option value="!=">Tidak Sama (!=)</option>
                                  <option value=">">Lebih Besar (&gt;)</option>
                                  <option value="<">Lebih Kecil (&lt;)</option>
                                  <option value=">=">Lebih Besar Sama (&gt;=)</option>
                                  <option value="<=">Lebih Kecil Sama (&lt;=)</option>
                                </select>
                                <input
                                  type="text"
                                  value={step.condition_expression.value || ""}
                                  placeholder="Nilai (e.g. 5)"
                                  onChange={(e) => updateStepCondition(idx, "value", e.target.value)}
                                  className="px-2 py-1 border border-zinc-150 dark:border-zinc-850 bg-transparent text-[10px] text-zinc-950 dark:text-zinc-50 focus:outline-none rounded"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeStep(idx)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer self-start"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
