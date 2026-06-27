"use client";

import { Chat20Regular, Settings20Filled } from "@fluentui/react-icons";
import ControlBox from "../controlbox";
import type { SidebarTab } from "../../types/chat";
import type { ChatPlatform } from "@/utils/platform";

interface ConnectedHeaderProps {
  activeTab: SidebarTab;
  isConnected: boolean;
  channel: string;
  platform: ChatPlatform;
}

function HeaderLabel({ activeTab }: { activeTab: SidebarTab }) {
  if (activeTab === "chat") {
    return (
      <>
        <Chat20Regular className="w-5 h-5" />
        Chat
      </>
    );
  }

  if (activeTab === "commands") {
    return (
      <>
        <Settings20Filled className="w-5 h-5" />
        Comandos
      </>
    );
  }

  return (
    <>
      <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
      Config Avatar
    </>
  );
}

export default function ConnectedHeader({
  activeTab,
  isConnected,
  channel,
  platform,
}: ConnectedHeaderProps) {
  return (
    <>
      <div
        className="flex-shrink-0 flex items-center bg-[#18181b] border-b border-[#3f3f46] px-6 py-3 justify-between"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md flex items-center gap-2">
            <HeaderLabel activeTab={activeTab} />
          </span>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-zinc-500">{platform === "twitch" ? "twitch.tv/" : "kick.com/"}</span>
            <span className="text-white font-bold">{channel}</span>
          </span>
        </div>

        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <ControlBox />
        </div>
      </div>

      <div
        className={`h-0.5 transition-all duration-700 ${
          isConnected
            ? "w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"
            : "w-1/4 bg-gradient-to-r from-red-950 to-red-900"
        }`}
      />
    </>
  );
}

