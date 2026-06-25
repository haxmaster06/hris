"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { 
  ClipboardList, Plus, Trash2, CheckCircle2, AlertCircle, X, 
  HelpCircle, Eye, BarChart2, CheckSquare, AlignLeft, Sliders 
} from "lucide-react";
import { useTranslations } from "next-intl";

interface QuestionInput {
  question: string;
  type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
}

export default function SurveysPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("engagement.surveys");
  const tCommon = useTranslations("common");

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  // State variables
  const [showBuilder, setShowBuilder] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("satisfaction");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [targetAudience, setTargetAudience] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Question temp builder states
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("scale_1_5");
  const [qRequired, setQRequired] = useState(true);
  const [qOptionsText, setQOptionsText] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: surveys = [] } = useQuery({
    queryKey: ["engagement-surveys"],
    queryFn: async () => {
      const res = await api.get("/surveys");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const createSurveyMutation = useMutation({
    mutationFn: async (surveyData: any) => {
      return await api.post("/surveys", surveyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-surveys"] });
      setSuccessMsg("Survey published successfully!");
      setShowBuilder(false);
      resetBuilder();
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to create survey");
    }
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-surveys"] });
    }
  });

  const resetBuilder = () => {
    setTitle("");
    setDescription("");
    setType("satisfaction");
    setIsAnonymous(false);
    setTargetAudience("all");
    setStartDate("");
    setEndDate("");
    setQuestions([]);
    setErrorMsg("");
  };

  const handleAddQuestion = () => {
    if (!qText.trim()) return;
    
    let optionsArray: string[] = [];
    if (qType === "single_choice" || qType === "multiple_choice") {
      optionsArray = qOptionsText
        .split(",")
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
      if (optionsArray.length === 0) {
        optionsArray = ["Agree", "Neutral", "Disagree"];
      }
    }

    const newQ: QuestionInput = {
      question: qText,
      type: qType,
      options: optionsArray,
      is_required: qRequired,
      sort_order: questions.length + 1
    };

    setQuestions([...questions, newQ]);
    setQText("");
    setQType("scale_1_5");
    setQRequired(true);
    setQOptionsText("");
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handlePublishSurvey = () => {
    if (!title.trim()) {
      setErrorMsg("Survey title is required.");
      return;
    }
    if (questions.length === 0) {
      setErrorMsg("Please add at least one question.");
      return;
    }

    createSurveyMutation.mutate({
      title,
      description,
      type,
      is_anonymous: isAnonymous,
      target_audience: targetAudience,
      start_date: startDate || null,
      end_date: endDate || null,
      status: "published",
      questions
    });
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        backUrl="/engagement"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Survey List Section */}
        {!showBuilder ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Active Survey Campaigns</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowBuilder(true)}
                  className="px-4 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t("createBtn")}</span>
                </button>
              )}
            </div>

            {surveys.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl">
                <ClipboardList className="h-8 w-8 text-zinc-300 dark:text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-medium">No surveys found. Add a campaign to begin gathering employee pulse.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-900 text-[10px] uppercase font-bold text-zinc-400">
                      <th className="py-3 px-2">{t("table.title")}</th>
                      <th className="py-3 px-2">{t("table.type")}</th>
                      <th className="py-3 px-2">{t("table.status")}</th>
                      <th className="py-3 px-2">{t("table.dates")}</th>
                      <th className="py-3 px-2">{t("table.anonymous")}</th>
                      <th className="py-3 px-2 text-right">{t("table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-xs">
                    {surveys.map((survey: any) => (
                      <tr key={survey.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-4 px-2 font-bold text-zinc-900 dark:text-zinc-50">
                          {survey.title}
                        </td>
                        <td className="py-4 px-2 capitalize font-medium text-zinc-500">
                          {survey.type}
                        </td>
                        <td className="py-4 px-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            survey.status === "published" 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900"
                          }`}>
                            {survey.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-zinc-500 font-medium">
                          {survey.start_date || "-"} to {survey.end_date || "-"}
                        </td>
                        <td className="py-4 px-2 text-zinc-500 font-medium">
                          {survey.is_anonymous ? "Yes (Anon)" : "No"}
                        </td>
                        <td className="py-4 px-2 text-right space-x-1.5">
                          <button
                            onClick={() => router.push(`/engagement/surveys/${survey.id}/respond`)}
                            className="p-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                            title="Respond Survey"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Fill</span>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => router.push(`/engagement/surveys/${survey.id}`)}
                                className="p-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                                title="View Analytics"
                              >
                                <BarChart2 className="h-3.5 w-3.5" />
                                <span>Stats</span>
                              </button>
                              <button
                                onClick={() => deleteSurveyMutation.mutate(survey.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Survey Builder Panel */
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t("builder.title")}</h2>
              <button
                onClick={() => setShowBuilder(false)}
                className="p-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* General Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold uppercase text-zinc-400">{t("builder.titleLabel")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Employee Engagement Pulse Survey Q2"
                  className="px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/60 rounded-xl outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
                />
              </div>

              <div className="flex flex-col space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold uppercase text-zinc-400">{t("builder.descLabel")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description explaining the purpose of this survey..."
                  rows={2}
                  className="px-3.5 py-2 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/60 rounded-xl outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-zinc-400">{t("builder.typeLabel")}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/60 rounded-xl outline-none focus:border-zinc-900"
                >
                  <option value="satisfaction">Satisfaction Survey</option>
                  <option value="pulse">Pulse Survey</option>
                  <option value="engagement">Engagement Audit</option>
                  <option value="custom">Custom Survey</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-zinc-400">{t("builder.audienceLabel")}</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/60 rounded-xl outline-none focus:border-zinc-900"
                >
                  <option value="all">All Active Staff</option>
                  <option value="department">By Department</option>
                  <option value="position">By Position</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-zinc-400">{t("builder.startDateLabel")}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/60 rounded-xl outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-zinc-400">{t("builder.endDateLabel")}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/60 rounded-xl outline-none focus:border-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2 pt-2 select-none">
                <input
                  type="checkbox"
                  id="anon_chk"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-zinc-300 focus:ring-0"
                />
                <label htmlFor="anon_chk" className="text-xs font-bold text-zinc-700 dark:text-zinc-400 cursor-pointer">
                  {t("builder.isAnonymousLabel")}
                </label>
              </div>
            </div>

            {/* Added Questions List */}
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Survey Questions List ({questions.length})</h3>
              
              {questions.length === 0 ? (
                <p className="text-[11px] text-zinc-400 italic">No questions added yet. Construct your question forms below.</p>
              ) : (
                <div className="space-y-2.5">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-50">
                          {idx + 1}. {q.question} {q.is_required && <span className="text-rose-500">*</span>}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1 capitalize">
                          Type: {q.type.replace("_", " ")} {q.options.length > 0 && `(${q.options.join(", ")})`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Question Builder Interface */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Add New Question</h4>
              
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400">{t("builder.questionText")}</label>
                <input
                  type="text"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. Rate your alignment with company core values"
                  className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/50 rounded-lg outline-none focus:border-zinc-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400">{t("builder.questionType")}</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/50 rounded-lg outline-none"
                  >
                    <option value="scale_1_5">Likert Scale (1 - 5)</option>
                    <option value="scale_1_10">Likert Scale (1 - 10)</option>
                    <option value="single_choice">Single Choice Radio</option>
                    <option value="multiple_choice">Multiple Choice Checkboxes</option>
                    <option value="text">Paragraph / Open Feedback</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 pt-4 select-none">
                  <input
                    type="checkbox"
                    id="q_req"
                    checked={qRequired}
                    onChange={(e) => setQRequired(e.target.checked)}
                    className="rounded border-zinc-300 focus:ring-0"
                  />
                  <label htmlFor="q_req" className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    This question is required to answer
                  </label>
                </div>

                {(qType === "single_choice" || qType === "multiple_choice") && (
                  <div className="flex flex-col space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400">Options (Comma separated)</label>
                    <input
                      type="text"
                      value={qOptionsText}
                      onChange={(e) => setQOptionsText(e.target.value)}
                      placeholder="e.g. Excellent, Good, Fair, Poor"
                      className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/50 rounded-lg outline-none"
                    />
                    <span className="text-[10px] text-zinc-400">Separate choice values with commas.</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-1.5 text-xs font-bold bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-300 rounded-xl cursor-pointer"
              >
                {t("builder.addQuestion")}
              </button>
            </div>

            {/* Publish Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <button
                onClick={() => { setShowBuilder(false); resetBuilder(); }}
                className="px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl cursor-pointer"
              >
                {t("builder.cancel")}
              </button>
              <button
                onClick={handlePublishSurvey}
                className="px-4 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl cursor-pointer shadow-sm"
              >
                {t("builder.saveSurvey")}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
