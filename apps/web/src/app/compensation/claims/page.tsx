"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { Plus, Check, X, Trash2, Loader2, ArrowLeft, Eye, FileText, Search } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface Claim {
  id: string;
  claim_number: string;
  employee_id: string;
  employee?: { first_name: string; last_name: string | null; employee_number: string };
  type: "medical" | "reimbursement" | "travel" | "other";
  amount: number;
  approved_amount: number | null;
  claim_date: string;
  status: "submitted" | "approved" | "rejected";
  description: string;
  receipt_path: string | null;
  rejection_reason: string | null;
}

export default function ClaimsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    employee_id: "",
    type: "medical" as "medical" | "reimbursement" | "travel" | "other",
    amount: 0,
    claim_date: new Date().toISOString().split("T")[0],
    description: "",
    receipt_path: "",
  });

  // Approve Form State
  const [approvedAmount, setApprovedAmount] = useState(0);

  // Reject Form State
  const [rejectionReason, setRejectionReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Claims
  const { data: claims, isLoading } = useQuery({
    queryKey: ["claims-list"],
    queryFn: async () => {
      const res = await api.get("/claims?include=employee");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch Employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["employees-claims-dropdown"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/claims", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims-list"] });
      toast.success("Klaim reimbursement berhasil diajukan.");
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengajukan klaim.");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/claims/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims-list"] });
      toast.success("Klaim berhasil dihapus/dibatalkan.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal membatalkan klaim.");
    },
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (payload: { id: string; approved_amount: number }) =>
      api.post(`/claims/${payload.id}/approve`, { approved_amount: payload.approved_amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims-list"] });
      toast.success("Klaim reimbursement berhasil disetujui.");
      setIsApproveModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui klaim.");
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (payload: { id: string; rejection_reason: string }) =>
      api.post(`/claims/${payload.id}/reject`, { rejection_reason: payload.rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims-list"] });
      toast.success("Klaim reimbursement berhasil ditolak.");
      setIsRejectModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menolak klaim.");
    },
  });

  const handleOpenCreate = () => {
    setCreateForm({
      employee_id: Array.isArray(employees) && employees.length > 0 ? employees[0].id : "",
      type: "medical",
      amount: 0,
      claim_date: new Date().toISOString().split("T")[0],
      description: "",
      receipt_path: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    createMutation.mutate(createForm);
  };

  const handleOpenApprove = (claim: Claim) => {
    setSelectedClaim(claim);
    setApprovedAmount(Number(claim.amount));
    setIsApproveModalOpen(true);
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClaim) {
      approveMutation.mutate({ id: selectedClaim.id, approved_amount: approvedAmount });
    }
  };

  const handleOpenReject = (claim: Claim) => {
    setSelectedClaim(claim);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClaim) {
      rejectMutation.mutate({ id: selectedClaim.id, rejection_reason: rejectionReason });
    }
  };

  const handleDelete = async (id: string, num: string) => {
    const confirmRes = await Swal.fire({
      title: "Batalkan Klaim",
      text: `Apakah Anda yakin ingin membatalkan dan menghapus pengajuan klaim "${num}"?`,
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

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  const getClaimTypeLabel = (type: string) => {
    switch (type) {
      case "medical":
        return "Medis / Kesehatan";
      case "reimbursement":
        return "Penggantian (Reimbursement)";
      case "travel":
        return "Dinas / Perjalanan";
      case "other":
        return "Lainnya";
      default:
        return type;
    }
  };

  const filteredClaims = Array.isArray(claims)
    ? claims.filter((c: Claim) => {
        const name = `${c.employee?.first_name} ${c.employee?.last_name || ""}`.toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || c.claim_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus ? c.status === filterStatus : true;
        return matchesSearch && matchesStatus;
      })
    : [];

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Klaim Reimbursement Karyawan"
        subtitle="Verifikasi kwitansi medis, pengeluaran kantor, biaya operasional dinas, serta otorisasi pencairan limit."
        backUrl="/compensation"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm">
          <div className="flex flex-1 gap-3 max-w-xl">
            <input
              type="text"
              placeholder="Cari nomer klaim atau karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-955 dark:text-zinc-50 focus:outline-none"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="submitted">Submitted (Diajukan)</option>
              <option value="approved">Disetujui (Approved)</option>
              <option value="rejected">Ditolak (Rejected)</option>
            </select>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Ajukan Klaim
          </button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-955 select-none">
            <p className="text-zinc-500 text-sm">Tidak ada riwayat klaim terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900 select-none">
                <tr>
                  <th className="px-6 py-3">No. Klaim</th>
                  <th className="px-6 py-3">Karyawan</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Jumlah Klaim</th>
                  <th className="px-6 py-3">Persetujuan</th>
                  <th className="px-6 py-3">Tanggal Diajukan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
                {filteredClaims.map((claim: Claim) => {
                  const empName = claim.employee ? `${claim.employee.first_name} ${claim.employee.last_name || ""}` : "N/A";
                  return (
                    <tr key={claim.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-zinc-955 dark:text-zinc-50">{claim.claim_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{empName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">NIP: {claim.employee?.employee_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold">{getClaimTypeLabel(claim.type)}</span>
                        {claim.receipt_path && (
                          <a
                            href={claim.receipt_path}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 mt-1 text-[9px] text-blue-500 hover:underline font-bold"
                          >
                            <FileText className="h-3.5 w-3.5" /> Lihat Lampiran
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold">{formatCurrency(claim.amount)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-450">
                        {claim.approved_amount !== null ? formatCurrency(claim.approved_amount) : "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{claim.claim_date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          claim.status === "approved"
                            ? "bg-emerald-50 text-emerald-705 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : claim.status === "rejected"
                            ? "bg-red-50 text-red-705 dark:bg-red-950/20 dark:text-red-400"
                            : "bg-amber-50 text-amber-705 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {claim.status === "approved" ? "Disetujui" : claim.status === "rejected" ? "Ditolak" : "Diajukan"}
                        </span>
                        {claim.status === "rejected" && claim.rejection_reason && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={claim.rejection_reason}>
                            Alasan: {claim.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {claim.status === "submitted" ? (
                            <>
                              <button
                                onClick={() => handleOpenApprove(claim)}
                                className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 cursor-pointer"
                                title="Setujui Klaim"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenReject(claim)}
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 cursor-pointer"
                                title="Tolak Klaim"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(claim.id, claim.claim_number)}
                                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-550 cursor-pointer"
                                title="Hapus Pengajuan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-bold italic select-none">Sudah Diproses</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Create Claim */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleCreateSubmit}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50 font-sans">Ajukan Klaim Baru</h3>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Pilih Karyawan</label>
                  <select
                    value={createForm.employee_id}
                    onChange={(e) => setCreateForm({ ...createForm, employee_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
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

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Kategori Pengeluaran</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50"
                  >
                    <option value="medical">Kesehatan / Medis</option>
                    <option value="reimbursement">Penggantian (Reimbursement)</option>
                    <option value="travel">Perjalanan Dinas</option>
                    <option value="other">Kategori Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Jumlah Nominal (IDR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Kuitansi / Pembelian</label>
                  <input
                    type="date"
                    required
                    value={createForm.claim_date}
                    onChange={(e) => setCreateForm({ ...createForm, claim_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Deskripsi & Catatan Klaim</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Contoh: Pembelian kacamata silinder resep dr. Andi"
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Bukti Kwitansi (URL / File Path)</label>
                  <input
                    type="text"
                    value={createForm.receipt_path}
                    onChange={(e) => setCreateForm({ ...createForm, receipt_path: e.target.value })}
                    placeholder="Contoh: https://storage.corp/receipt-clm.jpg"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Ajukan Klaim
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Approve Claim */}
        {isApproveModalOpen && selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleApproveSubmit}
              className="w-full max-w-sm bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">Setujui Klaim Reimbursement</h3>
                <button type="button" onClick={() => setIsApproveModalOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Nominal diajukan: <span className="font-semibold font-mono text-zinc-800 dark:text-zinc-200">{formatCurrency(selectedClaim.amount)}</span>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Jumlah Disetujui (IDR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={selectedClaim.amount}
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50 font-mono font-bold"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Nilai persetujuan maksimal setara dengan nominal pengajuan.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-755 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {approveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Setujui Klaim
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Reject Claim */}
        {isRejectModalOpen && selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleRejectSubmit}
              className="w-full max-w-sm bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">Tolak Klaim Reimbursement</h3>
                <button type="button" onClick={() => setIsRejectModalOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Nominal diajukan: <span className="font-semibold font-mono text-zinc-800 dark:text-zinc-200">{formatCurrency(selectedClaim.amount)}</span>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Alasan Penolakan (Wajib)</label>
                  <textarea
                    required
                    maxLength={500}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Bukti kuitansi buram atau tidak valid"
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-755 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-red-650 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {rejectMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Tolak Klaim
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
