import sharp from "sharp";
import { writeFile } from "fs/promises";

/**
 * Document-scan style image processing pipeline.
 * Converts photos of printed questions into clean, print-ready images
 * with pure white backgrounds and crisp black text.
 *
 * Pipeline:
 * 1. resize     — cap at 2000px width
 * 2. grayscale  — drop colour info
 * 3. normalise  — stretch histogram to full range
 * 4. clahe      — local adaptive contrast (fixes uneven lighting / shadows)
 * 5. median     — denoise: removes salt-and-pepper noise / small spots
 * 6. threshold  — binarise: background → white, text → black
 * 7. webp       — compress
 */
export async function processForPrint(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
        .resize({ width: 2000, withoutEnlargement: true })
        .grayscale()
        .normalise()
        .clahe({ width: 8, height: 8 })
        .median(3)
        .threshold(128)
        .webp({ quality: 85 })
        .toBuffer();
}

/**
 * Process the image buffer and write the result to disk.
 */
export async function processAndSave(
    buffer: Buffer,
    filePath: string
): Promise<void> {
    const processed = await processForPrint(buffer);
    await writeFile(filePath, processed);
}
