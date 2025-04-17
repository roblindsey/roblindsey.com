// eslint-disable-next-line no-unused-vars
import dotenv from "dotenv/config";
import { gql, request } from "graphql-request";

export default async function () {
	const apiEndpoint = "https://api.hardcover.app/v1/graphql";
	const allBooksQuery = gql`
		query last20Read($userId: Int!) {
			user_books(
				distinct_on: last_read_date
				limit: 20
				where: {
					user_id: { _eq: $userId }
					user_book_status: { status: { _eq: "Read" } }
				}
				order_by: { last_read_date: desc_nulls_last }
			) {
				user_book_status {
					id
				}
				book {
					title
					contributions {
						author {
							name
						}
					}
					image {
						url
					}
					slug
				}
				last_read_date
				rating
			}
		}
	`;
	const queryVariables = {
		userId: process.env.HARDCOVER_USER_ID,
	};
	const requestHeaders = {
		authorization: `Bearer ${process.env.HARDCOVER_TOKEN}`,
	};

	try {
		const data = await request({
			url: apiEndpoint,
			document: allBooksQuery,
			variables: queryVariables,
			requestHeaders: requestHeaders,
		});
		console.log("Data fetched successfully");

		const mappedBooks = data.user_books.map((item) => {
			const mappedBook = {};
			mappedBook.title = item.book.title;
			mappedBook.author = item.book.contributions
				.map((item) => item.author.name)
				.join(", ");
			mappedBook.image = item.book.image.url;
			mappedBook.link = `https://hardcover.app/books/${item.book.slug}`;
			mappedBook.dateRead = item.last_read_date;
			mappedBook.rating = item.rating;
			return mappedBook;
		});

		return mappedBooks || [];
	} catch (error) {
		if (error.response?.errors) {
			console.error(
				"GraphQL errors:",
				JSON.stringify(error.response.errors, null, 2),
			);
		} else {
			console.error("Error:", error);
		}
		return [];
	}
}
