import { configDotenv } from "dotenv";
import { GetCurrentUserGuilds } from "../src";
import { promptHidden } from "./prompt";

async function main(): Promise<void> {
    console.log("Discord guilds");
    console.log("Lists guilds for the authenticated user.\n");
    configDotenv();

    const token = (process.env.DISCORD_TOKEN ?? await promptHidden("Token: ")).trim();
    if (!token) throw new Error("A token is required.");

    const guilds = await GetCurrentUserGuilds(token, { limit: 100, withCounts: true });

    console.log(`\n${guilds.length} guild(s):`);
    for (const guild of guilds) {
        console.log("---------------------------------------------------------");
        console.log(`Name: ${guild.name}`);
        console.log(`Icon: ${guild.icon}`);
        console.log(`Banner: ${guild.banner}`);
        console.log(`Owner: ${guild.owner}`);
        console.log(`Perms: ${guild.permissions}`);
        console.log(`Features: ${guild.features}`);
        console.log(`Members: ${guild.approximate_member_count}`);
        console.log(`Online: ${guild.approximate_presence_count}`);
    }
}

main().catch((error: unknown) => {
    if (error instanceof Error) {
        console.error(`\nFailed to list guilds: ${error.message}`);
    } else {
        console.error("\nFailed to list guilds with an unknown error.");
    }
    process.exitCode = 1;
});
