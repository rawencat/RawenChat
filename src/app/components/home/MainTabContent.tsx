"use client";

import Footer from "../footer";
import CommandsPanel, { type Command } from "../sidebar/CommandsPanel";
import Avatar from "../sidebar/Avatar";
import ChatPanel from "./ChatPanel";
import type { ChatPlatform } from "@/utils/platform";
import type { MessageProps, SidebarTab } from "../../types/chat";

interface MainTabContentProps {
  activeTab: SidebarTab;
  channel: string;
  commands: Command[];
  isConnected: boolean;
  messages: MessageProps[];
  platform: ChatPlatform;
  setCommands: (commands: Command[]) => void;
}

export default function MainTabContent({
  activeTab,
  channel,
  commands,
  isConnected,
  messages,
  platform,
  setCommands,
}: MainTabContentProps) {
  return (
    <>
      {activeTab === "chat" ? (
        <ChatPanel channel={channel} messages={messages} />
      ) : activeTab === "commands" ? (
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#0f0f10] via-blue-950/5 to-[#0f0f10]">
          <CommandsPanel
            commands={commands}
            setCommands={setCommands}
            isLocked={false}
            platform={platform}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Avatar />
        </div>
      )}

      <Footer
        IsConnected={isConnected}
        channel={channel}
        MessageCount={messages.length}
      />
    </>
  );
}
