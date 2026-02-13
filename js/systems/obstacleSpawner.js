// Obstacle Spawner - generates random obstacles across the level
import { Config } from '../config.js';

const GROUND_TYPES = ['rock', 'bench', 'trashCan', 'pothole'];
const OVERHEAD_TYPES = ['awning', 'lowBranch'];

/**
 * Generates an array of obstacle data for the level.
 * @param {number} levelWidth - Total level width.
 * @param {number} groundSurface - Y position of ground surface (top of ground).
 * @returns {Array<{type: string, x: number, y: number}>}
 */
export function generateObstacles(levelWidth, groundSurface) {
    const obstacles = [];
    let currentX = Config.startBuffer;

    while (currentX < levelWidth - Config.endBuffer) {
        const spacing = Config.minObstacleSpacing +
            Math.random() * (Config.maxObstacleSpacing - Config.minObstacleSpacing);
        currentX += spacing;

        if (currentX >= levelWidth - Config.endBuffer) break;

        // 25% chance overhead obstacle, 75% ground obstacle
        let type;
        if (Math.random() < 0.25) {
            type = OVERHEAD_TYPES[Math.floor(Math.random() * OVERHEAD_TYPES.length)];
        } else {
            type = GROUND_TYPES[Math.floor(Math.random() * GROUND_TYPES.length)];
        }
        obstacles.push({ type, x: currentX, groundSurface });

        // 15% chance to add a consecutive obstacle (close together but jumpable)
        if (Math.random() < 0.15 && currentX + 240 < levelWidth - Config.endBuffer) {
            const closeSpacing = 180 + Math.random() * 60; // 180-240px apart
            currentX += closeSpacing;
            // Second obstacle is always a ground type (jumpable)
            const secondType = GROUND_TYPES[Math.floor(Math.random() * GROUND_TYPES.length)];
            obstacles.push({ type: secondType, x: currentX, groundSurface });
        }
    }

    return obstacles;
}
