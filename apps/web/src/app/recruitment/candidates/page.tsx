"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit2, 
  User,
  Mail,
  Phone,
  FileText,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuthorization } from "@/hooks/useAuthorization";

interface Candidate {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  resume_path?: string;
}

export default function CandidateManagement() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();
  const [mounted, setMounted] = useState(false);

  // Filter/Search State
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Form State
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formResumePath, setFormResumePath] = useState("");

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
  const { data: candidates, isLoading } = useQuery<Candidate[]>({
    queryKey: ["candidates"],
    queryFn: () => api.get("/candidates").then((res) => res.data.data?.data || res.data.data || []),
    enabled: isAuthenticated && isAdmin,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/candidates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate created successfully");
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create candidate");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/candidates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate updated successfully");
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update candidate");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete candidate");
    }
  });

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  const handleOpenCreate = () => {
    setSelectedCandidate(null);
    setFormFirstName("");
    setFormLastName("");
    setFormEmail("");
    setFormPhone("");
    setFormResumePath("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setFormFirstName(candidate.first_name);
    setFormLastName(candidate.last_name || "");
    setFormEmail(candidate.email);
    setFormPhone(candidate.phone || "");
    setFormResumePath(candidate.resume_path || "");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      first_name: formFirstName,
      last_name: formLastName || null,
      email: formEmail,
      phone: formPhone || null,
      resume_path: formResumePath || null,
    };

    if (selectedCandidate) {
      updateMutation.mutate({ id: selectedCandidate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this candidate?")) {
      deleteMutation.mutate(id);
    }
  };

  const generateMockResume = () => {
    const randomId = Math.floor(Math.random() * 1000000);
    setFormResumePath(`resumes/resume_mock_${randomId}.pdf`);
    toast.success("Mock S3 PDF resume path generated!");
  };

  const filteredCandidates = Array.isArray(candidates)
    ? candidates.filter((cand) => {
        const fullName = `${cand.first_name} ${cand.last_name || ""}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) || cand.email.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Candidate Directory"
        subtitle="View corporate talent database, add applicants, and review resumes."
        backUrl="/recruitment"
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Search */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search candidates by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/95 transition-all w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </button>
        </div>

        {/* Data Cards Grid */}
        {isLoading ? (
          <div className="h-64 flex flex-col justify-center items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-500">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="h-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl flex flex-col justify-center items-center gap-3">
            <User className="h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">No candidates found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((cand) => (
              <div key={cand.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-sm">
                      {cand.first_name[0]}{cand.last_name ? cand.last_name[0] : ""}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
                        {cand.first_name} {cand.last_name}
                      </h4>
                      <span className="text-[10px] text-zinc-400">ID: {cand.id.substring(0, 8)}...</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{cand.email}</span>
                    </div>
                    {cand.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{cand.phone}</span>
                      </div>
                    )}
                    {cand.resume_path && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-zinc-400" />
                        <a 
                          href={`http://localhost:7030/storage/${cand.resume_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          CV Resume <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                  <button
                    onClick={() => handleOpenEdit(cand)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cand.id)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 border border-red-200/50 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Candidate Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {selectedCandidate ? "Edit Candidate Profile" : "Add Candidate Profile"}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 08123456789"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">CV Resume Path</label>
                  <button 
                    type="button" 
                    onClick={generateMockResume}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Generate Mock PDF Path
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="resumes/resume_name.pdf"
                  value={formResumePath}
                  onChange={(e) => setFormResumePath(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-50 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
