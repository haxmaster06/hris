"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  Calendar,
  Users,
  MapPin,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";

interface TrainingSession {
  id: string;
  training_id: string;
  training?: { name: string; code: string };
  trainer: string;
  venue: string;
  start_date: string;
  end_date: string;
  status: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";
}

export default function TrainingSessionManagement() {
  const t = useTranslations("training.sessions");
  const tStatus = useTranslations("training.status");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

  // Form states
  const [formTrainingId, setFormTrainingId] = useState("");
  const [formTrainer, setFormTrainer] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStatus, setFormStatus] = useState<"Scheduled" | "Ongoing" | "Completed" | "Cancelled">("Scheduled");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch sessions
  const { data: sessions, isLoading } = useQuery<TrainingSession[]>({
    queryKey: ["training-sessions"],
    queryFn: () => api.get("/training-sessions").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch master trainings for selection
  const { data: trainings } = useQuery({
    queryKey: ["trainings"],
    queryFn: () => api.get("/trainings").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/training-sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success(t("toast.createSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.createFailed"));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/training-sessions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success(t("toast.updateSuccess"));
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.updateFailed"));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/training-sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions"] });
      toast.success(t("toast.deleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t("toast.deleteFailed"));
    }
  });

  const handleOpenCreate = () => {
    setSelectedSession(null);
    setFormTrainingId("");
    setFormTrainer("");
    setFormVenue("");
    setFormStartDate("");
    setFormEndDate("");
    setFormStatus("Scheduled");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (session: TrainingSession) => {
    // Format dates to datetime-local input format (YYYY-MM-DDTHH:MM)
    const formatDatetimeLocal = (isoString: string) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      const tzoffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
      const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
      return localISOTime;
    };

    setSelectedSession(session);
    setFormTrainingId(session.training_id);
    setFormTrainer(session.trainer);
    setFormVenue(session.venue);
    setFormStartDate(formatDatetimeLocal(session.start_date));
    setFormEndDate(formatDatetimeLocal(session.end_date));
    setFormStatus(session.status);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("toast.confirmDelete"))) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      training_id: formTrainingId,
      trainer: formTrainer,
      venue: formVenue,
      start_date: new Date(formStartDate).toISOString(),
      end_date: new Date(formEndDate).toISOString(),
      status: formStatus
    };

    if (selectedSession) {
      updateMutation.mutate({ id: selectedSession.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusLabel = (status: string) => {
    return tStatus(status.toLowerCase() as any);
  };

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  // Filter implementation
  const filteredSessions = Array.isArray(sessions) ? sessions.filter((s) => {
    const trainingName = s.training?.name || "";
    const trainerName = s.trainer || "";
    const matchesSearch = trainingName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          trainerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("pageTitle")}
        subtitle={t("subtitle")}
        backUrl="/training"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 shadow-sm">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="Scheduled">{getStatusLabel("Scheduled")}</option>
              <option value="Ongoing">{getStatusLabel("Ongoing")}</option>
              <option value="Completed">{getStatusLabel("Completed")}</option>
              <option value="Cancelled">{getStatusLabel("Cancelled")}</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> {t("scheduleSession")}
          </button>
        </div>

        {/* Data List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl">
            <Calendar className="h-12 w-12 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-md font-bold text-zinc-700 dark:text-zinc-300">{t("noSessions")}</h3>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1">{t("noSessionsDesc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <div 
                key={session.id} 
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                      {session.training?.code || "COURSE"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                      ${session.status === "Completed" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300" : ""}
                      ${session.status === "Scheduled" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300" : ""}
                      ${session.status === "Ongoing" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
                      ${session.status === "Cancelled" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" : ""}
                    `}>
                      {getStatusLabel(session.status)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4 line-clamp-2">
                    {session.training?.name || "Learning Session"}
                  </h3>

                  <div className="space-y-2.5 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-400" />
                      <span>{t("trainer", { trainer: session.trainer })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-400" />
                      <span>{t("venue", { venue: session.venue })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-zinc-400" />
                      <span>
                        {new Date(session.start_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })} - {new Date(session.end_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-auto">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(session)}
                      className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
                      title={tCommon("edit")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                      title={tCommon("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={`/training/sessions/${session.id}/participants`}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {t("manageRoster")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedSession ? t("modal.editTitle") : t("modal.addTitle")}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-sm font-semibold">
                {tCommon("cancel")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formCourse")}</label>
                <select
                  required
                  value={formTrainingId}
                  onChange={(e) => setFormTrainingId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">{t("modal.selectCourse")}</option>
                  {Array.isArray(trainings) && trainings.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formTrainer")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("modal.trainerPlaceholder")}
                  value={formTrainer}
                  onChange={(e) => setFormTrainer(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formVenue")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("modal.venuePlaceholder")}
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formStart")}</label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formEnd")}</label>
                  <input
                    type="datetime-local"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              {selectedSession && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">{t("modal.formStatus")}</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  >
                    <option value="Scheduled">{getStatusLabel("Scheduled")}</option>
                    <option value="Ongoing">{getStatusLabel("Ongoing")}</option>
                    <option value="Completed">{getStatusLabel("Completed")}</option>
                    <option value="Cancelled">{getStatusLabel("Cancelled")}</option>
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/95 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {selectedSession ? t("modal.saveChanges") : t("modal.saveSession")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
