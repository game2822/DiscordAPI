import {
    DiscordHTTPError,
    Login,
    MfaRequiredError,
    type MfaChallenge,
    type MfaMethod,
} from "../src";
import { prompt, promptHidden } from "./prompt";

const debug = process.env.DEBUG === "1";
const showMfa = process.env.DISCORD_SHOW_MFA === "1";
const expectedUserId = process.env.DISCORD_EXPECTED_USER_ID?.trim() || null;
let ticketUserId: string | null = null;
let lastTotpCode = "";
let usedEnvTotp = false;

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

function maskCookies(value: string): string {
    return value
        .split(";")
        .map((part) => part.split("=")[0].trim())
        .filter(Boolean)
        .join("; ");
}

function maskBody(body: string): string {
    try {
        const parsed = JSON.parse(body) as Record<string, unknown>;

        for (const key of Object.keys(parsed)) {
            if (!/ticket|code|password|login|token|secret/i.test(key)) {
                continue;
            }

            if (typeof parsed[key] === "string") {
                parsed[key] = `<${key}: ${(parsed[key] as string).length} chars>`;
            }
        }

        return JSON.stringify(parsed);
    } catch {
        return body;
    }
}

/** Prints API requests without leaking cookies, tokens, tickets, or codes. */
function installFetchLogging(): void {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: FetchInput, init?: FetchInit) => {
        const url = typeof input === "string"
            ? input
            : input instanceof URL
                ? input.href
                : input.url;

        if (url.includes("/api/")) {
            console.log(`\n[debug] ${init?.method ?? "GET"} ${url}`);

            const headers = init?.headers as Record<string, string> | undefined;

            if (headers) {
                const safe: Record<string, string> = {};

                for (const [name, value] of Object.entries(headers)) {
                    safe[name] = /cookie|authorization/i.test(name) ? maskCookies(value) : value;
                }

                console.log("[debug] headers:", safe);
            }

            if (typeof init?.body === "string") {
                console.log("[debug] body:", maskBody(init.body));
            }
        }

        return originalFetch(input, init);
    }) as typeof fetch;
}

async function getClockSkewSeconds(): Promise<number | null> {
    try {
        const response = await fetch("https://discord.com/api/v9/gateway");
        const serverDate = response.headers.get("date");

        if (!serverDate) {
            return null;
        }

        const serverTime = Date.parse(serverDate);

        if (Number.isNaN(serverTime)) {
            return null;
        }

        return Math.round((Date.now() - serverTime) / 1000);
    } catch {
        return null;
    }
}

function secondsUntilNextTotpWindow(): number {
    return 30 - (Math.floor(Date.now() / 1000) % 30);
}

function sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function askCode(label: string): Promise<string> {
    const code = await (showMfa ? prompt(label) : promptHidden(label));

    if (debug) {
        console.log(`Code length: ${code.length} (alphanumeric: ${code.replace(/[^a-zA-Z0-9]/g, "").length})`);
    }

    return code;
}

async function requestMfaMethod(challenge: MfaChallenge): Promise<MfaMethod> {
    if (challenge.methods.length === 0) {
        throw new Error("Discord did not advertise a supported MFA method.");
    }

    ticketUserId = challenge.userId;

    console.log(`Ticket account: ${challenge.userId ?? "unknown"}`);

    if (challenge.userId && expectedUserId && challenge.userId !== expectedUserId) {
        console.log(`Warning: expected account ${expectedUserId}, ticket belongs to ${challenge.userId}.`);
        console.log("The authenticator entry must belong to the ticket's account.");
    }

    if (debug) {
        console.log("MFA challenge:", {
            methods: challenge.methods,
            hasTicket: Boolean(challenge.ticket),
            hasLoginInstanceId: Boolean(challenge.loginInstanceId),
        });
    }

    const forcedMethod = process.env.DISCORD_MFA_METHOD;

    if (forcedMethod && challenge.methods.includes(forcedMethod as MfaMethod)) {
        return forcedMethod as MfaMethod;
    }

    if (challenge.methods.length === 1) {
        console.log(`Using MFA method: ${challenge.methods[0]}`);
        return challenge.methods[0];
    }

    console.log(`Available MFA methods: ${challenge.methods.join(", ")}`);

    while (true) {
        const answer = (await prompt("MFA method: ")).trim().toLowerCase();

        if (challenge.methods.includes(answer as MfaMethod)) {
            return answer as MfaMethod;
        }

        console.log(`Choose one of: ${challenge.methods.join(", ")}`);
    }
}

async function requestMfaCode(challenge: MfaChallenge): Promise<string> {
    const envCode = process.env.DISCORD_TOTP?.trim();

    if (challenge.method === "totp" && envCode && !usedEnvTotp) {
        usedEnvTotp = true;

        if (debug) {
            console.log("Using TOTP code from DISCORD_TOTP.");
        }

        return envCode;
    }

    if (challenge.method === "sms") {
        console.log(challenge.smsPhone
            ? `SMS sent to ${challenge.smsPhone}.`
            : "Discord accepted the SMS request.");
        return askCode("SMS code: ");
    }

    if (challenge.method === "backup") {
        console.log("Enter a backup code (8 characters, dashes optional).");
        return askCode("Backup code: ");
    }

    while (true) {
        console.log("Generate a new TOTP code now, then enter it immediately.");
        console.log("Use the code from your authenticator app; do not retype an old one.");

        const code = await askCode("2FA code: ");
        const normalized = code.replace(/\D/g, "");

        if (normalized && normalized === lastTotpCode) {
            const wait = secondsUntilNextTotpWindow() + 1;

            console.log("That is the same code as the previous attempt, and Discord rejects reused codes.");
            console.log(`Waiting ${wait}s so the authenticator shows a new code...`);
            await sleep(wait * 1000);
            continue;
        }

        lastTotpCode = normalized;
        return code;
    }
}

async function requestWebAuthnCredential(challenge: MfaChallenge): Promise<string> {
    if (!challenge.webauthn) {
        throw new Error("Discord did not provide a WebAuthn challenge.");
    }

    console.log("\nWebAuthn requires a credential from a discord.com WebAuthn context.");
    console.log("Paste the stringified PublicKeyCredential JSON below.");

    return prompt("Credential JSON: ");
}

async function main(): Promise<void> {
    const fingerprint = process.env.DISCORD_FINGERPRINT?.trim() || undefined;
    const cookies = process.env.DISCORD_COOKIES?.trim() || undefined;

    if (debug) {
        installFetchLogging();
    }

    console.log("Discord login");
    console.log("Request shape: website (the Postman login that succeeded)");
    console.log(`Reusing a supplied session: ${fingerprint && cookies ? "yes" : "no — fresh /experiments"}`);
    console.log("Uses an undocumented Discord endpoint. Use at your own risk.\n");

    const email = (await prompt("Email: ")).trim();
    const password = await promptHidden("Password: ");

    if (!email || !password) {
        throw new Error("Email and password are required.");
    }

    const client = await Login(email, password, {
        mfaMethod: requestMfaMethod,
        mfaCode: requestMfaCode,
        webauthnCredential: requestWebAuthnCredential,
        fingerprint,
        cookies,
    });

    console.log("\nLogin successful.");
    console.log(`User ID: ${client.userId || "unknown"}`);
    console.log(`Token received: ${client.Token ? "yes" : "no"}`);
    console.log("The token is:" + client.Token);
}

function getErrorCode(error: DiscordHTTPError): number | null {
    const body = error.responseBody;

    if (typeof body !== "object" || body === null || !("code" in body)) {
        return null;
    }

    return typeof body.code === "number" ? body.code : null;
}

async function reportFailure(error: unknown): Promise<void> {
    if (error instanceof MfaRequiredError) {
        console.error(`\n${error.message}`);
        console.error("Provide the requested MFA data and run the example again.");
    } else if (error instanceof DiscordHTTPError) {
        console.error(`\nLogin failed: ${error.message}`);
        console.error("Response:", JSON.stringify(error.responseBody));

        if (getErrorCode(error) === 60008) {
            const skew = await getClockSkewSeconds();

            console.error("");
            console.error("Discord rejected the two-factor code. Check that:");
            console.error(`- the ticket account is the one the authenticator belongs to (${ticketUserId ?? "unknown"})`);

            if (expectedUserId) {
                console.error(`- the expected account is ${expectedUserId}`);
            }

            console.error(`- the local clock is close to Discord's clock (offset: ${skew === null ? "unknown" : `${skew}s`})`);
            console.error("- the code comes straight from the authenticator app and has not been submitted before");
            console.error("- the ticket itself works: DISCORD_MFA_METHOD=sms tests /auth/mfa/sms/send without a code");
        }
    } else if (error instanceof Error) {
        console.error(`\nLogin failed: ${error.message}`);
    } else {
        console.error("\nLogin failed with an unknown error.");
    }

    process.exitCode = 1;
}

main().catch(reportFailure);
