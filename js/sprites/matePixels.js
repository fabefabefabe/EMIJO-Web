// Mate + Termo pixel art for Gaucho Power pickup
// 12 wide x 14 tall
// Left side: mate calabaza with bombilla sticking up
// Right side: thermos (termo) next to it

export const matePalette = [
    null,                  // 0: transparent
    [90, 140, 60],         // 1: mate green (calabaza)
    [60, 100, 40],         // 2: mate dark green
    [120, 170, 80],        // 3: mate light green
    [160, 120, 70],        // 4: yerba light brown
    [120, 90, 50],         // 5: yerba dark
    [190, 190, 200],       // 6: bombilla silver
    [140, 140, 155],       // 7: bombilla shadow
    [50, 80, 170],         // 8: thermos blue
    [30, 55, 130],         // 9: thermos dark blue
    [80, 110, 200],        // 10: thermos light blue
    [200, 200, 210],       // 11: thermos cap silver
    [40, 40, 40],          // 12: outline
];

// Mate pickup sprite (12x14)
// Bombilla sticks up from mate cup, thermos stands next to it
export const matePickup = [
    [0,0,0, 6, 0,0,0,0,0,0,0,0],
    [0,0,0, 6, 0,0,0,0,11,11,0,0],
    [0,0,0, 6, 0,0,0,12,11,11,12,0],
    [0,12, 4, 6, 4,12,0,12, 9, 9,12,0],
    [12, 1, 4, 7, 4, 1,12, 8,10, 8,9,12],
    [12, 1, 1, 7, 1, 1,12, 8,10, 8,9,12],
    [12, 3, 1, 7, 1, 3,12, 8,10, 8,9,12],
    [12, 1, 1, 7, 1, 1,12, 9, 8, 9,9,12],
    [0,12, 2, 7, 2,12,0, 9, 8, 9,9,12],
    [0,12, 2, 7, 2,12,0, 9, 9, 9,9,12],
    [0,0,12, 7,12,0, 0, 9, 9, 9,12,0],
    [0,0,12,12,12,0, 0,12,12,12,12,0],
    [0,0,0,0,0,0, 0,12,11,11,12,0],
    [0,0,0,0,0,0, 0,0,12,12,0,0],
];
