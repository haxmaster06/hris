"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { User, Landmark, Coins, Plus, Trash2, Edit2, Loader2, ArrowLeft, Search, Save } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  employee_number: string;
  department?: { name: string };
}

interface EmployeeSalary {
  id: string;
  basic_salary: number;
  tax_method: "gross" | "nett" | "gross_up";
  tax_status: string;
  bpjs_class: "1" | "2" | "3";
  bank_name: string | null;
  bank_account: string | null;
  bank_holder_name: string | null;
  effective_date: string;
  notes: string | null;
}

interface EmployeeAllowance {
  id: string;
  payroll_component_id: string;
  payroll_component?: { name: string; code: string };
  amount: number;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
}

export default function EmployeeSalaryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<"structure" | "allowances">("structure");

  // Form states for Salary Structure
  const [salaryForm, setSalaryForm] = useState({
    id: "",
    basic_salary: 0,
    tax_method: "gross" as "gross" | "nett" | "gross_up",
    tax_status: "TK/0",
    bpjs_class: "1" as "1" | "2" | "3",
    bank_name: "",
    bank_account: "",
    bank_holder_name: "",
    effective_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Modal & Form states for Allowance
  const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<EmployeeAllowance | null>(null);
  const [allowanceForm, setAllowanceForm] = useState({
    payroll_component_id: "",
    amount: 0,
    effective_date: new Date().toISOString().split("T")[0],
    end_date: "",
    is_active: true,
  });

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Employees
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees-salary-list"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch Salary structures for selected employee
  const { data: salaries, isLoading: isLoadingSalary } = useQuery({
    queryKey: ["employee-salary", selectedEmployee?.id],
    queryFn: async () => {
      const res = await api.get(`/employees/${selectedEmployee?.id}/salary`);
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && !!selectedEmployee?.id,
  });

  // Fetch Allowances for selected employee
  const { data: allowances, isLoading: isLoadingAllowances } = useQuery({
    queryKey: ["employee-allowances", selectedEmployee?.id],
    queryFn: async () => {
      const res = await api.get(`/employees/${selectedEmployee?.id}/allowances`);
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && !!selectedEmployee?.id,
  });

  // Fetch Master Components for Tunjangan (earning)
  const { data: components } = useQuery({
    queryKey: ["earning-components-list"],
    queryFn: async () => {
      const res = await api.get("/payroll-components");
      const list = res.data.data?.data || res.data.data || [];
      return list.filter((c: any) => c.type === "earning");
    },
    enabled: isAuthenticated,
  });

  // Automatically load the active salary structure when salaries change
  useEffect(() => {
    if (salaries && salaries.length > 0) {
      const active = salaries[0]; // Assuming backend returns active first or latest
      setSalaryForm({
        id: active.id,
        basic_salary: Number(active.basic_salary),
        tax_method: active.tax_method,
        tax_status: active.tax_status,
        bpjs_class: active.bpjs_class,
        bank_name: active.bank_name || "",
        bank_account: active.bank_account || "",
        bank_holder_name: active.bank_holder_name || "",
        effective_date: active.effective_date,
        notes: active.notes || "",
      });
    } else {
      setSalaryForm({
        id: "",
        basic_salary: 0,
        tax_method: "gross",
        tax_status: "TK/0",
        bpjs_class: "1",
        bank_name: "",
        bank_account: "",
        bank_holder_name: "",
        effective_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [salaries]);

  // Save Salary Structure Mutation
  const saveSalaryMutation = useMutation({
    mutationFn: (payload: any) => {
      if (salaryForm.id) {
        return api.put(`/employees/${selectedEmployee?.id}/salary/${salaryForm.id}`, payload);
      }
      return api.post(`/employees/${selectedEmployee?.id}/salary`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-salary", selectedEmployee?.id] });
      toast.success("Struktur gaji karyawan berhasil diperbarui.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan struktur gaji.");
    },
  });

  // Save Allowance Mutation
  const saveAllowanceMutation = useMutation({
    mutationFn: (payload: any) => {
      if (selectedAllowance) {
        return api.put(`/employees/${selectedEmployee?.id}/allowances/${selectedAllowance.id}`, payload);
      }
      return api.post(`/employees/${selectedEmployee?.id}/allowances`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-allowances", selectedEmployee?.id] });
      toast.success(selectedAllowance ? "Tunjangan karyawan berhasil diubah." : "Tunjangan karyawan berhasil ditambahkan.");
      closeAllowanceModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan tunjangan.");
    },
  });

  // Delete Allowance Mutation
  const deleteAllowanceMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${selectedEmployee?.id}/allowances/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-allowances", selectedEmployee?.id] });
      toast.success("Tunjangan berhasil dihapus dari karyawan.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus tunjangan.");
    },
  });

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    saveSalaryMutation.mutate(salaryForm);
  };

  const handleOpenCreateAllowance = () => {
    setSelectedAllowance(null);
    setAllowanceForm({
      payroll_component_id: Array.isArray(components) && components.length > 0 ? components[0].id : "",
      amount: 0,
      effective_date: new Date().toISOString().split("T")[0],
      end_date: "",
      is_active: true,
    });
    setIsAllowanceModalOpen(true);
  };

  const handleOpenEditAllowance = (allowance: EmployeeAllowance) => {
    setSelectedAllowance(allowance);
    setAllowanceForm({
      payroll_component_id: allowance.payroll_component_id,
      amount: Number(allowance.amount),
      effective_date: allowance.effective_date,
      end_date: allowance.end_date || "",
      is_active: allowance.is_active,
    });
    setIsAllowanceModalOpen(true);
  };

  const closeAllowanceModal = () => {
    setIsAllowanceModalOpen(false);
  };

  const handleDeleteAllowance = async (id: string, name: string) => {
    const confirmRes = await Swal.fire({
      title: "Hapus Tunjangan Karyawan",
      text: `Apakah Anda yakin ingin menghapus tunjangan "${name}" untuk karyawan ini?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      deleteAllowanceMutation.mutate(id);
    }
  };

  const handleSaveAllowance = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      payroll_component_id: allowanceForm.payroll_component_id,
      amount: allowanceForm.amount,
      effective_date: allowanceForm.effective_date,
      end_date: allowanceForm.end_date === "" ? null : allowanceForm.end_date,
      is_active: allowanceForm.is_active,
    };
    saveAllowanceMutation.mutate(payload);
  };

  const filteredEmployees = Array.isArray(employees)
    ? employees.filter((e: Employee) => {
        const name = `${e.first_name} ${e.last_name || ""}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || e.employee_number.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Gaji & Tunjangan Karyawan"
        subtitle="Definisikan gaji pokok bulanan, setel tunjangan rutin tetap, dan atur detail rekening bank."
        backUrl="/payroll"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Employee List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-zinc-955 dark:text-zinc-50 border-b pb-2 border-zinc-150 dark:border-zinc-900 select-none">
                Daftar Personel
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari NIP atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-955 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-550"
                />
              </div>

              {isLoadingEmployees ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">Karyawan tidak ditemukan.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredEmployees.map((emp: Employee) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setActiveTab("structure");
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                        selectedEmployee?.id === emp.id
                          ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-700"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-zinc-955 dark:text-zinc-50">{emp.first_name} {emp.last_name || ""}</h4>
                      <div className="flex justify-between items-center mt-1 text-[10px] text-zinc-500 font-medium">
                        <span>NIP: {emp.employee_number}</span>
                        {emp.department && <span className="italic">{emp.department.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Salary & Allowance Configuration */}
          <div className="lg:col-span-2">
            {selectedEmployee ? (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <button
                    onClick={() => setActiveTab("structure")}
                    className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "structure"
                        ? "border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Landmark className="h-4 w-4" />
                    Gaji Pokok & Bank
                  </button>
                  <button
                    onClick={() => setActiveTab("allowances")}
                    className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === "allowances"
                        ? "border-zinc-950 text-zinc-950 dark:border-zinc-100 dark:text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Coins className="h-4 w-4" />
                    Tunjangan Rutin
                  </button>
                </div>

                <div className="p-6">
                  {/* Tab 1: Salary Structure */}
                  {activeTab === "structure" && (
                    <form onSubmit={handleSaveSalary} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Gaji Pokok Bulanan (IDR)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={salaryForm.basic_salary}
                            onChange={(e) => setSalaryForm({ ...salaryForm, basic_salary: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50 font-mono font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Metode Pajak PPh 21</label>
                          <select
                            value={salaryForm.tax_method}
                            onChange={(e) => setSalaryForm({ ...salaryForm, tax_method: e.target.value as "gross" | "nett" | "gross_up" })}
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                          >
                            <option value="gross">Gross (Potong Gaji)</option>
                            <option value="nett">Nett (Ditanggung Perusahaan)</option>
                            <option value="gross_up">Gross-Up (Tunjangan Pajak)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Status PTKP Pajak</label>
                          <select
                            value={salaryForm.tax_status}
                            onChange={(e) => setSalaryForm({ ...salaryForm, tax_status: e.target.value })}
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                          >
                            <option value="TK/0">TK/0 (Tidak Kawin, 0 Tanggungan)</option>
                            <option value="TK/1">TK/1</option>
                            <option value="TK/2">TK/2</option>
                            <option value="TK/3">TK/3</option>
                            <option value="K/0">K/0 (Kawin, 0 Tanggungan)</option>
                            <option value="K/1">K/1</option>
                            <option value="K/2">K/2</option>
                            <option value="K/3">K/3</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Kelas Kesehatan BPJS</label>
                          <select
                            value={salaryForm.bpjs_class}
                            onChange={(e) => setSalaryForm({ ...salaryForm, bpjs_class: e.target.value as "1" | "2" | "3" })}
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-955 dark:text-zinc-50"
                          >
                            <option value="1">Kelas I (Satu)</option>
                            <option value="2">Kelas II (Dua)</option>
                            <option value="3">Kelas III (Tiga)</option>
                          </select>
                        </div>

                        <div className="col-span-1 sm:col-span-2 border-t pt-4 border-zinc-150 dark:border-zinc-900">
                          <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 mb-3 flex items-center gap-1">
                            <Landmark className="h-3.5 w-3.5" /> Rekening Transfer Bank
                          </h4>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nama Bank</label>
                          <input
                            type="text"
                            value={salaryForm.bank_name}
                            onChange={(e) => setSalaryForm({ ...salaryForm, bank_name: e.target.value })}
                            placeholder="Contoh: Bank Mandiri"
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nomor Rekening</label>
                          <input
                            type="text"
                            value={salaryForm.bank_account}
                            onChange={(e) => setSalaryForm({ ...salaryForm, bank_account: e.target.value })}
                            placeholder="Contoh: 1320012345678"
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50 font-mono"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nama Pemilik Rekening</label>
                          <input
                            type="text"
                            value={salaryForm.bank_holder_name}
                            onChange={(e) => setSalaryForm({ ...salaryForm, bank_holder_name: e.target.value })}
                            placeholder="Contoh: Budi Santoso"
                            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                          />
                        </div>

                        <div className="col-span-1 sm:col-span-2 border-t pt-4 border-zinc-150 dark:border-zinc-900">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Mulai Efektif</label>
                          <input
                            type="date"
                            required
                            value={salaryForm.effective_date}
                            onChange={(e) => setSalaryForm({ ...salaryForm, effective_date: e.target.value })}
                            className="w-full max-w-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-550 text-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-zinc-150 dark:border-zinc-900">
                        <button
                          type="submit"
                          disabled={saveSalaryMutation.isPending}
                          className="inline-flex items-center gap-1.5 py-2 px-5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          {saveSalaryMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Simpan Struktur Gaji
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 2: Allowances (Tunjangan Rutin Karyawan) */}
                  {activeTab === "allowances" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-900">
                        <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Tunjangan Tetap / Rutin Individu</h4>
                        <button
                          onClick={handleOpenCreateAllowance}
                          className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-bold hover:opacity-90 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Tunjangan
                        </button>
                      </div>

                      {isLoadingAllowances ? (
                        <div className="flex justify-center items-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                      ) : !allowances || allowances.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 select-none">
                          <p className="text-zinc-500 text-xs">Belum ada tunjangan rutin terdaftar untuk karyawan ini.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900">
                              <tr>
                                <th className="px-4 py-2.5">Nama Tunjangan</th>
                                <th className="px-4 py-2.5">Nominal Tunjangan</th>
                                <th className="px-4 py-2.5">Tanggal Efektif</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                              {allowances.map((allow: EmployeeAllowance) => (
                                <tr key={allow.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                                    {allow.payroll_component?.name}
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{allow.payroll_component?.code}</div>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-semibold text-zinc-950 dark:text-zinc-50">
                                    {formatCurrency(allow.amount)}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-zinc-550 dark:text-zinc-400">
                                    {allow.effective_date} {allow.end_date ? `s/d ${allow.end_date}` : ""}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                      allow.is_active
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                        : "bg-zinc-150 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400"
                                    }`}>
                                      {allow.is_active ? "Aktif" : "Non-aktif"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditAllowance(allow)}
                                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                                        title="Ubah"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAllowance(allow.id, allow.payroll_component?.name || "")}
                                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650"
                                        title="Hapus"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center py-32 text-center border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950 select-none">
                <User className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mb-3" />
                <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">Struktur Gaji Karyawan</h4>
                <p className="text-zinc-500 text-xs mt-1.5 max-w-sm">Pilih salah satu karyawan di kolom sebelah kiri untuk mengelola konfigurasi gaji pokok, rekening transfer bank, atau tunjangan tetap.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Allowance Modal */}
        {isAllowanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleSaveAllowance}
              className="w-full max-w-sm bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">
                  {selectedAllowance ? "Ubah Tunjangan Karyawan" : "Tambah Tunjangan Karyawan"}
                </h3>
                <button type="button" onClick={closeAllowanceModal} className="text-zinc-400 hover:text-zinc-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Pilih Komponen Tunjangan</label>
                  <select
                    value={allowanceForm.payroll_component_id}
                    onChange={(e) => setAllowanceForm({ ...allowanceForm, payroll_component_id: e.target.value })}
                    required
                    disabled={!!selectedAllowance}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                  >
                    <option value="" disabled>Pilih Tunjangan</option>
                    {Array.isArray(components) &&
                      components.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nominal (IDR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={allowanceForm.amount}
                    onChange={(e) => setAllowanceForm({ ...allowanceForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Mulai Efektif</label>
                  <input
                    type="date"
                    required
                    value={allowanceForm.effective_date}
                    onChange={(e) => setAllowanceForm({ ...allowanceForm, effective_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Berakhir (Opsional)</label>
                  <input
                    type="date"
                    value={allowanceForm.end_date}
                    onChange={(e) => setAllowanceForm({ ...allowanceForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowanceForm.is_active}
                    onChange={(e) => setAllowanceForm({ ...allowanceForm, is_active: e.target.checked })}
                    className="rounded border-zinc-350 dark:border-zinc-800 text-zinc-900 focus:ring-zinc-500"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Tunjangan Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={closeAllowanceModal}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold hover:opacity-85 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveAllowanceMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saveAllowanceMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Tunjangan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Back button */}
        <div className="flex justify-center pt-8">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1.5 py-2.5 px-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-955 text-xs font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Menu Payroll
          </Link>
        </div>
      </main>
    </div>
  );
}
