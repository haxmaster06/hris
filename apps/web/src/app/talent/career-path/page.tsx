"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Plus, GitMerge, Settings, Trash2, Edit3, Loader2, Save, ArrowRight } from "lucide-react";
import { toast } from "@/lib/toast";

interface CareerPath {
  id: string;
  from_position_id: string;
  to_position_id: string;
  path_type: string; // promotion, lateral, specialization
  typical_years?: number;
  requirements?: any;
  description?: string;
  from_position?: { name: string };
  to_position?: { name: string };
}

export default function CareerPathPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"tree" | "links">("tree");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [fromPositionId, setFromPositionId] = useState("");
  const [toPositionId, setToPositionId] = useState("");
  const [pathType, setPathType] = useState("promotion");
  const [typicalYears, setTypicalYears] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Lists
  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["career-paths-list"],
    queryFn: async () => {
      const res = await api.get("/career-paths");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: treeData = { nodes: [], edges: [] }, isLoading: treeLoading } = useQuery({
    queryKey: ["career-paths-tree"],
    queryFn: async () => {
      const res = await api.get("/career-paths/tree");
      return res.data.data || { nodes: [], edges: [] };
    },
    enabled: isAuthenticated,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["talent-positions-list"],
    queryFn: async () => {
      const res = await api.get("/positions");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/career-paths", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-paths-list"] });
      queryClient.invalidateQueries({ queryKey: ["career-paths-tree"] });
      toast.success("Rute karir berhasil didefinisikan");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal mendefinisikan rute"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/career-paths/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-paths-list"] });
      queryClient.invalidateQueries({ queryKey: ["career-paths-tree"] });
      toast.success("Rute karir berhasil diperbarui");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui rute"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/career-paths/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-paths-list"] });
      queryClient.invalidateQueries({ queryKey: ["career-paths-tree"] });
      toast.success("Rute karir berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus rute"),
  });

  const resetForm = () => {
    setSelectedPath(null);
    setFromPositionId("");
    setToPositionId("");
    setPathType("promotion");
    setTypicalYears("");
    setDesc("");
  };

  const handleEdit = (path: CareerPath) => {
    setSelectedPath(path);
    setFromPositionId(path.from_position_id);
    setToPositionId(path.to_position_id);
    setPathType(path.path_type);
    setTypicalYears(path.typical_years !== undefined && path.typical_years !== null ? String(path.typical_years) : "");
    setDesc(path.description || "");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      from_position_id: fromPositionId,
      to_position_id: toPositionId,
      path_type: pathType,
      typical_years: typicalYears !== "" ? Number(typicalYears) : null,
      description: desc || null,
      requirements: [],
    };

    if (selectedPath) {
      updateMutation.mutate({ id: selectedPath.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Visualisasi Peta Rute Karir"
        subtitle="Definisikan bagan rute kenaikan jabatan serta petakan visualisasi pohon suksesi karir."
        backUrl="/talent"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-6">
          <button
            onClick={() => setActiveTab("tree")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "tree"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Visual Career Tree Map
            {activeTab === "tree" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("links")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "links"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Definisi Rute Hubungan
            {activeTab === "links" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Visual Tree Graph (SVG Drawing connections) */}
        {activeTab === "tree" && (
          <div className="space-y-4 animate-enter">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Career Path Connections Graph</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Hubungan
              </button>
            </div>

            {treeLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : !treeData || !treeData.edges || treeData.edges.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
                <GitMerge className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada rute karir didefinisikan untuk digambarkan.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-center overflow-x-auto min-h-[400px]">
                {/* Visual rendering of relationships */}
                <div className="flex flex-col gap-8 max-w-2xl w-full">
                  {treeData.edges.map((edge: any, index: number) => {
                    const fromNode = treeData.nodes.find((n: any) => n.id === edge.from_position_id);
                    const toNode = treeData.nodes.find((n: any) => n.id === edge.to_position_id);
                    if (!fromNode || !toNode) return null;

                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-150 dark:border-zinc-850 shadow-sm animate-enter">
                        <div className="flex-1 text-center bg-white dark:bg-zinc-950 p-3 border border-zinc-200 dark:border-zinc-900 rounded-xl font-bold text-zinc-900 dark:text-zinc-100">
                          {fromNode.name}
                        </div>
                        <div className="flex flex-col items-center px-4 flex-shrink-0">
                          <span className="text-[9px] font-extrabold text-rose-500 capitalize bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full mb-1">
                            {edge.path_type}
                          </span>
                          <ArrowRight className="h-4 w-4 text-zinc-400" />
                          {edge.typical_years && (
                            <span className="text-[9px] text-zinc-400 mt-1">Est. {edge.typical_years} Tahun</span>
                          )}
                        </div>
                        <div className="flex-1 text-center bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 p-3 rounded-xl font-bold">
                          {toNode.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Links List */}
        {activeTab === "links" && (
          <div className="space-y-4 animate-enter">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Log Hubungan Rute Karir</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Hubungan
              </button>
            </div>

            {pathsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : paths.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
                <GitMerge className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada rute karir didefinisikan.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Dari Posisi</th>
                      <th className="px-4 py-3">Ke Posisi</th>
                      <th className="px-4 py-3">Tipe Rute</th>
                      <th className="px-4 py-3">Perkiraan Tahun</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                    {paths.map((path: CareerPath) => (
                      <tr key={path.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-50">{path.from_position?.name}</td>
                        <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-450">{path.to_position?.name}</td>
                        <td className="px-4 py-3 capitalize">{path.path_type}</td>
                        <td className="px-4 py-3">{path.typical_years !== null && path.typical_years !== undefined ? `${path.typical_years} Tahun` : "-"}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(path)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus rute karir ini?")) {
                                deleteMutation.mutate(path.id);
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

      {/* Modal: CareerPath CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              {selectedPath ? "Edit Rute Karir" : "Definisikan Rute Karir Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Dari Posisi Jabatan</label>
                <select
                  required
                  value={fromPositionId}
                  onChange={(e) => setFromPositionId(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                >
                  <option value="">-- Pilih Posisi Asal --</option>
                  {positions?.map((pos: any) => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Ke Posisi Jabatan</label>
                <select
                  required
                  value={toPositionId}
                  onChange={(e) => setToPositionId(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                >
                  <option value="">-- Pilih Posisi Tujuan --</option>
                  {positions?.map((pos: any) => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Tipe Rute Kenaikan</label>
                  <select
                    value={pathType}
                    onChange={(e) => setPathType(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-rose-600"
                  >
                    <option value="promotion">Promosi (Promotion)</option>
                    <option value="lateral">Mutasi Setara (Lateral)</option>
                    <option value="specialization">Spesialisasi</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Perkiraan Waktu (Tahun)</label>
                  <input
                    type="number"
                    min="0"
                    value={typicalYears}
                    onChange={(e) => setTypicalYears(e.target.value)}
                    placeholder="e.g. 2 atau 3"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Deskripsi / Persyaratan Tambahan</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Keterangan kompetensi minimum..."
                  rows={3}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Rute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
