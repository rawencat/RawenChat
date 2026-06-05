"use client";
import { RefObject } from "react";
import { Chat20Regular, Settings20Filled, SignOut20Regular, Stop20Filled } from "@fluentui/react-icons";
import { type ChatPlatform } from "@/utils/platform";

interface SidebarProps {
  channel: string;
  platform?: ChatPlatform;
  activeTab: "chat" | "commands";
  setActiveTab: (tab: "chat" | "commands") => void;
  barPosition: number;
  navRef: RefObject<HTMLDivElement | null>;
  TTS: boolean;
  stopTTS: () => void;
  handleDisconnect: () => void;
  setToastMessage: (msg: string) => void;
  setIsModalOpen: (open: boolean) => void;
}

export default function Sidebar({
  channel,
  platform = "twitch",
  activeTab,
  setActiveTab,
  barPosition,
  navRef,
  TTS,
  stopTTS,
  handleDisconnect,
  setToastMessage,
  setIsModalOpen,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-[#18181b] border-r border-[#3f3f46] p-6 flex flex-col justify-between" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-3 py-2 bg-blue-600/10 border border-blue-600 rounded-lg w-full">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="RawenChat Logo" 
              className="w-6 h-6"
            />
          </div>
          <h1 className="text-xl font-bold text-white">RawenChat</h1>
        </div>

        <nav className="space-y-2 text-sm">
          {!channel && (
            <div className={`px-3 py-2.5 rounded-lg transition-all cursor-pointer font-medium bg-blue-600 text-white shadow-lg flex items-center gap-3`}>
              <Chat20Regular className="w-5 h-5" />
              <span>Inicio</span>
            </div>
          )}
          {channel && (
            <div className="relative" ref={navRef}>
              <div className={`absolute -left-4 top-0 w-1 h-10 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full transition-all duration-300`} 
                style={{ transform: `translateY(${barPosition}px)` }} 
              />
              <div className="space-y-3">
                <div 
                  data-tab="chat"
                  className={`px-3 py-2.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-3 ${
                    activeTab === "chat" 
                      ? "bg-[#27272a] text-blue-400 shadow-lg" 
                      : "text-gray-300 hover:bg-[#27272a]"
                  }`} 
                  onClick={() => setActiveTab("chat")}
                >
                  <Chat20Regular className="w-5 h-5" />
                  <span>Chat</span>
                </div>
                <div 
                  data-tab="commands"
                  className={`px-3 py-2.5 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-3 ${
                    activeTab === "commands" 
                      ? "bg-[#27272a] text-blue-400 shadow-lg" 
                      : "text-gray-300 hover:bg-[#27272a]"
                  }`} 
                  onClick={() => setActiveTab("commands")}
                >
                  <Settings20Filled className="w-5 h-5" />
                  <span>Comandos</span>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#3f3f46] pt-4">
        {channel && TTS && (
          <button
            onClick={stopTTS}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-950/30 hover:bg-red-950/50 transition-all text-red-400 font-medium w-full border border-red-900/50"
            title="Detener TTS"
          >
            <Stop20Filled className="w-5 h-5" />
            <span className="text-sm">Pausar TTS</span>
          </button>
        )}
        {channel && (
          <button
            onClick={() => {
              const obsUrl = `http://localhost:3000/obs.html?channel=${encodeURIComponent(channel)}&platform=${platform}`;
              navigator.clipboard.writeText(obsUrl);
              setToastMessage("URL copiada al portapapeles");
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-950/30 hover:bg-purple-950/50 transition-all text-purple-400 font-medium w-full border border-purple-900/50"
            title="Copiar URL de OBS Overlay"
          >
            <Chat20Regular className="w-5 h-5" />
            <span className="text-sm">OBS Overlay</span>
          </button>
        )}
        {channel && (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-950/50 transition-all text-red-400 font-medium w-full"
          >
            <SignOut20Regular className="w-5 h-5" />
            <span className="text-sm">Desconectar</span>
          </button>
        )}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#27272a] transition-all text-gray-300 font-medium w-full"
        >
          <Settings20Filled className="w-5 h-5" />
          <span className="text-sm">Configuración</span>
        </button>
      </div>
    </aside>
  );
}


