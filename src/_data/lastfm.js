// eslint-disable-next-line no-unused-vars
import "dotenv/config";
import axios from "axios";
import { AssetCache } from "@11ty/eleventy-fetch";

export default async function () {
	const asset = new AssetCache("lastfm");
	if (asset.isCacheValid("3m")) {
		return asset.getCachedValue();
	}

	try {
		console.log("Fetching new Last.fm data...");
		const { data: recentTracksData } = await axios.get(
			`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=clubrob&api_key=${process.env.LAST_FM_KEY}&format=json&limit=10`,
		);

		const tracks = recentTracksData?.recenttracks?.track?.slice(1) || [];

		// Log image URLs for debugging
		// console.log("\n===== LAST.FM IMAGE URLS =====");
		// tracks.forEach((track, index) => {
		// 	console.log(
		// 		`Track ${index + 1}: ${track.name} - ${track.artist["#text"]}`,
		// 	);
		// 	if (track.image && track.image[2]) {
		// 		console.log(`Image URL: ${track.image[2]["#text"]}`);
		// 	} else {
		// 		console.log("No image URL found");
		// 	}
		// 	console.log("-------------------");
		// });

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

		const response = {
			recentTracks: processedTracks,
		};

		asset.save(response, "json");
		return response;
	} catch (error) {
		console.error("Error fetching Last.fm data:", error);

		return { recentTracks: [] };
	}
}
