// Parallax Scrolling System - background layers with tile wrapping
// Layers: sky, sun, boats, sea, gardeners, bushes, sidewalk
import { Config } from '../config.js';
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
    constructor() {
        // Sea animation
        this.seaAnimTimer = 0;
        this.seaFrame = 0;

        // Sun animation
        this.sunAnimTimer = 0;
        this.sunFrame = 0;

        // Boats on the horizon (random X positions across level)
        this.boats = [];
        const boatCount = 5;
        for (let i = 0; i < boatCount; i++) {
            this.boats.push({
                x: 200 + (Config.levelWidth / boatCount) * i + Math.random() * 300,
            });
        }

        // Gardener NPCs (alternating male/female)
        this.gardeners = [];
        const gardenerCount = 6;
        for (let i = 0; i < gardenerCount; i++) {
            const x = 200 + (Config.levelWidth / gardenerCount) * i + Math.random() * 100;
            const isFemale = i % 2 === 1;
            this.gardeners.push(new Gardener(x, isFemale));
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

        // Calculate layer heights (scaled 3x)
        const sidewalkH = TC.sidewalkTile.height * scale; // 16*3 = 48px
        const bushH = TC.bushTile.height * scale; // 24*3 = 72px (small bushes)
        const bushLargeH = TC.bushLargeTile.height * scale; // 48*3 = 144px (large bushes)
        const seaH = TC.seaFrames[0].height * scale; // 32*3 = 96px

        // --- Layer 1: Sky (fills from top down to sea) ---
        // El agua debe estar detrás de los arbustos grandes (solapando por arriba)
        const seaScreenY = H - sidewalkH - bushLargeH - seaH + 60; // +60 para solapar con arbustos
        this._drawTileLayerFillDown(ctx, TC.skyTile, 0.05, cameraX, scale, 0, W, seaScreenY);

        // --- Layer 2: Sun (top-right, very slow drift 0.02, animated rays) ---
        const sunTex = TC.sunFrames[this.sunFrame];
        const sunW = sunTex.width * scale;
        const sunH = sunTex.height * scale;
        const sunBaseX = W - sunW - 45;
        const sunBaseY = 30;
        const sunOffsetX = Math.round(cameraX * 0.02);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sunTex, Math.round(sunBaseX - sunOffsetX), sunBaseY, sunW, sunH);

        // --- Layer 3: Boats on horizon (scrollFactor 0.10) ---
        const boatTex = TC.boatTexture;
        const boatW = boatTex.width * scale;
        const boatH = boatTex.height * scale;
        const boatScreenY = seaScreenY - boatH * 0.3; // Barcos en el horizonte, parcialmente en el agua
        ctx.imageSmoothingEnabled = false;
        for (const boat of this.boats) {
            const bx = Math.round(boat.x - cameraX * 0.10);
            if (bx + boatW > 0 && bx < W) {
                ctx.drawImage(boatTex, bx, boatScreenY, boatW, boatH);
            }
        }

        // --- Layer 4: Sea tiles (scrollFactor 0.10, animated) ---
        const seaTexture = TC.seaFrames[this.seaFrame];
        this._drawTileLayer(ctx, seaTexture, 0.10, cameraX, scale, seaScreenY, W);

        // --- Layer 5: Large bushes (background, scrollFactor 0.30) ---
        // Large bushes sit on top of sidewalk
        const bushLargeScreenY = H - sidewalkH - bushLargeH;
        this._drawTileLayer(ctx, TC.bushLargeTile, 0.30, cameraX, scale, bushLargeScreenY, W);

        // --- Layer 6: Gardener NPCs (scrollFactor 0.35, middle) ---
        for (const g of this.gardeners) {
            g.draw(ctx, cameraX);
        }

        // --- Layer 7: Small bushes (foreground, scrollFactor 0.45) ---
        // Small bushes sit on top of sidewalk
        const bushScreenY = H - sidewalkH - bushH;
        this._drawTileLayer(ctx, TC.bushTile, 0.45, cameraX, scale, bushScreenY, W);

        // --- Layer 8: Sidewalk (scrollFactor 1.00) ---
        // Sidewalk at bottom of screen
        const swScreenY = H - sidewalkH;
        this._drawTileLayer(ctx, TC.sidewalkTile, 1.0, cameraX, scale, swScreenY, W);
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
