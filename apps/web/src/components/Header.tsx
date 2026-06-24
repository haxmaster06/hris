"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { 
  LayoutGrid, 
  ArrowLeft, 
  Sun, 
  Moon, 
  LogOut,
  X,
  ChevronDown,
  Shield,
  Mail,
  Building
} from "lucide-react";
import { toast } from "@/lib/toast";
import AppLauncherOverlay from "./AppLauncherOverlay";
import CompanyLogo from "./CompanyLogo";


interface HeaderProps {
  title: string;
  subtitle: string;
  backUrl?: string;
}

export default function Header({ title, subtitle, backUrl }: HeaderProps) {
  const router = useRouter();
  const { user, tenantId, companyName, companyLogoUrl, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);

  const handleLogout = () => {
    clearAuth();
    toast.success("Successfully logged out.");
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Waffle Button / App Launcher trigger */}
            {isDashboard ? (
              <div 
                className="relative flex items-center h-10 group/launcher"
                onMouseEnter={() => setToggleHovered(true)}
                onMouseLeave={() => setToggleHovered(false)}
              >
                <div 
                  className={`transition-all duration-350 ease-out flex items-center justify-center h-10 relative ${
                    toggleHovered 
                      ? "w-10 opacity-100 scale-100 mr-2" 
                      : "w-4 opacity-100 scale-100 mr-1"
                  }`}
                >
                  {/* Waffle Button - revealed on hover */}
                  <button
                    onClick={() => setLauncherOpen(true)}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 active:scale-[0.95] transition-all duration-300 absolute ${
                      toggleHovered 
                        ? "opacity-100 scale-100 pointer-events-auto" 
                        : "opacity-0 scale-50 pointer-events-none"
                    }`}
                    title="Open App Launcher (Ctrl+K)"
                  >
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </button>

                  {/* Muted pulsing indicator dot - shown when hidden */}
                  <div 
                    className={`transition-opacity duration-300 flex items-center justify-center h-10 w-4 absolute ${
                      toggleHovered ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-650 animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLauncherOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 ease-out"
                title="Open App Launcher (Ctrl+K)"
              >
                <LayoutGrid className="h-5 w-5 text-primary" />
              </button>
            )}

            {/* Company Logo Badge */}
            <CompanyLogo src={companyLogoUrl} name={companyName || "Nexus"} size="md" variant="letter" />

            {/* Back button or Module Icon */}
            {backUrl ? (
              <Link
                href={backUrl}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 ease-out"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            ) : null}

            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 leading-none">
                {title}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl hidden sm:block">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 ease-out"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User Badge */}
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer"
              title="View Account Profile"
            >
              <div className="h-6 w-6 rounded-full bg-zinc-950 text-white dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 leading-none">{user?.name}</p>
                <p className="text-[9px] text-zinc-500 capitalize mt-0.5">
                  Company: {companyName || tenantId}
                </p>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 ease-out"
              title="Log Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* User Profile Popover Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6">
          {/* Backdrop overlay to close */}
          <div 
            className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-sm transition-opacity" 
            onClick={() => setProfileOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl z-10 mt-16 animate-page-enter">
            {/* Header / Close button */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">User Account Profile</span>
              <button 
                onClick={() => setProfileOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* User Bio */}
            <div className="text-center space-y-3 mb-6">
              <div className="h-16 w-16 rounded-full bg-zinc-950 text-white dark:bg-zinc-900 dark:text-zinc-200 dark:border dark:border-zinc-800 flex items-center justify-center text-xl font-bold mx-auto shadow-md">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h4 className="font-extrabold text-md text-zinc-900 dark:text-zinc-50 leading-tight">
                  {user?.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </p>
              </div>

              {/* Roles Badge List */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {user?.roles?.map((role) => (
                  <span 
                    key={role}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20"
                  >
                    <Shield className="h-2.5 w-2.5" />
                    {role}
                  </span>
                )) || (
                  <span className="text-[10px] text-zinc-400">No Assigned Roles</span>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-900 pt-4">
              {/* Tenant Company */}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> Active Tenant:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{companyName || tenantId}</span>
              </div>

              {/* Mapped Permissions List (Collapsible Accordion) */}
              <div className="space-y-1.5">
                <button
                  onClick={() => setPermissionsExpanded(!permissionsExpanded)}
                  className="w-full flex items-center justify-between py-1 px-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:hover:bg-zinc-900 text-xs font-bold text-zinc-650 dark:text-zinc-400 transition-colors"
                >
                  <span>Active Permissions ({user?.permissions?.length || 0})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${permissionsExpanded ? "rotate-180" : ""}`} />
                </button>

                {permissionsExpanded && (
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-900 rounded-xl text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                    {user?.permissions && user.permissions.length > 0 ? (
                      user.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-1.5 py-0.5 truncate" title={perm}>
                          <span className="text-xs leading-none">🔑</span>
                          <span>{perm}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-2 text-zinc-500">No permissions found</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Action / Logout */}
            <div className="space-y-2 mt-6">
              {user?.employee_id ? (
                <Link
                  href={`/employees/${user.employee_id}`}
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  View Employee Profile
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 font-bold text-xs border border-zinc-200/50 dark:border-zinc-800 cursor-not-allowed"
                  title="System account has no linked employee profile"
                >
                  No Linked Employee Profile
                </button>
              )}

              <button
                onClick={() => { setProfileOpen(false); handleLogout(); }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-red-200/40 hover:bg-red-50/50 dark:border-red-900/20 dark:hover:bg-red-950/10 text-red-650 dark:text-red-400 font-bold text-xs hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Log Out Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Launcher Popup Overlay */}
      <AppLauncherOverlay
        isOpen={launcherOpen}
        onClose={() => setLauncherOpen(false)}
      />
    </>
  );
}
