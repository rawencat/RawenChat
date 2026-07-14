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
    <footer className="status-bar">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${IsConnected ? "bg-[var(--success)]" : "bg-[var(--warning)]"} animate-pulse-dot`}
        />
        <span className={IsConnected ? "text-[var(--success)]" : "text-[var(--warning)]"}>
          {IsConnected ? "Conectado" : "Conectando..."}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <FluentEmoji type="anim" size={14} emoji="💬" />
          {MessageCount} mensajes
        </span>
        <span className="flex items-center gap-1.5 max-w-[180px] truncate">
          <FluentEmoji type="anim" size={14} emoji="🔗" />
          {channel || "—"}
        </span>
      </div>
    </footer>
  );
}
