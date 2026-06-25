"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck
} from "lucide-react";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";

interface Participant {
  id: string;
  training_session_id: string;
  employee_id: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  attendance_status: "Pending" | "Attended" | "Absent";
  result_status: "Pending" | "Pass" | "Fail";
  score?: number;
  pre_score?: number;
  post_score?: number;
  certificate_issued?: boolean;
  remarks?: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  position?: { name: string };
}

export default function SessionParticipantsRoster() {
  const t = useTranslations("training.participants");
  const tStatus = useTranslations("training.status");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Form states
  const [formEmployeeId, setFormEmployeeId] = useState("");
  
  // Grade Form states
  const [formAttendance, setFormAttendance] = useState<"Pending" | "Attended" | "Absent">("Attended");
  const [formResult, setFormResult] = useState<"Pending" | "Pass" | "Fail">("Pass");
  const [formScore, setFormScore] = useState<string>("");
  const [formPreScore, setFormPreScore] = useState<string>("");
  const [formPostScore, setFormPostScore] = useState<string>("");
  const [formCertIssued, setFormCertIssued] = useState<boolean>(false);
  const [formRemarks, setFormRemarks] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch session details
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session-detail", sessionId],
    queryFn: () => api.get(`/training-sessions/${sessionId}`).then((res) => res.data.data),
    enabled: isAuthenticated && !!sessionId && isAdmin,
  });

  // Fetch session participants
  const { data: participants, isLoading: isParticipantsLoading } = useQuery<Participant[]>({
    queryKey: ["session-participants", sessionId],
    queryFn: () => api.get("/training-participants", {
      params: { training_session_id: sessionId }
    }).then((res) => {
      const allParts = res.data.data?.data || res.data.data || [];
      return allParts.filter((p: any) => p.training_session_id === sessionId);
    }),
    enabled: isAuthenticated && !!sessionId && isAdmin,
  });

  // Fetch all employees to enroll
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const enrollMutation = useMutation({
    mutationFn: (data: any) => api.post("/training-participants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-participants", sessionId] });
      toast.success(t("toast.enrollSuccess"));
      setIsAddOpen(false);
      setFormEmployeeId("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.enrollFailed"));
    }
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/training-participants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-participants", sessionId] });
      toast.success(t("toast.gradeSuccess"));
      setIsGradeOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.gradeFailed"));
    }
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/training-participants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-participants", sessionId] });
      toast.success(t("toast.removeSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.removeFailed"));
    }
  });

  const handleOpenAdd = () => {
    setFormEmployeeId("");
    setIsAddOpen(true);
  };

  const handleOpenGrade = (participant: Participant) => {
    setSelectedParticipant(participant);
    setFormAttendance(participant.attendance_status);
    setFormResult(participant.result_status);
    setFormScore(participant.score !== undefined && participant.score !== null ? String(participant.score) : "");
    setFormPreScore(participant.pre_score !== undefined && participant.pre_score !== null ? String(participant.pre_score) : "");
    setFormPostScore(participant.post_score !== undefined && participant.post_score !== null ? String(participant.post_score) : "");
    setFormCertIssued(!!participant.certificate_issued);
    setFormRemarks(participant.remarks || "");
    setIsGradeOpen(true);
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId) return;
    enrollMutation.mutate({
      training_session_id: sessionId,
      employee_id: formEmployeeId,
      attendance_status: "Pending",
      result_status: "Pending"
    });
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    gradeMutation.mutate({
      id: selectedParticipant.id,
      data: {
        training_session_id: sessionId,
        employee_id: selectedParticipant.employee_id,
        attendance_status: formAttendance,
        result_status: formResult,
        score: formScore === "" ? null : Number(formScore),
        pre_score: formPreScore === "" ? null : Number(formPreScore),
        post_score: formPostScore === "" ? null : Number(formPostScore),
        certificate_issued: formCertIssued,
        remarks: formRemarks
      }
    });
  };

  const handleRemove = (id: string) => {
    if (confirm(t("toast.confirmRemove"))) {
      removeMutation.mutate(id);
    }
  };

  const getStatusLabel = (status: string) => {
    return tStatus(status.toLowerCase() as any);
  };

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  // Filter out employees already enrolled in this session
  const enrolledEmployeeIds = Array.isArray(participants) ? participants.map((p) => p.employee_id) : [];
  const nonEnrolledEmployees = Array.isArray(employees) 
    ? employees.filter((emp) => !enrolledEmployeeIds.includes(emp.id))
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("pageTitle")}
        subtitle={t("subtitle")}
        backUrl="/training/sessions"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Session Details Info Box */}
        {isSessionLoading ? (
          <div className="flex justify-center items-center py-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : session ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                  {session.training?.code || "COURSE"}
                </span>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {session.training?.name}
                </h2>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(session.start_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {tStatus("ongoing") /* Trainer is text, using generic ongoing prefix is not needed, we can write manually: */}
                    Trainer: <strong>{session.trainer}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Venue: <strong>{session.venue}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                  ${session.status === "Completed" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" : ""}
                  ${session.status === "Scheduled" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" : ""}
                  ${session.status === "Ongoing" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
                  ${session.status === "Cancelled" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" : ""}
                `}>
                  {getStatusLabel(session.status)}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Action bar for table */}
        <div className="flex justify-end bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> {t("enrollEmployee")}
          </button>
        </div>

        {/* Participants Table */}
        {isParticipantsLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : !participants || participants.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm">
            <Users className="h-12 w-12 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-md font-bold text-zinc-700 dark:text-zinc-300">{t("rosterEmpty")}</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">{t("rosterEmptyDesc")}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.employee")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.employeeId")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.attendance")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pre / Post Test</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.result")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Certificate</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t("table.remarks")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {p.employee?.first_name} {p.employee?.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{p.employee?.employee_number}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                        ${p.attendance_status === "Attended" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
                        ${p.attendance_status === "Absent" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" : ""}
                        ${p.attendance_status === "Pending" ? "bg-zinc-100 text-zinc-855 dark:bg-zinc-900 dark:text-zinc-400" : ""}
                      `}>
                        {getStatusLabel(p.attendance_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      Pre: {p.pre_score !== undefined && p.pre_score !== null ? p.pre_score : "-"} <br/>
                      Post: {p.post_score !== undefined && p.post_score !== null ? p.post_score : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {p.result_status !== "Pending" ? (
                        <span className={`flex items-center gap-1 text-xs font-semibold
                          ${p.result_status === "Pass" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
                        `}>
                          {p.result_status === "Pass" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {getStatusLabel(p.result_status)} ({p.score !== undefined && p.score !== null ? p.score : "-"})
                        </span>
                      ) : (
                        <span className="text-zinc-400">{getStatusLabel("Pending")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.certificate_issued 
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400"
                          : "bg-zinc-100 text-zinc-500"
                      }`}>
                        {p.certificate_issued ? "Issued" : "Not Issued"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">{p.remarks || "-"}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenGrade(p)}
                          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          title={t("modalGrade.title")}
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(p.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          title={tCommon("delete")}
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

      {/* Enroll Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Users className="h-5 w-5" /> {t("modalEnroll.title")}
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modalEnroll.selectEmployee")}</label>
                <select
                  required
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">{t("modalEnroll.chooseEmployee")}</option>
                  {nonEnrolledEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_number}) {emp.position?.name ? `- ${emp.position.name}` : ""}
                    </option>
                  ))}
                </select>
                {nonEnrolledEmployees.length === 0 && (
                  <p className="text-[11px] text-zinc-400 mt-1.5">{t("modalEnroll.allEnrolled")}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={enrollMutation.isPending || nonEnrolledEmployees.length === 0}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/95 transition-colors"
                >
                  {enrollMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("modalEnroll.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Participant Modal */}
      {isGradeOpen && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> {t("modalGrade.title")}
              </h2>
              <button onClick={() => setIsGradeOpen(false)} className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-sm font-semibold">
                {tCommon("cancel")}
              </button>
            </div>

            <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{t("modalGrade.evaluating")}</p>
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                {selectedParticipant.employee?.first_name} {selectedParticipant.employee?.last_name} ({selectedParticipant.employee?.employee_number})
              </h3>
            </div>

            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modalGrade.attendance")}</label>
                  <select
                    value={formAttendance}
                    onChange={(e) => setFormAttendance(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="Pending">{getStatusLabel("Pending")}</option>
                    <option value="Attended">{getStatusLabel("Attended")}</option>
                    <option value="Absent">{getStatusLabel("Absent")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modalGrade.result")}</label>
                  <select
                    value={formResult}
                    onChange={(e) => setFormResult(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="Pending">{t("modalGrade.pendingEvaluation")}</option>
                    <option value="Pass">{t("modalGrade.pass")}</option>
                    <option value="Fail">{t("modalGrade.fail")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Pre-Test Score</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="Pre Score"
                    value={formPreScore}
                    onChange={(e) => setFormPreScore(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Post-Test Score</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="Post Score"
                    value={formPostScore}
                    onChange={(e) => setFormPostScore(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modalGrade.score")}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder={t("modalGrade.scorePlaceholder")}
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={formCertIssued}
                    onChange={(e) => setFormCertIssued(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 cursor-pointer animate-enter"
                  />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Certificate Issued</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modalGrade.remarks")}</label>
                <textarea
                  placeholder={t("modalGrade.remarksPlaceholder")}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={gradeMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/95 transition-colors"
                >
                  {gradeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("modalGrade.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
