// Analytics module — sends custom events to GoatCounter
// GoatCounter tracks these as "page views" with custom paths,
// viewable in the dashboard under the event path names.

function sendEvent(path, title) {
    if (typeof window.goatcounter === 'undefined' || !window.goatcounter.count) {
        return; // GoatCounter not loaded (blocked, dev, etc.)
    }
    window.goatcounter.count({
        path: path,
        title: title || path,
        event: true,
    });
}

/** Player started a level */
export function trackLevelStart(level, character) {
    sendEvent(`game/level-start/${level}`, `Level ${level} started (${character})`);
}

/** Player completed a level */
export function trackLevelComplete(level, character, timeSec) {
    const t = Math.round(timeSec);
    sendEvent(`game/level-complete/${level}`, `Level ${level} complete in ${t}s (${character})`);
}

/** Game over */
export function trackGameOver(level, character, meters, timeSec) {
    const t = Math.round(timeSec);
    const m = Math.round(meters);
    sendEvent(`game/gameover/level-${level}`, `Game Over L${level} ${m}m ${t}s (${character})`);
}

/** Player selected a character */
export function trackCharacterSelect(character) {
    sendEvent(`game/character/${character}`, `Selected ${character}`);
}

/** Gaucho power collected */
export function trackGauchoPower(level) {
    sendEvent(`game/gaucho-power/${level}`, `Gaucho power L${level}`);
}
