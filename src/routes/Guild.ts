import { RestManager } from "../rest/RESTManager";
import { BASE_URL, GET_CURRENT_USER_GUILDS } from "../rest/endpoints";
import { Guild } from "../structures/Guild";

export interface GetCurrentUserGuildsOptions {
    before?: string;
    after?: string;
    limit?: number;
    withCounts?: boolean;
}

export async function GetCurrentUserGuilds(
    token: string,
    options: GetCurrentUserGuildsOptions = {},
): Promise<Guild[]> {
    const manager = new RestManager(BASE_URL);
    const response = await manager.get<Array<Record<string, unknown>>>(GET_CURRENT_USER_GUILDS(), {
        before: options.before,
        after: options.after,
        limit: options.limit,
        with_counts: options.withCounts,
    }, {
        Authorization: token,
    });

    return response.map((item) => new Guild(
        String(item.id),
        String(item.name),
        (item.icon as string | null | undefined) ?? null,
        (item.banner as string | null | undefined) ?? null,
        Boolean(item.owner),
        typeof item.permissions === "string" ? item.permissions : undefined,
        Array.isArray(item.features) ? item.features.map(String) : [],
        typeof item.approximate_member_count === "number" ? item.approximate_member_count : undefined,
        typeof item.approximate_presence_count === "number" ? item.approximate_presence_count : undefined,
    ));
}
