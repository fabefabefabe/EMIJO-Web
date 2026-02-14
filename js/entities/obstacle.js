// Obstacle Entity - static obstacles on the sidewalk
import { Config } from '../config.js';
import * as TC from '../textureCache.js';
import { renderSprite } from '../renderer.js';
import { Palettes } from '../palettes.js';
import { rock as rockBaseData } from '../sprites/obstaclePixels.js';

// Body sizes in pixel art pixels (before scaling)
const BODY_SIZES = {
    rock:      { w: 14, h: 10 },
    bench:     { w: 22, h: 14 },
    trashCan:  { w: 10, h: 18 },
    pothole:   { w: 18, h: 8 },
    cooler:    { w: 16, h: 12 },
    tree:      { w: 36, h: 40 },  // canopy AABB (doubled)
};

// Texture lookup (default textures)
const TEXTURES = {
    rock:      () => TC.rock,
    bench:     () => TC.bench,
    trashCan:  () => TC.trashCan,
    pothole:   () => TC.potholeFlat,
    cooler:    () => TC.cooler,
    tree:      () => TC.tree,
};

export class Obstacle {
    /**
     * @param {string} type - 'rock', 'bench', 'trashCan', 'pothole', 'cooler', or 'tree'
     * @param {number} x - X position in world coordinates
     * @param {number} groundSurface - Y position of ground surface
     * @param {string} characterType - 'emi' or 'jo' (for pothole coloring)
     */
    constructor(type, x, groundSurface, characterType = 'emi') {
        this.type = type;
        this.x = x;
        this.groundSurface = groundSurface;
        this.characterType = characterType;
        this.destroyed = false; // For projectile collision

        const scale = Config.pixelScale;

        // --- Rock: generate random unique shape ---
        if (type === 'rock') {
            this.texture = this._generateRandomRock();
        } else {
            this.texture = TEXTURES[type]();
        }

        // --- Trash can animation + knocked state ---
        if (type === 'trashCan') {
            this.flyFrame = 0;
            this.flyTimer = 0;
            this.isAnimated = true;
            this.knocked = false;
            this.knockTimer = 0;
            this.knockPhase = null; // 'falling' or 'spilled'
        } else {
            this.isAnimated = false;
        }

        // --- Bench variants (40% chance of person sitting) ---
        if (type === 'bench') {
            if (Math.random() < 0.4) {
                this.benchVariant = Math.floor(Math.random() * 2); // 0 or 1
            } else {
                this.benchVariant = -1; // empty bench
            }
        }

        // --- Pothole: fall animation state ---
        if (type === 'pothole') {
            this.activeFallAnim = false;
            this.fallAnimPhase = null;  // 'fallIn' or 'eyes'
            this.fallAnimTimer = 0;
            this.eyeBlinkTimer = 0;
            this.eyesOpen = true;
        }

        // --- Tree: shake + falling leaves state ---
        if (type === 'tree') {
            this.shaking = false;
            this.shakeTimer = 0;
            this.shakeDuration = 0.6;
            this.leaves = []; // falling leaf particles
        }

        // --- Y positioning ---
        const spriteH = this.texture.height * scale;

        if (type === 'pothole') {
            // Pothole is embedded deeper in ground
            this.y = groundSurface + 18;
        } else if (type === 'tree') {
            // Tree sprite bottom on ground, AABB at canopy
            this.y = groundSurface + spriteH / 2;
            // Tree is 100px * 3 = 300px. Canopy = rows 0-41 = 42*3 = 126px
            // Canopy center Y (game coords) = groundSurface + 300 - 63 = groundSurface + 237
            this.canopyY = groundSurface + spriteH - (42 * scale) / 2;
        } else {
            // Ground obstacles: center based on sprite height
            this.y = groundSurface + spriteH / 2;
        }
    }

    /**
     * Generate a unique random rock by modifying the base rock pixel data.
     * Toggles 2-4 edge pixels and adds 1-3 dark shadow spots.
     */
    _generateRandomRock() {
        // Deep copy the base rock data
        const pixels = rockBaseData.map(row => [...row]);
        const h = pixels.length;
        const w = pixels[0].length;

        // Toggle 2-4 edge pixels (add or remove)
        const edgeToggles = 2 + Math.floor(Math.random() * 3);
        for (let t = 0; t < edgeToggles; t++) {
            const row = Math.floor(Math.random() * h);
            const col = Math.floor(Math.random() * w);
            // Find edge pixels (non-zero adjacent to zero, or zero adjacent to non-zero)
            if (pixels[row][col] === 0) {
                // Check if adjacent to non-zero → add a pixel
                const neighbors = [];
                if (row > 0) neighbors.push(pixels[row - 1][col]);
                if (row < h - 1) neighbors.push(pixels[row + 1][col]);
                if (col > 0) neighbors.push(pixels[row][col - 1]);
                if (col < w - 1) neighbors.push(pixels[row][col + 1]);
                if (neighbors.some(n => n > 0)) {
                    pixels[row][col] = Math.random() < 0.5 ? 2 : 3;
                }
            } else {
                // Check if adjacent to zero → remove the pixel
                const neighbors = [];
                if (row > 0) neighbors.push(pixels[row - 1][col]);
                if (row < h - 1) neighbors.push(pixels[row + 1][col]);
                if (col > 0) neighbors.push(pixels[row][col - 1]);
                if (col < w - 1) neighbors.push(pixels[row][col + 1]);
                if (neighbors.some(n => n === 0)) {
                    pixels[row][col] = 0;
                }
            }
        }

        // Add 1-3 dark shadow spots (change some pixels to index 3)
        const shadowSpots = 1 + Math.floor(Math.random() * 3);
        for (let s = 0; s < shadowSpots; s++) {
            const row = 2 + Math.floor(Math.random() * (h - 4));
            const col = 2 + Math.floor(Math.random() * (w - 4));
            if (pixels[row][col] > 0 && pixels[row][col] !== 3) {
                pixels[row][col] = 3;
            }
        }

        return renderSprite(pixels, Palettes.objects);
    }

    /**
     * Start pothole fall-in animation (called from player.fallInHole)
     */
    startFallAnimation() {
        this.activeFallAnim = true;
        this.fallAnimPhase = 'fallIn';
        this.fallAnimTimer = 0;
        this.eyeBlinkTimer = 0;
        this.eyesOpen = true;
    }

    /**
     * Start tree shake animation + spawn falling leaves (called on collision)
     */
    startShake() {
        if (this.shaking) return;
        this.shaking = true;
        this.shakeTimer = 0;
        // Spawn 8-14 leaves from canopy area (wider for bigger tree)
        const scale = Config.pixelScale;
        const numLeaves = 8 + Math.floor(Math.random() * 7);
        for (let i = 0; i < numLeaves; i++) {
            this.leaves.push({
                x: this.x + (Math.random() - 0.5) * 100,
                screenY: 0, // will be set relative to canopy top
                vy: 20 + Math.random() * 40,     // fall speed (screen pixels/s)
                vx: (Math.random() - 0.5) * 30,  // horizontal drift
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 4,
                alpha: 1.0,
                startDelay: Math.random() * 0.3,  // stagger leaf drops
                grounded: false,
            });
        }
    }

    /**
     * Knock over the trash can (called on player collision)
     */
    knockOver() {
        if (this.knocked) return;
        this.knocked = true;
        this.knockPhase = 'falling';
        this.knockTimer = 0;
    }

    /**
     * Update animation states.
     */
    update(dt) {
        // Trash can fly animation (only if not knocked)
        if (this.type === 'trashCan') {
            if (this.knocked) {
                this.knockTimer += dt;
                if (this.knockPhase === 'falling' && this.knockTimer >= 0.2) {
                    this.knockPhase = 'spilled';
                }
            } else {
                this.flyTimer += dt;
                if (this.flyTimer >= 0.15) {
                    this.flyTimer -= 0.15;
                    this.flyFrame = (this.flyFrame + 1) % 2;
                }
            }
        }

        // Pothole fall animation (0.33s fall-in + 1.27s eyes = 1.6s total)
        if (this.type === 'pothole' && this.activeFallAnim) {
            this.fallAnimTimer += dt;
            if (this.fallAnimPhase === 'fallIn' && this.fallAnimTimer >= 0.33) {
                this.fallAnimPhase = 'eyes';
                this.fallAnimTimer = 0;
                this.eyeBlinkTimer = 0;
                this.eyesOpen = true;
            }
            if (this.fallAnimPhase === 'eyes') {
                this.eyeBlinkTimer += dt;
                if (this.eyeBlinkTimer >= 0.25) {
                    this.eyeBlinkTimer -= 0.25;
                    this.eyesOpen = !this.eyesOpen;
                }
                if (this.fallAnimTimer >= 1.27) {
                    this.activeFallAnim = false;
                    this.fallAnimPhase = null;
                }
            }
        }

        // Tree shake animation + falling leaves
        if (this.type === 'tree' && this.shaking) {
            this.shakeTimer += dt;
            if (this.shakeTimer >= this.shakeDuration) {
                this.shaking = false;
            }
        }
        if (this.type === 'tree' && this.leaves.length > 0) {
            const sidewalkH = 16 * Config.pixelScale;
            const groundScreenY = Config.sceneHeight - sidewalkH;
            for (let i = this.leaves.length - 1; i >= 0; i--) {
                const leaf = this.leaves[i];
                if (leaf.startDelay > 0) {
                    leaf.startDelay -= dt;
                    continue;
                }
                if (!leaf.grounded) {
                    leaf.screenY += leaf.vy * dt;
                    leaf.x += leaf.vx * dt;
                    leaf.rotation += leaf.rotSpeed * dt;
                    // Check if leaf hit ground level
                    // Leaf starts from canopy top area (~row 0 of sprite)
                    const spriteH = this.texture.height * Config.pixelScale;
                    const treeScreenTop = Config.sceneHeight - sidewalkH - spriteH;
                    if (treeScreenTop + leaf.screenY >= groundScreenY - 4) {
                        leaf.grounded = true;
                        leaf.screenY = groundScreenY - treeScreenTop - 4;
                        leaf.alpha = 0.8;
                    }
                } else {
                    // Grounded leaves fade slowly
                    leaf.alpha -= dt * 0.15;
                    if (leaf.alpha <= 0) {
                        this.leaves.splice(i, 1);
                    }
                }
            }
        }
    }

    /**
     * Returns AABB for collision detection.
     */
    getAABB() {
        const scale = Config.pixelScale;
        const size = BODY_SIZES[this.type];

        // Knocked trash can has no collision
        if (this.type === 'trashCan' && this.knocked) {
            return { x: this.x, y: this.y, hw: 0, hh: 0 };
        }

        // Tree: AABB only at canopy
        if (this.type === 'tree') {
            return {
                x: this.x,
                y: this.canopyY,
                hw: (size.w * scale) / 2,
                hh: (size.h * scale) / 2,
            };
        }

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

        // Select texture based on state
        let texture = this.texture;

        if (this.type === 'trashCan') {
            if (this.knocked) {
                texture = this.knockPhase === 'falling'
                    ? TC.trashCanFallingTex
                    : TC.trashCanSpilledTex;
            } else {
                texture = TC.trashCanFliesFrames[this.flyFrame];
            }
        } else if (this.type === 'bench' && this.benchVariant >= 0) {
            texture = TC.benchWithPersonFrames[this.benchVariant];
        } else if (this.type === 'pothole' && this.activeFallAnim) {
            if (this.fallAnimPhase === 'fallIn') {
                // Composite draw: hole + character body
                this._drawPotholeFallIn(ctx, cameraX);
                return;
            } else if (this.fallAnimPhase === 'eyes') {
                texture = this.eyesOpen ? TC.potholeEyes : TC.potholeEyesClosed;
            }
        }

        const w = texture.width * scale;
        const h = texture.height * scale;
        let screenX = this.x - cameraX - w / 2;

        // Position sprite so bottom is on top of sidewalk
        const sidewalkH = 16 * scale; // sidewalk tile height = 48px
        let screenY = Config.sceneHeight - sidewalkH - h;

        // Pothole: sink deeper into ground
        if (this.type === 'pothole') {
            screenY = Config.sceneHeight - sidewalkH - h + 18;
        }

        ctx.imageSmoothingEnabled = false;

        // Tree: shake effect (oscillate X)
        if (this.type === 'tree' && this.shaking) {
            const progress = this.shakeTimer / this.shakeDuration;
            const shakeAmount = 4 * (1 - progress) * Math.sin(this.shakeTimer * 30);
            screenX += shakeAmount;
        }

        ctx.drawImage(texture, screenX, screenY, w, h);

        // Tree: draw falling leaves
        if (this.type === 'tree' && this.leaves.length > 0) {
            const leafTex = TC.leafTex;
            if (leafTex) {
                const leafW = leafTex.width * scale;
                const leafH = leafTex.height * scale;
                const spriteH = this.texture.height * scale;
                const treeScreenTop = Config.sceneHeight - sidewalkH - spriteH;

                for (const leaf of this.leaves) {
                    if (leaf.startDelay > 0) continue;
                    const lx = leaf.x - cameraX - leafW / 2;
                    const ly = treeScreenTop + leaf.screenY;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, leaf.alpha);
                    ctx.translate(lx + leafW / 2, ly + leafH / 2);
                    ctx.rotate(leaf.rotation);
                    ctx.drawImage(leafTex, -leafW / 2, -leafH / 2, leafW, leafH);
                    ctx.restore();
                }
            }
        }
    }

    /**
     * Draw composite pothole fall-in: hole sprite + character body sprite
     */
    _drawPotholeFallIn(ctx, cameraX) {
        const scale = Config.pixelScale;
        const sidewalkH = 16 * scale;

        // Draw hole first (behind body)
        const holeTex = TC.potholeFallInHoleTex;
        const holeW = holeTex.width * scale;
        const holeH = holeTex.height * scale;
        const holeScreenX = this.x - cameraX - holeW / 2;
        const holeScreenY = Config.sceneHeight - sidewalkH - holeH + 18;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(holeTex, holeScreenX, holeScreenY, holeW, holeH);

        // Draw body on top (character-colored)
        const bodyTex = this.characterType === 'jo'
            ? TC.potholeFallInBodyJo
            : TC.potholeFallInBodyEmi;
        const bodyW = bodyTex.width * scale;
        const bodyH = bodyTex.height * scale;
        const bodyScreenX = this.x - cameraX - bodyW / 2;
        // Body emerges from hole: bottom of body aligns with top of hole
        const bodyScreenY = holeScreenY - bodyH + 6;

        ctx.drawImage(bodyTex, bodyScreenX, bodyScreenY, bodyW, bodyH);
    }
}
