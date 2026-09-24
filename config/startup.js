import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs";
import {
	getFeedItems,
	jamPath,
	legacyJamPath,
	toJam,
} from "./utilities/crucialTracks.js";
import "dotenv/config";

const execAsync = promisify(exec);

export const startup = {
	cleanOutput: async () => {
		try {
			// Determine output path based on environment
			const outputPath =
				process.env.ELEVENTY_ENV === "prod"
					? process.env.PROD_OUTPUT_PATH
					: "public";

			console.log(`Cleaning output directory: ${outputPath}`);

			// If in production, use find to delete only contents
			if (process.env.ELEVENTY_ENV === "prod") {
				// Use find command to delete contents but preserve the directory
				const { stdout, stderr } = await execAsync(
					`find ${outputPath} -mindepth 1 -delete`,
				);

				if (stderr) {
					console.error(`Error: ${stderr}`);
				} else {
					console.log(`Successfully cleaned contents of ${outputPath}`);
					if (stdout) console.log(stdout);
				}
			}
		} catch (error) {
			console.error("Error cleaning output directory:", error);
		}
	},
	checkCrucialTracks: async () => {
		// This writes markdown files as a side effect, so it has no business
		// running on watch/serve rebuilds that fire on every file save.
		// ELEVENTY_RUN_MODE is "build" | "watch" | "serve".
		if (process.env.ELEVENTY_RUN_MODE !== "build") {
			return;
		}
		try {
			// Reconcile the whole feed against what's on disk rather than only
			// checking the newest entry, so nothing is lost if several tracks are
			// posted between builds — or if a build was broken for a while.
			const items = await getFeedItems();
			let added = 0;

			for (const item of items) {
				const jam = await toJam(item);
				if (!jam) {
					continue;
				}

				const { year, slug } = jamPath(jam.date);
				const yearDir = `./src/content/jams/${year}`;
				const filePath = `${yearDir}/${slug}.md`;
				// Older jams used a UTC slug, filed under either year folder.
				const legacy = legacyJamPath(jam.date);
				const candidates = [
					filePath,
					`./src/content/jams/${legacy.year}/${legacy.slug}.md`,
					`${yearDir}/${legacy.slug}.md`,
				];

				// The file existing is the record of "already ingested".
				if (candidates.some((candidate) => fs.existsSync(candidate))) {
					continue;
				}

				const linkLines = Object.entries(jam.links)
					.map(([platform, url]) => `  ${platform}: "${url}"`)
					.join("\n");

				// prettier-ignore
				const jamFileContents = `---
date: ${jam.date.toISOString()}
songTitle: ${JSON.stringify(jam.songTitle)}
artist: ${JSON.stringify(jam.artist)}
imageUrl: "${jam.imageUrl}"
tags: ["crucial"]
links:
${linkLines}
---
${jam.content}
`;

				fs.mkdirSync(yearDir, { recursive: true });
				fs.writeFileSync(filePath, jamFileContents, { flag: "wx" });
				console.log(`Added new Crucial Track: ${filePath}`);
				added += 1;
			}

			if (added === 0) {
				console.log("Crucial Tracks: nothing new in the feed.");
			}
		} catch (error) {
			console.error("Error in checkCrucialTracks:", error.message);
		}
	},
};
