import LoginForm from "./login-form";
import VantaBackground from "@/components/vanta/VantaBackground";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Login — Nexus HR",
  description: "Enterprise Human Resource Portal",
};

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-50 dark:bg-black font-sans">
      {/* Brand Section - Split Screen (Left side) */}
      <div className="hidden md:flex md:w-1/2 relative bg-zinc-950 dark:bg-zinc-900 justify-center items-center overflow-hidden">
        <VantaBackground 
          effect="waves" 
          options={{
            color: 0x511398,
            shininess: 35.00,
            waveHeight: 13.00,
            waveSpeed: 0.80,
            zoom: 0.91,
          }}
        />

        <div className="relative z-10 text-center max-w-md px-8 text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-sm text-white font-semibold select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            {t("login.versionBadge")}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight text-white drop-shadow-md">
            {t("login.brandTagline")}
          </h1>
          <p className="text-purple-100/90 text-md sm:text-lg leading-relaxed font-medium drop-shadow">
            {t("login.brandDescription")}
          </p>
          <div className="pt-8 border-t border-white/20 flex justify-center gap-8 text-xs text-purple-200/90 font-bold drop-shadow select-none">
            <div>PostgreSQL Schemas</div>
            <div>•</div>
            <div>Secure JWT Auth</div>
            <div>•</div>
            <div>S3 Storage Vault</div>
          </div>
        </div>
      </div>

      {/* Login Form Section (Right side) */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 md:w-1/2 bg-white dark:bg-black">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Header */}
          <div className="text-center md:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-black text-xl mb-4 shadow-lg shadow-zinc-200 dark:shadow-none select-none">
              N
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {t("login.welcome")}
            </h2>
            <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-400">
              {t("login.subtitle")}
            </p>
          </div>

          {/* Form Card */}
          <div className="mt-8 bg-white dark:bg-zinc-950 border border-transparent dark:border-zinc-900 rounded-2xl md:shadow-none p-2 sm:p-0">
            <LoginForm />
          </div>

          {/* Footer branding */}
          <div className="mt-12 text-center text-xs text-zinc-400 dark:text-zinc-600 select-none">
            {t("common.copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </div>
    </div>
  );
}
