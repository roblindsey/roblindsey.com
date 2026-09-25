// Crossposts new notes to Mastodon (social.lol). Runs on the VPS after each
// deploy and hourly rebuild. Notes already in the state file are skipped, so
// running it often never posts twice.
//
// Environment:
//   MASTODON_TOKEN     Access token with write:statuses and write:media
//   MASTODON_STATE     JSON file of posted notes; keep it outside the checkout
//                      so the hourly auto-commit does not commit it
//   MASTODON_INSTANCE  Defaults to https://social.lol
//
// Flags:
//   --dry-run  Print each pending status and its images without posting
//   --seed     Mark every current note as posted without posting

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const NOTES_DIR = path.join(SITE_ROOT, "src/content/notes");

const INSTANCE = (
	process.env.MASTODON_INSTANCE || "https://social.lol"
).replace(/\/+$/, "");
const TOKEN = process.env.MASTODON_TOKEN;
const STATE_FILE = process.env.MASTODON_STATE;

const DRY_RUN = process.argv.includes("--dry-run");
const SEED = process.argv.includes("--seed");

// Used only when the instance API does not report its limits.
const DEFAULT_LIMITS = { maxCharacters: 500, maxMedia: 4, urlLength: 23 };

// An image on its own line: ![alt](/assets/images/notes/<year>/<name>.jpg)
const IMAGE_BLOCK = /^!\[(.*)\]\((\S+)\)$/;
const URL_PATTERN = /https?:\/\/\S+/g;

const IMAGE_TYPES = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
};

const MEDIA_POLL_MS = 2000;
const MEDIA_POLL_TRIES = 15;

const log = (message) => console.log(`[mastodon] ${message}`);

/** Note IDs are paths under the notes folder, e.g. "2026/20260925145545.md". */
const listNotes = () =>
	fs
		.readdirSync(NOTES_DIR, { recursive: true })
		.filter((file) => file.endsWith(".md"))
		.map((file) => file.split(path.sep).join("/"))
		// Year folders and timestamp filenames sort oldest first.
		.sort();

const readState = () => {
	if (!STATE_FILE || !fs.existsSync(STATE_FILE)) return { posted: {} };
	return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
};

// Written to a temp file and renamed, so a crash never leaves half a file.
const writeState = (state) => {
	const temp = `${STATE_FILE}.tmp`;
	fs.writeFileSync(temp, `${JSON.stringify(state, null, "\t")}\n`);
	fs.renameSync(temp, STATE_FILE);
};

/**
 * Turns a note file into Mastodon status text and a list of images. Image
 * lines are removed from the text; everything else is posted as written.
 * @param {string} id
 * @returns {{ text: string, images: { alt: string, file: string }[] }}
 */
const parseNote = (id) => {
	const source = fs.readFileSync(path.join(NOTES_DIR, id), "utf8");
	const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
	if (!match) throw new Error("no front matter found");

	const images = [];
	const blocks = [];
	for (const block of match[1].trim().split(/\r?\n\s*\r?\n/)) {
		const image = block.trim().match(IMAGE_BLOCK);
		if (!image) {
			blocks.push(block.trim());
			continue;
		}
		const [, alt, src] = image;
		if (!src.startsWith("/assets/images/notes/")) {
			throw new Error(`image is not in /assets/images/notes/: ${src}`);
		}
		images.push({ alt: alt.trim(), file: path.join(SITE_ROOT, "src", src) });
	}

	return { text: blocks.filter(Boolean).join("\n\n"), images };
};

/** Mastodon counts every URL as a fixed length, whatever its real length. */
const statusLength = (text, urlLength) =>
	[...text.replace(URL_PATTERN, "x".repeat(urlLength))].length;

const checkNote = ({ text, images }, limits) => {
	if (!text && !images.length) throw new Error("note is empty");
	if (images.length > limits.maxMedia) {
		throw new Error(`${images.length} images; the limit is ${limits.maxMedia}`);
	}
	for (const { alt, file } of images) {
		if (!alt) throw new Error(`missing alt text for ${path.basename(file)}`);
		if (!fs.existsSync(file)) throw new Error(`image not found: ${file}`);
		if (!IMAGE_TYPES[path.extname(file).toLowerCase()]) {
			throw new Error(`unsupported image type: ${path.basename(file)}`);
		}
	}
	const length = statusLength(text, limits.urlLength);
	if (length > limits.maxCharacters) {
		throw new Error(
			`${length} characters; the limit is ${limits.maxCharacters}`,
		);
	}
	return length;
};

const api = async (endpoint, options = {}) => {
	const response = await fetch(`${INSTANCE}${endpoint}`, {
		...options,
		headers: { Authorization: `Bearer ${TOKEN}`, ...options.headers },
	});
	const body = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(
			`${options.method || "GET"} ${endpoint} returned ${response.status}: ${body.error || response.statusText}`,
		);
	}
	return { status: response.status, body };
};

const getLimits = async () => {
	try {
		const response = await fetch(`${INSTANCE}/api/v2/instance`);
		if (!response.ok) throw new Error(`returned ${response.status}`);
		const { statuses } = (await response.json()).configuration;
		return {
			maxCharacters: statuses.max_characters,
			maxMedia: statuses.max_media_attachments,
			urlLength: statuses.characters_reserved_per_url,
		};
	} catch (error) {
		log(`Instance limits unavailable (${error.message}); using defaults.`);
		return DEFAULT_LIMITS;
	}
};

// Large uploads return 202 and finish processing later; a status cannot
// attach them until they have a URL.
const uploadImage = async ({ alt, file }) => {
	const form = new FormData();
	const type = IMAGE_TYPES[path.extname(file).toLowerCase()];
	form.append("file", await fs.openAsBlob(file, { type }), path.basename(file));
	form.append("description", alt);

	let { body: media } = await api("/api/v2/media", {
		method: "POST",
		body: form,
	});
	for (let tries = 0; !media.url; tries++) {
		if (tries === MEDIA_POLL_TRIES) {
			throw new Error(`${path.basename(file)} did not finish processing`);
		}
		await new Promise((resolve) => setTimeout(resolve, MEDIA_POLL_MS));
		({ body: media } = await api(`/api/v1/media/${media.id}`));
	}
	return media.id;
};

const postNote = async (id, { text, images }) => {
	const mediaIds = [];
	for (const image of images) mediaIds.push(await uploadImage(image));

	const { body: status } = await api("/api/v1/statuses", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			// If the state file fails to save after a post, the retry returns
			// the same status instead of posting again.
			"Idempotency-Key": `roblindsey.com/notes/${id}`,
		},
		body: JSON.stringify({
			status: text,
			media_ids: mediaIds,
			visibility: "public",
			language: "en",
		}),
	});
	return status;
};

const main = async () => {
	if (!DRY_RUN && !STATE_FILE) throw new Error("MASTODON_STATE is not set.");

	const state = readState();
	const pending = listNotes().filter((id) => !state.posted[id]);

	if (SEED) {
		const postedAt = new Date().toISOString();
		for (const id of pending) state.posted[id] = { seeded: true, postedAt };
		if (DRY_RUN) {
			log(`Would mark ${pending.length} notes as posted.`);
		} else {
			writeState(state);
			log(`Marked ${pending.length} notes as posted.`);
		}
		return 0;
	}

	if (!pending.length) return 0;
	if (!DRY_RUN && !TOKEN) throw new Error("MASTODON_TOKEN is not set.");

	const limits = await getLimits();
	let failures = 0;

	for (const id of pending) {
		try {
			const note = parseNote(id);
			const length = checkNote(note, limits);

			if (DRY_RUN) {
				log(`${id} (${length} characters, ${note.images.length} images)`);
				console.log(note.text.replace(/^/gm, "  | "));
				for (const { alt, file } of note.images) {
					console.log(`  + ${path.relative(SITE_ROOT, file)} alt="${alt}"`);
				}
				continue;
			}

			const status = await postNote(id, note);
			state.posted[id] = {
				id: status.id,
				url: status.url,
				postedAt: new Date().toISOString(),
			};
			writeState(state);
			log(`Posted ${id}: ${status.url}`);
		} catch (error) {
			failures++;
			log(`Skipped ${id}: ${error.message}. It will be retried next run.`);
		}
	}

	return failures ? 1 : 0;
};

main()
	.then((code) => {
		process.exitCode = code;
	})
	.catch((error) => {
		log(error.message);
		process.exitCode = 1;
	});
