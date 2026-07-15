<div align="center">

<img src="public/logo.png" alt="RawenChat Logo" width="120" />

# 🐱 RawenChat

**La app definitiva para streamers de Twitch y Kick**

[![Download](https://img.shields.io/badge/⬇_Descargar-v2.2.3-blue?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/RevenzMind/RawenChat/releases/latest)
[![Twitch](https://img.shields.io/badge/Twitch-Supported-9146FF?style=for-the-badge&logo=twitch&logoColor=white)](https://www.twitch.tv)
[![Kick](https://img.shields.io/badge/Kick-Supported-53FC18?style=for-the-badge&logo=kick&logoColor=white)](https://kick.com)

---

Lee el chat de tu canal en tiempo real, ejecuta comandos, reproduce sonidos, activa teclas y usa overlays personalizados para OBS.

</div>

---

## 🐾 Showcase

<div align="center">

### Pantalla de inicio
![Start](public/showcase/start.png)

### Chat en vivo
![Home Chat](public/showcase/homechat.png)

### Editor de comandos
![Commands](public/showcase/commands.png)

### Edición de código
![Edit](public/showcase/edit.png)

### Configuración
![Settings](public/showcase/settings.png)

### Avatar Overlay
![Avatar](public/showcase/avatar.png)

### Embed personalizado
![Embed](public/showcase/Embed.png)

</div>

---

## ⚡ Funcionalidades

| Feature | Descripción |
|---------|-------------|
| 🗣️ **TTS** | Lee los mensajes del chat en voz alta con Microsoft Edge TTS |
| ⌨️ **Comandos** | Crea comandos que reproducen sonidos, activan teclas o responden texto |
| 🎭 **Avatar Overlay** | Overlay reactivo al micrófono para tu avatar en OBS |
| 💬 **Chat Overlay** | Overlay de chat personalizable con código React en tiempo real |
| 🔄 **Auto Scroll** | El chat se desplaza automáticamente para seguir los mensajes |
| ⏱️ **Rate Limiting** | Timeouts por comando y por usuario para evitar abusos |
| 🌐 **Multiplataforma** | Twitch (tmi.js) y Kick (WebSocket) soportados |
| 🖥️ **Electron** | App de escritorio multiplataforma (Windows, Mac, Linux) |

---

## 🐱 Overlays para OBS

### Chat Overlay

1. Abre la app y conecta tu canal
2. Haz clic en **"Copiar URL del Overlay"**
3. En OBS, agrega una fuente **"Browser"** y pega la URL
4. Personaliza el componente del overlay con el editor de código integrado (React + Tailwind)

![Chat Overlay](public/obs.png)

### Avatar Overlay

1. Ve a la pestaña **Avatar** en la app
2. Configura tu micrófono, imágenes idle/active y sensibilidad
3. Haz clic en **"Copiar URL"** y pégala como fuente Browser en OBS
4. Tu avatar reaccionará en tiempo real a tu voz

---

## 🚀 Inicio rápido

### App de escritorio

1. Descarga la última versión desde [Releases](https://github.com/RevenzMind/RawenChat/releases/latest)
2. Instala y ejecuta
3. Elige tu plataforma (Twitch/Kick), escribe tu usuario y conecta

### Desarrollo

```bash
git clone https://github.com/RevenzMind/RawenChat.git
cd RawenChat
pnpm install
pnpm dev
```

Abre `http://localhost:3000`

---

## 🐱 Ejemplos de comandos

```
!hola      → responde con texto
!sonido    → reproduce un sonido
!alerta    → muestra una alerta visual
!escena    → simula una tecla / cambia de escena en OBS
```

---

## 🛠️ Tech Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-31-47848F?style=for-the-badge&logo=electron&logoColor=white)
![tmi.js](https://img.shields.io/badge/tmi.js-Twitch-9146FF?style=for-the-badge)

</div>

---

## 📦 Estructura del proyecto

```
RawenChat/
├── electron/          # Electron main process (TypeScript)
├── src/               # Next.js frontend (React 19 + Tailwind)
│   ├── app/
│   │   ├── page.tsx        # App principal
│   │   ├── obs/page.tsx    # Overlay de chat para OBS
│   │   └── avatar/page.tsx # Overlay de avatar para OBS
│   ├── components/    # UI components
│   ├── hooks/         # Custom hooks (TTS, Avatar, Chat)
│   └── utils/         # Utility functions
├── public/            # Static assets
│   └── showcase/      # Screenshots para el README
├── scripts/           # Release & deploy scripts
└── server.js          # WebSocket bridge (dev mode)
```

---

<div align="center">

**Hecho con 🐱 por [RawenCat](https://chat.rawencat.tech)**

</div>
