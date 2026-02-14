// Obstacle Entity - static obstacles on the sidewalk
import { Config } from '../config.js';
import * as TC from '../textureCache.js';
import { renderSprite } from '../renderer.js';
import { Palettes } from '../palettes.js';
import { rock as rockBaseData } from '../sprites/obstaclePixels.js';

// Body sizes in pixel art pixels (before scaling)
const BODY_SIZES = {
    rock:      { w: 14, h: 10 },
    bench:     { w: 22, h: 14 },
    trashCan:  { w: 10, h: 18 },
    pothole:   { w: 18, h: 6 },
    cooler:    { w: 16, h: 12 },
    tree:      { w: 18, h: 6 },   // only the branch AABB
};

// Texture lookup (default textures)
const TEXTURES = {
    rock:      () => TC.rock,
    bench:     () => TC.bench,
    trashCan:  () => TC.trashCan,
    pothole:   () => TC.potholeFlat,
    cooler:    () => TC.cooler,
    tree:      () => TC.tree,
};

export class Obstacle {
    /**
     * @param {string} type - 'rock', 'bench', 'trashCan', 'pothole', 'cooler', or 'tree'
     * @param {number} x - X position in world coordinates
     * @param {number} groundSurface - Y position of ground surface
     */
    constructor(type, x, groundSurface) {
        this.type = type;
        this.x = x;
        this.groundSurface = groundSurface;
        this.destroyed = false; // For projectile collision

        const scale = Config.pixelScale;

        // --- Rock: generate random unique shape ---
        if (type === 'rock') {
            this.texture = this._generateRandomRock();
        } else {
            this.texture = TEXTURES[type]();
        }

        // --- Trash can animation + knocked state ---
        if (type === 'trashCan') {
            this.flyFrame = 0;
            this.flyTimer = 0;
            this.isAnimated = true;
            this.knocked = false;
            this.knockTimer = 0;
            this.knockPhase = null; // 'falling' or 'spilled'
        } else {
            this.isAnimated = false;
        }

        // --- Bench variants (40% chance of person sitting) ---
        if (type === 'bench') {
            if (Math.random() < 0.4) {
                this.benchVariant = Math.floor(Math.random() * 2); // 0 or 1
            } else {
                this.benchVariant = -1; // empty bench
            }
        }

        // --- Pothole: fall animation state ---
        if (type === 'pothole') {
            this.activeFallAnim = false;
            this.fallAnimPhase = null;  // 'fallIn' or 'eyes'
            this.fallAnimTimer = 0;
            this.eyeBlinkTimer = 0;
            this.eyesOpen = true;
        }

        // --- Y positioning ---
        const spriteH = this.texture.height * scale;

        if (type === 'pothole') {
            // Pothole is embedded in ground (slightly below surface)
            this.y = groundSurface + 6;
        } else if (type === 'tree') {
            // Tree sprite bottom on ground, but AABB at branch height
            this.y = groundSurface + spriteH / 2;
            // Branch Y: the branch is near the top of the tree
            // Tree is 40px tall * 3 scale = 120px. Ground surface at 180.
            // Tree top (game coords) = groundSurface + 120 = 300
            // Branch should be just above standing player top (219)
            // Branch center at groundSurface + 84 = 264
            this.branchY = groundSurface + 84;
        } else {
            // Ground obstacles: center based on sprite height
            this.y = groundSurface + spriteH / 2;
        }
    }

    /**
     * Generate a unique random rock by modifying the base rock pixel data.
     * Toggles 2-4 edge pixels and adds 1-3 dark shadow spots.
     */
    _generateRandomRock() {
        // Deep copy the base rock data
        const pixels = rockBaseData.map(row => [...row]);
        const h = pixels.length;
        const w = pixels[0].length;

        // Toggle 2-4 edge pixels (add or remove)
        const edgeToggles = 2 + Math.floor(Math.random() * 3);
        for (let t = 0; t < edgeToggles; t++) {
            const row = Math.floor(Math.random() * h);
            const col = Math.floor(Math.random() * w);
            // Find edge pixels (non-zero adjacent to zero, or zero adjacent to non-zero)
            if (pixels[row][col] === 0) {
                // Check if adjacent to non-zero → add a pixel
                const neighbors = [];
                if (row > 0) neighbors.push(pixels[row - 1][col]);
                if (row < h - 1) neighbors.push(pixels[row + 1][col]);
                if (col > 0) neighbors.push(pixels[row][col - 1]);
                if (col < w - 1) neighbors.push(pixels[row][col + 1]);
                if (neighbors.some(n => n > 0)) {
                    pixels[row][col] = Math.random() < 0.5 ? 2 : 3;
                }
            } else {
                // Check if adjacent to zero → remove the pixel
                const neighbors = [];
                if (row > 0) neighbors.push(pixels[row - 1][col]);
                if (row < h - 1) neighbors.push(pixels[row + 1][col]);
                if (col > 0) neighbors.push(pixels[row][col - 1]);
                if (col < w - 1) neighbors.push(pixels[row][col + 1]);
                if (neighbors.some(n => n === 0)) {
                    pixels[row][col] = 0;
                }
            }
        }

        // Add 1-3 dark shadow spots (change some pixels to index 3)
        const shadowSpots = 1 + Math.floor(Math.random() * 3);
        for (let s = 0; s < shadowSpots; s++) {
            const row = 2 + Math.floor(Math.random() * (h - 4));
            const col = 2 + Math.floor(Math.random() * (w - 4));
            if (pixels[row][col] > 0 && pixels[row][col] !== 3) {
                pixels[row][col] = 3;
            }
        }

        return renderSprite(pixels, Palettes.objects);
    }

    /**
     * Start pothole fall-in animation (called from player.fallInHole)
     */
    startFallAnimation() {
        this.activeFallAnim = true;
        this.fallAnimPhase = 'fallIn';
        this.fallAnimTimer = 0;
        this.eyeBlinkTimer = 0;
        this.eyesOpen = true;
    }

    /**
     * Knock over the trash can (called on player collision)
     */
    knockOver() {
        if (this.knocked) return;
        this.knocked = true;
        this.knockPhase = 'falling';
        this.knockTimer = 0;
    }

    /**
     * Update animation states.
     */
    update(dt) {
        // Trash can fly animation (only if not knocked)
        if (this.type === 'trashCan') {
            if (this.knocked) {
                this.knockTimer += dt;
                if (this.knockPhase === 'falling' && this.knockTimer >= 0.2) {
                    this.knockPhase = 'spilled';
                }
            } else {
                this.flyTimer += dt;
                if (this.flyTimer >= 0.15) {
                    this.flyTimer -= 0.15;
                    this.flyFrame = (this.flyFrame + 1) % 2;
                }
            }
        }

        // Pothole fall animation
        if (this.type === 'pothole' && this.activeFallAnim) {
            this.fallAnimTimer += dt;
            if (this.fallAnimPhase === 'fallIn' && this.fallAnimTimer >= 0.33) {
                this.fallAnimPhase = 'eyes';
                this.fallAnimTimer = 0;
                this.eyeBlinkTimer = 0;
                this.eyesOpen = true;
            }
            if (this.fallAnimPhase === 'eyes') {
                this.eyeBlinkTimer += dt;
                if (this.eyeBlinkTimer >= 0.25) {
                    this.eyeBlinkTimer -= 0.25;
                    this.eyesOpen = !this.eyesOpen;
                }
                if (this.fallAnimTimer >= 0.77) {
                    this.activeFallAnim = false;
                    this.fallAnimPhase = null;
                }
            }
        }
    }

    /**
     * Returns AABB for collision detection.
     */
    getAABB() {
        const scale = Config.pixelScale;
        const size = BODY_SIZES[this.type];

        // Knocked trash can has no collision
        if (this.type === 'trashCan' && this.knocked) {
            return { x: this.x, y: this.y, hw: 0, hh: 0 };
        }

        // Tree: AABB only at branch height
        if (this.type === 'tree') {
            return {
                x: this.x,
                y: this.branchY,
                hw: (size.w * scale) / 2,
                hh: (size.h * scale) / 2,
            };
        }

        return {
            x: this.x,
            y: this.y,
            hw: (size.w * scale) / 2,
            hh: (size.h * scale) / 2,
        };
    }

    /**
     * Draws the obstacle.
     */
    draw(ctx, cameraX) {
        const scale = Config.pixelScale;

        // Select texture based on state
        let texture = this.texture;

        if (this.type === 'trashCan') {
            if (this.knocked) {
                texture = this.knockPhase === 'falling'
                    ? TC.trashCanFallingTex
                    : TC.trashCanSpilledTex;
            } else {
                texture = TC.trashCanFliesFrames[this.flyFrame];
            }
        } else if (this.type === 'bench' && this.benchVariant >= 0) {
            texture = TC.benchWithPersonFrames[this.benchVariant];
        } else if (this.type === 'pothole' && this.activeFallAnim) {
            if (this.fallAnimPhase === 'fallIn') {
                texture = TC.potholeFallIn;
            } else if (this.fallAnimPhase === 'eyes') {
                texture = this.eyesOpen ? TC.potholeEyes : TC.potholeEyesClosed;
            }
        }

        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        // Position sprite so bottom is on top of sidewalk
        const sidewalkH = 16 * scale; // sidewalk tile height = 48px
        let screenY = Config.sceneHeight - sidewalkH - h;

        // Pothole: sink slightly into ground
        if (this.type === 'pothole') {
            screenY = Config.sceneHeight - sidewalkH - h + 6;
        }

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(texture, screenX, screenY, w, h);
    }
}
