import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7030/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const { accessToken, tenantId } = useAuthStore.getState();

    console.log("[Axios Request] Outgoing request:", {
      url: config.url,
      hasToken: !!accessToken,
      tenantId
    });

    // Set Tenant Header
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }

    // Set Auth Header
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log("[Axios Response] Intercepted error status:", error.response?.status, "for URL:", originalRequest?.url);

    // Handle 401 Unauthorized globally (Token Expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("[Axios Response] 401 detected, attempting token refresh...");
      originalRequest._retry = true;
      const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();

      if (refreshToken) {
        try {
          // Attempt token refresh
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              "X-Tenant-ID": useAuthStore.getState().tenantId || "",
            },
          });

          const { access_token } = response.data.data;
          console.log("[Axios Response] Token refreshed successfully. Retrying original request...");
          setAuth(access_token, access_token, useAuthStore.getState().user);
          originalRequest.headers["Authorization"] = `Bearer ${access_token}`;

          return api(originalRequest);
        } catch (refreshError: any) {
          console.error("[Axios Response] Token refresh request failed:", refreshError?.response?.data || refreshError.message);
          // If refresh fails, log out
          clearAuth();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      } else {
        console.warn("[Axios Response] 401 received but no refreshToken found in store. Logging out...");
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);
