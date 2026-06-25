"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { Plus, Edit2, Trash2, Loader2, ArrowLeft, Search, CircleDollarSign } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface BonusScheme {
  id: string;
  name: string;
  code: string;
  type: "performance" | "holiday" | "yearly" | "discretionary";
  calculation_method: "fixed" | "percentage";
  base_value: number;
  description: string | null;
}

export default function BonusSchemesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<BonusScheme | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "performance" as "performance" | "holiday" | "yearly" | "discretionary",
    calculation_method: "fixed" as "fixed" | "percentage",
    base_value: 0,
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Bonus Schemes
  const { data: schemes, isLoading } = useQuery({
    queryKey: ["bonus-schemes-list"],
    queryFn: async () => {
      const res = await api.get("/bonus-schemes");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Save Mutation (Create/Update)
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (selectedScheme) {
        return api.put(`/bonus-schemes/${selectedScheme.id}`, payload);
      }
      return api.post("/bonus-schemes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-schemes-list"] });
      toast.success(selectedScheme ? "Skema bonus berhasil diperbarui." : "Skema bonus baru berhasil didaftarkan.");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan skema bonus.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bonus-schemes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-schemes-list"] });
      toast.success("Skema bonus berhasil dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus skema bonus.");
    },
  });

  const handleOpenCreate = () => {
    setSelectedScheme(null);
    setFormData({
      name: "",
      code: "",
      type: "performance",
      calculation_method: "fixed",
      base_value: 0,
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (scheme: BonusScheme) => {
    setSelectedScheme(scheme);
    setFormData({
      name: scheme.name,
      code: scheme.code,
      type: scheme.type,
      calculation_method: scheme.calculation_method,
      base_value: Number(scheme.base_value),
      description: scheme.description || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmRes = await Swal.fire({
      title: "Hapus Skema Bonus",
      text: `Apakah Anda yakin ingin menghapus skema bonus "${name}"?`,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    saveMutation.mutate(formData);
  };

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  const getSchemeTypeLabel = (type: string) => {
    switch (type) {
      case "performance":
        return "Insentif Performa / KPI";
      case "holiday":
        return "THR Keagamaan";
      case "yearly":
        return "Bonus Tahunan (Profit Sharing)";
      case "discretionary":
        return "Bonus Kebijakan (Discretionary)";
      default:
        return type;
    }
  };

  const filteredSchemes = Array.isArray(schemes)
    ? schemes.filter((s: BonusScheme) => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType ? s.type === filterType : true;
        return matchesSearch && matchesType;
      })
    : [];

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Skema Bonus Karyawan"
        subtitle="Kelola parameter insentif, bagi hasil keuntungan tahunan, tunjangan hari raya keagamaan, serta formula kalkulasinya."
        backUrl="/compensation"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm">
          <div className="flex flex-1 gap-3 max-w-xl">
            <input
              type="text"
              placeholder="Cari nama atau kode skema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-955 dark:text-zinc-50 focus:outline-none"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="performance">Insentif Performa</option>
              <option value="holiday">THR Keagamaan</option>
              <option value="yearly">Bonus Tahunan</option>
              <option value="discretionary">Discretionary</option>
            </select>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Skema
          </button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-955 select-none">
            <p className="text-zinc-500 text-sm">Tidak ada skema bonus terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-955">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-655 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900 select-none">
                <tr>
                  <th className="px-6 py-3">Nama Skema</th>
                  <th className="px-6 py-3">Kode</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Metode Hitung</th>
                  <th className="px-6 py-3">Nilai Dasar (Base)</th>
                  <th className="px-6 py-3">Keterangan</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
                {filteredSchemes.map((s: BonusScheme) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="px-6 py-4 font-bold text-zinc-950 dark:text-zinc-50">{s.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{s.code}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold">{getSchemeTypeLabel(s.type)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        s.calculation_method === "fixed"
                          ? "bg-zinc-150 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350"
                          : "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400"
                      }`}>
                        {s.calculation_method === "fixed" ? "Fixed (Nominal)" : "Persentase (%)"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      {s.calculation_method === "fixed" ? formatCurrency(s.base_value) : `${s.base_value}%`}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 max-w-xs truncate">{s.description || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400 cursor-pointer"
                          title="Ubah"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 cursor-pointer"
                          title="Hapus"
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

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">
                  {selectedScheme ? "Ubah Skema Bonus" : "Tambah Skema Bonus"}
                </h3>
                <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nama Skema</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Bonus Tahunan Performa 2026"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Kode Unik</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BONUS_KPI"
                    disabled={!!selectedScheme}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tipe Bonus</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50"
                    >
                      <option value="performance">Insentif Performa</option>
                      <option value="holiday">THR Keagamaan</option>
                      <option value="yearly">Bonus Tahunan</option>
                      <option value="discretionary">Discretionary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Metode Perhitungan</label>
                    <select
                      value={formData.calculation_method}
                      onChange={(e) => setFormData({ ...formData, calculation_method: e.target.value as any })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50"
                    >
                      <option value="fixed">Fixed (Nominal Tetap)</option>
                      <option value="percentage">Percentage (Dari Gaji Pokok)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nilai Dasar ({formData.calculation_method === "fixed" ? "IDR" : "%"})
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.base_value}
                    onChange={(e) => setFormData({ ...formData, base_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Deskripsi Skema</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Syarat perolehan insentif bonus..."
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Skema
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Back button */}
        <div className="flex justify-center pt-8">
          <Link
            href="/compensation"
            className="inline-flex items-center gap-1.5 py-2.5 px-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Menu Kompensasi
          </Link>
        </div>
      </main>
    </div>
  );
}
