export const collections = {
	latestPosts: (collectionApi) => {
		let posts = collectionApi
			.getFilteredByGlob("**/posts/*.md")
			.slice(-2)
			.reverse();

		return posts;
	},
	posts: (collectionApi) => {
		let posts = collectionApi
			.getFilteredByGlob("src/content/posts/**/*.md")
			.reverse();

		return posts;
	},
	notes: (collectionApi) => {
		let notes = collectionApi
			.getFilteredByGlob("src/content/notes/**/*.md")
			.reverse();

		return notes;
	},
	jams: (collectionApi) => {
		let jams = collectionApi
			.getFilteredByGlob("src/content/jams/**/*.md")
			.reverse();

		return jams;
	},
	crucialJams: (collectionApi) => {
		let crucialJams = collectionApi
			.getFilteredByGlob("src/content/jams/**/*.md")
			.filter((item) => {
				return item.data.tags && item.data.tags.includes("crucial");
			});
		return crucialJams;
	},
};
