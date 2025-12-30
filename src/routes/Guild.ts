import { RestManager } from "../rest/RESTManager";
import { BASE_URL, GET_ALL_GUILDS, GET_CHANNELS_FOR_GUILD } from "../rest/endpoints";

const manager = new RestManager(BASE_URL);


export const GetAllGuilds = async (token: string) => {
    return manager.get<Array<any>>(GET_ALL_GUILDS(),
        undefined,
        {
            "Content-Type": "application/json",
            Authorization:  token,
        }
        
    );
}

export const GetChannelsForGuild = async (guildId: string, token: string) => {
    return manager.get<Array<any>>(GET_CHANNELS_FOR_GUILD(guildId),
        undefined,
        {
            "Content-Type": "application/json",
            Authorization:  token,
        }
    );
}