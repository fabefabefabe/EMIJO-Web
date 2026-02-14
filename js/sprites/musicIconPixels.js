// Music Icon Pixel Data - musical note icons
// Palette indices reference Palettes.ui
// 7 = white (music on), 8 = light gray (music off)

// Musical note icon (music on) - 10 wide x 12 tall
// ♪ shape: filled note head at bottom-left, stem going up, flag at top-right
export const speakerOn = [
    [ 0, 0, 0, 0, 0, 0, 7, 7, 7, 0],
    [ 0, 0, 0, 0, 0, 7, 7, 7, 7, 0],
    [ 0, 0, 0, 0, 0, 7, 0, 0, 7, 0],
    [ 0, 0, 0, 0, 0, 7, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 7, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 7, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 7, 0, 0, 0, 0],
    [ 0, 0, 0, 0, 0, 7, 0, 0, 0, 0],
    [ 0, 0, 7, 7, 7, 7, 0, 0, 0, 0],
    [ 0, 7, 7, 7, 7, 7, 0, 0, 0, 0],
    [ 0, 7, 7, 7, 7, 0, 0, 0, 0, 0],
    [ 0, 0, 7, 7, 0, 0, 0, 0, 0, 0],
];

// Musical note icon muted (music off) - 10 wide x 12 tall
// Same note shape in gray, with red X overlay
export const speakerOff = [
    [ 0, 0, 0, 0, 0, 0, 8, 8, 8, 0],
    [ 0, 0, 0, 0, 0, 8, 8, 8, 8, 0],
    [ 4, 0, 0, 0, 0, 8, 0, 0, 4, 0],
    [ 0, 4, 0, 0, 0, 8, 0, 4, 0, 0],
    [ 0, 0, 4, 0, 0, 8, 4, 0, 0, 0],
    [ 0, 0, 0, 4, 4, 8, 0, 0, 0, 0],
    [ 0, 0, 0, 4, 4, 8, 0, 0, 0, 0],
    [ 0, 0, 4, 0, 0, 8, 4, 0, 0, 0],
    [ 0, 4, 8, 8, 8, 8, 0, 4, 0, 0],
    [ 4, 8, 8, 8, 8, 8, 0, 0, 4, 0],
    [ 0, 8, 8, 8, 8, 0, 0, 0, 0, 0],
    [ 0, 0, 8, 8, 0, 0, 0, 0, 0, 0],
];
