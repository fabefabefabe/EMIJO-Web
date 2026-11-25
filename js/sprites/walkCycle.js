// Walk cycle builder - turns the 6 hand-drawn walk poses of a character into a
// smoother 6-frame cycle at load time (no sprite data is modified).
//
// Cycle: contact (wide stride) -> recoil -> passing (one foot lifted) -> mirror.
//  - Contact/recoil frames are lowered 1 sprite pixel (body "bob").
//  - Passing frames lift one foot (knee raise) and stay at full height.

// Per-character layout (rows/cols of the 16x32 sprites)
const LAYOUTS = {
    // Emi: legs start at row 20, shoes at 28-31
    emi: { cutRow: 26, liftFromRow: 26, split: 6 },
    // Jo: skirt rows 21-25, legs from row 26, shoes at 29-31
    jo:  { cutRow: 27, liftFromRow: 28, split: 7 },
};

const clone = (g) => g.map(r => r.slice());

/** Lowers the body 1 pixel: removes one leg row and adds a blank row on top. */
function lower(g, cutRow) {
    const out = clone(g);
    out.splice(cutRow, 1);
    out.unshift(new Array(out[0].length).fill(0));
    return out;
}

/**
 * Lifts one foot: moves the leg columns [c0, c1] from row `fromRow` down to the
 * bottom up by `dy` rows (and `dx` columns), leaving the bottom rows empty.
 */
function liftFoot(g, c0, c1, fromRow, dy, dx) {
    const out = clone(g);
    const h = g.length;
    const w = g[0].length;
    // Clear the region first
    for (let r = fromRow - dy; r < h; r++) {
        for (let c = c0; c <= c1; c++) out[r][c] = 0;
    }
    // Re-draw shifted up (and sideways)
    for (let r = fromRow; r < h; r++) {
        for (let c = c0; c <= c1; c++) {
            const v = g[r][c];
            if (v === 0) continue;
            const nr = r - dy;
            const nc = c + dx;
            if (nr >= 0 && nc >= 0 && nc < w) out[nr][nc] = v;
        }
    }
    return out;
}

/**
 * @param {number[][][]} walk - the 6 original walk frames [walk1..walk6]
 * @param {'emi'|'jo'} kind
 * @returns {number[][][]} 6 frames in cycle order
 */
export function buildWalkCycle(walk, kind) {
    const L = LAYOUTS[kind];
    const w = walk[0][0].length;
    const [w1, w2, w3, w4, w5, w6] = walk;
    return [
        lower(w5, L.cutRow),                                         // contact (wide)
        lower(w1, L.cutRow),                                         // recoil
        liftFoot(w2, 0, L.split - 1, L.liftFromRow, 3, -1),          // passing, back foot lifted
        lower(w6, L.cutRow),                                         // contact (wide, other leg)
        lower(w3, L.cutRow),                                         // recoil
        liftFoot(w4, L.split + 1, w - 1, L.liftFromRow, 3, 1),       // passing, front foot lifted
    ];
}
