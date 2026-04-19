"use client";
import { useState } from "react";
import { Keyboard20Filled, Joystick20Filled, Speaker020Regular } from "@fluentui/react-icons";
import { isValidKey } from "@/constants/validation";
import { DEFAULTS } from "@/constants/config";

export interface Command {
  id: string;
  name: string;
  trigger: string;
  key: string;
  timeout?: number;
  actionType?: "key" | "sound" | "both";
  soundFile?: string;
  rateLimitType?: "global" | "per-user";
}

interface CommandsPanelProps {
  commands: Command[];
  setCommands: (commands: Command[]) => void;
  isLocked?: boolean;
}

const EMPTY_COMMAND: Omit<Command, "id"> = { 
  name: "", 
  trigger: "", 
  key: "", 
  timeout: DEFAULTS.COMMAND_TIMEOUT_MS, 
  actionType: DEFAULTS.COMMAND_ACTION_TYPE, 
  soundFile: "",
  rateLimitType: "per-user"
};

export default function CommandsPanel({
  commands,
  setCommands,
  isLocked = false,
}: CommandsPanelProps) {
  const [editing, setEditing] = useState<Command | null>(null);
  const [form, setForm] = useState<Omit<Command, "id">>(EMPTY_COMMAND);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(0);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(5);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  function startAdd() {
    setEditing({ id: "", ...EMPTY_COMMAND });
    setForm(EMPTY_COMMAND);
    setTimeoutMinutes(0);
    setTimeoutSeconds(Math.floor((DEFAULTS.COMMAND_TIMEOUT_MS % 60000) / 1000));
    setSelectedFileName("");
    setErrors({});
  }

  function startEdit(cmd: Command) {
    const totalMs = cmd.timeout || DEFAULTS.COMMAND_TIMEOUT_MS;
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    setEditing(cmd);
    setForm({ name: cmd.name, trigger: cmd.trigger, key: cmd.key, timeout: cmd.timeout, actionType: cmd.actionType, soundFile: cmd.soundFile, rateLimitType: cmd.rateLimitType || "per-user" });
    setTimeoutMinutes(mins);
    setTimeoutSeconds(secs);
    setSelectedFileName(cmd.soundFile ? "[Audio guardado]" : "");
    setErrors({});
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido.";
    if (!form.trigger.trim()) {
      errs.trigger = "El comando es requerido.";
    } else if (!form.trigger.trim().startsWith("!")) {
      errs.trigger = "El comando debe empezar con !";
    }
    if (!form.key.trim()) {
      errs.key = "La tecla es requerida.";
    } else if (!isValidKey(form.key)) {
      errs.key =
        "Tecla inválida. Usa letras, números o: space, enter, escape, f1–f12, up, down, left, right, tab, backspace.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function getNextId(): string {
    if (commands.length === 0) return "1";
    const maxId = Math.max(...commands.map(c => parseInt(c.id) || 0));
    return String(maxId + 1);
  }

  function save() {
    if (!validate()) return;
    const totalTimeoutMs = timeoutMinutes * 60000 + timeoutSeconds * 1000;
    if (audioBlob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        const updated = editing?.id
          ? commands.map((c) =>
              c.id === editing.id
                ? { ...c, ...form, soundFile: dataUrl, timeout: totalTimeoutMs, trigger: form.trigger.trim().toLowerCase(), key: form.key.trim().toLowerCase(), rateLimitType: form.rateLimitType || "per-user" }
                : c
            )
          : [
              ...commands,
              {
                id: getNextId(),
                ...form,
                soundFile: dataUrl,
                timeout: totalTimeoutMs,
                trigger: form.trigger.trim().toLowerCase(),
                key: form.key.trim().toLowerCase(),
                rateLimitType: form.rateLimitType || "per-user",
              },
            ];
        setCommands(updated);
        setEditing(null);
        setAudioBlob(null);
        setSelectedFileName("");
      };
      reader.readAsDataURL(audioBlob);
      return;
    }
    
    const updated = editing?.id
      ? commands.map((c) =>
          c.id === editing.id
            ? { ...c, ...form, soundFile: form.soundFile || "", timeout: totalTimeoutMs, trigger: form.trigger.trim().toLowerCase(), key: form.key.trim().toLowerCase(), rateLimitType: form.rateLimitType || "per-user" }
            : c
        )
      : [
          ...commands,
          {
            id: getNextId(),
            ...form,
            soundFile: form.soundFile || "",
            timeout: totalTimeoutMs,
            trigger: form.trigger.trim().toLowerCase(),
            key: form.key.trim().toLowerCase(),
            rateLimitType: form.rateLimitType || "per-user",
          },
        ];
    setCommands(updated);
    setEditing(null);
    setAudioBlob(null);
    setSelectedFileName("");
  }

  function remove(id: string) {
    setCommands(commands.filter((c) => c.id !== id));
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard20Filled />
          <h2 className="text-lg font-semibold">Comandos Personalizados</h2>
        </div>
        <button
          onClick={startAdd}
          disabled={isLocked}
          className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
            isLocked
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          + Agregar
        </button>
      </div>

      <p className="text-gray-400 text-sm">
        {isLocked
          ? "Presiona 'Conectar' para desbloquear y crear comandos."
          : "Cuando alguien escriba el comando en el chat de Twitch, RawenChat presionará la tecla automáticamente."}
      </p>

      {/* Command list */}
      {commands.length === 0 && !editing && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-500">
          <Joystick20Filled style={{ fontSize: '48px' }} />
          <p className="text-sm">No hay comandos todavía. ¡Crea el primero!</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {commands.map((cmd) => (
          <div
            key={cmd.id}
            className="bg-[#27272a] rounded-lg px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-semibold text-white text-sm truncate">
                {cmd.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="bg-[#18181b] px-2 py-0.5 rounded font-mono">
                  {cmd.trigger}
                </span>
                <span>→</span>
                <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded font-mono uppercase flex items-center gap-1">
                  {cmd.actionType === "key" && <span>{cmd.key}</span>}
                  {cmd.actionType === "sound" && <Speaker020Regular style={{ fontSize: '14px' }} />}
                  {cmd.actionType === "both" && (
                    <>
                      <span>{cmd.key}</span>
                      <span>+</span>
                      <Speaker020Regular style={{ fontSize: '14px' }} />
                    </>
                  )}
                </span>
                <span className="text-gray-500">({(cmd.timeout || DEFAULTS.COMMAND_TIMEOUT_MS) / 1000}s)</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cmd.rateLimitType === "global" ? "bg-purple-900/40 text-purple-300" : "bg-green-900/40 text-green-300"}`}>
                  {cmd.rateLimitType === "global" ? "Global" : "Per-User"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => startEdit(cmd)}
                disabled={isLocked}
                className="px-3 py-1 text-xs bg-[#3f3f46] hover:bg-[#52525b] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Editar
              </button>
              <button
                onClick={() => remove(cmd.id)}
                disabled={isLocked}
                className="px-3 py-1 text-xs bg-red-900/60 hover:bg-red-800/80 text-red-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit form */}
      {editing !== null && (
        <div className="bg-[#27272a] rounded-xl p-4 flex flex-col gap-3 border border-[#3f3f46]">
          <h3 className="font-semibold text-sm">
            {editing.id ? "Editar comando" : "Nuevo comando"}
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Drop Gun"
              className="bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <span className="text-red-400 text-xs">{errors.name}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Comando del chat</label>
            <input
              type="text"
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              placeholder="!dropgun"
              className="bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.trigger && (
              <span className="text-red-400 text-xs">{errors.trigger}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">
              Tecla a presionar
            </label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="g"
              maxLength={20}
              className="bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 text-xs">
              Letras, números o nombres especiales: space, enter, escape, f1–f12,
              up, down, left, right, tab, backspace
            </span>
            {errors.key && (
              <span className="text-red-400 text-xs">{errors.key}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Tipo de acción</label>
            <select
              value={form.actionType || "key"}
              onChange={(e) => setForm({ ...form, actionType: e.target.value as "key" | "sound" | "both" })}
              className="bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Tipo de acción a ejecutar"
            >
              <option value="key">Solo Tecla</option>
              <option value="sound">Solo Sonido</option>
              <option value="both">Tecla + Sonido</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Tipo de Rate Limit</label>
            <select
              value={form.rateLimitType || "per-user"}
              onChange={(e) => setForm({ ...form, rateLimitType: e.target.value as "global" | "per-user" })}
              className="bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Global: todos los usuarios comparten el límite. Per-user: cada usuario tiene su propio límite"
            >
              <option value="per-user">Por Usuario</option>
              <option value="global">Global</option>
            </select>
            <span className="text-gray-500 text-xs">
              Por Usuario: cada usuario tiene su propio límite de {Math.round((form.timeout || DEFAULTS.COMMAND_TIMEOUT_MS) / 1000)}s
            </span>
            <span className="text-gray-500 text-xs">
              Global: aunque 10 usuarios lo manden, solo se ejecutará 1 vez cada {Math.round((form.timeout || DEFAULTS.COMMAND_TIMEOUT_MS) / 1000)}s
            </span>
          </div>

          {(form.actionType === "sound" || form.actionType === "both") && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Archivo de audio</label>
              <div className="flex flex-col gap-2">
               
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,audio/*"
                  title="Selecciona un archivo de audio"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) {
                      setAudioBlob(file);
                      setSelectedFileName(file.name);
                    }
                  }}
                  className="bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFileName && (
                  <div className="bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-xs text-gray-300 truncate">
                    ✓ {selectedFileName}
                  </div>
                )}
              </div>
              <span className="text-gray-500 text-xs">
                Selecciona un archivo MP3 o de audio
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Duración del timeout</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timeoutMinutes}
                  onChange={(e) => setTimeoutMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500 text-xs">Minutos</span>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  placeholder="5"
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500 text-xs">Segundos</span>
              </div>
            </div>
            <span className="text-gray-500 text-xs">
              Total: {timeoutMinutes}m {timeoutSeconds}s = {timeoutMinutes * 60 + timeoutSeconds}s
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setSelectedFileName("");
                setAudioBlob(null);
              }}
              className="flex-1 py-2 bg-[#3f3f46] hover:bg-[#52525b] text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


