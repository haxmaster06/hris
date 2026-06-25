import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "id", // Default: Bahasa Indonesia
  localePrefix: "never", // No URL prefix — cookie-based only
});

export type Locale = (typeof routing.locales)[number];
