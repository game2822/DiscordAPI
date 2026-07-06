import { Login } from "../src/util/Login";
import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


(async () => {
    const email = "oreolive311@gmail.com"
    const password = "yiJq4SaYA$ag#35"
    const response = await Login(email, password);

    console.log("Login successful!");
    console.log("JSON Response:", response);
    console.log("Token:", response.Token);
    console.log("User ID:", response.userId);
    rl.close();
})();