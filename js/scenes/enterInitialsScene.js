// Enter Initials Scene - input 3 letters for Hall of Fame
import { Config } from '../config.js';
import * as TC from '../textureCache.js';
import { HallOfFame } from '../systems/hallOfFame.js';

export class EnterInitialsScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        this.letters = [0, 0, 0]; // A=0, B=1, ... Z=25
        this.currentSlot = 0;
        this.level = this.game.state.currentLevel || 1;
        this.totalMeters = this.game.state.totalMeters || 0;
        this.confirmed = false;

        // Animation
        this.timer = 0;
        this.cursorBlink = true;

        // Pre-render static texts
        this._titleText = TC.renderText('NUEVO RECORD!');
        this._levelText = TC.renderText('NIVEL ' + this.level);
        this._metersText = TC.renderText(this.totalMeters + ' METROS');
        this._instructText = TC.renderText('TOCA LAS LETRAS O USA FLECHAS');
    }

    _getLetter(index) {
        return String.fromCharCode(65 + this.letters[index]);
    }

    _getInitials() {
        return this._getLetter(0) + this._getLetter(1) + this._getLetter(2);
    }

    update(dt) {
        if (this.confirmed) return;

        const input = this.game.input;
        this.timer += dt;

        // Cursor blink
        if (this.timer % 0.5 < 0.25) {
            this.cursorBlink = true;
        } else {
            this.cursorBlink = false;
        }

        // Navigate between slots
        if (input.consumeKey('ArrowLeft')) {
            this.currentSlot = Math.max(0, this.currentSlot - 1);
        }
        if (input.consumeKey('ArrowRight')) {
            this.currentSlot = Math.min(2, this.currentSlot + 1);
        }

        // Change letter
        if (input.consumeKey('ArrowUp')) {
            this.letters[this.currentSlot] = (this.letters[this.currentSlot] + 1) % 26;
        }
        if (input.consumeKey('ArrowDown')) {
            this.letters[this.currentSlot] = (this.letters[this.currentSlot] + 25) % 26;
        }

        // Confirm
        if (input.consumeKey('Enter') || input.consumeKey('Space')) {
            this._confirm();
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

        // Title "NUEVO RECORD!"
        const titleScale = scale * 1.5;
        const titleW = this._titleText.width * titleScale;
        const titleH = this._titleText.height * titleScale;
        ctx.save();
        ctx.drawImage(this._titleText, (W - titleW) / 2, H * 0.1, titleW, titleH);
        // Gold tint
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fillRect((W - titleW) / 2, H * 0.1, titleW, titleH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        // Level and meters info
        const infoScale = scale * 0.8;
        const levelW = this._levelText.width * infoScale;
        const levelH = this._levelText.height * infoScale;
        ctx.drawImage(this._levelText, (W - levelW) / 2, H * 0.25, levelW, levelH);

        const metersW = this._metersText.width * infoScale;
        const metersH = this._metersText.height * infoScale;
        ctx.drawImage(this._metersText, (W - metersW) / 2, H * 0.25 + levelH + 10, metersW, metersH);

        // Draw 3 letter slots
        const slotSize = 60;
        const slotSpacing = 20;
        const totalSlotWidth = 3 * slotSize + 2 * slotSpacing;
        const startX = (W - totalSlotWidth) / 2;
        const slotY = H * 0.45;
        const arrowH = 24; // touch-friendly arrow zone height

        // Store slot bounds for touch detection
        this._slotBounds = [];

        for (let i = 0; i < 3; i++) {
            const x = startX + i * (slotSize + slotSpacing);

            // Store bounds
            this._slotBounds.push({
                x, y: slotY, w: slotSize, h: slotSize,
                upZone: { x, y: slotY - arrowH, w: slotSize, h: arrowH },
                downZone: { x, y: slotY + slotSize, w: slotSize, h: arrowH },
            });

            // Slot background
            ctx.fillStyle = i === this.currentSlot ? '#2a4a8a' : '#1a2a4a';
            ctx.fillRect(x, slotY, slotSize, slotSize);

            // Slot border
            ctx.strokeStyle = i === this.currentSlot ? '#ffdd44' : '#4466aa';
            ctx.lineWidth = i === this.currentSlot ? 3 : 1;
            ctx.strokeRect(x, slotY, slotSize, slotSize);

            // Letter
            const letterTex = TC.renderText(this._getLetter(i));
            const letterScale = scale * 2;
            const letterW = letterTex.width * letterScale;
            const letterH = letterTex.height * letterScale;
            ctx.drawImage(letterTex,
                x + slotSize / 2 - letterW / 2,
                slotY + slotSize / 2 - letterH / 2,
                letterW, letterH);

            // Up/down arrows — always visible for all slots (touch targets)
            const isSelected = i === this.currentSlot;
            const arrowAlpha = isSelected ? (this.cursorBlink ? 1.0 : 0.5) : 0.3;
            ctx.save();
            ctx.globalAlpha = arrowAlpha;
            ctx.fillStyle = isSelected ? '#ffdd44' : '#6688cc';
            // Up arrow
            ctx.beginPath();
            ctx.moveTo(x + slotSize / 2, slotY - 14);
            ctx.lineTo(x + slotSize / 2 - 10, slotY - 4);
            ctx.lineTo(x + slotSize / 2 + 10, slotY - 4);
            ctx.fill();
            // Down arrow
            ctx.beginPath();
            ctx.moveTo(x + slotSize / 2, slotY + slotSize + 14);
            ctx.lineTo(x + slotSize / 2 - 10, slotY + slotSize + 4);
            ctx.lineTo(x + slotSize / 2 + 10, slotY + slotSize + 4);
            ctx.fill();
            ctx.restore();
        }

        // OK button for touch confirm
        const okBtnW = 120;
        const okBtnH = 44;
        const okBtnX = (W - okBtnW) / 2;
        const okBtnY = H * 0.72;
        this._okBounds = { x: okBtnX, y: okBtnY, w: okBtnW, h: okBtnH };

        ctx.fillStyle = '#2a6a2a';
        ctx.fillRect(okBtnX, okBtnY, okBtnW, okBtnH);
        ctx.strokeStyle = '#44cc44';
        ctx.lineWidth = 2;
        ctx.strokeRect(okBtnX, okBtnY, okBtnW, okBtnH);

        const okText = TC.renderText('OK');
        const okScale = scale * 1.2;
        const okW = okText.width * okScale;
        const okH = okText.height * okScale;
        ctx.drawImage(okText, okBtnX + okBtnW / 2 - okW / 2, okBtnY + okBtnH / 2 - okH / 2, okW, okH);

        // Instructions
        const instrScale = scale * 0.5;
        const instrW = this._instructText.width * instrScale;
        const instrH = this._instructText.height * instrScale;
        ctx.globalAlpha = 0.6 + Math.sin(this.timer * 2) * 0.3;
        ctx.drawImage(this._instructText, (W - instrW) / 2, H * 0.88, instrW, instrH);
        ctx.globalAlpha = 1.0;
    }

    onClick(x, y) {
        if (this.confirmed) return;

        // Check OK button
        if (this._okBounds && this._hitTest(x, y, this._okBounds)) {
            this._confirm();
            return;
        }

        // Check slot arrows and slot selection
        if (this._slotBounds) {
            for (let i = 0; i < this._slotBounds.length; i++) {
                const slot = this._slotBounds[i];
                // Tap up arrow zone
                if (this._hitTest(x, y, slot.upZone)) {
                    this.currentSlot = i;
                    this.letters[i] = (this.letters[i] + 1) % 26;
                    return;
                }
                // Tap down arrow zone
                if (this._hitTest(x, y, slot.downZone)) {
                    this.currentSlot = i;
                    this.letters[i] = (this.letters[i] + 25) % 26;
                    return;
                }
                // Tap on slot itself — select it
                if (this._hitTest(x, y, slot)) {
                    this.currentSlot = i;
                    return;
                }
            }
        }
    }

    _confirm() {
        if (this.confirmed) return;
        this.confirmed = true;
        const initials = this._getInitials();
        HallOfFame.addScore(initials, this.level, this.totalMeters);
        this.game.state.totalMeters = 0;
        this.game.state.currentLevel = undefined;
        this.game.state.ammo = undefined;
        setTimeout(() => {
            this.game.music.playTrack('menu');
            this.game.setScene('hallOfFame');
        }, 500);
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }
}
