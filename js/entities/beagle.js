// Beagle Entity - companion dog that follows the player from level 6+
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

const STATES = {
    SITTING: 'sitting',
    RUNNING: 'running',
    SNIFFING: 'sniffing',
    CHASING: 'chasing',
    RETURNING: 'returning',
    OFFSCREEN: 'offscreen',
};

export class Beagle {
    /**
     * @param {number} startX - Starting X position
     * @param {number} groundSurface - Ground surface Y
     */
    constructor(startX, groundSurface) {
        this.x = startX;
        this.groundSurface = groundSurface;
        this.state = STATES.SITTING;

        // Animation
        this.frame = 0;
        this.animTimer = 0;

        // Sitting timer (sits for 2s at start)
        this.sitTimer = 0;
        this.sitDuration = 2.0;

        // Sniff behavior
        this.sniffTimer = 0;
        this.sniffDuration = 2.5;
        this.nextSniffAt = 15 + Math.random() * 15; // 15-30s between sniffs
        this.timeSinceLastSniff = 0;

        // Chase target
        this.chaseTarget = null;
        this.chaseDuration = 0;
        this.chaseTimer = 0;

        // Offscreen timer (when dog wanders off after sniffing)
        this.offscreenTimer = 0;
        this.offscreenDuration = 4 + Math.random() * 3; // 4-7s offscreen

        // Return speed multiplier
        this.returnSpeedMult = 1.5;

        this.alive = true;
    }

    update(dt, playerX, joggers, skaters) {
        if (!this.alive) return;

        this.timeSinceLastSniff += dt;

        switch (this.state) {
            case STATES.SITTING:
                this._updateSitting(dt, playerX);
                break;
            case STATES.RUNNING:
                this._updateRunning(dt, playerX, joggers, skaters);
                break;
            case STATES.SNIFFING:
                this._updateSniffing(dt, playerX);
                break;
            case STATES.CHASING:
                this._updateChasing(dt, playerX);
                break;
            case STATES.OFFSCREEN:
                this._updateOffscreen(dt, playerX);
                break;
            case STATES.RETURNING:
                this._updateReturning(dt, playerX);
                break;
        }
    }

    _updateSitting(dt, playerX) {
        this.sitTimer += dt;
        // Animate sit frame (slight tail wag)
        this.animTimer += dt;
        if (this.animTimer >= 0.5) {
            this.animTimer -= 0.5;
        }
        if (this.sitTimer >= this.sitDuration) {
            this.state = STATES.RUNNING;
            this.frame = 0;
            this.animTimer = 0;
        }
    }

    _updateRunning(dt, playerX, joggers, skaters) {
        // Target position: slightly behind player
        const targetX = playerX - 80;
        const diff = targetX - this.x;

        // Move toward target
        if (Math.abs(diff) > 5) {
            const speed = Config.walkSpeed * (Math.abs(diff) > 200 ? 1.2 : 0.95);
            this.x += Math.sign(diff) * speed * dt;
        }

        // Run animation (2 frames)
        this.animTimer += dt;
        if (this.animTimer >= 0.12) {
            this.animTimer -= 0.12;
            this.frame = (this.frame + 1) % 2;
        }

        // Random sniff trigger
        if (this.timeSinceLastSniff >= this.nextSniffAt && Math.random() < 0.3 * dt) {
            this.state = STATES.SNIFFING;
            this.sniffTimer = 0;
            this.frame = 0;
            this.animTimer = 0;
            this.timeSinceLastSniff = 0;
            this.nextSniffAt = 15 + Math.random() * 15;
            return;
        }

        // Chase nearby jogger/skater (decorative)
        const allNPCs = [...joggers.filter(j => !j.knocked), ...skaters.filter(s => !s.knocked)];
        for (const npc of allNPCs) {
            if (Math.abs(npc.x - this.x) < 200 && Math.random() < 0.01) {
                this.state = STATES.CHASING;
                this.chaseTarget = npc;
                this.chaseTimer = 0;
                this.chaseDuration = 2 + Math.random() * 2;
                return;
            }
        }
    }

    _updateSniffing(dt, playerX) {
        this.sniffTimer += dt;
        // Sniff animation (2 frames, slower)
        this.animTimer += dt;
        if (this.animTimer >= 0.3) {
            this.animTimer -= 0.3;
            this.frame = (this.frame + 1) % 2;
        }

        if (this.sniffTimer >= this.sniffDuration) {
            // After sniffing, if too far behind player, go offscreen then return
            if (playerX - this.x > 300) {
                this.state = STATES.OFFSCREEN;
                this.offscreenTimer = 0;
                this.offscreenDuration = 3 + Math.random() * 3;
            } else {
                this.state = STATES.RUNNING;
            }
            this.frame = 0;
            this.animTimer = 0;
        }
    }

    _updateChasing(dt, playerX) {
        this.chaseTimer += dt;

        if (this.chaseTarget && this.chaseTarget.alive && !this.chaseTarget.knocked) {
            // Run toward NPC
            const diff = this.chaseTarget.x - this.x;
            this.x += Math.sign(diff) * Config.walkSpeed * 1.1 * dt;
        }

        // Run animation
        this.animTimer += dt;
        if (this.animTimer >= 0.1) {
            this.animTimer -= 0.1;
            this.frame = (this.frame + 1) % 2;
        }

        // Stop chasing after duration or if target gone
        if (this.chaseTimer >= this.chaseDuration ||
            !this.chaseTarget || !this.chaseTarget.alive || this.chaseTarget.knocked) {
            this.chaseTarget = null;
            // Check if we need to return to player
            if (playerX - this.x > 400) {
                this.state = STATES.RETURNING;
            } else {
                this.state = STATES.RUNNING;
            }
            this.frame = 0;
            this.animTimer = 0;
        }
    }

    _updateOffscreen(dt, playerX) {
        this.offscreenTimer += dt;
        // Dog is conceptually offscreen/behind — teleport to behind camera view
        if (this.offscreenTimer >= this.offscreenDuration) {
            // Reappear behind the player, running to catch up
            this.x = playerX - 500;
            this.state = STATES.RETURNING;
            this.frame = 0;
            this.animTimer = 0;
        }
    }

    _updateReturning(dt, playerX) {
        const targetX = playerX - 80;
        const diff = targetX - this.x;

        // Run faster to catch up
        this.x += Math.sign(diff) * Config.walkSpeed * this.returnSpeedMult * dt;

        // Run animation (faster)
        this.animTimer += dt;
        if (this.animTimer >= 0.08) {
            this.animTimer -= 0.08;
            this.frame = (this.frame + 1) % 2;
        }

        // Close enough — switch to normal running
        if (Math.abs(diff) < 100) {
            this.state = STATES.RUNNING;
            this.frame = 0;
            this.animTimer = 0;
        }
    }

    draw(ctx, cameraX) {
        if (!this.alive) return;

        // Don't draw when offscreen
        if (this.state === STATES.OFFSCREEN) return;

        const scale = Config.pixelScale;
        let texture;

        switch (this.state) {
            case STATES.SITTING:
                texture = TC.beagleSitTex;
                break;
            case STATES.SNIFFING:
                texture = this.frame === 0 ? TC.beagleSniff1Tex : TC.beagleSniff2Tex;
                break;
            default: // running, chasing, returning
                texture = this.frame === 0 ? TC.beagleRun1Tex : TC.beagleRun2Tex;
                break;
        }

        if (!texture) return;

        const w = texture.width * scale;
        const h = texture.height * scale;
        const screenX = this.x - cameraX - w / 2;
        const sidewalkH = 16 * scale;
        const screenY = Config.sceneHeight - sidewalkH - h;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(texture, screenX, screenY, w, h);
    }
}
