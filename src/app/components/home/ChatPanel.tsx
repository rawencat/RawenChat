"use client";

import { FluentEmoji } from "@lobehub/fluent-emoji";
import {
  Copy20Regular,
  Dismiss20Regular,
  Edit20Regular,
  ArrowReset20Regular,
  Save20Regular,
  Code20Regular,
} from "@fluentui/react-icons";
import type { MessageProps } from "../../types/chat";
import type { ChatPlatform } from "@/utils/platform";
import { useState, useEffect, useMemo } from "react";
import { getFromStorage, saveToStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/constants/config";
import Editor from "@monaco-editor/react";
import {
  useCustomMessageComponent,
  DEFAULT_COMPONENT_CODE,
} from "../../hooks/useCustomMessageComponent";
import { TailwindRuntimeLoader } from "../shared/TailwindRuntimeLoader";

interface ChatPanelProps {
  channel: string;
  platform: ChatPlatform;
  messages: MessageProps[];
  setToastMessage: (msg: string) => void;
}

async function persistComponentCode(code: string): Promise<void> {
  if (window.electron) {
    await window.electron.saveObsComponent(code);
  } else {
    saveToStorage(STORAGE_KEYS.OBS_CSS, code);
  }
}

async function loadPersistedComponentCode(): Promise<string> {
  if (window.electron) {
    const saved = await window.electron.getObsComponent();
    return saved || DEFAULT_COMPONENT_CODE;
  }
  return getFromStorage<string>(STORAGE_KEYS.OBS_CSS) || DEFAULT_COMPONENT_CODE;
}

export default function ChatPanel({
  channel,
  platform,
  messages,
  setToastMessage,
}: ChatPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [componentCode, setComponentCode] = useState("");
  const [editorDraft, setEditorDraft] = useState("");
  const [hideObsSection, setHideObsSection] = useState(false);

  useEffect(() => {
    loadPersistedComponentCode().then(setComponentCode);

    const hideObs = getFromStorage<boolean>(STORAGE_KEYS.HIDE_OBS_SECTION);
    if (hideObs !== null) setHideObsSection(hideObs);
  }, []);

  function handleToggleHideObs() {
    const newVal = !hideObsSection;
    setHideObsSection(newVal);
    saveToStorage(STORAGE_KEYS.HIDE_OBS_SECTION, newVal);
  }

  function copyObsChat() {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const url = `${origin}/obs?channel=${encodeURIComponent(
      channel
    )}&platform=${platform}`;
    navigator.clipboard.writeText(url);
    setToastMessage("URL de Chat Overlay copiado");
  }

  async function handleSave() {
    try {
      await persistComponentCode(editorDraft);
      setComponentCode(editorDraft);
      setToastMessage("Componente guardado exitosamente!");
    } catch (err) {
      console.error("Error saving component:", err);
      setToastMessage("Error al guardar el componente");
    }
    setIsModalOpen(false);
  }

  async function handleReset() {
    try {
      await persistComponentCode(DEFAULT_COMPONENT_CODE);
      setComponentCode(DEFAULT_COMPONENT_CODE);
      setEditorDraft(DEFAULT_COMPONENT_CODE);
      setToastMessage("Componente restablecido a valores predeterminados");
    } catch (err) {
      console.error("Error resetting component:", err);
      setToastMessage("Error al restablecer el componente");
    }
    setIsModalOpen(false);
  }

  function openEditor() {
    setEditorDraft(componentCode || DEFAULT_COMPONENT_CODE);
    setIsModalOpen(true);
  }

  const previewMessage = useMemo(
    () => ({
      timestamp: new Date().toISOString(),
      username: channel,
      message: "¡Hola! Este es un mensaje de prueba para ver el componente.",
      color: "#ffb07a",
    }),
    [channel]
  );

  const LiveMessageComponent = useCustomMessageComponent(componentCode);
  const PreviewComponent = useCustomMessageComponent(editorDraft);

  return (
    <>
      <TailwindRuntimeLoader />

      <div className="flex-1 flex flex-col min-h-0 animate-tab-enter">
        <div className="px-5 pt-4 pb-3 border-b border-[--border]">
          {hideObsSection ? (
            <HiddenObsCard onShow={handleToggleHideObs} />
          ) : (
            <ObsOverlayCard
              onHide={handleToggleHideObs}
              onEdit={openEditor}
              onCopyLink={copyObsChat}
            />
          )}
        </div>

        <div className="messages-container flex-1 overflow-y-auto rawen-scrollbar px-5 py-4 space-y-0.5">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <LiveMessageComponent
                key={`${msg.timestamp}-${msg.username}`}
                msg={msg}
                ShowTime={true}
              />
            ))
          ) : (
            <EmptyMessagesState channel={channel} />
          )}
        </div>
      </div>

      {isModalOpen && (
        <ComponentEditorModal
          editorDraft={editorDraft}
          onEditorDraftChange={setEditorDraft}
          previewMessage={previewMessage}
          componentCode={componentCode}
          PreviewComponent={PreviewComponent}
          onClose={() => setIsModalOpen(false)}
          onReset={handleReset}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function ObsOverlayCard({
  onHide,
  onEdit,
  onCopyLink,
}: {
  onHide: () => void;
  onEdit: () => void;
  onCopyLink: () => void;
}) {
  return (
    <div className="amoled-card p-4 space-y-4 mb-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-muted border border-[--accent-border] rounded-xl flex items-center justify-center">
            <Copy20Regular className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Overlay de Chat para OBS
            </h3>
            <p className="text-xs text-text-muted">
              Copia el enlace para usarlo en tu streaming
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onHide}
            className="amoled-button-ghost text-xs px-3 py-2"
            title="Ocultar esta sección"
          >
            <Dismiss20Regular className="w-4 h-4 inline mr-2" />
            Ocultar
          </button>
          <button onClick={onEdit} className="amoled-button-ghost text-xs px-3 py-2">
            <Edit20Regular className="w-4 h-4 inline mr-2" />
            Editar Componente
          </button>
          <button onClick={onCopyLink} className="amoled-button text-xs">
            Copiar Enlace
          </button>
        </div>
      </div>
    </div>
  );
}

function HiddenObsCard({ onShow }: { onShow: () => void }) {
  return (
    <div className="amoled-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-elevated border border-[--border] rounded-xl flex items-center justify-center">
            <Copy20Regular className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Overlay de Chat para OBS (Oculto)
            </h3>
            <p className="text-xs text-text-muted">
              Haz clic en &quot;Mostrar&quot; para ver las opciones
            </p>
          </div>
        </div>
        <button onClick={onShow} className="amoled-button text-xs">
          Mostrar
        </button>
      </div>
    </div>
  );
}

function EmptyMessagesState({ channel }: { channel: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-75">
      <div className="flex flex-col items-center gap-4 text-center animate-scale-in">
        <div className="w-20 h-20 bg-accent-muted rounded-3xl flex items-center justify-center border border-[--accent-border]">
          <FluentEmoji type="anim" size={44} emoji="💬" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Sin mensajes aún</h3>
          <p className="text-text-secondary text-sm max-w-xs">
            Esperando actividad en{" "}
            <span className="text-accent font-medium">{channel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" />
          <span className="text-text-muted text-xs">Escuchando...</span>
        </div>
      </div>
    </div>
  );
}

function ComponentEditorModal({
  editorDraft,
  onEditorDraftChange,
  previewMessage,
  componentCode,
  PreviewComponent,
  onClose,
  onReset,
  onSave,
}: {
  editorDraft: string;
  onEditorDraftChange: (value: string) => void;
  previewMessage: MessageProps;
  componentCode: string;
  PreviewComponent: React.ComponentType<{ msg: MessageProps; ShowTime: boolean }>;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="amoled-card w-full max-w-5xl h-[82vh] max-h-[720px] flex flex-col rounded-2xl border border-[--border] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[--border] shrink-0 bg-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-muted border border-[--accent-border] rounded-lg flex items-center justify-center">
              <Code20Regular className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">
                Editar Componente del Overlay
              </h3>
              <p className="text-[11px] text-text-muted leading-tight">
                Personalizá cómo se ve cada mensaje del chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-elevated flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          >
            <Dismiss20Regular className="w-4 h-4" />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
          {}
          <div className="flex-[3] flex flex-col overflow-hidden min-w-0 lg:border-r border-[--border]">
            <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-[--accent-border]">
              <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Código
              </span>
              <span className="text-[11px] text-text-muted">
                <code className="text-accent bg-elevated px-1.5 py-0.5 rounded">msg</code>
                {" · "}
                <code className="text-accent bg-elevated px-1.5 py-0.5 rounded">
                  ShowTime
                </code>
                {" · Tailwind CSS"}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                language="javascript"
                value={editorDraft}
                onChange={(value) => onEditorDraftChange(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  lineNumbers: "on",
                  tabSize: 2,
                  insertSpaces: true,
                  padding: { top: 12 },
                }}
              />
            </div>
          </div>

          {}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 border-[--border] overflow-hidden flex flex-col min-w-0 bg-elevated/20">
            <div className="px-4 py-2 border-b border-[--accent-border] shrink-0">
              <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Vista Previa
              </span>
            </div>
            <div className="flex-1 p-3 bg-linear-to-br from-gray-800 to-gray-900 overflow-y-auto">
              {}
              <PreviewComponent key={componentCode} msg={previewMessage} ShowTime={true} />
            </div>
          </div>
        </div>

        {}
        <div className="px-5 py-3 border-t border-[--border] flex items-center justify-end gap-2.5 shrink-0 bg-elevated/40">
          <button
            onClick={onReset}
            className="amoled-button-ghost text-xs font-medium px-4 py-2 flex items-center gap-1.5"
          >
            <ArrowReset20Regular className="w-4 h-4" />
            Restablecer
          </button>
          <button
            onClick={onSave}
            className="amoled-button text-xs font-medium px-4 py-2 flex items-center gap-1.5"
          >
            <Save20Regular className="w-4 h-4" />
            Guardar Componente
          </button>
        </div>
      </div>
    </div>
  );
}