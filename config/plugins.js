import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginRss from "@11ty/eleventy-plugin-rss";
import lightningCSS from "@11tyrocks/eleventy-plugin-lightningcss";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export const plugins = {
	syntaxHighlight: {
		plugin: syntaxHighlight,
		options: {},
		metadata: {},
	},
	lightningCSS: {
		plugin: lightningCSS,
		options: {},
		metadata: {},
	},
	pluginRss: {
		plugin: pluginRss,
		options: {},
		metadata: {},
	},
	eleventyNavigationPlugin: {
		plugin: eleventyNavigationPlugin,
		options: {},
		metadata: {},
	},
	eleventyImageTransformPlugin: {
		plugin: eleventyImageTransformPlugin,
		options: {},
		metadata: {},
	},
};

export function rssForLiquid(config) {
	config.addLiquidFilter("dateToRfc3339", pluginRss.dateToRfc3339);
	config.addLiquidFilter("dateToRfc822", pluginRss.dateToRfc822);
}
