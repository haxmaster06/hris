"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { Plus, Edit2, Trash2, Loader2, ArrowLeft, Search, Wallet } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface EmployeeLoan {
  id: string;
  loan_number: string;
  employee_id: string;
  employee?: { first_name: string; last_name: string | null; employee_number: string };
  principal_amount: number;
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  remaining_amount: number;
  start_date: string;
  status: "active" | "completed" | "cancelled";
  reason: string | null;
}

export default function EmployeeLoansPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<EmployeeLoan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [formData, setFormData] = useState({
    employee_id: "",
    principal_amount: 0,
    installment_amount: 0,
    total_installments: 12,
    start_date: new Date().toISOString().split("T")[0],
    reason: "",
    status: "active" as "active" | "completed" | "cancelled",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Loans
  const { data: loans, isLoading } = useQuery({
    queryKey: ["employee-loans-list"],
    queryFn: async () => {
      const res = await api.get("/employee-loans?include=employee");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch Employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["employees-dropdown-loans"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Auto calculate installment_amount if principal and total_installments change
  useEffect(() => {
    if (!selectedLoan && formData.principal_amount > 0 && formData.total_installments > 0) {
      const monthly = Math.round(formData.principal_amount / formData.total_installments);
      setFormData((prev) => ({ ...prev, installment_amount: monthly }));
    }
  }, [formData.principal_amount, formData.total_installments, selectedLoan]);

  // Save Mutation (Create/Update)
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (selectedLoan) {
        return api.put(`/employee-loans/${selectedLoan.id}`, payload);
      }
      return api.post("/employee-loans", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-loans-list"] });
      toast.success(selectedLoan ? "Data pinjaman berhasil diperbarui." : "Pinjaman karyawan baru berhasil diajukan.");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan pinjaman.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employee-loans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-loans-list"] });
      toast.success("Pinjaman berhasil dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus pinjaman.");
    },
  });

  const handleOpenCreate = () => {
    setSelectedLoan(null);
    setFormData({
      employee_id: Array.isArray(employees) && employees.length > 0 ? employees[0].id : "",
      principal_amount: 0,
      installment_amount: 0,
      total_installments: 12,
      start_date: new Date().toISOString().split("T")[0],
      reason: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loan: EmployeeLoan) => {
    setSelectedLoan(loan);
    setFormData({
      employee_id: loan.employee_id,
      principal_amount: Number(loan.principal_amount),
      installment_amount: Number(loan.installment_amount),
      total_installments: loan.total_installments,
      start_date: loan.start_date,
      reason: loan.reason || "",
      status: loan.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, num: string) => {
    const confirmRes = await Swal.fire({
      title: "Hapus Pinjaman",
      text: `Apakah Anda yakin ingin menghapus pinjaman "${num}"?`,
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

  const filteredLoans = Array.isArray(loans)
    ? loans.filter((l: EmployeeLoan) => {
        const name = `${l.employee?.first_name} ${l.employee?.last_name || ""}`.toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || l.loan_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus ? l.status === filterStatus : true;
        return matchesSearch && matchesStatus;
      })
    : [];

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Pinjaman Karyawan (Kasbon)"
        subtitle="Kelola pinjaman dana kasbon, amortisasi cicilan bulanan, sisa saldo terutang, dan status pinjaman."
        backUrl="/payroll"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm">
          <div className="flex flex-1 gap-3 max-w-xl">
            <input
              type="text"
              placeholder="Cari nomer pinjaman atau karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-955 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif (Active)</option>
              <option value="completed">Lunas (Completed)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Ajukan Pinjaman
          </button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950 select-none">
            <p className="text-zinc-500 text-sm">Tidak ada riwayat pinjaman/kasbon terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900 select-none">
                <tr>
                  <th className="px-6 py-3">No. Pinjaman</th>
                  <th className="px-6 py-3">Karyawan</th>
                  <th className="px-6 py-3">Jumlah Pinjaman</th>
                  <th className="px-6 py-3">Cicilan / Bulan</th>
                  <th className="px-6 py-3">Progres Tenor</th>
                  <th className="px-6 py-3">Sisa Pinjaman</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
                {filteredLoans.map((loan: EmployeeLoan) => {
                  const empName = loan.employee ? `${loan.employee.first_name} ${loan.employee.last_name || ""}` : "N/A";
                  return (
                    <tr key={loan.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-zinc-950 dark:text-zinc-50">{loan.loan_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{empName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">NIP: {loan.employee?.employee_number}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">{formatCurrency(loan.principal_amount)}</td>
                      <td className="px-6 py-4 font-mono text-red-600 dark:text-red-400">-{formatCurrency(loan.installment_amount)}</td>
                      <td className="px-6 py-4 font-semibold text-xs">
                        {loan.paid_installments} / {loan.total_installments} Bulan
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(loan.remaining_amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          loan.status === "completed"
                            ? "bg-emerald-50 text-emerald-705 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : loan.status === "cancelled"
                            ? "bg-zinc-150 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400"
                            : "bg-blue-50 text-blue-705 dark:bg-blue-950/20 dark:text-blue-400"
                        }`}>
                          {loan.status === "completed" ? "Lunas" : loan.status === "cancelled" ? "Batal" : "Aktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(loan)}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                            title="Ubah Status"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(loan.id, loan.loan_number)}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">
                  {selectedLoan ? `Ubah Pinjaman ${formData.employee_id ? "" : ""}` : "Ajukan Pinjaman Baru"}
                </h3>
                <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                {/* Employee Select */}
                {!selectedLoan && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Pilih Karyawan</label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                    >
                      <option value="" disabled>Pilih Karyawan</option>
                      {Array.isArray(employees) &&
                        employees.map((emp: any) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name || ""} ({emp.employee_number})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Jumlah Utama Pinjaman (IDR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.principal_amount}
                    onChange={(e) => setFormData({ ...formData, principal_amount: Number(e.target.value) })}
                    disabled={!!selectedLoan}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-955 dark:text-zinc-50 font-mono font-bold disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tenor (Bulan)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.total_installments}
                      onChange={(e) => setFormData({ ...formData, total_installments: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Cicilan / Bulan (IDR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.installment_amount}
                      onChange={(e) => setFormData({ ...formData, installment_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-955 dark:text-zinc-50 font-mono font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Efektif Cicilan</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Alasan Pinjaman</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Keperluan medis, renovasi, dll..."
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                  />
                </div>

                {selectedLoan && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Status Pinjaman</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-550 text-zinc-950 dark:text-zinc-50"
                    >
                      <option value="active">Aktif (Active)</option>
                      <option value="completed">Lunas (Completed)</option>
                      <option value="cancelled">Batal (Cancelled)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold hover:opacity-85 text-zinc-750 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-955 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Pinjaman
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
