// Player Entity - auto-runner with jump, trip/fall, health, invincibility, gaucho power
import { Config } from '../config.js';
import { getCharacterTextures, matePickupTex } from '../textureCache.js';
import { drawSprite } from '../renderer.js';

const STATES = {
    WALKING: 'walking',
    JUMPING: 'jumping',
    TRIPPING: 'tripping',
    LYING: 'lying',
    GETTING_UP: 'gettingUp',
    FALLING_IN_HOLE: 'fallingInHole',
    DRINKING_MATE: 'drinkingMate',
};

export class Player {
    constructor(characterType, level = 1, isBeach = false) {
        this.characterType = characterType;
        this.textures = getCharacterTextures(characterType, isBeach);

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

        // Progressive speed: sqrt curve, increases every 20 levels
        // Levels 1-20: 0.55x, 21-40: 0.75x, 41-60: 0.83x, 61-80: 0.88x
        const speedStep = Math.floor((level - 1) / 20);
        this.levelSpeedMultiplier = 0.55 + 0.09 * Math.sqrt(speedStep * 5);

        // Gaucho Power (mate powerup)
        this.gauchoPowerActive = false;
        this.gauchoPowerTimer = 0;
        this.gauchoPowerPhase = 'none'; // 'none', 'drinking', 'active', 'windDown'
        this.gauchoPowerColorTimer = 0;
        this.gauchoPowerHue = 0;
        this.baseSpeedMultiplier = this.levelSpeedMultiplier;
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
     * Start drinking mate — triggers Gaucho Power sequence.
     * @returns {boolean} true if started successfully
     */
    startDrinkingMate() {
        if (this.gauchoPowerPhase !== 'none') return false;
        this.state = STATES.DRINKING_MATE;
        this.vx = 0;
        this.vy = 0;
        this.gauchoPowerActive = true;
        this.gauchoPowerTimer = 0;
        this.gauchoPowerPhase = 'drinking';
        this.jumpRequested = false;
        return true;
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
        // Update invincibility (skip normal invincibility decay during gaucho power)
        if (!this.gauchoPowerActive) {
            this._updateInvincibility(dt);
        }

        // Update trip animation
        if (this.state === STATES.FALLING_IN_HOLE) {
            this._updatePotholeSequence(dt);
        } else if (this.state === STATES.TRIPPING || this.state === STATES.LYING || this.state === STATES.GETTING_UP) {
            this._updateTripSequence(dt);
        } else if (this.state === STATES.DRINKING_MATE) {
            // Drinking mate: player is stopped, no input processed
            this.vx = 0;
            this.jumpRequested = false;
        } else {
            // Auto-run + jump input
            this._handleInput(input, dt);
        }

        // Gaucho Power state machine
        this._updateGauchoPower(dt);

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
        if (this.state === STATES.DRINKING_MATE) return false;
        if (this.gauchoPowerPhase === 'active' || this.gauchoPowerPhase === 'windDown') return false;
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
        if (this.state === STATES.DRINKING_MATE) return false;
        if (this.gauchoPowerPhase === 'active' || this.gauchoPowerPhase === 'windDown') return false;
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

        // Total duration: 2.1s (0.33s fall-in + 1.77s eyes)
        if (this.potholeTimer >= 2.1) {
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
     * Update Gaucho Power state machine.
     * Phases: drinking → active → windDown → none
     */
    _updateGauchoPower(dt) {
        if (!this.gauchoPowerActive) return;

        this.gauchoPowerTimer += dt;
        const drinkDur = Config.gauchoPowerDrinkDuration;
        const totalDur = Config.gauchoPowerDuration + drinkDur;
        const windDownStart = totalDur - Config.gauchoPowerWindDown;

        if (this.gauchoPowerPhase === 'drinking' && this.gauchoPowerTimer >= drinkDur) {
            // Finish drinking → activate power
            this.gauchoPowerPhase = 'active';
            this.state = STATES.WALKING;
            this.isInvincible = true;
            this.invTimer = 0;
            this.alpha = 1.0;
        } else if (this.gauchoPowerPhase === 'active' && this.gauchoPowerTimer >= windDownStart) {
            this.gauchoPowerPhase = 'windDown';
        }

        if (this.gauchoPowerTimer >= totalDur) {
            // Power ended — activate post-power invincibility (same as after collision)
            this.gauchoPowerActive = false;
            this.gauchoPowerPhase = 'none';
            this.gauchoPowerColorTimer = 0;
            this.gauchoPowerHue = 0;
            this.isInvincible = true;
            this.invTimer = 0;
            this.blinkTimer = 0;
            this.alpha = 1.0;
            this.levelSpeedMultiplier = this.baseSpeedMultiplier;
            return;
        }

        // Speed: active = 2x, windDown = lerp from 2x to 1x
        if (this.gauchoPowerPhase === 'active') {
            this.levelSpeedMultiplier = this.baseSpeedMultiplier * Config.gauchoPowerSpeedMult;
        } else if (this.gauchoPowerPhase === 'windDown') {
            const windProgress = (this.gauchoPowerTimer - windDownStart) / Config.gauchoPowerWindDown;
            const t = Math.min(1, windProgress);
            this.levelSpeedMultiplier = this.baseSpeedMultiplier * (Config.gauchoPowerSpeedMult - (Config.gauchoPowerSpeedMult - 1) * t);
        }

        // Color cycling
        if (this.gauchoPowerPhase === 'active' || this.gauchoPowerPhase === 'windDown') {
            this.gauchoPowerColorTimer += dt;
            this.gauchoPowerHue = (this.gauchoPowerColorTimer * 600) % 360; // cycles rapidly
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
            case STATES.DRINKING_MATE:
                return this.textures.crouch; // Crouching to drink mate
            default:
                return this.textures.idle;
        }
    }

    /**
     * Draws the player on the canvas.
     */
    draw(ctx, cameraX, timeOfDay) {
        if (!this.visible) return;
        const texture = this.getCurrentTexture();
        const scale = Config.pixelScale;
        const screenX = this.x - cameraX;
        // Position sprite so feet are at groundSurface when y = groundSurface
        const spriteH = texture.height * scale;
        const sidewalkH = 16 * scale; // sidewalk tile height
        const screenY = Config.sceneHeight - sidewalkH - spriteH - (this.y - Config.groundSurface);

        const w = texture.width * scale;
        const h = texture.height * scale;
        const drawX = screenX - w / 2;

        // Shadow during daytime (drawn before sprite)
        if (timeOfDay === 'day') {
            const shadowW = w * 0.8;
            const shadowH = 6;
            const feetY = Config.sceneHeight - sidewalkH;
            const jumpHeight = this.y - Config.groundSurface;
            const shadowAlpha = Math.max(0.1, 0.35 - jumpHeight * 0.002);
            ctx.save();
            ctx.globalAlpha = shadowAlpha;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(screenX, feetY + 4, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const isGauchoPower = (this.gauchoPowerPhase === 'active' || this.gauchoPowerPhase === 'windDown');

        if (isGauchoPower) {
            // Draw sprite + tint on offscreen canvas so source-atop only affects sprite pixels
            if (!this._tintCanvas) {
                this._tintCanvas = document.createElement('canvas');
                this._tintCtx = this._tintCanvas.getContext('2d');
            }
            const tc = this._tintCanvas;
            const tctx = this._tintCtx;
            tc.width = w;
            tc.height = h;
            tctx.clearRect(0, 0, w, h);
            tctx.imageSmoothingEnabled = false;

            // Draw sprite onto offscreen canvas
            if (!this.facingRight) {
                tctx.save();
                tctx.translate(w, 0);
                tctx.scale(-1, 1);
                tctx.drawImage(texture, 0, 0, w, h);
                tctx.restore();
            } else {
                tctx.drawImage(texture, 0, 0, w, h);
            }

            // Apply color tint only to opaque pixels (source-atop)
            const hue = this.gauchoPowerHue;
            let tintAlpha = 0.5;
            if (this.gauchoPowerPhase === 'windDown') {
                const drinkDur = Config.gauchoPowerDrinkDuration;
                const totalDur = Config.gauchoPowerDuration + drinkDur;
                const windDownStart = totalDur - Config.gauchoPowerWindDown;
                const windProgress = (this.gauchoPowerTimer - windDownStart) / Config.gauchoPowerWindDown;
                tintAlpha = 0.5 * (1 - Math.min(1, windProgress));
            }
            tctx.globalCompositeOperation = 'source-atop';
            tctx.fillStyle = `hsla(${hue}, 100%, 60%, ${tintAlpha})`;
            tctx.fillRect(0, 0, w, h);
            tctx.globalCompositeOperation = 'source-over';

            // Draw the tinted result onto main canvas
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tc, drawX, screenY, w, h);
            ctx.restore();
        } else {
            // Normal drawing (no gaucho power)
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.imageSmoothingEnabled = false;

            if (!this.facingRight) {
                ctx.translate(drawX + w, screenY);
                ctx.scale(-1, 1);
                ctx.drawImage(texture, 0, 0, w, h);
            } else {
                ctx.drawImage(texture, drawX, screenY, w, h);
            }

            ctx.restore();
        }

        // Draw mate sprite next to player during drinking phase
        if (this.state === STATES.DRINKING_MATE && matePickupTex) {
            const mateScale = scale * 1.2;
            const mateW = matePickupTex.width * mateScale;
            const mateH = matePickupTex.height * mateScale;
            // Position mate at the player's face/mouth level (tilted towards mouth)
            const mateX = drawX + w * 0.6;
            const mateY = screenY + h * 0.05;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(matePickupTex, mateX, mateY, mateW, mateH);

            // Steam/sparkle particles rising from the mate
            const drinkTime = this.gauchoPowerTimer;
            const numParticles = 5;
            for (let pi = 0; pi < numParticles; pi++) {
                const seed = pi * 137.5; // golden angle spread
                const lifeT = ((drinkTime * 2 + pi * 0.3) % 1.0);
                const px = mateX + mateW * 0.4 + Math.sin(seed + drinkTime * 4) * 6;
                const py = mateY - lifeT * 25;
                const pAlpha = (1 - lifeT) * 0.8;
                const pSize = 2 + lifeT * 2;
                ctx.globalAlpha = pAlpha;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(px, py, pSize, pSize);
            }
            ctx.restore();
        }
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
        // Reset gaucho power
        this.gauchoPowerActive = false;
        this.gauchoPowerTimer = 0;
        this.gauchoPowerPhase = 'none';
        this.gauchoPowerColorTimer = 0;
        this.gauchoPowerHue = 0;
        this.levelSpeedMultiplier = this.baseSpeedMultiplier;
    }
}
