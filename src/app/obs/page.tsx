"use client";
import MessagesRender from "@/app/components/chat/messagesRender";
import { useEffect, Suspense } from "react";
import * as tmi from "tmi.js";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getKickChatroomId, getKickWebSocketUrl } from "@/utils/kick";
import { getPlatformDisplayName, type ChatPlatform } from "@/utils/platform";

interface MessageProps {
  timestamp: string;
  username: string | undefined;
  message: string;
  color?: string | undefined;
}

function ObsPageContent() {
  const [Messages, SetMessages] = useState<MessageProps[]>([]);
  const [mounted, setMounted] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [Messages]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const channel = searchParams.get("channel");
    const platform = (
      searchParams.get("platform") || "twitch"
    ).toLowerCase() as ChatPlatform;

    if (!channel) {
      console.error("No channel parameter provided. Use ?channel=channelname");
      return;
    }

    console.log(`Connecting to ${platform} channel: ${channel}`);

    if (platform === "kick") {
      let ws: WebSocket | null = null;
      let active = true;

      getKickChatroomId(channel)
        .then((chatroomId) => {
          if (!active) return;
          ws = new WebSocket(getKickWebSocketUrl());

          ws.onopen = () => {
            ws?.send(
              JSON.stringify({
                event: "pusher:subscribe",
                data: {
                  auth: "", // Public chatrooms do not require signed auth tokens.
                  channel: `chatrooms.${chatroomId}.v2`,
                },
              }),
            );
          };

          ws.onmessage = (event) => {
            try {
              const payload = JSON.parse(event.data as string) as {
                event?: string;
                data?: unknown;
              };
              if (payload.event !== "App\\Events\\ChatMessageEvent") return;
              const parsedData =
                typeof payload.data === "string"
                  ? JSON.parse(payload.data)
                  : payload.data;
              const data = parsedData as {
                content?: string;
                sender?: { username?: string; slug?: string };
              };
              if (!data?.content) return;

              const newMessage: MessageProps = {
                timestamp: new Date().toISOString(),
                username:
                  data.sender?.username || data.sender?.slug || "kick_user",
                message: data.content,
              };

              SetMessages((prevMessages) => [...prevMessages, newMessage]);
            } catch (err) {
              console.error("Failed to parse Kick WebSocket message:", err);
            }
          };
        })
        .catch((err) => {
          console.error("Failed to connect Kick:", err);
        });

      return () => {
        active = false;
        ws?.close();
      };
    }

    const client = new tmi.Client({
      channels: [channel.toLowerCase()],
    });

    client
      .connect()
      .then(() => {
        console.log(`Connected to channel: ${channel}`);
      })
      .catch((err) => {
        console.error("Failed to connect:", err);
      });

    client.on("message", (_channel, tags, message, self) => {
      if (self) return;

      const newMessage: MessageProps = {
        timestamp: new Date().toISOString(),
        username: tags.username,
        message: message,
        color: tags.color || undefined,
      };

      SetMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      client.disconnect();
    };
  }, [mounted, searchParams]);

  const channel = searchParams.get("channel");
  const platform = (
    searchParams.get("platform") || "twitch"
  ).toLowerCase() as ChatPlatform;

  return (
    <div
      ref={messagesContainerRef}
      className="messages-container h-screen overflow-y-auto bg-transparent"
      style={{ scrollBehavior: "smooth" }}
    >
      {Messages.length > 0 ? (
        Messages.map((msg) => (
          <div key={`${msg.timestamp}-${msg.username}`} className="animate-plop">
            <MessagesRender
              ShowTime={false}
              msg={msg}
            />
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">
            {channel
              ? `Esperando mensajes en ${getPlatformDisplayName(platform)}: ${channel}...`
              : "Esperando..."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ObsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-gray-500">
          Cargando...
        </div>
      }
    >
      <ObsPageContent />
    </Suspense>
  );
}
