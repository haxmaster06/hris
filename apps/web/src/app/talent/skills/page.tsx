"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Plus, BookOpen, Users, Search, Loader2, Save, Trash2, Edit3, Grid } from "lucide-react";
import { toast } from "@/lib/toast";

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_id: string;
  proficiency_level: number;
  notes?: string;
  employee?: { name: string };
  skill?: { name: string };
}

export default function TalentSkillsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"matrix" | "skills" | "assessments">("matrix");

  // Skill states
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillName, setSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState("technical");
  const [skillDesc, setSkillDesc] = useState("");

  // Assessment states
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [assessEmpId, setAssessEmpId] = useState("");
  const [assessSkillId, setAssessSkillId] = useState("");
  const [proficiency, setProficiency] = useState("3");
  const [assessNotes, setAssessNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Lists
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["skills-list"],
    queryFn: async () => {
      const res = await api.get("/skills");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["employee-skills-list"],
    queryFn: async () => {
      const res = await api.get("/employee-skills");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: heatmapData = { skills: [], employees: [], heatmap: {} }, isLoading: heatmapLoading } = useQuery({
    queryKey: ["employee-skills-heatmap"],
    queryFn: async () => {
      const res = await api.get("/employee-skills/heatmap");
      return res.data.data || { skills: [], employees: [], heatmap: {} };
    },
    enabled: isAuthenticated,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["talent-employees-list"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Mutations
  const createSkill = useMutation({
    mutationFn: (data: any) => api.post("/skills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills-list"] });
      queryClient.invalidateQueries({ queryKey: ["employee-skills-heatmap"] });
      toast.success("Kompetensi keahlian berhasil ditambahkan");
      setShowSkillModal(false);
      resetSkillForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal membuat keahlian"),
  });

  const updateSkill = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/skills/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills-list"] });
      queryClient.invalidateQueries({ queryKey: ["employee-skills-heatmap"] });
      toast.success("Kompetensi keahlian berhasil diperbarui");
      setShowSkillModal(false);
      resetSkillForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui keahlian"),
  });

  const deleteSkill = useMutation({
    mutationFn: (id: string) => api.delete(`/skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills-list"] });
      queryClient.invalidateQueries({ queryKey: ["employee-skills-heatmap"] });
      toast.success("Kompetensi keahlian berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus keahlian"),
  });

  const assessSkill = useMutation({
    mutationFn: (data: any) => api.post("/employee-skills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-skills-list"] });
      queryClient.invalidateQueries({ queryKey: ["employee-skills-heatmap"] });
      toast.success("Penilaian kompetensi keahlian berhasil disimpan");
      setShowAssessModal(false);
      resetAssessForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal melakukan penilaian"),
  });

  const deleteAssessment = useMutation({
    mutationFn: (id: string) => api.delete(`/employee-skills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-skills-list"] });
      queryClient.invalidateQueries({ queryKey: ["employee-skills-heatmap"] });
      toast.success("Penilaian berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus penilaian"),
  });

  const resetSkillForm = () => {
    setSelectedSkill(null);
    setSkillName("");
    setSkillCategory("technical");
    setSkillDesc("");
  };

  const resetAssessForm = () => {
    setAssessEmpId("");
    setAssessSkillId("");
    setProficiency("3");
    setAssessNotes("");
  };

  const handleEditSkill = (sk: Skill) => {
    setSelectedSkill(sk);
    setSkillName(sk.name);
    setSkillCategory(sk.category);
    setSkillDesc(sk.description || "");
    setShowSkillModal(true);
  };

  const handleSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: skillName,
      category: skillCategory,
      description: skillDesc,
      is_active: true,
    };

    if (selectedSkill) {
      updateSkill.mutate({ id: selectedSkill.id, data: payload });
    } else {
      createSkill.mutate(payload);
    }
  };

  const handleAssessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assessorId = employees && employees.length > 0 ? employees[0].id : "";
    assessSkill.mutate({
      employee_id: assessEmpId,
      skill_id: assessSkillId,
      proficiency_level: Number(proficiency),
      assessed_by: assessorId,
      notes: assessNotes || null,
    });
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Matriks Keahlian & Kompetensi"
        subtitle="Analisis ketersediaan keahlian staf menggunakan heatmap matriks kompetensi terpadu."
        backUrl="/talent"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Tab Controls */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-6">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "matrix"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Matriks Heatmap
            {activeTab === "matrix" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("skills")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "skills"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Daftar Keahlian Master
            {activeTab === "skills" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("assessments")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "assessments"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Log Penilaian Staf
            {activeTab === "assessments" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Heatmap Matrix */}
        {activeTab === "matrix" && (
          <div className="space-y-4 animate-enter">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Skill Proficiency Heatmap</h2>
              <button
                onClick={() => {
                  resetAssessForm();
                  setShowAssessModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Beri Penilaian Keahlian
              </button>
            </div>

            {heatmapLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : !heatmapData || !heatmapData.skills || heatmapData.skills.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
                <Grid className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada keahlian terdaftar untuk disajikan dalam heatmap.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-x-auto shadow-sm p-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider min-w-[200px]">Karyawan</th>
                      {heatmapData.skills.map((sk: any) => (
                        <th key={sk.id} className="px-3 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-450 font-extrabold text-center vertical-header max-w-[120px] truncate" title={sk.name}>
                          {sk.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                    {heatmapData.employees.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-bold text-zinc-950 dark:text-zinc-55">{emp.name}</td>
                        {heatmapData.skills.map((sk: any) => {
                          const score = heatmapData.heatmap[emp.id]?.[sk.id] || 0;
                          return (
                            <td key={sk.id} className="px-2 py-3 text-center">
                              <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-[10px] font-black ${
                                score === 5
                                  ? "bg-fuchsia-600 text-white shadow-sm"
                                  : score === 4
                                  ? "bg-fuchsia-500 text-white"
                                  : score === 3
                                  ? "bg-fuchsia-350 text-fuchsia-950"
                                  : score === 2
                                  ? "bg-fuchsia-200 text-fuchsia-900"
                                  : score === 1
                                  ? "bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-800"
                                  : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-300 dark:text-zinc-700"
                              }`}>
                                {score > 0 ? score : "-"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-900 text-[10px] font-semibold text-zinc-500">
                  <span>Legend (Keahlian):</span>
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 bg-fuchsia-50 dark:bg-fuchsia-950/20 rounded inline-block" />
                    <span>1 (Beginner)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 bg-fuchsia-200 rounded inline-block" />
                    <span>2 (Intermediate)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 bg-fuchsia-350 rounded inline-block" />
                    <span>3 (Advanced)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 bg-fuchsia-500 rounded inline-block" />
                    <span>4 (Proficient)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 bg-fuchsia-600 rounded inline-block" />
                    <span>5 (Expert)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Skills Master list */}
        {activeTab === "skills" && (
          <div className="space-y-4 animate-enter">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Daftar Keahlian Master</h2>
              <button
                onClick={() => {
                  resetSkillForm();
                  setShowSkillModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Keahlian
              </button>
            </div>

            {skillsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : skills.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
                <BookOpen className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada keahlian terdaftar.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Nama Keahlian</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                    {skills.map((sk: Skill) => (
                      <tr key={sk.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-50">{sk.name}</td>
                        <td className="px-4 py-3 capitalize">{sk.category.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{sk.description || "-"}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditSkill(sk)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus keahlian ini?")) {
                                deleteSkill.mutate(sk.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Assessments Log list */}
        {activeTab === "assessments" && (
          <div className="space-y-4 animate-enter">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Log Penilaian Staf</h2>
              <button
                onClick={() => {
                  resetAssessForm();
                  setShowAssessModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Beri Penilaian Keahlian
              </button>
            </div>

            {assessmentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
                <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada catatan log kompetensi karyawan.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Karyawan</th>
                      <th className="px-4 py-3">Kompetensi Keahlian</th>
                      <th className="px-4 py-3">Tingkat Kemahiran (Proficiency)</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                    {assessments.map((ass: EmployeeSkill) => (
                      <tr key={ass.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-50">{ass.employee?.name}</td>
                        <td className="px-4 py-3 font-semibold text-fuchsia-600 dark:text-fuchsia-400">{ass.skill?.name}</td>
                        <td className="px-4 py-3">Level {ass.proficiency_level} / 5</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{ass.notes || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus penilaian kompetensi ini?")) {
                                deleteAssessment.mutate(ass.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal 1: Master Skill CRUD */}
      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              {selectedSkill ? "Edit Kompetensi Keahlian" : "Tambah Kompetensi Keahlian"}
            </h3>
            <form onSubmit={handleSkillSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Nama Kompetensi / Keahlian</label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. React.js atau Leadership"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Kategori Keahlian</label>
                <select
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                >
                  <option value="hard_skill">Hard Skill</option>
                  <option value="soft_skill">Soft Skill</option>
                  <option value="technical">Technical</option>
                  <option value="leadership">Leadership</option>
                  <option value="language">Language / Bahasa</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Keterangan / Indikator Penilaian</label>
                <textarea
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                  placeholder="Definisikan standar kemahiran..."
                  rows={3}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createSkill.isPending || updateSkill.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assess Skill */}
      {showAssessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              Beri Penilaian Kompetensi Karyawan
            </h3>
            <form onSubmit={handleAssessSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Karyawan Terkait</label>
                <select
                  required
                  value={assessEmpId}
                  onChange={(e) => setAssessEmpId(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Pilih Keahlian</label>
                  <select
                    required
                    value={assessSkillId}
                    onChange={(e) => setAssessSkillId(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  >
                    <option value="">-- Pilih Keahlian --</option>
                    {skills?.map((sk: any) => (
                      <option key={sk.id} value={sk.id}>{sk.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Tingkat Kemahiran</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-fuchsia-600"
                  >
                    <option value="1">Level 1 (Beginner)</option>
                    <option value="2">Level 2 (Intermediate)</option>
                    <option value="3">Level 3 (Advanced)</option>
                    <option value="4">Level 4 (Proficient)</option>
                    <option value="5">Level 5 (Expert)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Catatan Assessor / Bukti Sertifikat</label>
                <textarea
                  value={assessNotes}
                  onChange={(e) => setAssessNotes(e.target.value)}
                  placeholder="Catatan keahlian, riwayat asesmen, atau tautan portofolio..."
                  rows={3}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssessModal(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={assessSkill.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Penilaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
