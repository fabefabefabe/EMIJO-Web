// Texture Cache - pre-renders all pixel art into offscreen canvases at load time
import { renderSprite } from './renderer.js';
import { Palettes } from './palettes.js';

// Character sprites
import * as EmiSprites from './sprites/emiSprites.js';
import * as JoSprites from './sprites/joSprites.js';

// Background sprites
import { sky } from './sprites/skyPixels.js';
import { frame1 as seaFrame1, frame2 as seaFrame2, frame3 as seaFrame3 } from './sprites/seaPixels.js';
import { tile as bushTileData } from './sprites/bushPixels.js';
import { tile as bushLargeTileData } from './sprites/bushLargePixels.js';
import { tile as sidewalkTileData } from './sprites/sidewalkPixels.js';

// Object sprites
import { rock as rockData, bench as benchData, benchWithPerson1, benchWithPerson2, trashCan as trashCanData, trashCanFlies1, trashCanFlies2, pothole as potholeData, awning as awningData, lowBranch as lowBranchData } from './sprites/obstaclePixels.js';
import { flag as flagData } from './sprites/flagPixels.js';
import { frame1 as birdFrame1, frame2 as birdFrame2, frame3 as birdFrame3 } from './sprites/birdPixels.js';

// Sun, boat, gardener, skater sprites
import { sun1, sun2, sun3 } from './sprites/sunPixels.js';
import { boat as boatData } from './sprites/boatPixels.js';
import { maleWalk1 as gMW1, maleWalk2 as gMW2, femaleWalk1 as gFW1, femaleWalk2 as gFW2 } from './sprites/gardenerPixels.js';
import { skate1, skate2 } from './sprites/skaterPixels.js';

// UI sprites
import { logo as logoData } from './sprites/logoPixels.js';
import { background as energyBgData, fill as energyFillData } from './sprites/energyBarPixels.js';
import { textPixels } from './sprites/fontPixels.js';
import { heartFull, heartEmpty } from './sprites/heartPixels.js';
import { speakerOn, speakerOff } from './sprites/musicIconPixels.js';

// Flower and dog sprites
import { flowerShape, flowerPaletteRed, flowerPaletteYellow, flowerPalettePink, flowerPaletteWhite, flowerPalettePurple, flowerPaletteOrange } from './sprites/flowerPixels.js';
import { dogSitting1, dogSitting2, signPost, palette as dogPalette } from './sprites/dogPixels.js';

// Projectile sprites
import { soccerBall1, soccerBall2, soccerBall3, soccerPalette, hockeyStick1, hockeyStick2, hockeyStick3, hockeyPalette } from './sprites/projectilePixels.js';

// Welcome sign sprites
import { welcomeSignBoard, welcomeSignPalette } from './sprites/welcomeSignPixels.js';

// Parents sprites
import { parentsWaiting, parentsHugging, parentsPalette } from './sprites/parentsPixels.js';

// Light pole sprites
import { lightPole as lightPoleData, lightPolePalette } from './sprites/lightPolePixels.js';

// --- Emi Textures ---
export const emiIdle = renderSprite(EmiSprites.idle, Palettes.emi);
export const emiWalk1 = renderSprite(EmiSprites.walk1, Palettes.emi);
export const emiWalk2 = renderSprite(EmiSprites.walk2, Palettes.emi);
export const emiWalk3 = renderSprite(EmiSprites.walk3, Palettes.emi);
export const emiWalk4 = renderSprite(EmiSprites.walk4, Palettes.emi);
export const emiWalk5 = renderSprite(EmiSprites.walk5, Palettes.emi);
export const emiWalk6 = renderSprite(EmiSprites.walk6, Palettes.emi);
export const emiJump = renderSprite(EmiSprites.jump, Palettes.emi);
export const emiCrouch = renderSprite(EmiSprites.crouch, Palettes.emi);
export const emiFall = renderSprite(EmiSprites.fall, Palettes.emi);
export const emiGetUp = renderSprite(EmiSprites.getUp, Palettes.emi);
export const emiLyingDown = renderSprite(EmiSprites.lyingDown, Palettes.emi);
export const emiPortrait = renderSprite(EmiSprites.portrait, Palettes.emi);

export const emiWalkFrames = [emiWalk1, emiWalk2, emiWalk3, emiWalk4, emiWalk5, emiWalk6];

// --- Jo Textures ---
export const joIdle = renderSprite(JoSprites.idle, Palettes.jo);
export const joWalk1 = renderSprite(JoSprites.walk1, Palettes.jo);
export const joWalk2 = renderSprite(JoSprites.walk2, Palettes.jo);
export const joWalk3 = renderSprite(JoSprites.walk3, Palettes.jo);
export const joWalk4 = renderSprite(JoSprites.walk4, Palettes.jo);
export const joWalk5 = renderSprite(JoSprites.walk5, Palettes.jo);
export const joWalk6 = renderSprite(JoSprites.walk6, Palettes.jo);
export const joJump = renderSprite(JoSprites.jump, Palettes.jo);
export const joCrouch = renderSprite(JoSprites.crouch, Palettes.jo);
export const joFall = renderSprite(JoSprites.fall, Palettes.jo);
export const joGetUp = renderSprite(JoSprites.getUp, Palettes.jo);
export const joLyingDown = renderSprite(JoSprites.lyingDown, Palettes.jo);
export const joPortrait = renderSprite(JoSprites.portrait, Palettes.jo);

export const joWalkFrames = [joWalk1, joWalk2, joWalk3, joWalk4, joWalk5, joWalk6];

// --- Background Textures ---
export const skyTile = renderSprite(sky, Palettes.environment);
export const seaFrames = [
    renderSprite(seaFrame1, Palettes.environment),
    renderSprite(seaFrame2, Palettes.environment),
    renderSprite(seaFrame3, Palettes.environment),
];
export const bushTile = renderSprite(bushTileData, Palettes.environment);
export const bushLargeTile = renderSprite(bushLargeTileData, Palettes.environment);
export const sidewalkTile = renderSprite(sidewalkTileData, Palettes.environment);

// --- Sunset Background Textures (level 6+) ---
export const skySunsetTile = renderSprite(sky, Palettes.environmentSunset);
export const seaSunsetFrames = [
    renderSprite(seaFrame1, Palettes.environmentSunset),
    renderSprite(seaFrame2, Palettes.environmentSunset),
    renderSprite(seaFrame3, Palettes.environmentSunset),
];
export const bushSunsetTile = renderSprite(bushTileData, Palettes.environmentSunset);
export const bushLargeSunsetTile = renderSprite(bushLargeTileData, Palettes.environmentSunset);
export const sidewalkSunsetTile = renderSprite(sidewalkTileData, Palettes.environmentSunset);

// --- Night Background Textures (level 12+) ---
export const skyNightTile = renderSprite(sky, Palettes.environmentNight);
export const seaNightFrames = [
    renderSprite(seaFrame1, Palettes.environmentNight),
    renderSprite(seaFrame2, Palettes.environmentNight),
    renderSprite(seaFrame3, Palettes.environmentNight),
];
export const bushNightTile = renderSprite(bushTileData, Palettes.environmentNight);
export const bushLargeNightTile = renderSprite(bushLargeTileData, Palettes.environmentNight);
export const sidewalkNightTile = renderSprite(sidewalkTileData, Palettes.environmentNight);

// --- Object Textures ---
export const rock = renderSprite(rockData, Palettes.objects);
export const bench = renderSprite(benchData, Palettes.objects);
export const trashCan = renderSprite(trashCanData, Palettes.objects);
export const pothole = renderSprite(potholeData, Palettes.objects);
export const awning = renderSprite(awningData, Palettes.objects);
export const lowBranch = renderSprite(lowBranchData, Palettes.objects);
export const flag = renderSprite(flagData, Palettes.objects);

export const birdFrames = [
    renderSprite(birdFrame1, Palettes.bird),
    renderSprite(birdFrame2, Palettes.bird),
    renderSprite(birdFrame3, Palettes.bird),
];
export const birdNightFrames = [
    renderSprite(birdFrame1, Palettes.birdNight),
    renderSprite(birdFrame2, Palettes.birdNight),
    renderSprite(birdFrame3, Palettes.birdNight),
];
export const trashCanFliesFrames = [
    renderSprite(trashCanFlies1, Palettes.objects),
    renderSprite(trashCanFlies2, Palettes.objects),
];
export const benchWithPersonFrames = [
    renderSprite(benchWithPerson1, Palettes.objects),
    renderSprite(benchWithPerson2, Palettes.objects),
];

// --- Sun, Boat, Gardener Textures ---
export const sunFrames = [
    renderSprite(sun1, Palettes.sun),
    renderSprite(sun2, Palettes.sun),
    renderSprite(sun3, Palettes.sun),
];
export const sunSunsetFrames = [
    renderSprite(sun1, Palettes.sunSunset),
    renderSprite(sun2, Palettes.sunSunset),
    renderSprite(sun3, Palettes.sunSunset),
];
export const sunTexture = sunFrames[0]; // backwards compatibility
export const boatTexture = renderSprite(boatData, Palettes.environment);
export const gardenerMaleFrames = [
    renderSprite(gMW1, Palettes.gardener),
    renderSprite(gMW2, Palettes.gardener),
];
export const gardenerFemaleFrames = [
    renderSprite(gFW1, Palettes.gardener),
    renderSprite(gFW2, Palettes.gardener),
];
export const skaterFrames = [
    renderSprite(skate1, Palettes.gardener),
    renderSprite(skate2, Palettes.gardener),
];

// --- UI Textures ---
export const logo = renderSprite(logoData, Palettes.ui);
export const energyBarBg = renderSprite(energyBgData, Palettes.ui);
export const energyBarFill = renderSprite(energyFillData, Palettes.ui);
export const musicOnIcon = renderSprite(speakerOn, Palettes.ui);
export const musicOffIcon = renderSprite(speakerOff, Palettes.ui);
export const heartFullTex = renderSprite(heartFull, Palettes.heart);
export const heartEmptyTex = renderSprite(heartEmpty, Palettes.heart);

// --- Flower Textures (4 colors) ---
function renderFlower(palette) {
    // Convert palette from [[r,g,b,a]] to format renderSprite expects
    const paletteFormatted = palette.map(c => c);
    return renderSprite(flowerShape, paletteFormatted);
}
export const flowerTextures = {
    red: renderFlower(flowerPaletteRed),
    yellow: renderFlower(flowerPaletteYellow),
    pink: renderFlower(flowerPalettePink),
    white: renderFlower(flowerPaletteWhite),
    purple: renderFlower(flowerPalettePurple),
    orange: renderFlower(flowerPaletteOrange),
};

// --- Dog Textures (animated sitting) ---
export const dogSitting1Tex = renderSprite(dogSitting1, dogPalette);
export const dogSitting2Tex = renderSprite(dogSitting2, dogPalette);
export const signPostTex = renderSprite(signPost, dogPalette);
// Legacy
export const dogLeftTex = dogSitting1Tex;
export const dogRightTex = dogSitting2Tex;
export const dogTexture = dogSitting1Tex;

// --- Welcome Sign Texture ---
export const welcomeSign = renderSprite(welcomeSignBoard, welcomeSignPalette);

// --- Light Pole Textures ---
export const lightPoleTex = renderSprite(lightPoleData, lightPolePalette);
export const lightPoleNightTex = renderSprite(lightPoleData, Palettes.lightPoleNight);

// --- Parents Textures ---
export const parentsWaitingTex = renderSprite(parentsWaiting, parentsPalette);
export const parentsHuggingTex = renderSprite(parentsHugging, parentsPalette);

// --- Projectile Textures ---
export const soccerBallFrames = [
    renderSprite(soccerBall1, soccerPalette),
    renderSprite(soccerBall2, soccerPalette),
    renderSprite(soccerBall3, soccerPalette),
];
export const hockeyStickFrames = [
    renderSprite(hockeyStick1, hockeyPalette),
    renderSprite(hockeyStick2, hockeyPalette),
    renderSprite(hockeyStick3, hockeyPalette),
];

/**
 * Renders a text string to an offscreen canvas using the bitmap font.
 * @param {string} text - Text to render.
 * @returns {HTMLCanvasElement} Offscreen canvas with rendered text.
 */
export function renderText(text) {
    const pixels = textPixels(text);
    if (pixels.length === 0) {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        return c;
    }
    return renderSprite(pixels, Palettes.ui);
}

export function renderTextBlack(text) {
    const pixels = textPixels(text);
    if (pixels.length === 0) {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        return c;
    }
    const blackPalette = [...Palettes.ui];
    blackPalette[7] = [30, 30, 30];
    return renderSprite(pixels, blackPalette);
}

/**
 * Returns all textures for a character type.
 * @param {'emi'|'jo'} type
 */
export function getCharacterTextures(type) {
    if (type === 'jo') {
        return {
            idle: joIdle,
            walk: joWalkFrames,
            jump: joJump,
            crouch: joCrouch,
            fall: joFall,
            lyingDown: joLyingDown,
            getUp: joGetUp,
            portrait: joPortrait,
        };
    }
    return {
        idle: emiIdle,
        walk: emiWalkFrames,
        jump: emiJump,
        crouch: emiCrouch,
        fall: emiFall,
        lyingDown: emiLyingDown,
        getUp: emiGetUp,
        portrait: emiPortrait,
    };
}
