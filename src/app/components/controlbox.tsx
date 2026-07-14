"use client";
import {
  Subtract20Regular,
  Square20Regular,
  Dismiss20Regular,
} from "@fluentui/react-icons";
import { useEffect, useState } from "react";

export default function ControlBox() {
  const [hasElectron, setHasElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electron) {
      setHasElectron(true);
    }
  }, []);

  if (!hasElectron) {
    return <></>;
  }

  const handleMinimize = async () => {
    if (window.electron) {
      await window.electron.minimize();
    }
  };

  const handleMaximize = async () => {
    if (window.electron) {
      await window.electron.maximize();
    }
  };

  const handleClose = async () => {
    if (window.electron) {
      await window.electron.close();
    }
  };

  return (
    <div className="flex items-center select-none -mr-2">
      <button
        onClick={handleMinimize}
        className="w-9 h-8 flex items-center justify-center hover:bg-[var(--elevated)] rounded-lg transition-colors cursor-pointer"
        title="Minimizar"
      >
        <Subtract20Regular className="text-[var(--text-muted)] w-4 h-4" />
      </button>
      <button
        onClick={handleMaximize}
        className="w-9 h-8 flex items-center justify-center hover:bg-[var(--elevated)] rounded-lg transition-colors cursor-pointer"
        title="Maximizar"
      >
        <Square20Regular className="text-[var(--text-muted)] w-4 h-4" />
      </button>
      <button
        onClick={handleClose}
        className="w-9 h-8 flex items-center justify-center hover:bg-[var(--error)] rounded-lg transition-colors cursor-pointer group"
        title="Cerrar"
      >
        <Dismiss20Regular className="text-[var(--text-muted)] group-hover:text-white w-4 h-4 transition-colors" />
      </button>
    </div>
  );
}
