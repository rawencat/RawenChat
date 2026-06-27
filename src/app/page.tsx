"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import SettingsModal from "./components/global/SettingsModal";
import Toast from "./components/global/Toast";
import ConnectedHeader from "./components/home/ConnectedHeader";
import ConnectScreen from "./components/home/ConnectScreen";
import MainTabContent from "./components/home/MainTabContent";
import { useAvatarAudioEngine } from "./hooks/useAvatarAudioEngine";
import { useChatConnection } from "./hooks/useChatConnection";
import { useTtsSettings } from "./hooks/useTtsSettings";
import { STORAGE_KEYS } from "@/constants/config";
import { saveToStorage, getFromStorage } from "@/utils/storage";
import type { ChatPlatform } from "@/utils/platform";
import type { Command } from "./components/sidebar/CommandsPanel";
import type { SidebarTab } from "./types/chat";

function loadCommands(): Command[] {
  return getFromStorage<Command[]>(STORAGE_KEYS.COMMANDS) || [];
}

export default function Home() {
  const [channelInput, setChannelInput] = useState("");
  const [channel, setChannel] = useState("");
  const [platform, setPlatform] = useState<ChatPlatform>("twitch");
  const [activeTab, setActiveTab] = useState<SidebarTab>("chat");
  const [commands, setCommandsState] = useState<Command[]>(loadCommands);
  const [toastMessage, setToastMessage] = useState("");
  const [barPosition, setBarPosition] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useAvatarAudioEngine();

  const tts = useTtsSettings();
  const chat = useChatConnection({
    channel,
    commands,
    platform,
    onTtsMessage: tts.enqueue,
  });

  function setCommands(updated: Command[]) {
    setCommandsState(updated);
    saveToStorage(STORAGE_KEYS.COMMANDS, updated);
  }

  function handleConnect() {
    const nextChannel = channelInput.trim();
    if (!nextChannel) {
      alert("Por favor ingresa un nombre de canal válido.");
      return;
    }
    setChannel(nextChannel);
  }

  function handleDisconnect() {
    tts.stop();
    chat.disconnect();
    setChannel("");
    setChannelInput("");
    setActiveTab("chat");
  }

  useEffect(() => {
    if (!navRef.current || !channel) return;
    const activeButton = navRef.current.querySelector(
      `[data-tab="${activeTab}"]`,
    );
    if (activeButton) {
      setBarPosition((activeButton as HTMLElement).offsetTop);
    }
  }, [activeTab, channel]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 2000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!autoScroll) return;
    requestAnimationFrame(() => {
      const container = document.querySelector(".messages-container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }, [chat.messages, autoScroll]);

  return (
    <main
      className="flex h-screen bg-[#0f0f10] select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <Sidebar
        channel={channel}
        platform={platform}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        barPosition={barPosition}
        navRef={navRef}
        TTS={tts.enabled}
        stopTTS={tts.stop}
        handleDisconnect={handleDisconnect}
        setToastMessage={setToastMessage}
        setIsModalOpen={setIsModalOpen}
      />

      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {channel && (
          <ConnectedHeader
            activeTab={activeTab}
            isConnected={chat.isConnected}
            channel={channel}
            platform={platform}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {!channel ? (
            <ConnectScreen
              channelInput={channelInput}
              inputRef={inputRef}
              platform={platform}
              onChannelInputChange={setChannelInput}
              onConnect={handleConnect}
              onPlatformChange={setPlatform}
            />
          ) : (
            <MainTabContent
              activeTab={activeTab}
              channel={channel}
              commands={commands}
              isConnected={chat.isConnected}
              messages={chat.messages}
              platform={platform}
              setCommands={setCommands}
            />
          )}
        </div>
      </div>

      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ttsEnabled={tts.enabled}
        onTTSToggle={tts.setEnabled}
        autoScroll={autoScroll}
        onAutoScrollToggle={setAutoScroll}
        ttsLanguage={tts.language}
        onLanguageChange={tts.setLanguage}
        ttsVoice={tts.voice}
        onVoiceChange={tts.setVoice}
        availableVoices={tts.availableVoices}
        loadingVoices={tts.loadingVoices}
        ttsVolume={tts.volume}
        onVolumeChange={tts.setVolume}
      />

      {toastMessage && <Toast message={toastMessage} type="success" />}
    </main>
  );
}

