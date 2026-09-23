import { getBooks } from "../../config/utilities/hardcover.js";

const last20ReadQuery = `
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

export default async function () {
	return getBooks(last20ReadQuery, { duration: "1d" });
}
