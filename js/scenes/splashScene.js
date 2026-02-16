// Splash Scene - shows EMIJO logo with fade in, then waits for Enter
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class SplashScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        this.timer = 0;
        this.alpha = 0;
        this.waitingForInput = false;
        this.promptAlpha = 0;
        this.promptDir = 1;
    }

    update(dt) {
        const input = this.game.input;

        // Fade in: 0 - 0.5s
        if (this.timer < 0.5) {
            this.timer += dt;
            this.alpha = this.timer / 0.5;
        }
        // After fade in, wait for input
        else {
            this.alpha = 1.0;
            this.waitingForInput = true;

            // Animate prompt alpha (pulsing)
            this.promptAlpha += this.promptDir * dt * 1.5;
            if (this.promptAlpha >= 1.0) {
                this.promptAlpha = 1.0;
                this.promptDir = -1;
            } else if (this.promptAlpha <= 0.3) {
                this.promptAlpha = 0.3;
                this.promptDir = 1;
            }

            // Check for Enter key
            if (input.consumeKey('Enter') || input.consumeKey('Space')) {
                this._goToMenu();
            }
        }
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;

        // Black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);

        // Draw logo centered, scaled ×2
        const logoScale = Config.pixelScale * 2;
        const lw = TC.logo.width * logoScale;
        const lh = TC.logo.height * logoScale;
        const lx = (W - lw) / 2;
        const ly = H * 0.35 - lh / 2;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(TC.logo, lx, ly, lw, lh);
        ctx.restore();

        // Draw "PULSA ENTER PARA CONTINUAR" when waiting
        if (this.waitingForInput) {
            const promptText = TC.renderText('PULSA ENTER PARA CONTINUAR');
            const promptScale = Config.pixelScale * 0.8;
            const pw = promptText.width * promptScale;
            const ph = promptText.height * promptScale;
            const px = (W - pw) / 2;
            const py = H * 0.7;

            ctx.save();
            ctx.globalAlpha = this.promptAlpha;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(promptText, px, py, pw, ph);
            ctx.restore();

            // Year and credits
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.imageSmoothingEnabled = false;

            const creditScale = Config.pixelScale * 0.5;

            const yearText = TC.renderText('2026');
            const yw = yearText.width * creditScale;
            const yh = yearText.height * creditScale;
            ctx.drawImage(yearText, (W - yw) / 2, H * 0.80, yw, yh);

            const authorText = TC.renderText('CREADO POR FABRICIO GONZALEZ');
            const aw = authorText.width * creditScale;
            const ah = authorText.height * creditScale;
            ctx.drawImage(authorText, (W - aw) / 2, H * 0.86, aw, ah);

            const creditText = TC.renderText('CREADO CON CLAUDE ANTHROPIC OPUS 4.6');
            const cw = creditText.width * creditScale;
            const ch = creditText.height * creditScale;
            ctx.drawImage(creditText, (W - cw) / 2, H * 0.92, cw, ch);

            ctx.restore();
        }
    }

    _goToMenu() {
        // Start menu music (requires user interaction)
        if (this.game.music) {
            this.game.music.playTrack('menu');
        }
        this.game.setScene('menu');
    }

    onClick(x, y) {
        // Also allow click/tap to continue
        if (this.waitingForInput) {
            this._goToMenu();
        }
    }
}
