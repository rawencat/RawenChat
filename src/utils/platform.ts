export type ChatPlatform = "twitch" | "kick";

export function getPlatformDisplayName(platform: ChatPlatform): string {
  return platform === "kick" ? "Kick" : "Twitch";
}
