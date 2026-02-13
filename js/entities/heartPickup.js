// Heart Pickup Entity - collectible heart that restores energy
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class HeartPickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;

        // Animation
        this.floatTimer = 0;
        this.pulseTimer = 0;
        this.scale = 1.0;

        // State
        this.alive = true;
        this.collected = false;
    }

    update(dt) {
        if (!this.alive) return;

        // Float animation (sine wave up/down)
        this.floatTimer += dt * 3;
        this.y = this.baseY + Math.sin(this.floatTimer) * 10;

        // Pulse animation (scale 1.0 -> 1.15 -> 1.0)
        this.pulseTimer += dt * 4;
        this.scale = 1.0 + Math.sin(this.pulseTimer) * 0.15;
    }

    /**
     * Returns AABB for collision detection (center-based).
     */
    getAABB() {
        const scale = Config.pixelScale;
        const hw = 5 * scale;  // ~15px half-width
        const hh = 5 * scale;  // ~15px half-height
        return { x: this.x, y: this.y, hw, hh };
    }

    /**
     * Call when player collects this heart.
     * Returns true if collected successfully.
     */
    collect() {
        if (this.collected) return false;
        this.collected = true;
        this.alive = false;
        return true;
    }

    /**
     * Check if heart is still on screen (cleanup optimization).
     */
    isOnScreen(cameraX) {
        const buffer = 100;
        return this.x > cameraX - buffer && this.x < cameraX + Config.sceneWidth + buffer;
    }

    draw(ctx, cameraX) {
        if (!this.alive) return;

        const scale = Config.pixelScale * this.scale;
        const texture = TC.heartFullTex;
        const w = texture.width * scale;
        const h = texture.height * scale;

        // Convert game coords to screen coords
        const screenX = this.x - cameraX - w / 2;
        const sidewalkH = 16 * Config.pixelScale;
        const screenY = Config.sceneHeight - sidewalkH - h - (this.y - Config.groundSurface);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Add slight glow effect
        ctx.globalAlpha = 0.3;
        ctx.drawImage(texture, screenX - 2, screenY - 2, w + 4, h + 4);

        ctx.globalAlpha = 1.0;
        ctx.drawImage(texture, screenX, screenY, w, h);

        ctx.restore();
    }

    /**
     * Spawns a heart pickup ahead of the player.
     */
    static spawnAhead(playerX, cameraX) {
        // Spawn ahead of player, within visible area plus a bit
        const x = playerX + Config.sceneWidth * 0.6 + Math.random() * Config.sceneWidth * 0.3;

        // Random Y height requiring jump
        const y = Config.heartMinY + Math.random() * (Config.heartMaxY - Config.heartMinY);

        return new HeartPickup(x, y);
    }
}
