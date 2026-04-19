// No hooks needed for this component
import { FluentEmoji } from "@lobehub/fluent-emoji";
import { Dismiss20Regular } from "@fluentui/react-icons";

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#18181b] border border-[#3f3f46] rounded-lg p-6 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Configuración</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            title="Cerrar configuración"
          >
            <Dismiss20Regular className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* TTS Toggle */}
          <div className="flex items-center gap-3">
            <input
              onChange={(e) => onTTSToggle(e.target.checked)}
              type="checkbox"
              name="TTSCheck"
              className="hidden"
              id="TTS"
              checked={ttsEnabled}
            />
            <label
              htmlFor="TTS"
              className={`gap-2 w-full transition-colors duration-100 cursor-pointer inline-flex items-center text-sm select-none px-6 py-2 rounded-lg ${
                ttsEnabled
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {ttsEnabled ? (
                <FluentEmoji type="anim" size={20} emoji="🔊" />
              ) : (
                <FluentEmoji type="anim" size={20} emoji="🔇" />
              )}
              <span className="text-white">
                {ttsEnabled ? "TTS Activado" : "TTS Desactivado"}
              </span>
            </label>
          </div>

          {/* Language Selector */}
          {ttsEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Idioma
              </label>
              <select
                value={ttsLanguage}
                onChange={(e) => {
                  onLanguageChange(e.target.value);
                }}
                className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                title="Seleccionar idioma para TTS"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Voice Selector */}
          {ttsEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voz
              </label>
              <select
                value={ttsVoice}
                onChange={(e) => onVoiceChange(e.target.value)}
                disabled={loadingVoices || availableVoices.length === 0}
                className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
                title="Seleccionar voz para TTS"
              >
                {loadingVoices ? (
                  <option key="loading" value="">Cargando voces...</option>
                ) : availableVoices && availableVoices.length > 0 ? (
                  availableVoices.map((voice, index) => (
                    <option key={`voice-${index}-${String(voice).replace(/\s+/g, "-")}`} value={voice}>
                      {voice}
                    </option>
                  ))
                ) : (
                  <option key="no-voices" value="">No voices available</option>
                )}
              </select>
            </div>
          )}

          {/* Volume Slider */}
          {ttsEnabled && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Volumen
                </label>
                <span className="text-sm text-gray-400">{Math.round(ttsVolume)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ttsVolume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-full h-2 bg-[#27272a] border border-[#3f3f46] rounded-lg appearance-none cursor-pointer accent-blue-500"
                title="Ajustar volumen del TTS"
              />
            </div>
          )}

          {/* Auto Scroll Toggle */}
          <button
            type="button"
            className={`px-6 w-full py-2 cursor-pointer text-sm inline-flex gap-2 transition-colors duration-100 rounded-lg ${
              autoScroll
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white`}
            onClick={() => onAutoScrollToggle(!autoScroll)}
          >
            <FluentEmoji type="flat" size={20} emoji="⚙️" />
            <span>{autoScroll ? "Auto Scroll Activo" : "Auto Scroll Desactivo"}</span>
          </button>
        </div>

        <div className="flex items-center justify-center mt-6 text-gray-400 text-xs border-t border-[#3f3f46] pt-4">
          <span>Toca fuera para cerrar</span>
        </div>
      </div>
    </div>
  );
}
