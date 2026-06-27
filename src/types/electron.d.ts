export {};

declare global {
  interface Window {
    modalWebSocket?: WebSocket;
    currentVolume?: number;
    currentAvatarTalking?: boolean;
    electron?: {
      /** Simulate a key press at OS level (only available inside Electron). */
      pressKey: (key: string) => Promise<void>;
      /** Minimize the window (only available inside Electron). */
      minimize: () => Promise<void>;
      /** Maximize/unmaximize the window (only available inside Electron). */
      maximize: () => Promise<void>;
      /** Close the window (only available inside Electron). */
      close: () => Promise<void>;
      saveAvatarImage: (
        fileName: string,
        dataUrl: string,
      ) => Promise<{ url: string; fileName: string }>;
      saveAvatarSettings: (settings: unknown) => Promise<void>;
      getAvatarSettings: () => Promise<unknown | null>;
      /** True when running inside Electron, undefined in the browser. */
      isElectron: boolean;
    };
    electronAPI: {
      getThreshold: () => Promise<number>;
      setThreshold: (value: number) => void;
      onThresholdChanged: (callback: (value: number) => void) => void;
      removeThresholdListener: () => void;
    };
  }
}
