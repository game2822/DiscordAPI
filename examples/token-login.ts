import { LoginWithToken } from "../src";
import { promptHidden } from "./prompt";

async function main(): Promise<void> {
    console.log("Discord token login");
    console.log("Log in through the official client/browser, then paste the token below.\n");

    const token = (await promptHidden("Token: ")).trim();

    if (!token) {
        throw new Error("A token is required.");
    }

    const client = await LoginWithToken(token);

    console.log("\nToken accepted.");
    console.log(`User ID: ${client.userId}`);
    console.log("The token is available as client.Token.");
}

main().catch((error: unknown) => {
    if (error instanceof Error) {
        console.error(`\nToken login failed: ${error.message}`);
    } else {
        console.error("\nToken login failed with an unknown error.");
    }

    process.exitCode = 1;
});
