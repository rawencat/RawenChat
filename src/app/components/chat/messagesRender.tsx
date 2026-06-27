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
    <div className="px-4">
      <div className="bg-[#27272a] border border-[#3f3f46] p-4 rounded-lg my-2 items-center inline-flex gap-2 hover:bg-[#2f2f33] transition-colors">
        {ShowTime && (
          <span className="text-gray-500 text-xs">
            {new Date(msg.timestamp).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        <span className="font-bold" style={{ color: msg.color || "#60a5fa" }}>
          {msg.username}:
        </span>
        <p className="text-sm break-words text-gray-200">{msg.message}</p>
      </div>
    </div>
  );
}
