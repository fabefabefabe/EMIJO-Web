// Ammo Pickup Entity - collectible soccer ball or hockey stick that adds to ammo
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class AmmoPickup {
    /**
     * @param {number} x - X position in world coordinates
     * @param {number} y - Y position in world coordinates
     * @param {'soccer'|'hockey'} type - Type of ammo
     */
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type;

        // Animation
        this.floatTimer = Math.random() * Math.PI * 2; // Random start phase
        this.pulseTimer = 0;
        this.rotationFrame = 0;
        this.rotationTimer = 0;

        // State
        this.alive = true;
        this.collected = false;
    }

    update(dt) {
        if (!this.alive) return;

        // Float animation (sine wave up/down)
        this.floatTimer += dt * 2.5;
        this.y = this.baseY + Math.sin(this.floatTimer) * 12;

        // Rotation animation (cycle through frames)
        this.rotationTimer += dt;
        if (this.rotationTimer >= 0.15) {
            this.rotationTimer -= 0.15;
            this.rotationFrame = (this.rotationFrame + 1) % 3;
        }
    }

    /**
     * Returns AABB for collision detection (center-based).
     */
    getAABB() {
        const scale = Config.pixelScale;
        const hw = 6 * scale;
        const hh = 6 * scale;
        return { x: this.x, y: this.y, hw, hh };
    }

    /**
     * Call when player collects this ammo.
     * Returns true if collected successfully.
     */
    collect() {
        if (this.collected) return false;
        this.collected = true;
        this.alive = false;
        return true;
    }

    /**
     * Check if ammo is still on screen (cleanup optimization).
     */
    isOnScreen(cameraX) {
        const buffer = 100;
        return this.x > cameraX - buffer && this.x < cameraX + Config.sceneWidth + buffer;
    }

    draw(ctx, cameraX) {
        if (!this.alive) return;

        const frames = this.type === 'soccer' ? TC.soccerBallFrames : TC.hockeyStickFrames;
        const texture = frames[this.rotationFrame];
        const scale = Config.pixelScale * 1.2; // Slightly larger for visibility
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
     * Spawns an ammo pickup at a specific position.
     */
    static spawn(x, type) {
        // Random Y height requiring jump
        const y = Config.heartMinY + Math.random() * (Config.heartMaxY - Config.heartMinY);
        return new AmmoPickup(x, y, type);
    }
}
