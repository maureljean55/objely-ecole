// The database refuses a photo over 400 000 characters of data URL (declaration_photos, photo_upload_items): every
// photo is encoded to fit, first by lowering the JPEG quality, then the size, keeping a margin.
export const MAX_PHOTO_DATA_URL = 390_000;
const SCALES = [1, 0.8, 0.62, 0.5];
const QUALITIES = [0.82, 0.72, 0.62];

/**
 * Draws a photo at decreasing sizes and qualities until its JPEG data URL fits.
 * `draw` paints the full picture into a canvas of the given size. null if even the smallest does not fit.
 */
export function encodePhoto(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): string | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  for (const scale of SCALES) {
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    draw(ctx, canvas.width, canvas.height);
    for (const quality of QUALITIES) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= MAX_PHOTO_DATA_URL) return data;
    }
  }
  return null;
}
