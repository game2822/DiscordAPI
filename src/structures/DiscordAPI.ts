import type { LoginOptions, LoginResponse } from "../routes/Auth";
import { LoginWithPassword } from "../routes/Auth";
import { GetCurrentUser } from "../routes/User";

export class DiscordAPI {
    public Token: string;
    public userId: string;

    constructor(token = "", userId = "") {
        this.Token = token;
        this.userId = userId;
    }

    public async login(email: string, password: string, options: LoginOptions = {}): Promise<this> {
        this.applyLogin(await LoginWithPassword(email, password, options));
        return this;
    }

    public async loginWithToken(token: string): Promise<this> {
        const user = await GetCurrentUser(token);
        this.Token = token;
        this.userId = user.id;
        return this;
    }

    public isLoggedIn(): boolean {
        return this.Token.length > 0;
    }

    private applyLogin(response: LoginResponse): void {
        if (!response.token) throw new Error("Login response did not contain a token.");
        this.Token = response.token;
        this.userId = response.user_id ?? "";
    }
}
