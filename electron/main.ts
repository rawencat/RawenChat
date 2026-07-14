import { app } from "electron";
import { setupSingleInstanceLock } from "./single-instance";
import { startStaticServer } from "./static-server";
import { startAvatarWebSocketServer, startAvatarHttpServer } from "./avatar-server";
import { createWindow, getMainWindow } from "./window";
import { registerIpcHandlers } from "./ipc-handlers";
import { setupAutoUpdater } from "./auto-updater";

const isDev = !app.isPackaged;

const gotTheLock = setupSingleInstanceLock(getMainWindow);

if (gotTheLock) {
  registerIpcHandlers();
  setupAutoUpdater(isDev);

  app.whenReady().then(async () => {
    if (!isDev) {
      await startStaticServer();
    }

    try {
      startAvatarWebSocketServer();
      startAvatarHttpServer();
    } catch (err) {
      console.error("Error crítico al levantar servicios del avatar:", err);
    }

    createWindow();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}