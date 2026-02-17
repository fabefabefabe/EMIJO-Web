// Map Scene - shows Uruguay's coastal route between city transitions
import { Config, CITY_DATA, getCityForLevel, isBeachLevel } from '../config.js';
import * as TC from '../textureCache.js';

// City positions on the canvas (960×540)
// Inverted: land (green) on top, ocean (blue) on bottom
// Route goes from left (Montevideo) to right (Barra del Chuy)
// Coast line runs diagonally from upper-left to lower-right
const CITY_POSITIONS = [
    { x: 65,  y: 155 },   // Montevideo
    { x: 130, y: 185 },   // Ciudad de la Costa
    { x: 200, y: 210 },   // REPUBLICA del Pinar
    { x: 270, y: 235 },   // Atlantida
    { x: 340, y: 255 },   // Jaureguiberry
    { x: 410, y: 275 },   // Santa Ana
    { x: 480, y: 295 },   // Piriapolis
    { x: 545, y: 310 },   // CHIUAUA
    { x: 610, y: 325 },   // Punta del Este
    { x: 670, y: 340 },   // Jose Ignacio
    { x: 730, y: 355 },   // La Paloma
    { x: 785, y: 368 },   // Cabo Polonio
    { x: 835, y: 380 },   // Punta del Diablo
    { x: 880, y: 390 },   // La Coronilla
    { x: 925, y: 400 },   // Barra del Chuy
];

// Label placement for each city: direction from dot + custom offset
// 'above' = label above dot, 'below' = label below dot
// 'left' = label to the left, 'right' = label to the right
const LABEL_PLACEMENT = [
    { side: 'above', offsetX: 0,   offsetY: -8 },   // Montevideo
    { side: 'below', offsetX: 10,  offsetY: 8 },    // Ciudad de la Costa
    { side: 'above', offsetX: 0,   offsetY: -8 },   // REPUBLICA del Pinar
    { side: 'below', offsetX: 10,  offsetY: 8 },    // Atlantida
    { side: 'above', offsetX: 0,   offsetY: -8 },   // Jaureguiberry
    { side: 'below', offsetX: 10,  offsetY: 8 },    // Santa Ana
    { side: 'above', offsetX: 0,   offsetY: -8 },   // Piriapolis
    { side: 'below', offsetX: 10,  offsetY: 8 },    // CHIUAUA
    { side: 'above', offsetX: 0,   offsetY: -8 },   // Punta del Este
    { side: 'below', offsetX: 10,  offsetY: 8 },    // Jose Ignacio
    { side: 'above', offsetX: 0,   offsetY: -8 },   // La Paloma
    { side: 'below', offsetX: 10,  offsetY: 8 },    // Cabo Polonio
    { side: 'above', offsetX: 0,   offsetY: -8 },   // Punta del Diablo
    { side: 'below', offsetX: 10,  offsetY: 8 },    // La Coronilla
    { side: 'above', offsetX: -20, offsetY: -8 },   // Barra del Chuy
];

// Coast polygon (land mass, green area) — fills from top edge down to coast
const COAST_POLYGON = [
    { x: 0,   y: 0 },
    { x: 960, y: 0 },
    { x: 960, y: 430 },
    { x: 920, y: 420 },
    { x: 870, y: 410 },
    { x: 820, y: 398 },
    { x: 770, y: 385 },
    { x: 720, y: 372 },
    { x: 660, y: 358 },
    { x: 600, y: 342 },
    { x: 535, y: 325 },
    { x: 470, y: 310 },
    { x: 400, y: 292 },
    { x: 330, y: 272 },
    { x: 260, y: 250 },
    { x: 190, y: 225 },
    { x: 120, y: 200 },
    { x: 60,  y: 170 },
    { x: 0,   y: 140 },
];

// Inner land gradient polygon (lighter green, higher up)
const INNER_LAND = [
    { x: 0,   y: 0 },
    { x: 960, y: 0 },
    { x: 960, y: 380 },
    { x: 800, y: 350 },
    { x: 600, y: 300 },
    { x: 400, y: 245 },
    { x: 200, y: 180 },
    { x: 0,   y: 100 },
];

// Coastline points (sand/beach line at edge of land)
const COASTLINE = [
    { x: 0,   y: 150 },
    { x: 50,  y: 165 },
    { x: 100, y: 185 },
    { x: 150, y: 205 },
    { x: 210, y: 225 },
    { x: 270, y: 245 },
    { x: 340, y: 265 },
    { x: 410, y: 285 },
    { x: 475, y: 305 },
    { x: 540, y: 320 },
    { x: 605, y: 337 },
    { x: 665, y: 352 },
    { x: 725, y: 367 },
    { x: 780, y: 380 },
    { x: 830, y: 393 },
    { x: 875, y: 405 },
    { x: 925, y: 416 },
    { x: 960, y: 425 },
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

        // Play map music
        this.game.music.playTrack('map');
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
        const nextLevel = this.game.state.currentLevel || 1;
        const track = isBeachLevel(nextLevel) ? 'beach' : 'game';
        this.game.music.playTrack(track);
        this.game.setScene('game');
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;

        // --- Ocean background (below coast) ---
        ctx.fillStyle = '#0a1e3d';
        ctx.fillRect(0, 0, W, H);

        // --- Ocean subtle wave texture (only in lower portion) ---
        ctx.save();
        ctx.globalAlpha = 0.08;
        const waveTime = performance.now() / 1000;
        for (let wy = 160; wy < H; wy += 30) {
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

        // --- Land mass (green polygon, covers top portion) ---
        ctx.fillStyle = '#1a4d1a';
        ctx.beginPath();
        ctx.moveTo(COAST_POLYGON[0].x, COAST_POLYGON[0].y);
        for (let i = 1; i < COAST_POLYGON.length; i++) {
            ctx.lineTo(COAST_POLYGON[i].x, COAST_POLYGON[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // --- Inner land gradient (lighter green towards interior) ---
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#2a6d2a';
        ctx.beginPath();
        ctx.moveTo(INNER_LAND[0].x, INNER_LAND[0].y);
        for (let i = 1; i < INNER_LAND.length; i++) {
            ctx.lineTo(INNER_LAND[i].x, INNER_LAND[i].y);
        }
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
                dotColor = '#888888'; // gray (brighter for visibility on dark ocean)
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
            ctx.strokeStyle = isTarget ? '#ffffff' : (isVisited || isFirst ? '#b8860b' : '#555555');
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // City name label
            const cityText = this._cityTexts[i];
            const nameScale = scale * 0.4;
            const nameW = cityText.width * nameScale;
            const nameH = cityText.height * nameScale;

            // Use per-city placement to avoid overlaps
            const placement = LABEL_PLACEMENT[i];
            let nameX, nameY;
            if (placement.side === 'above') {
                nameX = pos.x - nameW / 2 + placement.offsetX;
                nameY = pos.y - dotRadius - nameH + placement.offsetY;
            } else {
                nameX = pos.x - nameW / 2 + placement.offsetX;
                nameY = pos.y + dotRadius + placement.offsetY;
            }

            // Clamp to canvas bounds
            if (nameX < 4) nameX = 4;
            if (nameX + nameW > W - 4) nameX = W - 4 - nameW;

            ctx.save();
            ctx.imageSmoothingEnabled = false;

            if (isTarget) {
                ctx.globalAlpha = 1.0;
            } else if (isVisited || isFirst) {
                ctx.globalAlpha = 0.85;
            } else {
                ctx.globalAlpha = 0.5;
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

        // --- "TU ESTAS AQUI" marker (first map only) ---
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
