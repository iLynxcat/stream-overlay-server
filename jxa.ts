import { run as runJxa } from "@jxa/run";

declare function Application(applicationName: "Music"): {
	running(): boolean;
	playerState(): string;
	currentTrack(): {
		properties(): {
			title: string;
			artist?: string;
			year?: number;
			[key: string]: any;
		};
		year(): number;
		releaseDate(): string;
		name(): string;
		artist(): string;
	};
};

type CurrentTrackResponse = {
	title: string;
	artist?: string;
	year?: number;
	paused: boolean;
};

export async function getCurrentTrack(): Promise<CurrentTrackResponse | null> {
	// Using native macOS JavaScript for Automation (JXA), we
	// ask the Music app for its current track then return it.
	return await runJxa<CurrentTrackResponse | null>((format) => {
		const musicApp = Application("Music");

		if (!musicApp.running()) {
			return null;
		}

		let title, artist, year, paused;

		try {
			let currentTrack = musicApp.currentTrack().properties();

			title = currentTrack.name;
			artist = currentTrack.artist;
			year = currentTrack.year;
			paused = musicApp.playerState() === "paused";
		} catch (err) {
			// If there's no current track or there's an error retrieving it,
			// fall back to "Nothing is playing"
			return null;
		}

		return { title, artist, year, paused };
	});
}

export function formatTrack(
	details: CurrentTrackResponse | null,
	options?: { withYear?: boolean; pauseOverride?: boolean }
) {
	if (!details) {
		return `Nothing is playing`;
	}

	const withYear = options?.withYear ?? false;
	const pauseOverride = options?.pauseOverride ?? false;
	const { title, artist, year, paused } = details;

	return pauseOverride && paused
		? "Paused"
		: `${artist ? `${artist} – ` : ""}${title}${
				withYear && year ? ` (${year})` : ""
		  }`;
}
