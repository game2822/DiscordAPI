import { RestManager } from "../rest/RESTManager";
import { BASE_URL } from "../rest/endpoints";

const manager = new RestManager(BASE_URL);


export const GetAllGuilds = async () => {
    return manager.get<Array<any>>("/users/@me/guilds",
        undefined,
        {
            "Content-Type": "application/json",
            Authorization:  process.env.DISCORD_TOKEN!,
        }
        
    );
}

export const GetChannelsForGuild = async (guildId: string) => {
    return manager.get<Array<any>>(`/guilds/${guildId}/channels`,
        undefined,
        {
            "Content-Type": "application/json",
            Authorization:  process.env.DISCORD_TOKEN!,
        }
    );
}