export const AVATAR_WS_URL = "ws://127.0.0.1:3002";

export const AVATAR_STORAGE_KEYS = {
  MIC_ID: "avatar-mic-id",
  THRESHOLD: "avatar-threshold",
  IDLE_IMAGE: "avatar-img-idle",
  ACTIVE_IMAGE: "avatar-img-active",
} as const;

export const AVATAR_EVENTS = {
  RELOAD_MIC: "reload-avatar-mic",
  STATE_CHANGE: "avatar-state-change",
} as const;

export const AVATAR_DEFAULTS = {
  THRESHOLD: 50,
  SAMPLE_INTERVAL_MS: 50,
  SILENCE_HOLD_MS: 150,
  MIN_NOISE_PERCENT: 12,
  IDLE_IMAGE: "https://cdn.rawencat.tech/1758710381105.jpg",
  ACTIVE_IMAGE:
    "https://cdn.discordapp.com/attachments/1517775603036848189/1519165929714483220/image.png?ex=6a3fdcc6&is=6a3e8b46&hm=b181121b97e30e124c806cfddc41b575786bec552ff951ead0209f4418409e46&",
} as const;

export interface AvatarSettings {
  micId: string;
  threshold: number;
  idleImage: string;
  activeImage: string;
  idleImageName: string;
  activeImageName: string;
}

export const DEFAULT_AVATAR_SETTINGS: AvatarSettings = {
  micId: "",
  threshold: AVATAR_DEFAULTS.THRESHOLD,
  idleImage: AVATAR_DEFAULTS.IDLE_IMAGE,
  activeImage: AVATAR_DEFAULTS.ACTIVE_IMAGE,
  idleImageName: "",
  activeImageName: "",
};
