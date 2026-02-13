// AABB Collision Detection System

/**
 * Checks if two axis-aligned bounding boxes overlap.
 * Each box is defined by its center (x, y) and half-extents (hw, hh).
 * @param {{x: number, y: number, hw: number, hh: number}} a
 * @param {{x: number, y: number, hw: number, hh: number}} b
 * @returns {boolean}
 */
export function aabbOverlap(a, b) {
    return Math.abs(a.x - b.x) < (a.hw + b.hw) &&
           Math.abs(a.y - b.y) < (a.hh + b.hh);
}
