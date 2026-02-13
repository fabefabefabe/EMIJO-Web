// Gardener NPC Entity - walks slowly behind bushes as background decoration
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Gardener {
    /**
     * @param {number} startX - Starting X position (parallax-space coords)
     * @param {boolean} isFemale - true for female gardener variant
     */
    constructor(startX, isFemale) {
        this.x = startX;
        this.isFemale = isFemale;
        this.frames = isFemale ? TC.gardenerFemaleFrames : TC.gardenerMaleFrames;

        // Walking speed: slow for background feel (scaled 3x)
        this.walkSpeed = 24 + Math.random() * 18; // 24-42 px/sec
        this.direction = Math.random() > 0.5 ? 1 : -1;

        // Patrol boundaries (scaled 3x)
        this.minX = startX - 90;
        this.maxX = startX + 90;

        // Walk animation (2 frames)
        this.frameIndex = 0;
        this.animTimer = 0;
        this.animInterval = 0.4; // slower than player for distant feel

        // Parallax scroll factor (slightly behind bushes at 0.40)
        this.scrollFactor = 0.35;
    }

    update(dt) {
        // Move
        this.x += this.direction * this.walkSpeed * dt;

        // Reverse at patrol boundaries
        if (this.x > this.maxX) {
            this.x = this.maxX;
            this.direction = -1;
        } else if (this.x < this.minX) {
            this.x = this.minX;
            this.direction = 1;
        }

        // Animate walk
        this.animTimer += dt;
        if (this.animTimer >= this.animInterval) {
            this.animTimer -= this.animInterval;
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }
    }

    /**
     * Draw using parallax-style positioning.
     * cameraX is the raw camera offset; we apply scrollFactor ourselves.
     */
    draw(ctx, cameraX) {
        const scale = Config.pixelScale;
        const texture = this.frames[this.frameIndex];
        const w = texture.width * scale;
        const h = texture.height * scale;

        // Apply parallax scroll factor
        const parallaxX = this.x - cameraX * this.scrollFactor;
        const screenX = Math.round(parallaxX - w / 2);

        // Position gardener with feet on top of sidewalk, behind bushes
        // Sidewalk is 16*3=48px tall, bush is 12*3=36px tall
        // Gardener is 16*3=48px tall
        // Bush bottom is at H - 48 (sidewalk height)
        // Gardener feet should be at bush bottom, so head peeks above
        const sidewalkH = TC.sidewalkTile.height * scale; // 48
        const bushH = TC.bushTile.height * scale; // 36
        const screenY = Config.sceneHeight - sidewalkH - h + 6; // feet at sidewalk top

        // Skip if off-screen
        if (screenX + w < 0 || screenX > Config.sceneWidth) return;

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
