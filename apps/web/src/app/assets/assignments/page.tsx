"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { 
  ClipboardList, Plus, Search, Filter, RefreshCw, 
  CheckCircle, ArrowLeftRight, Calendar, User, FileText, X 
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function AssetAssignmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("assets.assignments");

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  // Filters & Search states
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals visibility states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Assign Form Fields
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [conditionOnAssign, setConditionOnAssign] = useState("good");
  const [assignNotes, setAssignNotes] = useState("");
  const [bastDocumentPath, setBastDocumentPath] = useState("");
  const [assignedBy, setAssignedBy] = useState("");

  // Return Form Fields
  const [returnedDate, setReturnedDate] = useState("");
  const [conditionOnReturn, setConditionOnReturn] = useState("good");
  const [returnNotes, setReturnNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Set default dates & assigner/receiver
  useEffect(() => {
    if (user?.employee_id) {
      setAssignedBy(user.employee_id);
      setReceivedBy(user.employee_id);
    }
    const today = new Date().toISOString().split("T")[0];
    setAssignedDate(today);
    setReturnedDate(today);
  }, [user]);

  // Fetch Assignments list
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["assets-assignments-list", statusFilter, employeeFilter, page],
    queryFn: async () => {
      let url = `/asset-assignments?page=${page}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (employeeFilter) url += `&employee_id=${employeeFilter}`;
      const res = await api.get(url);
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  // Fetch all employees for selectors
  const { data: employeesData = [] } = useQuery({
    queryKey: ["employees-list-assignments"],
    queryFn: async () => {
      const res = await api.get("/employees?per_page=100");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch available assets for assignment dropdown
  const { data: availableAssets = [] } = useQuery({
    queryKey: ["available-assets"],
    queryFn: async () => {
      const res = await api.get("/assets?status=available&per_page=100");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && showAssignModal,
  });

  const assignAssetMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post("/asset-assignments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-assignments-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-dashboard-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-dashboard-assignments"] });
      toast.success("Asset assigned successfully!");
      setShowAssignModal(false);
      resetAssignForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to assign asset.");
    }
  });

  const returnAssetMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await api.post(`/asset-assignments/${id}/return`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-assignments-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-dashboard-list"] });
      queryClient.invalidateQueries({ queryKey: ["assets-dashboard-assignments"] });
      toast.success("Asset return registered successfully!");
      setShowReturnModal(false);
      setSelectedAssignment(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to register asset return.");
    }
  });

  const resetAssignForm = () => {
    setAssetId("");
    setEmployeeId("");
    const today = new Date().toISOString().split("T")[0];
    setAssignedDate(today);
    setExpectedReturnDate("");
    setConditionOnAssign("good");
    setAssignNotes("");
    setBastDocumentPath("");
  };

  const handleOpenAssignModal = () => {
    resetAssignForm();
    setShowAssignModal(true);
  };

  const handleOpenReturnModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    const today = new Date().toISOString().split("T")[0];
    setReturnedDate(today);
    setConditionOnReturn(assignment.asset?.condition || "good");
    setReturnNotes("");
    setShowReturnModal(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      toast.warning("Please select an asset.");
      return;
    }
    if (!employeeId) {
      toast.warning("Please select an employee.");
      return;
    }
    if (!assignedDate) {
      toast.warning("Handover date is required.");
      return;
    }
    if (!assignedBy) {
      toast.error("Assigner employee profile not found.");
      return;
    }

    assignAssetMutation.mutate({
      asset_id: assetId,
      employee_id: employeeId,
      assigned_date: assignedDate,
      expected_return_date: expectedReturnDate || null,
      condition_on_assign: conditionOnAssign,
      assign_notes: assignNotes || null,
      bast_document_path: bastDocumentPath || null,
      assigned_by: assignedBy,
    });
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnedDate) {
      toast.warning("Return date is required.");
      return;
    }
    if (!receivedBy) {
      toast.error("Receiver employee profile not found.");
      return;
    }

    returnAssetMutation.mutate({
      id: selectedAssignment.id,
      payload: {
        returned_date: returnedDate,
        condition_on_return: conditionOnReturn,
        return_notes: returnNotes || null,
        received_by: receivedBy,
      }
    });
  };

  if (!mounted || !isAuthenticated) return null;

  const assignments = assignmentsData?.data || [];
  const meta = assignmentsData?.meta || { last_page: 1, current_page: 1 };
  const employees = Array.isArray(employeesData) ? employeesData : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("title")}
        subtitle="Log serah terima dan pengembalian aset karyawan"
        backUrl="/assets"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Actions panel */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Handover & Checkout Logs ({assignments.length})
          </h3>

          {isAdmin && (
            <button
              onClick={handleOpenAssignModal}
              className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
            >
              <Plus className="h-4 w-4" />
              {t("assignBtn")}
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
            >
              <option value="">All Assignments</option>
              <option value="active">Active (Checked Out)</option>
              <option value="returned">Returned (Checked In)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Filter by Employee</span>
            <select
              value={employeeFilter}
              onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
            >
              <option value="">All Employees</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name || ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-medium select-none">
                  <th className="p-4">Asset Tag / Name</th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Assigned Date</th>
                  <th className="p-4">Expected Return</th>
                  <th className="p-4">Return Date</th>
                  <th className="p-4">BAST Doc</th>
                  <th className="p-4">Status</th>
                  {isAdmin && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-zinc-500 italic">
                      No handover logs recorded. Click "Tugaskan Aset" to create a checkout.
                    </td>
                  </tr>
                ) : (
                  assignments.map((assign: any) => (
                    <tr key={assign.id} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20">
                      <td className="p-4">
                        <span className="font-bold text-zinc-950 dark:text-zinc-50 block leading-tight">
                          {assign.asset?.asset_number}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {assign.asset?.name}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                          {assign.employee ? `${assign.employee.first_name} ${assign.employee.last_name || ""}` : "Staff Profile"}
                        </span>
                        {assign.employee?.position && (
                          <span className="text-[9px] text-zinc-400">
                            {assign.employee.position.name}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {new Date(assign.assigned_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {assign.expected_return_date 
                          ? new Date(assign.expected_return_date).toLocaleDateString() 
                          : "-"
                        }
                      </td>
                      <td className="p-4">
                        {assign.returned_date 
                          ? new Date(assign.returned_date).toLocaleDateString() 
                          : "-"
                        }
                      </td>
                      <td className="p-4">
                        {assign.bast_document_path ? (
                          <a 
                            href={assign.bast_document_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View
                          </a>
                        ) : (
                          <span className="text-zinc-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          assign.status === "returned"
                            ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                            : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {assign.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="p-4 text-right">
                          {assign.status === "active" && (
                            <button
                              onClick={() => handleOpenReturnModal(assign)}
                              className="px-3 py-1.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg cursor-pointer transition-colors"
                            >
                              Register Return
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="text-zinc-500 font-medium">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </main>

      {/* Assign Asset Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-enter my-8">
            
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {t("modal.title")}
                </h2>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Asset Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.asset")} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">-- Select Available Asset --</option>
                  {availableAssets.map((asset: any) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_number} - {asset.name} ({asset.brand || ""})
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.employee")} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ""} ({emp.position?.name || "No Position"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Handover & Expected Return Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.date")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.expectedReturn")}
                  </label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Condition & BAST document */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("modal.condition")}
                  </label>
                  <select
                    value={conditionOnAssign}
                    onChange={(e) => setConditionOnAssign(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    BAST Document URL
                  </label>
                  <input
                    type="text"
                    value={bastDocumentPath}
                    onChange={(e) => setBastDocumentPath(e.target.value)}
                    placeholder="e.g. /storage/bast/AST-9821.pdf"
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assign Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.notes")}
                </label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Handovers remarks..."
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-50 focus:outline-none leading-normal"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-900/50">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignAssetMutation.isPending}
                  className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("modal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {showReturnModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-enter my-8">
            
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {t("returnModal.title")}
                </h2>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              
              {/* Asset Summary */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-900/30 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                  Asset Details
                </span>
                <p className="text-xs text-zinc-900 dark:text-zinc-100 font-bold">
                  {selectedAssignment.asset?.asset_number} - {selectedAssignment.asset?.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Assigned to: {selectedAssignment.employee ? `${selectedAssignment.employee.first_name} ${selectedAssignment.employee.last_name || ""}` : "Staff"} 
                  on {new Date(selectedAssignment.assigned_date).toLocaleDateString()}
                </p>
              </div>

              {/* Return Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("returnModal.date")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={returnedDate}
                  onChange={(e) => setReturnedDate(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              {/* Condition on Return */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("returnModal.condition")}
                </label>
                <select
                  value={conditionOnReturn}
                  onChange={(e) => setConditionOnReturn(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              {/* Return Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("returnModal.notes")}
                </label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Check-in remarks..."
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-50 focus:outline-none leading-normal"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-900/50">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnAssetMutation.isPending}
                  className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("returnModal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
