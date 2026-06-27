import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as http from "http";
import * as fs from "fs";
import { WINDOW_CONFIG, DEV_URL, WIN_KEYS, MAC_KEYS } from "./config";
import { EdgeTTS } from "@andresaya/edge-tts";
import { WebSocket, WebSocketServer } from "ws";

const isDev = !app.isPackaged;
const AVATAR_WS_PORT = 3002;
const AVATAR_HTTP_PORT = 3003;
const AVATAR_SETTINGS_FILE = "avatar-settings.json";
let avatarWss: WebSocketServer | null = null;

type AvatarSettings = {
  micId: string;
  threshold: number;
  idleImage: string;
  activeImage: string;
  idleImageName: string;
  activeImageName: string;
};

function getAvatarDataDir(): string {
  return path.join(app.getPath("userData"), "avatar");
}

function getAvatarAssetsDir(): string {
  return path.join(getAvatarDataDir(), "assets");
}

function getAvatarSettingsPath(): string {
  return path.join(getAvatarDataDir(), AVATAR_SETTINGS_FILE);
}

function ensureAvatarDirs(): void {
  fs.mkdirSync(getAvatarAssetsDir(), { recursive: true });
}

function sanitizeFileName(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase() || ".png";
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${baseName || "avatar"}-${Date.now()}${extension}`;
}

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".gif") return "image/gif";
  if (extension === ".webp") return "image/webp";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".json") return "application/json";
  if (extension === ".css") return "text/css";
  if (extension === ".js") return "application/javascript";
  if (extension === ".ico") return "image/x-icon";
  if (extension === ".woff2") return "font/woff2";
  return "text/html";
}

function writeJson(res: http.ServerResponse, data: unknown): void {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function broadcastJson(
  wss: WebSocketServer,
  payload: Record<string, unknown>,
): void {
  const message = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function startAvatarWebSocketServer(): void {
  const wss = new WebSocketServer({ port: AVATAR_WS_PORT });
  avatarWss = wss;

  wss.on("connection", (ws) => {
    ws.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString()) as {
          type?: string;
          value?: unknown;
        };

        if (data.type === "UPDATE_AVATAR_STATE") {
          broadcastJson(wss, { type: "SET_ACTIVE", value: Boolean(data.value) });
        }

        if (data.type === "UPDATE_THRESHOLD") {
          broadcastJson(wss, { type: "NEW_THRESHOLD", value: data.value });
        }
      } catch (err) {
        console.error("Error procesando mensaje WS en el servidor:", err);
      }
    });
  });

  console.log(
    `Servidor de puente para OBS encendido en ws://localhost:${AVATAR_WS_PORT}`,
  );
}

function startAvatarHttpServer(): void {
  ensureAvatarDirs();

  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${AVATAR_HTTP_PORT}`);

    if (requestUrl.pathname === "/avatar-settings") {
      fs.readFile(getAvatarSettingsPath(), "utf8", (err, data) => {
        if (err) {
          writeJson(res, null);
          return;
        }

        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(data);
      });
      return;
    }

    if (requestUrl.pathname.startsWith("/avatar-assets/")) {
      const fileName = decodeURIComponent(
        requestUrl.pathname.replace("/avatar-assets/", ""),
      );
      const filePath = path.resolve(getAvatarAssetsDir(), fileName);
      const assetsDir = path.resolve(getAvatarAssetsDir());

      if (!filePath.startsWith(assetsDir + path.sep)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": getContentType(filePath),
          "Cache-Control": "no-store",
        });
        res.end(data);
      });
      return;
    }

    res.writeHead(404, { "Access-Control-Allow-Origin": "*" });
    res.end("Not Found");
  });

  server.listen(AVATAR_HTTP_PORT, "127.0.0.1", () => {
    console.log(
      `Servidor local de avatar para OBS en http://127.0.0.1:${AVATAR_HTTP_PORT}`,
    );
  });
}

function startStaticServer(port: number = 3000): Promise<void> {
  return new Promise((resolve) => {
    const outDir = path.join(__dirname, "../out");
    
    const server = http.createServer(async (req, res) => {
      const url = req.url || "/";
      let urlWithoutQuery = url.split("?")[0];

      // Trim trailing slash (except for the root "/")
      if (urlWithoutQuery.length > 1 && urlWithoutQuery.endsWith("/")) {
        urlWithoutQuery = urlWithoutQuery.slice(0, -1);
      }

      // Serve static files only (APIs are now serverless via IPC)
      let filePath = path.join(outDir, urlWithoutQuery === "/" ? "index.html" : urlWithoutQuery);

      // Helper function to check if a path exists and is a file
      const isFile = (p: string): boolean => {
        try {
          return fs.statSync(p).isFile();
        } catch {
          return false;
        }
      };

      // If filePath does not point to an existing file, resolve the appropriate file path
      if (!isFile(filePath)) {
        const htmlPath = filePath + ".html";
        if (isFile(htmlPath)) {
          filePath = htmlPath;
        } else {
          const indexPath = path.join(filePath, "index.html");
          if (isFile(indexPath)) {
            filePath = indexPath;
          } else {
            // Fallback to root index.html
            filePath = path.join(outDir, "index.html");
          }
        }
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        res.writeHead(200, { "Content-Type": getContentType(filePath) });
        res.end(data);
      });
    });

    server.listen(port, () => {
      resolve();
    });
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: WINDOW_CONFIG.WIDTH,
    height: WINDOW_CONFIG.HEIGHT,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    title: WINDOW_CONFIG.TITLE,
    frame:false,
    icon: "logo.png",

  
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools();
  } else {
    win.loadURL("http://localhost:3000");
  }

}

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
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


const ALLOWED_KEY_RE =
  /^(?:[a-zA-Z0-9]|F(?:1[0-2]|[1-9])|space|enter|escape|backspace|tab|up|down|left|right|shift|ctrl|alt|win)$/i;

ipcMain.handle("press-key", async (_event, key: string) => {
  if (typeof key !== "string" || !ALLOWED_KEY_RE.test(key.trim())) {
    console.warn("press-key: rejected invalid key:", key);
    return;
  }
  const safeKey = key.trim().toLowerCase();
  simulateKey(safeKey);
});

function simulateKey(key: string): void {
  const platform = process.platform;
  const { execFile } = require("child_process") as typeof import("child_process");

  if (platform === "win32") {
    const winKey = WIN_KEYS[key] ?? key;
    const safe = winKey.replace(/['"\\$`]/g, "");
    execFile(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${safe}')`,
      ],
      (err: Error | null) => {
        if (err) console.error("press-key win32 error:", err);
      }
    );
  } else if (platform === "linux") {
    execFile("xdotool", ["key", key], (err: Error | null) => {
      if (err) console.error("press-key linux error:", err);
    });
  } else if (platform === "darwin") {
    const keyCode = MAC_KEYS[key as keyof typeof MAC_KEYS];
    if (keyCode !== undefined) {
      execFile(
        "osascript",
        ["-e", `tell application "System Events" to key code ${keyCode}`],
        (err: Error | null) => {
          if (err) console.error("press-key darwin error:", err);
        }
      );
    } else if (/^[a-zA-Z0-9]$/.test(key)) {
      execFile(
        "osascript",
        ["-e", `tell application "System Events" to keystroke "${key}"`],
        (err: Error | null) => {
          if (err) console.error("press-key darwin error:", err);
        }
      );
    }
  }
}

// Window control handlers
ipcMain.handle("window-minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.handle("window-maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle("window-close", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

// Serverless TTS handlers (IPC-based instead of HTTP)
let audioBuffer: Buffer | null = null;

ipcMain.handle("get-voices", async (_event, language: string): Promise<string[]> => {
  try {
    const tts = new EdgeTTS();
    const voices = await Promise.race([
      tts.getVoicesByLanguage(language),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
    ]);

    // Convert voices to array of strings
    const voiceList = Array.isArray(voices)
      ? voices
          .map((v) => {
            if (typeof v === "string") return v;
            const obj = v as Record<string, unknown>;
            return (
              (typeof obj.name === "string" ? obj.name : "") ||
              (typeof obj.ShortName === "string" ? obj.ShortName : "") ||
              (typeof obj.LocalName === "string" ? obj.LocalName : "") ||
              ""
            );
          })
          .filter(Boolean)
      : [];

    return voiceList;
  } catch (error) {
    console.error("get-voices error:", error);
    return [];
  }
});

ipcMain.handle(
  "speak-message",
  async (
    _event,
    {
      text,
      language = "es-ES",
      voice = "",
    }: { text: string; language: string; voice: string }
  ): Promise<string> => {
    try {
      if (!text) {
        throw new Error("Text is required");
      }

      const tts = new EdgeTTS();
      const chunks: Uint8Array[] = [];
      const voiceParam = voice || language;

      for await (const chunk of tts.synthesizeStream(text, voiceParam)) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else {
          chunks.push(new Uint8Array(chunk));
        }
      }

      audioBuffer = Buffer.concat(chunks);
      const audioBase64 = audioBuffer.toString("base64");

      return audioBase64;
    } catch (error) {
      console.error("speak-message error:", error);
      throw error;
    }
  }
);

ipcMain.handle("stop-speaking", () => {
  audioBuffer = null;
  return Promise.resolve();
});

ipcMain.handle(
  "save-avatar-image",
  async (
    _event,
    { fileName, dataUrl }: { fileName: string; dataUrl: string },
  ): Promise<{ url: string; fileName: string }> => {
    ensureAvatarDirs();

    const match = /^data:[^;]+;base64,(.+)$/i.exec(dataUrl);
    if (!match) {
      throw new Error("Formato de imagen inválido.");
    }

    const safeFileName = sanitizeFileName(fileName);
    const filePath = path.join(getAvatarAssetsDir(), safeFileName);
    await fs.promises.writeFile(filePath, Buffer.from(match[1], "base64"));

    return {
      fileName,
      url: `http://127.0.0.1:${AVATAR_HTTP_PORT}/avatar-assets/${encodeURIComponent(safeFileName)}`,
    };
  },
);

ipcMain.handle(
  "save-avatar-settings",
  async (_event, settings: AvatarSettings): Promise<void> => {
    ensureAvatarDirs();
    await fs.promises.writeFile(
      getAvatarSettingsPath(),
      JSON.stringify(settings, null, 2),
      "utf8",
    );
    if (avatarWss) {
      broadcastJson(avatarWss, { type: "AVATAR_SETTINGS_UPDATED" });
    }
  },
);

ipcMain.handle("get-avatar-settings", async (): Promise<AvatarSettings | null> => {
  try {
    const data = await fs.promises.readFile(getAvatarSettingsPath(), "utf8");
    return JSON.parse(data) as AvatarSettings;
  } catch {
    return null;
  }
});

ipcMain.handle("get-diagnostics", () => {
  return {
    isElectron: true,
    version: app.getVersion(),
  };
});
