import { GetFingerprint, LoginWithout2FA } from "../routes/Auth";
import { GetAllGuilds } from "../routes/Guild";

export class DiscordAPI {
    constructor(
        public Token: string,
        public userId: string,
    ){}

    async login(email: string, password: string) {
        try {
        const {fingerprint, cookies} =  await GetFingerprint();
        const loginResponse = await LoginWithout2FA(email, password, fingerprint, cookies);
        this.Token = loginResponse.token;
        this.userId = loginResponse.user_id;
    } catch (error) {
        console.error("Error during authentication:", error);
    }
    }

     async GetGrades(): Promise<Array<any>> {
        return GetAllGuilds(this.Token);
    }
    
    
}