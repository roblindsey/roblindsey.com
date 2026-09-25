import dayjs from "dayjs";
import { embedMedia } from "./embeds/index.js";

/**
 * Converts a 978 ISBN-13 to ISBN-10. Returns null for 979 ISBNs,
 * which have no ISBN-10.
 */
function isbn13to10(isbn13) {
	if (!isbn13.startsWith("978")) return null;

	const digits = isbn13.substring(3, 12);
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += (10 - i) * parseInt(digits.charAt(i));
	}
	const checkDigit = (11 - (sum % 11)) % 11;

	return digits + (checkDigit === 10 ? "X" : checkDigit.toString());
}

export const filters = {
	dateForBookshelf: (date) => {
		const bookDate = new Date(date);
		return dayjs(bookDate).format("M.D.YYYY").toString();
	},
	ratingToStars: (num) => {
		let stars = "";
		for (let i = 0; i < num; i++) {
			stars += "★";
		}
		return stars;
	},
	postDate: (date) => {
		const postDate = new Date(date);
		return dayjs(postDate).format("MMMM D, YYYY").toString();
	},
	addTagsToBodyClass: (bodyClasses, item) => {
		if (item && item.data && item.data.tags) {
			item.data.tags.forEach((tag) => {
				bodyClasses.push(`${tag}-collection`); // Or use a prefix like 'tag-' + tag
			});
		}
		return bodyClasses;
	},
	/**
	 * Builds retailer links for a book review. Any URL in bookMeta.links
	 * (bookshop, bn, kobo, amazon) overrides the generated one.
	 */
	bookLinks: (bookMeta = {}) => {
		const isbn13 = String(bookMeta.isbn13 ?? "").replace(/[-\s]/g, "");
		const overrides = bookMeta.links ?? {};
		const generated = {};

		if (/^97[89]\d{10}$/.test(isbn13)) {
			const isbn10 = isbn13to10(isbn13);
			const search = encodeURIComponent(
				[bookMeta.title, bookMeta.author].filter(Boolean).join(" "),
			);

			generated.bookshop = `https://bookshop.org/a/113197/${isbn13}`;
			generated.bn = `https://www.barnesandnoble.com/s/${isbn13}`;
			generated.kobo = `https://www.kobo.com/us/en/search?query=${search}&fclanguages=en`;
			// 979 ISBNs have no ISBN-10, so Amazon gets a search link instead.
			generated.amazon = isbn10
				? `https://www.amazon.com/dp/${isbn10}?tag=onethingnew-20`
				: `https://www.amazon.com/s?k=${isbn13}&i=stripbooks&tag=onethingnew-20`;
		}

		return { ...generated, ...overrides };
	},
	jamsByTag: (jams, tag) => {
		if (!tag) return jams;
		return jams.filter(
			(item) => item.data.tags && item.data.tags.includes(tag),
		);
	},
	getOgImage: (url) => {
		const encodedUrl = encodeURIComponent(
			`https://roblindsey.com/opengraph${url}`,
		);
		return `https://v1.screenshot.11ty.dev/${encodedUrl}/opengraph/`;
	},
	embedMedia,
};
