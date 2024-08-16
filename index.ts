import type { BunFile } from "bun";
import { extname } from "node:path";
import { makeMusicRewriter, overlayListRewriter } from "./element";
import { formatTrack, getCurrentTrack } from "./jxa";

const ALLOWED_ASSET_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif"];

console.log("Starting overlayer");

export const server = Bun.serve({
	port: import.meta.env.PORT ?? 40467,
	async fetch(req) {
		const { pathname, searchParams } = new URL(req.url);

		console.log(`-> ${req.method} ${pathname}`);
		switch (pathname) {
			case "/": {
				let templateBase = await Bun.file("templates/overlay_list.html").text();

				const res = new Response(templateBase, {
					headers: { "Content-Type": "text/html" },
				});

				console.log(
					`<- ${pathname} ${res.status} ${res.headers.get("content-type")}`
				);

				return overlayListRewriter.transform(res);
			}
			case "/kill_server": {
				if (req.method === "POST") {
					console.log("Received POST /kill-server");
					process.exit(0);
				}

				break;
			}
			case "/music": {
				const currentTrack = await getCurrentTrack();

				if (
					req.headers.get("accept")?.split(",").includes("application/json")
				) {
					const res = new Response(JSON.stringify(currentTrack), {
						headers: {
							"Content-Type": "application/json",
						},
					});
					console.log(
						`<- ${pathname} ${res.status} ${res.headers.get("content-type")}`
					);
					return res;
				}

				if (req.headers.get("accept")?.split(",").includes("text/plain")) {
					const res = new Response(
						formatTrack(currentTrack, {
							withYear: searchParams.get("year") === "true",
							pauseOverride: searchParams.get("showPaused") === "true",
						}),
						{
							headers: {
								"Content-Type": "text/plain",
							},
						}
					);
					console.log(
						`<- ${pathname} ${res.status} ${res.headers.get("content-type")}`
					);
					return res;
				}

				let file: BunFile;
				let rewriter: HTMLRewriter;

				switch (searchParams.get("style")) {
					case "xp":
						file = Bun.file("templates/music_xp.html");
						rewriter = makeMusicRewriter({ pauseOverride: true });
						break;
					default:
						file = Bun.file("templates/music_clean.html");
						rewriter = makeMusicRewriter();
						break;
				}

				const res = rewriter.transform(
					new Response(await file.text(), {
						headers: {
							"Content-Type": "text/html",
						},
					})
				);
				console.log(
					`<- ${pathname} ${res.status} ${res.headers.get("content-type")}`
				);
				return res;
			}
		}

		if (pathname.startsWith("/assets/"))
			serveAsset: {
				console.log(`-> Asset requested, ${pathname}`);
				const filePath = pathname.split("/").slice(1).join("/");

				console.log(`-> Asset searching, ${filePath}`);

				const file = await Bun.file(filePath);
				if (!file.exists()) {
					console.log(`-> Asset not found, ${filePath}`);
					break serveAsset;
				}
				if (!ALLOWED_ASSET_EXTENSIONS.includes(extname(filePath))) {
					console.log(`-> Asset type not allowed, ${extname(filePath)}`);
					break serveAsset;
				}

				return new Response(file);
			}

		return new Response("Incorrect overlay path (404)", { status: 404 });
	},
});

console.log(`Overlayer: Running at ${server.url}`);
