import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "fs";
import {
	getSongInfo,
	getAppleMusicUrl,
	extractMusicLinks,
} from "./utilities/songData.js";
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
		try {
			const feedUrl = "https://app.crucialtracks.org/profile/robble/feed";
			const appleMusicUrl = await getAppleMusicUrl(feedUrl);
			const songData = await getSongInfo(appleMusicUrl.url, extractMusicLinks);
			const jamContent = appleMusicUrl.content;
			const postDate = new Date(appleMusicUrl.pubDate);
			const postDateIso = postDate.toISOString();
			const slugDay = postDateIso.split("T")[0];
			const slugTime = postDateIso
				.split("T")[1]
				.slice(0, 8)
				.replaceAll(":", "-");
			const slug = `${slugDay}-${slugTime}`.replaceAll("-", "");
			const year = postDate.getFullYear();

			// prettier-ignore
			const jamFileContents = `---
date: ${postDateIso}
songTitle: "${songData.title}"
artist: "${songData.artist}"
imageUrl: "${songData.imageUrl}"
tags: ["crucial"]
links:
  spotify: "${songData.links.spotify}"
  appleMusic: "${songData.links.appleMusic}"
  amazon: "${songData.links.amazon}"
  youtubeMusic: "${songData.links.youtubeMusic}"
  tidal: "${songData.links.tidal}"
  soundcloud: "${songData.links.soundcloud}"
---
${jamContent}
		`;

			const jamsDir = "./src/content/jams";
			const yearDir = `${jamsDir}/${year}`;
			if (!fs.existsSync(yearDir)) {
				fs.mkdirSync(yearDir, { recursive: true });
			}

			const filePath = `${yearDir}/${slug}.md`;
			try {
				fs.writeFileSync(filePath, jamFileContents, { flag: "wx" });
				console.log(`Added new Crucial Track: ${filePath}`);
			} catch (fileError) {
				if (fileError.code === "EEXIST") {
					console.log(`File already exists: ${filePath}`);
				} else {
					throw fileError;
				}
			}
		} catch (error) {
			console.error("Error in checkCrucialTracks:", error);
		}
	},
};
