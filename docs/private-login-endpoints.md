# Private Discord Authentication Endpoint Inventory

Source file: `index.android.js`

Scope: authentication-related endpoint strings found in the decompiled Android bundle, including login, registration, MFA, passkeys, password recovery, remote authentication, SSO, handoff, sessions, and OAuth2.

This is a route inventory, not a login-flow guide. The decompiled bundle does not contain a public API contract, and these private endpoints can change without notice. No request bodies, signatures, cookies, tokens, or login sequence are reproduced here.

## URL construction

The client builds API URLs from a host plus an API version:

| Value | Source |
|---|---|
| API endpoint prefix: `//discord.com/api` | `index.android.js:70199` |
| API version: `9` | `index.android.js:70204` |
| Resolved API base: `https://discord.com/api/v9` | derived from the two values above |
| Gateway: `wss://gateway.discord.gg` | `index.android.js:70207` |
| Remote-auth gateway: `wss://remote-auth-gateway.discord.gg` | `index.android.js:70276` |
| Primary endpoint table | `index.android.js:490226` |
| Dynamic endpoint builders | `index.android.js:492385` onward |
| Client-side route table | `index.android.js:506770` |

The endpoint table stores paths only. The HTTP verb is selected by the request helper at the call site, so verbs are intentionally omitted rather than guessed.

## Login and fingerprint

| Key | API path | Notes |
|---|---|---|
| `EXPERIMENTS` | `/experiments` | Fingerprint/experiments endpoint. |
| `LOGIN` | `/auth/login` | Primary login endpoint. |
| `LOGIN_GENERATED_USER` | `/auth/login/generated-user/:id` | Dynamic builder; appends the user ID. |
| `LOGIN_MFA` | `/auth/mfa/:method` | Dynamic builder. Known methods: `totp`, `sms`, `backup`, `webauthn`. Backup codes are posted to `/auth/mfa/backup` with the dash removed (`xxxx-xxxx` becomes `xxxxxxxx`). |
| `LOGIN_SMS_SEND` | `/auth/mfa/sms/send` | Sends an SMS MFA code for the ticket. |
| `LOGIN_MFA("sms")` | `/auth/mfa/sms` | Verifies an SMS code. |
| `LOGIN_MFA("webauthn")` | `/auth/mfa/webauthn` | Verifies a stringified WebAuthn credential response. |
| `ONE_TIME_LOGIN` | `/auth/one-time-login` | One-time login endpoint. |
| `LOGOUT` | `/auth/logout` | Logs out the current session. |
| `FINISH_MFA_CHECK` | `/mfa/finish` | Completes an MFA check. |
| `AUTH_SESSIONS` | `/auth/sessions` | Authentication session list. |
| `AUTH_SESSION_NOTIFICATIONS_DEBUG` | `/auth/sessions/debug/notifications` | Session notification debug endpoint. |
| `AUTH_SESSIONS_LOGOUT` | `/auth/sessions/logout` | Logs out authentication sessions. |

## Registration, verification, and password recovery

| Key | API path | Notes |
|---|---|---|
| `REGISTER` | `/auth/register` | Account registration. |
| `REGISTER_PHONE` | `/auth/register/phone` | Phone registration. |
| `VERIFY` | `/auth/verify` | Email/account verification. |
| `VERIFY_RESEND` | `/auth/verify/resend` | Resends a verification code. |
| `MFA_SEND_VERIFICATION_KEY` | `/auth/verify/view-backup-codes-challenge` | Challenge for viewing backup codes. |
| `FORGOT_PASSWORD` | `/auth/forgot` | Starts password recovery. |
| `RESET_PASSWORD` | `/auth/reset` | Completes password reset. |
| `SCORE_PASSWORD` | `/auth/password/validate` | Password validation/scoring. |
| `AUTHORIZE_IP` | `/auth/authorize-ip` | IP authorization. |
| `ACCOUNT_REVERT` | `/auth/revert` | Account revert operation. |

## Passkeys, WebAuthn, and passwordless login

| Key | API path | Notes |
|---|---|---|
| `WEBAUTHN_CONDITIONAL_UI_CHALLENGE` | `/auth/conditional/start` | Starts a conditional-UI WebAuthn challenge. |
| `WEBAUTHN_CONDITIONAL_UI_LOGIN` | `/auth/conditional/finish` | Finishes a conditional-UI WebAuthn login. |
| `WEBAUTHN_PASSWORDLESS_CHALLENGE` | `/auth/passwordless/start` | Starts passwordless authentication. |
| `MFA_WEBAUTHN_CREDENTIALS` | `/users/@me/mfa/webauthn/credentials` | Lists/creates WebAuthn credentials. |
| `MFA_WEBAUTHN_CREDENTIAL` | `/users/@me/mfa/webauthn/credentials/:id` | Dynamic builder for one credential. |

## Account MFA management

These are authenticated account-security endpoints rather than login-entry endpoints, but they are part of the bundle's authentication surface.

| Key | API path | Notes |
|---|---|---|
| `MFA_TOTP_ENABLE` | `/users/@me/mfa/totp/enable` | Starts TOTP setup. |
| `MFA_TOTP_ENABLE_VERIFY` | `/users/@me/mfa/totp/enable/verify` | Verifies TOTP setup. |
| `MFA_TOTP_ENABLE_RESEND` | `/users/@me/mfa/totp/enable/resend` | Resends TOTP setup data. |
| `MFA_TOTP_DISABLE` | `/users/@me/mfa/totp/disable` | Disables TOTP. |
| `MFA_SMS_ENABLE` | `/users/@me/mfa/sms/enable` | Enables SMS MFA. |
| `MFA_SMS_DISABLE` | `/users/@me/mfa/sms/disable` | Disables SMS MFA. |
| `MFA_CODES_VERIFICATION` | `/users/@me/mfa/codes-verification` | Backup-code verification. |

## Remote authentication

| Key | API path | Notes |
|---|---|---|
| `REMOTE_AUTH_INITIALIZE` | `/users/@me/remote-auth` | Initializes remote authentication. |
| `REMOTE_AUTH_CANCEL` | `/users/@me/remote-auth/cancel` | Cancels remote authentication. |
| `REMOTE_AUTH_LOGIN` | `/users/@me/remote-auth/login` | Remote login step. |
| `REMOTE_AUTH_FINISH` | `/users/@me/remote-auth/finish` | Completes remote authentication. |

Related WebSocket endpoint:

| Endpoint | Notes |
|---|---|
| `wss://remote-auth-gateway.discord.gg` | Remote-auth gateway. |

## SSO, handoff, and location metadata

| Key | API path | Notes |
|---|---|---|
| `SSO` | `/sso` | SSO endpoint. |
| `SSO_TOKEN` | `/sso-token` | SSO token endpoint. |
| `HANDOFF` | `/auth/handoff` | Authentication handoff. |
| `HANDOFF_EXCHANGE` | `/auth/handoff/exchange` | Exchanges handoff state. |
| `AUTH_LOCATION_METADATA` | `/auth/location-metadata` | Authentication location metadata. |

## OAuth2

| Key | API path | Notes |
|---|---|---|
| `OAUTH2_AUTHORIZE` | `/oauth2/authorize` | OAuth2 authorization. |
| `OAUTH2_AUTHORIZE_SAMSUNG` | `/oauth2/samsung/authorize` | Samsung OAuth2 authorization. |
| `OAUTH2_AUTHORIZE_SAMSUNG_CALLBACK` | `/oauth2/samsung/authorize/callback` | Samsung OAuth2 callback. |
| `OAUTH2_AUTHORIZE_WEBHOOK_CHANNELS` | `/oauth2/authorize/webhook-channels` | Webhook-channel authorization step. |
| `OAUTH2_CURRENT_AUTH` | `/oauth2/@me` | Current OAuth2 authorization. |
| `OAUTH2_TOKENS` | `/oauth2/tokens` | OAuth2 token collection. |
| `OAUTH2_TOKEN` | `/oauth2/tokens/:id` | Dynamic builder for one OAuth2 token. |
| `OAUTH2_WHITELIST_ACCEPT` | `/oauth2/allowlist/accept` | Accepts OAuth2 allowlist access. |
| `OAUTH2_DEVICE_VERIFY` | `/oauth2/device/verify` | OAuth2 device verification. |
| `OAUTH2_DEVICE_FINISH` | `/oauth2/device/finish` | OAuth2 device flow completion. |
| `OAUTH2_ACCOUNT_LINKING_ACHIEVEMENT` | `/oauth2/account-linking-achievement` | Account-linking achievement route. |

## Client-side login and authorization routes

These are routes used by the app/router rather than API calls. They resolve against the Discord web host, for example `https://discord.com/login`.

| Key | Route | Notes |
|---|---|---|
| `LOGIN` | `/login` | Login page. |
| `LOGIN_WITH_REDIRECT` | `/login?redirect_to=:url` | Login page with redirect parameter. |
| `LOGIN_HANDOFF` | `/login/handoff` | Login handoff page. |
| `LOGIN_ONE_TIME` | `/login/one-time` | One-time login page. |
| `REGISTER` | `/register` | Registration page. |
| `REGISTER_WITH_REDIRECT` | `/register?redirect_to=:url` | Registration page with redirect parameter. |
| `AUTHORIZE_IP` | `/authorize-ip` | IP authorization page. |
| `REJECT_MFA` | `/reject-mfa` | MFA rejection page. |
| `AUTHORIZE_PAYMENT` | `/authorize-payment` | Payment authorization page. |
| `HANDOFF` | `/handoff` | Handoff page. |
| `MOBILE_WEB_HANDOFF` | `/mweb-handoff` | Mobile web handoff route. |
| `OAUTH2_AUTHORIZED` | `/oauth2/authorized` | OAuth2 authorized page. |
| `OAUTH2_ERROR` | `/oauth2/error` | OAuth2 error page. |
| `ACTIVATE_HANDOFF` | `/activate/handoff` | Activation handoff. |
| `BILLING_LOGIN_HANDOFF` | `/billing/login/handoff` | Billing login handoff. |
| `CONNECT_AUTHORIZE` | `/connect/authorize` | Connection authorization. |

Additional host strings found:

| String | Notes |
|---|---|
| `https://discord.com` | Default web host. |
| `https://discordapp.com/mweb-handoff` | Absolute mobile web handoff URL. |
| `https://discord.com/login` | Login page derived from host plus `/login`. |

## Gateway endpoints

| Endpoint | Notes |
|---|---|
| `wss://gateway.discord.gg` | Main Discord gateway. |
| `wss://remote-auth-gateway.discord.gg` | Remote authentication gateway. |

## Dynamic route builders

These entries appear as `null` in the endpoint table and are generated by a function instead.

| Builder | Pattern | Source |
|---|---|---|
| `LOGIN_GENERATED_USER` | `/auth/login/generated-user/` + user ID | `index.android.js:492385` |
| `LOGIN_MFA` | `/auth/mfa/` + method | `index.android.js:492405` |
| `MFA_WEBAUTHN_CREDENTIAL` | `/users/@me/mfa/webauthn/credentials/` + credential ID | `index.android.js:492415` |
| `OAUTH2_TOKEN` | `/oauth2/tokens/` + token ID | `index.android.js:492612` |
| `LOGIN_WITH_REDIRECT` | `/login?redirect_to=` + URL | `index.android.js:510925` |
| `REGISTER_WITH_REDIRECT` | `/register?redirect_to=` + URL | `index.android.js:510942` |

## Coverage notes

- Total extracted API/auth paths: 53 route-table entries, plus the dynamic `/auth/mfa/:method` variants.
- Total client-side auth/login routes: 16.
- Total gateway endpoints: 2.
- The endpoint table also contains unrelated resource paths; those are excluded.
- Analytics event names such as `login_attempted`, `login_successful`, and `one_time_login_error` are not endpoints and are excluded.
- Several entries in the bundle are UI state names or route labels rather than API URLs; those are excluded unless they are part of the auth route table.
- The bundle does not expose a stable, public specification for these routes. Treat every path here as private and subject to change.

## Known omissions

The following are not documented because the bundle does not provide a reliable, static definition:

- HTTP method per endpoint.
- Request body schema.
- Query parameter schema beyond the route patterns shown above.
- Response schema.
- Required headers or signatures.
- Retry, rate-limit, or anti-automation behavior.
- Complete login sequence and token-exchange requirements.
