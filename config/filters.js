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
};
