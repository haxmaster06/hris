"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { Loader2, KeyRound, Mail, Building2 } from "lucide-react";
import { TextField, Button, Box, Typography, InputAdornment, FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";
import CompanyLogo from "@/components/CompanyLogo";


const loginSchema = zod.object({
  tenantId: zod.string().min(1, "Please select a company"),
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

type LoginInput = zod.infer<typeof loginSchema>;

interface TenantOption {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
}

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth, setTenantId, setCompanyDetails } = useAuthStore();

  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isTenantsLoading, setIsTenantsLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<TenantOption | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Fetch active tenants list from central DB on mount
  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await api.get("/tenants/list");
        setTenants(response.data.data || []);
      } catch (err: any) {
        console.error("Failed to fetch tenants:", err);
        toast.error("Failed to load active tenants from database.");
      } finally {
        setIsTenantsLoading(false);
      }
    }
    fetchTenants();
  }, []);

  const tenantIdValue = watch("tenantId");

  useEffect(() => {
    if (tenantIdValue) {
      const match = tenants.find((t) => t.slug === tenantIdValue);
      setSelectedCompany(match || null);
    } else {
      setSelectedCompany(null);
    }
  }, [tenantIdValue, tenants]);

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setTenantId(data.tenantId); // Set tenant ID in store for interceptor

    try {
      // 1. Authenticate with backend
      const loginResponse = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { access_token, refresh_token } = loginResponse.data.data;

      // Temporary setAuth to load me endpoint
      setAuth(access_token, refresh_token || access_token, null);

      // 2. Fetch full user profile (with roles/permissions)
      const meResponse = await api.get("/auth/me");
      const userProfile = meResponse.data.data;

      // Save company details to store
      const activeCompany = tenants.find(t => t.slug === data.tenantId);
      if (activeCompany) {
        setCompanyDetails(activeCompany.name, activeCompany.logo_url || null);
      }

      // 3. Save completed credentials to store
      setAuth(access_token, refresh_token || access_token, {
        id: userProfile.id,
        employee_id: userProfile.employee_id,
        name: userProfile.name,
        email: userProfile.email,
        roles: userProfile.roles,
        permissions: userProfile.permissions,
      });

      toast.success("Welcome back! Login successful.");
      router.push("/dashboard");
    } catch (error: any) {
      setIsLoading(false);
      setTenantId(null); // Reset tenant on failure
      setCompanyDetails(null, null);
      const errorMsg = error.response?.data?.message || "Invalid credentials or company mismatch.";
      toast.error(errorMsg);
    }
  };

  // Extract ref from register for proper MUI inputRef assignment
  const { ref: tenantIdRef, ...tenantIdRegister } = register("tenantId");
  const { ref: emailRef, ...emailRegister } = register("email");
  const { ref: passwordRef, ...passwordRegister } = register("password");

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Selected Company Logo Header */}
      {selectedCompany && (
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 2, 
            p: 2, 
            borderRadius: "14px", 
            border: "1px solid", 
            borderColor: "divider",
            bgcolor: "action.hover",
            mb: 1
          }}
        >
          <CompanyLogo 
            src={selectedCompany.logo_url} 
            name={selectedCompany.name} 
            size="md" 
            variant="icon" 
            className="text-primary" 
          />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {selectedCompany.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Corporate HR Portal
            </Typography>
          </Box>
        </Box>
      )}

      {/* Tenant Input (Select Dropdown) */}
      <FormControl fullWidth error={!!errors.tenantId}>
        <InputLabel id="tenant-select-label">Select Company</InputLabel>
        <Select
          {...tenantIdRegister}
          inputRef={tenantIdRef}
          labelId="tenant-select-label"
          id="tenant-select"
          defaultValue=""
          label="Select Company"
          disabled={isTenantsLoading}
          sx={{
            borderRadius: "10px",
          }}
          startAdornment={
            <InputAdornment position="start" sx={{ mr: 1 }}>
              <Building2 className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            </InputAdornment>
          }
        >
          <MenuItem value="">
            <em>{isTenantsLoading ? "Loading companies..." : "Please select a company"}</em>
          </MenuItem>
          {tenants.map((tenant) => (
            <MenuItem key={tenant.id} value={tenant.slug}>
              {tenant.name} ({tenant.slug})
            </MenuItem>
          ))}
        </Select>
        {errors.tenantId && (
          <FormHelperText>{errors.tenantId.message}</FormHelperText>
        )}
      </FormControl>

      {/* Email Input */}
      <TextField
        {...emailRegister}
        inputRef={emailRef}
        label="Email Address"
        type="email"
        placeholder="admin@nexushr.local"
        fullWidth
        variant="outlined"
        error={!!errors.email}
        helperText={errors.email?.message}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Mail className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              </InputAdornment>
            ),
          }
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
          }
        }}
      />

      {/* Password Input */}
      <TextField
        {...passwordRegister}
        inputRef={passwordRef}
        label="Password"
        type="password"
        placeholder="••••••••"
        fullWidth
        variant="outlined"
        error={!!errors.password}
        helperText={errors.password?.message}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <KeyRound className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              </InputAdornment>
            ),
          }
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
          }
        }}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        variant="contained"
        color="primary"
        size="large"
        sx={{
          py: 1.2,
          textTransform: "none",
          borderRadius: "10px",
          fontWeight: 700,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          }
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Signing you in...
          </Box>
        ) : (
          "Sign In"
        )}
      </Button>
    </Box>
  );
}
