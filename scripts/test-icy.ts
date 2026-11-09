// test-icy.ts
/**
* Usage:
*   npx tsx scripts/text-icy.ts <stream-url>
*/
import { startIcyReader } from "../src/services/metadata/icy-reader";

const url = process.argv[2];

if (!url) {
    throw new Error("Usage: npx tsx scripts/test-icy.ts <stream-url>");
}

const controller = new AbortController();

const timeout = setTimeout(() => {
    console.log("\nTest timeout");
    controller.abort();
}, 45000);

console.log(`Connecting to: ${url}\n`);

try {
    await startIcyReader(
        url,
        (title: string) => {
            console.log(`\nTITLE: ${title}\n`);
        },
        controller.signal
    );
} finally {
    clearTimeout(timeout);
} 
