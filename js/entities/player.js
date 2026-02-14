// Player Entity - auto-runner with jump, trip/fall, health, invincibility
import { Config } from '../config.js';
import { getCharacterTextures } from '../textureCache.js';
import { drawSprite } from '../renderer.js';

const STATES = {
    WALKING: 'walking',
    JUMPING: 'jumping',
    TRIPPING: 'tripping',
    LYING: 'lying',
    GETTING_UP: 'gettingUp',
    FALLING_IN_HOLE: 'fallingInHole',
};

export class Player {
    constructor(characterType, level = 1) {
        this.characterType = characterType;
        this.textures = getCharacterTextures(characterType);

        // Position (game coords, Y-up)
        this.x = Config.startBuffer / 2;
        this.y = Config.groundSurface + 150; // Start slightly above ground (scaled 3x)
        this.vx = 0;
        this.vy = 0;

        // State machine (auto-runner: always walking forward)
        this.state = STATES.WALKING;
        this.facingRight = true;
        this.isOnGround = false;

        // Walk animation
        this.walkFrame = 0;
        this.walkTimer = 0;

        // Health
        this.energy = Config.maxEnergy;
        this.isAlive = true;

        // Invincibility
        this.isInvincible = false;
        this.invTimer = 0;
        this.blinkTimer = 0;
        this.alpha = 1.0;

        // Trip animation
        this.tripTimer = 0;
        this.tripPhase = ''; // 'fall' or 'getUp'
        this.fallMomentum = 0; // Momentum when falling (inercia)

        // Visibility (for family hug animation)
        this.visible = true;

        // Pothole fall-in state
        this.potholeTimer = 0;
        this.potholeObstacle = null;

        // Jump requested by tap/click (consumed on next frame)
        this.jumpRequested = false;

        // Progressive speed: level 1 starts slow, increases each level
        // Level 1: 0.55x, Level 6: 1.00x, Level 10: 1.36x, Level 15: 1.81x
        this.levelSpeedMultiplier = 0.55 + (level - 1) * 0.09;
    }

    get energyFraction() {
        return this.energy / Config.maxEnergy;
    }

    /**
     * Called by gameScene.onClick to request a jump (tap/click).
     */
    requestJump() {
        this.jumpRequested = true;
    }

    /**
     * Returns AABB for collision detection.
     * Center-based: {x, y, hw, hh} (half-widths)
     */
    getAABB() {
        const scale = Config.pixelScale;
        const hw = (10 * scale) / 2;
        const hh = (26 * scale) / 2;
        return { x: this.x, y: this.y, hw, hh };
    }

    /**
     * Main update - called every frame.
     */
    update(dt, input, cameraX = 0) {
        // Update invincibility
        this._updateInvincibility(dt);

        // Update trip animation
        if (this.state === STATES.FALLING_IN_HOLE) {
            this._updatePotholeSequence(dt);
        } else if (this.state === STATES.TRIPPING || this.state === STATES.LYING || this.state === STATES.GETTING_UP) {
            this._updateTripSequence(dt);
        } else {
            // Auto-run + jump input
            this._handleInput(input, dt);
        }

        // Physics
        this._applyPhysics(dt);

        // Ground check
        this._checkGround();

        // Clamp: can't go behind camera left edge, no right limit
        this.x = Math.max(cameraX + 30, this.x);
    }

    _handleInput(input, dt) {
        // Auto-runner: always move forward
        const runSpeed = Config.walkSpeed * this.levelSpeedMultiplier;

        if (this.state === STATES.WALKING) {
            this.vx = runSpeed;
            this.facingRight = true;
            this._advanceWalkAnim(dt);

            // Jump on input OR tap request
            if ((input.isJumping || this.jumpRequested) && this.isOnGround) {
                this.jumpRequested = false;
                this._enterJump();
            } else {
                this.jumpRequested = false; // consume even if can't jump
            }
        } else if (this.state === STATES.JUMPING) {
            // Maintain forward speed in air
            this.vx = runSpeed;
            this.jumpRequested = false;
        }
    }

    _enterJump() {
        if (!this.isOnGround) return;
        this.state = STATES.JUMPING;
        this.isOnGround = false;
        this.vy = Config.jumpImpulse;
    }

    _advanceWalkAnim(dt) {
        this.walkTimer += dt;
        if (this.walkTimer >= 0.12) {
            this.walkTimer -= 0.12;
            this.walkFrame = (this.walkFrame + 1) % 6;
        }
    }

    _applyPhysics(dt) {
        // Gravity (game coords: Y-up, gravity is negative)
        this.vy += Config.gravity * dt;
        this.y += this.vy * dt;
        this.x += this.vx * dt;
    }

    _checkGround() {
        const groundSurface = Config.groundSurface;
        if (this.y <= groundSurface) {
            this.y = groundSurface;
            this.vy = 0;
            if (!this.isOnGround) {
                this.isOnGround = true;
                if (this.state === STATES.JUMPING) {
                    // Auto-runner: land → resume walking (not idle)
                    this.state = STATES.WALKING;
                }
            }
        }
    }

    /**
     * Called when player hits an obstacle.
     * @returns {boolean} true if player actually fell, false if blocked
     */
    tripAndFall() {
        if (this.state === STATES.TRIPPING || this.state === STATES.LYING || this.state === STATES.GETTING_UP) return false;
        if (this.isInvincible) return false;

        this.state = STATES.TRIPPING;

        // Save momentum for falling inertia (slide in direction of movement)
        this.fallMomentum = this.vx * 0.5;
        this.vx = 0;
        this.tripTimer = 0;
        this.tripPhase = 'fall';

        // Take damage
        this.energy = Math.max(0, this.energy - Config.damagePerHit);
        if (this.energy <= 0) {
            this.isAlive = false;
        }

        return true; // Actually fell
    }

    _updateTripSequence(dt) {
        this.tripTimer += dt;

        // Apply falling momentum (inertia) during fall phase
        if (this.tripPhase === 'fall' && this.fallMomentum) {
            this.x += this.fallMomentum * dt;
            this.fallMomentum *= 0.85; // Decay
            // Stop if very small
            if (Math.abs(this.fallMomentum) < 1) {
                this.fallMomentum = 0;
            }
        }

        // Faster animation: fall (0.15s) → lying (0.25s) → getUp (0.15s)
        if (this.tripPhase === 'fall' && this.tripTimer >= 0.15) {
            this.state = STATES.LYING;
            this.tripPhase = 'lying';
            this.tripTimer = 0;
            this.fallMomentum = 0; // Stop sliding when lying
        } else if (this.tripPhase === 'lying' && this.tripTimer >= 0.25) {
            this.state = STATES.GETTING_UP;
            this.tripPhase = 'getUp';
            this.tripTimer = 0;
        } else if (this.tripPhase === 'getUp' && this.tripTimer >= 0.15) {
            // Auto-runner: resume walking after recovery (not idle)
            this.state = STATES.WALKING;
            this.tripPhase = '';
            this.tripTimer = 0;
            // Activate invincibility
            this.isInvincible = true;
            this.invTimer = 0;
            this.blinkTimer = 0;
        }
    }

    /**
     * Called when player falls into a pothole.
     * @param {Obstacle} potholeObstacle - the pothole obstacle
     * @returns {boolean} true if player fell in, false if blocked
     */
    fallInHole(potholeObstacle) {
        if (this.state === STATES.TRIPPING || this.state === STATES.LYING ||
            this.state === STATES.GETTING_UP || this.state === STATES.FALLING_IN_HOLE) return false;
        if (this.isInvincible) return false;

        this.state = STATES.FALLING_IN_HOLE;
        this.vx = 0;
        this.vy = 0;
        this.visible = false;
        this.potholeTimer = 0;
        this.potholeObstacle = potholeObstacle;

        // Take damage
        this.energy = Math.max(0, this.energy - Config.damagePerHit);
        if (this.energy <= 0) {
            this.isAlive = false;
        }

        // Start obstacle animation
        potholeObstacle.startFallAnimation();

        return true;
    }

    _updatePotholeSequence(dt) {
        this.potholeTimer += dt;

        // Total duration: 1.1s (0.33s fall-in + 0.77s eyes)
        if (this.potholeTimer >= 1.1) {
            this.visible = true;
            this.state = STATES.WALKING;
            this.potholeTimer = 0;
            this.potholeObstacle = null;
            // Move past the pothole
            this.x += 30;
            // Activate invincibility
            this.isInvincible = true;
            this.invTimer = 0;
            this.blinkTimer = 0;
        }
    }

    _updateInvincibility(dt) {
        if (!this.isInvincible) {
            this.alpha = 1.0;
            return;
        }

        this.invTimer += dt;
        this.blinkTimer += dt;

        // Blink effect
        if (this.blinkTimer >= Config.blinkInterval) {
            this.alpha = this.alpha > 0.5 ? 0.3 : 1.0;
            this.blinkTimer -= Config.blinkInterval;
        }

        // End invincibility
        if (this.invTimer >= Config.invincibilityDuration) {
            this.isInvincible = false;
            this.alpha = 1.0;
        }
    }

    /**
     * Gets the current texture based on state and animation frame.
     */
    getCurrentTexture() {
        switch (this.state) {
            case STATES.WALKING:
                return this.textures.walk[this.walkFrame];
            case STATES.JUMPING:
                return this.textures.jump;
            case STATES.TRIPPING:
                return this.textures.fall;
            case STATES.LYING:
                return this.textures.lyingDown;
            case STATES.GETTING_UP:
                return this.textures.getUp;
            case STATES.FALLING_IN_HOLE:
                return this.textures.idle; // Not drawn (visible=false)
            default:
                return this.textures.idle;
        }
    }

    /**
     * Draws the player on the canvas.
     */
    draw(ctx, cameraX) {
        if (!this.visible) return;
        const texture = this.getCurrentTexture();
        const scale = Config.pixelScale;
        const screenX = this.x - cameraX;
        // Position sprite so feet are at groundSurface when y = groundSurface
        const spriteH = texture.height * scale;
        const sidewalkH = 16 * scale; // sidewalk tile height
        const screenY = Config.sceneHeight - sidewalkH - spriteH - (this.y - Config.groundSurface);

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.imageSmoothingEnabled = false;

        const w = texture.width * scale;
        const h = texture.height * scale;
        const drawX = screenX - w / 2;

        if (!this.facingRight) {
            ctx.translate(drawX + w, screenY);
            ctx.scale(-1, 1);
            ctx.drawImage(texture, 0, 0, w, h);
        } else {
            ctx.drawImage(texture, drawX, screenY, w, h);
        }

        ctx.restore();
    }

    /**
     * Resets player to starting state.
     */
    reset() {
        this.x = Config.startBuffer / 2;
        this.y = Config.groundSurface; // start on ground
        this.vx = 0;
        this.vy = 0;
        this.state = STATES.WALKING;
        this.facingRight = true;
        this.isOnGround = false;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.energy = Config.maxEnergy;
        this.isAlive = true;
        this.isInvincible = false;
        this.invTimer = 0;
        this.blinkTimer = 0;
        this.alpha = 1.0;
        this.tripTimer = 0;
        this.tripPhase = '';
        this.fallMomentum = 0;
        this.potholeTimer = 0;
        this.potholeObstacle = null;
        this.jumpRequested = false;
    }
}
