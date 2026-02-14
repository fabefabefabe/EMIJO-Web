// Player Entity - state machine, custom physics, animations, health, invincibility
import { Config } from '../config.js';
import { getCharacterTextures } from '../textureCache.js';
import { drawSprite } from '../renderer.js';

const STATES = {
    IDLE: 'idle',
    WALKING: 'walking',
    JUMPING: 'jumping',
    CROUCHING: 'crouching',
    TRIPPING: 'tripping',
    LYING: 'lying',
    GETTING_UP: 'gettingUp',
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

        // State machine
        this.state = STATES.IDLE;
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

        // Speed multiplier based on level (increases from level 6+)
        this.levelSpeedMultiplier = level >= 6 ? 1.0 + (level - 5) * 0.05 : 1.0;
    }

    get energyFraction() {
        return this.energy / Config.maxEnergy;
    }

    /**
     * Returns AABB for collision detection.
     * Center-based: {x, y, hw, hh} (half-widths)
     */
    getAABB() {
        const scale = Config.pixelScale;
        const hw = (10 * scale) / 2;
        const hh = this.state === STATES.CROUCHING
            ? (16 * scale) / 2
            : (26 * scale) / 2;
        return { x: this.x, y: this.y, hw, hh };
    }

    /**
     * Main update - called every frame.
     */
    update(dt, input, cameraX = 0) {
        // Update invincibility
        this._updateInvincibility(dt);

        // Update trip animation
        if (this.state === STATES.TRIPPING || this.state === STATES.LYING || this.state === STATES.GETTING_UP) {
            this._updateTripSequence(dt);
        } else {
            // Handle input-based state transitions
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
        switch (this.state) {
            case STATES.IDLE:
                if (input.isJumping && this.isOnGround) {
                    this._enterJump();
                } else if (input.isCrouching) {
                    this._enterCrouch();
                } else if (input.hasMovement) {
                    this._enterWalk(input.horizontalDirection);
                }
                break;

            case STATES.WALKING:
                if (input.isJumping && this.isOnGround) {
                    this._enterJump();
                } else if (input.isCrouching) {
                    this._enterCrouch();
                } else if (!input.hasMovement) {
                    this._enterIdle();
                } else {
                    this._applyMovement(input.horizontalDirection);
                    this._advanceWalkAnim(dt);
                }
                break;

            case STATES.JUMPING:
                // Air control — full speed + preserve momentum
                if (input.hasMovement) {
                    this._applyMovement(input.horizontalDirection, 1.0);
                }
                // If no input, keep existing vx (momentum preserved)
                break;

            case STATES.CROUCHING:
                if (!input.isCrouching) {
                    this._enterIdle();
                } else if (input.hasMovement) {
                    this._applyMovement(input.horizontalDirection, 0.5);
                    this._advanceWalkAnim(dt);
                } else {
                    this.vx = 0;
                }
                break;
        }
    }

    _enterIdle() {
        this.state = STATES.IDLE;
        this.vx = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
    }

    _enterWalk(direction) {
        if (this.state !== STATES.WALKING) {
            this.state = STATES.WALKING;
            this.walkFrame = 0;
            this.walkTimer = 0;
        }
        this._applyMovement(direction);
    }

    _enterJump() {
        if (!this.isOnGround) return;
        this.state = STATES.JUMPING;
        this.isOnGround = false;
        this.vy = Config.jumpImpulse;
    }

    _enterCrouch() {
        this.state = STATES.CROUCHING;
        // Don't zero vx — allow crouch-walking
    }

    _applyMovement(direction, speedMultiplier = 1.0) {
        // Puede ir hacia atrás pero más lento (30% de velocidad)
        if (direction < 0) {
            this.vx = direction * Config.walkSpeed * 0.3 * this.levelSpeedMultiplier;
            this.facingRight = false;
        } else {
            this.vx = direction * Config.walkSpeed * speedMultiplier * this.levelSpeedMultiplier;
            if (direction > 0) this.facingRight = true;
        }
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
                    this._enterIdle();
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
            this.state = STATES.IDLE;
            this.tripPhase = '';
            this.tripTimer = 0;
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
            case STATES.CROUCHING:
                return this.textures.crouch;
            case STATES.TRIPPING:
                return this.textures.fall;
            case STATES.LYING:
                return this.textures.lyingDown;
            case STATES.GETTING_UP:
                return this.textures.getUp;
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
        this.state = STATES.IDLE;
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
    }
}
