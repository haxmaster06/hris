"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  ArrowLeft, Clock, MapPin, Calendar, UserCheck, Loader2, 
  CheckCircle, XCircle, HelpCircle, FileText, AlertCircle, 
  CalendarDays, Plus, ClipboardList, CheckSquare, Settings,
  AlertTriangle, ShieldAlert, Award
} from "lucide-react";
import Header from "@/components/Header";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("attendance");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [activeTab, setActiveTab] = useState("core");

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  // Leave Form State
  const [leaveFormData, setLeaveFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Correction Form State
  const [corrDate, setCorrDate] = useState("");
  const [corrOrigIn, setCorrOrigIn] = useState("");
  const [corrOrigOut, setCorrOrigOut] = useState("");
  const [corrNewIn, setCorrNewIn] = useState("");
  const [corrNewOut, setCorrNewOut] = useState("");
  const [corrReason, setCorrReason] = useState("");
  const [isSubmittingCorr, setIsSubmittingCorr] = useState(false);

  // Overtime Form State
  const [otDate, setOtDate] = useState("");
  const [otPlannedHours, setOtPlannedHours] = useState("");
  const [otReason, setOtReason] = useState("");
  const [isSubmittingOt, setIsSubmittingOt] = useState(false);

  // Holiday Form State
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayType, setHolidayType] = useState("public");
  const [isRecurring, setIsRecurring] = useState(false);
  const [holidayDesc, setHolidayDesc] = useState("");
  const [isSubmittingHoliday, setIsSubmittingHoliday] = useState(false);

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

  // Fetch Corrections
  const { data: correctionsData, isLoading: isLoadingCorrections } = useQuery({
    queryKey: ["attendance-corrections-list"],
    queryFn: () => api.get("/attendance-corrections").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Fetch Overtimes
  const { data: overtimesData, isLoading: isLoadingOvertimes } = useQuery({
    queryKey: ["overtime-requests-list"],
    queryFn: () => api.get("/overtime-requests").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Fetch Holidays
  const { data: holidaysData, isLoading: isLoadingHolidays } = useQuery({
    queryKey: ["holidays-list"],
    queryFn: () => api.get("/holidays").then((res) => res.data.data || []),
    enabled: isAuthenticated,
  });

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (data: { employee_id: string; check_in_time: string; latitude?: number; longitude?: number; check_in_address?: string }) =>
      api.post("/attendances/check-in", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success(t("toast.checkInSuccess") || "Checked in successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.checkInFailed") || "Check-in failed.");
    },
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: (data: { employee_id: string; check_out_time: string; latitude?: number; longitude?: number; check_out_address?: string }) =>
      api.post("/attendances/check-out", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success(t("toast.checkOutSuccess") || "Checked out successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.checkOutFailed") || "Check-out failed.");
    },
  });

  // Leave Submit Mutation
  const submitLeaveMutation = useMutation({
    mutationFn: (data: any) => api.post("/leave-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances", selectedEmpId] });
      toast.success(t("toast.submitSuccess"));
      setLeaveFormData({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
      setIsSubmittingLeave(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.submitFailed"));
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
      toast.success(t("toast.approveSuccess"));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t("toast.approveFailed")),
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
      toast.success(t("toast.rejectSuccess"));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t("toast.rejectFailed")),
  });

  // Submit Correction Mutation
  const submitCorrectionMutation = useMutation({
    mutationFn: (data: any) => api.post("/attendance-corrections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections-list"] });
      toast.success("Attendance correction request submitted successfully!");
      setCorrDate("");
      setCorrOrigIn("");
      setCorrOrigOut("");
      setCorrNewIn("");
      setCorrNewOut("");
      setCorrReason("");
      setIsSubmittingCorr(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit correction request.");
      setIsSubmittingCorr(false);
    }
  });

  // Process Correction Mutation
  const processCorrectionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      api.post(`/attendance-corrections/${id}/approve`, {
        status,
        approved_by: user?.employee_id || selectedEmpId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-corrections-list"] });
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Correction processed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to process correction.");
    }
  });

  // Submit Overtime Mutation
  const submitOvertimeMutation = useMutation({
    mutationFn: (data: any) => api.post("/overtime-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-requests-list"] });
      toast.success("Overtime request submitted successfully!");
      setOtDate("");
      setOtPlannedHours("");
      setOtReason("");
      setIsSubmittingOt(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit overtime request.");
      setIsSubmittingOt(false);
    }
  });

  // Process Overtime Mutation
  const processOvertimeMutation = useMutation({
    mutationFn: ({ id, status, actual_hours }: { id: string; status: "approved" | "rejected"; actual_hours?: number }) =>
      api.post(`/overtime-requests/${id}/approve`, {
        status,
        approved_by: user?.employee_id || selectedEmpId,
        actual_hours,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime-requests-list"] });
      toast.success("Overtime request processed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to process overtime.");
    }
  });

  // Submit Holiday Mutation
  const createHolidayMutation = useMutation({
    mutationFn: (data: any) => api.post("/holidays", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays-list"] });
      toast.success("Holiday registered successfully!");
      setHolidayName("");
      setHolidayDate("");
      setHolidayDesc("");
      setIsRecurring(false);
      setIsSubmittingHoliday(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to register holiday.");
      setIsSubmittingHoliday(false);
    }
  });

  const handleCheckIn = () => {
    if (!selectedEmpId) return toast.error(t("toast.selectEmployeeError"));
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    // Simulate GPS Tracking log fields
    checkInMutation.mutate({
      employee_id: selectedEmpId,
      check_in_time: timeStr,
      latitude: -6.9175,
      longitude: 107.6191,
      check_in_address: "Bandung HQ Office Building",
    });
  };

  const handleCheckOut = () => {
    if (!selectedEmpId) return toast.error(t("toast.selectEmployeeError"));
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    checkOutMutation.mutate({
      employee_id: selectedEmpId,
      check_out_time: timeStr,
      latitude: -6.9175,
      longitude: 107.6191,
      check_out_address: "Bandung HQ Office Building",
    });
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return toast.error(t("toast.selectEmployeeError"));
    setIsSubmittingLeave(true);
    submitLeaveMutation.mutate({
      employee_id: selectedEmpId,
      ...leaveFormData,
    });
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return toast.error("Please select an employee context.");
    if (!corrDate) return toast.warning("Correction target date is required.");
    if (!corrReason.trim()) return toast.warning("Reason for correction is required.");

    setIsSubmittingCorr(true);
    submitCorrectionMutation.mutate({
      employee_id: selectedEmpId,
      original_check_in: corrOrigIn ? `${corrDate} ${corrOrigIn}:00` : null,
      original_check_out: corrOrigOut ? `${corrDate} ${corrOrigOut}:00` : null,
      corrected_check_in: corrNewIn ? `${corrDate} ${corrNewIn}:00` : null,
      corrected_check_out: corrNewOut ? `${corrDate} ${corrNewOut}:00` : null,
      reason: corrReason,
    });
  };

  const handleOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return toast.error("Please select an employee context.");
    if (!otDate) return toast.warning("Overtime date is required.");
    if (!otPlannedHours) return toast.warning("Planned hours are required.");

    setIsSubmittingOt(true);
    submitOvertimeMutation.mutate({
      employee_id: selectedEmpId,
      date: otDate,
      planned_hours: parseFloat(otPlannedHours),
      reason: otReason,
    });
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) return toast.warning("Name and date are required.");

    setIsSubmittingHoliday(true);
    createHolidayMutation.mutate({
      name: holidayName,
      date: holidayDate,
      type: holidayType,
      is_recurring: isRecurring,
      description: holidayDesc,
    });
  };

  const corrections = Array.isArray(correctionsData) ? correctionsData : [];
  const overtimes = Array.isArray(overtimesData) ? overtimesData : [];
  const holidays = Array.isArray(holidaysData) ? holidaysData : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title={t("pageTitle") || "Attendance & Leave"} 
        subtitle={t("subtitle") || "Manage attendance check-in/out, logs, overtimes and leave balances"} 
        backUrl="/dashboard"
      />

      {/* Tabs Header */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-6">
          <button
            onClick={() => setActiveTab("core")}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === "core" 
                ? "text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50" 
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            Absensi & Cuti
          </button>
          <button
            onClick={() => setActiveTab("corrections")}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === "corrections" 
                ? "text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50" 
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            Koreksi Absen
          </button>
          <button
            onClick={() => setActiveTab("overtime")}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === "overtime" 
                ? "text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50" 
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            Lembur (Overtime)
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === "holidays" 
                ? "text-zinc-950 dark:text-zinc-50 border-b-2 border-zinc-950 dark:border-zinc-50" 
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            Hari Libur & Kalender Tim
          </button>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Sidebar Context Column (Always Visible) */}
        <div className="md:col-span-1 space-y-6">
          {/* Employee Selector Context Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm space-y-2">
            <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
              {t("activeEmployeeContext") || "Active Employee Context"}
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-bold focus:outline-none"
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
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t("currentTime") || "Current Time"}</span>
              <p className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {time || "00:00:00"}
              </p>
            </div>

            <div className="p-4 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span>{t("todayShift", { start: "08:00", end: "17:00" }) || "Today Shift: 08:00 - 17:00"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <span>{t("officeLocation", { location: "Bandung HQ" }) || "Location: Bandung HQ (Audit Active)"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCheckIn}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                {t("checkIn") || "Check In"}
              </button>
              <button
                onClick={handleCheckOut}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors active:scale-[0.98] cursor-pointer"
              >
                {t("checkOut") || "Check Out"}
              </button>
            </div>
          </div>

          {/* Leave Balances Progress Cards */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t("remainingLeaveBalances") || "Leave Balances"}</h3>
            {isLoadingBalances ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : !leaveBalances || leaveBalances.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">{t("noLeaveBalances") || "No leave balances configured"}</p>
            ) : (
              <div className="space-y-4">
                {leaveBalances.map((bal) => (
                  <div key={bal.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{bal.leave_type?.name}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-50">
                        {bal.remaining} / {bal.entitled} days
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

        {/* Right Tab Content Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TAB 1: CORE ATTENDANCE & LEAVE */}
          {activeTab === "core" && (
            <div className="space-y-6">
              {/* Submit Leave Card */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {t("submitLeaveRequest") || "Submit Leave Request"}
                </h3>

                <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">{t("leaveType")}</label>
                    <select
                      value={leaveFormData.leave_type_id}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, leave_type_id: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none"
                    >
                      <option value="" disabled>{t("selectLeaveType") || "-- Select Leave Type --"}</option>
                      {leaveTypes?.map((type) => (
                        <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">{t("startDate")}</label>
                    <input
                      type="date"
                      required
                      value={leaveFormData.start_date}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, start_date: e.target.value })}
                      className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">{t("endDate")}</label>
                    <input
                      type="date"
                      required
                      value={leaveFormData.end_date}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, end_date: e.target.value })}
                      className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">{t("reason")}</label>
                    <textarea
                      value={leaveFormData.reason}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                      placeholder={t("reasonPlaceholder")}
                      rows={3}
                      className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs focus:outline-none leading-normal"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingLeave}
                      className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {isSubmittingLeave && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t("submitRequest") || "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Leave Approvals Queue (Admin only) */}
              {isAdmin && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {t("pendingLeaveApprovals") || "Pending Leave Approvals"}
                  </h3>

                  {isLoadingLeaves ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                  ) : !leaveRequests || leaveRequests.filter(r => r.status === "pending").length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">{t("noPendingRequests") || "No pending approval requests."}</p>
                  ) : (
                    <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-900 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                          <tr>
                            <th className="px-4 py-2.5">{t("employee")}</th>
                            <th className="px-4 py-2.5">{t("leaveType")}</th>
                            <th className="px-4 py-2.5">{t("dates")}</th>
                            <th className="px-4 py-2.5 text-right">{tCommon("actions")}</th>
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
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => approveLeaveMutation.mutate(req.id)}
                                      className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 cursor-pointer"
                                      title={t("approve")}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => rejectLeaveMutation.mutate(req.id)}
                                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 cursor-pointer"
                                      title={t("reject")}
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">{t("leaveHistory") || "Leave History"}</h3>
                {isLoadingLeaves ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                ) : !leaveRequests || leaveRequests.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">{t("noLeaveHistory") || "No leave logs."}</p>
                ) : (
                  <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                        <tr>
                          <th className="px-4 py-2.5">{t("leaveType")}</th>
                          <th className="px-4 py-2.5">{t("dates")}</th>
                          <th className="px-4 py-2.5 text-right">{t("status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                        {leaveRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="px-4 py-3 font-semibold">{req.leave_type?.name || "-"}</td>
                            <td className="px-4 py-3 text-zinc-500">
                              {req.start_date} &mdash; {req.end_date}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
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
          )}

          {/* TAB 2: CORRECTIONS */}
          {activeTab === "corrections" && (
            <div className="space-y-6">
              {/* Submit Correction Form */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-zinc-400" />
                  Request Attendance Correction (Lupa Absen)
                </h3>

                <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Target Date</label>
                      <input
                        type="date"
                        required
                        value={corrDate}
                        onChange={(e) => setCorrDate(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Orig Check-In Time</label>
                      <input
                        type="time"
                        value={corrOrigIn}
                        onChange={(e) => setCorrOrigIn(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Corrected Check-In Time</label>
                      <input
                        type="time"
                        value={corrNewIn}
                        onChange={(e) => setCorrNewIn(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Orig Check-Out Time</label>
                      <input
                        type="time"
                        value={corrOrigOut}
                        onChange={(e) => setCorrOrigOut(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[9px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Corrected Check-Out Time</label>
                      <input
                        type="time"
                        value={corrNewOut}
                        onChange={(e) => setCorrNewOut(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Reason for correction</label>
                    <textarea
                      rows={3}
                      required
                      value={corrReason}
                      onChange={(e) => setCorrReason(e.target.value)}
                      placeholder="Explain why checking-in/out log was missed (e.g. Client visit, forgot tag)..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs leading-normal focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingCorr}
                      className="py-2.5 px-6 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {isSubmittingCorr && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      Submit Correction Request
                    </button>
                  </div>
                </form>
              </div>

              {/* Admin Correction Queue */}
              {isAdmin && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Pending Correction Approvals
                  </h3>

                  {isLoadingCorrections ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                  ) : corrections.filter((c: any) => c.status === "pending").length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No pending correction requests.</p>
                  ) : (
                    <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-900 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                          <tr>
                            <th className="px-4 py-2.5">Staff</th>
                            <th className="px-4 py-2.5">Details</th>
                            <th className="px-4 py-2.5">Reason</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                          {corrections
                            .filter((c: any) => c.status === "pending")
                            .map((c: any) => (
                              <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                <td className="px-4 py-3 font-semibold">
                                  {c.employee?.first_name} {c.employee?.last_name}
                                </td>
                                <td className="px-4 py-3 text-[10px]">
                                  {c.corrected_check_in && (
                                    <div className="text-emerald-600">In: {new Date(c.corrected_check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                  )}
                                  {c.corrected_check_out && (
                                    <div className="text-indigo-600">Out: {new Date(c.corrected_check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-zinc-500 max-w-[120px] truncate" title={c.reason}>
                                  {c.reason}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => processCorrectionMutation.mutate({ id: c.id, status: "approved" })}
                                      className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 cursor-pointer hover:opacity-80"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => processCorrectionMutation.mutate({ id: c.id, status: "rejected" })}
                                      className="p-1 rounded bg-red-50 dark:bg-red-950/20 text-red-600 cursor-pointer hover:opacity-80"
                                      title="Reject"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
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

              {/* Correction Logs History */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Corrections History Log</h3>
                {isLoadingCorrections ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                ) : corrections.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No corrections submitted.</p>
                ) : (
                  <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Requested In/Out</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                        {corrections.map((c: any) => {
                          const dateObj = new Date(c.corrected_check_in || c.corrected_check_out || c.created_at);
                          return (
                            <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                              <td className="px-4 py-3 font-semibold">{dateObj.toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-zinc-500 text-[10px]">
                                {c.corrected_check_in && `In: ${new Date(c.corrected_check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} `}
                                {c.corrected_check_out && `Out: ${new Date(c.corrected_check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  c.status === "approved"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : c.status === "rejected"
                                    ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OVERTIME */}
          {activeTab === "overtime" && (
            <div className="space-y-6">
              {/* Submit Overtime Form */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  Request Overtime Approval (Lembur)
                </h3>

                <form onSubmit={handleOvertimeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Overtime Date</label>
                      <input
                        type="date"
                        required
                        value={otDate}
                        onChange={(e) => setOtDate(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Planned Overtime Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="12"
                        required
                        placeholder="e.g. 2.5"
                        value={otPlannedHours}
                        onChange={(e) => setOtPlannedHours(e.target.value)}
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Reason / Task Details</label>
                    <textarea
                      rows={3}
                      required
                      value={otReason}
                      onChange={(e) => setOtReason(e.target.value)}
                      placeholder="Explain the activities planned during overtime..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs leading-normal focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingOt}
                      className="py-2.5 px-6 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {isSubmittingOt && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      Submit Overtime Request
                    </button>
                  </div>
                </form>
              </div>

              {/* Admin Overtime Queue */}
              {isAdmin && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Pending Overtime Approvals
                  </h3>

                  {isLoadingOvertimes ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                    </div>
                  ) : overtimes.filter((o: any) => o.status === "pending").length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No pending overtime requests.</p>
                  ) : (
                    <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-900 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                          <tr>
                            <th className="px-4 py-2.5">Staff</th>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Hours</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                          {overtimes
                            .filter((o: any) => o.status === "pending")
                            .map((o: any) => (
                              <tr key={o.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                <td className="px-4 py-3 font-semibold">
                                  {o.employee?.first_name} {o.employee?.last_name}
                                </td>
                                <td className="px-4 py-3 text-zinc-500">
                                  {new Date(o.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-bold text-zinc-950 dark:text-zinc-50">
                                  {o.planned_hours} hrs
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => processOvertimeMutation.mutate({ id: o.id, status: "approved" })}
                                      className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 cursor-pointer hover:opacity-80"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => processOvertimeMutation.mutate({ id: o.id, status: "rejected" })}
                                      className="p-1 rounded bg-red-50 dark:bg-red-950/20 text-red-600 cursor-pointer hover:opacity-80"
                                      title="Reject"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
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

              {/* Overtime Logs History */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Overtime History Logs</h3>
                {isLoadingOvertimes ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                ) : overtimes.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No overtime logs.</p>
                ) : (
                  <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Planned Hours</th>
                          <th className="px-4 py-2.5">Actual Hours</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                        {overtimes.map((o: any) => (
                          <tr key={o.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="px-4 py-3 font-semibold">{new Date(o.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-zinc-500">{o.planned_hours} hrs</td>
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-bold">{o.actual_hours || o.planned_hours} hrs</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                o.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : o.status === "rejected"
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                              }`}>
                                {o.status}
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
          )}

          {/* TAB 4: HOLIDAYS & TEAM CALENDAR */}
          {activeTab === "holidays" && (
            <div className="space-y-6">
              
              {/* Register Holiday Form (Admin only) */}
              {isAdmin && (
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-zinc-400" />
                    Register New Holiday / Off-Day
                  </h3>

                  <form onSubmit={handleHolidaySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Holiday Name</label>
                        <input
                          type="text"
                          required
                          value={holidayName}
                          onChange={(e) => setHolidayName(e.target.value)}
                          placeholder="e.g. Idul Fitri 1447H"
                          className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={holidayDate}
                          onChange={(e) => setHolidayDate(e.target.value)}
                          className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Holiday Type</label>
                        <select
                          value={holidayType}
                          onChange={(e) => setHolidayType(e.target.value)}
                          className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs"
                        >
                          <option value="public">Public / National Holiday</option>
                          <option value="company">Corporate / Joint Leave</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900"
                        />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">Recurring Annual Holiday</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={holidayDesc}
                        onChange={(e) => setHolidayDesc(e.target.value)}
                        placeholder="Description / notes..."
                        className="w-full px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs leading-normal"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingHoliday}
                        className="py-2.5 px-6 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 disabled:opacity-50 shadow-md cursor-pointer"
                      >
                        {isSubmittingHoliday && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                        Save Holiday
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Holidays list */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Corporate & Public Holidays</h3>
                {isLoadingHolidays ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                ) : holidays.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No holidays configured.</p>
                ) : (
                  <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-900">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Holiday Name</th>
                          <th className="px-4 py-2.5 text-right">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                        {holidays.map((hol: any) => (
                          <tr key={hol.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                            <td className="px-4 py-3 font-semibold">{new Date(hol.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">
                              {hol.name}
                              {hol.description && <span className="block text-[10px] text-zinc-400 font-normal">{hol.description}</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                hol.type === "company"
                                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
                                  : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                              }`}>
                                {hol.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Team Active Off-duty Leave Roster Calendar (Simulated) */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Team Active Leave Roster</h3>
                {isLoadingLeaves ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                ) : !leaveRequests || leaveRequests.filter(r => r.status === "approved").length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No approved leave requests active.</p>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests
                      .filter(r => r.status === "approved")
                      .map((req) => (
                        <div 
                          key={req.id} 
                          className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900/50 rounded-xl flex justify-between items-center text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold">
                              {req.employee?.first_name ? req.employee.first_name[0] : "S"}
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-50">
                                {req.employee?.first_name} {req.employee?.last_name}
                              </span>
                              <span className="block text-[10px] text-zinc-400 capitalize">
                                {req.leave_type?.name}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-semibold">
                            {req.start_date} to {req.end_date}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
