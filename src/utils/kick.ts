"use client";

interface KickChannelResponse {
  chatroom?: {
    id?: number | string;
  };
}

const KICK_PUSHER_KEY = process.env.NEXT_PUBLIC_KICK_PUSHER_KEY || "32cbd69e4b950bf97679";
const KICK_PUSHER_PROTOCOL = "7";
const KICK_PUSHER_CLIENT = "js";
const KICK_PUSHER_VERSION = "7.6.0";

export async function getKickChatroomId(channelName: string): Promise<string> {
  const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channelName)}`);
  if (!response.ok) {
    throw new Error(`Kick channel lookup failed (${response.status})`);
  }
  const data = (await response.json()) as KickChannelResponse;
  const chatroomId = data.chatroom?.id;
  if (!chatroomId) {
    throw new Error("Kick chatroom not found for this channel");
  }
  return String(chatroomId);
}

export function getKickWebSocketUrl(): string {
  return `wss://ws-us2.pusher.com/app/${KICK_PUSHER_KEY}?protocol=${KICK_PUSHER_PROTOCOL}&client=${KICK_PUSHER_CLIENT}&version=${KICK_PUSHER_VERSION}&flash=false`;
}
