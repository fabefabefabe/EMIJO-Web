// Map Scene - shows Uruguay's coastal route between city transitions
import { Config, CITY_DATA, getCityForLevel } from '../config.js';
import * as TC from '../textureCache.js';

// City positions on the canvas (960×540) — SW→NE along coast
const CITY_POSITIONS = [
    { x: 100, y: 440 },   // Montevideo
    { x: 170, y: 420 },   // Ciudad de la Costa
    { x: 230, y: 400 },   // REPUBLICA del Pinar
    { x: 290, y: 385 },   // Atlantida
    { x: 340, y: 365 },   // Jaureguiberry
    { x: 380, y: 345 },   // Santa Ana
    { x: 420, y: 320 },   // Piriapolis
    { x: 470, y: 295 },   // CHIUAUA
    { x: 520, y: 275 },   // Punta del Este
    { x: 580, y: 250 },   // Jose Ignacio
    { x: 640, y: 225 },   // La Paloma
    { x: 700, y: 200 },   // Cabo Polonio
    { x: 760, y: 170 },   // Punta del Diablo
    { x: 810, y: 145 },   // La Coronilla
    { x: 860, y: 120 },   // Barra del Chuy
];

// Coast polygon (land mass, green area) — rough Uruguay coast shape
const COAST_POLYGON = [
    { x: 0, y: 540 },
    { x: 0, y: 400 },
    { x: 40, y: 410 },
    { x: 80, y: 430 },
    { x: 100, y: 425 },
    { x: 150, y: 405 },
    { x: 200, y: 385 },
    { x: 260, y: 370 },
    { x: 310, y: 350 },
    { x: 360, y: 330 },
    { x: 400, y: 305 },
    { x: 450, y: 280 },
    { x: 500, y: 260 },
    { x: 560, y: 235 },
    { x: 620, y: 210 },
    { x: 680, y: 185 },
    { x: 740, y: 155 },
    { x: 790, y: 130 },
    { x: 840, y: 105 },
    { x: 880, y: 90 },
    { x: 920, y: 80 },
    { x: 960, y: 70 },
    { x: 960, y: 540 },
];

// Coastline points (the shore edge — offset from polygon)
const COASTLINE = [
    { x: 60, y: 450 },
    { x: 100, y: 445 },
    { x: 140, y: 430 },
    { x: 190, y: 410 },
    { x: 240, y: 395 },
    { x: 290, y: 377 },
    { x: 330, y: 358 },
    { x: 370, y: 338 },
    { x: 410, y: 315 },
    { x: 455, y: 290 },
    { x: 510, y: 268 },
    { x: 565, y: 245 },
    { x: 625, y: 220 },
    { x: 685, y: 195 },
    { x: 745, y: 165 },
    { x: 800, y: 140 },
    { x: 845, y: 115 },
    { x: 890, y: 98 },
    { x: 940, y: 85 },
];

export class MapScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        this.timer = 0;
        this.canProceed = false;

        // Determine which city we're going to (the level that's about to start)
        const nextLevel = this.game.state.currentLevel || 1;
        this.targetCityIndex = this._getCityIndex(nextLevel);

        // Animation
        this.routeAnimDuration = 2.0; // seconds to animate route
        this.routeProgress = 0; // 0 → 1

        // Pulsing for current city
        this.pulseTimer = 0;

        // Instruction blink
        this.instructionAlpha = 1.0;
        this.instructionDir = -1;

        // Is this the very first map showing (level 1, Montevideo)?
        this.isFirstMap = (this.targetCityIndex === 0);

        // For first map, no route animation needed — show immediately
        if (this.isFirstMap) {
            this.routeAnimDuration = 0.5; // short pause then ready
        }

        // Text caches
        this._titleText = TC.renderText('RUTA COSTERA');
        this._continueText = TC.renderText('TOCA O PULSA ENTER');
        this._youAreHereText = TC.renderText('TU ESTAS AQUI');

        // "You are here" marker animation
        this._youAreHereTimer = 0;

        // Pre-render city name texts
        this._cityTexts = CITY_DATA.map(c => TC.renderText(c.name.toUpperCase()));
    }

    _getCityIndex(level) {
        for (let i = CITY_DATA.length - 1; i >= 0; i--) {
            if (level >= CITY_DATA[i].level) return i;
        }
        return 0;
    }

    update(dt) {
        this.timer += dt;

        // Animate route drawing
        if (this.routeProgress < 1) {
            this.routeProgress = Math.min(1, this.timer / this.routeAnimDuration);
        }

        // Allow proceeding after animation completes + 0.3s buffer
        if (this.timer >= this.routeAnimDuration + 0.3) {
            this.canProceed = true;
        }

        // Pulse timer for current city dot
        this.pulseTimer += dt * 4;

        // "You are here" marker animation
        this._youAreHereTimer += dt;

        // Instruction blink
        if (this.canProceed) {
            this.instructionAlpha += this.instructionDir * 0.75 * dt;
            if (this.instructionAlpha <= 0.3) { this.instructionAlpha = 0.3; this.instructionDir = 1; }
            if (this.instructionAlpha >= 1.0) { this.instructionAlpha = 1.0; this.instructionDir = -1; }
        }

        // Input
        const input = this.game.input;
        if (this.canProceed) {
            if (input.consumeKey('Enter') || input.consumeKey('Space')) {
                this._advance();
            }
        }
    }

    _advance() {
        this.game.music.playTrack('game');
        this.game.setScene('game');
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;

        // --- Ocean background ---
        ctx.fillStyle = '#0a1e3d';
        ctx.fillRect(0, 0, W, H);

        // --- Ocean subtle wave texture ---
        ctx.save();
        ctx.globalAlpha = 0.08;
        const waveTime = performance.now() / 1000;
        for (let wy = 0; wy < H; wy += 30) {
            const waveOff = Math.sin(waveTime + wy * 0.03) * 8;
            ctx.strokeStyle = '#3a6ea5';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let wx = 0; wx < W; wx += 5) {
                const y2 = wy + Math.sin(waveTime * 1.5 + wx * 0.02) * 3 + waveOff;
                if (wx === 0) ctx.moveTo(wx, y2);
                else ctx.lineTo(wx, y2);
            }
            ctx.stroke();
        }
        ctx.restore();

        // --- Land mass (green polygon) ---
        ctx.fillStyle = '#1a4d1a';
        ctx.beginPath();
        ctx.moveTo(COAST_POLYGON[0].x, COAST_POLYGON[0].y);
        for (let i = 1; i < COAST_POLYGON.length; i++) {
            ctx.lineTo(COAST_POLYGON[i].x, COAST_POLYGON[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // --- Inner land gradient (lighter green towards center) ---
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#2a6d2a';
        ctx.beginPath();
        ctx.moveTo(0, 540);
        ctx.lineTo(0, 440);
        ctx.lineTo(200, 430);
        ctx.lineTo(400, 370);
        ctx.lineTo(600, 280);
        ctx.lineTo(800, 190);
        ctx.lineTo(960, 130);
        ctx.lineTo(960, 540);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // --- Coastline (beige/sand line) ---
        ctx.strokeStyle = '#d4b896';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(COASTLINE[0].x, COASTLINE[0].y);
        for (let i = 1; i < COASTLINE.length; i++) {
            const prev = COASTLINE[i - 1];
            const curr = COASTLINE[i];
            // Smooth curve
            const cpx = (prev.x + curr.x) / 2;
            const cpy = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        ctx.lineTo(COASTLINE[COASTLINE.length - 1].x, COASTLINE[COASTLINE.length - 1].y);
        ctx.stroke();

        // --- Route line (red, animated) ---
        if (this.targetCityIndex > 0 && this.routeProgress > 0) {
            // Calculate how far along the route to draw
            const totalSegments = this.targetCityIndex;
            const progressSegments = this.routeProgress * totalSegments;
            const fullSegments = Math.floor(progressSegments);
            const partialFrac = progressSegments - fullSegments;

            ctx.strokeStyle = '#e63946';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(CITY_POSITIONS[0].x, CITY_POSITIONS[0].y);

            for (let i = 1; i <= fullSegments && i < CITY_POSITIONS.length; i++) {
                ctx.lineTo(CITY_POSITIONS[i].x, CITY_POSITIONS[i].y);
            }

            // Partial segment
            if (fullSegments < totalSegments) {
                const fromIdx = fullSegments;
                const toIdx = fullSegments + 1;
                if (toIdx < CITY_POSITIONS.length) {
                    const from = CITY_POSITIONS[fromIdx];
                    const to = CITY_POSITIONS[toIdx];
                    const px = from.x + (to.x - from.x) * partialFrac;
                    const py = from.y + (to.y - from.y) * partialFrac;
                    ctx.lineTo(px, py);
                }
            }

            ctx.stroke();

            // Draw route glow
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(CITY_POSITIONS[0].x, CITY_POSITIONS[0].y);
            for (let i = 1; i <= fullSegments && i < CITY_POSITIONS.length; i++) {
                ctx.lineTo(CITY_POSITIONS[i].x, CITY_POSITIONS[i].y);
            }
            if (fullSegments < totalSegments) {
                const fromIdx = fullSegments;
                const toIdx = fullSegments + 1;
                if (toIdx < CITY_POSITIONS.length) {
                    const from = CITY_POSITIONS[fromIdx];
                    const to = CITY_POSITIONS[toIdx];
                    const px = from.x + (to.x - from.x) * partialFrac;
                    const py = from.y + (to.y - from.y) * partialFrac;
                    ctx.lineTo(px, py);
                }
            }
            ctx.stroke();
            ctx.restore();
        }

        // --- City dots and names ---
        for (let i = 0; i < CITY_DATA.length; i++) {
            const pos = CITY_POSITIONS[i];
            const isTarget = (i === this.targetCityIndex);
            const isVisited = (i < this.targetCityIndex);
            const isFirst = (i === 0); // Montevideo always visited

            // Dot color
            let dotColor, dotRadius;
            if (isTarget) {
                // Pulsing yellow/gold
                const pulse = 0.5 + Math.sin(this.pulseTimer) * 0.5;
                const r = Math.round(255);
                const g = Math.round(200 + pulse * 55);
                const b = Math.round(50 * (1 - pulse));
                dotColor = `rgb(${r},${g},${b})`;
                dotRadius = 6 + Math.sin(this.pulseTimer) * 2;
            } else if (isVisited || isFirst) {
                dotColor = '#ffd700'; // gold
                dotRadius = 5;
            } else {
                dotColor = '#666666'; // gray
                dotRadius = 4;
            }

            // Draw dot glow for target
            if (isTarget) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, dotRadius + 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Draw dot
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            // Dot border
            ctx.strokeStyle = isTarget ? '#ffffff' : (isVisited || isFirst ? '#b8860b' : '#444444');
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // City name
            const cityText = this._cityTexts[i];
            const nameScale = scale * 0.45;
            const nameW = cityText.width * nameScale;
            const nameH = cityText.height * nameScale;

            // Alternate above/below to avoid overlap
            const above = (i % 2 === 0);
            const nameX = pos.x - nameW / 2;
            const nameY = above ? pos.y - dotRadius - nameH - 4 : pos.y + dotRadius + 4;

            ctx.save();
            ctx.imageSmoothingEnabled = false;

            if (isTarget) {
                ctx.globalAlpha = 1.0;
            } else if (isVisited || isFirst) {
                ctx.globalAlpha = 0.85;
            } else {
                ctx.globalAlpha = 0.45;
            }

            ctx.drawImage(cityText, nameX, nameY, nameW, nameH);

            // Gold tint for visited/target cities
            if (isTarget || isVisited || isFirst) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = isTarget ? 'rgba(255, 255, 100, 0.5)' : 'rgba(255, 215, 0, 0.4)';
                ctx.fillRect(nameX, nameY, nameW, nameH);
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore();
        }

        // --- "TU ESTAS AQUI" marker (first map only, or always on target city for level 1) ---
        if (this.isFirstMap && this.canProceed) {
            const targetPos = CITY_POSITIONS[this.targetCityIndex];
            const yahText = this._youAreHereText;
            const yahScale = scale * 0.55;
            const yahW = yahText.width * yahScale;
            const yahH = yahText.height * yahScale;

            // Position above the city dot with a pointer
            const yahX = targetPos.x - yahW / 2;
            const yahY = targetPos.y - 55 - yahH;

            // Bobbing animation
            const bob = Math.sin(this._youAreHereTimer * 3) * 4;

            // Background bubble
            const pad = 6;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
            const bubbleX = yahX - pad;
            const bubbleY = yahY - pad + bob;
            const bubbleW = yahW + pad * 2;
            const bubbleH = yahH + pad * 2;
            // Rounded rect
            const r = 5;
            ctx.beginPath();
            ctx.moveTo(bubbleX + r, bubbleY);
            ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
            ctx.arcTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r, r);
            ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
            ctx.arcTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH, r);
            ctx.lineTo(bubbleX + r, bubbleY + bubbleH);
            ctx.arcTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r, r);
            ctx.lineTo(bubbleX, bubbleY + r);
            ctx.arcTo(bubbleX, bubbleY, bubbleX + r, bubbleY, r);
            ctx.closePath();
            ctx.fill();

            // Pointer triangle down to the dot
            ctx.beginPath();
            ctx.moveTo(targetPos.x - 6, bubbleY + bubbleH);
            ctx.lineTo(targetPos.x + 6, bubbleY + bubbleH);
            ctx.lineTo(targetPos.x, bubbleY + bubbleH + 10);
            ctx.closePath();
            ctx.fill();

            // Text
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(yahText, yahX, yahY + bob, yahW, yahH);
            ctx.restore();
        }

        // --- Title "RUTA COSTERA" in gold at top ---
        const titleScale = scale * 1.3;
        const titleW = this._titleText.width * titleScale;
        const titleH = this._titleText.height * titleScale;
        const titleX = (W - titleW) / 2;
        const titleY = 20;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._titleText, titleX, titleY, titleW, titleH);
        // Gold tint
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fillRect(titleX, titleY, titleW, titleH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        // --- "TOCA O PULSA ENTER" instruction (pulsing, after animation) ---
        if (this.canProceed) {
            const instrScale = scale * 0.65;
            const instrW = this._continueText.width * instrScale;
            const instrH = this._continueText.height * instrScale;
            ctx.save();
            ctx.globalAlpha = this.instructionAlpha;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this._continueText, (W - instrW) / 2, H - instrH - 25, instrW, instrH);
            ctx.restore();
        }

        // --- Music toggle button (top-right) ---
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
            this._advance();
        }
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }
}
