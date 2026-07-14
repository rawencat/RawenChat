'use client';
import Image from 'next/image';
import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import {
  AVATAR_DEFAULTS,
  AVATAR_EVENTS,
  type AvatarSettings,
} from '@/constants/avatar';
import {
  persistAvatarSettingsForOverlay,
  readAvatarSettings,
  readAvatarImage,
  readAvatarThreshold,
  sendAvatarTalkingState,
  updateAvatarSettings,
} from '@/utils/avatar';
import type { AvatarStateDetail } from '../../hooks/useAvatarAudioEngine';
import { 
  WindowDevTools20Regular, 
  Mic20Regular, 
  Image20Regular,
  PlayCircle20Regular,
  PauseCircle20Regular
} from '@fluentui/react-icons';
import Dropdown from '../global/Dropdown';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface SettingCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

function SettingCard({ title, icon, children }: SettingCardProps) {
  return (
    <section className="p-6 amoled-card rounded-2xl">
      <div className="flex items-center gap-3 mb-5">
        {icon && <div className="text-[var(--accent)]">{icon}</div>}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function VolumeMeter({ volume }: { volume: number }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-3">
        <span className="flex items-center gap-2">
          <Mic20Regular className="w-4 h-4" />
          Nivel de Entrada
        </span>
        <span className="font-mono text-[var(--accent)] font-bold text-lg">{volume}%</span>
      </div>
      <div className="h-4 bg-[var(--elevated)] rounded-full overflow-hidden border border-[var(--border)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)] rounded-full transition-all duration-75"
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
  const isLocalFile = value.startsWith('data:');

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
        <Image20Regular className="w-4 h-4" />
        {label}
      </label>
      <div className="flex gap-3 flex-wrap">
        <input
          type="url"
          value={isLocalFile ? '' : value}
          placeholder={isLocalFile ? 'Archivo local guardado' : 'https://ejemplo.com/avatar.png'}
          onChange={(event) => onChange(event.target.value)}
          className="amoled-input min-w-0 flex-1 font-mono text-sm"
        />
        <span className="relative shrink-0">
          <input
            type="file"
            accept="image/*"
            title="Selecciona una imagen local"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onFileChange(file);
              event.currentTarget.value = '';
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <span className="block px-5 py-3 amoled-button text-sm font-medium">
            Subir Imagen
          </span>
        </span>
      </div>
      {fileName && (
        <span className="text-sm text-[var(--accent)] flex items-center gap-2">
          ✓ {fileName}
        </span>
      )}
    </div>
  );
}

interface AvatarPreviewProps {
  idleImg: string;
  activeImg: string;
  isTalking: boolean;
}

function AvatarPreview({ idleImg, activeImg, isTalking }: AvatarPreviewProps) {
  return (
    <div className="relative w-full aspect-square bg-gradient-to-br from-[var(--elevated)] to-black border-2 border-[var(--border)] rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,176,122,0.1)_0%,_transparent_70%)] pointer-events-none" />
      <Image
        src={idleImg}
        alt="Preview Idle"
        fill
        unoptimized
        className={`object-contain transition-opacity duration-200 p-6 ${
          isTalking ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <Image
        src={activeImg}
        alt="Preview Active"
        fill
        unoptimized
        className={`object-contain transition-opacity duration-200 p-6 ${
          isTalking ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

interface AvatarConfigPageProps {
  setToastMessage: (msg: string) => void;
}

export default function AvatarConfigPage({ setToastMessage }: AvatarConfigPageProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
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
    setIdleImg(readAvatarImage('idle'));
    setActiveImg(readAvatarImage('active'));

    async function loadMicrophones() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices
          .filter((device) => device.kind === 'audioinput')
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
            : audioInputs[0]?.deviceId || '',
        );
      } catch (err) {
        console.error('Error listando dispositivos de audio:', err);
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

  const handleImgChange = (type: 'idle' | 'active', url: string) => {
    const updates =
      type === 'idle'
        ? { idleImage: url, idleImageName: '' }
        : { activeImage: url, activeImageName: '' };
    const nextSettings = updateAvatarSettings(updates);
    setSettings(nextSettings);
    void persistAvatarSettingsForOverlay(nextSettings);
    if (type === 'idle') {
      setIdleImg(url);
    } else {
      setActiveImg(url);
    }
  };

  const handleImageFileChange = (type: 'idle' | 'active', file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl !== 'string') return;

      const savedImage = await window.electron?.saveAvatarImage(
        file.name,
        dataUrl,
      );
      const imageUrl = savedImage?.url || dataUrl;
      const imageName = savedImage?.fileName || file.name;
      const updates =
        type === 'idle'
          ? { idleImage: imageUrl, idleImageName: imageName }
          : { activeImage: imageUrl, activeImageName: imageName };
      const nextSettings = updateAvatarSettings(updates);
      setSettings(nextSettings);
      await persistAvatarSettingsForOverlay(nextSettings);

      if (type === 'idle') {
        setIdleImg(imageUrl);
      } else {
        setActiveImg(imageUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const copyAvatarUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    navigator.clipboard.writeText(`${origin}/avatar`);
    setCopiedAvatarUrl(true);
    setToastMessage('URL de Avatar Overlay copiado');
    setTimeout(() => setCopiedAvatarUrl(false), 2000);
  };

  const statusClass = isTalking
    ? 'bg-[var(--success-muted)] text-[var(--success)]'
    : 'bg-[var(--elevated)] text-[var(--text-secondary)]';

  return (
    <div className="h-full overflow-y-auto rawen-scrollbar">
      <div className="p-6">
        {}
        <div className="amoled-card p-6 mb-6 flex items-center justify-between gap-4 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--accent-muted)] border border-[var(--accent-border)] rounded-2xl flex items-center justify-center">
              <WindowDevTools20Regular className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Overlay de Avatar para OBS</h3>
              <p className="text-sm text-[var(--text-muted)]">Copia el enlace para usarlo en tu streaming</p>
            </div>
          </div>
          <button onClick={copyAvatarUrl} className="amoled-button text-sm px-6 py-3 font-medium">
            {copiedAvatarUrl ? '¡Copiado!' : 'Copiar Enlace'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <div className="space-y-6">
            <SettingCard title="Fuente de Audio" icon={<Mic20Regular className="w-5 h-5" />}>
              <label className="text-sm text-[var(--text-secondary)] block mb-3 font-medium">
                Selecciona tu micrófono principal:
              </label>
              <select
                value={selectedDevice}
                onChange={handleMicChange}
                className="amoled-input w-full text-sm"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </SettingCard>

            <SettingCard title="Umbral de Activación" icon={isTalking ? <PlayCircle20Regular className="w-5 h-5" /> : <PauseCircle20Regular className="w-5 h-5" />}>
              <VolumeMeter volume={currentVolumePercent} />
              <div>
                <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-3">
                  <span className="font-medium">Sensibilidad</span>
                  <span className="font-mono text-[var(--accent)] font-bold text-lg">
                    {avatarThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={avatarThreshold}
                  onChange={handleSliderChange}
                  className="w-full h-3 bg-[var(--elevated)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>
            </SettingCard>

            <SettingCard title="Imágenes del Avatar" icon={<Image20Regular className="w-5 h-5" />}>
              <div className="space-y-8">
                <ImageUrlInput
                  label="Imagen En Espera (Idle):"
                  value={idleImg}
                  fileName={settings.idleImageName}
                  onChange={(url) => handleImgChange('idle', url)}
                  onFileChange={(file) => handleImageFileChange('idle', file)}
                />
                <ImageUrlInput
                  label="Imagen Hablando (Active):"
                  value={activeImg}
                  fileName={settings.activeImageName}
                  onChange={(url) => handleImgChange('active', url)}
                  onFileChange={(file) => handleImageFileChange('active', file)}
                />
              </div>
            </SettingCard>
          </div>

          {}
          <div className="amoled-card p-6 flex flex-col rounded-2xl">
            <div className="w-full flex justify-between items-center border-b border-[var(--border)] pb-5 mb-6">
              <h2 className="text-lg font-semibold text-white">Vista Previa</h2>
              <span
                className={`px-4 py-1.5 text-xs font-bold rounded-full ${statusClass} flex items-center gap-2`}
              >
                {isTalking ? <PlayCircle20Regular className="w-3.5 h-3.5" /> : <PauseCircle20Regular className="w-3.5 h-3.5" />}
                {isTalking ? 'HABLANDO' : 'SILENCIO'}
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
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mt-6 text-center font-medium"
            >
              Reenviar estado actual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}