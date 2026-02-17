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
    birdMinDuration: 30.0,   // 1/3 speed (tripled duration)
    birdMaxDuration: 54.0,   // 1/3 speed (tripled duration)

    // Heart pickups - más frecuentes
    heartSpawnChance: 0.50,     // 50% chance cada intervalo
    heartSpawnInterval: 3.0,    // evaluar cada 3 segundos
    heartMinY: 320,             // requiere salto bajo
    heartMaxY: 450,             // salto medio-alto

    // Metros y niveles
    metersPerPixel: 0.02,           // 27000px ≈ 540m
    level1DistanceMeters: 150,      // primer nivel a 150m
    levelDistanceIncrement: 100,    // cada nivel +100m

    // Jogger / Skater NPC (from level 3+, alternating)
    joggerBaseSpawnInterval: 12.0,  // average seconds between NPC spawns (less frequent)
    joggerSpeed: 85,                // px/s (jogger moves left, slower)
    skaterSpeed: 150,               // px/s (skater moves left, faster)
    joggerMinLevel: 3,              // first level joggers appear

    // Ammo (auto-shoot power-up)
    initialAmmo: 0,           // No starting ammo (runner mode)
    maxAmmo: 10,              // Max ammo can hold
    ammoSpawnIntervalMeters: 200, // Spawn ammo every 200m
    autoShootDuration: 10,    // seconds of auto-fire when pickup collected
    autoShootInterval: 0.4,   // seconds between auto-fire shots

    // Gaucho Power (mate pickup)
    gauchoPowerDuration: 10,        // active power duration in seconds
    gauchoPowerDrinkDuration: 1.5,  // pause to drink mate
    gauchoPowerWindDown: 2.0,       // last 2s: smooth deceleration
    gauchoPowerSpeedMult: 2.0,      // double speed
    mateSpawnIntervalMeters: 500,   // one spawn attempt every 500m
    mateSpawnChance: 0.25,          // 25% chance per interval

    // Max level
    maxLevel: 90,

    // Ground surface (where player stands)
    get groundSurface() {
        return this.groundY + this.groundHeight / 2;
    }
};

// City data – each entry marks the first level of a city stretch
export const CITY_DATA = [
    { level: 1,  name: 'Montevideo' },
    { level: 7,  name: 'Ciudad de la Costa' },
    { level: 13, name: 'REPUBLICA del Pinar' },
    { level: 19, name: 'Atlantida' },
    { level: 25, name: 'Jaureguiberry' },
    { level: 31, name: 'Santa Ana' },
    { level: 37, name: 'Piriapolis' },
    { level: 43, name: 'CHIUAUA' },
    { level: 49, name: 'Punta del Este' },
    { level: 55, name: 'Jose Ignacio' },
    { level: 61, name: 'La Paloma' },
    { level: 67, name: 'Cabo Polonio' },
    { level: 73, name: 'Punta del Diablo' },
    { level: 79, name: 'La Coronilla' },
    { level: 85, name: 'Barra del Chuy' },
];

/**
 * Returns true if the given level should use beach terrain.
 * Levels 5-6 of each 6-level block are beach.
 * Cabo Polonio (levels 67-72) is ALL beach.
 */
export function isBeachLevel(level) {
    const posInBlock = ((level - 1) % 6) + 1;
    return posInBlock >= 5 || (level >= 67 && level <= 72);
}

/**
 * Returns the CITY_DATA entry whose level matches, or null.
 */
export function getCityForLevel(level) {
    return CITY_DATA.find(c => c.level === level) || null;
}

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
