"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Clipboard, 
  Award,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  User,
  Plus,
  ArrowRightLeft
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";

interface JobApplication {
  id: string;
  vacancy_id: string;
  vacancy?: {
    id: string;
    title: string;
    position?: { name: string };
  };
  candidate_id: string;
  candidate?: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
  };
  status: "applied" | "screening" | "interview" | "assessment" | "offering" | "hiring" | "hired" | "rejected";
  applied_date: string;
}

export default function RecruitmentPipeline() {
  const t = useTranslations("recruitment.pipeline");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filter State
  const [selectedVacancyFilter, setSelectedVacancyFilter] = useState("");

  // Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);

  // Active Application Selection
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  // Form State - Apply Candidate
  const [applyCandidateId, setApplyCandidateId] = useState("");
  const [applyVacancyId, setApplyVacancyId] = useState("");

  // Form State - Schedule Interview
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  // Form State - Submit Scoring
  const [evaluatorId, setEvaluatorId] = useState("");
  const [criteriaRatings, setCriteriaRatings] = useState({
    technical: 3,
    communication: 3,
    attitude: 3,
  });
  const [overallScore, setOverallScore] = useState(3);
  const [recommendation, setRecommendation] = useState("hire");
  const [scoreNotes, setScoreNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch Data
  const { data: applications, isLoading: isLoadingApps } = useQuery<JobApplication[]>({
    queryKey: ["applications", selectedVacancyFilter],
    queryFn: () => {
      const params = selectedVacancyFilter ? { vacancy_id: selectedVacancyFilter } : {};
      return api.get("/applications", { params }).then((res) => res.data.data?.data || res.data.data || []);
    },
    enabled: isAuthenticated && isAdmin,
  });

  const { data: vacancies } = useQuery({
    queryKey: ["vacancies"],
    queryFn: () => api.get("/vacancies").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => api.get("/candidates").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get("/employees").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.post(`/applications/${id}/move-stage`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-stats"] });
      toast.success(t("toast.moveSuccess", { stage: t(`stage${variables.status.charAt(0).toUpperCase() + variables.status.slice(1)}`) || variables.status }));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.moveFailed"));
    }
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => api.post("/applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(t("toast.applySuccess"));
      setIsApplyOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.applyFailed"));
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: any) => api.post("/interviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(t("toast.scheduleSuccess"));
      setIsScheduleOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.scheduleFailed"));
    }
  });

  const scoreMutation = useMutation({
    mutationFn: ({ interviewId, data }: { interviewId: string; data: any }) => 
      api.post(`/interviews/${interviewId}/evaluation`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success(t("toast.scoreSuccess") || "Evaluation submitted successfully");
      setIsScoreOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.scoreFailed") || "Failed to submit evaluation");
    }
  });

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  const pipelineStages = [
    { key: "applied", label: t("stageApplied") || "Applied", color: "bg-blue-500" },
    { key: "screening", label: t("stageScreening") || "Screening", color: "bg-indigo-500" },
    { key: "interview", label: t("stageInterview") || "Interview", color: "bg-purple-500" },
    { key: "assessment", label: t("stageAssessment") || "Assessment", color: "bg-fuchsia-500" },
    { key: "offering", label: t("stageOffering") || "Offering", color: "bg-pink-500" },
    { key: "hiring", label: t("stageHiring") || "Hiring Approval", color: "bg-amber-500" },
    { key: "hired", label: t("stageHired") || "Hired", color: "bg-emerald-500" },
    { key: "rejected", label: t("stageRejected") || "Rejected", color: "bg-red-500" }
  ];

  const handleMoveStage = (id: string, currentStatus: string, direction: "left" | "right" | "reject") => {
    const currentIndex = pipelineStages.findIndex((s) => s.key === currentStatus);
    let nextIndex = currentIndex;

    if (direction === "left" && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    } else if (direction === "right" && currentIndex < pipelineStages.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === "reject") {
      nextIndex = pipelineStages.findIndex((s) => s.key === "rejected");
    }

    const nextStatus = pipelineStages[nextIndex].key;
    
    // Custom triggers based on status
    if (nextStatus === "interview" && direction === "right") {
      setActiveAppId(id);
      setInterviewDate("");
      setInterviewerId("");
      setInterviewNotes("");
      setIsScheduleOpen(true);
    }

    moveMutation.mutate({ id, status: nextStatus });
  };

  const handleOpenScore = (application: JobApplication) => {
    // Find scheduled interview
    const scheduledInterview = (application as any).interviews?.find((i: any) => i.status === "scheduled");
    if (scheduledInterview) {
      setActiveAppId(scheduledInterview.id); // set active interview ID
      setEvaluatorId("");
      setCriteriaRatings({
        technical: 3,
        communication: 3,
        attitude: 3,
      });
      setOverallScore(3);
      setRecommendation("hire");
      setScoreNotes("");
      setIsScoreOpen(true);
    } else {
      toast.error(t("toast.noInterviewFound"));
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate({
      candidate_id: applyCandidateId,
      vacancy_id: applyVacancyId,
      status: "applied",
    });
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAppId) {
      scheduleMutation.mutate({
        job_application_id: activeAppId,
        interview_date: interviewDate.replace("T", " ") + ":00", // convert datetime-local input to MySQL format
        interviewer_id: interviewerId,
        notes: interviewNotes,
        status: "scheduled",
      });
    }
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeAppId) {
      scoreMutation.mutate({
        interviewId: activeAppId,
        data: {
          evaluator_id: evaluatorId,
          criteria: criteriaRatings,
          overall_score: overallScore,
          recommendation: recommendation,
          comments: scoreNotes,
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("pageTitle")}
        subtitle={t("subtitle")}
        backUrl="/recruitment"
      />

      <div className="max-w-[95vw] mx-auto px-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-xl">
        <div className="flex flex-1 w-full max-w-xs">
          <select
            value={selectedVacancyFilter}
            onChange={(e) => setSelectedVacancyFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">{t("filterVacancy")}</option>
            {Array.isArray(vacancies) && vacancies.map((v: any) => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setApplyCandidateId("");
            setApplyVacancyId("");
            setIsApplyOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" /> {t("applyCandidate")}
        </button>
      </div>

      {/* Kanban Board Container */}
      <main className="max-w-[95vw] mx-auto px-6 mt-6 overflow-x-auto">
        {isLoadingApps ? (
          <div className="h-64 flex flex-col justify-center items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">{t("loading")}</p>
          </div>
        ) : (
          <div className="flex gap-4 min-w-[1200px] h-[70vh]">
            {pipelineStages.map((stage) => {
              const stageApps = Array.isArray(applications)
                ? applications.filter((app) => app.status === stage.key)
                : [];

              return (
                <div key={stage.key} className="flex-1 min-w-[280px] bg-zinc-100/70 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-900/50 rounded-2xl p-4 flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-900">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50 capitalize">{stage.label}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                      {stageApps.length}
                    </span>
                  </div>

                  {/* Column Body / Cards */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {stageApps.map((app) => {
                      const hasScheduledInterview = (app as any).interviews?.some((i: any) => i.status === "scheduled");
                      const completedInterview = (app as any).interviews?.find((i: any) => i.status === "completed");

                      return (
                        <div key={app.id} className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1 mb-1">
                              <Briefcase className="h-3 w-3 text-zinc-400" />
                              {app.vacancy?.title || "Unknown Vacancy"}
                            </span>
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                              {app.candidate?.first_name} {app.candidate?.last_name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 mt-1">{tCommon("apply")} ({t("stageApplied")}): {app.applied_date}</p>
                          </div>

                          {/* Interview Scheduling/Score Subsystem */}
                          {app.status === "interview" && (
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-2 border border-zinc-150 dark:border-zinc-800 text-[11px] space-y-2">
                              {hasScheduledInterview ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-semibold">
                                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                    {t("scheduledInterview")}
                                  </div>
                                  <button
                                    onClick={() => handleOpenScore(app)}
                                    className="w-full flex items-center justify-center gap-1 py-1 rounded bg-primary text-white font-bold hover:bg-primary/95 transition-colors"
                                  >
                                    <Clipboard className="h-3 w-3" /> {t("evaluateBtn")}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleMoveStage(app.id, app.status, "right")} // triggers interview scheduler directly
                                  className="w-full py-1 text-center font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                >
                                  {t("scheduleInterviewBtn")}
                                </button>
                              )}
                            </div>
                          )}

                          {completedInterview && (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <Award className="h-3.5 w-3.5" />
                              {t("scoreLabel", { score: completedInterview.score })}
                            </div>
                          )}

                          {/* Navigation Buttons (No Drag-and-drop fallback) */}
                          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-900">
                            {app.status !== "rejected" && app.status !== "hired" ? (
                              <button
                                onClick={() => handleMoveStage(app.id, app.status, "reject")}
                                className="text-[10px] font-bold text-red-650 dark:text-red-400 hover:underline"
                              >
                                {t("rejectBtn")}
                              </button>
                            ) : <div />}

                            <div className="flex gap-1.5">
                              {app.status !== "applied" && (
                                <button
                                  onClick={() => handleMoveStage(app.id, app.status, "left")}
                                  className="h-6 w-6 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {app.status !== "hired" && app.status !== "rejected" && (
                                <button
                                  onClick={() => handleMoveStage(app.id, app.status, "right")}
                                  className="h-6 w-6 flex items-center justify-center rounded bg-primary text-white hover:bg-primary/95 transition-colors"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Apply Candidate Modal */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{t("modalApplyTitle")}</h2>
              <button onClick={() => setIsApplyOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xs">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t("selectCandidate")}</label>
                <select
                  required
                  value={applyCandidateId}
                  onChange={(e) => setApplyCandidateId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">{t("selectCandidate")}</option>
                  {Array.isArray(candidates) && candidates.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t("selectVacancy")}</label>
                <select
                  required
                  value={applyVacancyId}
                  onChange={(e) => setApplyVacancyId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">{t("selectVacancy")}</option>
                  {Array.isArray(vacancies) && vacancies.filter((v: any) => v.status === "published").map((v: any) => (
                    <option key={v.id} value={v.id}>{v.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplyOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-50 transition-colors"
                >
                  {applyMutation.isPending ? tCommon("loading") : t("applyCandidate")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{t("modalScheduleTitle")}</h2>
              <button onClick={() => setIsScheduleOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xs">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t("interviewDateTime")}</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t("assignInterviewer")}</label>
                <select
                  required
                  value={interviewerId}
                  onChange={(e) => setInterviewerId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">{t("chooseInterviewer")}</option>
                  {Array.isArray(users) && users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t("preMeetingNotes")}</label>
                <textarea
                  rows={2}
                  placeholder={t("preMeetingPlaceholder")}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-205 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={scheduleMutation.isPending}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-50 transition-colors"
                >
                  {scheduleMutation.isPending ? tCommon("loading") : t("scheduleInterviewBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Evaluation Score Modal */}
      {isScoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{t("modalScoreTitle")}</h2>
              <button onClick={() => setIsScoreOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xs">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleScoreSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Evaluator
                </label>
                <select
                  required
                  value={evaluatorId}
                  onChange={(e) => setEvaluatorId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">Select Evaluator</option>
                  {Array.isArray(employees) && employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Criteria Ratings */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Criteria Ratings (1-5)
                </label>
                
                <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900">
                  {Object.keys(criteriaRatings).map((key) => {
                    const criteriaKey = key as keyof typeof criteriaRatings;
                    return (
                      <div key={key} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                          {key}
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCriteriaRatings(prev => ({ ...prev, [criteriaKey]: star }))}
                              className={`p-1 text-sm transition-all ${
                                criteriaRatings[criteriaKey] >= star
                                  ? "text-amber-500 hover:text-amber-600"
                                  : "text-zinc-300 dark:text-zinc-700 hover:text-zinc-400"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Overall Score (1-5)
                </label>
                <div className="flex justify-between items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-900">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setOverallScore(score)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all border ${
                        overallScore === score
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Recommendation
                </label>
                <select
                  required
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="hire">Hire</option>
                  <option value="reject">Reject</option>
                  <option value="next_round">Next Round</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Comments / Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed evaluation feedback..."
                  value={scoreNotes}
                  onChange={(e) => setScoreNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScoreOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={scoreMutation.isPending}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-50 transition-colors"
                >
                  {scoreMutation.isPending ? tCommon("loading") : t("evaluateBtn") || "Submit Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
