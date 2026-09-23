/**
 * Picks an eleventy-fetch cache duration based on how Eleventy was invoked.
 *
 * ELEVENTY_RUN_MODE is "build" for a one-shot build and "watch"/"serve" while
 * developing. Real builds want data fresh; dev rebuilds fire on every file save,
 * so they should stay on a warm cache rather than re-hitting an API all day.
 *
 * @param {string} build - Duration to use for `ELEVENTY_RUN_MODE=build`
 * @param {string} dev - Duration to use while watching or serving
 * @returns {string} - An eleventy-fetch duration string
 */
export function cacheDuration(build, dev) {
	return process.env.ELEVENTY_RUN_MODE === "build" ? build : dev;
}

export default { cacheDuration };
