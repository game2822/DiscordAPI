import { RestManager } from "../rest/RESTManager";
import { BASE_URL } from "../rest/endpoints";

export const GetFingerprint = async () => {
    const manager = new RestManager(BASE_URL);
    const fingerprint = await manager.get<string>("experiments");
    // Also return cookies 
    const cookies = (manager as any).cookies || "";
    return {fingerprint, cookies};
}

export const LoginWithout2FA = async (email: string, password: string, fingerprint: string, cookies: string) => {
    const manager = new RestManager(BASE_URL);
    const response = await manager.post<any>("auth/login", {
        login: email,
        password: password,
        undelete: false,
        captcha_key: null,
        login_source: null,
        gift_code_sku_id: null,
    }, {}, {
        headers: {
            "Content-Type": "application/json",
            "X-Fingerprint": fingerprint,
            "Cookie": cookies,
        }
    }, true);
    return response;
}
