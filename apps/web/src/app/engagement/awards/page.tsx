"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { 
  Award, Plus, User, Calendar, Trash2, Shield, 
  Trophy, Lightbulb, Users2, Compass, Heart 
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function AwardsWallPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("engagement.awards");

  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  // Grant Award Modal state
  const [showModal, setShowModal] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("employee_of_month");
  const [awardedDate, setAwardedDate] = useState("");
  const [awardedBy, setAwardedBy] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Set default dates & awarder
  useEffect(() => {
    if (user?.employee_id) {
      setAwardedBy(user.employee_id);
    }
    const today = new Date().toISOString().split("T")[0];
    setAwardedDate(today);
  }, [user]);

  // Fetch awards list
  const { data: awardsData, isLoading } = useQuery({
    queryKey: ["engagement-awards"],
    queryFn: async () => {
      const res = await api.get("/awards?per_page=50");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch employees for dropdown selection
  const { data: employeesData = [] } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const res = await api.get("/employees?per_page=100");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated && isAdmin,
  });

  const grantAwardMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post("/awards", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-awards"] });
      queryClient.invalidateQueries({ queryKey: ["engagement-awards-metrics"] });
      toast.success("Award granted successfully!");
      setShowModal(false);
      // Reset form
      setEmployeeId("");
      setTitle("");
      setDescription("");
      setCategory("employee_of_month");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to grant award.");
    }
  });

  const revokeAwardMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/awards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-awards"] });
      queryClient.invalidateQueries({ queryKey: ["engagement-awards-metrics"] });
      toast.success("Award revoked successfully.");
    },
    onError: () => {
      toast.error("Failed to revoke award.");
    }
  });

  const handleGrantAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.warning("Please select an employee.");
      return;
    }
    if (!title.trim()) {
      toast.warning("Award title is required.");
      return;
    }

    grantAwardMutation.mutate({
      employee_id: employeeId,
      title,
      description,
      category,
      awarded_date: awardedDate,
      awarded_by: awardedBy,
    });
  };

  const handleRevokeAward = (id: string) => {
    if (confirm("Are you sure you want to revoke this award? This cannot be undone.")) {
      revokeAwardMutation.mutate(id);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  const awards = Array.isArray(awardsData) ? awardsData : [];
  const employees = Array.isArray(employeesData) ? employeesData : [];

  // Helper to get Category Badge styles & Icons
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case "employee_of_month":
        return {
          icon: <Trophy className="h-5 w-5 text-amber-500" />,
          bgColor: "bg-amber-50 dark:bg-amber-950/20",
          textColor: "text-amber-700 dark:text-amber-400",
          borderColor: "border-amber-200 dark:border-amber-900/50",
          label: "Employee of the Month"
        };
      case "innovation":
        return {
          icon: <Lightbulb className="h-5 w-5 text-purple-500" />,
          bgColor: "bg-purple-50 dark:bg-purple-950/20",
          textColor: "text-purple-700 dark:text-purple-400",
          borderColor: "border-purple-200 dark:border-purple-900/50",
          label: "Innovation"
        };
      case "teamwork":
        return {
          icon: <Users2 className="h-5 w-5 text-teal-500" />,
          bgColor: "bg-teal-50 dark:bg-teal-950/20",
          textColor: "text-teal-700 dark:text-teal-400",
          borderColor: "border-teal-200 dark:border-teal-900/50",
          label: "Teamwork"
        };
      case "leadership":
        return {
          icon: <Compass className="h-5 w-5 text-blue-500" />,
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          textColor: "text-blue-700 dark:text-blue-400",
          borderColor: "border-blue-200 dark:border-blue-900/50",
          label: "Leadership"
        };
      case "service_excellence":
      default:
        return {
          icon: <Heart className="h-5 w-5 text-rose-500" />,
          bgColor: "bg-rose-50 dark:bg-rose-950/20",
          textColor: "text-rose-700 dark:text-rose-400",
          borderColor: "border-rose-200 dark:border-rose-900/50",
          label: "Service Excellence"
        };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        backUrl="/engagement"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Corporate Achievement Wall ({awards.length})
          </h3>

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {t("addBtn")}
            </button>
          )}
        </div>

        {/* Awards Wall Grid */}
        {isLoading ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-12 text-center">
            <div className="animate-spin h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-[11px] text-zinc-400 mt-2 font-medium">Loading awards wall...</p>
          </div>
        ) : awards.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-16 text-center max-w-xl mx-auto">
            <Trophy className="h-10 w-10 text-zinc-300 dark:text-zinc-800 mx-auto mb-3" />
            <p className="text-xs text-zinc-500">The awards wall is empty. Let's celebrate achievements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {awards.map((item: any) => {
              const meta = getCategoryMeta(item.category);
              const recipientName = item.employee 
                ? `${item.employee.first_name} ${item.employee.last_name || ""}` 
                : "Corporate Staff";
              const awarderName = item.awarder
                ? `${item.awarder.first_name} ${item.awarder.last_name || ""}`
                : "HR Department";

              return (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-all duration-200 group overflow-hidden"
                >
                  {/* Category Accent Stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${meta.bgColor.replace("/20", "")}`} />

                  {/* Card Header */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className={`h-10 w-10 rounded-2xl ${meta.bgColor} flex items-center justify-center`}>
                        {meta.icon}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${meta.borderColor} ${meta.textColor}`}>
                          {meta.label}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleRevokeAward(item.id)}
                            className="h-6 w-6 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            title="Revoke award"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Recipient Details */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        {recipientName}
                      </h4>
                      {item.employee?.position && (
                        <p className="text-[9px] text-zinc-400 mt-0.5 ml-4.5">
                          {item.employee.position.name}
                        </p>
                      )}
                    </div>

                    {/* Citation / Quote */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900/50">
                      <h5 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                        "{item.description || "In recognition of exceptional achievement and commitment to corporate values."}"
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900/50 flex justify-between items-center text-[9px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.awarded_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      Awarded by: {awarderName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Grant Award Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-enter">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {t("modal.title")}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-7 w-7 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGrantAward} className="p-6 space-y-4">
              
              {/* Employee Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.employee")}
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ""} ({emp.position?.name || "No Position"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Award Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.awardTitle")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Star Innovator Q2"
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.category")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                >
                  <option value="employee_of_month">Employee of the Month</option>
                  <option value="innovation">Innovation</option>
                  <option value="teamwork">Teamwork</option>
                  <option value="leadership">Leadership</option>
                  <option value="service_excellence">Service Excellence</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.date")}
                </label>
                <input
                  type="date"
                  value={awardedDate}
                  onChange={(e) => setAwardedDate(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              {/* Description Citation */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  {t("modal.description")}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Citation: e.g. For designing the new automated tenant billing system that cut reconciliation time by 40%..."
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 leading-normal"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grantAwardMutation.isPending}
                  className="px-4 py-2 text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("modal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
