// Swimmer Pixel Data - 8 wide x 6 tall, 2 animation frames
// Seen from a distance in the water, very small and simple
// 0=transparent, 1=skin, 2=dark/hair, 3=water splash, 4=water dark

// Frame 1: left arm up
export const swimmer1 = [
    [0,0,3,0,0,0,0,0],
    [0,1,0,2,1,0,0,0],
    [3,3,1,1,1,4,3,0],
    [0,4,3,3,4,3,4,0],
    [0,0,4,3,3,4,0,0],
    [0,0,0,4,4,0,0,0],
];

// Frame 2: right arm up (mirrored, slightly different splash)
export const swimmer2 = [
    [0,0,0,0,0,3,0,0],
    [0,0,0,1,2,0,1,0],
    [0,3,4,1,1,1,3,3],
    [0,4,3,4,3,3,4,0],
    [0,0,4,3,3,4,0,0],
    [0,0,0,0,4,0,0,0],
];

export const swimmerPalette = [null, [255,200,160], [60,40,20], [180,210,240], [100,150,200]];
