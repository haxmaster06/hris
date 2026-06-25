"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { Edit2, Trash2, Plus, Loader2, Eye, Play, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface LifecycleEvent {
  id: string;
  employee_id: string;
  employee?: { first_name: string; last_name: string | null; employee_number: string };
  event_type: string;
  effective_date: string;
  from_position?: { name: string };
  to_position?: { name: string };
  from_department?: { name: string };
  to_department?: { name: string };
  from_branch?: { name: string };
  to_branch?: { name: string };
  to_status: string | null;
  reason: string | null;
  status: string;
}

export default function LifecycleEventsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LifecycleEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({
    employee_id: "",
    event_type: "promotion",
    effective_date: new Date().toISOString().split("T")[0],
    to_position_id: "",
    to_department_id: "",
    to_branch_id: "",
    to_division_id: "",
    to_grade_id: "",
    to_status: "",
    reason: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Events
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["lifecycle-events-list"],
    queryFn: async () => {
      const res = await api.get("/lifecycle-events?include=employee,fromPosition,toPosition,fromDepartment,toDepartment");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch Employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["employees-select"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch Organization lists for dropdown
  const { data: positions } = useQuery({
    queryKey: ["positions-select"],
    queryFn: () => api.get("/positions").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments-select"],
    queryFn: () => api.get("/departments").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-select"],
    queryFn: () => api.get("/branches").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: divisions } = useQuery({
    queryKey: ["divisions-select"],
    queryFn: () => api.get("/divisions").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  const { data: grades } = useQuery({
    queryKey: ["grades-select"],
    queryFn: () => api.get("/grades").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newVal: any) => api.post("/lifecycle-events", newVal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifecycle-events-list"] });
      toast.success("Draf usulan karir berhasil diajukan.");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengajukan usulan karir.");
    }
  });

  // Execute mutation (update employee record)
  const executeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/lifecycle-events/${id}/execute`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifecycle-events-list"] });
      toast.success("Usulan karir berhasil dieksekusi! Data karyawan telah diperbarui.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengeksekusi usulan karir.");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/lifecycle-events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifecycle-events-list"] });
      toast.success("Draf usulan karir berhasil dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus draf usulan karir.");
    }
  });

  const handleOpenCreate = () => {
    setFormData({
      employee_id: Array.isArray(employees) && employees.length > 0 ? employees[0].id : "",
      event_type: "promotion",
      effective_date: new Date().toISOString().split("T")[0],
      to_position_id: "",
      to_department_id: "",
      to_branch_id: "",
      to_division_id: "",
      to_grade_id: "",
      to_status: "",
      reason: "",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus draf usulan karir ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExecute = async (event: LifecycleEvent) => {
    const empName = `${event.employee?.first_name} ${event.employee?.last_name || ""}`;
    const confirmRes = await Swal.fire({
      title: "Eksekusi Mutasi/Karir",
      text: `Apakah Anda yakin ingin mengeksekusi usulan ini untuk ${empName}? Perubahan akan langsung diaplikasikan ke record Karyawan aktif.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Eksekusi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981", // Emerald
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      executeMutation.mutate(event.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      employee_id: formData.employee_id,
      event_type: formData.event_type,
      effective_date: formData.effective_date,
      to_position_id: formData.to_position_id === "" ? null : formData.to_position_id,
      to_department_id: formData.to_department_id === "" ? null : formData.to_department_id,
      to_branch_id: formData.to_branch_id === "" ? null : formData.to_branch_id,
      to_division_id: formData.to_division_id === "" ? null : formData.to_division_id,
      to_grade_id: formData.to_grade_id === "" ? null : formData.to_grade_id,
      to_status: formData.to_status === "" ? null : formData.to_status,
      reason: formData.reason || null,
      notes: formData.notes || null,
      status: "draft"
    };

    createMutation.mutate(payload);
  };

  const filteredEvents = Array.isArray(events)
    ? events.filter((e: LifecycleEvent) => {
        const name = `${e.employee?.first_name} ${e.employee?.last_name || ""}`.toLowerCase();
        const matchesSearch = name.includes(searchTerm.toLowerCase()) || (e.employee?.employee_number || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType ? e.event_type === filterType : true;
        return matchesSearch && matchesType;
      })
    : [];

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case "promotion":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/40";
      case "mutation":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/40";
      case "demotion":
        return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40";
      default:
        return "bg-zinc-50 text-zinc-700 dark:bg-zinc-905/20 dark:text-zinc-400 border border-zinc-200/40";
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "promotion":
        return "Promosi";
      case "mutation":
        return "Mutasi";
      case "demotion":
        return "Demotion";
      case "status_change":
        return "Status Change";
      case "contract_renewal":
        return "Pembaruan Kontrak";
      case "resignation":
        return "Resign";
      case "termination":
        return "PHK";
      case "retirement":
        return "Pensiun";
      default:
        return type;
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Manajemen Karir Karyawan"
        subtitle="Kelola proses mutasi jabatan, kenaikan pangkat, perubahan status kerja, dan pensiun."
        backUrl="/employee-lifecycle"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm">
          <div className="flex flex-1 gap-3 max-w-2xl">
            <input
              type="text"
              placeholder="Cari Karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[150px] px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2"
            />
            {/* Event Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="">Semua Tipe Kejadian</option>
              <option value="promotion">Promosi</option>
              <option value="mutation">Mutasi</option>
              <option value="demotion">Demotion</option>
              <option value="status_change">Perubahan Status</option>
              <option value="contract_renewal">Pembaruan Kontrak</option>
              <option value="resignation">Resigned</option>
              <option value="termination">PHK</option>
              <option value="retirement">Pensiun</option>
            </select>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Buat Usulan Karir
          </button>
        </div>

        {/* Data Table */}
        {isLoadingEvents ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950 select-none">
            <p className="text-zinc-500 text-sm">Tidak ada data usulan karir yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900 select-none">
                <tr>
                  <th className="px-6 py-3">Karyawan</th>
                  <th className="px-6 py-3">Tipe</th>
                  <th className="px-6 py-3">Tanggal Efektif</th>
                  <th className="px-6 py-3 hidden md:table-cell">Mutasi Dari &rarr; Ke</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
                {filteredEvents.map((event: LifecycleEvent) => {
                  const empName = `${event.employee?.first_name} ${event.employee?.last_name || ""}`;
                  return (
                    <tr key={event.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-950 dark:text-zinc-50">{empName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">NIP: {event.employee?.employee_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getEventBadgeClass(event.event_type)}`}>
                          {getEventLabel(event.event_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-xs">{event.effective_date}</td>
                      <td className="px-6 py-4 hidden md:table-cell text-xs text-zinc-550 max-w-xs truncate">
                        {event.to_position && event.from_position && (
                          <div>
                            <span className="font-semibold">Posisi:</span> {event.from_position.name} &rarr; {event.to_position.name}
                          </div>
                        )}
                        {event.to_department && event.from_department && (
                          <div className="mt-1">
                            <span className="font-semibold">Dept:</span> {event.from_department.name} &rarr; {event.to_department.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          event.status === "executed"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-zinc-150 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300"
                        }`}>
                          {event.status === "executed" ? "Executed" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {event.status === "draft" && (
                            <button
                              onClick={() => handleExecute(event)}
                              className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 cursor-pointer"
                              title="Eksekusi Mutasi"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          {event.status === "draft" && (
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

        {/* Create Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-6 my-8"
            >
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Ajukan Usulan Karir Baru</h3>
                <button type="button" onClick={closeModal} className="text-zinc-400 hover:text-zinc-650 text-xl cursor-pointer">&times;</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Employee select */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Karyawan</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
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

                {/* Event Type select */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tipe Perubahan</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="promotion">Promosi</option>
                    <option value="mutation">Mutasi</option>
                    <option value="demotion">Demotion</option>
                    <option value="status_change">Perubahan Status</option>
                    <option value="contract_renewal">Pembaruan Kontrak</option>
                    <option value="resignation">Resign / Resignation</option>
                    <option value="termination">PHK</option>
                    <option value="retirement">Pensiun</option>
                  </select>
                </div>

                {/* Effective date */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Efektif</label>
                  <input
                    type="date"
                    required
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  />
                </div>

                {/* To Position */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ke Jabatan (Baru)</label>
                  <select
                    value={formData.to_position_id}
                    onChange={(e) => setFormData({ ...formData, to_position_id: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Tetap / Tidak Berubah</option>
                    {Array.isArray(positions) &&
                      positions.map((pos: any) => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))}
                  </select>
                </div>

                {/* To Department */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ke Departemen (Baru)</label>
                  <select
                    value={formData.to_department_id}
                    onChange={(e) => setFormData({ ...formData, to_department_id: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Tetap / Tidak Berubah</option>
                    {Array.isArray(departments) &&
                      departments.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                  </select>
                </div>

                {/* To Branch */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ke Cabang (Baru)</label>
                  <select
                    value={formData.to_branch_id}
                    onChange={(e) => setFormData({ ...formData, to_branch_id: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Tetap / Tidak Berubah</option>
                    {Array.isArray(branches) &&
                      branches.map((br: any) => (
                        <option key={br.id} value={br.id}>{br.name}</option>
                      ))}
                  </select>
                </div>

                {/* To Division */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ke Divisi (Baru)</label>
                  <select
                    value={formData.to_division_id}
                    onChange={(e) => setFormData({ ...formData, to_division_id: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Tetap / Tidak Berubah</option>
                    {Array.isArray(divisions) &&
                      divisions.map((div: any) => (
                        <option key={div.id} value={div.id}>{div.name}</option>
                      ))}
                  </select>
                </div>

                {/* To Grade */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ke Golongan/Grade (Baru)</label>
                  <select
                    value={formData.to_grade_id}
                    onChange={(e) => setFormData({ ...formData, to_grade_id: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Tetap / Tidak Berubah</option>
                    {Array.isArray(grades) &&
                      grades.map((gr: any) => (
                        <option key={gr.id} value={gr.id}>{gr.name}</option>
                      ))}
                  </select>
                </div>

                {/* To status */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Ke Status Karyawan (Baru)</label>
                  <select
                    value={formData.to_status}
                    onChange={(e) => setFormData({ ...formData, to_status: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Tetap / Tidak Berubah</option>
                    <option value="probation">Probation</option>
                    <option value="contract">Kontrak</option>
                    <option value="permanent">Tetap / Permanent</option>
                    <option value="resigned">Resigned</option>
                    <option value="retired">Pensiun</option>
                    <option value="terminated">PHK</option>
                  </select>
                </div>

                {/* Reason */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Alasan Perubahan</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Alasan diajukannya promosi/mutasi..."
                    rows={2}
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
                  Ajukan Usulan
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
