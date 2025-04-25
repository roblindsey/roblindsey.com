import { plugins } from "./config/plugins.js";
import { filters } from "./config/filters.js";
import { collections } from "./config/collections.js";
import { deleteAsync } from "del";
import "dotenv/config";

export default async function (eleventyConfig) {
	eleventyConfig.on("eleventy.before", async () => {
		try {
			// Determine output path based on environment
			const outputPath =
				process.env.ELEVENTY_ENV === "prod"
					? process.env.PROD_OUTPUT_PATH
					: "public";

			console.log(`Cleaning output directory: ${outputPath}`);

			// If in production, delete the contents rather than the directory itself
			if (process.env.ELEVENTY_ENV === "prod") {
				// Explicitly exclude the directory itself from deletion
				const deletedPaths = await deleteAsync(
					[
						`${outputPath}/**`, // All contents including subdirectories
						`!${outputPath}`, // Exclude the root directory itself
					],
					{ force: true },
				);
				console.log(
					`Deleted ${deletedPaths.length} files/folders from ${outputPath}`,
				);
			}
		} catch (error) {
			console.error("Error cleaning output directory:", error);
		}
	});

	if (process.env.ELEVENTY_ENV === "prod") {
		const delPath = deleteAsync([outputPath], { force: true });
		console.log(delPath);
	}

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
