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
    if (typeof window !== 'undefined' && window.electron) {
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
    <div className="flex items-center select-none -mr-4 -mt-3">
      <button
        onClick={handleMinimize}
        className="w-10 h-9 flex items-center justify-center hover:bg-[#3f3f46]/50 transition-colors cursor-pointer"
        title="Minimizar"
      >
        <Subtract20Regular className="text-gray-400 w-4 h-4" />
      </button>
      <button
        onClick={handleMaximize}
        className="w-10 h-9 flex items-center justify-center hover:bg-[#3f3f46]/50 transition-colors cursor-pointer"
        title="Maximizar"
      >
        <Square20Regular className="text-gray-400 w-4 h-4" />
      </button>
      <button
        onClick={handleClose}
        className="w-10 h-9 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
        title="Cerrar"
      >
        <Dismiss20Regular className="text-gray-400 hover:text-white w-4 h-4" />
      </button>
    </div>
  );
}
