import fetch, { Headers } from "node-fetch";
import readline from "readline";

const BASE_URL = "https://discord.com/api/v9";

type CookieMap = Record<string, string>;

function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve =>
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        })
    );
}

function parseSetCookies(setCookies: string[] | null): CookieMap {
    const cookies: CookieMap = {};
    if (!setCookies) return cookies;

    for (const cookie of setCookies) {
        const [pair] = cookie.split(";");
        const [name, value] = pair.split("=");
        cookies[name] = value;
    }
    return cookies;
}

function renderCookieHeader(cookies: CookieMap): string {
    return Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
}

async function getFingerprint(): Promise<{ fingerprint: string; cookies: CookieMap }> {
    const res = await fetch(`${BASE_URL}/experiments`);
    const data = await res.json();

    const cookies = parseSetCookies(res.headers.raw()["set-cookie"]);
    return {
        fingerprint: data.fingerprint,
        cookies,
    };
}

async function login(
    email: string,
    password: string,
    fingerprint: string,
    cookies: CookieMap
) {
    const headers = new Headers({
        "Content-Type": "application/json",
        "X-Fingerprint": fingerprint,
        "Cookie": renderCookieHeader(cookies),
    });

    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            login: email,
            password,
            undelete: false,
            captcha_key: null,
            login_source: null,
            gift_code_sku_id: null,
        }),
    });

    const newCookies = parseSetCookies(res.headers.raw()["set-cookie"]);
    Object.assign(cookies, newCookies);

    return res.json();
}

async function verify2FA(
    ticket: string,
    code: string,
    fingerprint: string,
    cookies: CookieMap
) {
    const headers = new Headers({
        "Content-Type": "application/json",
        "X-Fingerprint": fingerprint,
        "Cookie": renderCookieHeader(cookies),
    });

    const res = await fetch(`${BASE_URL}/auth/mfa/totp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            ticket,
            code,
            login_source: null,
        }),
    });

    const newCookies = parseSetCookies(res.headers.raw()["set-cookie"]);
    Object.assign(cookies, newCookies);

    return res.json();
}

async function main() {
    const email = await prompt("Email: ");
    const password = await prompt("Password: ");

    console.log("\nFetching fingerprint...");
    const { fingerprint, cookies } = await getFingerprint();

    console.log("Logging in...");
    const loginResponse = await login(email, password, fingerprint, cookies);

    if (loginResponse.mfa) {
        console.log("2FA required.");
        const code = await prompt("2FA Code: ");

        const finalResponse = await verify2FA(
            loginResponse.ticket,
            code,
            fingerprint,
            cookies
        );

        console.log("\nFinal response:");
        console.dir(finalResponse, { depth: null });
    } else {
        console.log("\nFinal response:");
        console.dir(loginResponse, { depth: null });
    }
}

main().catch(err => {
    console.error("Error:", err);
});
