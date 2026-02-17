// Level Complete Scene - victory screen with celebration
import { Config, getCityForLevel, isBeachLevel } from '../config.js';

import * as TC from '../textureCache.js';

export class LevelCompleteScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        const charType = this.game.state.selectedCharacter || 'emi';
        this.characterName = charType === 'jo' ? 'JO' : 'EMI';
        this.portrait = TC.getCharacterTextures(charType).portrait;

        // Obtener nivel actual
        this.currentLevel = this.game.state.currentLevel || 1;

        // Stars
        this.stars = [];
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                x: Math.random() * Config.sceneWidth,
                y: Math.random() * Config.sceneHeight,
                alpha: Math.random(),
                speed: 0.5 + Math.random() * 1.0,
                dir: Math.random() > 0.5 ? 1 : -1,
            });
        }

        // Animations
        this.timer = 0;
        this.bounceY = 0;
        this.bounceDir = 1;
        this.titleScale = 1.0;
        this.titleScaleDir = 1;
        this.instructionAlpha = 1.0;
        this.instructionDir = -1;

        // Text caches (Spanish) - mostrar nivel completado
        this._titleText = TC.renderText('NIVEL ' + this.currentLevel + ' COMPLETO!');
        this._congratsText = TC.renderText('BIEN HECHO ' + this.characterName + '!');
        this._continueText = TC.renderText('TOCA O PULSA ENTER');

        this.canProceed = false;
        this.proceedTimer = 0;

        // Note: Victory music is played when level completes in gameScene
    }

    update(dt) {
        this.timer += dt;

        // Allow proceeding after 0.5s
        this.proceedTimer += dt;
        if (this.proceedTimer >= 0.5) {
            this.canProceed = true;
        }

        // Update stars
        for (const star of this.stars) {
            star.alpha += star.dir * star.speed * dt;
            if (star.alpha <= 0.2) { star.alpha = 0.2; star.dir = 1; }
            if (star.alpha >= 1.0) { star.alpha = 1.0; star.dir = -1; }
        }

        // Bounce portrait
        this.bounceY += this.bounceDir * 30 * dt;
        if (this.bounceY > 10) { this.bounceY = 10; this.bounceDir = -1; }
        if (this.bounceY < -10) { this.bounceY = -10; this.bounceDir = 1; }

        // Pulse title scale
        this.titleScale += this.titleScaleDir * 0.2 * dt;
        if (this.titleScale > 1.1) { this.titleScale = 1.1; this.titleScaleDir = -1; }
        if (this.titleScale < 1.0) { this.titleScale = 1.0; this.titleScaleDir = 1; }

        // Pulse instruction
        this.instructionAlpha += this.instructionDir * 0.75 * dt;
        if (this.instructionAlpha <= 0.3) { this.instructionAlpha = 0.3; this.instructionDir = 1; }
        if (this.instructionAlpha >= 1.0) { this.instructionAlpha = 1.0; this.instructionDir = -1; }

        // Input
        const input = this.game.input;
        if (this.canProceed) {
            if (input.consumeKey('Enter') || input.consumeKey('Space')) {
                this._advance();
            }
        }
    }

    _advance() {
        if (this.currentLevel >= Config.maxLevel) {
            // Final level completed — go to congratulations!
            this.game.setScene('congratulations');
        } else {
            // Avanzar al siguiente nivel
            const nextLevel = this.currentLevel + 1;
            this.game.state.currentLevel = nextLevel;
            const cityData = getCityForLevel(nextLevel);
            if (cityData) {
                // Show map scene before entering the new city
                this.game.setScene('map');
            } else {
                const track = isBeachLevel(nextLevel) ? 'beach' : 'game';
                this.game.music.playTrack(track);
                this.game.setScene('game');
            }
        }
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;

        // Dark blue background
        ctx.fillStyle = '#0d1a33';
        ctx.fillRect(0, 0, W, H);

        // Stars
        for (const star of this.stars) {
            ctx.save();
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(star.x, star.y, 2, 2);
            ctx.restore();
        }

        // Title "LEVEL COMPLETE!" in gold
        const titleScale = scale * 1.5 * this.titleScale;
        const titleW = this._titleText.width * titleScale;
        const titleH = this._titleText.height * titleScale;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Draw title text, then gold tint
        ctx.drawImage(this._titleText, (W - titleW) / 2, H * 0.18 - titleH / 2, titleW, titleH);
        // Apply gold tint
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fillRect((W - titleW) / 2, H * 0.18 - titleH / 2, titleW, titleH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        // "[NAME] DID IT!" text
        const congratsScale = scale * 1.0;
        const congratsW = this._congratsText.width * congratsScale;
        const congratsH = this._congratsText.height * congratsScale;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._congratsText, (W - congratsW) / 2, H * 0.32 - congratsH / 2, congratsW, congratsH);

        // Character portrait (bouncing)
        const portraitScale = scale * 2;
        const pW = this.portrait.width * portraitScale;
        const pH = this.portrait.height * portraitScale;
        ctx.drawImage(this.portrait,
            (W - pW) / 2,
            H * 0.55 - pH / 2 + this.bounceY,
            pW, pH);

        // "PRESS ENTER TO CONTINUE"
        if (this.canProceed) {
            const instrScale = scale * 0.7;
            const instrW = this._continueText.width * instrScale;
            const instrH = this._continueText.height * instrScale;
            ctx.save();
            ctx.globalAlpha = this.instructionAlpha;
            ctx.drawImage(this._continueText, (W - instrW) / 2, H * 0.85 - instrH / 2, instrW, instrH);
            ctx.restore();
        }

        // Draw music toggle button (top-right corner)
        const margin = 10;
        const isMuted = this.game.state.musicMuted;
        const icon = isMuted ? TC.musicOffIcon : TC.musicOnIcon;
        const iconW = icon.width * scale;
        const iconH = icon.height * scale;
        const iconX = W - margin - iconW;
        const iconY = margin;

        ctx.drawImage(icon, iconX, iconY, iconW, iconH);

        // Store bounds for click detection
        this._musicBounds = { x: iconX, y: iconY, w: iconW, h: iconH };
    }

    onClick(x, y) {
        // Check music button
        if (this._musicBounds && this._hitTest(x, y, this._musicBounds)) {
            this.game.toggleMusic();
            return;
        }

        if (this.canProceed) {
            this._advance();
        }
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }
}
