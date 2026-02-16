// Beagle Pixel Data - tricolor beagle dog (white, brown, black)
// 16 wide x 10 tall, 5 animation frames. Palette indices reference beaglePalette.
// Dog faces RIGHT: head/nose on right side, tail on left side.
//
//  0 = transparent
//  1 = white (chest, paws, tail tip)
//  2 = light brown/tan
//  3 = dark brown
//  4 = black (saddle, ears, nose)
//  5 = beige/cream
//  6 = pink (tongue)
//  7 = eye/outline

export const beaglePalette = [
    null,               // 0: transparent
    [255,255,255],      // 1: white (chest, paws, tail tip)
    [180,120,60],       // 2: light brown/tan
    [140,80,30],        // 3: dark brown
    [40,30,20],         // 4: black (saddle, ears, nose)
    [220,180,140],      // 5: beige/cream
    [200,100,100],      // 6: pink (tongue, shown in sniff)
    [30,30,30],         // 7: eye/outline
];

// ---------------------------------------------------------------
// beagleSit  -  sitting pose, facing right, tail curled up (left)
// Compact upright posture. Head high-right, body center, tail up-left.
// Ears droop from head. White chest/paws, black saddle, brown back.
// ---------------------------------------------------------------
//
//  Row 0:  tail tip (white) up on far left
//  Row 1:  tail (brown) + ear tips (black) above head
//  Row 2:  ear + head top (brown)
//  Row 3:  face: eye, muzzle, nose
//  Row 4:  neck / collar area, cream muzzle underside
//  Row 5:  upper body - black saddle + white chest
//  Row 6:  mid body
//  Row 7:  lower body / belly
//  Row 8:  haunches sitting
//  Row 9:  paws on ground

export const beagleSit = [
    [0,1,0,0,0,0,0,0,0,0,0,4,4,0,0,0],
    [0,2,1,0,0,0,0,0,0,0,4,2,2,4,0,0],
    [0,0,2,0,0,0,0,0,0,0,2,5,7,2,0,0],
    [0,0,0,0,0,0,0,0,0,0,2,5,5,7,4,0],
    [0,0,0,0,0,4,4,4,4,3,2,1,1,2,0,0],
    [0,0,0,0,4,4,4,4,3,3,1,1,1,0,0,0],
    [0,0,0,0,4,4,3,3,2,2,1,1,0,0,0,0],
    [0,0,0,0,3,2,2,2,2,1,1,1,0,0,0,0],
    [0,0,0,0,0,2,2,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0],
];

// ---------------------------------------------------------------
// beagleRun1  -  running, left legs forward, right legs back
// Galloping stride with body stretched horizontally.
// Front legs (right side) reach forward, hind legs (left side) push back.
// Tail streams out behind (left), held level.
// ---------------------------------------------------------------

export const beagleRun1 = [
    [0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,4,2,2,4,0,0],
    [2,1,0,0,0,0,0,0,0,0,2,5,7,2,0,0],
    [0,2,0,0,0,0,0,0,0,0,2,5,5,7,4,0],
    [0,0,0,4,4,4,4,4,3,3,2,1,1,2,0,0],
    [0,0,0,4,4,4,4,3,3,2,1,1,1,0,0,0],
    [0,0,0,0,3,3,2,2,2,1,1,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
];

// ---------------------------------------------------------------
// beagleRun2  -  running, right legs forward, left legs back
// Opposite stride from run1. Legs swap positions.
// Front legs (right side) tuck back, hind legs (left side) reach forward.
// ---------------------------------------------------------------

export const beagleRun2 = [
    [0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,4,2,2,4,0,0],
    [2,1,0,0,0,0,0,0,0,0,2,5,7,2,0,0],
    [0,2,0,0,0,0,0,0,0,0,2,5,5,7,4,0],
    [0,0,0,4,4,4,4,4,3,3,2,1,1,2,0,0],
    [0,0,0,4,4,4,4,3,3,2,1,1,1,0,0,0],
    [0,0,0,0,3,3,2,2,2,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
];

// ---------------------------------------------------------------
// beagleSniff1  -  head down, nose pointing at ground level
// Body stays roughly same position. Head/neck dip down to right,
// nose reaches bottom rows. Ears flop forward. Tongue peeking out.
// ---------------------------------------------------------------

export const beagleSniff1 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,4,4,4,4,4,3,3,2,0,0,0,0,0],
    [0,0,0,4,4,4,4,3,3,2,1,2,0,0,0,0],
    [0,0,0,0,3,3,2,2,2,1,1,5,4,4,0,0],
    [0,0,0,1,0,0,0,0,0,1,4,2,2,4,0,0],
    [0,0,0,1,0,0,0,0,0,0,2,5,7,2,0,0],
    [0,0,0,0,0,0,0,0,0,0,2,5,5,4,6,0],
    [0,0,0,0,0,0,0,0,0,0,0,2,7,2,0,0],
];

// ---------------------------------------------------------------
// beagleSniff2  -  head slightly raised from sniff, still lowered
// Head is a couple pixels higher than sniff1 - between sniff1 and
// standing position. Nose still below body line.
// ---------------------------------------------------------------

export const beagleSniff2 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,0,0,0,0,0,0,0,0,0,4,4,0,0,0],
    [0,0,0,4,4,4,4,4,3,3,4,2,2,4,0,0],
    [0,0,0,4,4,4,4,3,3,2,2,5,7,2,0,0],
    [0,0,0,0,3,3,2,2,2,1,2,5,5,7,4,0],
    [0,0,0,1,0,0,0,0,0,1,1,1,6,2,0,0],
    [0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ---------------------------------------------------------------
// beagleJump  -  jumping pose, legs extended outward, body in air
// Front legs reach forward, hind legs stretch back.
// Bottom 2 rows empty (dog airborne). Tail up-left.
// ---------------------------------------------------------------

export const beagleJump = [
    [0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,4,2,2,4,0,0],
    [2,1,0,0,0,0,0,0,0,0,2,5,7,2,0,0],
    [0,2,0,0,0,0,0,0,0,0,2,5,5,7,4,0],
    [0,0,0,4,4,4,4,4,3,3,2,1,1,2,0,0],
    [0,0,0,4,4,4,4,3,3,2,1,1,1,0,0,0],
    [0,0,1,0,3,3,2,2,2,1,1,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
