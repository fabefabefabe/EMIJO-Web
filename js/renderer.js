// Pixel Art Renderer - converts 2D pixel arrays + palette to offscreen canvases

/**
 * Renders a 2D pixel grid into an offscreen canvas.
 * @param {number[][]} pixels - 2D array [row][col] of palette indices. 0 = transparent.
 * @param {(number[]|null)[]} palette - Array of [R,G,B] colors. Index 0 = null (transparent).
 * @returns {HTMLCanvasElement} Offscreen canvas with the rendered sprite.
 */
export function renderSprite(pixels, palette) {
    const h = pixels.length;
    const w = pixels[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = pixels[y][x];
            const offset = (y * w + x) * 4;
            if (idx === 0 || !palette[idx]) {
                // Transparent pixel (data is already 0,0,0,0)
            } else {
                const c = palette[idx];
                data[offset]     = c[0]; // R
                data[offset + 1] = c[1]; // G
                data[offset + 2] = c[2]; // B
                data[offset + 3] = 255;  // A
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Draws a sprite (offscreen canvas) onto the main canvas at a game position.
 * Handles Y-axis flip (game: Y-up → canvas: Y-down) and pixel scaling.
 * @param {CanvasRenderingContext2D} ctx - Main canvas context.
 * @param {HTMLCanvasElement} sprite - Offscreen canvas to draw.
 * @param {number} gameX - X position in game coordinates (center of sprite).
 * @param {number} gameY - Y position in game coordinates (center of sprite, Y-up).
 * @param {number} scale - Pixel scale factor.
 * @param {boolean} flipX - If true, flip horizontally.
 * @param {number} alpha - Opacity (0 to 1).
 * @param {number} canvasHeight - Height of the main canvas.
 */
export function drawSprite(ctx, sprite, gameX, gameY, scale, flipX = false, alpha = 1.0, canvasHeight = 270) {
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    // Convert game coords (Y-up) to canvas coords (Y-down)
    const screenX = gameX - w / 2;
    const screenY = canvasHeight - gameY - h / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;

    if (flipX) {
        ctx.translate(screenX + w, screenY);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0, w, h);
    } else {
        ctx.drawImage(sprite, screenX, screenY, w, h);
    }

    ctx.restore();
}

/**
 * Draws a sprite at a raw screen position (no coordinate conversion).
 * Used for HUD, backgrounds, etc.
 */
export function drawSpriteRaw(ctx, sprite, screenX, screenY, scale, alpha = 1.0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, screenX, screenY, sprite.width * scale, sprite.height * scale);
    ctx.restore();
}
