import type { LoginOptions, LoginResponse } from "../routes/Auth";
import { LoginWithPassword } from "../routes/Auth";
import { GetCurrentUser } from "../routes/User";
import { DiscordAPI } from "../structures/DiscordAPI";

export async function Login(
    email: string,
    password: string,
    options: LoginOptions = {},
): Promise<DiscordAPI> {
    const response: LoginResponse = await LoginWithPassword(email, password, options);
    if (!response.token) throw new Error("Login response did not contain a token.");
    return new DiscordAPI(response.token, response.user_id ?? "");
}

export async function LoginWithToken(token: string): Promise<DiscordAPI> {
    const user = await GetCurrentUser(token);
    return new DiscordAPI(token, user.id);
}
