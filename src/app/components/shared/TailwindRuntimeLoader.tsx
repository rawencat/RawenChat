"use client";

import { useEffect } from "react";

const SCRIPT_ID = "tw-runtime";
const CDN_SRC = "https://cdn.tailwindcss.com";
const TAILWIND_CONFIG = {
  mode: "jit",
  theme: { extend: {} },
  corePlugins: { preflight: false },
};

declare global {
  interface Window {
    tailwind?: { config: typeof TAILWIND_CONFIG };
  }
}

export function TailwindRuntimeLoader() {
  useEffect(() => {
    const alreadyLoaded =
      document.getElementById(SCRIPT_ID) ||
      (window as unknown as { tailwind?: unknown }).tailwind;
    if (alreadyLoaded) return;

    window.tailwind = { config: TAILWIND_CONFIG };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = CDN_SRC;
    script.onerror = () => {
      console.error("No se pudo cargar el runtime de Tailwind desde el CDN");
    };

    document.head.appendChild(script);
  }, []);

  return null;
}
