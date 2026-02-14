// Hall of Fame Scene - displays top 10 scores
import { Config } from '../config.js';
import * as TC from '../textureCache.js';
import { HallOfFame } from '../systems/hallOfFame.js';

export class HallOfFameScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        this.scores = HallOfFame.getScores();
        this.timer = 0;
        this.canProceed = false;

        // Pre-render static texts
        this._titleText = TC.renderText('HALL DE LA FAMA');
        this._headerText = TC.renderText('  # INI NIVEL METROS');
        this._emptyText = TC.renderText('SIN RECORDS AUN');
        this._continueText = TC.renderText('PULSA ENTER PARA CONTINUAR');

        // Pre-render score rows
        this._scoreRows = this.scores.map((s, i) => {
            const rank = String(i + 1).padStart(2, ' ');
            const ini = s.initials;
            const lvl = String(s.level).padStart(3, ' ');
            const mts = String(s.meters).padStart(5, ' ');
            return TC.renderText(rank + '  ' + ini + '   ' + lvl + '   ' + mts);
        });
    }

    update(dt) {
        this.timer += dt;
        const input = this.game.input;

        if (this.timer >= 0.5) {
            this.canProceed = true;
        }

        if (this.canProceed) {
            if (input.consumeKey('Enter') || input.consumeKey('Space')) {
                this.game.music.playTrack('menu');
                this.game.setScene('menu');
            }
        }
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;

        // Dark background
        ctx.fillStyle = '#0d1a33';
        ctx.fillRect(0, 0, W, H);

        ctx.imageSmoothingEnabled = false;

        // Title
        const titleScale = scale * 1.2;
        const titleW = this._titleText.width * titleScale;
        const titleH = this._titleText.height * titleScale;
        ctx.save();
        ctx.drawImage(this._titleText, (W - titleW) / 2, H * 0.06, titleW, titleH);
        // Gold tint
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fillRect((W - titleW) / 2, H * 0.06, titleW, titleH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        if (this.scores.length === 0) {
            // No scores yet
            const emptyScale = scale * 0.8;
            const emptyW = this._emptyText.width * emptyScale;
            const emptyH = this._emptyText.height * emptyScale;
            ctx.drawImage(this._emptyText, (W - emptyW) / 2, H * 0.4, emptyW, emptyH);
        } else {
            // Header row
            const headerScale = scale * 0.6;
            const headerW = this._headerText.width * headerScale;
            const headerH = this._headerText.height * headerScale;
            ctx.globalAlpha = 0.6;
            ctx.drawImage(this._headerText, (W - headerW) / 2, H * 0.16, headerW, headerH);
            ctx.globalAlpha = 1.0;

            // Score rows
            const rowScale = scale * 0.7;
            const rowSpacing = 30;
            const startY = H * 0.22;

            for (let i = 0; i < this._scoreRows.length; i++) {
                const row = this._scoreRows[i];
                const rowW = row.width * rowScale;
                const rowH = row.height * rowScale;
                const rowY = startY + i * rowSpacing;

                // Highlight newest entry (last added is last in sorted position matching)
                const isTop3 = i < 3;

                if (isTop3) {
                    // Gold tint for top 3
                    ctx.save();
                    ctx.drawImage(row, (W - rowW) / 2, rowY, rowW, rowH);
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
                    ctx.fillRect((W - rowW) / 2, rowY, rowW, rowH);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.restore();
                } else {
                    ctx.drawImage(row, (W - rowW) / 2, rowY, rowW, rowH);
                }
            }
        }

        // Continue text
        if (this.canProceed) {
            const instrScale = scale * 0.6;
            const instrW = this._continueText.width * instrScale;
            const instrH = this._continueText.height * instrScale;
            ctx.globalAlpha = 0.5 + Math.sin(this.timer * 3) * 0.4;
            ctx.drawImage(this._continueText, (W - instrW) / 2, H * 0.9, instrW, instrH);
            ctx.globalAlpha = 1.0;
        }

        // Music toggle button
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
        if (this._musicBounds && this._hitTest(x, y, this._musicBounds)) {
            this.game.toggleMusic();
            return;
        }
        if (this.canProceed) {
            this.game.music.playTrack('menu');
            this.game.setScene('menu');
        }
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }
}
