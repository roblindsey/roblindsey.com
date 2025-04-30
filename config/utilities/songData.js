import axios from "axios";
import { JSDOM } from "jsdom";

/**
 * Extracts music links and metadata from song.link API response data
 * @param {Object} songLinkData - The raw response data from song.link API
 * @returns {Object} - Formatted object with song metadata and platform links
 */
export function extractMusicLinks(songLinkData) {
	console.log(`SONGLINK DATA: ${songLinkData}`);
	// Initialize the result object
	const result = {
		title: "",
		artist: "",
		spotifyImageUrl: "",
		links: {
			spotify: "",
			appleMusic: "",
			amazon: "",
			youtubeMusic: "",
			tidal: "",
			soundcloud: "",
		},
	};

	const primaryEntityId = songLinkData.entityUniqueId;
	const primaryEntity = songLinkData.entitiesByUniqueId[primaryEntityId];

	if (primaryEntity) {
		result.title = primaryEntity.title;
		result.artist = primaryEntity.artistName;
		result.imageUrl = primaryEntity.thumbnailUrl;
	}
	// Extract links for each platform
	const linksByPlatform = songLinkData.linksByPlatform;

	// Spotify link
	if (linksByPlatform.spotify) {
		result.links.spotify = linksByPlatform.spotify.url;
	}
	// Apple Music link
	if (linksByPlatform.appleMusic) {
		result.links.appleMusic = linksByPlatform.appleMusic.url;
	}
	// Amazon Music link
	if (linksByPlatform.amazonMusic) {
		result.links.amazon = linksByPlatform.amazonMusic.url;
	}
	// YouTube Music link
	if (linksByPlatform.youtubeMusic) {
		result.links.youtubeMusic = linksByPlatform.youtubeMusic.url;
	}
	// Tidal link
	if (linksByPlatform.tidal) {
		result.links.tidal = linksByPlatform.tidal.url;
	}
	// Soundcloud link
	if (linksByPlatform.soundcloud) {
		result.links.soundcloud = linksByPlatform.soundcloud.url;
	}
	return result;
}

/**
 * Fetches song information from a song.link URL
 * @param {string} songLink - The song.link URL to fetch data from
 * @returns {Promise<Object>} - Promise resolving to formatted song metadata and links
 */
export async function getSongInfo(songUrl, extractFunction) {
	const songLink = `https://api.song.link/v1-alpha.1/links?url=${songUrl}`;
	const response = await axios.get(songLink);
	const songData = extractFunction(response.data);
	return songData;
}

export async function getAppleMusicUrl(feedUrl) {
	const response = await axios.get(feedUrl);
	const rssFeed = response.data;

	const feedDom = new JSDOM(rssFeed, { contentType: "text/xml" });
	const xmlDoc = feedDom.window.document;
	const latestItem = xmlDoc.querySelector("item");
	if (!latestItem) {
		return null;
	}
	const pubDateElement = latestItem.querySelector("pubDate");
	const pubDate = pubDateElement ? new Date(pubDateElement.textContent) : null;
	const description = latestItem.querySelector("description");
	if (!description || !description.textContent) {
		return {
			content: [],
			appleMusicUrl: null,
			pubDate,
		};
	}
	const contentDom = new JSDOM(description.textContent);
	const contentDoc = contentDom.window.document;
	const allParagraphs = contentDoc.querySelectorAll("p");
	const textContent = [];
	for (let i = 3; i < allParagraphs.length - 1; i++) {
		textContent.push(allParagraphs[i].textContent);
	}
	const content = textContent.join("\n\n");
	const appleMusicLink = contentDoc.querySelector('a[href*="music.apple.com"]');
	const url = appleMusicLink ? appleMusicLink.getAttribute("href") : null;
	//console.log(`APPLE MUSIC URL! ${url}`);
	return { content, url, pubDate };
}

// Default export with both functions
export default {
	extractMusicLinks,
	getSongInfo,
	getAppleMusicUrl,
};
