export interface MessageProps {
  timestamp: string;
  username: string | undefined;
  message: string;
  color?: string | undefined;
}

export interface IncomingChatMessage {
  username?: string;
  message: string;
  color?: string;
}

export type SidebarTab = "chat" | "commands" | "avatar";

