"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { CheckCircle2, AlertCircle, HelpCircle, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SurveyRespondPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("engagement.surveys.respond");

  // State to hold answers
  const [answers, setAnswers] = useState<Record<string, { answer_text: string; answer_choices: string[] }>>({});
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: survey, isLoading } = useQuery({
    queryKey: ["survey-detail", id],
    queryFn: async () => {
      const res = await api.get(`/surveys/${id}`);
      return res.data.data;
    },
    enabled: isAuthenticated && !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async (submitData: any) => {
      return await api.post(`/surveys/${id}/respond`, submitData);
    },
    onSuccess: () => {
      setSuccess(true);
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || "Failed to submit survey answers.");
    }
  });

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers({
      ...answers,
      [questionId]: {
        answer_text: value,
        answer_choices: answers[questionId]?.answer_choices || [],
      }
    });
  };

  const handleChoiceSelect = (questionId: string, choice: string) => {
    setAnswers({
      ...answers,
      [questionId]: {
        answer_text: choice,
        answer_choices: [],
      }
    });
  };

  const handleMultiChoiceToggle = (questionId: string, choice: string) => {
    const currentChoices = answers[questionId]?.answer_choices || [];
    let updatedChoices: string[];

    if (currentChoices.includes(choice)) {
      updatedChoices = currentChoices.filter(c => c !== choice);
    } else {
      updatedChoices = [...currentChoices, choice];
    }

    setAnswers({
      ...answers,
      [questionId]: {
        answer_text: "",
        answer_choices: updatedChoices,
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Check required questions
    for (const q of survey.questions || []) {
      if (q.is_required) {
        const ans = answers[q.id];
        const hasText = ans?.answer_text && ans.answer_text.trim().length > 0;
        const hasChoices = ans?.answer_choices && ans.answer_choices.length > 0;
        
        if (!hasText && !hasChoices) {
          setErrorMsg(`Please answer the required question: "${q.question}"`);
          return;
        }
      }
    }

    const payloadAnswers = Object.entries(answers).map(([questionId, ansVal]) => ({
      question_id: questionId,
      answer_text: ansVal.answer_text || null,
      answer_choices: ansVal.answer_choices.length > 0 ? ansVal.answer_choices : null,
    }));

    submitMutation.mutate({
      employee_id: user?.employee_id || null,
      answers: payloadAnswers
    });
  };

  if (!mounted || !isAuthenticated) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-xs text-zinc-500 font-medium">Loading survey details...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <p className="text-xs text-rose-500 font-medium">Survey not found or inactive.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={survey.title}
        subtitle={survey.description || "Please take a moment to answer this survey."}
        backUrl="/engagement/surveys"
      />

      <main className="max-w-xl mx-auto px-6 mt-8">
        {success ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 shadow-sm text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-md font-bold text-zinc-900 dark:text-zinc-50">Thank You!</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("success")}
            </p>
            <button
              onClick={() => router.push("/engagement/surveys")}
              className="mt-4 px-4 py-2 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl cursor-pointer"
            >
              Back to Surveys
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {survey.is_anonymous && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-400">
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <span className="font-bold">Anonymous Survey</span>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">{t("anonymousWarning")}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-400 animate-shake">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {(survey.questions || []).map((question: any, idx: number) => (
                <div 
                  key={question.id}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block leading-normal">
                    {idx + 1}. {question.question} {question.is_required && <span className="text-rose-500">*</span>}
                  </label>

                  {/* Input Rendering depending on Question Type */}
                  {question.type === "text" && (
                    <textarea
                      rows={3}
                      placeholder="Type your response here..."
                      value={answers[question.id]?.answer_text || ""}
                      onChange={(e) => handleTextChange(question.id, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 dark:border-zinc-950 dark:bg-zinc-900/50 rounded-xl outline-none focus:border-zinc-900 dark:focus:border-zinc-200 transition-colors resize-none"
                    />
                  )}

                  {(question.type === "scale_1_5" || question.type === "scale_1_10") && (
                    <div className="flex flex-wrap gap-2 pt-1 select-none">
                      {Array.from({ length: question.type === "scale_1_5" ? 5 : 10 }, (_, i) => i + 1).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleChoiceSelect(question.id, val.toString())}
                          className={`h-9 w-9 text-xs font-bold rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            answers[question.id]?.answer_text === val.toString()
                              ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white"
                              : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.type === "single_choice" && (
                    <div className="flex flex-col gap-2 pt-1">
                      {(question.options || []).map((opt: string) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChoiceSelect(question.id, opt)}
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs text-left font-bold transition-all cursor-pointer ${
                            answers[question.id]?.answer_text === opt
                              ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950"
                              : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.type === "multiple_choice" && (
                    <div className="flex flex-col gap-2 pt-1">
                      {(question.options || []).map((opt: string) => {
                        const isChecked = (answers[question.id]?.answer_choices || []).includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleMultiChoiceToggle(question.id, opt)}
                            className={`w-full px-4 py-2.5 rounded-xl border text-xs text-left font-bold transition-all cursor-pointer ${
                              isChecked
                                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950"
                                : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 select-none">
              <button
                type="button"
                onClick={() => router.push("/engagement/surveys")}
                className="px-4 py-2.5 text-xs font-bold hover:bg-zinc-150 border border-zinc-200 dark:border-zinc-900 rounded-xl flex items-center gap-1 cursor-pointer bg-white dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitMutation.isPending ? "Submitting..." : t("submit")}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
