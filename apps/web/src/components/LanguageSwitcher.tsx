"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocaleStore } from "@/stores/localeStore";
import { toast } from "@/lib/toast";

export default function LanguageSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { locale, setLocale } = useLocaleStore();

  const handleToggle = () => {
    const nextLocale = locale === "en" ? "id" : "en";
    
    startTransition(() => {
      // 1. Set the cookie next-intl expects
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      
      // 2. Update Zustand store state
      setLocale(nextLocale);
      
      // 3. Inform user with toast
      const successMessage = nextLocale === "en" 
        ? "Language changed to English" 
        : "Bahasa diubah ke Bahasa Indonesia";
      toast.success(successMessage);

      // 4. Refresh the page to trigger server component re-rendering
      router.refresh();
      
      // In Next.js sometimes router.refresh() is not enough to reload layout-level server data,
      // a clean reload works perfectly to ensure the entire page updates.
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="h-10 px-3 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:scale-[1.05] active:scale-[0.95] transition-all duration-200 ease-out text-xs font-bold disabled:opacity-50 select-none cursor-pointer"
      title={locale === "en" ? "Ubah ke Bahasa Indonesia" : "Switch to English"}
    >
      <span>{locale === "en" ? "🇺🇸 EN" : "🇮🇩 ID"}</span>
    </button>
  );
}
