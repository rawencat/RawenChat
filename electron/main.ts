import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as http from "http";
import * as fs from "fs";
import { WINDOW_CONFIG, DEV_URL, WIN_KEYS, MAC_KEYS } from "./config";
import { EdgeTTS } from "@andresaya/edge-tts";

const isDev = !app.isPackaged;

function startStaticServer(port: number = 3000): Promise<void> {
  return new Promise((resolve) => {
    const outDir = path.join(__dirname, "../out");
    
    const server = http.createServer(async (req, res) => {
      const url = req.url || "/";
      const urlWithoutQuery = url.split("?")[0];

      // Serve static files only (APIs are now serverless via IPC)
      let filePath = path.join(outDir, urlWithoutQuery === "/" ? "index.html" : urlWithoutQuery);

      // If file doesn't exist, try with .html extension (for Next.js export routes)
      if (!fs.existsSync(filePath)) {
        const htmlPath = filePath + ".html";
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
        } else {
          // Try index.html in directory
          const indexPath = path.join(filePath, "index.html");
          if (fs.existsSync(indexPath)) {
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

        let contentType = "text/html";
        if (filePath.endsWith(".css")) contentType = "text/css";
        if (filePath.endsWith(".js")) contentType = "application/javascript";
        if (filePath.endsWith(".json")) contentType = "application/json";
        if (filePath.endsWith(".png")) contentType = "image/png";
        if (filePath.endsWith(".jpg")) contentType = "image/jpeg";
        if (filePath.endsWith(".ico")) contentType = "image/x-icon";
        if (filePath.endsWith(".woff2")) contentType = "font/woff2";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      });
    });

    server.listen(port, () => {
      resolve();
    });
  });
}

function createWindow() {
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

ipcMain.handle("get-diagnostics", () => {
  return {
    isElectron: true,
    version: app.getVersion(),
  };
});
