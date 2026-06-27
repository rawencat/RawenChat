"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tmi from "tmi.js";
import { RateLimitManager } from "@sapphire/ratelimits";
import { DEFAULTS } from "@/constants/config";
import { getRandomColor } from "@/constants/colors";
import { getKickChatroomId, getKickWebSocketUrl } from "@/utils/kick";
import type { ChatPlatform } from "@/utils/platform";
import type { Command } from "../components/sidebar/CommandsPanel";
import type { IncomingChatMessage, MessageProps } from "../types/chat";

interface UseChatConnectionOptions {
  channel: string;
  commands: Command[];
  platform: ChatPlatform;
  onTtsMessage: (message: string) => void;
}

function runCommand(command: Command, username: string): void {
  const actionType = command.actionType || "key";

  if ((actionType === "key" || actionType === "both") && window.electron) {
    window.electron
      .pressKey(command.key)
      .catch((err: unknown) => console.error("Error pressing key:", err));
  }

  if ((actionType === "sound" || actionType === "both") && command.soundFile) {
    try {
      const audio = new Audio(
        command.soundFile.startsWith("data:")
          ? command.soundFile
          : `/${command.soundFile}`,
      );
      audio.volume = 1;
      audio.play().catch((err: unknown) => console.error("Audio error:", err));
    } catch (err) {
      console.error(`Error running command for ${username}:`, err);
    }
  }
}

export function useChatConnection({
  channel,
  commands,
  platform,
  onTtsMessage,
}: UseChatConnectionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const commandsRef = useRef(commands);
  const rateLimitersRef = useRef<Map<string, RateLimitManager<string>>>(
    new Map(),
  );
  const disconnectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  const handleIncomingMessage = useCallback(
    (incoming: IncomingChatMessage) => {
      const username = incoming.username || "Anónimo";
      const normalizedUsername = username.toLowerCase();
      const message: MessageProps = {
        timestamp: new Date().toISOString(),
        username,
        message: incoming.message,
        color: incoming.color || getRandomColor(),
      };

      setMessages((prevMessages) => [...prevMessages, message]);
      onTtsMessage(`${username} dice: ${incoming.message}`);

      const trigger = incoming.message.trim().toLowerCase();
      const command = commandsRef.current.find((cmd) => cmd.trigger === trigger);
      if (!command || typeof window === "undefined") return;

      let limiter = rateLimitersRef.current.get(command.trigger);
      if (!limiter) {
        limiter = new RateLimitManager(
          command.timeout || DEFAULTS.COMMAND_TIMEOUT_MS,
          1,
        );
        rateLimitersRef.current.set(command.trigger, limiter);
      }

      const limitKey =
        command.rateLimitType === "global" ? "global" : normalizedUsername;
      const rateLimit = limiter.acquire(limitKey);
      if (rateLimit.limited) return;

      rateLimit.consume();
      runCommand(command, username);
    },
    [onTtsMessage],
  );

  const disconnect = useCallback(() => {
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }
    setIsConnected(false);
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!channel) return;

    setIsConnected(false);
    setMessages([]);
    rateLimitersRef.current.clear();

    if (platform === "twitch") {
      const client = new tmi.Client({ channels: [channel.toLowerCase()] });

      disconnectRef.current = () => {
        if (client.readyState() === "OPEN") {
          client
            .disconnect()
            .catch((err) => console.error("Failed to disconnect:", err));
        }
      };

      client
        .connect()
        .then(() => setIsConnected(true))
        .catch((err) => {
          console.error("Failed to connect Twitch:", err);
          setIsConnected(false);
        });

      client.on("message", (_ch, tags, message) => {
        handleIncomingMessage({
          username: tags.username || undefined,
          message,
          color: tags.color || undefined,
        });
      });
    } else {
      let ws: WebSocket | null = null;
      let isActive = true;

      disconnectRef.current = () => {
        isActive = false;
        ws?.close();
      };

      getKickChatroomId(channel)
        .then((chatroomId) => {
          if (!isActive) return;
          ws = new WebSocket(getKickWebSocketUrl());

          ws.onopen = () => {
            ws?.send(
              JSON.stringify({
                event: "pusher:subscribe",
                data: {
                  auth: "",
                  channel: `chatrooms.${chatroomId}.v2`,
                },
              }),
            );
            setIsConnected(true);
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

              handleIncomingMessage({
                username:
                  data.sender?.username || data.sender?.slug || "kick_user",
                message: data.content,
              });
            } catch (err) {
              console.error("Failed to parse Kick WebSocket message:", err);
            }
          };

          ws.onerror = (err) => {
            console.error("Kick websocket error:", err);
            setIsConnected(false);
          };

          ws.onclose = () => setIsConnected(false);
        })
        .catch((err) => {
          console.error("Failed to connect Kick:", err);
          setIsConnected(false);
        });
    }

    return disconnect;
  }, [channel, platform, handleIncomingMessage, disconnect]);

  return {
    disconnect,
    isConnected,
    messages,
  };
}

