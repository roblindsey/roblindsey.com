import { input } from "@inquirer/prompts";
import fs from "fs";

function slugify(string) {
	return string
		.toLowerCase()
		.replace(/[^\w\s]/gi, "")
		.split(" ")
		.join("-");
}

export default async (siteRoot) => {
	const title = await input({ message: "Post title" });
	const slug = await input({ message: "Post slug", default: slugify(title) });
	const now = new Date();
	const timestamp = Math.floor(now / 1000);
	const postDate = now.toISOString();
	const slugDay = postDate.split("T")[0];
	const year = now.getFullYear();

	// prettier-ignore
	const postFileContents = `---
title: "${title}"
date: ${postDate}
permalink: /posts/${slug}/index.html
description: ""
excerpt: ""
timestamp: ${timestamp}
featuredImage:
    src:
    credit:
    url:
    alt:
---`;

	if (!fs.existsSync(`${siteRoot}/src/content/posts/${year}`)) {
		fs.mkdirSync(`${siteRoot}/src/content/posts/${year}`);
	}

	fs.writeFileSync(
		`${siteRoot}/src/content/posts/${year}/${slugDay}-${slug}.md`,
		postFileContents,
		{
			flag: "wx",
		},
	);
};
