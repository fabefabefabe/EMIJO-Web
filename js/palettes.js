// Color palettes - each palette is an array of [R, G, B] colors
// Index 0 is always transparent (null)

export const Palettes = {
    emi: [
        null,               // 0: transparent
        [255,220,100],      // 1: blonde hair bright
        [210,180,80],       // 2: blonde hair shadow
        [255,200,160],      // 3: skin
        [220,170,130],      // 4: skin shadow
        [50,80,200],        // 5: blue shirt
        [30,55,150],        // 6: blue shirt shadow
        [70,70,90],         // 7: dark pants
        [50,50,70],         // 8: pants shadow
        [140,80,40],        // 9: brown shoes
        [100,55,25],        // 10: shoes shadow
        [30,30,30],         // 11: outlines/eyes
        [255,255,255],      // 12: white
        [200,60,60],        // 13: mouth/red
    ],

    jo: [
        null,               // 0: transparent
        [180,140,90],       // 1: light brown hair
        [140,105,65],       // 2: hair shadow
        [255,200,160],      // 3: skin
        [220,170,130],      // 4: skin shadow
        [220,60,100],       // 5: pink/red top
        [180,40,75],        // 6: top shadow
        [100,60,160],       // 7: purple skirt
        [75,40,125],        // 8: skirt shadow
        [140,80,40],        // 9: brown shoes
        [100,55,25],        // 10: shoes shadow
        [30,30,30],         // 11: outlines/eyes
        [255,255,255],      // 12: white
        [200,60,60],        // 13: mouth/red
        [255,180,200],      // 14: pink bow
    ],

    environment: [
        null,               // 0: transparent
        [135,206,240],      // 1: sky blue light
        [100,170,220],      // 2: sky blue mid
        [60,130,200],       // 3: sea blue
        [40,100,170],       // 4: sea blue dark
        [30,80,140],        // 5: deep sea
        [80,160,80],        // 6: bush green light
        [50,120,50],        // 7: bush green
        [30,85,30],         // 8: bush green dark
        [190,190,190],      // 9: sidewalk light
        [160,160,160],      // 10: sidewalk
        [130,130,130],      // 11: sidewalk dark
        [100,100,100],      // 12: sidewalk crack
        [255,255,255],      // 13: white/foam
        [220,220,200],      // 14: sand/beige
        [200,180,160],      // 15: sand dark
    ],

    objects: [
        null,               // 0: transparent
        [190,190,195],      // 1: rock light
        [155,155,160],      // 2: rock mid
        [115,115,120],      // 3: rock dark
        [220,175,100],      // 4: bench wood light
        [190,140,75],       // 5: bench wood
        [155,110,55],       // 6: bench wood dark
        [140,145,160],      // 7: metal/trash can
        [105,105,120],      // 8: metal dark
        [175,180,195],      // 9: metal light
        [200,0,0],          // 10: red flag
        [255,50,50],        // 11: red light
        [255,215,0],        // 12: gold/yellow
        [200,170,0],        // 13: gold dark
        [255,255,255],      // 14: white
        [60,60,65],         // 15: black/outline
        [100,60,30],        // 16: pole brown
        [75,45,20],         // 17: pole brown dark
    ],

    ui: [
        null,               // 0: transparent
        [50,200,50],        // 1: energy green
        [30,150,30],        // 2: energy green dark
        [200,200,50],       // 3: energy yellow
        [200,50,50],        // 4: energy red
        [40,40,40],         // 5: bar background
        [80,80,80],         // 6: bar border
        [255,255,255],      // 7: white
        [200,200,200],      // 8: light gray
        [30,30,30],         // 9: black
        [50,80,200],        // 10: blue accent
        [220,60,100],       // 11: pink accent
        [255,220,100],      // 12: yellow/gold
    ],

    heart: [
        null,               // 0: transparent
        [220,40,60],        // 1: red (full heart)
        [255,120,140],      // 2: red highlight (full heart)
        [100,100,110],      // 3: gray (empty heart)
        [140,140,150],      // 4: gray highlight (empty heart)
    ],

    bird: [
        null,               // 0: transparent
        [60,60,60],         // 1: body dark
        [90,90,90],         // 2: body
        [120,120,120],      // 3: body light
        [255,255,255],      // 4: belly white
        [200,100,30],       // 5: beak orange
    ],

    sun: [
        null,               // 0: transparent
        [255,240,80],       // 1: bright yellow (core)
        [255,200,50],       // 2: medium yellow
        [255,170,30],       // 3: orange-yellow (edge)
        [255,255,180],      // 4: pale yellow (rays)
    ],

    gardener: [
        null,               // 0: transparent
        [255,200,160],      // 1: skin
        [220,170,130],      // 2: skin shadow
        [100,75,50],        // 3: dark brown hair (male)
        [180,140,90],       // 4: light brown hair (female)
        [60,140,60],        // 5: green shirt
        [40,100,40],        // 6: green dark
        [140,100,60],       // 7: brown pants
        [100,70,40],        // 8: brown dark
        [80,55,30],         // 9: shoes
        [55,35,15],         // 10: shoes shadow
        [30,30,30],         // 11: outline/eyes
        [255,255,255],      // 12: white
        [180,160,100],      // 13: straw hat
        [150,130,80],       // 14: hat shadow
    ],
};
