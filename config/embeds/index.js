import { youtube } from "./youtube.js";
import { linkCard } from "./linkCard.js";

// Checked in order; linkCard matches any URL, so it stays last.
const providers = [youtube, linkCard];

// A paragraph whose only content is a URL. Markdown escapes "&" as "&amp;".
const BARE_URL_PARAGRAPH = /<p>\s*(https?:\/\/[^\s<]+)\s*<\/p>/g;

const renderParagraph = async (paragraph, rawUrl) => {
	let url;
	try {
		url = new URL(rawUrl.replaceAll("&amp;", "&"));
	} catch {
		return paragraph;
	}
	for (const provider of providers) {
		const data = provider.match(url);
		if (data) return provider.render(data);
	}
	return paragraph;
};

export const embedMedia = async (content) => {
	if (!content) return content;
	const matches = [...content.matchAll(BARE_URL_PARAGRAPH)];
	const rendered = await Promise.all(
		matches.map(([paragraph, rawUrl]) => renderParagraph(paragraph, rawUrl)),
	);
	let i = 0;
	return content.replace(BARE_URL_PARAGRAPH, () => rendered[i++]);
};
