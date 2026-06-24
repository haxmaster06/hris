import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  employee_id?: string | null;
  name: string;
  email: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User | null) => void;
  setTenantId: (tenantId: string | null) => void;
  setCompanyDetails: (companyName: string | null, companyLogoUrl: string | null) => void;
  setHydrated: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      companyName: null,
      companyLogoUrl: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      setAuth: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        }),
      setTenantId: (tenantId) => set({ tenantId }),
      setCompanyDetails: (companyName, companyLogoUrl) => set({ companyName, companyLogoUrl }),
      setHydrated: () => set({ hasHydrated: true }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          tenantId: null,
          companyName: null,
          companyLogoUrl: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "nexus-hr-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tenantId: state.tenantId,
        companyName: state.companyName,
        companyLogoUrl: state.companyLogoUrl,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      }
    }
  )
);
