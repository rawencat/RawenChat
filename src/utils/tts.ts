let currentAudio: HTMLAudioElement | null = null;

/**
 * Check if running in Electron environment
 */
function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  return (window as any).electron?.isElectron === true;
}

/**
 * Get Electron API object with type safety
 */
function getElectronAPI() {
  return (window as any).electron;
}

/**
 * Extract voice name from various EdgeTTS voice object formats
 */
function extractVoiceName(voice: unknown): string | null {
  if (typeof voice === "string") {
    return voice;
  }
  
  if (voice && typeof voice === "object") {
    const obj = voice as Record<string, unknown>;
    const name =
      (typeof obj.name === "string" && obj.name) ||
      (typeof obj.ShortName === "string" && obj.ShortName) ||
      (typeof obj.shortName === "string" && obj.shortName) ||
      (typeof obj.short_name === "string" && obj.short_name) ||
      (typeof obj.LocalName === "string" && obj.LocalName) ||
      (typeof obj.localName === "string" && obj.localName) ||
      (typeof obj.Locale === "string" && obj.Locale) ||
      (typeof obj.locale === "string" && obj.locale) ||
      null;
    
    if (name && typeof name === "string" && name !== "[object Object]") {
      return name;
    }
  }
  
  return null;
}

/**
 * Normalize and deduplicate voices array from EdgeTTS
 */
export function normalizeVoices(voices: unknown[]): string[] {
  const voiceSet = new Set<string>();
  
  if (Array.isArray(voices)) {
    voices.forEach((v) => {
      const voiceName = extractVoiceName(v);
      if (voiceName) {
        voiceSet.add(voiceName);
      }
    });
  }
  
  return Array.from(voiceSet);
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Also stop Electron audio if available
  if (isElectron()) {
    const electron = getElectronAPI();
    if (electron?.stopSpeaking) {
      electron.stopSpeaking().catch((err: Error) => {
        console.error("Error stopping Electron TTS:", err);
      });
    }
  }
}

export async function speakMessage(
  message?: string,
  language: string = "es-ES",
  voice: string = "",
  volume: number = 100
): Promise<void> {
  if (!message) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      stopSpeaking();

      // Try Electron IPC first (serverless approach for desktop app)
      if (isElectron()) {
        const electron = getElectronAPI();
        if (electron?.speakMessage) {
          electron
            .speakMessage(message, language, voice)
            .then((audioBase64: string) => {
              playAudio(audioBase64, volume, resolve);
            })
            .catch((err: Error) => {
              console.error("Electron TTS error:", err);
              // Fallback to API
              speakViaAPI(message, language, voice, volume, resolve);
            });
          return;
        }
      }

      // Fallback to API for web version
      speakViaAPI(message, language, voice, volume, resolve);
    } catch (error) {
      console.error("speakMessage error:", error);
      resolve();
    }
  });
}

/**
 * Play audio from base64-encoded data
 */
function playAudio(
  audioBase64: string,
  volume: number,
  callback: () => void
): void {
  try {
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);

    currentAudio = new Audio(audioUrl);
    currentAudio.volume = Math.max(0, Math.min(1, volume / 100));

    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      callback();
    };

    currentAudio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      callback();
    };

    currentAudio.play().catch(() => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      callback();
    });
  } catch (err) {
    console.error("Error playing audio:", err);
    callback();
  }
}

/**
 * Fallback TTS via API endpoint (for web version - disabled in static export)
 * This is kept for reference but won't be used in production Electron app
 */
function speakViaAPI(
  message: string,
  language: string,
  voice: string,
  volume: number,
  callback: () => void
): void {
  console.warn("API TTS not available - using Electron IPC only");
  callback();
}

export async function getAvailableVoices(language: string): Promise<string[]> {
  try {
    // Electron IPC only - this is a serverless desktop app
    if (isElectron()) {
      const electron = getElectronAPI();
      if (electron?.getVoices) {
        try {
          const voices = await electron.getVoices(language);
          if (voices && Array.isArray(voices) && voices.length > 0) {
            return voices;
          }
        } catch (err) {
          console.error("Electron getVoices error:", err);
        }
      }
    }

    // No API fallback - this is a static export, not a server app
    console.warn("getAvailableVoices: Not in Electron environment");
    return [];
  } catch (error) {
    console.error("Error getting voices:", error);
    return [];
  }
}
