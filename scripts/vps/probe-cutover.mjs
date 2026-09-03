// Bounded low-rate read-only availability sampling around a planned cutover.
import fs from "node:fs";
const output = process.argv[2];
if (!output) throw new Error("Explicit output path required");
const stream = fs.createWriteStream(output, { flags: "wx", mode: 0o600 });
for (let i = 0; i < 180; i++) {
  const start = Date.now();
  try {
    const response = await fetch(`https://thiepmungonline.com/api/auth/session?migration_probe=${start}`, { signal: AbortSignal.timeout(5000) });
    await response.arrayBuffer();
    stream.write(JSON.stringify({ at: new Date(start).toISOString(), status: response.status, ms: Date.now() - start }) + "\n");
  } catch (error) {
    stream.write(JSON.stringify({ at: new Date(start).toISOString(), status: 0, ms: Date.now() - start, error: error.name }) + "\n");
  }
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 1000 - (Date.now() - start))));
}
stream.end();
