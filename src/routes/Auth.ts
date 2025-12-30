import { RestManager } from "../rest/RESTManager";
import { BASE_URL, GET_FINGERPRINT, LOGIN_WITHOUT_2FA } from "../rest/endpoints";

export const GetFingerprint = async () => {
    const manager = new RestManager(BASE_URL);
    const fingerprint = await manager.get<string>(GET_FINGERPRINT());
    const cookies = (manager as any).cookies || "";
    return {fingerprint, cookies};
}

export const LoginWithout2FA = async (email: string, password: string, fingerprint: string, cookies: string) => {
    const manager = new RestManager(BASE_URL);

    const body = {
        login: email,
        password: password,
        undelete: false,
        captcha_key: null,
        login_source: null,
        gift_code_sku_id: null,
    };
    const headers = {
        "Content-Type": "application/json",
        "X-Fingerprint": fingerprint,
        "Cookie": cookies,
    };
    const response = await manager.post<any>(LOGIN_WITHOUT_2FA(), body, undefined, {
        headers: headers,
        }, true);
    return response;
}
