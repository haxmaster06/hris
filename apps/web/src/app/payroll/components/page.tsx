"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { Edit2, Trash2, Plus, Loader2, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface PayrollComponent {
  id: string;
  name: string;
  code: string;
  type: "earning" | "deduction";
  is_taxable: boolean;
  is_fixed: boolean;
  is_bpjs: boolean;
  is_default: boolean;
}

export default function PayrollComponentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<PayrollComponent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "earning" as "earning" | "deduction",
    is_taxable: true,
    is_fixed: false,
    is_bpjs: true,
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Payroll Components
  const { data: components, isLoading } = useQuery({
    queryKey: ["payroll-components-list"],
    queryFn: async () => {
      const res = await api.get("/payroll-components");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (selectedComponent) {
        return api.put(`/payroll-components/${selectedComponent.id}`, payload);
      }
      return api.post("/payroll-components", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-components-list"] });
      toast.success(selectedComponent ? "Komponen gaji berhasil diubah." : "Komponen gaji baru berhasil ditambahkan.");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan komponen gaji.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/payroll-components/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-components-list"] });
      toast.success("Komponen gaji berhasil dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus komponen gaji.");
    },
  });

  const handleOpenCreate = () => {
    setSelectedComponent(null);
    setFormData({
      name: "",
      code: "",
      type: "earning",
      is_taxable: true,
      is_fixed: false,
      is_bpjs: true,
      is_default: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (component: PayrollComponent) => {
    setSelectedComponent(component);
    setFormData({
      name: component.name,
      code: component.code,
      type: component.type,
      is_taxable: component.is_taxable,
      is_fixed: component.is_fixed,
      is_bpjs: component.is_bpjs,
      is_default: component.is_default,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmRes = await Swal.fire({
      title: "Hapus Komponen Gaji",
      text: `Apakah Anda yakin ingin menghapus komponen "${name}"? Tindakan ini tidak dapat dibatalkan.`,
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

  const filteredComponents = Array.isArray(components)
    ? components.filter((c: PayrollComponent) => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType ? c.type === filterType : true;
        return matchesSearch && matchesType;
      })
    : [];

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Komponen Gaji"
        subtitle="Daftar master tunjangan (pendapatan) dan potongan gaji karyawan."
        backUrl="/payroll"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm">
          <div className="flex flex-1 gap-3 max-w-xl">
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-955 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="earning">Pendapatan (Earning)</option>
              <option value="deduction">Potongan (Deduction)</option>
            </select>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Komponen
          </button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredComponents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950 select-none">
            <p className="text-zinc-500 text-sm">Tidak ada data komponen gaji yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900 select-none">
                <tr>
                  <th className="px-6 py-3">Nama Komponen</th>
                  <th className="px-6 py-3">Kode</th>
                  <th className="px-6 py-3">Tipe</th>
                  <th className="px-6 py-3">Pajak (Taxable)</th>
                  <th className="px-6 py-3">BPJS Ceiling</th>
                  <th className="px-6 py-3">Sifat</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
                {filteredComponents.map((comp: PayrollComponent) => (
                  <tr key={comp.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-950 dark:text-zinc-50">{comp.name}</div>
                      {comp.is_default && (
                        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                          Bawaan Sistem
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{comp.code}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        comp.type === "earning"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                      }`}>
                        {comp.type === "earning" ? "Pendapatan" : "Potongan"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {comp.is_taxable ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">Ya (Kena Pajak)</span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs">Tidak</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {comp.is_bpjs ? (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">Ya</span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs">Tidak</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {comp.is_fixed ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs">Tetap (Fixed)</span>
                      ) : (
                        <span className="text-zinc-650 dark:text-zinc-400 text-xs">Variabel</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(comp)}
                          className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                          title="Ubah"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {!comp.is_default && (
                          <button
                            onClick={() => handleDelete(comp.id, comp.name)}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  {selectedComponent ? "Ubah Komponen Gaji" : "Tambah Komponen Gaji"}
                </h3>
                <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-655 text-xl cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nama Komponen</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Tunjangan Transportasi"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Kode Unik</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: TJ_TRANS"
                    disabled={!!selectedComponent}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-60 text-zinc-950 dark:text-zinc-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tipe</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "earning" | "deduction" })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                  >
                    <option value="earning">Pendapatan (Earning)</option>
                    <option value="deduction">Potongan (Deduction)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_taxable}
                      onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                      className="rounded border-zinc-350 dark:border-zinc-800 text-zinc-900 focus:ring-zinc-500"
                    />
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">Kena Pajak PPh 21</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_bpjs}
                      onChange={(e) => setFormData({ ...formData, is_bpjs: e.target.checked })}
                      className="rounded border-zinc-350 dark:border-zinc-800 text-zinc-900 focus:ring-zinc-500"
                    />
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">Masuk Hitungan BPJS</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_fixed}
                      onChange={(e) => setFormData({ ...formData, is_fixed: e.target.checked })}
                      className="rounded border-zinc-350 dark:border-zinc-800 text-zinc-900 focus:ring-zinc-500"
                    />
                    <span className="text-xs text-zinc-700 dark:text-zinc-300">Nilai Tetap (Fixed)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold hover:opacity-85 text-zinc-750 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Back button */}
        <div className="flex justify-center pt-8">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1.5 py-2.5 px-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Menu Payroll
          </Link>
        </div>
      </main>
    </div>
  );
}
