import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // Window controls
  pressKey: (key: string): Promise<void> =>
    ipcRenderer.invoke("press-key", key),
  minimize: (): Promise<void> =>
    ipcRenderer.invoke("window-minimize"),
  maximize: (): Promise<void> =>
    ipcRenderer.invoke("window-maximize"),
  close: (): Promise<void> =>
    ipcRenderer.invoke("window-close"),
  
  // TTS serverless functions
  getVoices: (language: string): Promise<string[]> =>
    ipcRenderer.invoke("get-voices", language),
  speakMessage: (text: string, language: string, voice: string): Promise<string> =>
    ipcRenderer.invoke("speak-message", { text, language, voice }),
  stopSpeaking: (): Promise<void> =>
    ipcRenderer.invoke("stop-speaking"),

  // Avatar overlay persistence
  saveAvatarImage: (fileName: string, dataUrl: string): Promise<{ url: string; fileName: string }> =>
    ipcRenderer.invoke("save-avatar-image", { fileName, dataUrl }),
  saveAvatarSettings: (settings: unknown): Promise<void> =>
    ipcRenderer.invoke("save-avatar-settings", settings),
  getAvatarSettings: (): Promise<unknown | null> =>
    ipcRenderer.invoke("get-avatar-settings"),
  
  // Diagnostics
  getDiagnostics: (): Promise<{ isElectron: true; version: string }> =>
    ipcRenderer.invoke("get-diagnostics"),
  
  isElectron: true,
});
