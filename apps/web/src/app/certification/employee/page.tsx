"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  ShieldCheck,
  FileText,
  Download,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";

interface EmployeeCertification {
  id: string;
  employee_id: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  certification_id: string;
  certification?: {
    name: string;
    issuer: string;
  };
  certificate_number: string;
  issue_date: string;
  expired_date?: string;
  document_path?: string;
  document_url?: string; // Signed URL from API response
  status: "Active" | "Expired" | "Pending_Renewal";
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface Certification {
  id: string;
  name: string;
}

export default function EmployeeCertificationsManagement() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmpCert, setSelectedEmpCert] = useState<EmployeeCertification | null>(null);

  // Form states
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formCertId, setFormCertId] = useState("");
  const [formCertNumber, setFormCertNumber] = useState("");
  const [formIssueDate, setFormIssueDate] = useState("");
  const [formExpiredDate, setFormExpiredDate] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch employee certifications
  const { data: empCerts, isLoading } = useQuery<EmployeeCertification[]>({
    queryKey: ["employee-certifications"],
    queryFn: () => api.get("/employee-certifications").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch active employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch certifications catalogue
  const { data: certifications } = useQuery<Certification[]>({
    queryKey: ["certifications"],
    queryFn: () => api.get("/certifications").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => api.post("/employee-certifications", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-certifications"] });
      toast.success("Employee credential logged successfully");
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to log certification");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => {
      // Laravel requires _method: PUT inside a POST request when parsing multipart/form-data
      formData.append("_method", "PUT");
      return api.post(`/employee-certifications/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-certifications"] });
      toast.success("Employee credential updated successfully");
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update certification");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employee-certifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-certifications"] });
      toast.success("Credential deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete credential");
    }
  });

  const handleOpenCreate = () => {
    setSelectedEmpCert(null);
    setFormEmployeeId("");
    setFormCertId("");
    setFormCertNumber("");
    setFormIssueDate("");
    setFormExpiredDate("");
    setFormFile(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ec: EmployeeCertification) => {
    setSelectedEmpCert(ec);
    setFormEmployeeId(ec.employee_id);
    setFormCertId(ec.certification_id);
    setFormCertNumber(ec.certificate_number);
    setFormIssueDate(ec.issue_date ? ec.issue_date.substring(0, 10) : "");
    setFormExpiredDate(ec.expired_date ? ec.expired_date.substring(0, 10) : "");
    setFormFile(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this employee certification log?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("employee_id", formEmployeeId);
    formData.append("certification_id", formCertId);
    formData.append("certificate_number", formCertNumber);
    formData.append("issue_date", formIssueDate);
    if (formExpiredDate) {
      formData.append("expired_date", formExpiredDate);
    }
    if (formFile) {
      formData.append("document", formFile);
    }

    if (selectedEmpCert) {
      updateMutation.mutate({ id: selectedEmpCert.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  // Filter implementation
  const filteredCerts = Array.isArray(empCerts) ? empCerts.filter((ec) => {
    const fullName = `${ec.employee?.first_name || ""} ${ec.employee?.last_name || ""}`;
    const certName = ec.certification?.name || "";
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          certName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ec.certificate_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "" || ec.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Employee Licensing & Credentials"
        subtitle="Log professional certifications, upload verification documents, and audit compliance status."
        backUrl="/certification"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name or license number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Pending_Renewal">Pending Renewal</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-sm transition-all w-full sm:w-auto justify-center hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" /> Log License
          </button>
        </div>

        {/* Data List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl">
            <ShieldCheck className="h-12 w-12 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-md font-bold text-zinc-700 dark:text-zinc-300">No licenses found</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">Try expanding your search parameters or log a new employee credential.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">License Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">License Number</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Doc</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredCerts.map((ec) => (
                  <tr key={ec.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-950 dark:text-zinc-50">
                      {ec.employee ? `${ec.employee.first_name} ${ec.employee.last_name}` : "Unknown Employee"}
                      <p className="text-[11px] font-normal text-zinc-400 mt-0.5">{ec.employee?.employee_number}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-800 dark:text-zinc-200 font-medium">{ec.certification?.name}</td>
                    <td className="px-6 py-4 font-mono text-zinc-600 dark:text-zinc-400">{ec.certificate_number}</td>
                    <td className="px-6 py-4">
                      {ec.expired_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          {new Date(ec.expired_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-zinc-400">Lifetime</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                        ${ec.status === "Active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
                        ${ec.status === "Expired" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" : ""}
                        ${ec.status === "Pending_Renewal" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : ""}
                      `}>
                        {ec.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {ec.document_url ? (
                        <a
                          href={ec.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" /> File
                        </a>
                      ) : (
                        <span className="text-zinc-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(ec)}
                          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title="Edit Credential"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ec.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Delete Credential"
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
      </main>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedEmpCert ? "Edit Employee License" : "Log Employee License"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Employee</label>
                <select
                  required
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">Select Employee...</option>
                  {Array.isArray(employees) && employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Certification</label>
                <select
                  required
                  value={formCertId}
                  onChange={(e) => setFormCertId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">Select Certification...</option>
                  {Array.isArray(certifications) && certifications.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Certificate / License Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LIC-901-209-1A"
                  value={formCertNumber}
                  onChange={(e) => setFormCertNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiredDate}
                    onChange={(e) => setFormExpiredDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Upload Document (PDF/Image)</label>
                <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-zinc-300 dark:border-zinc-800 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-8 w-8 text-zinc-400" />
                    <div className="flex text-sm text-zinc-600 dark:text-zinc-400">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-[10px] text-zinc-400">PDF, PNG, JPG up to 10MB</p>
                    {formFile && (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                        Selected: {formFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-zinc-950 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {selectedEmpCert ? "Save Changes" : "Log License"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
