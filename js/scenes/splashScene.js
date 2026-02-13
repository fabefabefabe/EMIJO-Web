// Splash Scene - shows EMIJO logo with fade in/hold/fade out
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class SplashScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        this.timer = 0;
        this.alpha = 0;
    }

    update(dt) {
        this.timer += dt;

        // Fade in: 0 - 0.5s
        if (this.timer < 0.5) {
            this.alpha = this.timer / 0.5;
        }
        // Hold: 0.5 - 2.5s
        else if (this.timer < 2.5) {
            this.alpha = 1.0;
        }
        // Fade out: 2.5 - 3.0s
        else if (this.timer < 3.0) {
            this.alpha = 1.0 - (this.timer - 2.5) / 0.5;
        }
        // Transition to menu
        else {
            this.game.setScene('menu');
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
        const ly = (H - lh) / 2;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(TC.logo, lx, ly, lw, lh);
        ctx.restore();
    }

    onClick(x, y) {
        // Start menu music on click (requires user interaction)
        if (this.game.music) {
            this.game.music.playTrack('menu');
        }
        // Skip splash on click
        this.game.setScene('menu');
    }
}
