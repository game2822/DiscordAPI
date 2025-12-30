import { Login } from "../src/util/Login";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


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
    const response = await Login(email, password);

    console.log("Login successful!");
    console.log("Token:", response.Token);
    console.log("User ID:", response.userId);
    rl.close();
})();