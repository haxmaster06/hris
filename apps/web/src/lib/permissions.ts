import { User } from "@/stores/authStore";

export function isESS(user: User | null): boolean {
  if (!user) return true;
  const roles = user.roles || [];
  // Return true if they have the "Employee" role and do not have administrative roles
  return roles.includes("Employee") && !roles.includes("Super Admin") && !roles.includes("HR Manager");
}

export function canAccessModule(user: User | null, module: string): boolean {
  if (!user) return false;
  return user.permissions?.some(p => p.startsWith(module)) ?? false;
}
