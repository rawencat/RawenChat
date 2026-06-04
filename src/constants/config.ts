export const STORAGE_KEYS = {
  COMMANDS: "rawenchat_commands",
  TTS_ENABLED: "rawenchat_tts_enabled",
  TTS_LANGUAGE: "rawenchat_tts_language",
  TTS_VOICE: "rawenchat_tts_voice",
  TTS_VOLUME: "rawenchat_tts_volume",
} as const;

export const APP_LANGUAGE = "es-ES";

export const DEFAULTS = {
  COMMAND_TIMEOUT_MS: 5000,
  COMMAND_ACTION_TYPE: "key" as const,
} as const;

export const APP_INFO = {
  NAME: "RawenChat",
  DESCRIPTION: "Visor de chat de Twitch y Kick con soporte de TTS y comandos personalizados",
  THEME_COLOR: "#ffb823",
  APP_ID: "com.rawenchat.app",
} as const;

export const DEV_CONFIG = {
  DEV_URL: "http://localhost:3000",
} as const;

