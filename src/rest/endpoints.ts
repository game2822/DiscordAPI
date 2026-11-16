export const BASE_URL = "https://discord.com/api/v9";

export const GET_FINGERPRINT = (): string => "experiments?with_guild_experiments=true";
export const LOGIN = (): string => "auth/login";
export const LOGIN_MFA = (method: string): string => `auth/mfa/${method}`;
export const LOGIN_SMS = (): string => "auth/mfa/sms";
export const LOGIN_SMS_SEND = (): string => "auth/mfa/sms/send";
export const LOGIN_WEBAUTHN = (): string => "auth/mfa/webauthn";
export const GET_CURRENT_USER = (): string => "users/@me";
export const GET_CURRENT_USER_GUILDS = (): string => "users/@me/guilds";
