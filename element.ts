import { server } from ".";
import { formatTrack, getCurrentTrack } from "./jxa";

export const overlayListRewriter = new HTMLRewriter().on("#overlay-list", {
	async element(element) {
		const overlays = ["music?style=basic", "music?style=xp"];

		element.setInnerContent(
			overlays
				.map(
					(overlay) =>
						`<li><a href="/${overlay}">${overlay
							.split(/[\?&]/)
							.map((t, i) => (i > 0 ? `(${t.replaceAll("=", ": ")})` : t))
							.join(" ")}</a><br /><br /><strong>source url:</strong> <pre>${
							server.url
						}${overlay}</pre></li>`
				)
				.join(""),
			{ html: true }
		);
	},
});

export const makeMusicRewriter = (opts?: { pauseOverride?: boolean }) =>
	new HTMLRewriter()
		.on("#track-info", {
			async element(element) {
				const trackInfo = formatTrack(await getCurrentTrack(), {
					pauseOverride: opts?.pauseOverride,
				});
				element.setInnerContent(trackInfo, {
					html: false,
				});
			},
		})
		.on("#track-info-withyear", {
			async element(element) {
				const trackInfo = formatTrack(await getCurrentTrack(), {
					withYear: true,
					pauseOverride: opts?.pauseOverride,
				});
				element.setInnerContent(trackInfo, {
					html: false,
				});
			},
		});
