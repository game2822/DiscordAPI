# Expo usage

The library uses only `fetch` and standard JavaScript APIs. It does not import
Node built-ins, spawn local binaries, or write files. Cookies and the
fingerprint live in memory on the client instance.

Password login sends the same website requests that succeeded in Postman:

1. `GET /experiments?with_guild_experiments=true` — fingerprint and cookies.
2. `POST /auth/login` — same fingerprint. Body is
   `{login, password, undelete, login_source, gift_code_sku_id}`.
3. `POST /auth/mfa/{totp,sms,backup,webauthn}` — same fingerprint, and the
   ticket returned by step 2. The ticket is never hardcoded.

## SMS login

The login function is UI-agnostic. The app supplies the MFA method and code
callbacks, so the same flow works in an Expo screen.

```ts
import { Login } from "@game28/discordapi";

const client = await Login(email, password, {
    mfaMethod: async (challenge) => {
        // challenge.methods is e.g. ["totp", "backup", "sms", "webauthn"].
        return "sms";
    },

    mfaCode: async (challenge) => {
        if (challenge.method === "sms") {
            console.log("SMS sent to", challenge.smsPhone);
        }

        return await showCodePrompt(challenge);
    },
});
```

`Login` sends the SMS request before `mfaCode` is called, so the UI can show
`challenge.smsPhone` and `challenge.codeSent`.

## Token login

If the official app or website is already logged in, pass that token to
`LoginWithToken`. That skips MFA and does not depend on this login session.
