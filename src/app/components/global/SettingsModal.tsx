import { FluentEmoji } from "@lobehub/fluent-emoji";
import { Dismiss20Regular } from "@fluentui/react-icons";
import Dropdown from "./Dropdown";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ttsEnabled: boolean;
  onTTSToggle: (enabled: boolean) => void;
  autoScroll: boolean;
  onAutoScrollToggle: (enabled: boolean) => void;
  ttsLanguage: string;
  onLanguageChange: (language: string) => void;
  ttsVoice: string;
  onVoiceChange: (voice: string) => void;
  availableVoices: string[];
  loadingVoices: boolean;
  ttsVolume: number;
  onVolumeChange: (volume: number) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  ttsEnabled,
  onTTSToggle,
  autoScroll,
  onAutoScrollToggle,
  ttsLanguage,
  onLanguageChange,
  ttsVoice,
  onVoiceChange,
  availableVoices,
  loadingVoices,
  ttsVolume,
  onVolumeChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Spanish (Spain)" },
    { code: "es-MX", name: "Spanish (Mexico)" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "it-IT", name: "Italian" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "ja-JP", name: "Japanese" },
    { code: "zh-CN", name: "Chinese (Simplified)" },
  ];

  return (
    <div
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="amoled-card p-6 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Configuración</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--elevated)] transition-colors"
            title="Cerrar configuración"
          >
            <Dismiss20Regular className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto rawen-scrollbar">
          <label
            htmlFor="TTS"
            className={`gap-2 w-full cursor-pointer inline-flex items-center text-sm select-none px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              ttsEnabled
                ? "bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]/20"
                : "bg-[var(--error-muted)] text-[var(--error)] border border-[var(--error)]/20"
            }`}
          >
            <input
              onChange={(e) => onTTSToggle(e.target.checked)}
              type="checkbox"
              className="hidden"
              id="TTS"
              checked={ttsEnabled}
            />
            {ttsEnabled ? (
              <FluentEmoji type="anim" size={20} emoji="🔊" />
            ) : (
              <FluentEmoji type="anim" size={20} emoji="🔇" />
            )}
            <span>{ttsEnabled ? "TTS Activado" : "TTS Desactivado"}</span>
          </label>

          {ttsEnabled && (
            <div className="space-y-3 animate-slide-up">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Idioma
                </label>
                <Dropdown
                  options={languages.map(lang => ({ value: lang.code, label: lang.name }))}
                  value={ttsLanguage}
                  onChange={onLanguageChange}
                  placeholder="Seleccionar idioma"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Voz
                </label>
                <Dropdown
                  options={availableVoices.map(voice => ({ value: voice, label: voice }))}
                  value={ttsVoice}
                  onChange={onVoiceChange}
                  placeholder={loadingVoices ? "Cargando voces..." : "Seleccionar voz"}
                  className={loadingVoices || availableVoices.length === 0 ? "opacity-40 pointer-events-none" : ""}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Volumen
                  </label>
                  <span className="text-xs text-[var(--accent)] font-mono">{Math.round(ttsVolume)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ttsVolume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[var(--elevated)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                  title="Ajustar volumen del TTS"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className={`px-4 w-full py-2.5 cursor-pointer text-sm inline-flex gap-2 transition-all duration-200 rounded-xl font-medium ${
              autoScroll
                ? "bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]/20"
                : "bg-[var(--error-muted)] text-[var(--error)] border border-[var(--error)]/20"
            }`}
            onClick={() => onAutoScrollToggle(!autoScroll)}
          >
            <FluentEmoji type="flat" size={20} emoji="⚙️" />
            <span>{autoScroll ? "Auto Scroll Activo" : "Auto Scroll Desactivo"}</span>
          </button>
        </div>

        <p className="text-center mt-5 text-[var(--text-muted)] text-xs border-t border-[var(--border)] pt-4">
          Toca fuera para cerrar
        </p>
      </div>
    </div>
  );
}
