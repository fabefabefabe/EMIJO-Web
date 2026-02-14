// Flag Entity - end of level marker with animated cloth
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

        // Subtle wave animation (pole sway)
        this.waveAngle = 0;
        this.waveDir = 1;

        // Cloth flutter animation (cycle through 3 frames at ~4fps)
        this.clothFrame = 0;
        this.clothTimer = 0;
        this.clothCycle = [0, 1, 0, 2]; // default, compact, default, extended
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
        // Pole sway with wider amplitude
        this.waveAngle += this.waveDir * dt * 0.1;
        if (this.waveAngle > 0.08) this.waveDir = -1;
        if (this.waveAngle < -0.08) this.waveDir = 1;

        // Cloth flutter at ~4fps
        this.clothTimer += dt;
        if (this.clothTimer >= 0.25) {
            this.clothTimer -= 0.25;
            this.clothFrame = (this.clothFrame + 1) % this.clothCycle.length;
        }
    }

    draw(ctx, cameraX) {
        const scale = Config.pixelScale;
        const frameIdx = this.clothCycle[this.clothFrame];
        const texture = TC.flagFrames[frameIdx];
        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        // Position sprite so bottom is on top of sidewalk
        const sidewalkH = 16 * scale;
        const screenY = Config.sceneHeight - sidewalkH - h;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Apply subtle rotation (pole sway)
        if (Math.abs(this.waveAngle) > 0.001) {
            ctx.translate(screenX + w / 2, screenY + h);
            ctx.rotate(this.waveAngle);
            ctx.drawImage(texture, -w / 2, -h, w, h);
        } else {
            ctx.drawImage(texture, screenX, screenY, w, h);
        }

        ctx.restore();
    }
}
