"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import * as tmi from "tmi.js";
import { FluentEmoji } from "@lobehub/fluent-emoji";
import { RateLimitManager } from "@sapphire/ratelimits";

import ControlBox from "./components/controlbox";
import { Chat20Regular, Settings20Filled } from "@fluentui/react-icons";
import MessagesRender from "./components/chat/messagesRender";
import CommandsPanel from "./components/sidebar/CommandsPanel";
import Sidebar from "./components/sidebar/Sidebar";
import SettingsModal from "./components/global/SettingsModal";
import Toast from "./components/global/Toast";
import Footer from "./components/footer";

import { STORAGE_KEYS, DEFAULTS } from "@/constants/config";
import { getRandomColor } from "@/constants/colors";
import { speakMessage, getAvailableVoices } from "@/utils/tts";
import { getKickChatroomId, getKickWebSocketUrl } from "@/utils/kick";
import { getPlatformDisplayName, type ChatPlatform } from "@/utils/platform";
import { getFromStorage, saveToStorage } from "@/utils/storage";

import type { Command } from "./components/sidebar/CommandsPanel";

interface MessageProps {
  timestamp: string;
  username: string | undefined;
  message: string;
  color?: string | undefined;
}

type SidebarTab = "chat" | "commands";

interface IncomingChatMessage {
  username?: string;
  message: string;
  color?: string;
}

function loadCommands(): Command[] {
  return getFromStorage<Command[]>(STORAGE_KEYS.COMMANDS) || [];
}

function loadTTSConfig() {
  return {
    enabled: getFromStorage<boolean>(STORAGE_KEYS.TTS_ENABLED) ?? true,
    language: getFromStorage<string>(STORAGE_KEYS.TTS_LANGUAGE) ?? "es-ES",
    voice: getFromStorage<string>(STORAGE_KEYS.TTS_VOICE) ?? "",
    volume: getFromStorage<number>(STORAGE_KEYS.TTS_VOLUME) ?? 100,
  };
}

export default function Home() {
  const [channelInput, setChannelInput] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [platform, setPlatform] = useState<ChatPlatform>("twitch");
  const InputUser = useRef<HTMLInputElement>(null);

  const [IsConnected, SetConnect] = useState(false);
  const [Messages, SetMessages] = useState<MessageProps[]>([]);
  
  // Cargar configuración del TTS desde localStorage
  const ttsConfig = loadTTSConfig();
  const [TTS, SetTTS] = useState(ttsConfig.enabled);
  const [ttsLanguage, setTtsLanguage] = useState(ttsConfig.language);
  const [ttsVoice, setTtsVoice] = useState(ttsConfig.voice);
  const [ttsVolume, setTtsVolume] = useState(ttsConfig.volume);
  
  const [availableVoices, setAvailableVoices] = useState<string[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const ttsRef = useRef(TTS);
  const ttsVolumeRef = useRef(ttsVolume);
  const ttsControllerRef = useRef<ControllerType>(null);
  const [autoScroll, SetAutoScroll] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const ttsQueueRef = useRef<string[]>([]);
  const ttsPlayingRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ControllerType = any;

  const [activeTab, setActiveTab] = useState<SidebarTab>("chat");
  const [commands, setCommandsState] = useState<Command[]>(loadCommands);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [barPosition, setBarPosition] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const rateLimitersRef = useRef<Map<string, RateLimitManager<string>>>(new Map());
  const disconnectRef = useRef<(() => void) | null>(null);

  function setCommands(updated: Command[]) {
    setCommandsState(updated);
    saveToStorage(STORAGE_KEYS.COMMANDS, updated);
  }

  // Guardar TTS config en localStorage cuando cambia
  const handleSetTTS = useCallback((value: boolean) => {
    SetTTS(value);
    saveToStorage(STORAGE_KEYS.TTS_ENABLED, value);
  }, []);

  const handleSetTtsLanguage = useCallback((value: string) => {
    setTtsLanguage(value);
    saveToStorage(STORAGE_KEYS.TTS_LANGUAGE, value);
  }, []);

  const handleSetTtsVoice = useCallback((value: string) => {
    setTtsVoice(value);
    saveToStorage(STORAGE_KEYS.TTS_VOICE, value);
  }, []);

  const handleSetTtsVolume = useCallback((value: number) => {
    setTtsVolume(value);
    saveToStorage(STORAGE_KEYS.TTS_VOLUME, value);
  }, []);

  const commandsRef = useRef(commands);
  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    ttsRef.current = TTS;
  }, [TTS]);

  useEffect(() => {
    ttsVolumeRef.current = ttsVolume;
  }, [ttsVolume]);

  useEffect(() => {
    if (!navRef.current || !channel) return;
    const activeButton = navRef.current.querySelector(`[data-tab="${activeTab}"]`);
    if (activeButton) {
      const offset = (activeButton as HTMLElement).offsetTop;
      setBarPosition(offset);
    }
  }, [activeTab, channel]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const loadVoices = async () => {
      setLoadingVoices(true);
      try {
        const voices = await getAvailableVoices(ttsLanguage);
        setAvailableVoices(voices);
        // When language changes, auto-select the first voice of new language
        if (voices.length > 0) {
          handleSetTtsVoice(voices[0]);
        }
      } catch (error) {
        console.error("Error loading voices:", error);
      } finally {
        setLoadingVoices(false);
      }
    };

    loadVoices();
  }, [ttsLanguage, handleSetTtsVoice]);

  const processTTSQueue = useCallback(async () => {
    if (ttsPlayingRef.current || !ttsRef.current) return;
    if (ttsQueueRef.current.length === 0) return;
    
    ttsPlayingRef.current = true;
    const message = ttsQueueRef.current.shift();
    
    if (message) {
      try {
        await speakMessage(message, ttsLanguage, ttsVoice, ttsVolumeRef.current);
      } catch (err) {
        console.error("TTS error:", err);
      }
    }
    
    ttsPlayingRef.current = false;
    if (ttsQueueRef.current.length > 0) {
      processTTSQueue();
    }
  }, [ttsLanguage, ttsVoice]);

  const stopTTS = () => {
    ttsQueueRef.current = [];
    ttsPlayingRef.current = false;
    const audioElement = document.querySelector("audio");
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  };

  const handleConnect = () => {
    const ch = channelInput.trim();
    if (!ch) {
      alert("Por favor ingresa un nombre de canal válido.");
      return;
    }
    setChannel(ch);
  };

  useEffect(() => {
    if (autoScroll) {
      requestAnimationFrame(() => {
        const div = document.querySelector(".messages-container");
        if (div) {
          div.scrollTop = div.scrollHeight;
        }
      });
    }
  }, [Messages, autoScroll]);

  const handleIncomingMessage = useCallback((incoming: IncomingChatMessage) => {
    const username = incoming.username || "Anónimo";
    const normalizedUsername = username.toLowerCase();
    const newMessage: MessageProps = {
      timestamp: new Date().toISOString(),
      username,
      message: incoming.message,
      color: incoming.color || getRandomColor(),
    };

    SetMessages((prevMessages) => [...prevMessages, newMessage]);

    if (ttsRef.current) {
      ttsQueueRef.current.push(`${username} dice: ${incoming.message}`);
      processTTSQueue();
    }

    const lower = incoming.message.trim().toLowerCase();
    const command = commandsRef.current.find((cmd) => cmd.trigger === lower);
    if (!command || typeof window === "undefined") return;

    let limiter = rateLimitersRef.current.get(command.trigger);
    if (!limiter) {
      limiter = new RateLimitManager(command.timeout || DEFAULTS.COMMAND_TIMEOUT_MS, 1);
      rateLimitersRef.current.set(command.trigger, limiter);
    }

    const limitKey = command.rateLimitType === "global" ? "global" : normalizedUsername;
    const rateLimit = limiter.acquire(limitKey);
    if (rateLimit.limited) return;
    rateLimit.consume();

    const actionType = command.actionType || "key";

    if ((actionType === "key" || actionType === "both") && window.electron) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.electron.pressKey(command.key).catch((err: any) => console.error("❌ Error:", err));
    }

    if ((actionType === "sound" || actionType === "both") && command.soundFile) {
      try {
        const audio = new Audio(command.soundFile.startsWith("data:") ? command.soundFile : `/${command.soundFile}`);
        audio.volume = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        audio.play().catch((err: any) => console.error("❌ Error:", err));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("❌ Error:", err);
      }
    }
  }, [processTTSQueue]);

  useEffect(() => {
    if (!channel) return;

    SetConnect(false);
    SetMessages([]);
    rateLimitersRef.current.clear();

    if (platform === "twitch") {
      const client = new tmi.Client({
        channels: [channel.toLowerCase()],
      });

      disconnectRef.current = () => {
        if (client.readyState() === "OPEN") {
          client.disconnect().catch((err) => console.error("Failed to disconnect:", err));
        }
      };

      client
        .connect()
        .then(() => {
          SetConnect(true);
        })
        .catch((err) => {
          console.error("Failed to connect Twitch:", err);
          SetConnect(false);
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
        if (ws) ws.close();
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
                  auth: "", // Public chatrooms do not require signed auth tokens.
                  channel: `chatrooms.${chatroomId}.v2`,
                },
              })
            );
            SetConnect(true);
          };

          ws.onmessage = (event) => {
            try {
              const payload = JSON.parse(event.data as string) as { event?: string; data?: unknown };
              if (payload.event !== "App\\Events\\ChatMessageEvent") return;

              const parsedData = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
              const data = parsedData as {
                content?: string;
                sender?: { username?: string; slug?: string; id?: number | string };
              };

              if (!data?.content) return;

              handleIncomingMessage({
                username: data.sender?.username || data.sender?.slug || "kick_user",
                message: data.content,
              });
            } catch (err) {
              console.error("Failed to parse Kick WebSocket message:", err);
            }
          };

          ws.onerror = (err) => {
            console.error("Kick websocket error:", err);
            SetConnect(false);
          };

          ws.onclose = () => {
            SetConnect(false);
          };
        })
        .catch((err) => {
          console.error("Failed to connect Kick:", err);
          SetConnect(false);
        });
    }

    return () => {
      if (disconnectRef.current) {
        disconnectRef.current();
        disconnectRef.current = null;
      }
    };
  }, [channel, platform, handleIncomingMessage]);

  const handleDisconnect = () => {
    ttsQueueRef.current = [];
    ttsPlayingRef.current = false;
    if (ttsControllerRef.current) {
      ttsControllerRef.current.cancel?.();
    }
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }
    setChannel("");
    SetConnect(false);
    SetMessages([]);
    setChannelInput("");
    setActiveTab("chat");
  };
  return (
    <main
      className="flex h-screen bg-[#0f0f10] select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Sidebar Component */}
      <Sidebar
        channel={channel}
        platform={platform}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        barPosition={barPosition}
        navRef={navRef}
        TTS={TTS}
        stopTTS={stopTTS}
        handleDisconnect={handleDisconnect}
        setToastMessage={setToastMessage}
        setIsModalOpen={setIsModalOpen}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {channel && (
          <>
            {/* Header cuando está conectado */}
            <div 
              className="flex-shrink-0 flex items-center bg-[#18181b] border-b border-[#3f3f46] px-6 py-3 justify-between"
              style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
              <span className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md flex items-center gap-2">
                {activeTab === "chat" ? (
                  <>
                    <Chat20Regular className="w-5 h-5" />
                    Chat
                  </>
                ) : (
                  <>
                    <Settings20Filled className="w-5 h-5" />
                    Comandos
                  </>
                )}
              </span>

              <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <ControlBox />
              </div>
            </div>

            <div
              className={`h-0.5 transition-all duration-700 ${
                IsConnected 
                  ? activeTab === "chat"
                    ? "w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"
                    : "w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"
                  : "w-1/4 bg-gradient-to-r from-red-950 to-red-900"
              }`}
            />
          </>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!channel ? (
            <div className="absolute top-4 right-4 z-50">
              <ControlBox />
            </div>
          ) : null}
          
          {!channel ? (
            <div className="flex items-center justify-center flex-1 p-8">
              <div className="bg-[#18181b] border border-[#3f3f46] rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Conectar a {getPlatformDisplayName(platform)}</h2>
                <p className="text-gray-400 mb-6 text-sm">
                  Selecciona plataforma e ingresa el nombre de tu canal para comenzar
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Plataforma</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as ChatPlatform)}
                      className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                      title="Seleccionar plataforma de chat"
                    >
                      <option value="twitch">TWITCH</option>
                      <option value="kick">KICK</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      ref={InputUser}
                      value={channelInput}
                      onChange={(e) => setChannelInput(e.target.value)}
                      placeholder="Nombre del canal"
                      className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                      onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    />
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={!channelInput.trim()}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors"
                  >
                    Conectar
                  </button>

                  <a
                    href="https://github.com/RevenzMind/RawenChat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs text-gray-400 hover:text-blue-400 transition-colors pt-4 border-t border-[#3f3f46]"
                  >
                    Ver en GitHub
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "chat" ? (
                <div className="messages-container flex-1 overflow-y-auto bg-[#0f0f10] bg-gradient-to-br from-[#0f0f10] via-blue-950/5 to-[#0f0f10] p-4 space-y-3">
                  {Messages.length > 0 ? (
                    Messages.map((msg) => (
                      <MessagesRender
                        msg={msg}
                        key={`${msg.timestamp}-${msg.username}`}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4 bg-[#18181b] border border-[#3f3f46] p-8 rounded-lg animate-fade-in">
                        <div className="animate-bounce">
                          <FluentEmoji type="anim" size={64} emoji="💬" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Chat vacío
                        </h3>
                        <p className="text-gray-400 text-base text-center">
                          No hay mensajes en el chat de {channel} todavía
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-gray-500 text-sm">
                            Esperando nuevos mensajes...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-hidden bg-gradient-to-br from-[#0f0f10] via-blue-950/5 to-[#0f0f10]">
                  <CommandsPanel commands={commands} setCommands={setCommands} isLocked={false} platform={platform} />
                </div>
              )}
              <Footer
                IsConnected={IsConnected}
                channel={channel}
                MessageCount={Messages.length}
              />
            </>
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ttsEnabled={TTS}
        onTTSToggle={handleSetTTS}
        autoScroll={autoScroll}
        onAutoScrollToggle={SetAutoScroll}
        ttsLanguage={ttsLanguage}
        onLanguageChange={handleSetTtsLanguage}
        ttsVoice={ttsVoice}
        onVoiceChange={handleSetTtsVoice}
        availableVoices={availableVoices}
        loadingVoices={loadingVoices}
        ttsVolume={ttsVolume}
        onVolumeChange={handleSetTtsVolume}
      />

      {toastMessage && <Toast message={toastMessage} type="success" />}
    </main>
  );
}
