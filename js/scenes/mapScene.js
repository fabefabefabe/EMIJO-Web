// Map Scene - shows Uruguay's coastal route between city transitions
import { Config, CITY_DATA, getCityForLevel, isBeachLevel } from '../config.js';
import * as TC from '../textureCache.js';

// ============================================================
// City positions in a virtual 1200×700 coordinate system.
// We then scale + center this into the 960×540 canvas, giving
// a natural "zoom-out" feel with margins on all sides.
// Land on top (green), ocean on bottom (blue).
// Route runs from SW (Montevideo) to NE (Barra del Chuy).
// ============================================================

const VIRTUAL_W = 1200;
const VIRTUAL_H = 700;

// City dot positions in virtual coords — well-spread diagonal
const CITY_POSITIONS_VIRTUAL = [
    { x: 75,   y: 220 },   // 0  Montevideo
    { x: 160,  y: 250 },   // 1  Ciudad de la Costa
    { x: 250,  y: 280 },   // 2  REPUBLICA del Pinar
    { x: 335,  y: 310 },   // 3  Atlantida
    { x: 425,  y: 335 },   // 4  Jaureguiberry
    { x: 510,  y: 358 },   // 5  Santa Ana
    { x: 595,  y: 378 },   // 6  Piriapolis
    { x: 680,  y: 398 },   // 7  CHIUAUA
    { x: 760,  y: 415 },   // 8  Punta del Este
    { x: 840,  y: 432 },   // 9  Jose Ignacio
    { x: 920,  y: 448 },   // 10 La Paloma
    { x: 990,  y: 462 },   // 11 Cabo Polonio
    { x: 1050, y: 475 },   // 12 Punta del Diablo
    { x: 1100, y: 487 },   // 13 La Coronilla
    { x: 1145, y: 498 },   // 14 Barra del Chuy
];

// Label placement offsets from dot in virtual coords
// above = negative labelY, below = positive labelY
const LABEL_PLACEMENT = [
    { labelX: 12,  labelY: -22 },  // 0  Montevideo — above
    { labelX: 12,  labelY: 12 },   // 1  Ciudad de la Costa — below
    { labelX: 12,  labelY: -22 },  // 2  REP del Pinar — above
    { labelX: 12,  labelY: 12 },   // 3  Atlantida — below
    { labelX: 12,  labelY: -22 },  // 4  Jaureguiberry — above
    { labelX: 12,  labelY: 12 },   // 5  Santa Ana — below
    { labelX: 12,  labelY: -22 },  // 6  Piriapolis — above
    { labelX: 12,  labelY: 12 },   // 7  CHIUAUA — below
    { labelX: 12,  labelY: -22 },  // 8  Punta del Este — above
    { labelX: 12,  labelY: 12 },   // 9  Jose Ignacio — below
    { labelX: 12,  labelY: -22 },  // 10 La Paloma — above
    { labelX: 12,  labelY: 12 },   // 11 Cabo Polonio — below
    { labelX: 12,  labelY: -22 },  // 12 Punta del Diablo — above
    { labelX: 12,  labelY: 12 },   // 13 La Coronilla — below
    { labelX: -95, labelY: -22 },  // 14 Barra del Chuy — above left
];

// Coast polygon in virtual coords (land mass from top)
const COAST_POLYGON_V = [
    { x: 0,    y: 0 },
    { x: 1200, y: 0 },
    { x: 1200, y: 540 },
    { x: 1140, y: 520 },
    { x: 1080, y: 500 },
    { x: 1010, y: 482 },
    { x: 930,  y: 465 },
    { x: 850,  y: 448 },
    { x: 770,  y: 430 },
    { x: 690,  y: 412 },
    { x: 605,  y: 392 },
    { x: 520,  y: 372 },
    { x: 435,  y: 348 },
    { x: 345,  y: 322 },
    { x: 260,  y: 295 },
    { x: 170,  y: 264 },
    { x: 85,   y: 234 },
    { x: 0,    y: 200 },
];

// Inner land (lighter green) in virtual coords
const INNER_LAND_V = [
    { x: 0,    y: 0 },
    { x: 1200, y: 0 },
    { x: 1200, y: 480 },
    { x: 1000, y: 430 },
    { x: 800,  y: 380 },
    { x: 600,  y: 335 },
    { x: 400,  y: 280 },
    { x: 200,  y: 220 },
    { x: 0,    y: 150 },
];

// Coastline (sandy line) in virtual coords
const COASTLINE_V = [
    { x: 0,    y: 210 },
    { x: 70,   y: 232 },
    { x: 155,  y: 258 },
    { x: 245,  y: 287 },
    { x: 335,  y: 314 },
    { x: 425,  y: 340 },
    { x: 510,  y: 363 },
    { x: 595,  y: 384 },
    { x: 680,  y: 404 },
    { x: 760,  y: 422 },
    { x: 840,  y: 440 },
    { x: 920,  y: 456 },
    { x: 1000, y: 474 },
    { x: 1070, y: 492 },
    { x: 1135, y: 512 },
    { x: 1200, y: 530 },
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

        // Compute scale to fit virtual coords into canvas with margins
        const W = Config.sceneWidth;   // 960
        const H = Config.sceneHeight;  // 540
        const marginX = 30;
        const marginTop = 55;  // room for title
        const marginBottom = 45; // room for instructions
        const availW = W - marginX * 2;
        const availH = H - marginTop - marginBottom;
        this._mapScale = Math.min(availW / VIRTUAL_W, availH / VIRTUAL_H);
        this._mapOffsetX = marginX + (availW - VIRTUAL_W * this._mapScale) / 2;
        this._mapOffsetY = marginTop + (availH - VIRTUAL_H * this._mapScale) / 2;

        // Pre-compute city positions in canvas coords
        this._cityPositions = CITY_POSITIONS_VIRTUAL.map(p => this._toCanvas(p));

        // Animation
        this.routeAnimDuration = 2.0;
        this.routeProgress = 0;

        // Pulsing for current city
        this.pulseTimer = 0;

        // Instruction blink
        this.instructionAlpha = 1.0;
        this.instructionDir = -1;

        // Is this the very first map showing (level 1, Montevideo)?
        this.isFirstMap = (this.targetCityIndex === 0);
        if (this.isFirstMap) {
            this.routeAnimDuration = 0.5;
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

    /** Convert virtual coordinates to canvas coordinates */
    _toCanvas(p) {
        return {
            x: this._mapOffsetX + p.x * this._mapScale,
            y: this._mapOffsetY + p.y * this._mapScale,
        };
    }

    _getCityIndex(level) {
        for (let i = CITY_DATA.length - 1; i >= 0; i--) {
            if (level >= CITY_DATA[i].level) return i;
        }
        return 0;
    }

    update(dt) {
        this.timer += dt;

        if (this.routeProgress < 1) {
            this.routeProgress = Math.min(1, this.timer / this.routeAnimDuration);
        }

        if (this.timer >= this.routeAnimDuration + 0.3) {
            this.canProceed = true;
        }

        this.pulseTimer += dt * 4;
        this._youAreHereTimer += dt;

        if (this.canProceed) {
            this.instructionAlpha += this.instructionDir * 0.75 * dt;
            if (this.instructionAlpha <= 0.3) { this.instructionAlpha = 0.3; this.instructionDir = 1; }
            if (this.instructionAlpha >= 1.0) { this.instructionAlpha = 1.0; this.instructionDir = -1; }
        }

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

    /** Draw a polygon from virtual coords */
    _drawPoly(ctx, points) {
        const p0 = this._toCanvas(points[0]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < points.length; i++) {
            const p = this._toCanvas(points[i]);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;
        const ms = this._mapScale;

        // --- Ocean background ---
        ctx.fillStyle = '#0a1e3d';
        ctx.fillRect(0, 0, W, H);

        // --- Ocean subtle wave texture ---
        ctx.save();
        ctx.globalAlpha = 0.08;
        const waveTime = performance.now() / 1000;
        for (let wy = this._mapOffsetY + 120 * ms; wy < H; wy += 25) {
            const waveOff = Math.sin(waveTime + wy * 0.03) * 6;
            ctx.strokeStyle = '#3a6ea5';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let wx = 0; wx < W; wx += 5) {
                const y2 = wy + Math.sin(waveTime * 1.5 + wx * 0.02) * 2.5 + waveOff;
                if (wx === 0) ctx.moveTo(wx, y2);
                else ctx.lineTo(wx, y2);
            }
            ctx.stroke();
        }
        ctx.restore();

        // --- Land mass (dark green polygon) ---
        ctx.fillStyle = '#1a4d1a';
        this._drawPoly(ctx, COAST_POLYGON_V);
        ctx.fill();

        // --- Inner land gradient (lighter green) ---
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#2a6d2a';
        this._drawPoly(ctx, INNER_LAND_V);
        ctx.fill();
        ctx.restore();

        // --- Coastline (beige sand line) ---
        ctx.strokeStyle = '#d4b896';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const cl0 = this._toCanvas(COASTLINE_V[0]);
        ctx.moveTo(cl0.x, cl0.y);
        for (let i = 1; i < COASTLINE_V.length; i++) {
            const prev = this._toCanvas(COASTLINE_V[i - 1]);
            const curr = this._toCanvas(COASTLINE_V[i]);
            const cpx = (prev.x + curr.x) / 2;
            const cpy = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        const clLast = this._toCanvas(COASTLINE_V[COASTLINE_V.length - 1]);
        ctx.lineTo(clLast.x, clLast.y);
        ctx.stroke();

        // --- Route line (red, animated) ---
        const CP = this._cityPositions;
        if (this.targetCityIndex > 0 && this.routeProgress > 0) {
            const totalSegments = this.targetCityIndex;
            const progressSegments = this.routeProgress * totalSegments;
            const fullSegments = Math.floor(progressSegments);
            const partialFrac = progressSegments - fullSegments;

            // Route glow (drawn first, wider)
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(CP[0].x, CP[0].y);
            for (let i = 1; i <= fullSegments && i < CP.length; i++) {
                ctx.lineTo(CP[i].x, CP[i].y);
            }
            if (fullSegments < totalSegments) {
                const from = CP[fullSegments];
                const to = CP[fullSegments + 1];
                if (to) {
                    ctx.lineTo(from.x + (to.x - from.x) * partialFrac,
                               from.y + (to.y - from.y) * partialFrac);
                }
            }
            ctx.stroke();
            ctx.restore();

            // Route line (solid)
            ctx.strokeStyle = '#e63946';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(CP[0].x, CP[0].y);
            for (let i = 1; i <= fullSegments && i < CP.length; i++) {
                ctx.lineTo(CP[i].x, CP[i].y);
            }
            if (fullSegments < totalSegments) {
                const from = CP[fullSegments];
                const to = CP[fullSegments + 1];
                if (to) {
                    ctx.lineTo(from.x + (to.x - from.x) * partialFrac,
                               from.y + (to.y - from.y) * partialFrac);
                }
            }
            ctx.stroke();
        }

        // --- City dots and names ---
        // Use a smaller text scale relative to map scale
        const textScale = scale * 0.28;

        for (let i = 0; i < CITY_DATA.length; i++) {
            const pos = CP[i];
            const isTarget = (i === this.targetCityIndex);
            const isVisited = (i < this.targetCityIndex);
            const isFirst = (i === 0);

            // Dot color & size
            let dotColor, dotRadius;
            if (isTarget) {
                const pulse = 0.5 + Math.sin(this.pulseTimer) * 0.5;
                const g = Math.round(200 + pulse * 55);
                const b = Math.round(50 * (1 - pulse));
                dotColor = `rgb(255,${g},${b})`;
                dotRadius = 5 + Math.sin(this.pulseTimer) * 1.5;
            } else if (isVisited || isFirst) {
                dotColor = '#ffd700';
                dotRadius = 4;
            } else {
                dotColor = '#888888';
                dotRadius = 3;
            }

            // Dot glow for target
            if (isTarget) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, dotRadius + 4, 0, Math.PI * 2);
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
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // City name label
            const cityText = this._cityTexts[i];
            const nameW = cityText.width * textScale;
            const nameH = cityText.height * textScale;

            // Position using label placement offsets (scaled)
            const placement = LABEL_PLACEMENT[i];
            let nameX = pos.x + placement.labelX * ms;
            let nameY = pos.y + placement.labelY * ms;

            // Clamp to canvas bounds
            if (nameX < 4) nameX = 4;
            if (nameX + nameW > W - 4) nameX = W - 4 - nameW;
            if (nameY < 4) nameY = 4;
            if (nameY + nameH > H - 4) nameY = H - 4 - nameH;

            ctx.save();
            ctx.imageSmoothingEnabled = false;

            if (isTarget) {
                ctx.globalAlpha = 1.0;
            } else if (isVisited || isFirst) {
                ctx.globalAlpha = 0.9;
            } else {
                ctx.globalAlpha = 0.55;
            }

            ctx.drawImage(cityText, nameX, nameY, nameW, nameH);
            ctx.restore();
        }

        // --- "TU ESTAS AQUI" marker (first map only) ---
        if (this.isFirstMap && this.canProceed) {
            const targetPos = CP[this.targetCityIndex];
            const yahText = this._youAreHereText;
            const yahScale = scale * 0.45;
            const yahW = yahText.width * yahScale;
            const yahH = yahText.height * yahScale;

            // Position above+right of the city dot
            const yahX = targetPos.x + 15;
            const yahY = targetPos.y - 50 - yahH;

            // Clamp so it doesn't go off-screen
            const clampedX = Math.max(4, Math.min(yahX, W - yahW - 20));
            const clampedY = Math.max(4, yahY);

            // Bobbing animation
            const bob = Math.sin(this._youAreHereTimer * 3) * 3;

            // Background bubble
            const pad = 5;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
            const bubbleX = clampedX - pad;
            const bubbleY = clampedY - pad + bob;
            const bubbleW = yahW + pad * 2;
            const bubbleH = yahH + pad * 2;
            const r = 4;
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

            // Pointer triangle
            const ptrX = targetPos.x + 15;
            const clampedPtrX = Math.max(bubbleX + 10, Math.min(ptrX, bubbleX + bubbleW - 10));
            ctx.beginPath();
            ctx.moveTo(clampedPtrX - 5, bubbleY + bubbleH);
            ctx.lineTo(clampedPtrX + 5, bubbleY + bubbleH);
            ctx.lineTo(clampedPtrX, bubbleY + bubbleH + 8);
            ctx.closePath();
            ctx.fill();

            // Text
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(yahText, clampedX, clampedY + bob, yahW, yahH);
            ctx.restore();
        }

        // --- Title "RUTA COSTERA" in gold at top ---
        const titleScale = scale * 1.2;
        const titleW = this._titleText.width * titleScale;
        const titleH = this._titleText.height * titleScale;
        const titleX = (W - titleW) / 2;
        const titleY = 12;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._titleText, titleX, titleY, titleW, titleH);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fillRect(titleX, titleY, titleW, titleH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        // --- "TOCA O PULSA ENTER" instruction ---
        if (this.canProceed) {
            const instrScale = scale * 0.55;
            const instrW = this._continueText.width * instrScale;
            const instrH = this._continueText.height * instrScale;
            ctx.save();
            ctx.globalAlpha = this.instructionAlpha;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this._continueText, (W - instrW) / 2, H - instrH - 15, instrW, instrH);
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
