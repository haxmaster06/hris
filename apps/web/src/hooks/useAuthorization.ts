"use client";

import { useAuthStore } from "@/stores/authStore";

export function useAuthorization() {
  const { user } = useAuthStore();
  
  const roles = user?.roles || [];
  const permissions = user?.permissions || [];
  
  const isSuperAdmin = roles.includes("Super Admin");
  const isHRManager = roles.includes("HR Manager");
  const isAdmin = isSuperAdmin || isHRManager;
  const isEmployee = roles.includes("Employee");
  const employeeId = user?.employee_id || null;

  const hasRole = (roleName: string) => roles.includes(roleName);
  
  const hasPermission = (permissionName: string) => permissions.includes(permissionName);

  // Check if user is accessing their own profile/records
  const isSelf = (targetEmployeeId: string | null | undefined) => {
    if (!targetEmployeeId || !employeeId) return false;
    return employeeId === targetEmployeeId;
  };

  return {
    user,
    roles,
    permissions,
    isSuperAdmin,
    isHRManager,
    isAdmin,
    isEmployee,
    employeeId,
    hasRole,
    hasPermission,
    isSelf
  };
}
