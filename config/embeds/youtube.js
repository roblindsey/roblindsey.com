const ID_PATTERN = /^[\w-]{11}$/;

// Converts a start time like "90", "90s", or "1m30s" to seconds.
const parseStart = (value) => {
	if (!value) return null;
	if (/^\d+s?$/.test(value)) return parseInt(value, 10);
	const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
	if (!match) return null;
	const [, h = 0, m = 0, s = 0] = match.map((n) => n && Number(n));
	return h * 3600 + m * 60 + s || null;
};

export const youtube = {
	match(url) {
		const host = url.hostname.replace(/^(www|m|music)\./, "");
		const path = url.pathname;
		let id = null;
		let isShort = false;

		if (host === "youtu.be") {
			id = path.slice(1);
		} else if (host === "youtube.com") {
			if (path === "/watch") {
				id = url.searchParams.get("v");
			} else if (path.startsWith("/shorts/")) {
				id = path.split("/")[2];
				isShort = true;
			}
		}

		if (!id || !ID_PATTERN.test(id)) return null;
		return { id, isShort, start: parseStart(url.searchParams.get("t")) };
	},

	render({ id, isShort, start }) {
		const src = `https://www.youtube.com/embed/${id}${start ? `?start=${start}` : ""}`;
		const classes = `embed embed--youtube${isShort ? " embed--youtube-short" : ""}`;
		return `<iframe class="${classes}" src="${src}" title="YouTube video" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
	},
};
