// Jogger Entity - chubby 80s lady jogging in opposite direction
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Jogger {
    /**
     * Creates a jogger that runs from right to left on the ground.
     * @param {number} startX - Starting X position (world coords)
     * @param {number} groundSurface - Ground surface Y (game coords, Y-up)
     */
    constructor(startX, groundSurface) {
        this.x = startX;
        this.groundSurface = groundSurface;
        this.speed = Config.joggerSpeed;
        this.alive = true;
        this.knocked = false;
        this.knockTimer = 0;

        // Run animation (2 frames)
        this.runFrame = 0;
        this.runTimer = 0;

        // Y position: feet on ground
        const scale = Config.pixelScale;
        const spriteH = TC.joggerRunFrames[0].height * scale;
        this.y = groundSurface + spriteH / 2;
    }

    /**
     * Creates a jogger at the right edge of the visible area.
     */
    static spawnRandom(cameraX, groundSurface) {
        const startX = cameraX + Config.sceneWidth + 60;
        return new Jogger(startX, groundSurface);
    }

    update(dt) {
        if (this.knocked) {
            this.knockTimer += dt;
            // Stay on ground for 3 seconds then disappear
            if (this.knockTimer >= 3.0) {
                this.alive = false;
            }
            return;
        }

        // Move left
        this.x -= this.speed * dt;

        // Run animation (toggle every 0.2s)
        this.runTimer += dt;
        if (this.runTimer >= 0.2) {
            this.runTimer -= 0.2;
            this.runFrame = (this.runFrame + 1) % 2;
        }

        // Check if offscreen left (well past camera)
        if (this.x < -200) {
            this.alive = false;
        }
    }

    /**
     * Returns AABB for collision detection.
     */
    getAABB() {
        if (this.knocked) {
            return { x: this.x, y: this.y, hw: 0, hh: 0 };
        }
        const scale = Config.pixelScale;
        return {
            x: this.x,
            y: this.y,
            hw: (12 * scale) / 2,  // 18px half-width
            hh: (26 * scale) / 2,  // 39px half-height (similar to player)
        };
    }

    /**
     * Knock the jogger down (called on player collision).
     */
    knockDown() {
        if (this.knocked) return;
        this.knocked = true;
        this.knockTimer = 0;
    }

    draw(ctx, cameraX) {
        const scale = Config.pixelScale;
        let texture;

        if (this.knocked) {
            texture = TC.joggerFallenTex;
        } else {
            texture = TC.joggerRunFrames[this.runFrame];
        }

        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        // Position sprite so bottom is on top of sidewalk
        const sidewalkH = 16 * scale;
        const screenY = Config.sceneHeight - sidewalkH - h;

        ctx.imageSmoothingEnabled = false;

        // Jogger faces left (sprites are drawn facing left, no flip needed)
        // But when knocked, just draw normally
        ctx.drawImage(texture, screenX, screenY, w, h);
    }
}
