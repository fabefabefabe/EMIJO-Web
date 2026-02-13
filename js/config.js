// Game configuration constants (ported from GameConfig.swift)
export const Config = {
    // Scene
    sceneWidth: 960,
    sceneHeight: 540,
    pixelScale: 3,

    // Level (scaled 3x for high-res canvas)
    levelWidth: 27000,
    groundY: 120,
    groundHeight: 120,

    // Player physics (scaled 3x)
    walkSpeed: 450,
    jumpImpulse: 1100,  // increased for higher jump
    gravity: -2400,     // reduced for more hang time

    // Health (5 hearts)
    maxEnergy: 5,
    damagePerHit: 1,
    invincibilityDuration: 5.0,
    blinkInterval: 0.1,

    // Obstacles (scaled 3x) - más frecuentes
    minObstacleSpacing: 300,
    maxObstacleSpacing: 700,
    startBuffer: 900,
    endBuffer: 600,

    // Camera
    cameraLerp: 0.1,

    // Splash
    splashDuration: 3.0,

    // Birds (scaled 3x) - vuelan más bajo y más lento
    birdSpawnInterval: 3.0,
    birdMinY: 280,    // más bajo (accesible con salto)
    birdMaxY: 420,    // máximo más bajo
    birdMinDuration: 10.0,   // más lento
    birdMaxDuration: 18.0,   // más lento

    // Heart pickups
    heartSpawnChance: 0.12,     // 12% chance cada intervalo
    heartSpawnInterval: 10.0,   // evaluar cada 10 segundos
    heartMinY: 320,             // requiere salto bajo
    heartMaxY: 450,             // salto medio-alto

    // Timer
    levelTimeLimit: 60,

    // Anti-idle skater
    idleTimeForSkater: 15,

    // Ground surface (where player stands)
    get groundSurface() {
        return this.groundY + this.groundHeight / 2;
    }
};
