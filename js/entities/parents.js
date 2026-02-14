// Parents Entity - two adults standing next to the flag
import { Config } from '../config.js';
import * as TC from '../textureCache.js';

export class Parents {
    constructor(x, groundSurface) {
        this.x = x;
        this.groundSurface = groundSurface;
        this.isHugging = false;
        this.isFamilyHug = false;
    }

    startHug() {
        this.isHugging = true;
    }

    startFamilyHug() {
        this.isFamilyHug = true;
    }

    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        if (screenX < -100 || screenX > Config.sceneWidth + 100) return;

        const scale = Config.pixelScale;
        let tex;
        if (this.isFamilyHug) {
            tex = TC.parentsHuggingChildTex || TC.parentsHuggingTex;
        } else if (this.isHugging) {
            tex = TC.parentsHuggingTex;
        } else {
            tex = TC.parentsWaitingTex;
        }
        const w = tex.width * scale;
        const h = tex.height * scale;

        const sidewalkH = 16 * scale;
        const drawX = screenX - w / 2;
        const drawY = Config.sceneHeight - sidewalkH - h;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tex, drawX, drawY, w, h);
    }
}
