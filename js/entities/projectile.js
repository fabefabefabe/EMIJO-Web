// Projectile Entity - soccer ball or hockey stick that destroys obstacles
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Projectile {
    /**
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {'soccer'|'hockey'} type - Type of projectile
     */
    constructor(x, y, type) {
        this.startX = x;
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = 800; // Fast!
        this.alive = true;

        // Animation
        this.frame = 0;
        this.animTimer = 0;

        // Get frames based on type
        this.frames = type === 'soccer' ? TC.soccerBallFrames : TC.hockeyStickFrames;
    }

    update(dt) {
        if (!this.alive) return;

        // Move right
        this.x += this.speed * dt;

        // Animate rotation
        this.animTimer += dt;
        if (this.animTimer >= 0.05) { // Fast rotation
            this.animTimer -= 0.05;
            this.frame = (this.frame + 1) % this.frames.length;
        }

        // Remove if traveled too far from start (2 screen widths)
        if (this.x - this.startX > Config.sceneWidth * 2) {
            this.alive = false;
        }
    }

    getAABB() {
        const scale = Config.pixelScale;
        return {
            x: this.x,
            y: this.y,
            hw: 6 * scale,
            hh: 6 * scale,
        };
    }

    draw(ctx, cameraX) {
        if (!this.alive) return;

        const texture = this.frames[this.frame];
        const scale = Config.pixelScale;
        const w = texture.width * scale;
        const h = texture.height * scale;

        const screenX = this.x - cameraX - w / 2;
        const sidewalkH = 16 * scale;
        const screenY = Config.sceneHeight - sidewalkH - h - (this.y - Config.groundSurface);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(texture, screenX, screenY, w, h);
    }

    /**
     * Called when projectile hits an obstacle
     */
    destroy() {
        this.alive = false;
    }
}
