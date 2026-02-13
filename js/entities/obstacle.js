// Obstacle Entity - static obstacles on the sidewalk
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

// Body sizes in pixel art pixels (before scaling)
const BODY_SIZES = {
    rock:      { w: 14, h: 10 },
    bench:     { w: 22, h: 14 },
    trashCan:  { w: 10, h: 18 },
    pothole:   { w: 14, h: 3 },
    awning:    { w: 26, h: 5 },
    lowBranch: { w: 22, h: 5 },
};

// Texture lookup
const TEXTURES = {
    rock:      () => TC.rock,
    bench:     () => TC.bench,
    trashCan:  () => TC.trashCan,
    pothole:   () => TC.pothole,
    awning:    () => TC.awning,
    lowBranch: () => TC.lowBranch,
};

// Overhead obstacle types (must crouch to pass under)
const OVERHEAD_TYPES = new Set(['awning', 'lowBranch']);

export class Obstacle {
    /**
     * @param {string} type - 'rock', 'bench', 'trashCan', or 'pothole'
     * @param {number} x - X position in world coordinates
     * @param {number} groundSurface - Y position of ground surface
     */
    constructor(type, x, groundSurface) {
        this.type = type;
        this.texture = TEXTURES[type]();
        this.x = x;
        this.isOverhead = OVERHEAD_TYPES.has(type);

        // Trash can animation
        if (type === 'trashCan') {
            this.flyFrame = 0;
            this.flyTimer = 0;
            this.isAnimated = true;
        } else {
            this.isAnimated = false;
        }

        // Bench variants (40% chance of person sitting)
        if (type === 'bench') {
            if (Math.random() < 0.4) {
                this.benchVariant = Math.floor(Math.random() * 2); // 0 or 1
            } else {
                this.benchVariant = -1; // empty bench
            }
        }

        const scale = Config.pixelScale;
        const spriteH = this.texture.height * scale;

        // Y positioning depends on obstacle type
        if (this.isOverhead) {
            // Position overhead so bottom of AABB is at Y=270 (scaled 3x)
            // (above crouching player top=252, below standing player top=297)
            const size = BODY_SIZES[type];
            const hh = (size.h * scale) / 2;
            this.y = 270 + hh;
        } else if (type === 'pothole') {
            // Pothole sits flat on ground surface
            this.y = groundSurface + 6; // scaled 3x
        } else {
            // Ground obstacles: bottom of sprite sits on groundSurface
            this.y = groundSurface + spriteH / 2;
        }
    }

    /**
     * Update animation (for trash cans with flies)
     */
    update(dt) {
        if (this.type === 'trashCan') {
            this.flyTimer += dt;
            if (this.flyTimer >= 0.15) {
                this.flyTimer -= 0.15;
                this.flyFrame = (this.flyFrame + 1) % 2;
            }
        }
    }

    /**
     * Returns AABB for collision detection.
     */
    getAABB() {
        const scale = Config.pixelScale;
        const size = BODY_SIZES[this.type];
        return {
            x: this.x,
            y: this.y,
            hw: (size.w * scale) / 2,
            hh: (size.h * scale) / 2,
        };
    }

    /**
     * Draws the obstacle.
     */
    draw(ctx, cameraX) {
        const scale = Config.pixelScale;

        // Use animated texture for trash cans
        let texture = this.texture;
        if (this.type === 'trashCan') {
            texture = TC.trashCanFliesFrames[this.flyFrame];
        } else if (this.type === 'bench' && this.benchVariant >= 0) {
            texture = TC.benchWithPersonFrames[this.benchVariant];
        }

        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;

        // Position sprite so bottom is on top of sidewalk
        const sidewalkH = 16 * scale; // sidewalk tile height = 48px
        const screenY = Config.sceneHeight - sidewalkH - h;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(texture, screenX, screenY, w, h);
    }
}
