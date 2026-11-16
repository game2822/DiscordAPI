# DiscordAPI

A wrapper around Discord's internal API.

> This library uses undocumented Discord endpoints. They can change at any
> time and may not be permitted by Discord's Terms of Service.

## Login

```ts
import { Login } from "@game28/discordapi";

const client = await Login(email, password, {
    // Optional. Choose the MFA method when several are available.
    mfaMethod: async (challenge) => challenge.methods[0],

    // Optional. Called for TOTP, SMS, or backup codes.
    mfaCode: async (challenge) => "123456",

    // Optional. Needed only for WebAuthn.
    webauthnCredential: async () => '{"id":"...","rawId":"...","response":{...}}',
});

console.log(client.userId);
console.log(client.Token);
```

The `DiscordAPI` class also exposes `client.login(email, password, options)`.

## Token login

If the account is already logged in through the official client or browser, the
token can be validated and used directly. This avoids the SMS/MFA flow and is
the most portable option for Expo apps.

```ts
import { LoginWithToken } from "@game28/discordapi";

const client = await LoginWithToken(token);
console.log(client.userId);
```

## Interactive examples

```bash
npm run example:login
npm run example:token
```

The example uses the website request shape that succeeded in Postman:
`GET /experiments`, then `POST /auth/login`, then `POST /auth/mfa/{method}`.
The fingerprint comes from `/experiments` and is reused. The MFA ticket comes
from the login response. Neither value is hardcoded.

The example prompts for an email address, a hidden password, and an MFA method
when Discord requires it. It supports TOTP, backup codes, SMS, and WebAuthn.

WebAuthn credentials must be created by a WebAuthn client for `discord.com`.
A Node process cannot generate the credential itself, so the example asks for
the stringified `PublicKeyCredential` JSON when WebAuthn is selected.

## TOTP troubleshooting

`Invalid two-factor code` (`60008`) means Discord reached the account behind the
ticket but the submitted code did not match that account's authenticator.
The MFA challenge exposes the ticket owner so this can be checked:

```ts
mfaMethod: (challenge) => {
    // The account the MFA ticket belongs to.
    console.log(challenge.userId);
    return "totp";
},
```

`DecodeTicketUserId(ticket)` is also exported, and the example prints
`Ticket account: ...`. Compare that value with your own Discord user ID
(Discord settings, or the ticket in a browser HAR). If they differ, the
authenticator entry belongs to a different account and no amount of fresh codes
will work; re-add the secret on the account that is actually being logged into.

Set `DISCORD_EXPECTED_USER_ID` to make the example warn about a mismatch:

```bash
DISCORD_EXPECTED_USER_ID=468729053809999881 npm run example:login
```

Other checks the example prints on `60008`:

- The local clock offset against Discord's HTTP `Date` header. Codes generated
  locally from a secret are invalid when the clock is more than ~30 seconds off.
- Whether the code was generated after the login started and was not already
  used on the website. Discord rejects replayed codes.
- Whether the same code was submitted twice. Discord rejects a reused code, and
  the library refuses to resend one. Wait for the authenticator to rotate
  (30 seconds) before retrying.

The ticket itself can be checked without any code: `DISCORD_MFA_METHOD=sms`
calls `/auth/mfa/sms/send`, which only needs the ticket. If Discord returns a
phone number, the ticket and request metadata are fine; if it fails the problem
is the ticket or the request.

Backup codes are 8 characters, usually shown as `xxxx-xxxx`. The module posts
them to `/auth/mfa/backup` with the dash removed, matching the web client.
`DISCORD_MFA_METHOD=backup npm run example:login` confirms that the ticket and
account are correct without relying on the authenticator entry.

## Reusing a captured browser session

The login flow is the one the website uses:

1. `GET /experiments` — returns `fingerprint` and sets `__dcfduid` / `__sdcfduid`.
2. `POST /auth/login` with `{login, password, undelete, login_source, gift_code_sku_id}`.
3. `POST /auth/mfa/{totp,sms,backup,webauthn}` with
   `{code, ticket, login_source, gift_code_sku_id, login_instance_id}`.

The same fingerprint is sent on every request. To use a session captured from
your browser instead of a fresh one:

```bash
DISCORD_FINGERPRINT='<fingerprint from /experiments>' \
DISCORD_COOKIES='__dcfduid=...; __sdcfduid=...; locale=en-US' \
npm run example:login
```

When both are provided, `/experiments` is skipped and the supplied session is
used as-is (`LoginOptions.fingerprint` and `LoginOptions.cookies`).



