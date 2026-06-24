"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface VantaProps {
  effect: "net" | "waves" | "fog" | "clouds" | "halo" | "rings" | "globe";
  options?: Record<string, any>;
  className?: string;
}

export default function VantaBackground({ effect, options = {}, className = "" }: VantaProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  // Keep options in a ref to avoid re-initializing the effect when options reference changes
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Resolve the true THREE namespace object (handling bundler default wrapping)
    const THREE_OBJ = (THREE as any).default || THREE;
    if (typeof window !== "undefined") {
      (window as any).THREE = THREE_OBJ;
    }

    let activeEffect: any = null;
    let isDestroyed = false;

    const initVanta = async () => {
      try {
        // Dynamic import of the specific vanta effect to prevent SSR errors
        let vantaModule;
        switch (effect) {
          case "net":
            vantaModule = (await import("vanta/dist/vanta.net.min" as any)).default;
            break;
          case "waves":
            vantaModule = (await import("vanta/dist/vanta.waves.min" as any)).default;
            break;
          case "fog":
            vantaModule = (await import("vanta/dist/vanta.fog.min" as any)).default;
            break;
          case "clouds":
            vantaModule = (await import("vanta/dist/vanta.clouds.min" as any)).default;
            break;
          case "halo":
            vantaModule = (await import("vanta/dist/vanta.halo.min" as any)).default;
            break;
          case "rings":
            vantaModule = (await import("vanta/dist/vanta.rings.min" as any)).default;
            break;
          case "globe":
            vantaModule = (await import("vanta/dist/vanta.globe.min" as any)).default;
            break;
          default:
            vantaModule = (await import("vanta/dist/vanta.net.min" as any)).default;
        }

        // Check if the component was unmounted or effect changed before dynamic import finished
        if (isDestroyed) {
          return;
        }

        if (vantaRef.current && vantaModule) {
          const defaultOptions = {
            el: vantaRef.current,
            THREE: THREE_OBJ,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
          };
          activeEffect = vantaModule({ ...defaultOptions, ...optionsRef.current });
          setVantaEffect(activeEffect);
        }
      } catch (err) {
        console.error("Vanta initialization error:", err);
      }
    };

    initVanta();

    return () => {
      isDestroyed = true;
      if (activeEffect) {
        activeEffect.destroy();
      }
    };
  }, [effect]);

  // Dynamically update options if they change at runtime without recreating the canvas
  useEffect(() => {
    if (vantaEffect && typeof vantaEffect.setOptions === "function") {
      vantaEffect.setOptions(options);
    }
  }, [vantaEffect, options]);

  return (
    <div
      ref={vantaRef}
      className={`absolute inset-0 z-0 w-full h-full ${className}`}
    />
  );
}

