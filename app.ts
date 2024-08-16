import { Hono } from "hono";
import { logger } from "hono/logger";
import { makeMusicRewriter, overlayListRewriter } from "./element";
import { formatTrack, getCurrentTrack } from "./jxa";
import { accepts } from "hono/accepts";
import type { BunFile } from "bun";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";

const app = new Hono();

app.use(logger());
app.use(cors());

app.get("/", async (c) => {
	let listTemplate = await Bun.file("templates/overlay_list.html").text();
	return overlayListRewriter.transform(c.html(listTemplate));
});

app.post("/kill_server", (c) => {
	process.exit(0);
});

app.get("/music", async (c) => {
	const currentTrackData = await getCurrentTrack();
	const mime = accepts(c, {
		header: "Accept",
		supports: ["application/json", "text/plain", "text/html"],
		default: "text/html",
	});

	switch (mime) {
		case "application/json":
			return c.json(currentTrackData);
		case "text/plain": {
			return c.text(
				formatTrack(currentTrackData, {
					withYear: c.req.query("year") === "true",
					pauseOverride: c.req.query("showPaused") === "true",
				})
			);
		}
		case "text/html": {
			let templateFile: BunFile;
			let rewriter: HTMLRewriter;

			switch (c.req.query("style")) {
				case "xp":
					templateFile = Bun.file("templates/music_xp.html");
					rewriter = makeMusicRewriter({
						pauseOverride: true,
					});
					break;
				case "basic":
					templateFile = Bun.file("templates/music_basic.html");
					rewriter = makeMusicRewriter();
					break;
				default:
					return c.notFound();
			}

			return rewriter.transform(c.html(await templateFile.text()));
		}
	}
});

app.use(
	"/assets/*",
	serveStatic({
		root: "./",
	})
);

app.notFound((c) => c.text("Invalid route"));

export { app as serverApp };
