"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { HeartHandshake, Plus, Edit2, Trash2, Loader2, ArrowLeft, UserPlus, Search, Save } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface Benefit {
  id: string;
  name: string;
  code: string;
  type: "insurance" | "allowance" | "perk";
  description: string | null;
  coverage_details: string | null;
  monthly_cost: number;
}

interface EmployeeBenefit {
  id: string;
  employee_id: string;
  benefit_id: string;
  benefit?: Benefit;
  coverage_amount: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  employee_number: string;
}

export default function BenefitsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "enrollment">("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  // Catalog Form states
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [catalogForm, setCatalogForm] = useState({
    name: "",
    code: "",
    type: "insurance" as "insurance" | "allowance" | "perk",
    description: "",
    coverage_details: "",
    monthly_cost: 0,
  });

  // Enrollment states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    benefit_id: "",
    coverage_amount: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    is_active: true,
  });

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Benefit Catalog
  const { data: benefits, isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["benefits-list"],
    queryFn: async () => {
      const res = await api.get("/benefits");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch Employees for Enrollment
  const { data: employees } = useQuery({
    queryKey: ["employees-benefits-select"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && activeTab === "enrollment",
  });

  // Fetch Employee Benefits
  const { data: employeeBenefits, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["employee-benefits-list", selectedEmployee?.id],
    queryFn: async () => {
      const res = await api.get(`/employees/${selectedEmployee?.id}/benefits?include=benefit`);
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && activeTab === "enrollment" && !!selectedEmployee?.id,
  });

  // Save Catalog Mutation (Create/Update)
  const saveCatalogMutation = useMutation({
    mutationFn: (payload: any) => {
      if (selectedBenefit) {
        return api.put(`/benefits/${selectedBenefit.id}`, payload);
      }
      return api.post("/benefits", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits-list"] });
      toast.success(selectedBenefit ? "Program benefit berhasil diubah." : "Program benefit baru berhasil ditambahkan.");
      setIsCatalogModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan program benefit.");
    },
  });

  // Delete Catalog Mutation
  const deleteCatalogMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/benefits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefits-list"] });
      toast.success("Program benefit berhasil dihapus dari katalog.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus program benefit.");
    },
  });

  // Save Enrollment Mutation
  const enrollMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/employees/${selectedEmployee?.id}/benefits`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-benefits-list", selectedEmployee?.id] });
      toast.success("Karyawan berhasil didaftarkan ke program benefit.");
      setIsEnrollModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mendaftarkan benefit.");
    },
  });

  // Cancel Enrollment Mutation
  const cancelEnrollMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${selectedEmployee?.id}/benefits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-benefits-list", selectedEmployee?.id] });
      toast.success("Enrollment benefit karyawan berhasil dinonaktifkan/dihapus.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus enrollment benefit.");
    },
  });

  const handleOpenCreateCatalog = () => {
    setSelectedBenefit(null);
    setCatalogForm({
      name: "",
      code: "",
      type: "insurance",
      description: "",
      coverage_details: "",
      monthly_cost: 0,
    });
    setIsCatalogModalOpen(true);
  };

  const handleOpenEditCatalog = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setCatalogForm({
      name: benefit.name,
      code: benefit.code,
      type: benefit.type,
      description: benefit.description || "",
      coverage_details: benefit.coverage_details || "",
      monthly_cost: Number(benefit.monthly_cost),
    });
    setIsCatalogModalOpen(true);
  };

  const handleDeleteCatalog = async (id: string, name: string) => {
    const confirmRes = await Swal.fire({
      title: "Hapus Program Benefit",
      text: `Hapus program "${name}" dari katalog? Karyawan yang terdaftar mungkin terpengaruh.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      deleteCatalogMutation.mutate(id);
    }
  };

  const handleSaveCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    saveCatalogMutation.mutate(catalogForm);
  };

  const handleOpenEnroll = () => {
    setEnrollForm({
      benefit_id: Array.isArray(benefits) && benefits.length > 0 ? benefits[0].id : "",
      coverage_amount: 0,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      is_active: true,
    });
    setIsEnrollModalOpen(true);
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      benefit_id: enrollForm.benefit_id,
      coverage_amount: enrollForm.coverage_amount,
      start_date: enrollForm.start_date,
      end_date: enrollForm.end_date === "" ? null : enrollForm.end_date,
      is_active: enrollForm.is_active,
    };
    enrollMutation.mutate(payload);
  };

  const handleDeleteEnrollment = async (id: string, name: string) => {
    const confirmRes = await Swal.fire({
      title: "Hapus Enrollment",
      text: `Apakah Anda yakin ingin menghapus pendaftaran benefit "${name}" untuk karyawan ini?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      cancelEnrollMutation.mutate(id);
    }
  };

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  const filteredBenefits = Array.isArray(benefits)
    ? benefits.filter((b: Benefit) => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType ? b.type === filterType : true;
        return matchesSearch && matchesType;
      })
    : [];

  const getBenefitTypeLabel = (type: string) => {
    switch (type) {
      case "insurance":
        return "Asuransi / Kesehatan";
      case "allowance":
        return "Tunjangan Khusus";
      case "perk":
        return "Fasilitas (Perk)";
      default:
        return type;
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Benefit & Asuransi Karyawan"
        subtitle="Kelola program benefit medis, keanggaraan fasilitas, serta pendaftaran paket benefit per individu."
        backUrl="/compensation"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Tab switch */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-1.5 rounded-xl max-w-md mx-auto shadow-sm">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
            }`}
          >
            Katalog Benefit
          </button>
          <button
            onClick={() => setActiveTab("enrollment")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "enrollment"
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
            }`}
          >
            Pendaftaran (Enrollment)
          </button>
        </div>

        {/* Tab content 1: catalog */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm">
              <div className="flex flex-1 gap-3 max-w-xl">
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau kode..."
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
                  <option value="insurance">Asuransi</option>
                  <option value="allowance">Tunjangan</option>
                  <option value="perk">Fasilitas (Perk)</option>
                </select>
              </div>
              <button
                onClick={handleOpenCreateCatalog}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-955 text-sm font-semibold hover:opacity-90 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Tambah Benefit
              </button>
            </div>

            {isLoadingCatalog ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : filteredBenefits.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950 select-none">
                <p className="text-zinc-550 text-sm">Tidak ada program benefit terdaftar di katalog.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900 select-none">
                    <tr>
                      <th className="px-6 py-3">Nama Program</th>
                      <th className="px-6 py-3">Kode</th>
                      <th className="px-6 py-3">Tipe</th>
                      <th className="px-6 py-3">Biaya Bulanan (Est.)</th>
                      <th className="px-6 py-3">Deskripsi / Detail</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
                    {filteredBenefits.map((b: Benefit) => (
                      <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="px-6 py-4 font-bold text-zinc-950 dark:text-zinc-50">{b.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{b.code}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            b.type === "insurance"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200/40"
                              : b.type === "allowance"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-200/40"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-200/40"
                          }`}>
                            {getBenefitTypeLabel(b.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold">{formatCurrency(b.monthly_cost)}</td>
                        <td className="px-6 py-4 text-xs text-zinc-500 max-w-xs truncate">{b.description || "-"}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditCatalog(b)}
                              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                              title="Ubah"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCatalog(b.id, b.name)}
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
          </div>
        )}

        {/* Tab content 2: enrollment */}
        {activeTab === "enrollment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Employee select */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-zinc-955 p-4 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-xs text-zinc-950 dark:text-zinc-50 uppercase tracking-wider select-none">
                  Pilih Karyawan
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Cari nama karyawan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {Array.isArray(employees) &&
                    employees
                      .filter((e: Employee) => `${e.first_name} ${e.last_name || ""}`.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((emp: Employee) => (
                        <div
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                            selectedEmployee?.id === emp.id
                              ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-700"
                              : "bg-white dark:bg-zinc-955 border-zinc-200 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          }`}
                        >
                          <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-50">{emp.first_name} {emp.last_name || ""}</h4>
                          <span className="text-[10px] text-zinc-550 block mt-1 font-mono">NIP: {emp.employee_number}</span>
                        </div>
                      ))}
                </div>
              </div>
            </div>

            {/* Right Col: Active enrolled benefits */}
            <div className="lg:col-span-2 space-y-4">
              {selectedEmployee ? (
                <div className="bg-white dark:bg-zinc-955 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Benefit Terdaftar</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{selectedEmployee.first_name} {selectedEmployee.last_name || ""}</p>
                    </div>
                    <button
                      onClick={handleOpenEnroll}
                      className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-bold hover:opacity-90 cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Daftarkan Benefit
                    </button>
                  </div>

                  {isLoadingEnrollments ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                  ) : !employeeBenefits || employeeBenefits.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 select-none">
                      <p className="text-zinc-550 text-xs">Karyawan ini belum terdaftar di program benefit apa pun.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900">
                          <tr>
                            <th className="px-4 py-2.5">Program Benefit</th>
                            <th className="px-4 py-2.5">Limit Jaminan</th>
                            <th className="px-4 py-2.5">Tanggal Mulai</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                          {employeeBenefits.map((eb: EmployeeBenefit) => (
                            <tr key={eb.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                              <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                                {eb.benefit?.name}
                                <span className="block text-[10px] text-zinc-450 mt-0.5">{getBenefitTypeLabel(eb.benefit?.type || "")}</span>
                              </td>
                              <td className="px-4 py-3 font-mono font-semibold">{formatCurrency(eb.coverage_amount)}</td>
                              <td className="px-4 py-3 font-mono text-zinc-500">{eb.start_date}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  eb.is_active
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : "bg-zinc-150 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400"
                                }`}>
                                  {eb.is_active ? "Aktif" : "Non-aktif"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteEnrollment(eb.id, eb.benefit?.name || "")}
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 cursor-pointer"
                                  title="Batalkan / Hapus"
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
              ) : (
                <div className="h-full flex flex-col justify-center items-center py-24 text-center border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950 select-none">
                  <HeartHandshake className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
                  <p className="text-zinc-500 text-xs max-w-sm">Pilih karyawan di kolom kiri untuk melihat program jaminan benefit aktif atau mendaftarkan benefit baru.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Create Catalog Benefit */}
        {isCatalogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleSaveCatalog}
              className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">
                  {selectedBenefit ? "Ubah Katalog Program" : "Tambah Program Benefit"}
                </h3>
                <button type="button" onClick={() => setIsCatalogModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nama Benefit</label>
                  <input
                    type="text"
                    required
                    value={catalogForm.name}
                    onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                    placeholder="Contoh: Asuransi Gigi Premium"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Kode Unik</label>
                  <input
                    type="text"
                    required
                    value={catalogForm.code}
                    onChange={(e) => setCatalogForm({ ...catalogForm, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: AS_DENTAL"
                    disabled={!!selectedBenefit}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tipe</label>
                  <select
                    value={catalogForm.type}
                    onChange={(e) => setCatalogForm({ ...catalogForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50"
                  >
                    <option value="insurance">Asuransi / Jaminan Medis</option>
                    <option value="allowance">Tunjangan Khusus</option>
                    <option value="perk">Fasilitas (Perk)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Estimasi Biaya Bulanan (IDR)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={catalogForm.monthly_cost}
                    onChange={(e) => setCatalogForm({ ...catalogForm, monthly_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Deskripsi & Detail Tanggungan (Coverage)</label>
                  <textarea
                    value={catalogForm.description}
                    onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                    placeholder="Tuliskan rincian pertanggungan atau ketentuan asuransi..."
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveCatalogMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saveCatalogMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Benefit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Enroll Employee */}
        {isEnrollModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleEnrollSubmit}
              className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">Daftarkan Benefit</h3>
                <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="text-zinc-400 hover:text-zinc-650 text-lg cursor-pointer">
                  &times;
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Pilih Program Benefit</label>
                  <select
                    value={enrollForm.benefit_id}
                    onChange={(e) => setEnrollForm({ ...enrollForm, benefit_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-955 dark:text-zinc-50"
                  >
                    <option value="" disabled>Pilih Program</option>
                    {Array.isArray(benefits) &&
                      benefits.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Jumlah Jaminan (Coverage Amount)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={enrollForm.coverage_amount}
                    onChange={(e) => setEnrollForm({ ...enrollForm, coverage_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-950 dark:text-zinc-50 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Mulai Berlaku</label>
                  <input
                    type="date"
                    required
                    value={enrollForm.start_date}
                    onChange={(e) => setEnrollForm({ ...enrollForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Berakhir (Opsional)</label>
                  <input
                    type="date"
                    value={enrollForm.end_date}
                    onChange={(e) => setEnrollForm({ ...enrollForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enrollForm.is_active}
                    onChange={(e) => setEnrollForm({ ...enrollForm, is_active: e.target.checked })}
                    className="rounded border-zinc-350 dark:border-zinc-800 text-zinc-900 focus:ring-zinc-500"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Enrollment Langsung Aktif</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold text-zinc-755 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {enrollMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Daftarkan Benefit
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
