"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { 
  ClipboardList, ArrowLeft, BarChart2, MessageSquare, 
  HelpCircle, Calendar, Star, Users, CheckCircle, Activity 
} from "lucide-react";
import { useTranslations } from "next-intl";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SurveyAnalyticsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("engagement.surveys.analytics");

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ["survey-analytics", id],
    queryFn: async () => {
      const res = await api.get(`/surveys/${id}/analytics`);
      return res.data.data;
    },
    enabled: isAuthenticated && !!id,
  });

  if (!mounted || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full" />
          <p className="text-xs text-zinc-500 font-medium">Loading survey analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xs text-rose-500 font-medium">Failed to load analytics data.</p>
          <button
            onClick={() => router.push("/engagement/surveys")}
            className="px-4 py-2 text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl cursor-pointer"
          >
            Back to Surveys
          </button>
        </div>
      </div>
    );
  }

  const { survey, total_responses, analytics = [] } = analyticsData;

  // Calculate average of averages for numeric rating questions
  const ratingQuestions = analytics.filter(
    (q: any) => q.type === "scale_1_5" || q.type === "scale_1_10"
  );
  const averageEngagementScore = ratingQuestions.length > 0
    ? (ratingQuestions.reduce((acc: number, q: any) => acc + (q.average || 0), 0) / ratingQuestions.length).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={survey.title}
        subtitle={survey.description || "Survey analytics dashboard"}
        backUrl="/engagement/surveys"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        {/* Detail Meta & Summary Widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm space-y-4 md:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                survey.status === "published" 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                  : survey.status === "closed"
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
              }`}>
                {survey.status}
              </span>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                {survey.type}
              </span>
              {survey.is_anonymous && (
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  Anonymous responses
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
              {survey.title}
            </h3>

            {survey.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {survey.description}
              </p>
            )}

            <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Start: {survey.start_date ? new Date(survey.start_date).toLocaleDateString() : "-"}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                End: {survey.end_date ? new Date(survey.end_date).toLocaleDateString() : "-"}
              </span>
            </div>
          </div>

          {/* Aggregated Response Metrics Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                    {t("totalResponses")}
                  </h4>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {total_responses}
                  </p>
                </div>
              </div>

              {averageEngagementScore && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
                    <Star className="h-4 w-4 fill-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                      {t("averageScore")}
                    </h4>
                    <p className="text-md font-bold text-zinc-900 dark:text-zinc-50">
                      {averageEngagementScore} <span className="text-[10px] font-normal text-zinc-400">/ 5.00</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                Audience: {survey.target_audience || "all"}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Analytics Per Question */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            {t("distribution")}
          </h3>

          {analytics.length === 0 ? (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-12 text-center">
              <ClipboardList className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No responses recorded for this survey yet.</p>
            </div>
          ) : (
            analytics.map((questionData: any, qIdx: number) => {
              const { id: qId, question, type: qType, total_responses: qTotal, min, max, average, distribution, recent_answers } = questionData;

              return (
                <div 
                  key={qId}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed max-w-[80%]">
                      Q{qIdx + 1}: {question}
                    </h4>
                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded-full capitalize">
                      {qType.replace("_", " ")}
                    </span>
                  </div>

                  {/* Render based on Question Type */}
                  {(qType === "scale_1_5" || qType === "scale_1_10") && (
                    <div className="space-y-4">
                      {/* Metric widgets */}
                      <div className="grid grid-cols-3 gap-4 p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-900/50">
                        <div className="text-center">
                          <span className="text-[9px] text-zinc-400 block">{t("averageScore")}</span>
                          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{average || "0"}</span>
                        </div>
                        <div className="text-center border-x border-zinc-100 dark:border-zinc-900">
                          <span className="text-[9px] text-zinc-400 block">Min</span>
                          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{min || "0"}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-zinc-400 block">Max</span>
                          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{max || "0"}</span>
                        </div>
                      </div>

                      {/* Bar distribution */}
                      <div className="space-y-2.5">
                        {Object.entries(distribution || {}).map(([score, count]: [string, any]) => {
                          const percentage = qTotal > 0 ? Math.round((count / qTotal) * 100) : 0;
                          return (
                            <div key={score} className="flex items-center gap-3 text-xs">
                              <span className="w-12 text-[10px] text-zinc-500 font-medium flex items-center gap-1 justify-end">
                                {score} <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                              </span>
                              <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 dark:bg-amber-600 rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-10 text-[10px] text-zinc-400 text-right font-medium">
                                {count} ({percentage}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(qType === "single_choice" || qType === "multiple_choice") && (
                    <div className="space-y-2.5">
                      {Object.entries(distribution || {}).map(([choice, count]: [string, any]) => {
                        const percentage = qTotal > 0 ? Math.round((count / qTotal) * 100) : 0;
                        return (
                          <div key={choice} className="flex items-center gap-3 text-xs">
                            <span className="w-24 text-[10px] text-zinc-600 dark:text-zinc-400 text-right truncate font-medium" title={choice}>
                              {choice}
                            </span>
                            <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-10 text-[10px] text-zinc-400 text-right font-medium">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {qType === "text" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {t("recentAnswers")}
                      </span>
                      {recent_answers && recent_answers.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto border border-zinc-100 dark:border-zinc-900 rounded-2xl p-3 bg-zinc-50 dark:bg-zinc-900/20 divide-y divide-zinc-100 dark:divide-zinc-900/50 space-y-2.5">
                          {recent_answers.map((text: string, tIdx: number) => (
                            <div key={tIdx} className="text-xs text-zinc-700 dark:text-zinc-300 pt-2.5 first:pt-0 leading-relaxed font-medium">
                              "{text}"
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-400 italic">No feedback comments submitted yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
