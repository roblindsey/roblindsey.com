import Fetch from "@11ty/eleventy-fetch";

export const FEED_URL =
	"https://www.crucialtracks.org/profile/robble/feed.json";

/**
 * Fetches the Crucial Tracks JSON Feed.
 *
 * The JSON feed carries a `_song_details` extension with artist, song,
 * commentary, artwork and (when the track exists on Apple Music) play links,
 * so nothing has to be scraped out of the rendered HTML.
 *
 * @param {string} feedUrl
 * @param {string} duration - eleventy-fetch cache duration
 * @returns {Promise<Array>} - Feed items, newest first
 */
export async function getFeedItems(feedUrl = FEED_URL, duration = "30m") {
	const feed = await Fetch(feedUrl, { duration, type: "json" });
	return feed?.items || [];
}

/**
 * Resolves a Bandcamp embed URL to its canonical track page.
 *
 * Crucial Tracks embeds a player when a manually-added track isn't on Apple
 * Music. The embed markup carries the real track URL in an entity-encoded JSON
 * blob, so this reads it back out. Best-effort: returns null rather than
 * throwing, since a missing play link shouldn't stop a jam being created.
 *
 * @param {string} embedUrl - The iframe src from the feed item
 * @param {string} duration - eleventy-fetch cache duration
 * @returns {Promise<string|null>} - Canonical Bandcamp track URL, or null
 */
export async function resolveBandcampUrl(embedUrl, duration = "1y") {
	try {
		const html = await Fetch(embedUrl, {
			duration,
			type: "text",
			fetchOptions: { headers: { "user-agent": "Mozilla/5.0" } },
		});
		const match = html
			.replaceAll("&quot;", '"')
			.match(/"(?:linkback|title_link)":"(https:\/\/[^"]+)"/);
		return match ? match[1] : null;
	} catch (error) {
		console.warn(
			`Could not resolve Bandcamp embed ${embedUrl}:`,
			error.message,
		);
		return null;
	}
}

/**
 * Pulls the first Bandcamp embed src out of a feed item's content HTML.
 * @param {string} contentHtml
 * @returns {string|null}
 */
export function findBandcampEmbed(contentHtml = "") {
	const match = contentHtml.match(
		/<iframe[^>]+src="(https:\/\/bandcamp\.com\/EmbeddedPlayer\/[^"]*)"/,
	);
	return match ? match[1] : null;
}

/**
 * Builds the jam filename slug from a publish date: 2026-02-27T20:23:48Z
 * becomes 20260227202348, matching the existing jam files.
 * @param {Date} date
 * @returns {string}
 */
export function jamSlug(date) {
	const iso = date.toISOString();
	const day = iso.split("T")[0];
	const time = iso.split("T")[1].slice(0, 8);
	return `${day}${time}`.replaceAll("-", "").replaceAll(":", "");
}

/**
 * Normalizes a feed item into the fields a jam file needs.
 *
 * Play links are deliberately just Apple Music and the Songlink page: both come
 * straight from the feed, so no third-party API has to resolve anything. A
 * Bandcamp-only track gets its own link instead.
 *
 * @param {Object} item - A JSON Feed item
 * @returns {Promise<Object|null>} - Jam fields, or null if unusable
 */
export async function toJam(item) {
	const details = item?._song_details;
	if (!details?.song || !details?.artist) {
		return null;
	}

	const links = {};
	if (details.apple_music_url) {
		links.appleMusic = details.apple_music_url;
	}
	if (details.songlink_url) {
		links.songlink = details.songlink_url;
	}

	// No Apple Music match means this was added by hand; look for an embed.
	if (!links.appleMusic) {
		const embed = findBandcampEmbed(item.content_html);
		if (embed) {
			const bandcampUrl = await resolveBandcampUrl(embed);
			if (bandcampUrl) {
				links.bandcamp = bandcampUrl;
			}
		}
	}

	return {
		date: new Date(item.date_published),
		songTitle: details.song,
		artist: details.artist,
		imageUrl: details.artwork_url || "",
		content: (details.content || "").trim(),
		links,
	};
}

export default {
	FEED_URL,
	getFeedItems,
	resolveBandcampUrl,
	findBandcampEmbed,
	jamSlug,
	toJam,
};
