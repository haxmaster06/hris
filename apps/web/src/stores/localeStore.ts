import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/i18n/routing";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "id" as Locale, // Default: Bahasa Indonesia
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "nexus-hr-locale",
    }
  )
);
