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
        [80,140,50],        // 18: tree green light
        [50,110,35],        // 19: tree green mid
        [30,80,20],         // 20: tree green dark
    ],

    objectsNight: [
        null,               // 0: transparent
        [190,190,195],      // 1: rock light (unchanged)
        [40,40,45],         // 2: rock mid -> very dark
        [20,20,25],         // 3: rock dark -> near black
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
        [200,200,220],      // 14: white -> dim glow (eyes visible at night)
        [10,10,15],         // 15: black/outline -> near black
        [100,60,30],        // 16: pole brown
        [75,45,20],         // 17: pole brown dark
        [80,140,50],        // 18: tree green light
        [50,110,35],        // 19: tree green mid
        [30,80,20],         // 20: tree green dark
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

    environmentSunset: [
        null,               // 0: transparent
        [255,140,70],       // 1: sunset orange (was sky blue light)
        [180,80,120],       // 2: sunset pink-purple (was sky blue mid)
        [60,80,140],        // 3: twilight sea
        [40,60,110],        // 4: twilight sea dark
        [25,40,80],         // 5: deep twilight
        [60,120,60],        // 6: bush green light (darker for evening)
        [35,85,35],         // 7: bush green
        [20,60,20],         // 8: bush green dark
        [170,160,150],      // 9: sidewalk warm light
        [145,135,130],      // 10: sidewalk warm
        [115,110,105],      // 11: sidewalk warm dark
        [90,85,80],         // 12: sidewalk warm crack
        [255,200,150],      // 13: warm white (clouds/foam tinted)
        [200,180,150],      // 14: warm sand
        [180,160,140],      // 15: warm sand dark
    ],

    environmentNight: [
        null,               // 0: transparent
        [15,15,40],         // 1: dark sky
        [10,10,30],         // 2: very dark sky
        [15,25,55],         // 3: night sea
        [10,18,40],         // 4: night sea dark
        [8,12,30],          // 5: deep night sea
        [25,55,25],         // 6: night bush green light
        [15,38,15],         // 7: night bush green
        [8,25,8],           // 8: night bush green dark
        [80,80,90],         // 9: night sidewalk light
        [65,65,75],         // 10: night sidewalk
        [50,50,60],         // 11: night sidewalk dark
        [38,38,45],         // 12: night sidewalk crack
        [120,120,140],      // 13: dim white (clouds/foam at night)
        [90,90,100],        // 14: dark sand
        [75,75,85],         // 15: dark sand shadow
    ],

    birdNight: [
        null,               // 0: transparent
        [10,10,10],         // 1: body dark (near black)
        [15,15,15],         // 2: body (very dark)
        [20,20,20],         // 3: body light (still dark)
        [25,25,25],         // 4: belly (dark, no white)
        [30,20,10],         // 5: beak (very dark orange)
    ],

    sunSunset: [
        null,               // 0: transparent
        [255,160,50],       // 1: orange core
        [255,120,30],       // 2: deep orange
        [255,80,20],        // 3: red-orange edge
        [255,200,100],      // 4: warm pale rays
    ],

    moon: [
        null,               // 0: transparent
        [240,240,255],      // 1: bright white (lit area)
        [200,200,220],      // 2: light gray (craters/detail)
        [255,255,200],      // 3: pale yellow (glow)
    ],

    sand: [
        null,               // 0: transparent
        [230,210,170],      // 1: light sand
        [210,190,150],      // 2: medium sand
        [180,160,120],      // 3: dark sand grain
        [245,230,195],      // 4: sand highlight
    ],

    sandSunset: [
        null,               // 0: transparent
        [200,170,120],      // 1: warm light sand
        [180,150,105],      // 2: warm medium sand
        [150,125,85],       // 3: warm dark grain
        [220,190,145],      // 4: warm highlight
    ],

    sandNight: [
        null,               // 0: transparent
        [90,85,70],         // 1: dark sand
        [75,70,58],         // 2: darker sand
        [55,50,40],         // 3: very dark grain
        [105,100,85],       // 4: dim highlight
    ],

    lightPoleNight: [
        [0,0,0,0],          // 0: transparent
        [50,50,60],         // 1: dark gray (pole body, darker at night)
        [80,80,90],         // 2: mid gray (detail, darker at night)
        [110,110,120],      // 3: light gray (highlight, dimmer)
        [255,255,180],      // 4: bright warm white (lantern glowing!)
    ],

    jogger: [
        null,               // 0: transparent
        [255,200,160],      // 1: skin
        [220,170,130],      // 2: skin shadow
        [255,100,180],      // 3: hot pink (main outfit)
        [220,60,140],       // 4: hot pink shadow
        [180,40,110],       // 5: hot pink dark
        [255,180,220],      // 6: light pink (headband/accents)
        [80,80,80],         // 7: dark gray (shoes)
        [55,55,55],         // 8: shoes shadow
        [30,30,30],         // 9: outline/eyes
        [255,255,255],      // 10: white (socks, eyes)
        [200,60,60],        // 11: mouth/red
        [160,120,80],       // 12: brown hair
        [120,85,55],        // 13: hair shadow
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
