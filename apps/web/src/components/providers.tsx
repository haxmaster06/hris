"use client";

import { useEffect, useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useThemeStore } from "@/stores/themeStore";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const themeMode = useThemeStore((state) => state.theme);

  // Sync theme with document class on mount and theme change
  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeMode]);

  // Create MUI theme aligned with application design styles
  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: themeMode === "dark" ? "dark" : "light",
        primary: {
          main: "#2563eb", // brand primary blue
        },
        background: {
          default: themeMode === "dark" ? "#000000" : "#fafafa",
          paper: themeMode === "dark" ? "#09090b" : "#ffffff",
        },
      },
      typography: {
        fontFamily: "var(--font-sans), sans-serif",
      },
    });
  }, [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={muiTheme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
