// eslint-disable-next-line no-unused-vars
import dotenv from "dotenv/config";
import axios from "axios";
import { AssetCache } from "@11ty/eleventy-fetch";

export default async function () {
	const asset = new AssetCache("lastfm");

	if (asset.isCacheValid("3m")) {
		return asset.getCachedValue();
	}

	const { data: recentTracksData } = await axios.get(
		`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=clubrob&api_key=${process.env.LAST_FM_KEY}&format=json&limit=10`,
	);

	const response = {
		recentTracks: recentTracksData?.recenttracks?.track,
	};

	asset.save(response, "json");

	return response;
}
