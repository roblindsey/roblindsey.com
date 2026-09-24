import Fetch from "@11ty/eleventy-fetch";
import { cacheDuration } from "../utilities/cacheDuration.js";

const USER_AGENT = "Mozilla/5.0 (compatible; roblindsey.com link preview)";
const TIMEOUT_MS = 8000;
const DESCRIPTION_LIMIT = 200;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decodeEntities = (text) =>
	text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, code) => {
		if (code[0] === "#") {
			const num =
				code[1].toLowerCase() === "x"
					? parseInt(code.slice(2), 16)
					: parseInt(code.slice(1), 10);
			return String.fromCodePoint(num);
		}
		return ENTITIES[code.toLowerCase()] ?? entity;
	});

const escapeHtml = (text) =>
	text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

const truncate = (text, limit) =>
	text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;

// Collects <meta> tags from the page head, keyed by their property or name.
const parseMeta = (html) => {
	const head = html.split(/<\/head>/i)[0];
	const meta = {};
	for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
		const attrs = {};
		for (const [, name, , dq, sq, bare] of tag.matchAll(
			/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g,
		)) {
			attrs[name.toLowerCase()] = dq ?? sq ?? bare;
		}
		const key = (attrs.property || attrs.name || "").toLowerCase();
		if (key && attrs.content && !(key in meta)) {
			meta[key] = decodeEntities(attrs.content).trim();
		}
	}
	const title = head.match(/<title[^>]*>([^<]*)<\/title>/i);
	if (title) meta["<title>"] = decodeEntities(title[1]).trim();
	return meta;
};

const fetchPreview = async (url) => {
	const response = await fetch(url, {
		headers: { "user-agent": USER_AGENT, accept: "text/html" },
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	if (!response.ok) throw new Error(`${response.status} for ${url}`);

	const meta = parseMeta(await response.text());
	const title = meta["og:title"] || meta["twitter:title"] || meta["<title>"];
	if (!title) throw new Error(`No title for ${url}`);

	const image = meta["og:image"] || meta["twitter:image"];
	return {
		title,
		description:
			meta["og:description"] ||
			meta["twitter:description"] ||
			meta.description ||
			"",
		image: image ? new URL(image, response.url).href : "",
		site: meta["og:site_name"] || new URL(response.url).hostname.replace(/^www\./, ""),
	};
};

// One lookup per URL per build, shared by every template that renders the note.
const previews = new Map();
const warned = new Set();

const getPreview = (url) => {
	if (!previews.has(url)) {
		// Only successful previews are cached, so failures retry on the next build.
		previews.set(
			url,
			Fetch(() => fetchPreview(url), {
				requestId: `link-card:${url}`,
				type: "json",
				duration: cacheDuration("30d", "*"),
			}),
		);
	}
	return previews.get(url);
};

// Fallback provider: any bare URL no other provider claimed.
export const linkCard = {
	match(url) {
		return { url: url.href };
	},

	async render({ url }) {
		let preview;
		try {
			preview = await getPreview(url);
		} catch (error) {
			if (!warned.has(url)) console.warn(`[link-card] ${error.message}`);
			warned.add(url);
			return `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
		}

		const { title, description, image, site } = preview;
		return `<a class="link-card" href="${escapeHtml(url)}">${
			image
				? `<img class="link-card__image" src="${escapeHtml(image)}" alt="" loading="lazy">`
				: ""
		}<span class="link-card__body"><span class="link-card__site">${escapeHtml(site)}</span><span class="link-card__title">${escapeHtml(title)}</span>${
			description
				? `<span class="link-card__description">${escapeHtml(truncate(description, DESCRIPTION_LIMIT))}</span>`
				: ""
		}</span></a>`;
	},
};
