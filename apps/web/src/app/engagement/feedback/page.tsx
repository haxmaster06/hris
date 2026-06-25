"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { 
  MessageSquare, User, EyeOff, Send, Clock, 
  CheckCircle, MessageCircle, MoreHorizontal, AlertCircle 
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function SuggestionBoxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("engagement.feedback");

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  // Form states
  const [type, setType] = useState("suggestion");
  const [category, setCategory] = useState("work_environment");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Response Modal states
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState("reviewed");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ["engagement-feedbacks"],
    queryFn: async () => {
      // If employee, they can query, backend will return based on permissions or their own ID
      const res = await api.get("/feedbacks");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post("/feedbacks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["engagement-feedbacks-metrics"] });
      toast.success("Feedback submitted successfully!");
      setContent("");
      setIsAnonymous(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit feedback.");
    }
  });

  const respondFeedbackMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await api.post(`/feedbacks/${id}/respond`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["engagement-feedbacks-metrics"] });
      toast.success("Resolution submitted successfully!");
      setSelectedFeedback(null);
      setResponseText("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit resolution.");
    }
  });

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.warning("Please type your feedback content.");
      return;
    }

    submitFeedbackMutation.mutate({
      type,
      category,
      content,
      is_anonymous: isAnonymous,
      employee_id: user?.employee_id || null,
    });
  };

  const handleOpenRespondModal = (feedback: any) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.response || "");
    setResolutionStatus(feedback.status === "submitted" ? "reviewed" : feedback.status);
  };

  const handleSubmitResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) {
      toast.warning("Please write a response.");
      return;
    }
    if (!user?.employee_id) {
      toast.error("Employee profile not associated with user.");
      return;
    }

    respondFeedbackMutation.mutate({
      id: selectedFeedback.id,
      payload: {
        response: responseText,
        status: resolutionStatus,
        responded_by: user.employee_id,
      }
    });
  };

  if (!mounted || !isAuthenticated) return null;

  const feedbacks = Array.isArray(feedbackData) ? feedbackData : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        backUrl="/engagement"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Submit Form */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-zinc-400" />
                Submit Feedback
              </h3>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* Feedback Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("typeLabel")}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="suggestion">Suggestion</option>
                    <option value="complaint">Complaint</option>
                    <option value="appreciation">Appreciation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    {t("categoryLabel")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="work_environment">Work Environment</option>
                    <option value="management">Management</option>
                    <option value="policy">Policy / Rules</option>
                    <option value="compensation">Compensation & Benefits</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Feedback Details
                  </label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("contentPlaceholder")}
                    className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 leading-normal"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-900/50 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                      <EyeOff className="h-3.5 w-3.5 text-zinc-400" />
                      Anonymous
                    </span>
                    <span className="text-[9px] text-zinc-400">Hide your profile</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-0 cursor-pointer"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitFeedbackMutation.isPending}
                  className="w-full py-2.5 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {t("submitBtn")}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Feedback List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Feedbacks ({feedbacks.length})
            </h3>

            {isLoading ? (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-12 text-center">
                <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-[11px] text-zinc-400 mt-2 font-medium">Loading feedback entries...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-12 text-center">
                <MessageSquare className="h-8 w-8 text-zinc-300 dark:text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No suggestions or complaints logged yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((item: any) => (
                  <div 
                    key={item.id}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm space-y-4"
                  >
                    {/* Feedback Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
                          {item.is_anonymous ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block leading-tight">
                            {item.is_anonymous ? "Anonymous" : item.employee?.first_name ? `${item.employee.first_name} ${item.employee.last_name || ""}` : "System User"}
                          </span>
                          <span className="text-[9px] text-zinc-400">
                            {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded-full capitalize">
                          {item.type}
                        </span>
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded-full capitalize">
                          {item.category?.replace("_", " ")}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          item.status === "resolved"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                            : item.status === "in_progress"
                            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                            : item.status === "reviewed"
                            ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                        }`}>
                          {item.status || "Submitted"}
                        </span>
                      </div>
                    </div>

                    {/* Feedback Content */}
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {item.content}
                    </p>

                    {/* Feedback Response */}
                    {item.response ? (
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900/50 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50">HR Resolution</span>
                          {item.responded_at && (
                            <span className="text-[8px] text-zinc-400">
                              - {new Date(item.responded_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {item.response}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Awaiting HR review
                      </div>
                    )}

                    {/* Action Panel for Admin/HR */}
                    {isAdmin && (
                      <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-900/50">
                        <button
                          onClick={() => handleOpenRespondModal(item)}
                          className="px-3.5 py-1.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          {item.response ? "Update Resolution" : "Respond Feedback"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Resolution Dialog Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-enter">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {t("respondModal.title")}
                </h2>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="h-7 w-7 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitResolution} className="p-6 space-y-4">
              {/* Feedback Summary */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-900/30 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
                  Original Feedback
                </span>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal italic">
                  "{selectedFeedback.content}"
                </p>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("respondModal.statusLabel")}
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                >
                  <option value="reviewed">Reviewed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Response Text */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("respondModal.responseText")}
                </label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter resolution notes, actions, or comments..."
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 leading-normal"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={respondFeedbackMutation.isPending}
                  className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("respondModal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
