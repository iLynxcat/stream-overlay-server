import { serverApp } from "./app";

console.log("Starting up overlay server...");

export const server = Bun.serve({
	port: import.meta.env.PORT ?? 40467,
	fetch: serverApp.fetch,
});

console.log(`Listening at ${server.url}`);
