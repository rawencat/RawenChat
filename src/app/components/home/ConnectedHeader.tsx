"use client";

import {
  Chat20Regular,
  Settings20Filled,
  PersonAccounts20Regular,
  SignOut20Regular,
  Stop20Filled,
} from "@fluentui/react-icons";
import ControlBox from "../controlbox";
import type { SidebarTab } from "../../types/chat";
import type { ChatPlatform } from "@/utils/platform";

interface ConnectedHeaderProps {
  activeTab: SidebarTab;
  isConnected: boolean;
  channel: string;
  platform: ChatPlatform;
  TTS: boolean;
  stopTTS: () => void;
  handleDisconnect: () => void;
}

const TAB_META: Record<SidebarTab, { icon: typeof Chat20Regular; label: string; desc: string }> = {
  chat: { icon: Chat20Regular, label: "Chat", desc: "Mensajes en tiempo real del canal" },
  commands: { icon: Settings20Filled, label: "Comandos", desc: "Automatiza acciones con comandos del chat" },
  avatar: { icon: PersonAccounts20Regular, label: "Avatar", desc: "Configura tu overlay reactivo para OBS" },
};

export default function ConnectedHeader({
  activeTab,
  isConnected,
  channel,
  platform,
  TTS,
  stopTTS,
  handleDisconnect,
}: ConnectedHeaderProps) {
  const { icon: Icon, label, desc } = TAB_META[activeTab];

  return (
    <>
      <div
        className="page-toolbar"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent-border)] flex items-center justify-center">
              <Icon className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">{label}</h1>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">{desc}</p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <span className="status-pill hidden sm:inline-flex">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-[var(--success)] animate-pulse-dot" : "bg-[var(--error)]"}`}
            />
            <span className="text-[var(--text-muted)]">
              {platform === "twitch" ? "twitch.tv/" : "kick.com/"}
            </span>
            <span className="text-white font-semibold">{channel}</span>
          </span>

          <div className="toolbar-actions">
            {TTS && (
              <button onClick={stopTTS} className="toolbar-btn toolbar-btn-danger" title="Pausar TTS">
                <Stop20Filled className="w-4 h-4" />
              </button>
            )}
            <button onClick={handleDisconnect} className="toolbar-btn toolbar-btn-danger" title="Desconectar">
              <SignOut20Regular className="w-4 h-4" />
            </button>
            <ControlBox />
          </div>
        </div>
      </div>

      <div className="connection-bar">
        <div
          className={`connection-bar-fill ${isConnected ? "w-full bg-[var(--accent)]" : "w-1/4 bg-[var(--error)]"}`}
        />
      </div>
    </>
  );
}
