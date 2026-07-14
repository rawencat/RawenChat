"use client";
import { useState, useRef } from "react";
import {
  Keyboard20Filled,
  Joystick20Filled,
  Speaker020Regular,
  Dismiss20Regular,
  Play20Regular,
  Delete20Regular,
} from "@fluentui/react-icons";
import { isValidKey } from "@/constants/validation";
import { DEFAULTS } from "@/constants/config";
import { getPlatformDisplayName, type ChatPlatform } from "@/utils/platform";
import Dropdown from "@/app/components/global/Dropdown";

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
  platform?: ChatPlatform;
}

const EMPTY_COMMAND: Omit<Command, "id"> = {
  name: "",
  trigger: "",
  key: "",
  timeout: DEFAULTS.COMMAND_TIMEOUT_MS,
  actionType: DEFAULTS.COMMAND_ACTION_TYPE,
  soundFile: "",
  rateLimitType: "per-user",
};

export default function CommandsPanel({
  commands,
  setCommands,
  isLocked = false,
  platform = "twitch",
}: CommandsPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Command | null>(null);
  const [form, setForm] = useState<Omit<Command, "id">>(EMPTY_COMMAND);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(0);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(5);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const actionType = form.actionType || "key";

  function startAdd() {
    setEditing({ id: "", ...EMPTY_COMMAND });
    setForm(EMPTY_COMMAND);
    setTimeoutMinutes(0);
    setTimeoutSeconds(Math.floor((DEFAULTS.COMMAND_TIMEOUT_MS % 60000) / 1000));
    setSelectedFileName("");
    setAudioBlob(null);
    setErrors({});
    setIsModalOpen(true);
  }

  function startEdit(cmd: Command) {
    const totalMs = cmd.timeout || DEFAULTS.COMMAND_TIMEOUT_MS;
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    setEditing(cmd);
    setForm({
      name: cmd.name,
      trigger: cmd.trigger,
      key: cmd.key,
      timeout: cmd.timeout,
      actionType: cmd.actionType,
      soundFile: cmd.soundFile,
      rateLimitType: cmd.rateLimitType || "per-user",
    });
    setTimeoutMinutes(mins);
    setTimeoutSeconds(Math.floor(secs));
    setSelectedFileName(cmd.soundFile ? "[Audio guardado]" : "");
    setAudioBlob(null);
    setErrors({});
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditing(null);
    setSelectedFileName("");
    setAudioBlob(null);
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
    if (actionType === "key" || actionType === "both") {
      if (!form.key.trim()) {
        errs.key = "La tecla es requerida.";
      } else if (!isValidKey(form.key)) {
        errs.key =
          "Tecla inválida. Usa letras, números o: space, enter, escape, f1-f12, arrows";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function getNextId(): string {
    if (commands.length === 0) return "1";
    const maxId = Math.max(...commands.map((c) => parseInt(c.id) || 0));
    return String(maxId + 1);
  }

  function save() {
    if (!validate()) return;
    const totalTimeoutMs = timeoutMinutes * 60000 + timeoutSeconds * 1000;
    const normalizedKey =
      actionType === "key" || actionType === "both"
        ? form.key.trim().toLowerCase()
        : "";
    if (audioBlob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const updated = editing?.id
          ? commands.map((c) =>
              c.id === editing.id
                ? {
                    ...c,
                    ...form,
                    soundFile: dataUrl,
                    timeout: totalTimeoutMs,
                    trigger: form.trigger.trim().toLowerCase(),
                    key: normalizedKey,
                    rateLimitType: form.rateLimitType || "per-user",
                  }
                : c,
            )
          : [
              ...commands,
              {
                id: getNextId(),
                ...form,
                soundFile: dataUrl,
                timeout: totalTimeoutMs,
                trigger: form.trigger.trim().toLowerCase(),
                key: normalizedKey,
                rateLimitType: form.rateLimitType || "per-user",
              },
            ];
        setCommands(updated);
        closeModal();
      };
      reader.readAsDataURL(audioBlob);
      return;
    }

    const updated = editing?.id
      ? commands.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                ...form,
                soundFile: form.soundFile || "",
                timeout: totalTimeoutMs,
                trigger: form.trigger.trim().toLowerCase(),
                key: normalizedKey,
                rateLimitType: form.rateLimitType || "per-user",
              }
            : c,
        )
      : [
          ...commands,
          {
            id: getNextId(),
            ...form,
            soundFile: form.soundFile || "",
            timeout: totalTimeoutMs,
            trigger: form.trigger.trim().toLowerCase(),
            key: normalizedKey,
            rateLimitType: form.rateLimitType || "per-user",
          },
        ];
    setCommands(updated);
    closeModal();
  }

  function remove(id: string) {
    setCommands(commands.filter((c) => c.id !== id));
  }

  function playAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    let audioSrc = "";
    if (audioBlob) {
      audioSrc = URL.createObjectURL(audioBlob);
    } else if (form.soundFile) {
      audioSrc = form.soundFile;
    }
    
    if (audioSrc) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.play().catch(err => console.error("Error playing audio:", err));
    }
  }

  function clearAudio() {
    setAudioBlob(null);
    setSelectedFileName("");
    if (form.soundFile) {
      setForm({ ...form, soundFile: "" });
    }
  }

  return (
    <>
      <div className="h-full overflow-y-auto rawen-scrollbar px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[var(--text-secondary)] text-sm flex-1">
            {isLocked
              ? "Conecta un canal para crear comandos."
              : `Automatiza acciones cuando alguien escriba un comando en ${getPlatformDisplayName(platform)}.`}
          </p>
          <button
            onClick={startAdd}
            disabled={isLocked}
            className={`amoled-button shrink-0 px-4 py-2 text-sm ${isLocked ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            + Nuevo comando
          </button>
        </div>

        {commands.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-[var(--text-muted)] min-h-[200px]">
            <div className="w-12 h-12 rounded-xl bg-[var(--elevated)] border border-[var(--border)] flex items-center justify-center">
              <Joystick20Filled className="w-6 h-6" />
            </div>
            <p className="text-sm">Sin comandos. Crea el primero con el botón de arriba.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {commands.map((cmd) => (
            <div
              key={cmd.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[var(--accent-border)] transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-[var(--accent-muted)] border border-[var(--accent-border)] rounded-lg flex items-center justify-center shrink-0">
                  {cmd.actionType === "key" && <Keyboard20Filled className="w-5 h-5 text-[var(--accent)]" />}
                  {cmd.actionType === "sound" && <Speaker020Regular className="w-5 h-5 text-[var(--accent)]" />}
                  {cmd.actionType === "both" && <div className="flex items-center gap-0.5"><Keyboard20Filled className="w-4 h-4 text-[var(--accent)]" /><Speaker020Regular className="w-4 h-4 text-[var(--accent)]" /></div>}
                </div>
                <div className="flex flex-col min-w-0 gap-0.5">
                  <span className="font-semibold text-white text-sm truncate">
                    {cmd.name}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[var(--elevated)] px-2.5 py-0.5 rounded-md font-mono text-xs text-[var(--text-secondary)]">
                      {cmd.trigger}
                    </span>
                    <span className="text-[var(--text-muted)] text-xs">
                      · {(cmd.timeout || DEFAULTS.COMMAND_TIMEOUT_MS) / 1000}s
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cmd.rateLimitType === "global" ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "bg-[var(--success-muted)] text-[var(--success)]" }`}>
                      {cmd.rateLimitType === "global" ? "Global" : "Por user"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(cmd)}
                  disabled={isLocked}
                  className="px-3 py-1.5 text-xs bg-[var(--elevated)] hover:bg-[var(--border)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  Editar
                </button>
                <button
                  onClick={() => remove(cmd.id)}
                  disabled={isLocked}
                  className="px-3 py-1.5 text-xs bg-red-900/50 hover:bg-red-800/70 text-red-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="amoled-card w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-lg font-semibold text-white">
                {editing?.id ? "Editar comando" : "Nuevo comando"}
              </h3>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-lg bg-[var(--elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <Dismiss20Regular className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-6">
                {}
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-[var(--text-secondary)] font-medium">Nombre del comando</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej: Drop Gun"
                      className="amoled-input w-full"
                    />
                    {errors.name && (
                      <span className="text-red-400 text-sm">{errors.name}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-[var(--text-secondary)] font-medium">Comando en el chat</label>
                    <input
                      type="text"
                      value={form.trigger}
                      onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                      placeholder="!dropgun"
                      className="amoled-input w-full font-mono"
                    />
                    {errors.trigger && (
                      <span className="text-red-400 text-sm">{errors.trigger}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-[var(--text-secondary)] font-medium">Tipo de acción</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["key", "sound", "both"].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            const nextActionType = type as "key" | "sound" | "both";
                            setForm({
                              ...form,
                              actionType: nextActionType,
                              key: nextActionType === "sound" ? "" : form.key,
                            });
                            if (nextActionType === "sound") {
                              setErrors((current) => {
                                const nextErrors = { ...current };
                                delete nextErrors.key;
                                return nextErrors;
                              });
                            }
                          }}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                            form.actionType === type
                              ? "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent)]"
                              : "border-[var(--border)] bg-[var(--elevated)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
                          }`}
                        >
                          {type === "key" && <Keyboard20Filled className="w-6 h-6" />}
                          {type === "sound" && <Speaker020Regular className="w-6 h-6" />}
                          {type === "both" && <div className="flex items-center gap-0.5"><Keyboard20Filled className="w-5 h-5" /><Speaker020Regular className="w-5 h-5" /></div>}
                          <span className="text-xs font-medium">
                            {type === "key" && "Tecla"}
                            {type === "sound" && "Sonido"}
                            {type === "both" && "Ambos"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(actionType === "key" || actionType === "both") && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-[var(--text-secondary)] font-medium">Tecla a presionar</label>
                      <input
                        type="text"
                        value={form.key}
                        onChange={(e) => setForm({ ...form, key: e.target.value })}
                        placeholder="Ej: g"
                        maxLength={20}
                        className="amoled-input w-full font-mono"
                      />
                      {errors.key && (
                        <span className="text-red-400 text-sm">{errors.key}</span>
                      )}
                    </div>
                  )}
                </div>

                {}
                <div className="space-y-5">
                  {(form.actionType === "sound" || form.actionType === "both") && (
                    <div className="flex flex-col gap-3">
                      <label className="text-sm text-[var(--text-secondary)] font-medium">Archivo de audio</label>
                      <div className="flex flex-col gap-3">
                        <div className="relative">
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
                            className="amoled-input w-full opacity-0 absolute inset-0 cursor-pointer"
                          />
                          <div className="amoled-input w-full flex items-center gap-2 px-4">
                            <Speaker020Regular className="w-5 h-5 text-[var(--text-secondary)]" />
                            <span className="text-sm text-[var(--text-secondary)] flex-1">
                              {selectedFileName || "Selecciona un archivo..."}
                            </span>
                          </div>
                        </div>
                        
                        {(audioBlob || form.soundFile) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={playAudio}
                              className="amoled-button px-4 py-2 text-xs flex items-center gap-1.5"
                            >
                              <Play20Regular className="w-4 h-4" />
                              Reproducir
                            </button>
                            <button
                              onClick={clearAudio}
                              className="amoled-button-ghost px-4 py-2 text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300"
                            >
                              <Delete20Regular className="w-4 h-4" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-[var(--text-secondary)] font-medium">Minutos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timeoutMinutes}
                        onChange={(e) => setTimeoutMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="amoled-input"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm text-[var(--text-secondary)] font-medium">Segundos</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={timeoutSeconds}
                        onChange={(e) => setTimeoutSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="amoled-input"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-[var(--text-secondary)] font-medium">Rate Limit</label>
                    <Dropdown
                      options={[
                        { value: "per-user", label: "Por usuario" },
                        { value: "global", label: "Global" },
                      ]}
                      value={form.rateLimitType || "per-user"}
                      onChange={(v) => setForm({ ...form, rateLimitType: v as "global" | "per-user" })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 amoled-button-ghost text-sm font-medium">
                Cancelar
              </button>
              <button onClick={save} className="flex-1 py-3 amoled-button text-sm font-medium">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
