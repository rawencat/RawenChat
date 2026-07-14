"use client";

import {
  Chat20Regular,
  Settings20Filled,
  PersonAccounts20Regular,
  Home20Regular,
  ArrowSyncCircle20Regular,
} from "@fluentui/react-icons";
import type { SidebarTab } from "../../types/chat";

interface SidebarProps {
  channel: string;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsUpdateModalOpen: (open: boolean) => void;
}

const NAV_ITEMS: { tab: SidebarTab; icon: typeof Chat20Regular; label: string }[] = [
  { tab: "chat", icon: Chat20Regular, label: "Chat" },
  { tab: "commands", icon: Settings20Filled, label: "Comandos" },
  { tab: "avatar", icon: PersonAccounts20Regular, label: "Avatar" },
];

export default function Sidebar({
  channel,
  activeTab,
  setActiveTab,
  setIsModalOpen,
  setIsUpdateModalOpen,
}: SidebarProps) {
  return (
    <aside
      className="app-rail"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <div className="rail-logo" title="RawenChat">
        <img src="/logo.png" alt="RawenChat" className="w-6 h-6" />
      </div>

      <div className="rail-divider" />

      {!channel ? (
        <button className="rail-btn rail-btn-active" title="Inicio">
          <Home20Regular className="w-5 h-5" />
        </button>
      ) : (
        <>
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rail-btn ${activeTab === tab ? "rail-btn-active" : ""}`}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </>
      )}

      <div className="rail-spacer" />

      <div className="rail-divider" />

      <button
        onClick={() => setIsUpdateModalOpen(true)}
        className="rail-btn"
        title="Actualizaciones"
      >
        <ArrowSyncCircle20Regular className="w-5 h-5" />
      </button>

      <button
        onClick={() => setIsModalOpen(true)}
        className="rail-btn"
        title="Configuración"
      >
        <Settings20Filled className="w-5 h-5" />
      </button>
    </aside>
  );
}
