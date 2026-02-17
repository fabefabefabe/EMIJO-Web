// Obstacle Entity - static obstacles on the sidewalk
import { Config } from '../config.js';
import * as TC from '../textureCache.js';
import { renderSprite } from '../renderer.js';
import { Palettes } from '../palettes.js';
import { rock as rockBaseData } from '../sprites/obstaclePixels.js';

// Body sizes in pixel art pixels (before scaling)
const BODY_SIZES = {
    rock:           { w: 14, h: 10 },
    bench:          { w: 22, h: 14 },
    trashCan:       { w: 10, h: 18 },
    pothole:        { w: 18, h: 8 },
    cooler:         { w: 16, h: 12 },
    tree:           { w: 36, h: 40 },  // canopy AABB (doubled)
    beachBall:      { w: 12, h: 10 },  // like rock
    beachUmbrella:  { w: 28, h: 35 },  // canopy AABB (like tree)
};

// Texture lookup (default textures)
const TEXTURES = {
    rock:           () => TC.rock,
    bench:          () => TC.bench,
    trashCan:       () => TC.trashCan,
    pothole:        () => TC.potholeFlat,
    cooler:         () => TC.cooler,
    tree:           () => TC.tree,
    beachBall:      () => TC.beachBallTex,
    beachUmbrella:  () => TC.beachUmbrellaTex,
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
        } else if (type === 'beachUmbrella' && TC.coloredUmbrellaTex && TC.coloredUmbrellaTex.length > 0) {
            // Pick a random colored parasol texture
            this.texture = TC.coloredUmbrellaTex[Math.floor(Math.random() * TC.coloredUmbrellaTex.length)];
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

        // --- Tree / beach umbrella: shake + falling leaves state ---
        if (type === 'tree') {
            this.shaking = false;
            this.shakeTimer = 0;
            this.shakeDuration = 0.6;
            this.leaves = []; // falling leaf particles
        }
        if (type === 'beachUmbrella') {
            this.shaking = false;
            this.shakeTimer = 0;
            this.shakeDuration = 0.5;
            this.leaves = []; // not used but keeps tree-like interface
            // Sway animation
            this.swayTimer = Math.random() * Math.PI * 2; // random start phase
            this.swayAngle = 0;
        }

        // --- Beach ball: kickable physics ---
        if (type === 'beachBall') {
            this.kicked = false;
            this.kickVx = 0;
            this.kickVy = 0;
            this.kickY = 0; // height offset from ground
            this.kickRotation = 0;
            this.kickLifeTimer = 0;
        }

        this.alive = true;

        // --- Y positioning ---
        const spriteH = this.texture.height * scale;

        if (type === 'pothole') {
            // Pothole is embedded deeper in ground
            this.y = groundSurface + 21;
        } else if (type === 'tree') {
            // Tree sprite bottom on ground, AABB at canopy
            this.y = groundSurface + spriteH / 2;
            this.canopyY = groundSurface + spriteH - (42 * scale) / 2;
        } else if (type === 'beachUmbrella') {
            // Umbrella bottom on ground, collision at canopy top half
            this.y = groundSurface + spriteH / 2;
            // Canopy is top ~29 rows of 58. Center at spriteH - 29*scale/2
            this.canopyY = groundSurface + spriteH - (29 * scale) / 2;
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
        // Cache speech bubble text (rendered once)
        if (!this._speechBubbleText) {
            this._speechBubbleText = TC.renderTextBlack('DUUH, QUIEN APAGO LAS LUCES?');
        }
        this.speechBubbleAlpha = 0;
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
                vy: 240 + Math.random() * 480,    // fall speed (screen pixels/s) - doubled
                vx: (Math.random() - 0.5) * 360,  // horizontal drift - doubled
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 48, // doubled
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

        // Pothole fall animation (0.33s fall-in + 1.77s eyes = 2.1s total)
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
                // Fade in speech bubble
                if (this.speechBubbleAlpha < 1) {
                    this.speechBubbleAlpha = Math.min(1, this.speechBubbleAlpha + dt * 3);
                }
                if (this.fallAnimTimer >= 1.77) {
                    this.activeFallAnim = false;
                    this.fallAnimPhase = null;
                }
            }
        }

        // Beach umbrella sway animation (gentle oscillation)
        if (this.type === 'beachUmbrella') {
            this.swayTimer += dt;
            this.swayAngle = Math.sin(this.swayTimer * 2.0) * 0.07; // ~1.7 degrees max
        }

        // Tree / umbrella shake animation + falling leaves
        if ((this.type === 'tree' || this.type === 'beachUmbrella') && this.shaking) {
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
                    leaf.alpha -= dt * 0.30;
                    if (leaf.alpha <= 0) {
                        this.leaves.splice(i, 1);
                    }
                }
            }
        }

        // Beach ball kick physics
        if (this.type === 'beachBall' && this.kicked) {
            this.kickLifeTimer += dt;
            this.kickVx *= Math.pow(0.99, dt * 60); // air resistance (frame-rate independent)
            this.x += this.kickVx * dt;
            this.kickVy += 400 * dt; // gravity (lighter ball = less gravity)
            this.kickY -= this.kickVy * dt;
            this.kickRotation += 8 * dt; // spin

            // Bounce on ground
            if (this.kickY <= 0) {
                this.kickY = 0;
                this.kickVy = -this.kickVy * 0.5; // bounce with energy loss
                if (Math.abs(this.kickVy) < 20) {
                    this.kickVy = 0; // stop bouncing
                }
            }

            // Mark dead when slowed or after 3 seconds
            if (this.kickVx < 5 || this.kickLifeTimer > 3) {
                this.alive = false;
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

        // Kicked beach ball: real AABB for hitting joggers/skaters (no player collision)
        if (this.type === 'beachBall' && this.kicked) {
            const spriteH = this.texture.height * scale;
            return { x: this.x, y: this.groundSurface + spriteH / 2 + this.kickY, hw: 6 * scale, hh: 6 * scale };
        }

        // Rabbit-marker tree has no collision (player walks through)
        if ((this.type === 'tree' || this.type === 'beachUmbrella') && this.isDogTree) {
            return { x: this.x, y: this.y, hw: 0, hh: 0 };
        }

        // Tree / beach umbrella: AABB only at canopy
        if (this.type === 'tree' || this.type === 'beachUmbrella') {
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
        } else if (this.type === 'pothole') {
            const isNight = this.timeOfDay === 'night';
            if (this.activeFallAnim) {
                if (this.fallAnimPhase === 'fallIn') {
                    this._drawPotholeFallIn(ctx, cameraX);
                    return;
                } else if (this.fallAnimPhase === 'eyes') {
                    if (isNight) {
                        texture = this.eyesOpen ? TC.potholeEyesNight : TC.potholeEyesClosedNight;
                    } else {
                        texture = this.eyesOpen ? TC.potholeEyes : TC.potholeEyesClosed;
                    }
                }
            } else if (isNight) {
                texture = TC.potholeFlatNight;
            }
        }

        // Kicked beach ball: draw with rotation and height offset, then return
        if (this.type === 'beachBall' && this.kicked) {
            const w = texture.width * scale;
            const h = texture.height * scale;
            const sidewalkH = 16 * scale;
            const baseScreenY = Config.sceneHeight - sidewalkH - h;
            const kickScreenY = baseScreenY - this.kickY;
            const kickScreenX = this.x - cameraX - w / 2;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            const cx = kickScreenX + w / 2;
            const cy = kickScreenY + h / 2;
            ctx.translate(cx, cy);
            ctx.rotate(this.kickRotation);
            ctx.drawImage(texture, -w / 2, -h / 2, w, h);
            ctx.restore();
            return;
        }

        const w = texture.width * scale;
        const h = texture.height * scale;
        let screenX = this.x - cameraX - w / 2;

        // Position sprite so bottom is on top of sidewalk
        const sidewalkH = 16 * scale; // sidewalk tile height = 48px
        let screenY = Config.sceneHeight - sidewalkH - h;

        // Pothole: sink deeper into ground
        if (this.type === 'pothole') {
            screenY = Config.sceneHeight - sidewalkH - h + 21;
        }

        ctx.imageSmoothingEnabled = false;

        // Shadow (day only, not for potholes)
        if (this.timeOfDay === 'day' && this.type !== 'pothole') {
            const shadowW = w * 0.85;
            const shadowH = Math.max(4, w * 0.15);
            const shadowX = screenX + w / 2 - shadowW / 2 + 3;
            const shadowY = screenY + h - shadowH * 0.3 + 3;
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(shadowX + shadowW / 2, shadowY, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Tree / umbrella: shake → rotation around base (sway effect)
        let needsRotRestore = false;
        if ((this.type === 'tree' || this.type === 'beachUmbrella') && this.shaking) {
            const progress = this.shakeTimer / this.shakeDuration;
            const decay = 1 - progress;
            const swayRot = decay * 0.04 * Math.sin(this.shakeTimer * 18);
            ctx.save();
            const pivotX = screenX + w / 2;
            const pivotY = screenY + h;
            ctx.translate(pivotX, pivotY);
            ctx.rotate(swayRot);
            ctx.translate(-pivotX, -pivotY);
            needsRotRestore = true;
        }

        // Beach umbrella: sway rotation around pole base
        if (this.type === 'beachUmbrella' && this.swayAngle) {
            if (!needsRotRestore) ctx.save();
            const pivotX = screenX + w / 2;
            const pivotY = screenY + h;
            ctx.translate(pivotX, pivotY);
            ctx.rotate(this.swayAngle);
            ctx.translate(-pivotX, -pivotY);
            ctx.drawImage(texture, screenX, screenY, w, h);
            ctx.restore();
            needsRotRestore = false;
        } else {
            ctx.drawImage(texture, screenX, screenY, w, h);
            if (needsRotRestore) ctx.restore();
        }

        // Speech bubble during pothole eyes phase — deferred to separate pass for z-order
        if (this.type === 'pothole' && this.activeFallAnim && this.fallAnimPhase === 'eyes' && this._speechBubbleText) {
            this._pendingSpeechBubble = { centerX: screenX + w / 2, topY: screenY };
        }

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
        const isNight = this.timeOfDay === 'night';
        const holeTex = isNight ? TC.potholeFallInHoleNightTex : TC.potholeFallInHoleTex;
        const holeW = holeTex.width * scale;
        const holeH = holeTex.height * scale;
        const holeScreenX = this.x - cameraX - holeW / 2;
        const holeScreenY = Config.sceneHeight - sidewalkH - holeH + 21;

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

    /**
     * Draw deferred speech bubble (called from gameScene for correct z-order).
     */
    drawSpeechBubbleDeferred(ctx) {
        if (!this._pendingSpeechBubble) return;
        const { centerX, topY } = this._pendingSpeechBubble;
        this._pendingSpeechBubble = null;
        this._drawSpeechBubble(ctx, centerX, topY);
    }

    /**
     * Draw speech bubble above pothole during eyes phase.
     * Style: warm cream/golden background, dark brown border, pixel text, tail pointing down.
     */
    _drawSpeechBubble(ctx, centerX, potholeTopY) {
        const tex = this._speechBubbleText;
        if (!tex || this.speechBubbleAlpha <= 0) return;

        const scale = Config.pixelScale;
        const textScale = scale * 0.45;
        const textW = tex.width * textScale;
        const textH = tex.height * textScale;

        const padX = 14;
        const padY = 10;
        const bubbleW = textW + padX * 2;
        const bubbleH = textH + padY * 2;
        const tailH = 10;
        const cornerR = 6;

        // Position bubble above pothole
        const bubbleX = centerX - bubbleW / 2;
        const bubbleY = potholeTopY - bubbleH - tailH - 4;

        ctx.save();
        ctx.globalAlpha = this.speechBubbleAlpha;

        // --- Bubble body (rounded rect) ---
        ctx.beginPath();
        ctx.moveTo(bubbleX + cornerR, bubbleY);
        ctx.lineTo(bubbleX + bubbleW - cornerR, bubbleY);
        ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + cornerR);
        ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - cornerR);
        ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - cornerR, bubbleY + bubbleH);
        ctx.lineTo(bubbleX + cornerR, bubbleY + bubbleH);
        ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - cornerR);
        ctx.lineTo(bubbleX, bubbleY + cornerR);
        ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + cornerR, bubbleY);
        ctx.closePath();

        // Fill with warm cream/golden
        ctx.fillStyle = '#FFF2CC';
        ctx.fill();
        // Dark brown border
        ctx.strokeStyle = '#8B5E3C';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // --- Tail (triangle pointing down) ---
        const tailX = centerX;
        const tailTopY = bubbleY + bubbleH;
        ctx.beginPath();
        ctx.moveTo(tailX - 8, tailTopY - 1);
        ctx.lineTo(tailX, tailTopY + tailH);
        ctx.lineTo(tailX + 8, tailTopY - 1);
        ctx.closePath();
        ctx.fillStyle = '#FFF2CC';
        ctx.fill();
        // Draw tail border lines (only the two outer edges, not the top)
        ctx.beginPath();
        ctx.moveTo(tailX - 8, tailTopY - 1);
        ctx.lineTo(tailX, tailTopY + tailH);
        ctx.lineTo(tailX + 8, tailTopY - 1);
        ctx.strokeStyle = '#8B5E3C';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Cover the tail top join line (fill over the border between bubble and tail)
        ctx.fillStyle = '#FFF2CC';
        ctx.fillRect(tailX - 7, tailTopY - 2, 14, 4);

        // --- Text ---
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = this.speechBubbleAlpha;
        const textX = bubbleX + padX;
        const textY = bubbleY + padY;
        ctx.drawImage(tex, textX, textY, textW, textH);

        ctx.restore();
    }
}
