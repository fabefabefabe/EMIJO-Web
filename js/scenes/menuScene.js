// Menu Scene - character selection (Emi or Jo) with animated portraits
import { Config } from '../config.js';
import * as TC from '../textureCache.js';
import { ParallaxSystem } from '../systems/parallax.js';
import { Bird } from '../entities/bird.js';

export class MenuScene {
    constructor(game) {
        this.game = game;
        this.parallax = new ParallaxSystem();
    }

    enter() {
        this.selectedIndex = 0; // 0=Emi, 1=Jo
        this.blinkTimer = 0;
        this.blinkAlpha = 0.8;
        this.instructionAlpha = 1.0;
        this.instructionDir = -1;
        this.flashTimer = -1; // -1 = not flashing
        this.flashCount = 0;
        this.musicStarted = false;

        // Portrait blink animation
        // Frames: 0=open, 1=blink, 2=look
        // Mostly open, occasional blink, occasional look
        this.emiPortraitFrame = 0;
        this.emiBlinkTimer = 2 + Math.random() * 3; // 2-5s until first blink
        this.emiLookTimer = 5 + Math.random() * 5; // 5-10s until first look
        this.emiAnimTimer = 0;
        this.emiAnimState = 'open'; // 'open', 'blinking', 'looking'

        this.joPortraitFrame = 0;
        this.joBlinkTimer = 3 + Math.random() * 3;
        this.joLookTimer = 6 + Math.random() * 5;
        this.joAnimTimer = 0;
        this.joAnimState = 'open';

        // Background birds
        this.menuBirds = [];
        this.birdSpawnTimer = 0;
    }

    update(dt) {
        const input = this.game.input;

        // Animate parallax (sea waves)
        this.parallax.update(dt);

        // Update background birds
        this.birdSpawnTimer += dt;
        if (this.birdSpawnTimer >= 4.5) {
            this.birdSpawnTimer = 0;
            this.menuBirds.push(Bird.spawnRandom(0));
        }
        for (const bird of this.menuBirds) {
            bird.update(dt);
        }
        this.menuBirds = this.menuBirds.filter(b => b.alive);

        // Animate Emi portrait
        this._updatePortraitAnim(dt, 'emi');
        this._updatePortraitAnim(dt, 'jo');

        // Selection indicator blink
        this.blinkTimer += dt;
        if (this.blinkTimer >= 0.4) {
            this.blinkTimer -= 0.4;
            this.blinkAlpha = this.blinkAlpha > 0.5 ? 0.3 : 0.8;
        }

        // Instruction text pulse
        this.instructionAlpha += this.instructionDir * dt * 0.75;
        if (this.instructionAlpha <= 0.4) { this.instructionAlpha = 0.4; this.instructionDir = 1; }
        if (this.instructionAlpha >= 1.0) { this.instructionAlpha = 1.0; this.instructionDir = -1; }

        // Handle flash animation (after selection confirmed)
        if (this.flashTimer >= 0) {
            this.flashTimer += dt;
            if (this.flashTimer >= 0.1) {
                this.flashTimer = 0;
                this.flashCount++;
                if (this.flashCount >= 4) {
                    this._startGame();
                    return;
                }
            }
            return; // Don't process input during flash
        }

        // Keyboard navigation
        if (input.consumeKey('ArrowLeft')) {
            this.selectedIndex = 0;
        }
        if (input.consumeKey('ArrowRight')) {
            this.selectedIndex = 1;
        }
        if (input.consumeKey('KeyM')) {
            this.game.toggleMusic();
        }
        if (input.consumeKey('Enter') || input.consumeKey('Space')) {
            this.game.music.playTrack('game');
            this._confirmSelection();
        }
    }

    _updatePortraitAnim(dt, who) {
        const isEmi = who === 'emi';
        const state = isEmi ? this.emiAnimState : this.joAnimState;
        let blinkTimer = isEmi ? this.emiBlinkTimer : this.joBlinkTimer;
        let lookTimer = isEmi ? this.emiLookTimer : this.joLookTimer;
        let animTimer = isEmi ? this.emiAnimTimer : this.joAnimTimer;

        if (state === 'open') {
            // Count down to next blink or look
            blinkTimer -= dt;
            lookTimer -= dt;

            if (blinkTimer <= 0) {
                // Start blink
                if (isEmi) {
                    this.emiAnimState = 'blinking';
                    this.emiAnimTimer = 0;
                    this.emiPortraitFrame = 1; // blink frame
                    this.emiBlinkTimer = 2 + Math.random() * 4;
                } else {
                    this.joAnimState = 'blinking';
                    this.joAnimTimer = 0;
                    this.joPortraitFrame = 1;
                    this.joBlinkTimer = 2 + Math.random() * 4;
                }
            } else if (lookTimer <= 0) {
                // Start look
                if (isEmi) {
                    this.emiAnimState = 'looking';
                    this.emiAnimTimer = 0;
                    this.emiPortraitFrame = 2; // look frame
                    this.emiLookTimer = 5 + Math.random() * 5;
                } else {
                    this.joAnimState = 'looking';
                    this.joAnimTimer = 0;
                    this.joPortraitFrame = 2;
                    this.joLookTimer = 5 + Math.random() * 5;
                }
            } else {
                // Still open
                if (isEmi) {
                    this.emiBlinkTimer = blinkTimer;
                    this.emiLookTimer = lookTimer;
                } else {
                    this.joBlinkTimer = blinkTimer;
                    this.joLookTimer = lookTimer;
                }
            }
        } else if (state === 'blinking') {
            animTimer += dt;
            if (isEmi) { this.emiAnimTimer = animTimer; } else { this.joAnimTimer = animTimer; }
            // Blink lasts 0.15s
            if (animTimer >= 0.15) {
                if (isEmi) {
                    this.emiAnimState = 'open';
                    this.emiPortraitFrame = 0;
                } else {
                    this.joAnimState = 'open';
                    this.joPortraitFrame = 0;
                }
            }
        } else if (state === 'looking') {
            animTimer += dt;
            if (isEmi) { this.emiAnimTimer = animTimer; } else { this.joAnimTimer = animTimer; }
            // Look lasts 1.0s
            if (animTimer >= 1.0) {
                if (isEmi) {
                    this.emiAnimState = 'open';
                    this.emiPortraitFrame = 0;
                } else {
                    this.joAnimState = 'open';
                    this.joPortraitFrame = 0;
                }
            }
        }
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;

        // Dark background
        ctx.fillStyle = '#1a1a33';
        ctx.fillRect(0, 0, W, H);

        // Draw parallax background (sky + sea)
        this.parallax.draw(ctx, 0);

        // Draw background birds (behind UI)
        for (const bird of this.menuBirds) {
            bird.draw(ctx, 0);
        }

        // Logo at 75% height
        const logoScale = scale * 1.5;
        const lw = TC.logo.width * logoScale;
        const lh = TC.logo.height * logoScale;
        const lx = (W - lw) / 2;
        const ly = H * 0.25 - lh / 2;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(TC.logo, lx, ly, lw, lh);

        // Character selection area - big animated portraits
        const centerY = H * 0.55;
        const spacing = 140;

        // Portrait scales (bigger than walk frames)
        const selectedScale = scale * 1.8;
        const unselectedScale = scale * 1.4;

        // Get portrait frame textures
        const emiTex = TC.emiPortraitFrames[this.emiPortraitFrame];
        const joTex = TC.joPortraitFrames[this.joPortraitFrame];

        // Emi portrait
        const emiScale = this.selectedIndex === 0 ? selectedScale : unselectedScale;
        const emiW = emiTex.width * emiScale;
        const emiH = emiTex.height * emiScale;
        const emiX = W / 2 - spacing - emiW / 2;
        const emiY = centerY - emiH / 2;

        // Selection indicator (behind selected character)
        if (this.selectedIndex === 0) {
            ctx.save();
            ctx.globalAlpha = this.blinkAlpha;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(emiX - 4, emiY - 4, emiW + 8, emiH + 8);
            ctx.restore();
        }

        // Draw Emi portrait (handle flash)
        const emiAlpha = this._getPortraitAlpha(0);
        ctx.save();
        ctx.globalAlpha = emiAlpha;
        ctx.drawImage(emiTex, emiX, emiY, emiW, emiH);
        ctx.restore();

        // Jo portrait
        const joScale = this.selectedIndex === 1 ? selectedScale : unselectedScale;
        const joW = joTex.width * joScale;
        const joH = joTex.height * joScale;
        const joX = W / 2 + spacing - joW / 2;
        const joY = centerY - joH / 2;

        if (this.selectedIndex === 1) {
            ctx.save();
            ctx.globalAlpha = this.blinkAlpha;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(joX - 4, joY - 4, joW + 8, joH + 8);
            ctx.restore();
        }

        // Draw Jo portrait (handle flash)
        const joAlpha = this._getPortraitAlpha(1);
        ctx.save();
        ctx.globalAlpha = joAlpha;
        ctx.drawImage(joTex, joX, joY, joW, joH);
        ctx.restore();

        // Name labels
        const emiLabel = TC.renderText('EMI');
        const joLabel = TC.renderText('JO');
        const labelScale = scale * 0.8;

        const emiLW = emiLabel.width * labelScale;
        const emiLH = emiLabel.height * labelScale;
        ctx.drawImage(emiLabel, W / 2 - spacing - emiLW / 2, centerY + emiH / 2 + 10, emiLW, emiLH);

        const joLW = joLabel.width * labelScale;
        const joLH = joLabel.height * labelScale;
        ctx.drawImage(joLabel, W / 2 + spacing - joLW / 2, centerY + joH / 2 + 10, joLW, joLH);

        // Instruction text at bottom
        const instrText = TC.renderText('PULSA ENTER PARA JUGAR');
        const instrScale = scale * 0.8;
        const instrW = instrText.width * instrScale;
        const instrH = instrText.height * instrScale;
        ctx.save();
        ctx.globalAlpha = this.instructionAlpha;
        ctx.drawImage(instrText, (W - instrW) / 2, H * 0.88 - instrH / 2, instrW, instrH);
        ctx.restore();

        // Store portrait bounds for click detection
        this._emiBounds = { x: emiX, y: emiY, w: emiW, h: emiH };
        this._joBounds = { x: joX, y: joY, w: joW, h: joH };

        // Draw music toggle button (top-right corner)
        this._drawMusicButton(ctx);
    }

    _drawMusicButton(ctx) {
        const scale = Config.pixelScale;
        const W = Config.sceneWidth;
        const margin = 15;

        const isMuted = this.game.state.musicMuted;
        const icon = isMuted ? TC.musicOffIcon : TC.musicOnIcon;
        const iconW = icon.width * scale;
        const iconH = icon.height * scale;
        const iconX = W - margin - iconW;
        const iconY = margin;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(icon, iconX, iconY, iconW, iconH);

        // Store bounds for click detection
        this._musicBounds = { x: iconX, y: iconY, w: iconW, h: iconH };
    }

    onClick(x, y) {
        // Start menu music on first click (user gesture required)
        if (!this.musicStarted) {
            this.game.music.playTrack('menu');
            this.musicStarted = true;
        }

        // Check music button first
        if (this._musicBounds && this._hitTest(x, y, this._musicBounds)) {
            this.game.toggleMusic();
            return;
        }

        if (this.flashTimer >= 0) return; // Already confirming

        if (this._emiBounds && this._hitTest(x, y, this._emiBounds)) {
            this.selectedIndex = 0;
            this.game.music.playTrack('game');
            this._confirmSelection();
        } else if (this._joBounds && this._hitTest(x, y, this._joBounds)) {
            this.selectedIndex = 1;
            this.game.music.playTrack('game');
            this._confirmSelection();
        }
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }

    _getPortraitAlpha(index) {
        if (this.flashTimer < 0 || this.selectedIndex !== index) return 1.0;
        return this.flashCount % 2 === 0 ? 0.3 : 1.0;
    }

    _confirmSelection() {
        this.flashTimer = 0;
        this.flashCount = 0;
    }

    _startGame() {
        this.game.state.selectedCharacter = this.selectedIndex === 0 ? 'emi' : 'jo';
        // Resetear nivel a 1 al iniciar nuevo juego
        this.game.state.currentLevel = 1;
        // Show map scene first (introduces the route)
        this.game.setScene('map');
    }
}
