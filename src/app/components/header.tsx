import { 
  SpeakerMute20Filled,
  Settings20Filled
} from "@fluentui/react-icons";
import ControlBox from "./controlbox";

interface HeaderProps {
  IsConnected: boolean;
  TTS: boolean;
  speakMessage: () => { cancel: () => void };
  openModal: (value: boolean) => void;
}

export default function Header({
  IsConnected,
  TTS,
  speakMessage,
  openModal,
}: HeaderProps) {
  return (
    <div 
      className="flex-shrink-0 flex items-center bg-[#18181b] border-b border-[#3f3f46] justify-between px-4 py-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="bg-[#27272a] px-4 py-2 rounded-lg flex items-center justify-between gap-4">
        <div className="items-center flex">
          <div
            className={`absolute rounded-full ${
              IsConnected ? "bg-green-500" : "bg-red-500"
            } w-2 h-2`}
          ></div>
          <div
            className={`absolute animate-ping rounded-full ${
              IsConnected ? "bg-green-500/70" : "bg-red-500/70"
            } w-2 h-2`}
          ></div>
        </div>

        <h1 className="gap-2 text-lg font-bold inline-flex items-center text-white">
          RawenChat
        </h1>
      </div>

      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {TTS ? (
          <button
            className="px-4 py-2 cursor-pointer text-sm inline-flex gap-2 bg-red-950 hover:bg-red-900 transition-colors duration-100 rounded-lg text-white"
            onClick={() => speakMessage()?.cancel()}
          >
            <SpeakerMute20Filled />
            Pausar TTS
          </button>
        ) : null}

        <button
          onClick={() => {
            openModal(true);
          }}
          className="bg-[#27272a] hover:bg-[#3f3f46] px-4 py-2 rounded-lg transition-colors shadow-sm inline-flex items-center gap-2 text-gray-300 font-medium"
        >
          <Settings20Filled />
          Configuración
        </button>

        <ControlBox />
      </div>
    </div>
  );
}