// Projectile Sprites - soccer ball and hockey stick for special powers

// Soccer ball palette
export const soccerPalette = [
    [0, 0, 0, 0],       // 0: transparent
    [255, 255, 255, 255], // 1: white
    [40, 40, 40, 255],  // 2: black (pentagons)
];

// Soccer ball 8x8 - 3 frames for rotation animation
export const soccerBall1 = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,2,2,1,1,0],
    [1,1,2,2,2,2,1,1],
    [1,2,2,1,1,2,2,1],
    [1,2,2,1,1,2,2,1],
    [1,1,2,2,2,2,1,1],
    [0,1,1,2,2,1,1,0],
    [0,0,1,1,1,1,0,0],
];

export const soccerBall2 = [
    [0,0,1,1,1,1,0,0],
    [0,1,2,1,1,2,1,0],
    [1,2,1,1,1,1,2,1],
    [1,1,1,2,2,1,1,1],
    [1,1,1,2,2,1,1,1],
    [1,2,1,1,1,1,2,1],
    [0,1,2,1,1,2,1,0],
    [0,0,1,1,1,1,0,0],
];

export const soccerBall3 = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,2,2,1,1,1],
    [1,1,2,2,2,2,1,1],
    [1,1,2,2,2,2,1,1],
    [1,1,1,2,2,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
];

// Arrow palette (purple)
export const arrowPalette = [
    [0, 0, 0, 0],          // 0: transparent
    [160, 80, 200, 255],    // 1: purple main
    [120, 50, 160, 255],    // 2: purple dark (shaft)
    [200, 130, 240, 255],   // 3: purple light (arrowhead tip)
];

// Arrow 10x4 - horizontal, pointing right, 3 animation frames
export const arrow1 = [
    [0,0,0,0,0,0,0,3,0,0],
    [2,2,1,1,1,1,3,3,3,0],
    [2,2,1,1,1,1,3,3,3,0],
    [0,0,0,0,0,0,0,3,0,0],
];

export const arrow2 = [
    [0,0,0,0,0,0,0,0,3,0],
    [0,2,2,1,1,1,1,3,3,3],
    [0,2,2,1,1,1,1,3,3,3],
    [0,0,0,0,0,0,0,0,3,0],
];

export const arrow3 = [
    [0,0,0,0,0,0,3,0,0,0],
    [2,1,1,1,1,3,3,3,0,0],
    [2,1,1,1,1,3,3,3,0,0],
    [0,0,0,0,0,0,3,0,0,0],
];

// Backwards compatibility aliases
export const hockeyPalette = arrowPalette;
export const hockeyStick1 = arrow1;
export const hockeyStick2 = arrow2;
export const hockeyStick3 = arrow3;
