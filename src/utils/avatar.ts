import {
  AVATAR_DEFAULTS,
  AVATAR_STORAGE_KEYS,
  AVATAR_WS_URL,
  DEFAULT_AVATAR_SETTINGS,
  type AvatarSettings,
} from "@/constants/avatar";
import { STORAGE_KEYS } from "@/constants/config";
import { getFromStorage, saveToStorage } from "@/utils/storage";

export const AVATAR_SETTINGS_URL = "http://127.0.0.1:3003/avatar-settings";

type AvatarWebSocketWindow = Window & {
  modalWebSocket?: WebSocket;
};

export function readAvatarThreshold(): number {
  const parsed = readAvatarSettings().threshold;
  return Number.isFinite(parsed) ? parsed : AVATAR_DEFAULTS.THRESHOLD;
}

export function readAvatarImage(kind: "idle" | "active"): string {
  const settings = readAvatarSettings();
  return kind === "idle" ? settings.idleImage : settings.activeImage;
}

export function readAvatarSettings(): AvatarSettings {
  if (typeof window === "undefined") {
    return DEFAULT_AVATAR_SETTINGS;
  }

  const saved = getFromStorage<Partial<AvatarSettings>>(
    STORAGE_KEYS.AVATAR_SETTINGS,
  );

  if (saved) {
    return {
      ...DEFAULT_AVATAR_SETTINGS,
      ...saved,
      threshold: Number.isFinite(Number(saved.threshold))
        ? Number(saved.threshold)
        : DEFAULT_AVATAR_SETTINGS.threshold,
    };
  }

  const legacyThreshold = localStorage.getItem(AVATAR_STORAGE_KEYS.THRESHOLD);
  const parsedThreshold = Number(legacyThreshold);

  return {
    ...DEFAULT_AVATAR_SETTINGS,
    micId: localStorage.getItem(AVATAR_STORAGE_KEYS.MIC_ID) || "",
    threshold: Number.isFinite(parsedThreshold)
      ? parsedThreshold
      : DEFAULT_AVATAR_SETTINGS.threshold,
    idleImage:
      localStorage.getItem(AVATAR_STORAGE_KEYS.IDLE_IMAGE) ||
      DEFAULT_AVATAR_SETTINGS.idleImage,
    activeImage:
      localStorage.getItem(AVATAR_STORAGE_KEYS.ACTIVE_IMAGE) ||
      DEFAULT_AVATAR_SETTINGS.activeImage,
  };
}

export function saveAvatarSettings(settings: AvatarSettings): void {
  saveToStorage(STORAGE_KEYS.AVATAR_SETTINGS, settings);
}

export function updateAvatarSettings(
  updates: Partial<AvatarSettings>,
): AvatarSettings {
  const nextSettings = {
    ...readAvatarSettings(),
    ...updates,
  };
  saveAvatarSettings(nextSettings);
  return nextSettings;
}

export async function persistAvatarSettingsForOverlay(
  settings: AvatarSettings,
): Promise<void> {
  await window.electron?.saveAvatarSettings(settings);
}

export async function readAvatarSettingsFromOverlayServer(): Promise<AvatarSettings | null> {
  try {
    const response = await fetch(AVATAR_SETTINGS_URL, { cache: "no-store" });
    if (!response.ok) return null;

    const data = (await response.json()) as Partial<AvatarSettings> | null;
    if (!data) return null;

    return {
      ...DEFAULT_AVATAR_SETTINGS,
      ...data,
      threshold: Number.isFinite(Number(data.threshold))
        ? Number(data.threshold)
        : DEFAULT_AVATAR_SETTINGS.threshold,
    };
  } catch {
    return null;
  }
}

export function normalizeVolumePercent(average: number): number {
  const normalized = average / 255;
  const percent = Math.round(Math.pow(normalized, 0.5) * 100);

  if (percent < AVATAR_DEFAULTS.MIN_NOISE_PERCENT) return 0;
  return Math.min(percent, 100);
}

export function getAvatarSocket(): WebSocket | null {
  if (typeof window === "undefined") return null;

  const avatarWindow = window as AvatarWebSocketWindow;
  const socket = avatarWindow.modalWebSocket;

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  const nextSocket = new WebSocket(AVATAR_WS_URL);
  nextSocket.onclose = () => {
    if (avatarWindow.modalWebSocket === nextSocket) {
      avatarWindow.modalWebSocket = undefined;
    }
  };

  avatarWindow.modalWebSocket = nextSocket;
  return nextSocket;
}

export function sendAvatarTalkingState(talking: boolean): void {
  const payload = JSON.stringify({
    type: "UPDATE_AVATAR_STATE",
    value: talking,
  });
  const socket = getAvatarSocket();

  if (!socket) return;
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(payload);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(payload);
    },
    { once: true },
  );
}
