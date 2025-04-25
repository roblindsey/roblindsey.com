import { plugins } from "./config/plugins.js";
import { filters } from "./config/filters.js";
import { collections } from "./config/collections.js";
import { deleteSync } from "del";
import "dotenv/config";

export default async function (eleventyConfig) {
	const outputPath =
		process.env.ELEVENTY_ENV === "prod"
			? process.env.PROD_OUTPUT_PATH
			: "public";

	if (process.env.ELEVENTY_ENV === "prod") {
		const delPath = deleteSync(outputPath);
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
