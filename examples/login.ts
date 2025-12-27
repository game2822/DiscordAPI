import { DiscordAPI } from "../src/structures/DiscordAPI";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const api = new DiscordAPI("", "");

(async () => {
    const email = await new Promise<string>((resolve) => {
        rl.question("Enter your email: ", (answer) => {
            resolve(answer);
        });
    });
    const password = await new Promise<string>((resolve) => {
        rl.question("Enter your password: ", (answer) => {
            resolve(answer);
        });
    });
    await api.login(email, password);
    rl.close();
})();