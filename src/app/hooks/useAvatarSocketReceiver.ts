"use client";

import { useEffect, useRef, useState } from "react";
import { AVATAR_WS_URL } from "@/constants/avatar";

export function useAvatarSocketReceiver(onSettingsUpdated?: () => void): boolean {
  const [isActive, setIsActive] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      const socket = new WebSocket(AVATAR_WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "PING" }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "SET_ACTIVE") {
            setIsActive(Boolean(data.value));
          }
          if (data.type === "AVATAR_SETTINGS_UPDATED") {
            onSettingsUpdated?.();
          }
        } catch (err) {
          console.error("Error parseando mensaje de avatar:", err);
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.close();
    };
  }, [onSettingsUpdated]);

  return isActive;
}
