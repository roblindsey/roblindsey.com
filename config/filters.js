import dayjs from "dayjs";

export const filters = {
	dateForPath: (date) => {
		const postDate = new Date(date);
		return dayjs(postDate).format("YYYY-MM-DD").toString();
	},
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
	theYear: (date) => {
		return new Date(date).getFullYear().toString();
	},
	noteSlug: (date) => {
		const noteDate = new Date(date).toISOString();
		const slugDay = noteDate.split("T")[0];
		const slugTime = noteDate.split("T")[1].slice(0, 8).replaceAll(":", "-");
		const slug = `${slugDay}-${slugTime}`.replaceAll("-", "");
		return slug;
	},
	addTagsToBodyClass: (bodyClasses, item) => {
		if (item && item.data && item.data.tags) {
			item.data.tags.forEach((tag) => {
				bodyClasses.push(`${tag}-collection`); // Or use a prefix like 'tag-' + tag
			});
		}
		return bodyClasses;
	},
	isbn13to10: (isbn13) => {
		const normalized = isbn13.toString().replace(/[-\s]/g, "");

		if (normalized.startsWith("978")) {
			// Remove '978' prefix and the existing check digit
			const digits = normalized.substring(3, 12);

			// Calculate the check digit for ISBN-10
			let sum = 0;
			for (let i = 0; i < 9; i++) {
				sum += (10 - i) * parseInt(digits.charAt(i));
			}

			// Determine the check digit (X is used if the result is 10)
			let checkDigit = (11 - (sum % 11)) % 11;
			checkDigit = checkDigit === 10 ? "X" : checkDigit.toString();

			return digits + checkDigit;
		}
		return isbn13;
	},
	slugifyBookTitle: (title) => {
		return title
			.toLowerCase() // Convert to lowercase
			.replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
			.replace(/\s+/g, "-") // Replace spaces with hyphens
			.replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
			.trim() // Remove whitespace from both ends
			.replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
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
};
