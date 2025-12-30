import { channel } from "node:diagnostics_channel";

export const BASE_URL = "https://discord.com/api/v9";

export const GET_MESSAGES_FOR_CHANNEL = (channelId: string) => "channels/" + channelId + "/messages?limit=50";
export const SEND_MESSAGES_IN_CHANNEL = (channelId: string) => "channels/" + channelId + "/messages";
export const DELETE_MESSAGE_IN_CHANNEL = (channelId: string, messageId: string) => `channels/${channelId}/messages/${messageId}`;
export const EDIT_MESSAGE_IN_CHANNEL = (channelId: string, messageId: string) => `channels/${channelId}/messages/${messageId}`;
export const GET_FINGERPRINT = () => "experiments";
export const LOGIN_WITHOUT_2FA = () => "auth/login";
export const GET_ALL_GUILDS = () => "users/@me/guilds";
export const GET_CHANNELS_FOR_GUILD = (guildId: string) => `guilds/${guildId}/channels`;