// Camera System - smooth follow with lerp, clamped to level bounds
import { Config } from '../config.js';

export class Camera {
    constructor() {
        this.x = 0; // Camera left edge in world coordinates
    }

    /**
     * Updates camera position to follow the player with smooth interpolation.
     * @param {number} playerX - Player's X position in world coordinates.
     */
    update(playerX) {
        const halfWidth = Config.sceneWidth / 2;
        const minX = 0;
        const maxX = Config.levelWidth - Config.sceneWidth;

        // Target: center camera on player, clamped to level bounds
        const targetX = Math.max(minX, Math.min(maxX, playerX - halfWidth));

        // Smooth camera follow (linear interpolation)
        this.x += (targetX - this.x) * Config.cameraLerp;
    }

    /** Current camera offset for parallax and drawing */
    get offset() {
        return this.x;
    }
}
