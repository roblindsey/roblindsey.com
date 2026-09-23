import Fetch from "@11ty/eleventy-fetch";
import { cacheDuration } from "../../config/utilities/cacheDuration.js";
import "dotenv/config";

// The now-playing page renders five tracks and the footer shows one. Six keeps a
// spare without caching a response full of tracks nothing ever displays.
const TRACK_COUNT = 6;

export default async function () {
	// Last.fm prepends a currently-playing track *in addition to* `limit`, so
	// asking for six still leaves six once that entry is filtered out.
	const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=clubrob&api_key=${process.env.LAST_FM_KEY}&format=json&limit=${TRACK_COUNT}`;

	try {
		const recentTracksData = await Fetch(url, {
			// Fresh on a real build; frozen while developing so saving a file
			// doesn't re-hit Last.fm. On failure eleventy-fetch serves the last
			// good response rather than throwing.
			duration: cacheDuration("5m", "1d"),
			type: "json",
		});

		// Drop the currently-playing track by its flag rather than its position.
		// That entry only exists while something is playing, so slicing blind
		// discarded the most recent real scrobble whenever it wasn't.
		const tracks = (recentTracksData?.recenttracks?.track || [])
			.filter((track) => !track["@attr"]?.nowplaying)
			.slice(0, TRACK_COUNT);

		const processedTracks = tracks.map((track) => {
			const processedTrack = { ...track };

			if (Array.isArray(track.image) && track.image.length > 0) {
				processedTrack.image = track.image.map((img) => {
					if (!img["#text"] || img["#text"].trim() === "") {
						return { ...img, "#text": "" };
					}
					return img;
				});
			} else {
				processedTrack.image = [
					{ "#text": "" },
					{ "#text": "" },
					{ "#text": "" },
				];
			}

			return processedTrack;
		});

		return { recentTracks: processedTracks };
	} catch (error) {
		console.error("Error fetching Last.fm data:", error.message);
		return { recentTracks: [] };
	}
}
