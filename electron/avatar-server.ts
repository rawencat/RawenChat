import * as path from "path";
import * as http from "http";
import * as fs from "fs";
import { app } from "electron";
import { WebSocket, WebSocketServer } from "ws";
import { getContentType, sanitizeFileName } from "./utils";

const AVATAR_WS_PORT = 3002;
const AVATAR_HTTP_PORT = 3003;
const AVATAR_SETTINGS_FILE = "avatar-settings.json";
const OBS_COMPONENT_FILE = "obs-component.json";

export type AvatarSettings = {
  micId: string;
  threshold: number;
  idleImage: string;
  activeImage: string;
  idleImageName: string;
  activeImageName: string;
};

let avatarWss: WebSocketServer | null = null;

const getAvatarDataDir = () => path.join(app.getPath("userData"), "avatar");
const getAvatarAssetsDir = () => path.join(getAvatarDataDir(), "assets");
export const getAvatarSettingsPath = () => path.join(getAvatarDataDir(), AVATAR_SETTINGS_FILE);
export const getObsComponentPath = () => path.join(app.getPath("userData"), OBS_COMPONENT_FILE);

function ensureAvatarDirs(): void {
  fs.mkdirSync(getAvatarAssetsDir(), { recursive: true });
}

function writeJson(res: http.ServerResponse, data: unknown): void {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function broadcastJson(wss: WebSocketServer, payload: Record<string, unknown>): void {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

export function broadcastAvatarEvent(payload: Record<string, unknown>): void {
  if (avatarWss) broadcastJson(avatarWss, payload);
}

export function startAvatarWebSocketServer(): void {
  const wss = new WebSocketServer({ port: AVATAR_WS_PORT });
  avatarWss = wss;

  wss.on("connection", (ws) => {
    ws.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString()) as { type?: string; value?: unknown };

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

  console.log(`Servidor de puente para OBS encendido en ws://127.0.0.1:${AVATAR_WS_PORT}`);
}

export function startAvatarHttpServer(): void {
  ensureAvatarDirs();

  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${AVATAR_HTTP_PORT}`);

    if (requestUrl.pathname === "/avatar-settings") {
      fs.readFile(getAvatarSettingsPath(), "utf8", (err, data) => {
        if (err) return writeJson(res, null);
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(data);
      });
      return;
    }

    if (requestUrl.pathname === "/obs-component") {
      fs.readFile(getObsComponentPath(), "utf8", (err, data) => {
        if (err) return writeJson(res, null);
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
      const fileName = decodeURIComponent(requestUrl.pathname.replace("/avatar-assets/", ""));
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

  server.on("error", (err) => console.error("Error en avatar HTTP server:", err));
  server.listen(AVATAR_HTTP_PORT, "127.0.0.1", () => {
    console.log(`Servidor local de avatar para OBS en http://127.0.0.1:${AVATAR_HTTP_PORT}`);
  });
}

export async function saveAvatarImage(fileName: string, dataUrl: string): Promise<{ url: string; fileName: string }> {
  ensureAvatarDirs();
  const match = /^data:[^;]+;base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Formato de imagen inválido.");

  const safeFileName = sanitizeFileName(fileName);
  const filePath = path.join(getAvatarAssetsDir(), safeFileName);
  await fs.promises.writeFile(filePath, Buffer.from(match[1], "base64"));

  return {
    fileName,
    url: `http://127.0.0.1:${AVATAR_HTTP_PORT}/avatar-assets/${encodeURIComponent(safeFileName)}`,
  };
}

export async function saveAvatarSettings(settings: AvatarSettings): Promise<void> {
  ensureAvatarDirs();
  await fs.promises.writeFile(getAvatarSettingsPath(), JSON.stringify(settings, null, 2), "utf8");
  broadcastAvatarEvent({ type: "AVATAR_SETTINGS_UPDATED" });
}

export async function getAvatarSettings(): Promise<AvatarSettings | null> {
  try {
    const data = await fs.promises.readFile(getAvatarSettingsPath(), "utf8");
    return JSON.parse(data) as AvatarSettings;
  } catch {
    return null;
  }
}

export async function saveObsComponent(componentCode: string): Promise<void> {
  await fs.promises.writeFile(getObsComponentPath(), JSON.stringify({ componentCode }, null, 2), "utf8");
}

export async function getObsComponent(): Promise<string | null> {
  try {
    const data = await fs.promises.readFile(getObsComponentPath(), "utf8");
    return (JSON.parse(data) as { componentCode: string }).componentCode;
  } catch {
    return null;
  }
}