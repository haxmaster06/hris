"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  ShieldAlert, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Check,
  ChevronDown,
  ChevronUp,
  Plus
} from "lucide-react";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { useTranslations, useLocale } from "next-intl";

interface Role {
  id: string;
  name: string;
  permissions?: string[];
}

interface UserData {
  id: string;
  name: string;
  email: string;
  roles: string[];
  created_at: string;
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <UserManagementPageContent />
    </Suspense>
  );
}

function UserManagementPageContent() {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  
  // Authorization Guard: Super Admin or HR Manager only
  const isAdmin = user?.roles?.includes("Super Admin") || user?.roles?.includes("HR Manager");

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  // User States
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // User Add Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Employee"]);

  // User Edit Form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editPin, setEditPin] = useState("");

  // Role CRUD States
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Check auth
  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!isAdmin) {
      router.push("/dashboard");
      toast.error(t("denied.header") + ". " + t("denied.description"));
    }
  }, [isAuthenticated, isAdmin, router, t]);

  // Fetch Users
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users", search, page],
    queryFn: () => 
      api.get("/users", { params: { search, page, per_page: 10 } }).then((res) => res.data.data),
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch Roles
  const { data: roles = [], isLoading: isRolesLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((res) => res.data.data),
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch Permissions list
  const { data: permissionsList = [], isLoading: isPermissionsLoading } = useQuery<any[]>({
    queryKey: ["permissions"],
    queryFn: () => api.get("/permissions").then((res) => res.data.data),
    enabled: isAuthenticated && isAdmin && activeTab === "roles",
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("users.toast.createSuccess"));
      setShowAddModal(false);
      resetAddForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || t("users.toast.createFailed");
      toast.error(msg);
    }
  });

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("users.toast.updateSuccess"));
      setShowEditModal(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || t("users.toast.updateFailed");
      toast.error(msg);
    }
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("users.toast.deleteSuccess"));
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || t("users.toast.deleteFailed");
      toast.error(msg);
    }
  });

  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: { name: string; permissions: string[] }) => api.post("/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("roles.toast.createSuccess"));
      setShowRoleModal(false);
      resetRoleForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || t("roles.toast.createFailed");
      toast.error(msg);
    }
  });

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; permissions: string[] } }) => 
      api.put(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("roles.toast.updateSuccess"));
      setShowRoleModal(false);
      setSelectedRole(null);
      resetRoleForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || t("roles.toast.updateFailed");
      toast.error(msg);
    }
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("roles.toast.deleteSuccess"));
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || t("roles.toast.deleteFailed");
      toast.error(msg);
    }
  });

  if (!mounted || !isAuthenticated) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col">
        <Header 
          title={t("denied.title")} 
          subtitle={t("denied.subtitle")} 
          backUrl="/dashboard"
        />
        <main className="flex-1 flex flex-col justify-center items-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">{t("denied.header")}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("denied.description")}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-lg text-xs font-bold hover:scale-[1.02] transition-all"
          >
            {t("denied.backBtn")}
          </button>
        </main>
      </div>
    );
  }

  const resetAddForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setSelectedRoles(["Employee"]);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      name,
      email,
      password,
      roles: selectedRoles
    });
  };

  const openEditModal = (userData: UserData) => {
    setSelectedUser(userData);
    setEditName(userData.name);
    setEditEmail(userData.email);
    setEditPassword("");
    setEditRoles(userData.roles);
    setEditPin("");
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const requiresPin = editRoles.includes("Super Admin") || selectedUser.roles.includes("Super Admin");
    if (requiresPin && !editPin.trim()) {
      toast.error(t("users.toast.pinRequired"));
      return;
    }

    const payload: any = {
      name: editName,
      email: editEmail,
      roles: editRoles
    };

    if (editPassword) {
      payload.password = editPassword;
    }

    if (requiresPin) {
      payload.super_admin_pin = editPin;
    }

    updateUserMutation.mutate({
      id: selectedUser.id,
      data: payload
    });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(t("users.toast.confirmDelete", { name }))) {
      deleteUserMutation.mutate(id);
    }
  };

  const toggleRoleSelection = (roleName: string, isEdit: boolean) => {
    const list = isEdit ? editRoles : selectedRoles;
    const setList = isEdit ? setEditRoles : setSelectedRoles;

    if (list.includes(roleName)) {
      // Keep at least one role
      if (list.length > 1) {
        setList(list.filter(r => r !== roleName));
      } else {
        toast.warning(t("users.toast.roleWarning"));
      }
    } else {
      setList([...list, roleName]);
    }
  };

  // Role Form Helpers
  const resetRoleForm = () => {
    setRoleName("");
    setRolePermissions([]);
    setOpenCategories({});
  };

  const openAddRoleModal = () => {
    setSelectedRole(null);
    resetRoleForm();
    setShowRoleModal(true);
  };

  const openEditRoleModal = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRolePermissions(role.permissions || []);
    setOpenCategories({});
    setShowRoleModal(true);
  };

  const handleDeleteRole = (id: string, name: string) => {
    if (confirm(t("roles.toast.confirmDelete", { name }))) {
      deleteRoleMutation.mutate(id);
    }
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error(t("roles.toast.roleNameRequired"));
      return;
    }

    const payload = {
      name: roleName,
      permissions: rolePermissions
    };

    if (selectedRole?.id) {
      updateRoleMutation.mutate({ id: selectedRole.id, data: payload });
    } else {
      createRoleMutation.mutate(payload);
    }
  };

  const togglePermission = (permissionName: string) => {
    if (roleName === "Super Admin") return; // Super admin always gets all permissions

    if (rolePermissions.includes(permissionName)) {
      setRolePermissions(rolePermissions.filter(p => p !== permissionName));
    } else {
      setRolePermissions([...rolePermissions, permissionName]);
    }
  };

  const toggleCategoryOpen = (categoryKey: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Spatie Permission Helper Utilities
  const getPermissionEmoji = (name: string): string => {
    if (name.includes("create") || name.includes("store")) return "➕";
    if (name.includes("read") || name.includes("show") || name.includes("index") || name.includes("me") || name.includes("history")) return "👁️";
    if (name.includes("update") || name.includes("edit") || name.includes("sync")) return "✏️";
    if (name.includes("delete") || name.includes("destroy") || name.includes("force")) return "🗑️";
    if (name.includes("report")) return "📊";
    if (name.includes("execute")) return "⚡";
    if (name.includes("approve")) return "✅";
    return "⚙️";
  };

  const formatPermissionLabel = (name: string): string => {
    const parts = name.split(".");
    
    // Khusus untuk format report.xxx
    if (parts[0] === "report" && parts.length === 2) {
      const reportType = parts[1];
      const isId = locale === "id";
      const emoji = "📊";
      if (isId) {
        let typeId = reportType;
        if (reportType === "employee") typeId = "Karyawan";
        else if (reportType === "attendance") typeId = "Kehadiran";
        else if (reportType === "leave") typeId = "Cuti";
        return `${emoji} Laporan ${typeId}`;
      } else {
        const typeEn = reportType.charAt(0).toUpperCase() + reportType.slice(1);
        return `${emoji} ${typeEn} Report`;
      }
    }

    const action = parts[parts.length - 1];
    const entity = parts[parts.length - 2] || parts[0];
    const isId = locale === "id";
    
    // Indonesian translations for typical actions
    const getIndonesianAction = (act: string): string => {
      switch (act) {
        case "create": case "store": return "Tambah";
        case "read": case "show": case "index": case "me": case "history": return "Lihat";
        case "update": case "edit": case "sync": return "Ubah";
        case "delete": case "destroy": case "force": return "Hapus";
        case "report": return "Laporan";
        case "execute": return "Jalankan";
        case "approve": return "Setujui";
        default: return act.charAt(0).toUpperCase() + act.slice(1);
      }
    };

    const getIndonesianEntity = (ent: string): string => {
      switch (ent) {
        case "user": case "users": return "Pengguna";
        case "role": case "roles": return "Peran";
        case "permission": case "permissions": return "Hak Akses";
        case "company": case "companies": return "Perusahaan";
        case "branch": case "branches": return "Cabang";
        case "department": case "departments": return "Departemen";
        case "division": case "divisions": return "Divisi";
        case "position": case "positions": return "Posisi Jabatan";
        case "grade": case "grades": return "Golongan Gaji";
        case "cost_center": case "cost_centers": return "Pusat Biaya";
        case "employee": case "employees": return "Karyawan";
        case "education": case "educations": return "Pendidikan";
        case "experience": case "experiences": return "Pengalaman";
        case "family": case "families": return "Keluarga";
        case "career": case "careers": return "Riwayat Karir";
        case "shift": case "shifts": return "Shift Kerja";
        case "attendance": case "attendances": return "Kehadiran";
        case "leave": case "leaves": return "Cuti";
        case "leave_type": case "leave_types": return "Tipe Cuti";
        case "document": case "documents": return "Dokumen";
        case "document_category": case "document_categories": return "Kategori Dokumen";
        case "report": case "reports": return "Laporan";
        case "recruitment": return "Rekrutmen";
        case "vacancy": case "vacancies": return "Lowongan Kerja";
        case "candidate": case "candidates": return "Kandidat";
        case "pipeline": return "Kanban Rekrutmen";
        case "training": case "trainings": return "Pelatihan";
        case "certification": case "certifications": return "Sertifikasi";
        case "payroll": return "Penggajian (Payroll)";
        case "definitions": return "Definisi Alur Kerja";
        case "instances": return "Alur Persetujuan";
        case "logs": return "Log Perubahan";
        case "login_history": case "login_histories": return "Riwayat Login";
        case "application": case "applications": return "Lamaran Pekerjaan";
        case "interview": case "interviews": return "Wawancara";
        case "approval": case "approvals": return "Persetujuan";
        default: return ent.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      }
    };

    const emoji = getPermissionEmoji(name);
    
    if (isId) {
      const actId = getIndonesianAction(action);
      const entId = getIndonesianEntity(entity);
      return `${emoji} ${actId} ${entId}`;
    }

    const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
    const formattedEntity = entity.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return `${emoji} ${formattedAction} ${formattedEntity}`;
  };

  const getPermissionCategory = (name: string): { key: string; label: string } => {
    const prefix = name.split(".")[0];
    const isId = locale === "id";
    switch (prefix) {
      case "core":
        return { key: "core", label: isId ? "🔒 Keamanan Sistem & Akses Pengguna (IAM)" : "🔒 System Security & User Access (IAM)" };
      case "organization":
        return { key: "organization", label: isId ? "🏢 Struktur Organisasi (Legal, Cabang, Dept)" : "🏢 Organization Structure (Legal, Branch, Dept)" };
      case "employee":
        return { key: "employee", label: isId ? "👥 Direktori Karyawan & Riwayat Karir" : "👥 Employee Directory & Career History" };
      case "shift":
      case "employee_shift":
      case "attendance":
        return { key: "attendance", label: isId ? "⏰ Log Kehadiran, Jadwal & Shift" : "⏰ Attendance Logs, Schedules & Shifts" };
      case "leave_type":
      case "leave":
        return { key: "leave", label: isId ? "📅 Saldo Cuti & Alur Persetujuan" : "📅 Leave Balances & Approval Flow" };
      case "document_category":
      case "document":
        return { key: "document", label: isId ? "📁 Kategori Dokumen & Penyimpanan Aman" : "📁 Document Categories & Secure Storage" };
      case "report":
        return { key: "report", label: isId ? "📊 Laporan Analitik & Ekspor PDF/CSV" : "📊 Analytics & PDF/CSV Export Reports" };
      case "recruitment":
        return { key: "recruitment", label: isId ? "💼 Lowongan Pekerjaan & Kandidat Rekrutmen" : "💼 Recruitment Job Vacancies & Candidates" };
      case "training":
      case "certification":
        return { key: "training", label: isId ? "🎓 Program Pelatihan & Pelacakan Lisensi" : "🎓 Training Programs & License Tracking" };
      default:
        return { key: "other", label: isId ? "⚙️ Pengaturan Konfigurasi Sistem" : "⚙️ System Configuration Settings" };
    }
  };

  // Group permissions list for checklist view
  const groupedPermissions: Record<string, { label: string; permissions: any[] }> = {};
  permissionsList.forEach((perm: any) => {
    const cat = getPermissionCategory(perm.name);
    if (!groupedPermissions[cat.key]) {
      groupedPermissions[cat.key] = { label: cat.label, permissions: [] };
    }
    groupedPermissions[cat.key].permissions.push(perm);
  });

  const userList = usersData?.data || [];
  const meta = usersData?.meta || { current_page: 1, last_page: 1, total: 0 };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header 
        title={t("pageTitle")} 
        subtitle={t("subtitle")}
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Tab switcher */}
        <div className="border-b border-zinc-200 dark:border-zinc-900">
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "users"
                  ? "border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              👤 {t("tabs.users")}
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "roles"
                  ? "border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              🛡️ {t("tabs.roles")}
            </button>
          </div>
        </div>

        {activeTab === "users" ? (
          <div className="space-y-6">
            {/* Table Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={t("users.searchPlaceholder")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 pl-10 pr-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto h-10 px-4 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
              >
                <UserPlus className="h-4 w-4" />
                {t("users.addUser")}
              </button>
            </div>

            {/* Datatable */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
              {isUsersLoading ? (
                <div className="flex items-center justify-center py-16 text-zinc-500">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>{t("users.loading")}</span>
                </div>
              ) : userList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 font-bold bg-zinc-50/50 dark:bg-zinc-955/50">
                        <th className="px-6 py-4">{t("users.table.name")}</th>
                        <th className="px-6 py-4">{t("users.table.email")}</th>
                        <th className="px-6 py-4">{t("users.table.roles")}</th>
                        <th className="px-6 py-4">{t("users.table.dateAdded")}</th>
                        <th className="px-6 py-4 text-right">{t("users.table.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                      {userList.map((usr: UserData) => (
                        <tr key={usr.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-zinc-950 dark:bg-zinc-800 text-white flex items-center justify-center text-[10px] font-bold">
                              {usr.name.charAt(0).toUpperCase()}
                            </div>
                            {usr.name}
                          </td>
                          <td className="px-6 py-4 text-zinc-650 dark:text-zinc-400 font-mono">{usr.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {usr.roles.map((role) => (
                                <span 
                                  key={role} 
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                                    ${role === "Super Admin" ? "bg-red-150 text-red-800 dark:bg-red-950/40 dark:text-red-300" : ""}
                                    ${role === "HR Manager" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" : ""}
                                    ${role === "Employee" ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400" : ""}
                                  `}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-500">
                            {new Date(usr.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditModal(usr)}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                                title={tCommon("edit")}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(usr.id, usr.name)}
                                disabled={usr.id === user?.id || usr.roles.includes("Super Admin")}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-450 hover:text-red-500 hover:border-red-200/50 dark:hover:border-red-900/30 transition-colors disabled:opacity-40"
                                title={usr.roles.includes("Super Admin") ? "Super Admin cannot be deleted" : tCommon("delete")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-450 dark:text-zinc-650 flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-zinc-300" />
                  <span>{t("users.noResults")}</span>
                </div>
              )}
            </div>

            {/* Pagination footer */}
            {meta.last_page > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Showing page {page} of {meta.last_page}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Roles & Permissions Tab
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-100">{t("roles.title")}</h3>
              <button
                onClick={openAddRoleModal}
                className="h-10 px-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:scale-[1.01] transition-all"
              >
                <Plus className="h-4 w-4" />
                {t("roles.addRole")}
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
              {isRolesLoading ? (
                <div className="flex items-center justify-center py-16 text-zinc-500">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>{t("roles.loading")}</span>
                </div>
              ) : roles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 font-bold bg-zinc-50/50 dark:bg-zinc-955/50">
                        <th className="px-6 py-4">{t("roles.table.name")}</th>
                        <th className="px-6 py-4">{t("roles.table.totalPermissions")}</th>
                        <th className="px-6 py-4">{t("roles.table.assigned")}</th>
                        <th className="px-6 py-4 text-right">{tCommon("actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                      {roles.map((role: Role) => {
                        const isSystem = ["Super Admin", "HR Manager", "Employee"].includes(role.name);
                        return (
                          <tr key={role.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                              <ShieldCheck className={`h-4 w-4 ${role.name === "Super Admin" ? "text-red-500" : "text-zinc-400"}`} />
                              {role.name}
                              {isSystem && (
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[8px] text-zinc-500 font-semibold tracking-wider uppercase ml-1.5">
                                  {t("roles.systemDefault")}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-zinc-655 dark:text-zinc-400 font-bold">
                              {role.name === "Super Admin" ? t("roles.fullAccess") : `${role.permissions?.length || 0} ${t("roles.table.totalPermissions")}`}
                            </td>
                            <td className="px-6 py-4 text-zinc-500">
                              <div className="flex flex-wrap gap-1 max-w-lg">
                                {role.name === "Super Admin" ? (
                                  <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-955/10 text-[9px] text-red-600 font-bold uppercase tracking-wider">
                                    {t("roles.fullAccessBadge")}
                                  </span>
                                ) : role.permissions && role.permissions.length > 0 ? (
                                  role.permissions.slice(0, 5).map(p => (
                                    <span key={p} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-[9px] font-mono text-zinc-600 dark:text-zinc-400">
                                      {p}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-zinc-400 italic">{t("roles.noPermissions")}</span>
                                )}
                                {role.name !== "Super Admin" && role.permissions && role.permissions.length > 5 && (
                                  <span className="text-[10px] text-zinc-400 font-semibold self-center ml-1">
                                    {t("roles.morePermissions", { count: role.permissions.length - 5 })}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => openEditRoleModal(role)}
                                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                                  title={tCommon("edit")}
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(role.id, role.name)}
                                  disabled={isSystem}
                                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-450 hover:text-red-500 hover:border-red-200/50 dark:hover:border-red-900/30 transition-colors disabled:opacity-40"
                                  title={isSystem ? "System roles cannot be deleted" : tCommon("delete")}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-500">
                  <span>{t("roles.noRoles")}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-xl overflow-hidden scale-up text-zinc-900 dark:text-zinc-100">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
              <h3 className="font-bold text-sm">{t("users.modalAdd.title")}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">{t("users.modalAdd.name")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">{t("users.modalAdd.email")}</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">{t("users.modalAdd.password")}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">{t("users.modalAdd.roles")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRoleSelection(role.name, false)}
                      className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-all
                        ${selectedRoles.includes(role.name)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-zinc-50/50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400"
                        }`}
                    >
                      {role.name}
                      {selectedRoles.includes(role.name) && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-lg border border-zinc-250 dark:border-zinc-800 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                >
                  {t("users.modalAdd.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1 h-10 bg-primary hover:bg-primary/95 disabled:bg-zinc-855 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  {createUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("users.modalAdd.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-xl overflow-hidden scale-up text-zinc-900 dark:text-zinc-100">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
              <h3 className="font-bold text-sm">{t("users.modalEdit.title")}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-zinc-650">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">{t("users.modalEdit.name")}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">{t("users.modalEdit.email")}</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-10 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">{t("users.modalEdit.password")}</label>
                  <span className="text-[9px] text-zinc-500">{t("users.modalEdit.passwordHint")}</span>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full h-10 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">{t("users.modalEdit.roles")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRoleSelection(role.name, true)}
                      className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-all
                        ${editRoles.includes(role.name)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-zinc-50/50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400"
                        }`}
                    >
                      {role.name}
                      {editRoles.includes(role.name) && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {(editRoles.includes("Super Admin") || selectedUser?.roles?.includes("Super Admin")) && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-red-500 uppercase block">{t("users.modalEdit.pin")}</label>
                  <input
                    type="password"
                    required
                    placeholder={t("users.modalEdit.pinPlaceholder")}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full h-10 bg-red-50/50 dark:bg-red-955/10 border border-red-200 dark:border-red-900 rounded-lg px-3 text-xs focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-mono"
                  />
                  <span className="text-[9px] text-red-500 block">
                    {t("users.modalEdit.pinHint")}
                  </span>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-10 rounded-lg border border-zinc-250 dark:border-zinc-800 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                >
                  {t("users.modalEdit.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="flex-1 h-10 bg-primary hover:bg-primary/95 disabled:bg-zinc-855 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  {updateUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("users.modalEdit.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Add/Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-xl overflow-hidden scale-up text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">
                {selectedRole ? t("roles.modal.editTitle", { name: selectedRole.name }) : t("roles.modal.addTitle")}
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-zinc-400 hover:text-zinc-650">✕</button>
            </div>

            <form onSubmit={handleRoleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">{t("roles.modal.roleName")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Finance Officer"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    disabled={selectedRole !== null && ["Super Admin", "HR Manager", "Employee"].includes(selectedRole.name)}
                    className="w-full h-10 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                  />
                  {selectedRole !== null && ["Super Admin", "HR Manager", "Employee"].includes(selectedRole.name) && (
                    <span className="text-[9px] text-zinc-455 block">
                      {t("roles.modal.nameHint")}
                    </span>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                      {t("roles.modal.permissionsLabel")}
                    </label>
                    {roleName === "Super Admin" && (
                      <span className="text-[9px] text-red-500 font-bold">
                        ★ Super Admin automatically retains full access
                      </span>
                    )}
                  </div>

                  {isPermissionsLoading ? (
                    <div className="flex items-center justify-center py-6 text-zinc-400 text-xs">
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5 text-primary" />
                      {t("roles.modal.loadingPermissions")}
                    </div>
                  ) : roleName === "Super Admin" ? (
                    <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-955/10 border border-red-200/50 dark:border-red-900/30 text-xs text-red-700 dark:text-red-300">
                      {t("roles.modal.superAdminNotice")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.keys(groupedPermissions).map((catKey) => {
                        const cat = groupedPermissions[catKey];
                        const isOpen = openCategories[catKey] || false;
                        
                        // Count active selected permissions in this category
                        const categoryPermissions = cat.permissions.map(p => p.name);
                        const selectedInCat = rolePermissions.filter(rp => categoryPermissions.includes(rp)).length;

                        return (
                          <div key={catKey} className="border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleCategoryOpen(catKey)}
                              className="w-full px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex justify-between items-center text-xs font-bold transition-colors"
                            >
                              <span className="flex items-center gap-1.5 text-left">
                                {cat.label}
                                {selectedInCat > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold shrink-0">
                                    {t("roles.modal.selectedCount", { count: selectedInCat })}
                                  </span>
                                )}
                              </span>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />}
                            </button>

                            {isOpen && (
                              <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 flex flex-col gap-2">
                                {cat.permissions.map((perm) => {
                                  const isSelected = rolePermissions.includes(perm.name);
                                  return (
                                    <label
                                      key={perm.id}
                                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer select-none text-xs font-semibold transition-all
                                        ${isSelected
                                          ? "bg-primary/10 border-primary text-primary"
                                          : "bg-zinc-50/20 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-900 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50/50"
                                        }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => togglePermission(perm.name)}
                                        className="sr-only"
                                      />
                                      <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition-colors
                                        ${isSelected ? "bg-primary border-primary text-white" : "border-zinc-300 dark:border-zinc-800"}`}
                                      >
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <span className="flex-1 whitespace-normal break-all select-none">
                                        {formatPermissionLabel(perm.name)}
                                      </span>
                                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-505 select-all shrink-0">
                                        {perm.name}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-zinc-200 dark:border-zinc-900 shrink-0 flex gap-3 bg-zinc-50/50 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 h-10 rounded-lg border border-zinc-250 dark:border-zinc-800 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-zinc-700 dark:text-zinc-300"
                >
                  {t("roles.modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                  className="flex-1 h-10 bg-primary hover:bg-primary/95 disabled:bg-zinc-855 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  {createRoleMutation.isPending || updateRoleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("roles.modal.save")
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
