"use client";

import { RefObject } from "react";
import ControlBox from "../controlbox";
import { getPlatformDisplayName, type ChatPlatform } from "@/utils/platform";

interface ConnectScreenProps {
  channelInput: string;
  inputRef: RefObject<HTMLInputElement | null>;
  platform: ChatPlatform;
  onChannelInputChange: (value: string) => void;
  onConnect: () => void;
  onPlatformChange: (platform: ChatPlatform) => void;
}

export default function ConnectScreen({
  channelInput,
  inputRef,
  platform,
  onChannelInputChange,
  onConnect,
  onPlatformChange,
}: ConnectScreenProps) {
  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <ControlBox />
      </div>

      <div className="flex items-center justify-center flex-1 p-8">
        <div className="bg-[#18181b] border border-[#3f3f46] rounded-lg p-8 w-full max-w-md shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-2">
            Conectar a {getPlatformDisplayName(platform)}
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            Selecciona plataforma e ingresa el nombre de tu canal para comenzar
          </p>

          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs text-gray-400 mb-2">
                Plataforma
              </span>
              <select
                value={platform}
                onChange={(event) =>
                  onPlatformChange(event.target.value as ChatPlatform)
                }
                className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
                title="Seleccionar plataforma de chat"
              >
                <option value="twitch">TWITCH</option>
                <option value="kick">KICK</option>
              </select>
            </label>

            <input
              type="text"
              ref={inputRef}
              value={channelInput}
              onChange={(event) => onChannelInputChange(event.target.value)}
              placeholder="Nombre del canal"
              className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
              onKeyDown={(event) => event.key === "Enter" && onConnect()}
            />

            <button
              onClick={onConnect}
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
    </>
  );
}

