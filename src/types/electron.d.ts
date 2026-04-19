export {};

declare global {
  interface Window {
    electron?: {
      /** Simulate a key press at OS level (only available inside Electron). */
      pressKey: (key: string) => Promise<void>;
      /** Minimize the window (only available inside Electron). */
      minimize: () => Promise<void>;
      /** Maximize/unmaximize the window (only available inside Electron). */
      maximize: () => Promise<void>;
      /** Close the window (only available inside Electron). */
      close: () => Promise<void>;
      /** True when running inside Electron, undefined in the browser. */
      isElectron: boolean;
    };
  }
}
