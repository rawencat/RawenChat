"use client";

import { FluentEmoji } from "@lobehub/fluent-emoji";
import MessagesRender from "../chat/messagesRender";
import type { MessageProps } from "../../types/chat";

interface ChatPanelProps {
  channel: string;
  messages: MessageProps[];
}

export default function ChatPanel({ channel, messages }: ChatPanelProps) {
  return (
    <div className="messages-container flex-1 overflow-y-auto bg-[#0f0f10] bg-gradient-to-br from-[#0f0f10] via-blue-950/5 to-[#0f0f10] p-4 space-y-3">
      {messages.length > 0 ? (
        messages.map((msg) => (
          <MessagesRender msg={msg} key={`${msg.timestamp}-${msg.username}`} />
        ))
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4 bg-[#18181b] border border-[#3f3f46] p-8 rounded-lg animate-fade-in">
            <div className="animate-bounce">
              <FluentEmoji type="anim" size={64} emoji="💬" />
            </div>
            <h3 className="text-xl font-semibold text-white">Chat vacío</h3>
            <p className="text-gray-400 text-base text-center">
              No hay mensajes en el chat de {channel} todavía
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-500 text-sm">
                Esperando nuevos mensajes...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

