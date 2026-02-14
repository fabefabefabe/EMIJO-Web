// Bird Entity - animated flying seagull
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Bird {
    /**
     * Creates a bird that flies right-to-left.
     * @param {number} startX - Starting X position (world coords)
     * @param {number} startY - Starting Y position (game coords, Y-up)
     * @param {number} flyDuration - How long to cross the screen (seconds)
     * @param {string} timeOfDay - 'day', 'sunset', or 'night'
     */
    constructor(startX, startY, flyDuration, timeOfDay = 'day') {
        this.x = startX;
        this.y = startY;
        this.startY = startY;
        this.timeOfDay = timeOfDay;

        // Flight
        const endX = -40;
        this.flySpeed = (startX - endX) / flyDuration;

        // Flap animation: cycle [0,1,2,1]
        this.flapCycle = [0, 1, 2, 1];
        this.flapIndex = 0;
        this.flapTimer = 0;

        // Vertical wave
        this.waveTimer = 0;
        this.wavePeriod = flyDuration / 3; // wave period
        this.alive = true;
    }

    /**
     * Creates a random bird at the right edge of the visible area.
     */
    static spawnRandom(cameraX, timeOfDay = 'day') {
        const startX = cameraX + Config.sceneWidth + 40;
        const startY = Config.birdMinY + Math.random() * (Config.birdMaxY - Config.birdMinY);
        const flyDuration = Config.birdMinDuration +
            Math.random() * (Config.birdMaxDuration - Config.birdMinDuration);
        return new Bird(startX, startY, flyDuration, timeOfDay);
    }

    update(dt) {
        // Move left
        this.x -= this.flySpeed * dt;

        // Wave vertically
        this.waveTimer += dt;
        this.y = this.startY + Math.sin(this.waveTimer * Math.PI * 2 / this.wavePeriod) * 8;

        // Flap animation
        this.flapTimer += dt;
        if (this.flapTimer >= 0.15) {
            this.flapTimer -= 0.15;
            this.flapIndex = (this.flapIndex + 1) % this.flapCycle.length;
        }

        // Check if offscreen
        if (this.x < -50) {
            this.alive = false;
        }
    }

    /**
     * Returns AABB for collision detection.
     */
    getAABB() {
        const scale = Config.pixelScale;
        return {
            x: this.x,
            y: this.y,
            hw: 6 * scale,  // ~18px
            hh: 4 * scale,  // ~12px
        };
    }

    draw(ctx, cameraX) {
        const frameIdx = this.flapCycle[this.flapIndex];
        const frames = this.timeOfDay === 'night' ? TC.birdNightFrames : TC.birdFrames;
        const texture = frames[frameIdx];
        const scale = Config.pixelScale;
        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;
        const screenY = Config.sceneHeight - this.y - h / 2;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(texture, screenX, screenY, w, h);
    }
}
