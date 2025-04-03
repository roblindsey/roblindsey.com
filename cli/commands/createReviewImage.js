// center-image.js
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const getPixels = require('get-pixels');
const quantize = require('quantize');
const util = require('util');

// Convert getPixels to a promise-based function
const getPixelsPromise = util.promisify(getPixels);

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract an accent color from an image
 * @param {string} imagePath - Path to the image
 * @returns {Promise<string>} - Hex color string
 */
async function extractAccentColor(imagePath) {
  try {
    // Get pixel data from the image
    const pixels = await getPixelsPromise(imagePath);
    const pixelData = pixels.data;
    const colorSamples = [];
    
    // Sample pixels (every 10th pixel to improve performance)
    for (let i = 0; i < pixelData.length; i += 40) {
      // Only use fully opaque pixels
      if (pixelData[i + 3] === 255) {
        colorSamples.push([
          pixelData[i],     // R
          pixelData[i + 1], // G
          pixelData[i + 2]  // B
        ]);
      }
    }
    
    // Use color quantization to find dominant colors
    const colorMap = quantize(colorSamples, 5);
    const palette = colorMap.palette();
    
    // Select the second color from palette (often an accent rather than the most dominant)
    // If there's not enough colors, use the first one
    const selectedColor = palette.length > 1 ? palette[1] : palette[0];
    
    // Convert RGB to hex
    const hexColor = `#${selectedColor.map(c => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
    
    return hexColor;
  } catch (error) {
    console.error('Error extracting color:', error);
    return '#FFFFFF'; // Default to white if extraction fails
  }
}

/**
 * Generate output filename by appending "-featured" to the input filename
 * @param {string} inputPath - Path to the input image
 * @returns {string} - Generated output path
 */
function generateOutputPath(inputPath) {
  const parsedPath = path.parse(inputPath);
  return path.join(parsedPath.dir, `${parsedPath.name}-featured${parsedPath.ext}`);
}

/**
 * Centers an image on a wider background with padding, 3:2 aspect ratio, and extracted background color
 * @param {string} inputPath - Path to the input image
 * @param {string|null} outputPath - Path for the output image (optional)
 * @param {number|null} outputWidth - Optional width of the output image
 * @param {number} verticalPadding - Padding to add above and below the image
 * @param {string|null} bgColor - Optional background color override
 */
async function centerImageWithAccentColor(inputPath, outputPath = null, outputWidth = null, verticalPadding = 15, bgColor = null) {
  try {
    // Generate output path if not provided
    const finalOutputPath = outputPath || generateOutputPath(inputPath);
    
    // Get input image metadata
    const inputMetadata = await sharp(inputPath).metadata();
    
    // Calculate output height based on input height plus padding
    const outputHeight = inputMetadata.height + (verticalPadding * 2);
    
    // If outputWidth is not provided, calculate it to achieve 3:2 aspect ratio
    if (outputWidth === null) {
      // For 3:2 aspect ratio: width = height * (3/2)
      outputWidth = Math.round(outputHeight * (3/2));
    }
    
    // Extract accent color if not manually specified
    const backgroundColor = bgColor || await extractAccentColor(inputPath);
    
    // Calculate positioning to center the image
    const left = Math.floor((outputWidth - inputMetadata.width) / 2);
    const top = verticalPadding; // Place it with exactly the padding amount from top
    
    // Create a blank canvas with the background color
    await sharp({
      create: {
        width: outputWidth,
        height: outputHeight,
        channels: 4,
        background: backgroundColor
      }
    })
    .composite([
      {
        input: inputPath,
        left: left,
        top: top
      }
    ])
    .toFile(finalOutputPath);
    
    console.log(`Successfully created centered image with extracted background color: ${backgroundColor}`);
    console.log(`Output saved to: ${finalOutputPath}`);
    console.log(`Output dimensions: ${outputWidth}x${outputHeight} (aspect ratio: ${(outputWidth/outputHeight).toFixed(2)})`);
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

// Process command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log(`
Usage: node center-image.js <inputPath> [outputPath] [outputWidth] [verticalPadding] [bgColor]
  - inputPath: Path to the book cover image
  - outputPath: (Optional) Path for the output image (default: inputName-featured.ext)
  - outputWidth: (Optional) Width of the output image in pixels (defaults to 3:2 aspect ratio)
  - verticalPadding: (Optional) Padding above and below in pixels (default: 15)
  - bgColor: (Optional) Background color override (default: auto-extracted from the image)
  
Example: node center-image.js ./book-cover.jpg ./cover-featured.jpg 800 15 "#F5F5F5"
  `);
  process.exit(1);
}

const [inputPath, outputPath = null, customWidth, verticalPadding = '15', bgColor = null] = args;

// Execute the function with optional parameters
centerImageWithAccentColor(
  inputPath,
  outputPath,
  customWidth ? parseInt(customWidth, 10) : null,
  parseInt(verticalPadding, 10),
  bgColor
);