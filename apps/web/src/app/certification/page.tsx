"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Award, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle,
  BadgeAlert,
  GraduationCap,
  Calendar,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

interface CertificationRequirement {
  id: string;
  position_id: string;
  position?: { name: string };
  certification_id: string;
  certification?: { name: string; issuer: string };
  is_mandatory: boolean;
}

export default function CertificationDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Modal State
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Form State
  const [formPositionId, setFormPositionId] = useState("");
  const [formCertId, setFormCertId] = useState("");
  const [formMandatory, setFormMandatory] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch certification requirements (compliance matrix)
  const { data: requirements, isLoading: isReqsLoading } = useQuery<CertificationRequirement[]>({
    queryKey: ["certification-requirements"],
    queryFn: () => api.get("/certification-requirements").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Fetch master certifications for dropdowns
  const { data: certifications } = useQuery({
    queryKey: ["certifications"],
    queryFn: () => api.get("/certifications").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Fetch employee certifications to compute statistics
  const { data: empCerts } = useQuery({
    queryKey: ["employee-certifications"],
    queryFn: () => api.get("/employee-certifications").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Fetch positions for dropdowns
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => api.get("/positions").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated,
  });

  // Mutations
  const addRequirementMutation = useMutation({
    mutationFn: (data: any) => api.post("/certification-requirements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certification-requirements"] });
      toast.success("Position certification mapping added");
      setIsMatrixOpen(false);
      setFormPositionId("");
      setFormCertId("");
      setFormMandatory(true);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add mapping");
    }
  });

  const removeRequirementMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/certification-requirements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certification-requirements"] });
      toast.success("Position mapping removed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove mapping");
    }
  });

  const handleMatrixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPositionId || !formCertId) return;
    addRequirementMutation.mutate({
      position_id: formPositionId,
      certification_id: formCertId,
      is_mandatory: formMandatory
    });
  };

  const handleRemoveRequirement = (id: string) => {
    if (confirm("Are you sure you want to remove this certification requirement for this job position?")) {
      removeRequirementMutation.mutate(id);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  // Compute Dashboard Statistics
  const totalCerts = Array.isArray(certifications) ? certifications.length : 0;
  const activeEmpCerts = Array.isArray(empCerts) ? empCerts.filter((ec: any) => ec.status === "Active").length : 0;
  
  // Expirations stats
  const expiredEmpCerts = Array.isArray(empCerts) ? empCerts.filter((ec: any) => ec.status === "Expired").length : 0;
  
  // Renewals pending (Expires in less than 30 days)
  const pendingRenewalCerts = Array.isArray(empCerts) 
    ? empCerts.filter((ec: any) => ec.status === "Pending_Renewal").length 
    : 0;

  const navigationCards = [
    {
      title: "Master Certifications",
      description: "Manage core professional certifications, licensing authorities, and validity lifespans.",
      icon: Award,
      href: "/certification/master",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500 text-white"
    },
    {
      title: "Employee Certificates",
      description: "Log individual employee credentials, upload certificates, and monitor renewal queues.",
      icon: ShieldCheck,
      href: "/certification/employee",
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500 text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title="Certification Hub" 
        subtitle="Map mandatory position requirements, track employee licensing status, and keep ahead of expiration dates."
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">License Master</span>
              <Award className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalCerts}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Active Licenses</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeEmpCerts}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Renewals (&lt; 30d)</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{pendingRenewalCerts}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Expired Licenses</span>
              <BadgeAlert className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 text-red-600 dark:text-red-400">{expiredEmpCerts}</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`flex flex-col p-6 rounded-2xl border bg-gradient-to-br ${card.color} hover:scale-[1.01] hover:shadow-md transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg} shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  {card.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Compliance Requirement Matrix Mapping */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Position Certification Requirements Matrix</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Define which job positions are contractually or legally required to possess specific professional licenses.</p>
            </div>
            <button
              onClick={() => setIsMatrixOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Map Position Requirements
            </button>
          </div>

          {isReqsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : !requirements || requirements.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-600">
              No mandatory job requirements mapped. Map a position above to begin checking compliance.
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-800 rounded-xl">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <th className="px-6 py-3.5 font-semibold text-zinc-500 dark:text-zinc-400">Job Position</th>
                    <th className="px-6 py-3.5 font-semibold text-zinc-500 dark:text-zinc-400">Required Certification</th>
                    <th className="px-6 py-3.5 font-semibold text-zinc-500 dark:text-zinc-400">Issuer</th>
                    <th className="px-6 py-3.5 font-semibold text-zinc-500 dark:text-zinc-400">Mandatory Status</th>
                    <th className="px-6 py-3.5 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">{req.position?.name || "Position"}</td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">{req.certification?.name}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{req.certification?.issuer}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                          ${req.is_mandatory ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"}
                        `}>
                          {req.is_mandatory ? "Mandatory (Wajib)" : "Optional"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveRequirement(req.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Remove mapping"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Map Position Modal */}
      {isMatrixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                Map Position Certification Requirement
              </h2>
              <button onClick={() => setIsMatrixOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-semibold">
                Cancel
              </button>
            </div>

            <form onSubmit={handleMatrixSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Job Position</label>
                <select
                  required
                  value={formPositionId}
                  onChange={(e) => setFormPositionId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">Select Position...</option>
                  {Array.isArray(positions) && positions.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Required Certification</label>
                <select
                  required
                  value={formCertId}
                  onChange={(e) => setFormCertId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                >
                  <option value="">Select Certification...</option>
                  {Array.isArray(certifications) && certifications.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.issuer})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_mandatory_checkbox"
                  checked={formMandatory}
                  onChange={(e) => setFormMandatory(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-800 text-zinc-900 focus:ring-0 h-4 w-4"
                />
                <label htmlFor="is_mandatory_checkbox" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  This certification is legally mandatory (Wajib) for this role
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={addRequirementMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-zinc-950 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {addRequirementMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Mapping Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
