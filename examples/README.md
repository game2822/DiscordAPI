# Examples

Run the interactive login example from the project root:

```bash
npm run example:login
```

Run the token login example:

```bash
npm run example:token
```

Run the guilds example (lists guilds for a token):

```bash
npm run example:guilds
# or: DISCORD_TOKEN=<token> npm run example:guilds
```

The example follows the website login requests: `/experiments`, `/auth/login`,
then `/auth/mfa/{method}`. The fingerprint and MFA ticket are taken from those
responses.

The example prompts for an email address, a hidden password, and—if Discord
requires it—an MFA method. It supports TOTP, backup codes, SMS, and WebAuthn.

WebAuthn requires a credential generated for `discord.com`; paste the
stringified `PublicKeyCredential` JSON when prompted.
