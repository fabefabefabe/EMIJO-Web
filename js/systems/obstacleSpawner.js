// Obstacle Spawner - generates random obstacles across the level
import { Config } from '../config.js';

const GROUND_TYPES = ['rock', 'bench', 'trashCan', 'pothole', 'cooler'];
const TREE_CHANCE = 0.15; // 15% chance of tree

/**
 * Check if x position is inside any exclusion zone.
 * @param {number} x - Position to check.
 * @param {Array<{xMin: number, xMax: number}>} exclusionZones
 * @returns {boolean}
 */
function isInExclusionZone(x, exclusionZones) {
    for (const zone of exclusionZones) {
        if (x >= zone.xMin && x <= zone.xMax) return true;
    }
    return false;
}

/**
 * Pick a random obstacle type.
 * 15% tree/umbrella, 85% random ground type.
 * @param {boolean} isBeach - If true, use beach variants
 */
function pickRandomType(isBeach = false) {
    const treeType = isBeach ? 'beachUmbrella' : 'tree';
    const groundTypes = isBeach
        ? GROUND_TYPES.map(t => t === 'rock' ? 'beachBall' : t)
        : GROUND_TYPES;

    if (Math.random() < TREE_CHANCE) {
        return treeType;
    }
    return groundTypes[Math.floor(Math.random() * groundTypes.length)];
}

/**
 * Generates an array of obstacle data for the level.
 * @param {number} levelWidth - Total level width.
 * @param {number} groundSurface - Y position of ground surface (top of ground).
 * @param {Array<{xMin: number, xMax: number}>} [exclusionZones] - Areas where obstacles must not spawn.
 * @returns {Array<{type: string, x: number, y: number}>}
 */
export function generateObstacles(levelWidth, groundSurface, exclusionZones = [], isBeach = false) {
    const obstacles = [];
    let currentX = Config.startBuffer;

    const groundTypes = isBeach
        ? GROUND_TYPES.map(t => t === 'rock' ? 'beachBall' : t)
        : GROUND_TYPES;

    while (currentX < levelWidth - Config.endBuffer) {
        const spacing = Config.minObstacleSpacing +
            Math.random() * (Config.maxObstacleSpacing - Config.minObstacleSpacing);
        currentX += spacing;

        if (currentX >= levelWidth - Config.endBuffer) break;

        // Skip if inside an exclusion zone
        if (isInExclusionZone(currentX, exclusionZones)) continue;

        const type = pickRandomType(isBeach);
        obstacles.push({ type, x: currentX, groundSurface });

        // 15% chance to add a consecutive obstacle (close together but jumpable)
        if (Math.random() < 0.15 && currentX + 240 < levelWidth - Config.endBuffer) {
            const closeSpacing = 180 + Math.random() * 60; // 180-240px apart
            const secondX = currentX + closeSpacing;
            if (!isInExclusionZone(secondX, exclusionZones)) {
                currentX = secondX;
                // Second obstacle is always a ground type (not tree/umbrella)
                const secondType = groundTypes[Math.floor(Math.random() * groundTypes.length)];
                obstacles.push({ type: secondType, x: currentX, groundSurface });
            }
        }
    }

    return obstacles;
}
