import { defineConfig } from "vite";
import fs from "node:fs";

export default defineConfig(({ command }) => ({
    base: command === "build" ? "/radio-player/" : "/",

    server: command === "serve"
        ? {
            host: true,
            https: {
                key: fs.readFileSync("certs/tmp-key.pem"),
                cert: fs.readFileSync("certs/tmp.pem"),
            },
        }
        : undefined
}));
