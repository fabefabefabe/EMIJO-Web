// Parallax Scrolling System - background layers with tile wrapping
// Layers: sky, sun, boats, sea, gardeners, bushes, sidewalk
import { Config, getTimeOfDay } from '../config.js';
import * as TC from '../textureCache.js';
import { Gardener } from '../entities/gardener.js';

/**
 * Draw order (back to front):
 * 1. Sky tiles        (scrollFactor 0.05)
 * 2. Sun              (scrollFactor 0.02, top-right)
 * 3. Boats            (scrollFactor 0.10, on horizon)
 * 4. Sea tiles        (scrollFactor 0.10, animated)
 * 5. Large bush tiles (scrollFactor 0.30, background)
 * 6. Gardener NPCs    (scrollFactor 0.35, middle)
 * 7. Small bush tiles (scrollFactor 0.45, foreground)
 * 8. Sidewalk tiles   (scrollFactor 1.00)
 */

export class ParallaxSystem {
    constructor(level = 1, isBeach = false) {
        // Time of day: 'day', 'sunset', or 'night'
        this.timeOfDay = getTimeOfDay(level);
        this.isBeach = isBeach;

        // Sea animation
        this.seaAnimTimer = 0;
        this.seaFrame = 0;

        // Sun animation
        this.sunAnimTimer = 0;
        this.sunFrame = 0;

        // Boats on the horizon (random X positions across visible area)
        this.boats = [];
        const boatCount = 8;
        for (let i = 0; i < boatCount; i++) {
            this.boats.push({
                x: Math.random() * Config.levelWidth * 1.5,
            });
        }

        // Gardener NPCs (alternating male/female) — not on beach
        this.gardeners = [];
        if (!isBeach) {
            const gardenerCount = 6;
            for (let i = 0; i < gardenerCount; i++) {
                const x = 200 + (Config.levelWidth / gardenerCount) * i + Math.random() * 100;
                const isFemale = i % 2 === 1;
                this.gardeners.push(new Gardener(x, isFemale));
            }
        }

        // Sandcastle kids (beach replacement for gardeners)
        this.sandcastles = [];
        if (isBeach) {
            const castleCount = 5;
            for (let i = 0; i < castleCount; i++) {
                this.sandcastles.push({
                    x: 300 + (Config.levelWidth / castleCount) * i + Math.random() * 200,
                    frame: 0,
                    timer: Math.random() * 0.6, // offset animation
                });
            }
        }

        // Flores aleatorias sobre los arbustos — not on beach
        this.flowers = [];
        if (!isBeach) {
            const flowerColors = ['red', 'yellow', 'pink', 'white', 'purple', 'orange'];
            const flowerCount = 150;
            for (let i = 0; i < flowerCount; i++) {
                this.flowers.push({
                    x: Math.random() * Config.levelWidth,
                    color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                    offsetY: Math.random() * 25,
                    scale: 0.8 + Math.random() * 0.4,
                });
            }
        }

        // Sand dunes (beach only, decorative bumps)
        this.dunes = [];
        if (isBeach) {
            const duneCount = 30;
            for (let i = 0; i < duneCount; i++) {
                this.dunes.push({
                    x: Math.random() * Config.levelWidth,
                    width: 20 + Math.random() * 30,
                    height: 3 + Math.random() * 5,
                });
            }
        }

        // Swimmers (beach only, animated people swimming in the water gap)
        this.swimmers = [];
        if (isBeach) {
            const swimmerCount = 8 + Math.floor(Math.random() * 5); // 8-12 swimmers
            for (let i = 0; i < swimmerCount; i++) {
                this.swimmers.push({
                    x: 200 + Math.random() * Config.levelWidth,
                    yOffset: Math.random(), // 0-1, used to position within gap
                    frame: Math.floor(Math.random() * 2),
                    timer: Math.random() * 0.6, // offset animation
                });
            }
        }
    }

    /**
     * Updates animation timers and gardener NPCs.
     */
    update(dt) {
        // Sea wave animation
        this.seaAnimTimer += dt;
        if (this.seaAnimTimer >= 0.5) {
            this.seaAnimTimer -= 0.5;
            this.seaFrame = (this.seaFrame + 1) % 3;
        }

        // Sun ray animation
        this.sunAnimTimer += dt;
        if (this.sunAnimTimer >= 0.4) {
            this.sunAnimTimer -= 0.4;
            this.sunFrame = (this.sunFrame + 1) % 3;
        }

        // Update gardener NPCs
        for (const g of this.gardeners) {
            g.update(dt);
        }

        // Update sandcastle kids animation
        for (const sc of this.sandcastles) {
            sc.timer += dt;
            if (sc.timer >= 0.6) {
                sc.timer -= 0.6;
                sc.frame = (sc.frame + 1) % 2;
            }
        }

        // Update swimmer animation
        for (const sw of this.swimmers) {
            sw.timer += dt;
            if (sw.timer >= 0.6) {
                sw.timer -= 0.6;
                sw.frame = (sw.frame + 1) % 2;
            }
        }
    }

    /**
     * Draws all parallax layers in order.
     */
    draw(ctx, cameraX) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;

        // Ground level in screen coords (bottom of playable area)
        // groundY=120, groundHeight=120, so groundSurface = 180 in game coords
        // Screen Y for ground surface = H - groundSurface = 540 - 180 = 360
        const groundScreenY = H - Config.groundSurface;

        // Select textures based on time of day
        let skyTex, seaTex, bushLargeTex, bushTex, swTex;
        if (this.timeOfDay === 'night') {
            skyTex = TC.skyNightTile;
            seaTex = TC.seaNightFrames[this.seaFrame];
            bushLargeTex = TC.bushLargeNightTile;
            bushTex = TC.bushNightTile;
            swTex = TC.sidewalkNightTile;
        } else if (this.timeOfDay === 'sunset') {
            skyTex = TC.skySunsetTile;
            seaTex = TC.seaSunsetFrames[this.seaFrame];
            bushLargeTex = TC.bushLargeSunsetTile;
            bushTex = TC.bushSunsetTile;
            swTex = TC.sidewalkSunsetTile;
        } else {
            skyTex = TC.skyTile;
            seaTex = TC.seaFrames[this.seaFrame];
            bushLargeTex = TC.bushLargeTile;
            bushTex = TC.bushTile;
            swTex = TC.sidewalkTile;
        }

        // Calculate layer heights (scaled 3x)
        const sidewalkH = swTex.height * scale; // 16*3 = 48px
        const bushH = bushTex.height * scale; // 24*3 = 72px (small bushes)
        const bushLargeH = bushLargeTex.height * scale; // 48*3 = 144px (large bushes)
        const seaH = TC.seaFrames[0].height * scale; // 32*3 = 96px (same dimensions for all palettes)

        // --- Layer 1: Sky (fills from top down to sea) ---
        // El agua debe estar detrás de los arbustos grandes (solapando por arriba)
        const seaScreenY = H - sidewalkH - bushLargeH - seaH + 60; // +60 para solapar con arbustos
        this._drawTileLayerFillDown(ctx, skyTex, 0.05, cameraX, scale, 0, W, seaScreenY);

        // --- Layer 2: Sun / Moon ---
        if (this.timeOfDay === 'night') {
            // Moon (crescent) top-right area
            const moonTex = TC.moonTex;
            const moonW = moonTex.width * scale;
            const moonH = moonTex.height * scale;
            const moonBaseX = W - moonW - 60;
            const moonBaseY = 25;
            const moonOffsetX = Math.round(cameraX * 0.02);
            ctx.imageSmoothingEnabled = false;
            // Subtle glow around moon
            ctx.save();
            const moonCX = Math.round(moonBaseX - moonOffsetX) + moonW / 2;
            const moonCY = moonBaseY + moonH / 2;
            const glowRadius = moonW * 1.5;
            const glow = ctx.createRadialGradient(moonCX, moonCY, moonW * 0.3, moonCX, moonCY, glowRadius);
            glow.addColorStop(0, 'rgba(200,200,255,0.15)');
            glow.addColorStop(1, 'rgba(200,200,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(moonCX - glowRadius, moonCY - glowRadius, glowRadius * 2, glowRadius * 2);
            ctx.restore();
            ctx.drawImage(moonTex, Math.round(moonBaseX - moonOffsetX), moonBaseY, moonW, moonH);
        } else if (this.timeOfDay === 'sunset') {
            // Sunset: large half-sun on the horizon with reflection
            const horizonTex = TC.sunsetHorizonFrames[this.sunFrame];
            const horizW = horizonTex.width * scale;
            const horizH = horizonTex.height * scale;
            // Position centered on the sea/sky boundary
            const sunBaseX = W - horizW - 80;
            const sunOffsetX = Math.round(cameraX * 0.02);
            const sunX = Math.round(sunBaseX - sunOffsetX);
            // Place bottom of sun at sea top
            const sunY = seaScreenY - horizH + 4;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(horizonTex, sunX, sunY, horizW, horizH);

            // Reflection: wave-distorted vertical strips for animated water effect
            ctx.save();
            ctx.globalAlpha = 0.25;
            const reflY = seaScreenY + 4;
            const reflH = horizH * 0.7; // shorter reflection for realism
            const stripW = 4; // width of each vertical strip
            const waveTime = performance.now() / 1000;
            const srcScale = horizonTex.width / horizW; // map screen→source coords
            for (let sx = 0; sx < horizW; sx += stripW) {
                const waveOffset = Math.sin(waveTime * 2 + sx * 0.05) * 3;
                // Draw each strip flipped vertically with wave offset
                ctx.save();
                ctx.translate(sunX + sx, reflY + waveOffset + reflH);
                ctx.scale(1, -1);
                ctx.drawImage(horizonTex,
                    sx * srcScale, 0,
                    stripW * srcScale, horizonTex.height,
                    0, 0,
                    stripW, reflH);
                ctx.restore();
            }
            ctx.restore();
        } else {
            // Day: normal sun (now 18x18, bigger!)
            const sunTex = TC.sunFrames[this.sunFrame];
            const sunW = sunTex.width * scale;
            const sunH = sunTex.height * scale;
            const sunBaseX = W - sunW - 45;
            const sunBaseY = 30;
            const sunOffsetX = Math.round(cameraX * 0.02);
            ctx.imageSmoothingEnabled = false;
            const daySunDrawX = Math.round(sunBaseX - sunOffsetX);
            ctx.drawImage(sunTex, daySunDrawX, sunBaseY, sunW, sunH);
            // Store for reflection after sea
            this._daySunTex = sunTex;
            this._daySunX = daySunDrawX;
            this._daySunW = sunW;
            this._daySunH = sunH;
        }

        // --- Layer 3: Sea tiles (scrollFactor 0.10, animated) ---
        this._drawTileLayer(ctx, seaTex, 0.10, cameraX, scale, seaScreenY, W);

        // --- Day sun reflection on water (wave-distorted) ---
        if (this.timeOfDay === 'day' && this._daySunTex) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            const reflY = seaScreenY + 4;
            const reflH = this._daySunH * 0.6;
            const stripW = 4;
            const waveTime = performance.now() / 1000;
            const srcScale2 = this._daySunTex.width / this._daySunW;
            for (let sx = 0; sx < this._daySunW; sx += stripW) {
                const waveOffset = Math.sin(waveTime * 2 + sx * 0.05) * 3;
                ctx.save();
                ctx.translate(this._daySunX + sx, reflY + waveOffset + reflH);
                ctx.scale(1, -1);
                ctx.drawImage(this._daySunTex,
                    sx * srcScale2, 0,
                    stripW * srcScale2, this._daySunTex.height,
                    0, 0,
                    stripW, reflH);
                ctx.restore();
            }
            ctx.restore();
        }

        // --- Layer 4: Boats on horizon (DESPUÉS del mar para que se vean) ---
        const boatTex = TC.boatTexture;
        const boatScale = scale * 1.2;
        const boatW = boatTex.width * boatScale;
        const boatH = boatTex.height * boatScale;
        const boatScreenY = seaScreenY - boatH * 0.3;
        ctx.imageSmoothingEnabled = false;
        for (const boat of this.boats) {
            const bx = Math.round(boat.x - cameraX * 0.10);
            if (bx + boatW > 0 && bx < W) {
                ctx.drawImage(boatTex, bx, boatScreenY, boatW, boatH);
                // Boat reflection on water
                ctx.save();
                ctx.globalAlpha = 0.15;
                const boatReflY = seaScreenY + 4;
                const boatReflH = boatH * 0.5;
                const bStripW = 3;
                const bWaveTime = performance.now() / 1000;
                const bSrcScale = boatTex.width / boatW;
                for (let bsx = 0; bsx < boatW; bsx += bStripW) {
                    const waveOff = Math.sin(bWaveTime * 2 + bsx * 0.07) * 2;
                    ctx.save();
                    ctx.translate(bx + bsx, boatReflY + waveOff + boatReflH);
                    ctx.scale(1, -1);
                    ctx.drawImage(boatTex,
                        bsx * bSrcScale, 0,
                        bStripW * bSrcScale, boatTex.height,
                        0, 0,
                        bStripW, boatReflH);
                    ctx.restore();
                }
                ctx.restore();
            }
        }

        if (this.isBeach) {
            // --- Beach mode: no bushes, sand ground, sandcastles, dunes ---

            // Select sand tile based on time of day
            let sandTex;
            if (this.timeOfDay === 'night') {
                sandTex = TC.sandNightTile;
            } else if (this.timeOfDay === 'sunset') {
                sandTex = TC.sandSunsetTile;
            } else {
                sandTex = TC.sandTile;
            }

            // Calculate sand position
            const sandH = sandTex.height * scale;
            const sandScreenY = H - sidewalkH - sandH;

            // --- Fill gap between sea and sand with extra water ---
            const gapTop = seaScreenY + seaH; // bottom of sea tiles
            const gapBottom = sandScreenY;    // top of sand tiles
            if (gapBottom > gapTop) {
                // Draw sea tiles to fill the gap (slightly different scroll factor)
                this._drawTileLayer(ctx, seaTex, 0.15, cameraX, scale, gapTop, W);
                // If gap is taller than one sea tile, fill remaining with solid sea color
                const seaTileH = seaTex.height * scale;
                if (gapBottom - gapTop > seaTileH) {
                    const fillColor = this.timeOfDay === 'night' ? 'rgb(15,25,55)'
                        : this.timeOfDay === 'sunset' ? 'rgb(60,80,140)' : 'rgb(60,130,200)';
                    ctx.fillStyle = fillColor;
                    ctx.fillRect(0, gapTop + seaTileH, W, gapBottom - gapTop - seaTileH);
                }

                // --- Swimmers in the water gap ---
                if (TC.swimmer1Tex && TC.swimmer2Tex && this.swimmers.length > 0) {
                    const swimScale = scale * 0.8; // smaller for distance effect
                    ctx.imageSmoothingEnabled = false;
                    for (const sw of this.swimmers) {
                        const swTex = sw.frame === 0 ? TC.swimmer1Tex : TC.swimmer2Tex;
                        const swW = swTex.width * swimScale;
                        const swH = swTex.height * swimScale;
                        const swX = Math.round(sw.x - cameraX * 0.12);
                        const gapH = gapBottom - gapTop;
                        const swY = gapTop + 8 + sw.yOffset * (gapH - swH - 16);
                        if (swX > -swW && swX < W + swW) {
                            ctx.drawImage(swTex, swX, swY, swW, swH);
                        }
                    }
                }
            }

            // Draw sand tiles as wider ground area (covers bush + sidewalk area)
            this._drawTileLayer(ctx, sandTex, 0.45, cameraX, scale, sandScreenY, W);

            // --- Sandcastle kids (scrollFactor 0.35, like gardeners) ---
            if (TC.sandcastle1Tex) {
                for (const sc of this.sandcastles) {
                    const tex = sc.frame === 0 ? TC.sandcastle1Tex : TC.sandcastle2Tex;
                    const scW = tex.width * scale;
                    const scH = tex.height * scale;
                    const scX = Math.round(sc.x - cameraX * 0.35 - scW / 2);
                    const scY = H - sidewalkH - scH;
                    if (scX > -scW && scX < W + scW) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(tex, scX, scY, scW, scH);
                    }
                }
            }

            // --- Sand dunes (decorative, scrollFactor 0.45) ---
            if (this.dunes.length > 0) {
                const duneColor = this.timeOfDay === 'night' ? 'rgba(75,70,58,0.6)'
                    : this.timeOfDay === 'sunset' ? 'rgba(190,160,110,0.5)'
                    : 'rgba(220,200,160,0.5)';
                for (const dune of this.dunes) {
                    const dx = Math.round(dune.x - cameraX * 0.45);
                    if (dx > -60 && dx < W + 60) {
                        ctx.fillStyle = duneColor;
                        ctx.beginPath();
                        ctx.ellipse(dx, H - sidewalkH, dune.width, dune.height, 0, Math.PI, 0);
                        ctx.fill();
                    }
                }
            }

            // --- Sand "sidewalk" layer ---
            this._drawTileLayer(ctx, sandTex, 1.0, cameraX, scale, H - sidewalkH, W);

        } else {
            // --- Normal mode: bushes, gardeners, flowers, sidewalk ---

            // --- Layer 5: Large bushes (background, scrollFactor 0.30) ---
            const bushLargeScreenY = H - sidewalkH - bushLargeH;
            this._drawTileLayer(ctx, bushLargeTex, 0.30, cameraX, scale, bushLargeScreenY, W);

            // --- Layer 6: Gardener NPCs (scrollFactor 0.35, middle) ---
            for (const g of this.gardeners) {
                g.draw(ctx, cameraX);
            }

            // --- Layer 7: Small bushes (foreground, scrollFactor 0.45) ---
            const bushScreenY = H - sidewalkH - bushH;
            this._drawTileLayer(ctx, bushTex, 0.45, cameraX, scale, bushScreenY, W);

            // --- Layer 7.5: Flores sobre los arbustos ---
            this._drawFlowers(ctx, cameraX, scale, bushScreenY, W);

            // --- Layer 8: Sidewalk (scrollFactor 1.00) ---
            const swScreenY = H - sidewalkH;
            this._drawTileLayer(ctx, swTex, 1.0, cameraX, scale, swScreenY, W);
        }
    }

    /**
     * Draws sky tiles filling downward from top.
     */
    _drawTileLayerFillDown(ctx, texture, scrollFactor, cameraX, scale, startY, canvasW, fillHeight) {
        const tileW = texture.width * scale;
        const tileH = texture.height * scale;
        if (tileW <= 0 || tileH <= 0) return;

        const offsetX = Math.round((cameraX * scrollFactor) % tileW);
        const startX = -offsetX;
        const tilesX = Math.ceil(canvasW / tileW) + 2;
        const tilesY = Math.ceil(fillHeight / tileH) + 1;

        ctx.imageSmoothingEnabled = false;
        for (let iy = 0; iy < tilesY; iy++) {
            for (let ix = 0; ix < tilesX; ix++) {
                const x = Math.round(startX + ix * tileW);
                const y = Math.round(startY + iy * tileH);
                ctx.drawImage(texture, x, y, tileW, tileH);
            }
        }
    }

    /**
     * Draws random flowers on top of bushes.
     */
    _drawFlowers(ctx, cameraX, scale, bushY, canvasW) {
        const scrollFactor = 0.45; // Mismo que arbustos pequeños
        ctx.imageSmoothingEnabled = false;

        for (const flower of this.flowers) {
            const tex = TC.flowerTextures[flower.color];
            if (!tex) continue;

            // Apply individual flower scale
            const flowerScale = scale * (flower.scale || 1.0);
            const w = tex.width * flowerScale;
            const h = tex.height * flowerScale;
            const screenX = Math.round(flower.x - cameraX * scrollFactor - w / 2);
            const screenY = bushY - flower.offsetY - h;

            // Solo dibujar si está en pantalla
            if (screenX > -w && screenX < canvasW + w) {
                ctx.drawImage(tex, screenX, screenY, w, h);
            }
        }
    }

    /**
     * Draws a single horizontally-tiling layer.
     */
    _drawTileLayer(ctx, texture, scrollFactor, cameraX, scale, screenY, canvasW) {
        const tileW = texture.width * scale;
        if (tileW <= 0) return;

        const offset = Math.round((cameraX * scrollFactor) % tileW);
        const startX = -offset;
        const tilesNeeded = Math.ceil(canvasW / tileW) + 2;

        ctx.imageSmoothingEnabled = false;
        for (let i = 0; i < tilesNeeded; i++) {
            const x = Math.round(startX + i * tileW);
            ctx.drawImage(texture, x, screenY, tileW, texture.height * scale);
        }
    }
}
