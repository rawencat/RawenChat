"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/sidebar/Sidebar";
import SettingsModal from "./components/global/SettingsModal";
import UpdateModal from "./components/global/UpdateModal";
import Toast from "./components/global/Toast";
import ConnectedHeader from "./components/home/ConnectedHeader";
import ConnectScreen from "./components/home/ConnectScreen";
import MainTabContent from "./components/home/MainTabContent";
import ControlBox from "./components/controlbox";
import { useAvatarAudioEngine } from "./hooks/useAvatarAudioEngine";
import { useChatConnection } from "./hooks/useChatConnection";
import { useTtsSettings } from "./hooks/useTtsSettings";
import { STORAGE_KEYS } from "@/constants/config";
import { saveToStorage, getFromStorage } from "@/utils/storage";
import type { ChatPlatform } from "@/utils/platform";
import type { Command } from "./components/sidebar/CommandsPanel";
import type { SidebarTab } from "./types/chat";
import { Settings20Filled } from "@fluentui/react-icons";

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
  const [autoScroll, setAutoScroll] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 2500);
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
      className="flex h-screen bg-black select-none overflow-hidden"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <Sidebar
        channel={channel}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsModalOpen={setIsModalOpen}
        setIsUpdateModalOpen={setIsUpdateModalOpen}
      />

      <div
        className="content-shell"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {channel ? (
          <ConnectedHeader
            activeTab={activeTab}
            isConnected={chat.isConnected}
            channel={channel}
            platform={platform}
            TTS={tts.enabled}
            stopTTS={tts.stop}
            handleDisconnect={handleDisconnect}
          />
        ) : (
          <div
            className="page-toolbar"
            style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5">
             
            </div>
            <div
              className="toolbar-actions"
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            >
              <button
                onClick={() => setIsModalOpen(true)}
                className="toolbar-btn"
                title="Configuración"
              >
                <Settings20Filled className="w-4 h-4" />
              </button>
              <ControlBox />
            </div>
          </div>
        )}

        <div className="content-body">
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
              setToastMessage={setToastMessage}
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

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdateAvailable={() => setIsUpdateModalOpen(true)}
      />

      {toastMessage && <Toast message={toastMessage} type="success" />}
    </main>
  );
}
