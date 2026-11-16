import type { QueryParams, RequestOptions } from "../types/RequestHandler";

export type ClientProfile = "web" | "android";

const WEB_USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36";
const WEB_BROWSER_VERSION = "155.0.0.0";
const WEB_CLIENT_BUILD_NUMBER = 672800;

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function randomId(): string {
    const crypto = globalThis.crypto as
        | { randomUUID?: () => string; getRandomValues?: (b: Uint8Array) => Uint8Array }
        | undefined;

    if (crypto?.randomUUID) return crypto.randomUUID();

    if (crypto?.getRandomValues) {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    return "00000000-0000-4000-8000-000000000000";
}

function utf8ToBytes(value: string): Uint8Array {
    const encoded = encodeURIComponent(value);
    const bytes: number[] = [];

    for (let i = 0; i < encoded.length; i++) {
        if (encoded[i] === "%") {
            bytes.push(parseInt(encoded.slice(i + 1, i + 3), 16));
            i += 2;
        } else {
            bytes.push(encoded.charCodeAt(i));
        }
    }

    return Uint8Array.from(bytes);
}

function encodeBase64(value: string): string {
    const bytes = utf8ToBytes(value);
    let out = "";

    for (let i = 0; i < bytes.length; i += 3) {
        const a = bytes[i];
        const b = bytes[i + 1] ?? 0;
        const c = bytes[i + 2] ?? 0;
        const chunk = (a << 16) | (b << 8) | c;

        out += BASE64[(chunk >> 18) & 63];
        out += BASE64[(chunk >> 12) & 63];
        out += i + 1 < bytes.length ? BASE64[(chunk >> 6) & 63] : "=";
        out += i + 2 < bytes.length ? BASE64[chunk & 63] : "=";
    }

    return out;
}

function getTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Brussels";
    } catch {
        return "Europe/Brussels";
    }
}

function buildSuperProperties(): string {
    return encodeBase64(JSON.stringify({
        os: "Linux",
        browser: "Chrome",
        device: "",
        device_model_name: "",
        system_locale: "en-US",
        has_client_mods: false,
        browser_user_agent: WEB_USER_AGENT,
        browser_version: WEB_BROWSER_VERSION,
        os_version: "",
        referrer: "",
        referring_domain: "",
        referrer_current: "",
        referring_domain_current: "",
        release_channel: "stable",
        client_build_number: WEB_CLIENT_BUILD_NUMBER,
        client_event_source: null,
        client_launch_id: randomId(),
        launch_signature: randomId(),
        client_app_state: "focused",
    }));
}

function readSetCookies(headers: { get(name: string): string | null; getSetCookie?: () => string[] }): string[] {
    if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
    const raw = headers.get("set-cookie");
    return raw ? [raw] : [];
}

function appendQuery(path: string, params?: QueryParams): string {
    if (!params) return path;

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) search.set(key, String(value));
    }

    const query = search.toString();
    return query ? `${path}${path.includes("?") ? "&" : "?"}${query}` : path;
}

export class DiscordHTTPError extends Error {
    public readonly status: number;
    public readonly responseBody: unknown;

    constructor(status: number, statusText: string, responseBody: unknown) {
        const suffix = statusText ? ` ${statusText}` : "";
        const detail =
            typeof responseBody === "object" &&
            responseBody !== null &&
            "message" in responseBody &&
            typeof (responseBody as { message: unknown }).message === "string"
                ? `: ${(responseBody as { message: string }).message}`
                : "";
        super(`Discord request failed (${status}${suffix})${detail}`);
        this.name = "DiscordHTTPError";
        this.status = status;
        this.responseBody = responseBody;
    }
}

export class RestManager {
    private readonly baseURL: string;
    private readonly timezone = getTimezone();
    private readonly superProperties = buildSuperProperties();
    private readonly cookies = new Map<string, string>([["locale", "en-US"]]);
    private fingerprint: string | null = null;

    constructor(baseURL: string, _profile: ClientProfile = "web", _installationId?: string) {
        this.baseURL = baseURL.replace(/\/+$/, "");
    }

    public getFingerprint(): string | null {
        return this.fingerprint;
    }

    public setFingerprint(fingerprint: string): void {
        this.fingerprint = fingerprint;
    }

    public getCookies(): string {
        return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    }

    public setCookies(header: string): void {
        for (const part of header.split(";")) {
            const sep = part.indexOf("=");
            if (sep <= 0) continue;
            this.cookies.set(part.slice(0, sep).trim(), part.slice(sep + 1).trim());
        }
    }

    public getHeaders(): Record<string, string> {
        return this.buildHeaders(false);
    }

    private updateCookies(setCookies: string[]): void {
        for (const cookie of setCookies) {
            const [pair] = cookie.split(";");
            const sep = pair.indexOf("=");
            if (sep <= 0) continue;
            this.cookies.set(pair.slice(0, sep).trim(), pair.slice(sep + 1).trim());
        }
    }

    private buildHeaders(hasBody: boolean, extra?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
        };

        if (hasBody) headers["content-type"] = "application/json";

        headers.origin = "https://discord.com";
        headers.priority = "u=1, i";
        headers.referer = "https://discord.com/login";
        headers["sec-ch-ua"] = '"Google Chrome";v="155", "Chromium";v="155", "Not(A:Brand";v="24"';
        headers["sec-ch-ua-mobile"] = "?0";
        headers["sec-ch-ua-platform"] = '"Linux"';
        headers["sec-fetch-dest"] = "empty";
        headers["sec-fetch-mode"] = "cors";
        headers["sec-fetch-site"] = "same-origin";
        headers["user-agent"] = WEB_USER_AGENT;
        headers["x-debug-options"] = "bugReporterEnabled";
        headers["x-discord-locale"] = "en-US";
        headers["x-discord-timezone"] = this.timezone;

        if (this.fingerprint) headers["x-fingerprint"] = this.fingerprint;

        headers["x-super-properties"] = this.superProperties;

        if (extra) {
            for (const [name, value] of Object.entries(extra)) {
                headers[name.toLowerCase()] = value;
            }
        }

        const cookie = this.getCookies();
        if (cookie) headers.cookie = cookie;

        return headers;
    }

    private async sendRequest<T>(options: RequestOptions, textOnly = false): Promise<T> {
        const url = `${this.baseURL}/${options.path.replace(/^\/+/, "")}`;
        const hasBody = options.body !== undefined && options.body !== null;
        const headers = options.rawHeaders
            ? { ...(options.headers ?? {}) }
            : this.buildHeaders(hasBody, options.headers);

        if (options.omitCookies) {
            delete headers.cookie;
            delete headers.Cookie;
        }

        let body: string | undefined;
        if (options.body instanceof URLSearchParams) {
            body = options.body.toString();
            headers["content-type"] = "application/x-www-form-urlencoded";
        } else if (hasBody) {
            body = JSON.stringify(options.body);
            headers["content-type"] ??= "application/json";
        }

        const response = await fetch(url, { method: options.method, body, headers });
        this.updateCookies(readSetCookies(response.headers));

        const raw = await response.text();
        if (response.status < 200 || response.status >= 300) {
            let parsed: unknown = raw;
            if (raw) {
                try { parsed = JSON.parse(raw); } catch {}
            }
            throw new DiscordHTTPError(response.status, response.statusText, parsed);
        }

        if (textOnly || response.status === 204 || !raw) return raw as T;

        try {
            return JSON.parse(raw) as T;
        } catch {
            return raw as T;
        }
    }

    public get<T>(path: string, params?: QueryParams, headers?: Record<string, string>): Promise<T> {
        return this.sendRequest<T>({ method: "GET", path: appendQuery(path, params), headers });
    }

    public post<T>(path: string, body?: unknown, params?: QueryParams, headers?: Record<string, string>): Promise<T> {
        return this.sendRequest<T>({ method: "POST", path: appendQuery(path, params), body, headers });
    }

    public put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
        return this.sendRequest<T>({ method: "PUT", path, body, headers });
    }

    public patch<T>(path: string, body?: unknown, params?: QueryParams, headers?: Record<string, string>): Promise<T> {
        return this.sendRequest<T>({ method: "PATCH", path: appendQuery(path, params), body, headers });
    }

    public delete<T>(path: string, params?: QueryParams, headers?: Record<string, string>, textOnly = false): Promise<T> {
        return this.sendRequest<T>({ method: "DELETE", path: appendQuery(path, params), headers }, textOnly);
    }
}
