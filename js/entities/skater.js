// Skater Entity - alternates with jogger from level 3+, moves left
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Skater {
    /**
     * @param {number} startX - Starting X position (world coords)
     * @param {number} direction - 1 = right, -1 = left
     */
    constructor(startX, direction) {
        this.startX = startX;
        this.x = startX;
        this.direction = direction;
        this.y = Config.groundSurface;
        this.speed = Config.skaterSpeed; // Separate skater speed
        this.scaleFactor = 1.5; // Make skater bigger

        this.alive = true;
        this.knocked = false;
        this.knockTimer = 0;
        this.frame = 0;
        this.animTimer = 0;
    }

    /**
     * Spawn a skater from the left edge of the screen (behind camera), moving right.
     */
    static spawnRandom(cameraX, groundSurface) {
        const startX = cameraX - 60;
        return new Skater(startX, 1);
    }

    /**
     * Knock down the skater (called on player collision).
     */
    knockDown() {
        if (this.knocked) return;
        this.knocked = true;
        this.knockTimer = 0;
    }

    update(dt, cameraX) {
        // Knocked down: wait 3 seconds then disappear
        if (this.knocked) {
            this.knockTimer += dt;
            if (this.knockTimer >= 3.0) {
                this.alive = false;
            }
            return;
        }

        // Move
        this.x += this.direction * this.speed * dt;

        // Animate
        this.animTimer += dt;
        if (this.animTimer >= 0.1) {
            this.animTimer -= 0.1;
            this.frame = (this.frame + 1) % 2;
        }

        // Remove if gone off screen right (skater moves left→right)
        if (cameraX !== undefined && this.x > cameraX + Config.sceneWidth + 200) {
            this.alive = false;
        } else if (cameraX === undefined && this.x < -200) {
            // Fallback for old callers
            this.alive = false;
        }
    }

    getAABB() {
        if (this.knocked) {
            return { x: this.x, y: this.y, hw: 0, hh: 0 };
        }
        const scale = Config.pixelScale * this.scaleFactor;
        return {
            x: this.x,
            y: this.y,
            hw: 10 * scale,
            hh: 14 * scale,
        };
    }

    draw(ctx, cameraX) {
        const texture = TC.skaterFrames[this.frame];
        const scale = Config.pixelScale * this.scaleFactor;
        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        const sidewalkH = 16 * Config.pixelScale;
        const screenY = Config.sceneHeight - sidewalkH - h - (this.y - Config.groundSurface);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (this.direction === -1) {
            ctx.translate(screenX + w, screenY);
            ctx.scale(-1, 1);
            ctx.drawImage(texture, 0, 0, w, h);
        } else {
            ctx.drawImage(texture, screenX, screenY, w, h);
        }

        ctx.restore();
    }
}
