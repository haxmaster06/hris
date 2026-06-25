"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Loader2, 
  Cpu, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  Save, 
  Link2,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface ConfigItem {
  id?: string;
  type: string;
  provider: string;
  name: string;
  config: Record<string, string>;
  is_active: boolean;
}

const PROVIDER_METADATA: Record<string, {
  name: string;
  icon: any;
  color: string;
  fields: { key: string; label: string; type: string; placeholder: string }[];
}> = {
  whatsapp: {
    name: "WhatsApp Gateway (Fonnte)",
    icon: MessageSquare,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    fields: [
      { key: "api_key", label: "API Key / Token", type: "password", placeholder: "Enter Fonnte API Key" },
      { key: "sender_number", label: "Sender Phone Number", type: "text", placeholder: "e.g. 628123456789" },
    ],
  },
  email: {
    name: "Email SMTP Gateway",
    icon: Mail,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    fields: [
      { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "e.g. smtp.mailgun.org" },
      { key: "smtp_port", label: "SMTP Port", type: "text", placeholder: "e.g. 587" },
      { key: "smtp_username", label: "SMTP Username", type: "text", placeholder: "Enter SMTP username" },
      { key: "smtp_password", label: "SMTP Password", type: "password", placeholder: "Enter SMTP password" },
    ],
  },
  bca: {
    name: "BCA Bank Export",
    icon: CreditCard,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    fields: [
      { key: "api_url", label: "API Endpoint URL", type: "text", placeholder: "e.g. https://api.bca.co.id" },
      { key: "client_id", label: "Client ID", type: "text", placeholder: "Enter BCA Client ID" },
      { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Enter BCA Client Secret" },
    ],
  },
  mandiri: {
    name: "Mandiri Bank Export",
    icon: CreditCard,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    fields: [
      { key: "api_url", label: "API Endpoint URL", type: "text", placeholder: "e.g. https://api.mandiri.co.id" },
      { key: "api_key", label: "API Corporate Key", type: "password", placeholder: "Enter Mandiri Key" },
    ],
  },
  bri: {
    name: "BRI Bank Export",
    icon: CreditCard,
    color: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    fields: [
      { key: "api_url", label: "API Endpoint URL", type: "text", placeholder: "e.g. https://api.bri.co.id" },
      { key: "api_key", label: "API Token Key", type: "password", placeholder: "Enter BRI Token" },
    ],
  },
  bni: {
    name: "BNI Bank Export",
    icon: CreditCard,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    fields: [
      { key: "api_url", label: "API Endpoint URL", type: "text", placeholder: "e.g. https://api.bni.co.id" },
      { key: "api_key", label: "API Token Key", type: "password", placeholder: "Enter BNI Token" },
    ],
  },
};

export default function IntegrationsSettings() {
  const router = useRouter();
  const t = useTranslations();
  const { isAuthenticated } = useAuthStore();
  const { isAdmin } = useAuthorization();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<Record<string, ConfigItem>>({});
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [testPending, setTestPending] = useState<string | null>(null);
  const [savePending, setSavePending] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
    } else {
      fetchConfigs();
    }
  }, [isAuthenticated, isAdmin, router]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/integration/configs");
      const dbConfigs = response.data.data || [];
      
      const mapped: Record<string, ConfigItem> = {};
      
      // Initialize defaults for all known providers
      Object.keys(PROVIDER_METADATA).forEach((prov) => {
        const metadata = PROVIDER_METADATA[prov];
        const isBank = ["bca", "mandiri", "bri", "bni"].includes(prov);
        mapped[prov] = {
          type: isBank ? "bank_export" : "notification",
          provider: prov,
          name: metadata.name,
          config: metadata.fields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}),
          is_active: false,
        };
      });

      // Overlay with values from database
      dbConfigs.forEach((cfg: any) => {
        if (mapped[cfg.provider]) {
          mapped[cfg.provider] = {
            id: cfg.id,
            type: cfg.type,
            provider: cfg.provider,
            name: cfg.name,
            config: {
              ...mapped[cfg.provider].config,
              ...(cfg.config || {}),
            },
            is_active: !!cfg.is_active,
          };
        }
      });

      setConfigs(mapped);
    } catch (err: any) {
      console.error(err);
      toast.error(t("common.failedLoad", { entity: "Configurations" }) || "Failed to load configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (provider: string, fieldKey: string, value: string) => {
    setConfigs((prev) => {
      const current = prev[provider];
      return {
        ...prev,
        [provider]: {
          ...current,
          config: {
            ...current.config,
            [fieldKey]: value,
          },
        },
      };
    });
  };

  const handleActiveToggle = (provider: string) => {
    setConfigs((prev) => {
      const current = prev[provider];
      return {
        ...prev,
        [provider]: {
          ...current,
          is_active: !current.is_active,
        },
      };
    });
  };

  const handleSave = async (provider: string) => {
    try {
      setSavePending(provider);
      const payload = configs[provider];
      
      const response = await api.post("/integration/configs", {
        type: payload.type,
        provider: payload.provider,
        name: payload.name,
        config: payload.config,
        is_active: payload.is_active,
      });

      // Update local state with the saved record (specifically the generated ID)
      const saved = response.data.data;
      setConfigs((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          id: saved.id,
          is_active: !!saved.is_active,
        },
      }));

      toast.success(t("integration.saveSuccess") || "Configuration saved successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(t("common.failedUpdate", { entity: "Configuration" }) || "Failed to save configuration");
    } finally {
      setSavePending(null);
    }
  };

  const handleTestConnection = async (provider: string) => {
    try {
      setTestPending(provider);
      const response = await api.post("/integration/test-connection", {
        provider,
      });

      if (response.data.success) {
        toast.success(t("integration.testSuccess", { provider: PROVIDER_METADATA[provider]?.name || provider }) || `Connection to ${provider} tested successfully!`);
      } else {
        toast.error("Connection check failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not reach API endpoint or validation failed.");
    } finally {
      setTestPending(null);
    }
  };

  if (!mounted || !isAuthenticated || !isAdmin) {
    return null;
  }

  // Split into categories for rendering
  const notificationsList = Object.keys(configs).filter(k => configs[k].type === "notification");
  const banksList = Object.keys(configs).filter(k => configs[k].type === "bank_export");

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black font-sans transition-colors duration-200">
      <Header
        title={t("integration.title")}
        subtitle={t("integration.subtitle")}
        backUrl="/settings"
      />

      <main className="flex-1 flex flex-col justify-start px-6 py-10 max-w-4xl mx-auto w-full space-y-8 animate-page-enter">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-550" />
          </div>
        ) : (
          <>
            {/* Section 1: Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-900">
                <Cpu className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Notification Gateways
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {notificationsList.map((key) => {
                  const item = configs[key];
                  const meta = PROVIDER_METADATA[key];
                  const Icon = meta.icon;
                  const isExpanded = activeProvider === key;

                  return (
                    <div
                      key={key}
                      className={`bg-white dark:bg-zinc-950 border rounded-2xl transition-all duration-300 ${
                        isExpanded
                          ? "border-zinc-400 dark:border-zinc-700 shadow-md"
                          : "border-zinc-200 dark:border-zinc-900 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800"
                      }`}
                    >
                      {/* Summary Row */}
                      <div
                        onClick={() => setActiveProvider(isExpanded ? null : key)}
                        className="flex items-center justify-between p-5 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl border ${meta.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                              {meta.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Status: {item.is_active ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          {/* Active Toggle Switch */}
                          <button
                            onClick={() => handleActiveToggle(key)}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            {item.is_active ? (
                              <ToggleRight className="h-7 w-7 text-indigo-650 dark:text-indigo-400" />
                            ) : (
                              <ToggleLeft className="h-7 w-7" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Form */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {meta.fields.map((f) => (
                              <div key={f.key} className="space-y-1.5">
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                  {f.label}
                                </label>
                                <input
                                  type={f.type}
                                  value={item.config[f.key] || ""}
                                  onChange={(e) => handleFieldChange(key, f.key, e.target.value)}
                                  placeholder={f.placeholder}
                                  className="w-full text-xs py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              onClick={() => handleTestConnection(key)}
                              disabled={testPending !== null}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold disabled:opacity-50 cursor-pointer text-zinc-700 dark:text-zinc-300"
                            >
                              {testPending === key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Link2 className="h-3.5 w-3.5" />
                              )}
                              {t("integration.testConnection")}
                            </button>

                            <button
                              onClick={() => handleSave(key)}
                              disabled={savePending !== null}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              {savePending === key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              {t("common.save")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Bank Exporters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-900">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Bank Exporters
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {banksList.map((key) => {
                  const item = configs[key];
                  const meta = PROVIDER_METADATA[key];
                  const Icon = meta.icon;
                  const isExpanded = activeProvider === key;

                  return (
                    <div
                      key={key}
                      className={`bg-white dark:bg-zinc-950 border rounded-2xl transition-all duration-300 ${
                        isExpanded
                          ? "border-zinc-400 dark:border-zinc-700 shadow-md"
                          : "border-zinc-200 dark:border-zinc-900 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-800"
                      }`}
                    >
                      {/* Summary Row */}
                      <div
                        onClick={() => setActiveProvider(isExpanded ? null : key)}
                        className="flex items-center justify-between p-5 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl border ${meta.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                              {meta.name}
                            </h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Status: {item.is_active ? "Active" : "Inactive"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          {/* Active Toggle Switch */}
                          <button
                            onClick={() => handleActiveToggle(key)}
                            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            {item.is_active ? (
                              <ToggleRight className="h-7 w-7 text-indigo-650 dark:text-indigo-400" />
                            ) : (
                              <ToggleLeft className="h-7 w-7" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Form */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {meta.fields.map((f) => (
                              <div key={f.key} className="space-y-1.5">
                                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                  {f.label}
                                </label>
                                <input
                                  type={f.type}
                                  value={item.config[f.key] || ""}
                                  onChange={(e) => handleFieldChange(key, f.key, e.target.value)}
                                  placeholder={f.placeholder}
                                  className="w-full text-xs py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              onClick={() => handleTestConnection(key)}
                              disabled={testPending !== null}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold disabled:opacity-50 cursor-pointer text-zinc-700 dark:text-zinc-300"
                            >
                              {testPending === key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Link2 className="h-3.5 w-3.5" />
                              )}
                              {t("integration.testConnection")}
                            </button>

                            <button
                              onClick={() => handleSave(key)}
                              disabled={savePending !== null}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              {savePending === key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              {t("common.save")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
