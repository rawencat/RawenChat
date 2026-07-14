interface TwitchMessage {
  timestamp: string;
  username: string | undefined;
  message: string;
  color?: string | undefined;
}

interface MessageProps {
  msg: TwitchMessage;
  ShowTime?: boolean;
}

export default function MessagesRender({ msg, ShowTime = true }: MessageProps) {
  return (
    <div className="animate-message-in px-4 py-2">
      <div className="message-container px-5 py-4 bg-[rgba(0,0,0,0.5)] rounded-2xl backdrop-blur-xl border border-white/15 shadow-lg">
        <div className="flex items-center gap-4">
          {ShowTime && (
            <span className="text-[rgba(255,255,255,0.5)] text-xs font-mono shrink-0 tabular-nums bg-white/5 px-2 py-1 rounded-lg">
              {new Date(msg.timestamp).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <span
            className="username font-extrabold text-lg"
            style={{ color: msg.color || "#ffb07a" }}
          >
            {msg.username}
          </span>
        </div>
        <p className="message-text text-white/95 text-base break-words leading-relaxed mt-2">
          {msg.message}
        </p>
      </div>
    </div>
  );
}
