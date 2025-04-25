import fs from "fs";
import path from "path";
import crypto from "crypto";
import "dotenv/config";

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
  // const rootPath =
  //   process.env.ELEVENTY_ENV === "prod"
  //     ? process.env.PROD_OUTPUT_PATH
  //     : "./public";

  const dateHashString = new Date(Date.now()).toString();

  return {
    // Generate a hash based on the minified css
    // stylesFromFile: await fromFile(`${rootPath}/assets/css/style.css`),
    stylesFromDate: await fromString(dateHashString),
  };
};
