// Menu Scene - character selection (Emi or Jo)
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
        this.musicStarted = false; // Track if menu music has started

        // Character walk animation at 12fps
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.walkFrameInterval = 1 / 12; // 12fps

        // Character animation - looking left/right randomly
        this.emiLookTimer = Math.random() * 2;
        this.emiLookDir = 0; // -1=left, 0=center, 1=right
        this.joLookTimer = Math.random() * 2;
        this.joLookDir = 0;

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
        if (this.birdSpawnTimer >= 4.5) { // Spawn bird every 4.5 seconds
            this.birdSpawnTimer = 0;
            this.menuBirds.push(Bird.spawnRandom(0));
        }
        for (const bird of this.menuBirds) {
            bird.update(dt);
        }
        this.menuBirds = this.menuBirds.filter(b => b.alive);

        // Walk animation (12fps cycle through 6 frames)
        this.walkTimer += dt;
        if (this.walkTimer >= this.walkFrameInterval) {
            this.walkTimer -= this.walkFrameInterval;
            this.walkFrame = (this.walkFrame + 1) % 6;
        }

        // Animate character looking directions
        this.emiLookTimer += dt;
        if (this.emiLookTimer >= 2 + Math.random() * 2) {
            this.emiLookTimer = 0;
            this.emiLookDir = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        }

        this.joLookTimer += dt;
        if (this.joLookTimer >= 2 + Math.random() * 2) {
            this.joLookTimer = 0;
            this.joLookDir = Math.floor(Math.random() * 3) - 1;
        }

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
            // Switch from menu music to game music when confirming selection
            this.game.music.playTrack('game');
            this._confirmSelection();
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
        const ly = H * 0.25 - lh / 2; // canvas Y-down: 25% from top = 75% from bottom
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(TC.logo, lx, ly, lw, lh);

        // Character selection area
        const centerY = H * 0.55; // canvas coords
        const spacing = 140; // increased for larger portraits

        // Portrait scales adjusted for pixelScale 3 (doubled for visibility)
        const selectedScale = scale * 1.0;
        const unselectedScale = scale * 0.8;

        // Get walk frame textures
        const emiWalkTex = TC.emiWalkFrames[this.walkFrame];
        const joWalkTex = TC.joWalkFrames[this.walkFrame];

        // Emi character (walk animation)
        const emiScale = this.selectedIndex === 0 ? selectedScale : unselectedScale;
        const emiW = emiWalkTex.width * emiScale;
        const emiH = emiWalkTex.height * emiScale;
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

        // Draw Emi walk frame (handle flash and look animation)
        const emiAlpha = this._getPortraitAlpha(0);
        ctx.save();
        ctx.globalAlpha = emiAlpha;
        const emiOffsetX = this.emiLookDir * 3;
        if (this.emiLookDir === -1) {
            ctx.translate(emiX + emiW + emiOffsetX, emiY);
            ctx.scale(-1, 1);
            ctx.drawImage(emiWalkTex, 0, 0, emiW, emiH);
        } else {
            ctx.drawImage(emiWalkTex, emiX + emiOffsetX, emiY, emiW, emiH);
        }
        ctx.restore();

        // Jo character (walk animation)
        const joScale = this.selectedIndex === 1 ? selectedScale : unselectedScale;
        const joW = joWalkTex.width * joScale;
        const joH = joWalkTex.height * joScale;
        const joX = W / 2 + spacing - joW / 2;
        const joY = centerY - joH / 2;

        if (this.selectedIndex === 1) {
            ctx.save();
            ctx.globalAlpha = this.blinkAlpha;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(joX - 4, joY - 4, joW + 8, joH + 8);
            ctx.restore();
        }

        // Draw Jo walk frame (handle flash and look animation)
        const joAlpha = this._getPortraitAlpha(1);
        ctx.save();
        ctx.globalAlpha = joAlpha;
        const joOffsetX = this.joLookDir * 3;
        if (this.joLookDir === 1) {
            ctx.translate(joX + joW + joOffsetX, joY);
            ctx.scale(-1, 1);
            ctx.drawImage(joWalkTex, 0, 0, joW, joH);
        } else {
            ctx.drawImage(joWalkTex, joX + joOffsetX, joY, joW, joH);
        }
        ctx.restore();

        // Name labels (same size as instruction text)
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
            // Switch to game music when selecting character
            this.game.music.playTrack('game');
            this._confirmSelection();
        } else if (this._joBounds && this._hitTest(x, y, this._joBounds)) {
            this.selectedIndex = 1;
            // Switch to game music when selecting character
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
        this.game.setScene('game');
    }
}
