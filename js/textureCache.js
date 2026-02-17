// Texture Cache - pre-renders all pixel art into offscreen canvases at load time
import { renderSprite } from './renderer.js';
import { Palettes } from './palettes.js';

// Character sprites
import * as EmiSprites from './sprites/emiSprites.js';
import * as JoSprites from './sprites/joSprites.js';
import * as EmiBeachSprites from './sprites/emiBeachSprites.js';
import * as JoBeachSprites from './sprites/joBeachSprites.js';

// Portrait animation frames
import { portraitOpen as emiPortraitOpen, portraitBlink as emiPortraitBlink, portraitLook as emiPortraitLook } from './sprites/emiPortraitFrames.js';
import { portraitOpen as joPortraitOpen, portraitBlink as joPortraitBlink, portraitLook as joPortraitLook } from './sprites/joPortraitFrames.js';

// Background sprites
import { sky } from './sprites/skyPixels.js';
import { frame1 as seaFrame1, frame2 as seaFrame2, frame3 as seaFrame3 } from './sprites/seaPixels.js';
import { tile as bushTileData } from './sprites/bushPixels.js';
import { tile as bushLargeTileData } from './sprites/bushLargePixels.js';
import { tile as sidewalkTileData } from './sprites/sidewalkPixels.js';

// Object sprites
import { rock as rockData, bench as benchData, benchWithPerson1, benchWithPerson2, trashCan as trashCanData, trashCanFlies1, trashCanFlies2, trashCanFalling as trashCanFallingData, trashCanSpilled as trashCanSpilledData, potholeFlat as potholeFlatData, potholeFallIn as potholeFallInData, potholeEyes as potholeEyesData, potholeEyesClosed as potholeEyesClosedData, potholeFallInBody as potholeFallInBodyData, potholeFallInHole as potholeFallInHoleData, cooler as coolerData, tree as treeData, leaf as leafData } from './sprites/obstaclePixels.js';
import { joggerRun1, joggerRun2, joggerFallen } from './sprites/joggerPixels.js';
import { flag as flagData, flag1 as flag1Data, flag2 as flag2Data, flag3 as flag3Data } from './sprites/flagPixels.js';
import { frame1 as birdFrame1, frame2 as birdFrame2, frame3 as birdFrame3 } from './sprites/birdPixels.js';

// Sun, moon, boat, gardener, skater sprites
import { sun1, sun2, sun3, sunsetHorizon1, sunsetHorizon2, sunsetHorizon3 } from './sprites/sunPixels.js';
import { moon as moonData } from './sprites/moonPixels.js';
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
import { dogSitting1, dogSitting2, signPost, dogCanopy1, dogCanopy2, palette as dogPalette } from './sprites/dogPixels.js';

// Projectile sprites
import { soccerBall1, soccerBall2, soccerBall3, soccerPalette, arrow1, arrow2, arrow3, arrowPalette, hockeyStick1, hockeyStick2, hockeyStick3, hockeyPalette } from './sprites/projectilePixels.js';

// Welcome sign sprites
import { welcomeSignBoard, welcomeSignPalette } from './sprites/welcomeSignPixels.js';

// Parents sprites
import { parentsWaiting, parentsHugging, parentsPalette } from './sprites/parentsPixels.js';

// Light pole sprites
import { lightPole as lightPoleData, lightPolePalette } from './sprites/lightPolePixels.js';

// Beach sprites
import { tile as sandTileData } from './sprites/sandPixels.js';
import { beachBall as beachBallData, beachBallPalette, beachUmbrella as beachUmbrellaData, beachUmbrellaPalette } from './sprites/beachPixels.js';
import { sandcastle1 as sandcastle1Data, sandcastle2 as sandcastle2Data, sandcastlePalette } from './sprites/sandcastlePixels.js';

// Swimmer sprites
import { swimmer1 as swimmer1Data, swimmer2 as swimmer2Data, swimmerPalette } from './sprites/swimmerPixels.js';

// Beagle sprites
import { beaglePalette, beagleSit, beagleRun1, beagleRun2, beagleSniff1, beagleSniff2, beagleJump } from './sprites/beaglePixels.js';

// Mate pickup sprite
import { matePalette, matePickup as matePickupData } from './sprites/matePixels.js';

// Bonfire and hippie sprites
import { bonfire1, bonfire2, bonfire3, bonfire4, bonfirePalette } from './sprites/bonfirePixels.js';
import { hippie1 as hippie1Data, hippie2 as hippie2Data, hippiePalette } from './sprites/hippiePixels.js';

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

// --- Emi Beach Textures ---
export const emiBeachIdle = renderSprite(EmiBeachSprites.idle, Palettes.emi);
export const emiBeachWalk1 = renderSprite(EmiBeachSprites.walk1, Palettes.emi);
export const emiBeachWalk2 = renderSprite(EmiBeachSprites.walk2, Palettes.emi);
export const emiBeachWalk3 = renderSprite(EmiBeachSprites.walk3, Palettes.emi);
export const emiBeachWalk4 = renderSprite(EmiBeachSprites.walk4, Palettes.emi);
export const emiBeachWalk5 = renderSprite(EmiBeachSprites.walk5, Palettes.emi);
export const emiBeachWalk6 = renderSprite(EmiBeachSprites.walk6, Palettes.emi);
export const emiBeachJump = renderSprite(EmiBeachSprites.jump, Palettes.emi);
export const emiBeachCrouch = renderSprite(EmiBeachSprites.crouch, Palettes.emi);
export const emiBeachFall = renderSprite(EmiBeachSprites.fall, Palettes.emi);
export const emiBeachGetUp = renderSprite(EmiBeachSprites.getUp, Palettes.emi);
export const emiBeachLyingDown = renderSprite(EmiBeachSprites.lyingDown, Palettes.emi);
export const emiBeachWalkFrames = [emiBeachWalk1, emiBeachWalk2, emiBeachWalk3, emiBeachWalk4, emiBeachWalk5, emiBeachWalk6];

// --- Jo Beach Textures ---
export const joBeachIdle = renderSprite(JoBeachSprites.idle, Palettes.jo);
export const joBeachWalk1 = renderSprite(JoBeachSprites.walk1, Palettes.jo);
export const joBeachWalk2 = renderSprite(JoBeachSprites.walk2, Palettes.jo);
export const joBeachWalk3 = renderSprite(JoBeachSprites.walk3, Palettes.jo);
export const joBeachWalk4 = renderSprite(JoBeachSprites.walk4, Palettes.jo);
export const joBeachWalk5 = renderSprite(JoBeachSprites.walk5, Palettes.jo);
export const joBeachWalk6 = renderSprite(JoBeachSprites.walk6, Palettes.jo);
export const joBeachJump = renderSprite(JoBeachSprites.jump, Palettes.jo);
export const joBeachCrouch = renderSprite(JoBeachSprites.crouch, Palettes.jo);
export const joBeachFall = renderSprite(JoBeachSprites.fall, Palettes.jo);
export const joBeachGetUp = renderSprite(JoBeachSprites.getUp, Palettes.jo);
export const joBeachLyingDown = renderSprite(JoBeachSprites.lyingDown, Palettes.jo);
export const joBeachWalkFrames = [joBeachWalk1, joBeachWalk2, joBeachWalk3, joBeachWalk4, joBeachWalk5, joBeachWalk6];

// --- Portrait Animation Frames ---
export const emiPortraitFrames = [
    renderSprite(emiPortraitOpen, Palettes.emi),
    renderSprite(emiPortraitBlink, Palettes.emi),
    renderSprite(emiPortraitLook, Palettes.emi),
];
export const joPortraitFrames = [
    renderSprite(joPortraitOpen, Palettes.jo),
    renderSprite(joPortraitBlink, Palettes.jo),
    renderSprite(joPortraitLook, Palettes.jo),
];

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
export const trashCanFallingTex = renderSprite(trashCanFallingData, Palettes.objects);
export const trashCanSpilledTex = renderSprite(trashCanSpilledData, Palettes.objects);
export const potholeFlat = renderSprite(potholeFlatData, Palettes.objects);
export const potholeFallIn = renderSprite(potholeFallInData, Palettes.objects);
export const potholeEyes = renderSprite(potholeEyesData, Palettes.objects);
export const potholeEyesClosed = renderSprite(potholeEyesClosedData, Palettes.objects);
export const potholeFallInBodyEmi = renderSprite(potholeFallInBodyData, Palettes.emi);
export const potholeFallInBodyJo = renderSprite(potholeFallInBodyData, Palettes.jo);
export const potholeFallInHoleTex = renderSprite(potholeFallInHoleData, Palettes.objects);

// Night pothole textures (dark/black appearance)
export const potholeFlatNight = renderSprite(potholeFlatData, Palettes.objectsNight);
export const potholeEyesNight = renderSprite(potholeEyesData, Palettes.objectsNight);
export const potholeEyesClosedNight = renderSprite(potholeEyesClosedData, Palettes.objectsNight);
export const potholeFallInHoleNightTex = renderSprite(potholeFallInHoleData, Palettes.objectsNight);

export const cooler = renderSprite(coolerData, Palettes.objects);
export const tree = renderSprite(treeData, Palettes.objects);
export const leafTex = renderSprite(leafData, Palettes.objects);
export const flag = renderSprite(flagData, Palettes.objects);
export const flagFrames = [
    renderSprite(flag1Data, Palettes.objects),
    renderSprite(flag2Data, Palettes.objects),
    renderSprite(flag3Data, Palettes.objects),
];

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

// --- Jogger Textures ---
export const joggerRunFrames = [
    renderSprite(joggerRun1, Palettes.jogger),
    renderSprite(joggerRun2, Palettes.jogger),
];
export const joggerFallenTex = renderSprite(joggerFallen, Palettes.jogger);

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
export const sunsetHorizonFrames = [
    renderSprite(sunsetHorizon1, Palettes.sunSunset),
    renderSprite(sunsetHorizon2, Palettes.sunSunset),
    renderSprite(sunsetHorizon3, Palettes.sunSunset),
];
export const moonTex = renderSprite(moonData, Palettes.moon);
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
export const dogCanopy1Tex = renderSprite(dogCanopy1, dogPalette);
export const dogCanopy2Tex = renderSprite(dogCanopy2, dogPalette);
// Legacy
export const dogLeftTex = dogSitting1Tex;
export const dogRightTex = dogSitting2Tex;
export const dogTexture = dogSitting1Tex;

// --- Welcome Sign Texture ---
export const welcomeSign = renderSprite(welcomeSignBoard, welcomeSignPalette);

// --- Light Pole Textures ---
export const lightPoleTex = renderSprite(lightPoleData, lightPolePalette);
export const lightPoleNightTex = renderSprite(lightPoleData, Palettes.lightPoleNight);

// --- Beach Textures ---
export const sandTile = renderSprite(sandTileData, Palettes.sand);
export const sandSunsetTile = renderSprite(sandTileData, Palettes.sandSunset);
export const sandNightTile = renderSprite(sandTileData, Palettes.sandNight);
export const beachBallTex = renderSprite(beachBallData, beachBallPalette);
export const beachUmbrellaTex = renderSprite(beachUmbrellaData, beachUmbrellaPalette);

// --- Colored Beach Umbrella Textures (random solid color per umbrella) ---
const umbrellaColors = [
    { main: [220,50,50], shadow: [180,30,30], highlight: [255,100,100] },   // red
    { main: [50,120,220], shadow: [30,80,180], highlight: [100,160,255] },   // blue
    { main: [50,180,80], shadow: [30,140,50], highlight: [100,220,130] },    // green
    { main: [255,180,40], shadow: [220,140,20], highlight: [255,220,100] },  // orange
    { main: [180,50,200], shadow: [140,30,160], highlight: [220,100,240] },  // purple
    { main: [255,220,50], shadow: [220,180,30], highlight: [255,240,120] },  // yellow
    { main: [230,80,150], shadow: [190,50,120], highlight: [255,130,190] },  // pink
];
export const coloredUmbrellaTex = umbrellaColors.map(c => {
    const pal = [...beachUmbrellaPalette];
    pal[1] = c.main;
    pal[2] = c.shadow;
    pal[3] = c.highlight;
    return renderSprite(beachUmbrellaData, pal);
});

export const sandcastle1Tex = renderSprite(sandcastle1Data, sandcastlePalette);
export const sandcastle2Tex = renderSprite(sandcastle2Data, sandcastlePalette);

// --- Swimmer Textures ---
export const swimmer1Tex = renderSprite(swimmer1Data, swimmerPalette);
export const swimmer2Tex = renderSprite(swimmer2Data, swimmerPalette);

// --- Bonfire Textures ---
export const bonfireFrames = [
    renderSprite(bonfire1, bonfirePalette),
    renderSprite(bonfire2, bonfirePalette),
    renderSprite(bonfire3, bonfirePalette),
    renderSprite(bonfire4, bonfirePalette),
];

// --- Hippie Textures ---
export const hippieFrames = [
    renderSprite(hippie1Data, hippiePalette),
    renderSprite(hippie2Data, hippiePalette),
];

// --- Beagle Textures ---
export const beagleSitTex = renderSprite(beagleSit, beaglePalette);
export const beagleRun1Tex = renderSprite(beagleRun1, beaglePalette);
export const beagleRun2Tex = renderSprite(beagleRun2, beaglePalette);
export const beagleSniff1Tex = renderSprite(beagleSniff1, beaglePalette);
export const beagleSniff2Tex = renderSprite(beagleSniff2, beaglePalette);
export const beagleJumpTex = renderSprite(beagleJump, beaglePalette);

// --- Mate Pickup Texture ---
export const matePickupTex = renderSprite(matePickupData, matePalette);

// --- Parents Textures ---
export const parentsWaitingTex = renderSprite(parentsWaiting, parentsPalette);
export const parentsHuggingTex = renderSprite(parentsHugging, parentsPalette);

// --- Projectile Textures ---
export const soccerBallFrames = [
    renderSprite(soccerBall1, soccerPalette),
    renderSprite(soccerBall2, soccerPalette),
    renderSprite(soccerBall3, soccerPalette),
];
export const arrowFrames = [
    renderSprite(arrow1, arrowPalette),
    renderSprite(arrow2, arrowPalette),
    renderSprite(arrow3, arrowPalette),
];
export const hockeyStickFrames = arrowFrames; // backwards compat

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

export function renderTextBold(text) {
    const pixels = textPixels(text);
    if (pixels.length === 0) {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        return c;
    }
    // Expand each pixel +1 right to simulate bold
    const h = pixels.length;
    const w = pixels[0].length;
    const boldPixels = [];
    for (let r = 0; r < h; r++) {
        const newRow = new Array(w + 1).fill(0);
        for (let c = 0; c < w; c++) {
            if (pixels[r][c] !== 0) {
                newRow[c] = pixels[r][c];
                newRow[c + 1] = pixels[r][c];
            }
        }
        boldPixels.push(newRow);
    }
    return renderSprite(boldPixels, Palettes.ui);
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
 * @param {boolean} isBeach - If true, return beach outfit textures
 */
export function getCharacterTextures(type, isBeach = false) {
    if (type === 'jo') {
        if (isBeach) {
            return {
                idle: joBeachIdle,
                walk: joBeachWalkFrames,
                jump: joBeachJump,
                crouch: joBeachCrouch,
                fall: joBeachFall,
                lyingDown: joBeachLyingDown,
                getUp: joBeachGetUp,
                portrait: joPortrait,
            };
        }
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
    if (isBeach) {
        return {
            idle: emiBeachIdle,
            walk: emiBeachWalkFrames,
            jump: emiBeachJump,
            crouch: emiBeachCrouch,
            fall: emiBeachFall,
            lyingDown: emiBeachLyingDown,
            getUp: emiBeachGetUp,
            portrait: emiPortrait,
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
