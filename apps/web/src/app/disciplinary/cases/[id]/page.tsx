"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Loader2, ShieldAlert, FileText, CheckCircle, Plus, Calendar, Save, Award, User, AlertOctagon } from "lucide-react";
import { toast } from "@/lib/toast";

interface Action {
  id: string;
  action_type: string;
  effective_date: string;
  expiry_date?: string;
  description: string;
  issuer?: { name: string };
}

interface Case {
  id: string;
  case_number: string;
  category: string;
  incident_date: string;
  description: string;
  severity: string;
  status: string;
  employee?: { id: string; name: string; job_title?: string };
  reporter?: { id: string; name: string };
  investigation?: {
    id: string;
    findings?: string;
    recommendation?: string;
    committee_notes?: string;
    status: string;
    completed_at?: string;
  };
  actions?: Action[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DisciplinaryCaseDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"detail" | "investigation" | "actions">("detail");

  // Form states - Investigation
  const [findings, setFindings] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [committeeNotes, setCommitteeNotes] = useState("");
  const [invStatus, setInvStatus] = useState("in_progress");

  // Form states - Issue Action (Sanksi)
  const [actionType, setActionType] = useState("sp1");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [actionDesc, setActionDesc] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: caseDetail, isLoading } = useQuery<Case>({
    queryKey: ["disciplinary-case-detail", id],
    queryFn: async () => {
      const res = await api.get(`/disciplinary-cases/${id}`);
      return res.data.data;
    },
    enabled: isAuthenticated && !!id,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["disciplinary-investigators-list"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Sync initial investigation form states
  useEffect(() => {
    if (caseDetail?.investigation) {
      setFindings(caseDetail.investigation.findings || "");
      setRecommendation(caseDetail.investigation.recommendation || "");
      setCommitteeNotes(caseDetail.investigation.committee_notes || "");
      setInvStatus(caseDetail.investigation.status || "in_progress");
    }
  }, [caseDetail]);

  // Mutations
  const saveInvestigationMutation = useMutation({
    mutationFn: (data: any) => {
      if (caseDetail?.investigation?.id) {
        return api.put(`/investigations/${caseDetail.investigation.id}`, data);
      } else {
        return api.post("/investigations", {
          ...data,
          disciplinary_case_id: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary-case-detail", id] });
      toast.success("Log investigasi berhasil disimpan");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyimpan investigasi"),
  });

  const issueActionMutation = useMutation({
    mutationFn: (data: any) => api.post(`/disciplinary-cases/${id}/actions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary-case-detail", id] });
      toast.success("Sanksi / Surat Peringatan (SP) berhasil diterbitkan");
      setActionDesc("");
      setEffectiveDate("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menerbitkan sanksi"),
  });

  const handleSaveInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    const investigatorId = employees && employees.length > 0 ? employees[0].id : "";
    saveInvestigationMutation.mutate({
      investigator_id: investigatorId,
      findings,
      recommendation,
      committee_notes: committeeNotes,
      status: invStatus,
    });
  };

  const handleIssueActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const issuerId = employees && employees.length > 0 ? employees[0].id : "";
    issueActionMutation.mutate({
      action_type: actionType,
      effective_date: effectiveDate,
      description: actionDesc,
      issued_by: issuerId,
    });
  };

  if (!mounted || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col items-center justify-center p-6">
        <AlertOctagon className="h-12 w-12 text-rose-500 mb-2 animate-bounce" />
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Kasus kedisiplinan tidak ditemukan.</p>
        <button
          onClick={() => router.push("/disciplinary")}
          className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Log Kasus
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title={`Kasus: ${caseDetail.case_number}`}
        subtitle={`Karyawan: ${caseDetail.employee?.name} • Departemen: ${caseDetail.employee?.job_title}`}
        backUrl="/disciplinary"
      />

      <main className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-6">
          <button
            onClick={() => setActiveTab("detail")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "detail"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Rincian Kasus
            {activeTab === "detail" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("investigation")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "investigation"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Berita Acara & Investigasi
            {activeTab === "investigation" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("actions")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "actions"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Sanksi / Surat Peringatan (SP)
            {activeTab === "actions" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Case details */}
        {activeTab === "detail" && (
          <div className="space-y-4 text-xs animate-enter">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">Laporan Awal Kronologi</h3>
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-850">
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400">Tanggal Insiden:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-250">{caseDetail.incident_date}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400">Tingkat Keparahan:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-250 capitalize">{caseDetail.severity}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400">Pelapor:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-250">{caseDetail.reporter?.name || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-zinc-400">Status Kasus:</span>
                  <p className="font-bold text-rose-600 dark:text-rose-400 capitalize">{caseDetail.status.replace("_", " ")}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-zinc-500">Uraian Kejadian Pelanggaran:</span>
                <p className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {caseDetail.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Investigation BAP */}
        {activeTab === "investigation" && (
          <div className="space-y-4 text-xs animate-enter">
            <form onSubmit={handleSaveInvestigation} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">Pemeriksaan & BAP Wawancara</h3>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Temuan Investigasi (Findings)</label>
                <textarea
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Detail temuan bukti fisik, keterangan saksi, atau wawancara terlapor..."
                  rows={4}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none font-medium text-zinc-700 dark:text-zinc-300"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Rekomendasi Investigator</label>
                <textarea
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Rekomendasi sanksi atau tindakan lanjut..."
                  rows={2}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Catatan Komite Disiplin</label>
                  <input
                    type="text"
                    value={committeeNotes}
                    onChange={(e) => setCommitteeNotes(e.target.value)}
                    placeholder="Catatan tambahan panel komite..."
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Status Investigasi</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold"
                  >
                    <option value="in_progress">Dalam Proses (In Progress)</option>
                    <option value="completed">Selesai (Completed - Maju ke Sidang/Hearing)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saveInvestigationMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-850 transition-colors shadow-md font-bold cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Simpan Hasil Wawancara
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Disciplinary Actions / Warning letters */}
        {activeTab === "actions" && (
          <div className="space-y-6 text-xs animate-enter">
            {/* Form issue warning */}
            {caseDetail.status !== "closed" && (
              <form onSubmit={handleIssueActionSubmit} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">Terbitkan Surat Peringatan (SP) atau Sanksi</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Tipe Tindakan</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-rose-600 dark:text-rose-450"
                    >
                      <option value="verbal_warning">Teguran Lisan</option>
                      <option value="sp1">Surat Peringatan 1 (SP1)</option>
                      <option value="sp2">Surat Peringatan 2 (SP2)</option>
                      <option value="sp3">Surat Peringatan 3 (SP3 / Terakhir)</option>
                      <option value="suspension">Skorsing (Suspension)</option>
                      <option value="termination">Pemutusan Hubungan Kerja (PHK)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Tanggal Efektif</label>
                    <input
                      type="date"
                      required
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Keterangan / Uraian Sanksi</label>
                  <textarea
                    required
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                    placeholder="Alasan penerbitan SP serta konsekuensi/syarat pemulihan..."
                    rows={3}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none font-medium text-zinc-700 dark:text-zinc-300"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={issueActionMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-colors shadow-md font-bold cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Terbitkan Surat Keputusan
                  </button>
                </div>
              </form>
            )}

            {/* Actions list */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">Riwayat Sanksi yang Diterbitkan</h3>
              {!caseDetail.actions || caseDetail.actions.length === 0 ? (
                <p className="text-zinc-500 italic p-4 text-center border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 rounded-2xl">
                  Belum ada sanksi diterbitkan untuk kasus ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {caseDetail.actions.map((act) => (
                    <div key={act.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-4 rounded-2xl shadow-sm flex items-start gap-4">
                      <div className="h-9 w-9 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-150 uppercase">{act.action_type.replace("_", " ")}</h4>
                          <span className="text-[10px] text-zinc-400 font-semibold">Tgl: {act.effective_date}</span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{act.description}</p>
                        {act.expiry_date && (
                          <p className="text-[9px] text-rose-500 font-extrabold">Masa Berlaku Berakhir: {act.expiry_date} (Otomatis +6 Bulan)</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
