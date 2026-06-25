"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { 
  Building2, 
  Server, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Lock, 
  ShieldAlert, 
  Activity, 
  Loader2, 
  Globe,
  Database,
  ChevronLeft,
  Edit
} from "lucide-react";
import axios from "axios";
import { toast } from "@/lib/toast";
import VantaBackground from "@/components/vanta/VantaBackground";
import CompanyLogo from "@/components/CompanyLogo";
import { useTranslations, useLocale } from "next-intl";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo_url?: string | null;
  created_at: string;
}

export default function HighLevelControlPage() {
  const tPortal = useTranslations("hlc.portal");
  const tConsole = useTranslations("hlc.console");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isId = locale === "id";
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isSuperAdmin = user?.roles?.includes("Super Admin");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isSuperAdmin) {
      router.push("/dashboard");
      toast.error("Access denied. Super Admin privileges required.");
    }
  }, [isAuthenticated, isSuperAdmin, router]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [token, setToken] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTenantName, setNewTenantName] = useState<string>("");
  const [newTenantSlug, setNewTenantSlug] = useState<string>("");
  const [newTenantLogo, setNewTenantLogo] = useState<File | null>(null);

  // Edit states
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editTenantName, setEditTenantName] = useState<string>("");
  const [editTenantSlug, setEditTenantSlug] = useState<string>("");
  const [editTenantLogo, setEditTenantLogo] = useState<File | null>(null);

  // Check if token exists in session
  useEffect(() => {
    const savedToken = sessionStorage.getItem("nexus_central_token");
    if (savedToken) {
      setToken(savedToken);
      validateAndFetch(savedToken);
    }
  }, []);

  const validateAndFetch = async (inputToken: string) => {
    setLoading(true);
    try {
      // API call to central health check/tenants endpoint to validate
      const response = await axios.get("http://localhost:7030/api/v1/tenants", {
        headers: { "X-Central-Token": inputToken }
      });
      
      if (response.data.success) {
        setTenants(response.data.data);
        setIsAuthorized(true);
        sessionStorage.setItem("nexus_central_token", inputToken);
        toast.success(tPortal("toast.unlocked"));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || tPortal("toast.invalidToken");
      toast.error(msg);
      sessionStorage.removeItem("nexus_central_token");
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error(tPortal("toast.tokenRequired"));
      return;
    }
    validateAndFetch(token);
  };

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim() || !newTenantSlug.trim()) {
      toast.error(tConsole("toast.fieldsRequired"));
      return;
    }

    setActionLoading("register");
    try {
      const formData = new FormData();
      formData.append("name", newTenantName);
      formData.append("slug", newTenantSlug);
      if (newTenantLogo) {
        formData.append("logo", newTenantLogo);
      }

      const response = await axios.post(
        "http://localhost:7030/api/v1/tenants",
        formData,
        { 
          headers: { 
            "X-Central-Token": token,
            "Content-Type": "multipart/form-data"
          } 
        }
      );

      if (response.data.success) {
        toast.success(tConsole("toast.registerSuccess"));
        setTenants([...tenants, response.data.data]);
        setNewTenantName("");
        setNewTenantSlug("");
        setNewTenantLogo(null);
        setShowAddModal(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || tConsole("toast.registerFailed");
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    if (!editTenantName.trim() || !editTenantSlug.trim()) {
      toast.error(tConsole("toast.fieldsRequired"));
      return;
    }

    setActionLoading("update");
    try {
      const formData = new FormData();
      formData.append("name", editTenantName);
      formData.append("slug", editTenantSlug);
      formData.append("_method", "PUT");
      if (editTenantLogo) {
        formData.append("logo", editTenantLogo);
      }

      const response = await axios.post(
        `http://localhost:7030/api/v1/tenants/${editingTenant.id}`,
        formData,
        { 
          headers: { 
            "X-Central-Token": token,
            "Content-Type": "multipart/form-data"
          } 
        }
      );

      if (response.data.success) {
        toast.success(tConsole("toast.updateSuccess"));
        setTenants(tenants.map(t => t.id === editingTenant.id ? response.data.data : t));
        setEditTenantLogo(null);
        setShowEditModal(false);
        setEditingTenant(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || tConsole("toast.updateFailed");
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!confirm(tConsole("toast.confirmDelete", { name }))) {
      return;
    }

    setActionLoading(id);
    try {
      const response = await axios.delete(`http://localhost:7030/api/v1/tenants/${id}`, {
        headers: { "X-Central-Token": token }
      });

      if (response.data.success) {
        toast.success(tConsole("toast.deleteSuccess"));
        setTenants(tenants.filter(t => t.id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || tConsole("toast.deleteFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogoutConsole = () => {
    sessionStorage.removeItem("nexus_central_token");
    setToken("");
    setIsAuthorized(false);
    setTenants([]);
    toast.success(tConsole("toast.logout"));
  };

  // Auth/Unlock Dialog Overlay
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-black font-sans px-4">
        {/* Futuristic Vanta Background */}
        <VantaBackground effect="globe" options={{ color: 0x3b82f6, color2: 0x6366f1, size: 0.8 }} />

        <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mx-auto text-white shadow-lg shadow-primary/30">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{tPortal("title")}</h1>
            <p className="text-sm text-zinc-400 mt-2">
              {tPortal("subtitle")}
            </p>
          </div>

          <form onSubmit={handleAuthorize} className="space-y-4 text-left">
            <div className="space-y-2">
              <label htmlFor="token-key" className="text-xs font-semibold text-zinc-400">
                {tPortal("tokenLabel")}
              </label>
              <input
                id="token-key"
                type="password"
                placeholder={tPortal("tokenPlaceholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/95 disabled:bg-zinc-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : tPortal("unlockBtn")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-850 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">
            N
          </div>
          <div>
            <h1 className="text-md font-bold text-white leading-none">{tCommon("appName")} Central</h1>
            <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">
              {isId ? "Konsol Kontrol Tingkat Tinggi" : "High Level Control Console"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-1 hover:scale-[1.02]"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="h-3.5 w-3.5 animate-pulse" />
            {isId ? "Kontrol Sistem Aktif" : "System Control Active"}
          </div>
          <button
            onClick={handleLogoutConsole}
            className="px-3.5 py-1.5 rounded-lg border border-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            {isId ? "Kunci Konsol" : "Lock Console"}
          </button>
        </div>
      </header>

      {/* Main Console */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        {/* Dashboard Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{tConsole("title")}</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {tConsole("subtitle")}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary/95 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
          >
            <Plus className="h-4 w-4" />
            {tConsole("registerBtn")}
          </button>
        </div>

        {/* Console Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{tConsole("stats.activeCompanies")}</p>
              <h3 className="text-2xl font-black text-white mt-1">{tenants.length}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{tConsole("stats.isolationMethod")}</p>
              <h3 className="text-md font-bold text-zinc-200 mt-1">{tConsole("stats.isolationDesc")}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{tConsole("stats.gatewayDomain")}</p>
              <h3 className="text-md font-bold text-zinc-200 mt-1">{tConsole("stats.gatewayDesc")}</h3>
            </div>
          </div>
        </div>

        {/* Tenant Table List */}
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-850 bg-zinc-900/60">
            <h3 className="text-sm font-bold text-zinc-200">{tConsole("tableTitle")}</h3>
          </div>

          {tenants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-400 text-xs font-bold bg-zinc-950/40">
                    <th className="px-6 py-4">{tConsole("table.name")}</th>
                    <th className="px-6 py-4">{tConsole("table.slug")}</th>
                    <th className="px-6 py-4">{tConsole("table.domain")}</th>
                    <th className="px-6 py-4">{tConsole("table.date")}</th>
                    <th className="px-6 py-4 text-right">{tConsole("table.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                        <CompanyLogo 
                          src={tenant.logo_url} 
                          name={tenant.name} 
                          size="sm" 
                          variant="letter" 
                        />
                        {tenant.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-xs">
                          {tenant.slug}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{tenant.domain}</td>
                      <td className="px-6 py-4 text-zinc-500">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/login?tenant=${tenant.slug}`}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {tConsole("portalBtn")}
                          </Link>
                          <button
                            onClick={() => {
                              setEditingTenant(tenant);
                              setEditTenantName(tenant.name);
                              setEditTenantSlug(tenant.slug);
                              setShowEditModal(true);
                            }}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-800 hover:border-blue-900 hover:bg-blue-950/20 text-zinc-400 hover:text-blue-400 transition-colors"
                            title={tCommon("edit")}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-800 hover:border-red-900 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 transition-colors"
                            title={tCommon("delete")}
                          >
                            {actionLoading === tenant.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-2">
              <Building2 className="h-8 w-8 text-zinc-600" />
              <span>{tConsole("noTenants")}</span>
            </div>
          )}
        </div>
      </main>

      {/* Register Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-855 flex items-center justify-between">
              <h3 className="font-bold text-white">{tConsole("modalAdd.title")}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterTenant} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">{tConsole("modalAdd.name")}</label>
                <input
                  type="text"
                  required
                  placeholder={tConsole("modalAdd.namePlaceholder")}
                  value={newTenantName}
                  onChange={(e) => {
                    setNewTenantName(e.target.value);
                    // Autofill slug
                    if (!newTenantSlug) {
                      setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  className="w-full h-10 bg-zinc-955 border border-zinc-800 rounded-lg px-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">{tConsole("modalAdd.slug")}</label>
                <input
                  type="text"
                  required
                  placeholder={tConsole("modalAdd.slugPlaceholder")}
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full h-10 bg-zinc-955 border border-zinc-800 rounded-lg px-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
                <span className="text-[10px] text-zinc-500">
                  {tConsole("modalAdd.slugHint", { slug: newTenantSlug || "slug" })}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">{tConsole("modalAdd.logo")}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewTenantLogo(e.target.files[0]);
                    }
                  }}
                  className="w-full h-11 bg-zinc-955 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-lg border border-zinc-800 font-semibold text-sm hover:bg-zinc-850 transition-colors"
                >
                  {tConsole("modalAdd.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "register"}
                  className="flex-1 h-10 bg-primary hover:bg-primary/95 disabled:bg-zinc-800 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  {actionLoading === "register" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tConsole("modalAdd.submit")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between">
              <h3 className="font-bold text-white">{tConsole("modalEdit.title")}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTenant(null);
                  setEditTenantLogo(null);
                }}
                className="text-zinc-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTenant} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">{tConsole("modalEdit.name")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HBM Manufacturing"
                  value={editTenantName}
                  onChange={(e) => setEditTenantName(e.target.value)}
                  className="w-full h-10 bg-zinc-955 border border-zinc-800 rounded-lg px-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">{tConsole("modalEdit.slug")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hbm-mfg"
                  value={editTenantSlug}
                  onChange={(e) => setEditTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full h-10 bg-zinc-955 border border-zinc-800 rounded-lg px-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
                <span className="text-[10px] text-zinc-500">
                  {tConsole("modalEdit.slugHint", { slug: editTenantSlug || "slug" })}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">{tConsole("modalEdit.logo")}</label>
                {editingTenant?.logo_url && (
                  <div className="flex items-center gap-3 p-2 bg-zinc-955 border border-zinc-850 rounded-lg mb-2">
                    <CompanyLogo src={editingTenant.logo_url} name={editingTenant.name} size="md" variant="letter" className="rounded-md" />
                    <span className="text-[10px] text-zinc-505">{tConsole("modalEdit.currentLogo")}</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditTenantLogo(e.target.files[0]);
                    }
                  }}
                  className="w-full h-11 bg-zinc-955 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTenant(null);
                    setEditTenantLogo(null);
                  }}
                  className="flex-1 h-10 rounded-lg border border-zinc-800 font-semibold text-sm hover:bg-zinc-850 transition-colors"
                >
                  {tConsole("modalEdit.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "update"}
                  className="flex-1 h-10 bg-primary hover:bg-primary/95 disabled:bg-zinc-800 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  {actionLoading === "update" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tConsole("modalEdit.submit")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
