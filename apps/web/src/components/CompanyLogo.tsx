"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";

interface CompanyLogoProps {
  src?: string | null;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "letter";
}

export default function CompanyLogo({
  src,
  name,
  className = "",
  style,
  size = "md",
  variant = "letter"
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs rounded-lg",
    md: "h-10 w-10 text-sm rounded-xl",
    lg: "h-12 w-12 text-base rounded-xl",
    xl: "h-16 w-16 text-lg rounded-2xl"
  };

  const selectedSizeClass = sizeClasses[size];
  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : "C";

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={`${selectedSizeClass} object-contain bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${className}`}
        style={style}
      />
    );
  }

  if (variant === "letter") {
    return (
      <div
        className={`${selectedSizeClass} flex items-center justify-center bg-primary text-white font-black uppercase ${className}`}
        style={style}
        title={name}
      >
        {firstLetter}
      </div>
    );
  }

  return (
    <div
      className={`${selectedSizeClass} flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold ${className}`}
      style={style}
      title={name}
    >
      <Building2 className={size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"} />
    </div>
  );
}
