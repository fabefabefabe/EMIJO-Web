// EMIJO Web - Main Entry Point
// Game loop, scene manager, and initialization
import { Config } from './config.js';
import { InputManager } from './input.js';
import { SplashScene } from './scenes/splashScene.js';
import { MenuScene } from './scenes/menuScene.js';
import { GameScene } from './scenes/gameScene.js';
import { LevelCompleteScene } from './scenes/levelCompleteScene.js';
import { EnterInitialsScene } from './scenes/enterInitialsScene.js';
import { HallOfFameScene } from './scenes/hallOfFameScene.js';
import { CongratulationsScene } from './scenes/congratulationsScene.js';
import { MapScene } from './scenes/mapScene.js';
import { music } from './audio/music.js';

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// --- Fullscreen Scaling (max 2x to keep pixels crisp) ---
function resizeCanvas() {
    const ratio = Config.sceneWidth / Config.sceneHeight;
    const maxScale = 2; // Maximum CSS scale factor
    const maxW = Config.sceneWidth * maxScale;
    const maxH = Config.sceneHeight * maxScale;

    const wW = window.innerWidth, wH = window.innerHeight;
    let cssW, cssH;
    if (wW / wH > ratio) {
        cssH = Math.min(wH, maxH);
        cssW = Math.floor(cssH * ratio);
    } else {
        cssW = Math.min(wW, maxW);
        cssH = Math.floor(cssW / ratio);
    }
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Input ---
const input = new InputManager();

// --- Game State ---
const gameState = {
    selectedCharacter: 'emi', // 'emi' or 'jo'
    musicMuted: false,
    totalMeters: 0,
};

// --- Game Object (passed to scenes) ---
const game = {
    input,
    state: gameState,
    ctx,
    canvas,
    music,
    setScene: null, // Set below
    toggleMusic: () => {
        gameState.musicMuted = music.toggleMute();
        return gameState.musicMuted;
    },
};

// --- Scene Manager ---
const scenes = {
    splash: new SplashScene(game),
    menu: new MenuScene(game),
    game: new GameScene(game),
    levelComplete: new LevelCompleteScene(game),
    enterInitials: new EnterInitialsScene(game),
    hallOfFame: new HallOfFameScene(game),
    congratulations: new CongratulationsScene(game),
    map: new MapScene(game),
};

let currentScene = null;

function setScene(name) {
    const scene = scenes[name];
    if (!scene) {
        console.error(`Scene "${name}" not found`);
        return;
    }
    // Re-create scenes that need fresh state
    if (name === 'game') {
        scenes.game = new GameScene(game);
        currentScene = scenes.game;
    } else if (name === 'levelComplete') {
        scenes.levelComplete = new LevelCompleteScene(game);
        currentScene = scenes.levelComplete;
    } else if (name === 'enterInitials') {
        scenes.enterInitials = new EnterInitialsScene(game);
        currentScene = scenes.enterInitials;
    } else if (name === 'hallOfFame') {
        scenes.hallOfFame = new HallOfFameScene(game);
        currentScene = scenes.hallOfFame;
    } else if (name === 'congratulations') {
        scenes.congratulations = new CongratulationsScene(game);
        currentScene = scenes.congratulations;
    } else if (name === 'map') {
        scenes.map = new MapScene(game);
        currentScene = scenes.map;
    } else {
        currentScene = scene;
    }
    currentScene.enter();
}

game.setScene = setScene;

// --- Canvas Click Handler ---
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = Config.sceneWidth / rect.width;
    const scaleY = Config.sceneHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (currentScene && currentScene.onClick) {
        currentScene.onClick(x, y);
    }
});

// --- Canvas Touch Handler (mobile) ---
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = Config.sceneWidth / rect.width;
    const scaleY = Config.sceneHeight / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    if (currentScene && currentScene.onClick) {
        currentScene.onClick(x, y);
    }
}, { passive: false });

// --- Game Loop ---
let lastTime = 0;

function gameLoop(timestamp) {
    // Compute delta time in seconds
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Clamp dt to prevent spiral of death (e.g., after tab switch)
    if (dt > 0.05) dt = 0.05;
    // Skip first frame (dt would be huge)
    if (dt < 0) dt = 0;

    // Update and draw
    if (currentScene) {
        currentScene.update(dt);
        currentScene.draw(ctx);
    }

    requestAnimationFrame(gameLoop);
}

// --- Start ---
console.log('EMIJO Web - Starting...');
setScene('splash');
requestAnimationFrame(gameLoop);
