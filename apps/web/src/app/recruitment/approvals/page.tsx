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
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  MessageSquare 
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";

interface HiringApproval {
  id: string;
  job_application_id: string;
  application?: {
    id: string;
    candidate?: {
      first_name: string;
      last_name?: string;
      email: string;
    };
    vacancy?: {
      title: string;
      position?: { name: string };
    };
  };
  approver_id: string;
  approver?: {
    name: string;
  };
  stage: "hr" | "manager" | "director";
  status: "pending" | "approved" | "rejected";
  comments?: string;
}

export default function HiringApprovalsQueue() {
  const t = useTranslations("recruitment.approvals");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filter State
  const [statusFilter, setStatusFilter] = useState("pending");

  // Dialog State
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<HiringApproval | null>(null);
  const [decisionType, setDecisionType] = useState<"approve" | "reject">("approve");
  const [commentsVal, setCommentsVal] = useState("");

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
  const { data: approvals, isLoading } = useQuery<HiringApproval[]>({
    queryKey: ["hiring-approvals", statusFilter],
    queryFn: () => {
      const params = statusFilter ? { status: statusFilter } : {};
      return api.get("/hiring-approvals", { params }).then((res) => res.data.data?.data || res.data.data || []);
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => 
      api.post(`/hiring-approvals/${id}/approve`, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hiring-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-stats"] });
      toast.success(t("toast.approveSuccess"));
      setIsDecisionOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.approveFailed"));
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) => 
      api.post(`/hiring-approvals/${id}/reject`, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hiring-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["approvals-stats"] });
      toast.success(t("toast.rejectSuccess"));
      setIsDecisionOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.rejectFailed"));
    }
  });

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  const handleOpenDecision = (approval: HiringApproval, type: "approve" | "reject") => {
    setSelectedApproval(approval);
    setDecisionType(type);
    setCommentsVal("");
    setIsDecisionOpen(true);
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;

    if (decisionType === "approve") {
      approveMutation.mutate({ id: selectedApproval.id, comments: commentsVal || undefined });
    } else {
      if (!commentsVal) {
        toast.error(t("toast.rejectCommentsRequired"));
        return;
      }
      rejectMutation.mutate({ id: selectedApproval.id, comments: commentsVal });
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "hr":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "manager":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
      case "director":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("pageTitle")}
        subtitle={t("subtitle")}
        backUrl="/recruitment"
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 flex gap-3">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
              statusFilter === "pending"
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            {t("pendingReviews")}
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
              statusFilter === "approved"
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            {t("approvedLog")}
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
              statusFilter === "rejected"
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            {t("rejectedLog")}
          </button>
        </div>

        {/* Data Cards */}
        {isLoading ? (
          <div className="h-64 flex flex-col justify-center items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">{t("loading")}</p>
          </div>
        ) : approvals?.length === 0 ? (
          <div className="h-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl flex flex-col justify-center items-center gap-3">
            <UserCheck className="h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">{t("noApprovals")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals?.map((appr) => (
              <div key={appr.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${getStageBadge(appr.stage)}`}>
                      {t("stageLabel", { stage: appr.stage })}
                    </span>
                    <span className="text-zinc-400 text-xs">{t("assignedTo", { name: appr.approver?.name || "HR System" })}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
                      {appr.application?.candidate?.first_name} {appr.application?.candidate?.last_name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium mt-1">
                      {t("applyingFor", { title: appr.application?.vacancy?.title || "" })}
                    </p>
                  </div>

                  {appr.comments && (
                    <div className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-2.5 border border-zinc-150 dark:border-zinc-800 max-w-lg text-xs">
                      <MessageSquare className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{t("comments")}</span>
                        <span className="text-zinc-600 dark:text-zinc-400 italic">"{appr.comments}"</span>
                      </div>
                    </div>
                  )}
                </div>

                {appr.status === "pending" ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleOpenDecision(appr, "reject")}
                      className="px-4 py-2 border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="h-4 w-4" /> {t("modalRejectTitle")}
                    </button>
                    <button
                      onClick={() => handleOpenDecision(appr, "approve")}
                      className="px-4 py-2 bg-emerald-600 text-white hover:opacity-90 text-sm font-semibold rounded-lg transition-opacity flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {t("modalApproveTitle")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wider ${
                      appr.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 border border-red-250 dark:bg-red-950/20 dark:text-red-400"
                    }`}>
                      {appr.status === "approved" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {appr.status === "approved" ? t("modalApproveTitle") : t("modalRejectTitle")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Decision Dialog Modal */}
      {isDecisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {decisionType === "approve" ? t("modalApproveTitle") : t("modalRejectTitle")}
              </h2>
              <button onClick={() => setIsDecisionOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xs">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  {t("commentsLabel")} {decisionType === "reject" ? t("commentsRequired") : t("commentsOptional")}
                </label>
                <textarea
                  required={decisionType === "reject"}
                  rows={3}
                  placeholder={decisionType === "approve" ? t("approvePlaceholder") : t("rejectPlaceholder")}
                  value={commentsVal}
                  onChange={(e) => setCommentsVal(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDecisionOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 text-white ${
                    decisionType === "approve" ? "bg-emerald-600" : "bg-red-600"
                  }`}
                >
                  {decisionType === "approve"
                    ? (approveMutation.isPending ? tCommon("loading") : t("confirmApprove"))
                    : (rejectMutation.isPending ? tCommon("loading") : t("confirmReject"))
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
