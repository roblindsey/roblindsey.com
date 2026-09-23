import { getBooks } from "../../config/utilities/hardcover.js";

const nowReadingQuery = `
	query nowReading($userId: Int!) {
		user_books(
			distinct_on: date_added
			limit: 20
			where: {
				user_id: { _eq: $userId }
				user_book_status: { status: { _eq: "Currently Reading" } }
			}
			order_by: { date_added: desc_nulls_last }
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
		}
	}
`;

export default async function () {
	return getBooks(nowReadingQuery, { duration: "1d" });
}
