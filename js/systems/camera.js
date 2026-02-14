// Camera System - forward-only scrolling (never goes back)
import { Config } from '../config.js';

export class Camera {
    constructor() {
        this.x = 0; // Camera left edge in world coordinates
    }

    /**
     * Updates camera position to follow the player.
     * Camera only advances forward - never scrolls back.
     * Player can walk back but only within the visible screen.
     */
    update(playerX) {
        // Player positioned at ~25% from left edge (more forward visibility)
        const playerOffset = Config.sceneWidth * 0.25;

        // Target: player at 25% from left, but never go below 0
        const targetX = Math.max(0, playerX - playerOffset);

        // Smooth camera follow (linear interpolation)
        const smoothed = this.x + (targetX - this.x) * Config.cameraLerp;

        // Camera only advances - never goes back
        this.x = Math.max(this.x, smoothed);
    }

    /** Current camera offset for parallax and drawing */
    get offset() {
        return this.x;
    }
}
