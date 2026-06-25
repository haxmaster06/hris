"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Loader2, AlertTriangle, LogOut } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hasHydrated, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // States untuk Idle Timeout
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 menit hitung mundur (300 detik)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Batas Idle default: 25 menit sebelum peringatan (1500 detik) + 5 menit hitung mundur (300 detik) = total 30 menit
  const getTimeoutSettings = useCallback(() => {
    if (typeof window !== "undefined") {
      const devTimeout = localStorage.getItem("DEV_IDLE_TIMEOUT"); // unit: detik
      if (devTimeout) {
        const total = parseInt(devTimeout, 10);
        // Jika devTimeout disetel 15 detik: 10 detik idle + 5 detik countdown
        const warningTime = Math.max(5, Math.ceil(total * 0.6));
        const countdownTime = total - warningTime;
        return { warningTime, countdownTime };
      }
    }
    return { warningTime: 1500, countdownTime: 300 };
  }, []);

  const resetIdleTimer = useCallback(() => {
    // Bersihkan timers lama
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setShowWarning(false);

    if (!isAuthenticated) return;

    const { warningTime, countdownTime } = getTimeoutSettings();
    setCountdown(countdownTime);

    // Set timer baru untuk memunculkan modal peringatan
    timerRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Mulai hitung mundur modal
      let currentCountdown = countdownTime;
      countdownIntervalRef.current = setInterval(() => {
        currentCountdown -= 1;
        setCountdown(currentCountdown);

        if (currentCountdown <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleAutoLogout();
        }
      }, 1000);

    }, warningTime * 1000);
  }, [isAuthenticated, getTimeoutSettings]);

  const handleAutoLogout = useCallback(() => {
    clearAuth();
    setShowWarning(false);
    router.push("/login");
  }, [clearAuth, router]);

  // Daftarkan event listener aktivitas user
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && mounted) {
      const events = ["mousemove", "keypress", "mousedown", "scroll", "touchstart"];
      
      // Reset timer saat ada aktivitas, tapi JANGAN reset jika modal warning sedang terbuka
      const handleActivity = () => {
        if (!showWarning) {
          resetIdleTimer();
        }
      };

      events.forEach(e => window.addEventListener(e, handleActivity));
      
      // Jalankan inisialisasi pertama kali
      resetIdleTimer();

      return () => {
        events.forEach(e => window.removeEventListener(e, handleActivity));
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    }
  }, [isAuthenticated, mounted, showWarning, resetIdleTimer]);

  const isPublicPath = 
    pathname === "/login" || 
    pathname.startsWith("/high-level-control") || 
    pathname.startsWith("/landlord");

  // Render loading state if store hasn't hydrated or we aren't client-mounted yet
  if (!hasHydrated || !mounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flash of page content if protected route is being accessed while unauthenticated
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  return (
    <>
      {children}

      {/* Modal Warning Idle Timeout */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-6 text-center animate-scale-in">
            <div className="mx-auto bg-amber-50 dark:bg-amber-950/20 p-4 rounded-full w-fit">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Sesi Anda Akan Berakhir</h3>
              <p className="text-xs text-zinc-500">
                Sistem mendeteksi tidak ada aktivitas. Anda akan dikeluarkan secara otomatis dalam waktu:
              </p>
              <div className="text-3xl font-black font-mono text-amber-500 py-2">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAutoLogout}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-4 w-4" /> Keluar Sekarang
              </button>
              <button
                onClick={() => {
                  resetIdleTimer();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 cursor-pointer"
              >
                Tetap Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
