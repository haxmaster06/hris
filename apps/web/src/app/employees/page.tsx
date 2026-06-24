"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  Eye, 
  Users, 
  Briefcase, 
  UserCheck 
} from "lucide-react";
import Header from "@/components/Header";
import EmployeeFormModal, { Employee as FormEmployee } from "@/features/employees/components/employee-form-modal";

interface Employee extends FormEmployee {
  id: string;
  department?: { name: string };
  position?: { name: string };
}

export default function EmployeeDirectory() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch Employees
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Fetch Departments for Filter
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/departments").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee profile archived successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete employee");
    },
  });

  if (!mounted || !isAuthenticated) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  // Filter logic
  const filteredEmployees = Array.isArray(employeesData)
    ? employeesData.filter((emp: Employee) => {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? emp.status === statusFilter : true;
        const matchesDept = deptFilter ? emp.department?.name === deptFilter : true;
        return matchesSearch && matchesStatus && matchesDept;
      })
    : [];

  // Metrics
  const totalCount = Array.isArray(employeesData) ? employeesData.length : 0;
  const permanentCount = Array.isArray(employeesData) ? employeesData.filter((e: any) => e.status === "permanent").length : 0;
  const probationCount = Array.isArray(employeesData) ? employeesData.filter((e: any) => e.status === "probation").length : 0;
  const contractCount = Array.isArray(employeesData) ? employeesData.filter((e: any) => e.status === "contract").length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title="Employee Directory" 
        subtitle="View corporate directory, add team members, and check career logs." 
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Metric widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Staff</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalCount}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Permanent</span>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{permanentCount}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Contract</span>
              <Briefcase className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{contractCount}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Probation</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{probationCount}</p>
          </div>
        </div>

        {/* Action / Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
          <div className="flex flex-wrap flex-1 gap-3 max-w-3xl">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <option value="">All Statuses</option>
              <option value="probation">Probation</option>
              <option value="contract">Contract</option>
              <option value="permanent">Permanent</option>
            </select>
            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <option value="">All Departments</option>
              {departments?.map((d: any) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition-colors"
          >
            <Plus className="h-4 w-4" /> Onboard Employee
          </button>
        </div>

        {/* Directory List Table */}
        {isLoadingEmployees ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
            <p className="text-zinc-500 text-sm">No employees found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl bg-white dark:bg-zinc-950">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-900">
                <tr>
                  <th className="px-6 py-3">NIP / ID</th>
                  <th className="px-6 py-3">Full Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-200">
                {filteredEmployees.map((emp: Employee) => (
                  <tr
                    key={emp.id}
                    onClick={() => router.push(`/employees/${emp.id}`)}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-xs">{emp.employee_number}</td>
                    <td className="px-6 py-4 font-bold">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{emp.department?.name || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        emp.status === "permanent"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : emp.status === "contract"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          : "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/employees/${emp.id}`); }}
                          className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleEdit(emp, e)}
                          className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(emp.id, e)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
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

      {/* Onboarding / Edit Modal */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        selectedEmployee={selectedEmployee}
      />
    </div>
  );
}
