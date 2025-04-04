// center-image.js
import sharp from "sharp";
import path from "path";

/**
 * Generate output filename by appending "-featured" to the input filename
 * @param {string} inputPath - Path to the input image
 * @returns {string} - Generated output path
 */
function generateOutputPath(inputPath) {
	const parsedPath = path.parse(inputPath);
	return path.join(
		parsedPath.dir,
		`${parsedPath.name}-featured${parsedPath.ext}`,
	);
}

/**
 * Centers an image on a wider background with padding and 3:2 aspect ratio
 * @param {string} inputPath - Path to the input image
 * @param {string|null} outputPath - Path for the output image (optional)
 * @param {number|null} outputWidth - Optional width of the output image
 * @param {number} verticalPadding - Padding to add above and below the image
 */
async function centerImage(
	inputPath,
	outputPath = null,
	outputWidth = null,
	verticalPadding = 15,
) {
	try {
		// Generate output path if not provided
		const finalOutputPath = outputPath || generateOutputPath(inputPath);

		// Set fixed background color
		const backgroundColor = "#141519";

		// Get input image metadata
		const inputMetadata = await sharp(inputPath).metadata();

		// Calculate output height based on input height plus padding
		const outputHeight = inputMetadata.height + verticalPadding * 2;

		// If outputWidth is not provided, calculate it to achieve 3:2 aspect ratio
		if (outputWidth === null) {
			// For 3:2 aspect ratio: width = height * (3/2)
			outputWidth = Math.round(outputHeight * (3 / 2));
		}

		// Calculate positioning to center the image
		const left = Math.floor((outputWidth - inputMetadata.width) / 2);
		const top = verticalPadding; // Place it with exactly the padding amount from top

		// Create a blank canvas with the background color
		await sharp({
			create: {
				width: outputWidth,
				height: outputHeight,
				channels: 4,
				background: backgroundColor,
			},
		})
			.composite([
				{
					input: inputPath,
					left: left,
					top: top,
				},
			])
			.toFile(finalOutputPath);

		console.log(
			`Successfully created centered image with background color: ${backgroundColor}`,
		);
		console.log(`Output saved to: ${finalOutputPath}`);
		console.log(
			`Output dimensions: ${outputWidth}x${outputHeight} (aspect ratio: ${(outputWidth / outputHeight).toFixed(2)})`,
		);
	} catch (error) {
		console.error("Error processing image:", error);
	}
}

// Process command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
	console.log(`
Usage: node center-image.js <inputPath> [outputPath] [outputWidth] [verticalPadding]
  - inputPath: Path to the book cover image
  - outputPath: (Optional) Path for the output image (default: inputName-featured.ext)
  - outputWidth: (Optional) Width of the output image in pixels (defaults to 3:2 aspect ratio)
  - verticalPadding: (Optional) Padding above and below in pixels (default: 15)

Example: node center-image.js ./book-cover.jpg ./cover-featured.jpg 800 15
  `);
	process.exit(1);
}

const [inputPath, outputPath = null, customWidth, verticalPadding = "15"] =
	args;

// Execute the function with optional parameters
centerImage(
	inputPath,
	outputPath,
	customWidth ? parseInt(customWidth, 10) : null,
	parseInt(verticalPadding, 10),
);
