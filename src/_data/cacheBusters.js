import fs from "fs";
import path from "path";
import crypto from "crypto";

async function fromFile(hashPath) {
  try {
    const fileBuffer = await fs.promises.readFile(path.resolve(hashPath));
    return _getHash(fileBuffer);
  } catch (e) {
    console.error("There was a problem creating file hash.", e);
    // return something useful anyway
    return _getFakeHash();
  }
}

// eslint-disable-next-line no-unused-vars
async function fromString(hashString) {
  try {
    return _getHash(hashString);
  } catch (e) {
    console.error("There was a problem creating string hash.", e);
    // return something useful anyway
    return _getFakeHash();
  }
}

// some random characters
function _getFakeHash(len = 64) {
  return crypto.randomBytes(len).toString("hex");
}

function _getHash(value) {
  const hashSum = crypto.createHash("sha256");
  hashSum.update(value);
  return hashSum.digest("hex");
}

// Generate hashes for assets to use for cache busting
export default async () => {
  return {
    // Generate a hash based on the minified css
    styles: await fromFile("public/assets/css/style.css"),
  };
};
