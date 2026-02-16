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
    SPRINTING: 'sprinting',
    LEVEL_COMPLETE: 'levelComplete',
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

        // Sprint behavior
        this.sprintTimer = 0;
        this.sprintDuration = 2 + Math.random() * 1.5;
        this.timeSinceLastSprint = 0;
        this.nextSprintAt = 20 + Math.random() * 20; // 20-40s between sprints

        // Level complete target
        this.levelCompleteTargetX = 0;

        this.alive = true;
    }

    /**
     * Start level complete behavior — run to parents and sit.
     * @param {number} targetX - X position to run to (next to parents)
     */
    startLevelComplete(targetX) {
        this.levelCompleteTargetX = targetX;
        this.state = STATES.LEVEL_COMPLETE;
        this.frame = 0;
        this.animTimer = 0;
    }

    update(dt, playerX, joggers, skaters) {
        if (!this.alive) return;

        this.timeSinceLastSniff += dt;
        this.timeSinceLastSprint += dt;

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
            case STATES.SPRINTING:
                this._updateSprinting(dt, playerX);
                break;
            case STATES.LEVEL_COMPLETE:
                this._updateLevelComplete(dt);
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
        // Target position: close behind player
        const targetX = playerX - 45;
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

        // Random sprint trigger (run ahead of player then come back)
        if (this.timeSinceLastSprint >= this.nextSprintAt && Math.random() < 0.5 * dt) {
            this.state = STATES.SPRINTING;
            this.sprintTimer = 0;
            this.sprintDuration = 2 + Math.random() * 1.5;
            this.timeSinceLastSprint = 0;
            this.nextSprintAt = 20 + Math.random() * 20;
            this.frame = 0;
            this.animTimer = 0;
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
            if (playerX - this.x > 300) {
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
        const targetX = playerX - 45;
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
        if (Math.abs(diff) < 60) {
            this.state = STATES.RUNNING;
            this.frame = 0;
            this.animTimer = 0;
        }
    }

    _updateSprinting(dt, playerX) {
        this.sprintTimer += dt;

        // Sprint ahead of player at 2x speed
        const sprintTargetX = playerX + 200;
        const diff = sprintTargetX - this.x;
        this.x += Math.sign(diff) * Config.walkSpeed * 2.0 * dt;

        // Fast run animation
        this.animTimer += dt;
        if (this.animTimer >= 0.08) {
            this.animTimer -= 0.08;
            this.frame = (this.frame + 1) % 2;
        }

        // End sprint: duration elapsed or far enough ahead
        if (this.sprintTimer >= this.sprintDuration || this.x > playerX + 250) {
            this.state = STATES.RETURNING;
            this.frame = 0;
            this.animTimer = 0;
        }
    }

    _updateLevelComplete(dt) {
        const diff = this.levelCompleteTargetX - this.x;

        if (Math.abs(diff) > 10) {
            // Run toward parents at 1.3x speed
            this.x += Math.sign(diff) * Config.walkSpeed * 1.3 * dt;

            // Run animation
            this.animTimer += dt;
            if (this.animTimer >= 0.10) {
                this.animTimer -= 0.10;
                this.frame = (this.frame + 1) % 2;
            }
        } else {
            // Arrived — sit down
            this.x = this.levelCompleteTargetX;
            this.state = STATES.SITTING;
            this.sitTimer = 99; // don't auto-transition back to running
            this.sitDuration = 999;
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
            default: // running, chasing, returning, sprinting, levelComplete
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
