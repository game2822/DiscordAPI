import { RestManager } from "../rest/RESTManager";
import { BASE_URL, GET_CURRENT_USER } from "../rest/endpoints";

export interface CurrentUser {
    id: string;
    username: string;
    discriminator?: string;
    global_name?: string | null;
    avatar?: string | null;
    bot?: boolean;
    [key: string]: unknown;
}

export async function GetCurrentUser(token: string): Promise<CurrentUser> {
    const manager = new RestManager(BASE_URL);
    return manager.get<CurrentUser>(GET_CURRENT_USER(), undefined, { Authorization: token });
}
