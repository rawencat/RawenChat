"use client";
import MessagesRender from "@/app/components/chat/messagesRender";
import { useEffect, Suspense } from "react";
import * as tmi from "tmi.js";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

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
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
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

    if (!channel) {
      console.error("No channel parameter provided. Use ?channel=channelname");
      return;
    }

    console.log(`Connecting to channel: ${channel}`);

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

      console.log(`Message from ${tags.username}: ${message}`);

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

  return (
    <div 
      ref={messagesContainerRef}
      className="messages-container h-screen overflow-y-auto bg-transparent"
      style={{ scrollBehavior: 'smooth' }}
    >
      {Messages.length > 0 ? (
        Messages.map((msg) => (
          <MessagesRender 
            ShowTime={false} 
            msg={msg} 
            key={`${msg.timestamp}-${msg.username}`} 
          />
        ))
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-sm">
            {channel ? `Esperando mensajes en ${channel}...` : "Esperando..."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ObsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500">Cargando...</div>}>
      <ObsPageContent />
    </Suspense>
  );
}
