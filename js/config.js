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

    // Birds (scaled 3x) - decorativos, no quitan vidas
    birdSpawnInterval: 3.0,
    birdMinY: 280,    // altura original
    birdMaxY: 420,    // altura original
    birdMinDuration: 10.0,   // más lento
    birdMaxDuration: 18.0,   // más lento

    // Heart pickups - más frecuentes
    heartSpawnChance: 0.50,     // 50% chance cada intervalo
    heartSpawnInterval: 3.0,    // evaluar cada 3 segundos
    heartMinY: 320,             // requiere salto bajo
    heartMaxY: 450,             // salto medio-alto

    // Metros y niveles
    metersPerPixel: 0.02,           // 27000px ≈ 540m
    level1DistanceMeters: 150,      // primer nivel a 150m
    levelDistanceIncrement: 100,    // cada nivel +100m

    // Anti-idle skater
    idleTimeForSkater: 15,

    // Ammo (auto-shoot power-up)
    initialAmmo: 0,           // No starting ammo (runner mode)
    maxAmmo: 10,              // Max ammo can hold
    ammoSpawnIntervalMeters: 200, // Spawn ammo every 200m
    autoShootDuration: 10,    // seconds of auto-fire when pickup collected
    autoShootInterval: 0.4,   // seconds between auto-fire shots

    // Ground surface (where player stands)
    get groundSurface() {
        return this.groundY + this.groundHeight / 2;
    }
};

/**
 * Returns 'day', 'sunset', or 'night' based on level and real-world time.
 * The initial state is determined by the system clock:
 *   6:00-17:59  → day
 *   18:00-21:59 → sunset
 *   22:00-5:59  → night
 * Then cycles every 6 levels: initial → next → next → initial ...
 * The order is: day → sunset → night → day → ...
 */
export function getTimeOfDay(level) {
    const hour = new Date().getHours();
    let startPhase;
    if (hour >= 6 && hour < 18) startPhase = 0;       // day
    else if (hour >= 18 && hour < 22) startPhase = 1;  // sunset
    else startPhase = 2;                                // night

    const cycleOffset = Math.floor((level - 1) / 6);
    const phase = (startPhase + cycleOffset) % 3;

    if (phase === 0) return 'day';
    if (phase === 1) return 'sunset';
    return 'night';
}
