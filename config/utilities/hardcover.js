import Fetch from "@11ty/eleventy-fetch";
import "dotenv/config";

const API_ENDPOINT = "https://api.hardcover.app/v1/graphql";

/**
 * Caching wrapper around Hardcover's GraphQL API.
 *
 * eleventy-fetch folds the request method and body into its cache key, so POST
 * queries cache just like plain GETs. Reads hit the network once per duration
 * instead of once per build.
 *
 * @param {string} query - The GraphQL query document
 * @param {Object} variables - Query variables
 * @param {string} duration - eleventy-fetch cache duration
 * @returns {Promise<Object>} - The `data` object from the GraphQL response
 */
async function queryHardcover(query, variables, duration) {
	const response = await Fetch(API_ENDPOINT, {
		duration,
		type: "json",
		fetchOptions: {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${process.env.HARDCOVER_TOKEN}`,
			},
			body: JSON.stringify({ query, variables }),
		},
	});

	if (response.errors) {
		throw new Error(
			`Hardcover GraphQL errors: ${JSON.stringify(response.errors, null, 2)}`,
		);
	}

	return response.data;
}

/**
 * Flattens a Hardcover user_books entry into the shape the templates expect.
 * `dateRead` and `rating` are only present on queries that ask for them.
 */
function mapBook(item) {
	return {
		title: item.book.title,
		author: item.book.contributions.map((c) => c.author.name).join(", "),
		image: item.book.image.url,
		link: `https://hardcover.app/books/${item.book.slug}`,
		dateRead: item.last_read_date,
		rating: item.rating,
	};
}

/**
 * Fetches a list of books for the current user and maps it for templates.
 * Returns an empty array on failure so a bad API day can't fail the build.
 *
 * @param {string} query - The GraphQL query document
 * @param {Object} options
 * @param {string} options.duration - eleventy-fetch cache duration
 * @returns {Promise<Array>} - Mapped books, or [] if the request failed
 */
export async function getBooks(query, { duration }) {
	try {
		const data = await queryHardcover(
			query,
			{ userId: process.env.HARDCOVER_USER_ID },
			duration,
		);
		return (data.user_books || []).map(mapBook);
	} catch (error) {
		console.error("Error fetching Hardcover data:", error.message);
		return [];
	}
}

export default { getBooks };
