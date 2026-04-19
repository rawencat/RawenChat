# RawenChat Serverless Architecture

## Overview

RawenChat has been converted to a **pure serverless architecture** for Electron, eliminating the need for an HTTP server while maintaining web compatibility. The application uses **Inter-Process Communication (IPC)** for all TTS operations in Electron mode.

## Architecture Design

### Production (Electron Desktop App)
```
┌─────────────────┐
│  React App      │
│  (Frontend)     │
└────────┬────────┘
         │ IPC (Serverless)
         ▼
┌─────────────────┐
│  Electron Main  │
│  (Backend)      │
│  - TTS Handler  │
│  - Voices Cache │
│  - Audio Stream │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  EdgeTTS        │
│  (Synthesis)    │
└─────────────────┘
```

### Development/Web
```
┌─────────────────┐
│  React App      │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────┐
│  Next.js API    │
│  /api/speak     │
│  /api/voices    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EdgeTTS        │
│  (Synthesis)    │
└─────────────────┘
```

## IPC Handlers

### Available Electron IPC Methods

Exposed through `window.electron` interface:

#### `getVoices(language: string): Promise<string[]>`
Fetches available voices for a specific language.

```typescript
const voices = await window.electron.getVoices("es-ES");
// Returns: ["es-ES-AlvaroNeural", "es-ES-ElviraNeural", ...]
```

#### `speakMessage(text: string, language: string, voice: string): Promise<string>`
Synthesizes text to speech and returns base64-encoded audio.

```typescript
const audioBase64 = await window.electron.speakMessage(
  "Hola mundo",
  "es-ES",
  "es-ES-AlvaroNeural"
);
```

#### `stopSpeaking(): Promise<void>`
Stops any currently playing audio.

```typescript
await window.electron.stopSpeaking();
```

#### `getDiagnostics(): Promise<{ isElectron: true; version: string }>`
Returns diagnostic information for debugging.

```typescript
const diags = await window.electron.getDiagnostics();
// { isElectron: true, version: "1.0.0" }
```

## File Structure

### Electron IPC Layer
- **`electron/preload.ts`**: Exposes IPC methods through context bridge
- **`electron/main.ts`**: Implements IPC handlers and manages Electron lifecycle

### Utilities
- **`src/utils/tts.ts`**: Smart TTS provider that:
  - Detects Electron environment
  - Uses IPC for Electron (serverless)
  - Falls back to API for web
  - Manages audio playback
  
- **`src/utils/serviceWorker.ts`**: Service Worker registration and helpers
  - Registers `/public/sw.js`
  - Provides offline support
  - Implements caching strategies

### Service Worker
- **`public/sw.js`**: Client-side caching and offline support
  - Network-first strategy for dynamic content
  - Cache fallback for offline
  - Automatic cache updates

### Components
- **`src/components/ServiceWorkerRegistrar.tsx`**: Client component that registers the SW on mount

## Implementation Details

### TTS Flow in Electron

1. User calls `speakMessage(text, language, voice)`
2. `tts.ts` detects Electron environment
3. Calls `window.electron.speakMessage()` (IPC)
4. Electron main process receives handler
5. EdgeTTS synthesizes audio
6. Returns base64-encoded audio back to renderer
7. Audio plays in browser via Web Audio API

### Fallback Strategy

If IPC is not available or fails:
- Attempts to use `/api/speak` HTTP endpoint
- This enables running as web app or PWA
- Service Worker caches responses for offline use

### Offline Support

Service Worker provides:
- **Network-first caching** for static assets
- **Offline fallback** for unavailable resources
- **Automatic updates** when new versions are available
- **Selective caching** (excludes API routes and Electron checks)

## Build Configuration

### Next.js Config
```typescript
const nextConfig: NextConfig = {
  output: "export", // Static export - no server needed
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

### Build Process
1. `next build` → generates static files in `out/`
2. `electron:compile` → compiles Electron code
3. `electron-builder` → packages Electron app with static files

## Performance Benefits

### Serverless (Electron)
✅ No HTTP overhead - direct IPC communication
✅ Faster response times
✅ Lower latency
✅ No server infrastructure needed
✅ Offline-ready

### Web Fallback
✅ API-based TTS available
✅ Service Worker caching
✅ Progressive enhancement

## Development vs Production

### Development (`npm run electron:dev`)
- Runs Next.js dev server on `http://localhost:3000`
- Electron loads dev server
- API routes available on `/api/*`
- IPC handlers also available for testing

### Production (Electron Build)
- `next build` exports static files to `out/`
- Electron serves static files on `http://localhost:3000`
- All TTS via IPC (serverless)
- No Next.js server running

## Environment Variables

No specific env vars needed for serverless IPC operation. The app auto-detects:
- Electron presence via `window.electron.isElectron`
- Uses appropriate backend (IPC or API)

## Debugging

### Check Electron Status
```javascript
// In DevTools console:
window.electron?.getDiagnostics()
```

### Monitor IPC Calls
Check Electron DevTools console for IPC handler logs:
```
[IPC] get-voices: es-ES
[IPC] speak-message: "Hola mundo"
```

### Verify Service Worker
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations()
```

## Migration Notes

### From HTTP to Serverless IPC

If you're updating from the old HTTP-based API:

1. **preload.ts**: Now exposes `speakMessage()` and `getVoices()`
2. **main.ts**: Removed HTTP API endpoints, added IPC handlers
3. **tts.ts**: Automatically detects and uses IPC first
4. **No breaking changes** - existing code still works via fallback

## Future Improvements

- [ ] Audio caching to disk for performance
- [ ] Voice synthesis result caching
- [ ] Streaming audio support
- [ ] Multi-language voice selection UI
- [ ] Voice settings persistence

---

**Last Updated**: 2026-04-19
