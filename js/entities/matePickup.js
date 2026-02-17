// Mate Pickup Entity - collectible mate+termo that activates Gaucho Power
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class MatePickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;

        // Animation
        this.floatTimer = Math.random() * Math.PI * 2;
        this.pulseTimer = 0;
        this.scale = 1.0;

        // State
        this.alive = true;
        this.collected = false;
    }

    update(dt) {
        if (!this.alive) return;

        // Float animation (sine wave up/down)
        this.floatTimer += dt * 2.5;
        this.y = this.baseY + Math.sin(this.floatTimer) * 8;

        // Pulse animation (scale 1.0 → 1.2 → 1.0)
        this.pulseTimer += dt * 3;
        this.scale = 1.0 + Math.sin(this.pulseTimer) * 0.2;
    }

    /**
     * Returns AABB for collision detection (center-based).
     */
    getAABB() {
        const scale = Config.pixelScale;
        const hw = 6 * scale;
        const hh = 7 * scale;
        return { x: this.x, y: this.y, hw, hh };
    }

    /**
     * Call when player collects this mate.
     * Returns true if collected successfully.
     */
    collect() {
        if (this.collected) return false;
        this.collected = true;
        this.alive = false;
        return true;
    }

    draw(ctx, cameraX) {
        if (!this.alive) return;

        const texture = TC.matePickupTex;
        if (!texture) return;

        const scale = Config.pixelScale * this.scale;
        const w = texture.width * scale;
        const h = texture.height * scale;

        // Convert game coords to screen coords
        const screenX = this.x - cameraX - w / 2;
        const sidewalkH = 16 * Config.pixelScale;
        const screenY = Config.sceneHeight - sidewalkH - h - (this.y - Config.groundSurface);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Glow effect (slightly larger, transparent)
        ctx.globalAlpha = 0.35;
        ctx.drawImage(texture, screenX - 2, screenY - 2, w + 4, h + 4);

        // Main sprite
        ctx.globalAlpha = 1.0;
        ctx.drawImage(texture, screenX, screenY, w, h);

        ctx.restore();
    }
}
