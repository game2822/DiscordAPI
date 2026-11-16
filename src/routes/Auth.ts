import { DiscordHTTPError, RestManager } from "../rest/RESTManager";
import { BASE_URL, GET_FINGERPRINT, LOGIN, LOGIN_MFA, LOGIN_SMS_SEND } from "../rest/endpoints";

export type MfaMethod = "totp" | "backup" | "sms" | "webauthn";

export interface FingerprintResponse {
    fingerprint: string;
    [key: string]: unknown;
}

export interface LoginResponse {
    token?: string;
    user_id?: string;
    mfa?: boolean;
    ticket?: string;
    sms?: boolean;
    totp?: boolean;
    backup?: boolean;
    webauthn?: unknown;
    login_instance_id?: string;
    [key: string]: unknown;
}

export interface MfaChallenge {
    ticket: string;
    userId: string | null;
    methods: MfaMethod[];
    method: MfaMethod | null;
    sms: boolean;
    totp: boolean;
    backup: boolean;
    webauthn: string | null;
    loginInstanceId: string | null;
    codeSent: boolean;
    smsPhone: string | null;
}

export interface LoginOptions {
    mfaMethod?: MfaMethod | ((challenge: MfaChallenge) => MfaMethod | Promise<MfaMethod>);
    mfaCode?: string | ((challenge: MfaChallenge) => string | Promise<string>);
    webauthnCredential?: string | ((challenge: MfaChallenge) => string | Promise<string>);
    /** Reuse a browser session fingerprint (must be paired with `cookies`). */
    fingerprint?: string;
    /** Raw Cookie header from the same browser session as `fingerprint`. */
    cookies?: string;
}

export class MfaRequiredError extends Error {
    public readonly challenge: MfaChallenge;

    constructor(challenge: MfaChallenge) {
        const method = challenge.method ? ` Method: ${challenge.method}.` : "";
        const sent = challenge.codeSent
            ? ` An SMS code was sent${challenge.smsPhone ? ` to ${challenge.smsPhone}` : ""}.`
            : "";
        super(`Discord requires additional MFA verification.${method}${sent}`);
        this.name = "MfaRequiredError";
        this.challenge = challenge;
    }
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64(value: string): string | null {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
    let bits = 0;
    let buffer = 0;
    const bytes: number[] = [];

    for (const char of normalized) {
        const idx = BASE64.indexOf(char);
        if (idx === -1) return null;
        buffer = (buffer << 6) | idx;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 0xff);
        }
    }

    let out = "";
    for (const byte of bytes) {
        if (byte < 0x20 || byte > 0x7e) return null;
        out += String.fromCharCode(byte);
    }
    return out;
}

export function DecodeTicketUserId(ticket: string): string | null {
    const [segment] = ticket.split(".");
    if (!segment) return null;
    const decoded = decodeBase64(segment);
    return decoded && /^\d{15,25}$/.test(decoded) ? decoded : null;
}

function createMfaChallenge(response: LoginResponse): MfaChallenge {
    const methods: MfaMethod[] = [];
    if (response.totp === true) methods.push("totp");
    if (response.backup === true) methods.push("backup");
    if (response.sms === true) methods.push("sms");
    if (typeof response.webauthn === "string" && response.webauthn.length > 0) methods.push("webauthn");

    const ticket = response.ticket ?? "";
    return {
        ticket,
        userId: response.user_id ?? DecodeTicketUserId(ticket),
        methods,
        method: null,
        sms: response.sms === true,
        totp: response.totp === true,
        backup: response.backup === true,
        webauthn: typeof response.webauthn === "string" ? response.webauthn : null,
        loginInstanceId: response.login_instance_id ?? null,
        codeSent: false,
        smsPhone: null,
    };
}

function isMfaMethod(value: string): value is MfaMethod {
    return value === "totp" || value === "backup" || value === "sms" || value === "webauthn";
}

function isMethodAvailable(challenge: MfaChallenge, method: MfaMethod): boolean {
    switch (method) {
        case "totp": return challenge.totp;
        case "backup": return challenge.backup;
        case "sms": return challenge.sms;
        case "webauthn": return challenge.webauthn !== null;
    }
}

function pickDefaultMethod(challenge: MfaChallenge): MfaMethod {
    if (challenge.totp) return "totp";
    if (challenge.backup) return "backup";
    if (challenge.sms) return "sms";
    if (challenge.webauthn) return "webauthn";
    throw new Error("Discord requested MFA but did not advertise a supported method.");
}

async function resolveMfaMethod(options: LoginOptions, challenge: MfaChallenge): Promise<MfaMethod> {
    const selected = typeof options.mfaMethod === "function"
        ? await options.mfaMethod(challenge)
        : options.mfaMethod;
    const method = selected ?? pickDefaultMethod(challenge);

    if (!isMfaMethod(method) || !isMethodAvailable(challenge, method)) {
        throw new Error(`The MFA method "${method}" is not available for this challenge.`);
    }

    return method;
}

function normalizeMfaCode(code: string, method: MfaMethod | null): string {
    if (method === "totp" || method === "sms") return code.replace(/\D/g, "");
    if (method === "backup") return code.replace(/[^a-zA-Z0-9]/g, "");
    return code.trim();
}

async function resolveCode(source: LoginOptions["mfaCode"], challenge: MfaChallenge): Promise<string> {
    const code = typeof source === "function" ? await source(challenge) : source;
    const normalized = normalizeMfaCode(code ?? "", challenge.method);
    if (!normalized) throw new MfaRequiredError(challenge);
    return normalized;
}

async function resolveWebAuthnCredential(
    source: LoginOptions["webauthnCredential"],
    challenge: MfaChallenge,
): Promise<string> {
    const credential = typeof source === "function" ? await source(challenge) : source;
    if (!credential || !credential.trim()) throw new MfaRequiredError(challenge);
    return credential.trim();
}

function isInvalidMfaCode(error: unknown): boolean {
    if (!(error instanceof DiscordHTTPError) || error.status !== 400) return false;
    const body = error.responseBody;
    return typeof body === "object" && body !== null && "code" in body && (body as { code: unknown }).code === 60008;
}

function createMfaBody(challenge: MfaChallenge, code: string): Record<string, unknown> {
    return {
        code,
        ticket: challenge.ticket,
        login_source: null,
        gift_code_sku_id: null,
        ...(challenge.loginInstanceId ? { login_instance_id: challenge.loginInstanceId } : {}),
    };
}

async function openSession(options: LoginOptions): Promise<{ manager: RestManager; fingerprint: string }> {
    const manager = new RestManager(BASE_URL);
    const fingerprint = options.fingerprint?.trim();
    const cookies = options.cookies?.trim();

    if (fingerprint && cookies) {
        manager.setCookies(cookies);
        manager.setFingerprint(fingerprint);
        return { manager, fingerprint };
    }

    const experiments = await manager.get<FingerprintResponse>(GET_FINGERPRINT());
    if (!experiments.fingerprint) throw new Error("Discord did not return a fingerprint.");

    manager.setFingerprint(experiments.fingerprint);
    return { manager, fingerprint: experiments.fingerprint };
}

export async function FetchFingerprint(): Promise<{ fingerprint: string; cookies: string }> {
    const { manager, fingerprint } = await openSession({});
    return { fingerprint, cookies: manager.getCookies() };
}

export async function LoginWithPassword(
    email: string,
    password: string,
    options: LoginOptions = {},
): Promise<LoginResponse> {
    const { manager } = await openSession(options);

    let response = await manager.post<LoginResponse>(LOGIN(), {
        login: email,
        password,
        undelete: false,
        login_source: null,
        gift_code_sku_id: null,
    });

    if (response.mfa) {
        let challenge = createMfaChallenge(response);
        if (!challenge.ticket) throw new Error("Discord requested MFA but did not return a ticket.");

        const method = await resolveMfaMethod(options, challenge);
        challenge = { ...challenge, method };

        if (method === "webauthn") {
            const credential = await resolveWebAuthnCredential(options.webauthnCredential, challenge);
            response = await manager.post<LoginResponse>(LOGIN_MFA("webauthn"), createMfaBody(challenge, credential));
        } else {
            const endpoint = LOGIN_MFA(method);
            const maxAttempts = typeof options.mfaCode === "function" ? 3 : 1;
            let previousCode: string | null = null;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (method === "sms" && typeof options.mfaCode === "function") {
                    const sent = await manager.post<{ phone?: string }>(LOGIN_SMS_SEND(), { ticket: challenge.ticket });
                    challenge = { ...challenge, codeSent: true, smsPhone: sent?.phone ?? null };
                }

                const code = await resolveCode(options.mfaCode, challenge);
                if (previousCode !== null && code === previousCode) {
                    throw new Error("The same MFA code was submitted twice. Wait for a new code.");
                }
                previousCode = code;

                try {
                    response = await manager.post<LoginResponse>(endpoint, createMfaBody(challenge, code));
                    break;
                } catch (error) {
                    if (attempt + 1 < maxAttempts && isInvalidMfaCode(error)) continue;
                    throw error;
                }
            }
        }

        if (response.mfa) throw new Error("Discord requested an additional MFA step.");
    }

    if (!response.token) throw new Error("Discord did not return an authentication token.");
    return response;
}

export const GetFingerprint = FetchFingerprint;
export const LoginWithout2FA = LoginWithPassword;
