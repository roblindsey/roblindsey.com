import { plugins } from "./config/plugins.js";
import { filters } from "./config/filters.js";
import { collections } from "./config/collections.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import "dotenv/config";

const execAsync = promisify(exec);

export default async function (eleventyConfig) {
	eleventyConfig.on("eleventy.before", async () => {
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
	});

	// Passthrough
	eleventyConfig.addPassthroughCopy("src/assets/fonts");
	eleventyConfig.addPassthroughCopy("src/assets/images");
	eleventyConfig.addPassthroughCopy("src/assets/js");

	// Plugins
	Object.keys(plugins).forEach((name) => {
		eleventyConfig.addPlugin(
			plugins[name].plugin,
			plugins[name].options,
			plugins[name].metadata,
		);
	});

	// Add filters
	Object.keys(filters).forEach((filterName) => {
		eleventyConfig.addFilter(filterName, filters[filterName]);
	});

	// Add collections
	Object.keys(collections).forEach((collectionName) => {
		eleventyConfig.addCollection(collectionName, collections[collectionName]);
	});
}

const outputPath =
	process.env.ELEVENTY_ENV === "prod" ? process.env.PROD_OUTPUT_PATH : "public";

export const config = {
	dir: {
		input: "src",
		output: outputPath,
		layouts: "layouts",
	},
	passthroughFileCopy: true,
};
