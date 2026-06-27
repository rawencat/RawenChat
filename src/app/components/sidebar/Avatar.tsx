"use client";

import { ChangeEvent, ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import {
  AVATAR_DEFAULTS,
  AVATAR_EVENTS,
  type AvatarSettings,
} from "@/constants/avatar";
import {
  persistAvatarSettingsForOverlay,
  readAvatarSettings,
  readAvatarImage,
  readAvatarThreshold,
  sendAvatarTalkingState,
  updateAvatarSettings,
} from "@/utils/avatar";
import type { AvatarStateDetail } from "../../hooks/useAvatarAudioEngine";

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface SettingCardProps {
  title: string;
  children: ReactNode;
}

function SettingCard({ title, children }: SettingCardProps) {
  return (
    <section className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function VolumeMeter({ volume }: { volume: number }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-zinc-400 mb-1">
        <span>Nivel de Entrada</span>
        <span className="font-mono">{volume}%</span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-75"
          style={{ width: `${volume}%` }}
        />
      </div>
    </div>
  );
}

interface ImageUrlInputProps {
  label: string;
  value: string;
  fileName: string;
  onChange: (value: string) => void;
  onFileChange: (file: File) => void;
}

function ImageUrlInput({
  label,
  value,
  fileName,
  onChange,
  onFileChange,
}: ImageUrlInputProps) {
  const isLocalFile = value.startsWith("data:");

  return (
    <label className="block">
      <span className="text-sm text-zinc-400 block mb-1">{label}</span>
      <div className="flex gap-2">
        <input
          type="url"
          value={isLocalFile ? "" : value}
          placeholder={isLocalFile ? "Archivo local guardado" : "https://..."}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-300"
        />
        <span className="relative shrink-0">
          <input
            type="file"
            accept="image/*"
            title="Selecciona una imagen local"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onFileChange(file);
              event.currentTarget.value = "";
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="block px-3 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium text-white transition-colors">
            Archivo
          </span>
        </span>
      </div>
      {fileName && (
        <span className="mt-1 block text-xs text-blue-300 truncate">
          {fileName}
        </span>
      )}
    </label>
  );
}

interface AvatarPreviewProps {
  idleImg: string;
  activeImg: string;
  isTalking: boolean;
}

function AvatarPreview({ idleImg, activeImg, isTalking }: AvatarPreviewProps) {
  return (
    <div className="relative w-64 h-64 my-auto bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
      <Image
        src={idleImg}
        alt="Preview Idle"
        fill
        unoptimized
        className={`object-contain transition-opacity duration-75 p-4 ${
          isTalking ? "opacity-0" : "opacity-100"
        }`}
      />
      <Image
        src={activeImg}
        alt="Preview Active"
        fill
        unoptimized
        className={`object-contain transition-opacity duration-75 p-4 ${
          isTalking ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default function AvatarConfigPage() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [settings, setSettings] =
    useState<AvatarSettings>(readAvatarSettings);
  const [avatarThreshold, setAvatarThreshold] = useState<number>(
    AVATAR_DEFAULTS.THRESHOLD,
  );
  const [currentVolumePercent, setCurrentVolumePercent] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [idleImg, setIdleImg] = useState<string>(AVATAR_DEFAULTS.IDLE_IMAGE);
  const [activeImg, setActiveImg] = useState<string>(
    AVATAR_DEFAULTS.ACTIVE_IMAGE,
  );
  const [copiedAvatarUrl, setCopiedAvatarUrl] = useState(false);

  useEffect(() => {
    const savedSettings = readAvatarSettings();
    setSettings(savedSettings);
    void persistAvatarSettingsForOverlay(savedSettings);
    setAvatarThreshold(readAvatarThreshold());
    setIdleImg(readAvatarImage("idle"));
    setActiveImg(readAvatarImage("active"));

    async function loadMicrophones() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label:
              device.label ||
              `Micrófono Desconocido (${device.deviceId.slice(0, 5)})`,
          }));

        setDevices(audioInputs);
        setSelectedDevice(
          savedSettings.micId &&
            audioInputs.some((device) => device.deviceId === savedSettings.micId)
            ? savedSettings.micId
            : audioInputs[0]?.deviceId || "",
        );
      } catch (err) {
        console.error("Error listando dispositivos de audio:", err);
      }
    }

    void loadMicrophones();
  }, []);

  useEffect(() => {
    const handleAvatarState = (event: Event) => {
      const { volume, isTalking: talking } = (
        event as CustomEvent<AvatarStateDetail>
      ).detail;
      setCurrentVolumePercent(volume);
      setIsTalking(talking);
    };

    setCurrentVolumePercent(window.currentVolume ?? 0);
    setIsTalking(window.currentAvatarTalking ?? false);
    window.addEventListener(AVATAR_EVENTS.STATE_CHANGE, handleAvatarState);

    return () => {
      window.removeEventListener(AVATAR_EVENTS.STATE_CHANGE, handleAvatarState);
    };
  }, []);

  const handleMicChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    setSelectedDevice(id);
    const nextSettings = updateAvatarSettings({ micId: id });
    setSettings(nextSettings);
    void persistAvatarSettingsForOverlay(nextSettings);
    window.dispatchEvent(new Event(AVATAR_EVENTS.RELOAD_MIC));
  };

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setAvatarThreshold(value);
    const nextSettings = updateAvatarSettings({ threshold: value });
    setSettings(nextSettings);
    void persistAvatarSettingsForOverlay(nextSettings);
  };

  const handleImgChange = (type: "idle" | "active", url: string) => {
    const updates =
      type === "idle"
        ? { idleImage: url, idleImageName: "" }
        : { activeImage: url, activeImageName: "" };
    const nextSettings = updateAvatarSettings(updates);
    setSettings(nextSettings);
    void persistAvatarSettingsForOverlay(nextSettings);
    if (type === "idle") {
      setIdleImg(url);
    } else {
      setActiveImg(url);
    }
  };

  const handleImageFileChange = (type: "idle" | "active", file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl !== "string") return;

      const savedImage = await window.electron?.saveAvatarImage(
        file.name,
        dataUrl,
      );
      const imageUrl = savedImage?.url || dataUrl;
      const imageName = savedImage?.fileName || file.name;
      const updates =
        type === "idle"
          ? { idleImage: imageUrl, idleImageName: imageName }
          : { activeImage: imageUrl, activeImageName: imageName };
      const nextSettings = updateAvatarSettings(updates);
      setSettings(nextSettings);
      await persistAvatarSettingsForOverlay(nextSettings);

      if (type === "idle") {
        setIdleImg(imageUrl);
      } else {
        setActiveImg(imageUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const statusClass = isTalking
    ? "bg-green-500/20 text-green-400"
    : "bg-zinc-800 text-zinc-400";

  return (
    <div className="h-full overflow-y-auto rawen-scrollbar bg-gradient-to-br from-[#0f0f10] via-blue-950/5 to-[#0f0f10]">
      <div className="p-8 max-w-6xl mx-auto text-white">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
          Configuración del Avatar Reactivo
        </h1>
        <p className="text-zinc-400 mb-8">
          Administra el comportamiento de tu overlay para transmisiones en OBS
          Studio.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <SettingCard title="Enlace del Overlay">
              <p className="text-sm text-zinc-400 mb-4">
                Copia este enlace para agregarlo como fuente de navegador en tu software de transmisión (OBS Studio, Streamlabs, etc.).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/avatar` : "http://localhost:3000/avatar"}
                  className="min-w-0 flex-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg font-mono text-xs text-zinc-400 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                    navigator.clipboard.writeText(`${origin}/avatar`);
                    setCopiedAvatarUrl(true);
                    setTimeout(() => setCopiedAvatarUrl(false), 2000);
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer shrink-0"
                >
                  {copiedAvatarUrl ? "¡Copiado!" : "Copiar Enlace"}
                </button>
              </div>
            </SettingCard>

            <SettingCard title="Fuente de Audio">
              <label className="text-sm text-zinc-400 block mb-2">
                Selecciona tu micrófono principal:
              </label>
              <select
                value={selectedDevice}
                onChange={handleMicChange}
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </SettingCard>

            <SettingCard title="Umbral de Activación">
              <VolumeMeter volume={currentVolumePercent} />
              <div>
                <div className="flex justify-between text-sm text-zinc-400 mb-1">
                  <span>Sensibilidad</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {avatarThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={avatarThreshold}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </SettingCard>

            <SettingCard title="Enlaces de los Estados">
              <div className="space-y-4">
                <ImageUrlInput
                  label="Imagen En Espera (Idle):"
                  value={idleImg}
                  fileName={settings.idleImageName}
                  onChange={(url) => handleImgChange("idle", url)}
                  onFileChange={(file) => handleImageFileChange("idle", file)}
                />
                <ImageUrlInput
                  label="Imagen Hablando (Active):"
                  value={activeImg}
                  fileName={settings.activeImageName}
                  onChange={(url) => handleImgChange("active", url)}
                  onFileChange={(file) =>
                    handleImageFileChange("active", file)
                  }
                />
              </div>
            </SettingCard>
          </div>

          <aside className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm flex flex-col items-center justify-between min-h-[400px]">
            <div className="w-full flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
              <h2 className="text-lg font-bold">Vista Previa</h2>
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusClass}`}
              >
                {isTalking ? "HABLANDO" : "SILENCIO"}
              </span>
            </div>

            <AvatarPreview
              idleImg={idleImg}
              activeImg={activeImg}
              isTalking={isTalking}
            />

            <button
              type="button"
              onClick={() => sendAvatarTalkingState(isTalking)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-4"
            >
              Reenviar estado actual
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
