// Congratulations Scene - shown after completing the final level (90)
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class CongratulationsScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        const charType = this.game.state.selectedCharacter || 'emi';
        this.characterName = charType === 'jo' ? 'JO' : 'EMI';
        this.portrait = TC.getCharacterTextures(charType).portrait;

        // Stars (more than level complete — big celebration!)
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random() * Config.sceneWidth,
                y: Math.random() * Config.sceneHeight,
                alpha: Math.random(),
                speed: 0.5 + Math.random() * 1.5,
                dir: Math.random() > 0.5 ? 1 : -1,
                size: 2 + Math.floor(Math.random() * 3),
                color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF', // gold or white
            });
        }

        // Confetti particles
        this.confetti = [];
        const confettiColors = ['#FF4444', '#44FF44', '#4444FF', '#FFD700', '#FF44FF', '#44FFFF'];
        for (let i = 0; i < 40; i++) {
            this.confetti.push({
                x: Math.random() * Config.sceneWidth,
                y: -20 - Math.random() * Config.sceneHeight,
                vy: 40 + Math.random() * 80,
                vx: (Math.random() - 0.5) * 60,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 4,
                color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                size: 3 + Math.floor(Math.random() * 4),
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

        // Text caches (Spanish)
        this._titleText = TC.renderText('FELICITACIONES!');
        this._subtitleText = TC.renderText('RECORRISTE TODA');
        this._subtitleText2 = TC.renderText('LA COSTA DE URUGUAY!');
        this._congratsText = TC.renderText('BIEN HECHO ' + this.characterName + '!');
        this._continueText = TC.renderText('TOCA O PULSA ENTER');

        this.canProceed = false;
        this.proceedTimer = 0;

        // Play victory music
        this.game.music.playTrack('victory');
    }

    update(dt) {
        this.timer += dt;

        // Allow proceeding after 2s (longer pause for celebration)
        this.proceedTimer += dt;
        if (this.proceedTimer >= 2.0) {
            this.canProceed = true;
        }

        // Update stars
        for (const star of this.stars) {
            star.alpha += star.dir * star.speed * dt;
            if (star.alpha <= 0.2) { star.alpha = 0.2; star.dir = 1; }
            if (star.alpha >= 1.0) { star.alpha = 1.0; star.dir = -1; }
        }

        // Update confetti
        for (const c of this.confetti) {
            c.y += c.vy * dt;
            c.x += c.vx * dt;
            c.rot += c.rotSpeed * dt;
            // Recycle at bottom
            if (c.y > Config.sceneHeight + 20) {
                c.y = -20;
                c.x = Math.random() * Config.sceneWidth;
            }
        }

        // Bounce portrait
        this.bounceY += this.bounceDir * 30 * dt;
        if (this.bounceY > 10) { this.bounceY = 10; this.bounceDir = -1; }
        if (this.bounceY < -10) { this.bounceY = -10; this.bounceDir = 1; }

        // Pulse title scale
        this.titleScale += this.titleScaleDir * 0.3 * dt;
        if (this.titleScale > 1.15) { this.titleScale = 1.15; this.titleScaleDir = -1; }
        if (this.titleScale < 1.0) { this.titleScale = 1.0; this.titleScaleDir = 1; }

        // Pulse instruction
        this.instructionAlpha += this.instructionDir * 0.75 * dt;
        if (this.instructionAlpha <= 0.3) { this.instructionAlpha = 0.3; this.instructionDir = 1; }
        if (this.instructionAlpha >= 1.0) { this.instructionAlpha = 1.0; this.instructionDir = -1; }

        // Input
        const input = this.game.input;
        if (this.canProceed) {
            if (input.consumeKey('Enter') || input.consumeKey('Space')) {
                // Go to enter initials (high score) or hall of fame
                this.game.setScene('enterInitials');
            }
        }
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;

        // Dark blue background with gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0a2e');
        grad.addColorStop(0.5, '#1a1a4e');
        grad.addColorStop(1, '#0d1a33');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        for (const star of this.stars) {
            ctx.save();
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = star.color;
            ctx.fillRect(star.x, star.y, star.size, star.size);
            ctx.restore();
        }

        // Confetti
        for (const c of this.confetti) {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.5);
            ctx.restore();
        }

        // Title "FELICITACIONES!" in gold, pulsing
        const titleScale = scale * 1.8 * this.titleScale;
        const titleW = this._titleText.width * titleScale;
        const titleH = this._titleText.height * titleScale;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._titleText, (W - titleW) / 2, H * 0.12 - titleH / 2, titleW, titleH);
        // Gold tint
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fillRect((W - titleW) / 2, H * 0.12 - titleH / 2, titleW, titleH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        // Subtitle line 1: "RECORRISTE TODA"
        const subScale = scale * 1.0;
        const subW = this._subtitleText.width * subScale;
        const subH = this._subtitleText.height * subScale;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._subtitleText, (W - subW) / 2, H * 0.26 - subH / 2, subW, subH);

        // Subtitle line 2: "LA COSTA DE URUGUAY!"
        const sub2W = this._subtitleText2.width * subScale;
        const sub2H = this._subtitleText2.height * subScale;
        ctx.drawImage(this._subtitleText2, (W - sub2W) / 2, H * 0.34 - sub2H / 2, sub2W, sub2H);

        // "BIEN HECHO [NAME]!"
        const congratsScale = scale * 0.9;
        const congratsW = this._congratsText.width * congratsScale;
        const congratsH = this._congratsText.height * congratsScale;
        ctx.drawImage(this._congratsText, (W - congratsW) / 2, H * 0.44 - congratsH / 2, congratsW, congratsH);

        // Character portrait (bouncing, bigger)
        const portraitScale = scale * 2.5;
        const pW = this.portrait.width * portraitScale;
        const pH = this.portrait.height * portraitScale;
        ctx.drawImage(this.portrait,
            (W - pW) / 2,
            H * 0.62 - pH / 2 + this.bounceY,
            pW, pH);

        // "TOCA O PULSA ENTER"
        if (this.canProceed) {
            const instrScale = scale * 0.7;
            const instrW = this._continueText.width * instrScale;
            const instrH = this._continueText.height * instrScale;
            ctx.save();
            ctx.globalAlpha = this.instructionAlpha;
            ctx.drawImage(this._continueText, (W - instrW) / 2, H * 0.88 - instrH / 2, instrW, instrH);
            ctx.restore();
        }

        // Music toggle button (top-right)
        const margin = 10;
        const isMuted = this.game.state.musicMuted;
        const icon = isMuted ? TC.musicOffIcon : TC.musicOnIcon;
        const iconW = icon.width * scale;
        const iconH = icon.height * scale;
        const iconX = W - margin - iconW;
        const iconY = margin;
        ctx.drawImage(icon, iconX, iconY, iconW, iconH);
        this._musicBounds = { x: iconX, y: iconY, w: iconW, h: iconH };
    }

    onClick(x, y) {
        // Check music button
        if (this._musicBounds && this._hitTest(x, y, this._musicBounds)) {
            this.game.toggleMusic();
            return;
        }

        if (this.canProceed) {
            this.game.setScene('enterInitials');
        }
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }
}
