import { FluentEmoji } from "@lobehub/fluent-emoji";

interface FooterProps {
  IsConnected: boolean;
  channel: string | undefined;
  MessageCount: number;
}

export default function Footer({
  IsConnected,
  channel,
  MessageCount,
}: FooterProps) {
  return (
    <footer className="flex-shrink-0 h-16 bg-[#18181b] border-t border-[#3f3f46] flex items-center justify-between px-6 gap-4">
        <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                IsConnected 
                ? "bg-green-600/20 text-green-400 border border-green-600/30" 
                : "bg-amber-600/20 text-amber-400 border border-amber-600/30"
            }`}
        >
            <div className={`w-2 h-2 rounded-full ${IsConnected ? "bg-green-400" : "bg-amber-400"} animate-pulse`}></div>
            <span>{IsConnected ? "Conectado" : "Conectando"}</span>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] px-4 py-2 rounded-lg transition-colors shadow-sm">
                <FluentEmoji type="anim" size={20} emoji="💬" />
                <span className="font-medium">{MessageCount}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] px-4 py-2 rounded-lg transition-colors shadow-sm">
                <FluentEmoji type="anim" size={20} emoji="🔗" />
                <span className="font-medium truncate max-w-[200px]">{channel || "Canal no seleccionado"}</span>
            </div>
          
        </div>
    </footer>
  );
}
