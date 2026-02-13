// Flag Entity - end of level marker
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Flag {
    /**
     * @param {number} x - X position in world coordinates
     * @param {number} groundSurface - Y position of ground surface
     */
    constructor(x, groundSurface) {
        this.x = x;
        this.texture = TC.flag;
        const scale = Config.pixelScale;
        const spriteH = this.texture.height * scale;
        this.y = groundSurface + spriteH / 2;

        // Subtle wave animation
        this.waveAngle = 0;
        this.waveDir = 1;
    }

    /**
     * Returns AABB for collision detection.
     */
    getAABB() {
        const scale = Config.pixelScale;
        return {
            x: this.x,
            y: this.y,
            hw: (12 * scale) / 2,
            hh: (28 * scale) / 2,
        };
    }

    update(dt) {
        // Subtle rotation wave
        this.waveAngle += this.waveDir * dt * 0.0625; // ~0.05 rad per 0.8s
        if (this.waveAngle > 0.05) this.waveDir = -1;
        if (this.waveAngle < -0.05) this.waveDir = 1;
    }

    draw(ctx, cameraX) {
        const scale = Config.pixelScale;
        const w = this.texture.width * scale;
        const h = this.texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        // Position sprite so bottom is on top of sidewalk
        const sidewalkH = 16 * scale;
        const screenY = Config.sceneHeight - sidewalkH - h;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Apply subtle rotation
        if (Math.abs(this.waveAngle) > 0.001) {
            ctx.translate(screenX + w / 2, screenY + h);
            ctx.rotate(this.waveAngle);
            ctx.drawImage(this.texture, -w / 2, -h, w, h);
        } else {
            ctx.drawImage(this.texture, screenX, screenY, w, h);
        }

        ctx.restore();
    }
}
