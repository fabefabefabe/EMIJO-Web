// Skater Entity - anti-idle punishment that appears when player doesn't move
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
        this.speed = 500; // Slower than before (was 800)
        this.scaleFactor = 1.5; // Make skater bigger

        this.alive = true;
        this.frame = 0;
        this.animTimer = 0;
    }

    update(dt) {
        // Move
        this.x += this.direction * this.speed * dt;

        // Animate
        this.animTimer += dt;
        if (this.animTimer >= 0.1) {
            this.animTimer -= 0.1;
            this.frame = (this.frame + 1) % 2;
        }

        // Remove if traveled too far from start (3 screen widths)
        if (Math.abs(this.x - this.startX) > Config.sceneWidth * 3) {
            this.alive = false;
        }
    }

    getAABB() {
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
        const scale = Config.pixelScale * this.scaleFactor; // Apply scale factor
        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        // Misma fórmula que el Player para altura correcta
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
