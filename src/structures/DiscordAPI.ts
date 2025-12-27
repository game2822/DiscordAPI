import { GetFingerprint, LoginWithout2FA } from "../routes/Auth";

export class DiscordAPI {
    constructor(
        protected Token: string,
        public userId: string,
    ){}

    async login(email: string, password: string) {
        try {
        const {fingerprint, cookies} =  await GetFingerprint();
        console.log("Fingerprint:", fingerprint);
        console.log("Cookies:", cookies);
        const loginResponse = await LoginWithout2FA(email, password, fingerprint, cookies);
        console.log("Login Response:", loginResponse);
    } catch (error) {
        console.error("Error during authentication:", error);
    }
    }
}