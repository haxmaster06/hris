"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  HelpCircle 
} from "lucide-react";
import Header from "@/components/Header";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
}

interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: { name: string; code: string };
  entitled: number;
  used: number;
  remaining: number;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  employee?: { first_name: string; last_name: string };
  leave_type_id: string;
  leave_type?: { name: string; code: string };
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
}

export default function AttendanceLeavePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState("");

  // Leave Form State
  const [leaveFormData, setLeaveFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Digital clock update
  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router, mounted]);

  // Fetch Employees for selector
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Set default employee ID once loaded
  useEffect(() => {
    if (employees && employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  // Fetch Leave Types
  const { data: leaveTypes } = useQuery<LeaveType[]>({
    queryKey: ["leave-types"],
    queryFn: () => api.get("/leave-types").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Fetch Leave Balances for selected employee
  const { data: leaveBalances, isLoading: isLoadingBalances } = useQuery<LeaveBalance[]>({
    queryKey: ["leave-balances", selectedEmpId],
    queryFn: () => api.get(`/leave-balances?employee_id=${selectedEmpId}`).then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && !!selectedEmpId,
  });

  // Fetch Leave Requests (For Admin Review list)
  const { data: leaveRequests, isLoading: isLoadingLeaves } = useQuery<LeaveRequest[]>({
    queryKey: ["leave-requests"],
    queryFn: () => api.get("/leave-requests?include=employee,leaveType").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (data: { employee_id: string; check_in_time: string }) =>
      api.post("/attendances/check-in", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Checked in successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Check-in failed");
    },
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: (data: { employee_id: string; check_out_time: string }) =>
      api.post("/attendances/check-out", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Checked out successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Check-out failed");
    },
  });

  // Leave Submit Mutation
  const submitLeaveMutation = useMutation({
    mutationFn: (data: any) => api.post("/leave-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances", selectedEmpId] });
      toast.success("Leave request submitted successfully!");
      setLeaveFormData({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
      setIsSubmittingLeave(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit leave request");
      setIsSubmittingLeave(false);
    },
  });

  // Approve Leave Mutation
  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/leave-requests/${id}/approve`, {
        approver_id: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances", selectedEmpId] });
      toast.success("Leave request approved.");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Approve failed"),
  });

  // Reject Leave Mutation
  const rejectLeaveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/leave-requests/${id}/reject`, {
        approver_id: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances", selectedEmpId] });
      toast.success("Leave request rejected.");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Reject failed"),
  });

  if (!mounted || !isAuthenticated) return null;

  const handleCheckIn = () => {
    if (!selectedEmpId) return toast.error("Please select an employee first");
    const now = new Date();
    // format to HH:MM:SS
    const timeStr = now.toTimeString().split(" ")[0];
    checkInMutation.mutate({
      employee_id: selectedEmpId,
      check_in_time: timeStr,
    });
  };

  const handleCheckOut = () => {
    if (!selectedEmpId) return toast.error("Please select an employee first");
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    checkOutMutation.mutate({
      employee_id: selectedEmpId,
      check_out_time: timeStr,
    });
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return toast.error("Please select an employee first");
    setIsSubmittingLeave(true);
    submitLeaveMutation.mutate({
      employee_id: selectedEmpId,
      ...leaveFormData,
    });
  };

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title="Attendance & Leave" 
        subtitle="Log work hours, track remaining leave, and request day offs." 
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sisi Kiri: Check-In/Check-Out Panel */}
        <div className="md:col-span-1 space-y-6">
          {/* Employee Selector Context Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm space-y-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Active Employee Context:
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold focus:outline-none"
            >
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_number})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm text-center space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Current Time</span>
              <p className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {time || "00:00:00"}
              </p>
            </div>

            <div className="p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span>Today's Shift: 08:00 &mdash; 17:00</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>Office: Bandung HQ (Geofenced)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCheckIn}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-md transition-all active:scale-[0.98]"
              >
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors active:scale-[0.98]"
              >
                Check Out
              </button>
            </div>
          </div>

          {/* Leave Balances Progress Cards */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Remaining Leave Balances</h3>
            {isLoadingBalances ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : !leaveBalances || leaveBalances.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No leave balances allocated for this employee.</p>
            ) : (
              <div className="space-y-4">
                {leaveBalances.map((bal) => (
                  <div key={bal.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{bal.leave_type?.name}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-50">
                        {bal.remaining} / {bal.entitled} Days
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-950 dark:bg-zinc-50 rounded-full transition-all duration-500"
                        style={{ width: `${(bal.remaining / (bal.entitled || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Leave Submission Form & Approval Queue */}
        <div className="md:col-span-2 space-y-6">
          {/* Submit Leave Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-md font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-zinc-500" />
              Submit Leave Request
            </h3>

            <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Leave Type</label>
                <select
                  value={leaveFormData.leave_type_id}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, leave_type_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                >
                  <option value="" disabled>Select Leave Type</option>
                  {leaveTypes?.map((type) => (
                    <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveFormData.start_date}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveFormData.end_date}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Reason</label>
                <textarea
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  placeholder="Reason for requesting time off..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="inline-flex items-center gap-2 py-2.5 px-6 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 shadow-md"
                >
                  {isSubmittingLeave && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>

          {/* Admin Approval Queue (Visually premium review list) */}
          {isAdmin && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-md font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-zinc-500" />
                Pending Leave Approvals (Manager View)
              </h3>

              {isLoadingLeaves ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : !leaveRequests || leaveRequests.filter(r => r.status === "pending").length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No pending leave requests found.</p>
              ) : (
                <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                      <tr>
                        <th className="px-4 py-2.5">Employee</th>
                        <th className="px-4 py-2.5">Leave Type</th>
                        <th className="px-4 py-2.5">Dates</th>
                        <th className="px-4 py-2.5">Reason</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                      {leaveRequests
                        .filter((r) => r.status === "pending")
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="px-4 py-3 font-semibold">
                              {req.employee?.first_name} {req.employee?.last_name}
                            </td>
                            <td className="px-4 py-3 font-medium">{req.leave_type?.name}</td>
                            <td className="px-4 py-3 text-zinc-500">
                              {req.start_date} &mdash; {req.end_date}
                            </td>
                            <td className="px-4 py-3 text-zinc-500 max-w-[150px] truncate" title={req.reason}>
                              {req.reason || "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => approveLeaveMutation.mutate(req.id)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => rejectLeaveMutation.mutate(req.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
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

          {/* Leave History List */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Leave Request History</h3>
            {isLoadingLeaves ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : !leaveRequests || leaveRequests.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No leave history recorded.</p>
            ) : (
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                    <tr>
                      <th className="px-4 py-2.5">Leave Type</th>
                      <th className="px-4 py-2.5">Dates</th>
                      <th className="px-4 py-2.5">Reason</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                    {leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                        <td className="px-4 py-3 font-semibold">{req.leave_type?.name || "-"}</td>
                        <td className="px-4 py-3 text-zinc-500">
                          {req.start_date} &mdash; {req.end_date}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 max-w-[150px] truncate" title={req.reason}>
                          {req.reason || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                            req.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : req.status === "rejected"
                              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
