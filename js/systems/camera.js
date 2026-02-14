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
        const halfWidth = Config.sceneWidth / 2;

        // Target: center camera on player, but never go below 0
        const targetX = Math.max(0, playerX - halfWidth);

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
