import * as readline from "node:readline";

export function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

/**
 * Reads a line without echoing it. Falls back to a normal prompt when stdin
 * is not an interactive terminal.
 */
export function promptHidden(question: string): Promise<string> {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
        return prompt(question);
    }

    return new Promise((resolve, reject) => {
        const stdin = process.stdin;
        const stdout = process.stdout;
        const wasRaw = stdin.isRaw ?? false;
        let value = "";

        const finish = (error?: Error): void => {
            stdin.off("data", onData);
            stdin.setRawMode(wasRaw);
            stdin.pause();
            stdout.write("\n");

            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        };

        const onData = (chunk: Buffer): void => {
            for (const character of chunk.toString("utf8")) {
                if (character === "\u0003") {
                    finish(new Error("Input cancelled."));
                    return;
                }

                if (character === "\r" || character === "\n") {
                    finish();
                    return;
                }

                if (character === "\u007f" || character === "\b") {
                    if (value.length > 0) {
                        value = value.slice(0, -1);
                        stdout.write("\b \b");
                    }
                    continue;
                }

                value += character;
                stdout.write("*");
            }
        };

        stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.on("data", onData);
    });
}
