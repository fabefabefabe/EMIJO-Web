// Skater Entity - anti-idle punishment that appears when player doesn't move
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Skater {
    /**
     * @param {number} startX - Starting X position (world coords)
     * @param {number} direction - 1 = right, -1 = left
     */
    constructor(startX, direction) {
        this.x = startX;
        this.direction = direction;
        this.y = Config.groundSurface;
        this.speed = 800; // Very fast

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

        // Remove if far offscreen
        if (this.x < -200 || this.x > Config.levelWidth + 200) {
            this.alive = false;
        }
    }

    getAABB() {
        const scale = Config.pixelScale;
        return {
            x: this.x,
            y: this.y,
            hw: 8 * scale,
            hh: 10 * scale,
        };
    }

    draw(ctx, cameraX) {
        const texture = TC.skaterFrames[this.frame];
        const scale = Config.pixelScale;
        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        // Position on sidewalk
        const sidewalkH = 16 * scale;
        const screenY = Config.sceneHeight - sidewalkH - h;

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
