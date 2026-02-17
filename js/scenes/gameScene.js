// Game Scene - main gameplay with parallax, player, obstacles, birds, flag, HUD
import { Config, getTimeOfDay, getCityForLevel, isBeachLevel } from '../config.js';
import * as TC from '../textureCache.js';
import { Player } from '../entities/player.js';
import { Obstacle } from '../entities/obstacle.js';
import { Bird } from '../entities/bird.js';
import { Flag } from '../entities/flag.js';
import { Camera } from '../systems/camera.js';
import { ParallaxSystem } from '../systems/parallax.js';
import { generateObstacles } from '../systems/obstacleSpawner.js';
import { aabbOverlap } from '../systems/collision.js';
import { HeartPickup } from '../entities/heartPickup.js';
import { Projectile } from '../entities/projectile.js';
import { AmmoPickup } from '../entities/ammoPickup.js';
import { Parents } from '../entities/parents.js';
import { Jogger } from '../entities/jogger.js';
import { Skater } from '../entities/skater.js';
import { HallOfFame } from '../systems/hallOfFame.js';
import { Beagle } from '../entities/beagle.js';
import { MatePickup } from '../entities/matePickup.js';

export class GameScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        const charType = this.game.state.selectedCharacter || 'emi';

        // Level system - inicializar si no existe
        if (this.game.state.currentLevel === undefined) {
            this.game.state.currentLevel = 1;
        }
        this.currentLevel = this.game.state.currentLevel;

        // Beach level detection (must be early — used by parallax and obstacle spawner)
        this.isBeach = isBeachLevel(this.currentLevel);

        // Time of day: 'day', 'sunset', or 'night'
        this.timeOfDay = getTimeOfDay(this.currentLevel);

        // Create player (pass level for speed multiplier)
        this.player = new Player(charType, this.currentLevel, this.isBeach);

        // Create camera
        this.camera = new Camera();

        // Create parallax (pass level for sunset/beach mode)
        this.parallax = new ParallaxSystem(this.currentLevel, this.isBeach);

        // Create flag - distancia basada en nivel
        const groundSurface = Config.groundSurface;
        const flagDistanceMeters = Config.level1DistanceMeters +
            (this.currentLevel - 1) * Config.levelDistanceIncrement;
        const flagX = flagDistanceMeters / Config.metersPerPixel;
        this.flag = new Flag(flagX, groundSurface);
        this.flagDistanceMeters = flagDistanceMeters;

        // Build exclusion zones for obstacle spawning (no overlap with decorations)
        const exclusionZones = [];
        const clearRadius = 120; // pixels of clearance around each item

        // Dog markers at every 100m
        for (let dist = 100; dist <= flagDistanceMeters; dist += 100) {
            const dx = dist / Config.metersPerPixel;
            exclusionZones.push({ xMin: dx - clearRadius, xMax: dx + clearRadius });
        }

        // Flag and parents
        exclusionZones.push({ xMin: flagX - clearRadius, xMax: flagX + 200 });

        // Welcome sign (20m from start)
        const welcomeSignX = 20 / Config.metersPerPixel;
        exclusionZones.push({ xMin: welcomeSignX - clearRadius, xMax: welcomeSignX + clearRadius });

        // Generate obstacles (use flag position + buffer as level width)
        const levelSpawnWidth = flagX + 1500;
        const obstacleData = generateObstacles(levelSpawnWidth, groundSurface, exclusionZones, this.isBeach);
        this.obstacles = obstacleData.map(o => {
            const obs = new Obstacle(o.type, o.x, o.groundSurface, charType);
            obs.timeOfDay = this.timeOfDay;
            return obs;
        });

        // Birds
        this.birds = [];
        this.birdSpawnTimer = 0;

        // Game state
        this.isLevelComplete = false;
        this.isGameOver = false;
        this.isPaused = false;
        this.endTimer = 0;

        // Metros recorridos (en lugar de timer)
        this.metersWalked = 0;

        // Game over text blink
        this.goBlinkTimer = 0;
        this.goBlinkAlpha = 1.0;

        // Track jump for sound effect
        this.wasJumping = false;

        // Heart pickups - spawn at fixed positions every 150m
        this.heartPickups = [];
        this._spawnFixedHearts();

        // Projectiles (auto-shoot power-up)
        this.projectiles = [];
        this.autoShootActive = false;
        this.autoShootTimer = 0;     // countdown from 10→0
        this.autoShootCooldown = 0;  // interval between shots

        // Ammo pickups (collecting activates auto-shoot)
        this.ammoPickups = [];
        this._spawnFixedAmmo();

        // Joggers & Skaters (level 3+)
        this.joggers = [];
        this.skaters = [];
        this.joggerSpawnTimer = 0;
        this.joggerNextSpawnAt = Config.joggerBaseSpawnInterval * (0.75 + Math.random() * 0.5);

        // Dogs at 100m markers — force a tree obstacle at each marker
        this.dogMarkers = this._generateDogMarkers();
        this.dogAnimTimer = 0;
        this.dogFrame = 0; // 0=frame1, 1=frame2

        // Create a tree at each dog marker position
        for (const marker of this.dogMarkers) {
            const treeObs = new Obstacle('tree', marker.x, groundSurface, charType);
            treeObs.isDogTree = true;
            treeObs.timeOfDay = this.timeOfDay;
            this.obstacles.push(treeObs);
            marker.treeObstacle = treeObs;
        }

        // Mate pickups (Gaucho Power) — spawned before tree-shift
        this.matePickups = [];
        this._spawnMatePickups();

        // Shift powerups away from trees
        this._shiftPickupsAwayFromTrees();

        // Welcome signs - dynamic from CITY_DATA
        this.welcomeSigns = [];
        const signX = 20 / Config.metersPerPixel; // 20m from start
        const cityData = getCityForLevel(this.currentLevel);
        if (cityData) {
            this.welcomeSigns.push({
                x: signX,
                line1Tex: TC.renderTextBold('BIENVENIDOS A'),
                line2Tex: TC.renderTextBold(cityData.name.toUpperCase()),
            });
        }

        // Light poles (decorative, every ~600px) - not on beach levels
        this.lightPoles = [];
        if (!this.isBeach) {
            for (let x = 300; x < flagX; x += 600) {
                this.lightPoles.push({ x });
            }
        }

        // Bonfires (beach + night only) with optional hippie NPC
        this.bonfires = [];
        this.hippies = [];
        if (this.isBeach && this.timeOfDay === 'night') {
            const bonfireCount = 2 + Math.floor(Math.random() * 2); // 2-3 bonfires
            for (let i = 0; i < bonfireCount; i++) {
                const bx = 800 + (flagX / bonfireCount) * i + Math.random() * 400;
                this.bonfires.push({
                    x: bx,
                    frame: 0,
                    timer: Math.random() * 0.2,
                    // Spark particles
                    sparks: [],
                });
                // 40% chance of hippie next to each bonfire
                if (Math.random() < 0.4) {
                    this.hippies.push({
                        x: bx - 70 - Math.random() * 20,
                        frame: 0,
                        timer: Math.random() * 0.5,
                    });
                }
            }
        }

        // Parents next to the flag
        this.parents = new Parents(flagX + 80, groundSurface);

        // Beagle companion (level 6+)
        this.beagle = null;
        if (this.currentLevel >= 6) {
            this.beagle = new Beagle(this.player.x - 100, groundSurface);
        }

        // Mate pickups (Gaucho Power) - state only, spawning done earlier
        this._gauchoPowerWasActive = false;
        this._gauchoPowerPrevPhase = 'none';
        this._gauchoPowerTextTimer = 0;
        this._gauchoPowerTextTex = null;

        // Tutorial: only on level 1, first time playing
        this._tutorial = null;
        if (this.currentLevel === 1 && !localStorage.getItem('emijo_tutorial_seen')) {
            this._tutorial = {
                phase: 0,           // 0=intro, 1=jump, 2=done
                alpha: 0,
                fadeIn: true,
                timer: 0,
                startX: this.player ? this.player.x : 450, // remember starting position
                firstObstacleX: this.obstacles.length > 0 ? this.obstacles[0].x : 2000,
                line1: TC.renderText('ESTAS PERDIDO EN LA COSTA'),
                line2: TC.renderText('DE URUGUAY!'),
                line3: TC.renderText('LLEGA AL FINAL Y'),
                line4: TC.renderText('REENCUENTRATE CON TUS PADRES'),
                walkText: TC.renderText('TOCA PARA SALTAR'),
                jumpText: TC.renderText('SALTA EL OBSTACULO!'),
            };
        }
    }

    /**
     * Spawn hearts at fixed intervals (every 150m)
     */
    _spawnFixedHearts() {
        const heartIntervalPixels = 150 / Config.metersPerPixel; // 150m in pixels
        const startX = heartIntervalPixels; // First heart at 150m

        for (let x = startX; x < this.flag.x; x += heartIntervalPixels) {
            // Random Y height requiring jump
            const y = Config.heartMinY + Math.random() * (Config.heartMaxY - Config.heartMinY);
            this.heartPickups.push(new HeartPickup(x, y));
        }
    }

    /**
     * Spawn ammo at fixed intervals (every 200m)
     */
    _spawnFixedAmmo() {
        const ammoIntervalPixels = Config.ammoSpawnIntervalMeters / Config.metersPerPixel;
        const startX = ammoIntervalPixels; // First ammo at 200m
        const charType = this.game.state.selectedCharacter || 'emi';
        const ammoType = charType === 'jo' ? 'hockey' : 'soccer';

        for (let x = startX; x < this.flag.x; x += ammoIntervalPixels) {
            this.ammoPickups.push(AmmoPickup.spawn(x, ammoType));
        }
    }

    /**
     * Spawn mate pickups at intervals (low probability per interval).
     * Level 2: guaranteed one mate pickup so the player discovers the powerup.
     */
    _spawnMatePickups() {
        // Level 2: ALWAYS place one mate pickup (introduces the mechanic)
        if (this.currentLevel === 2) {
            // Place it at ~40% of the level so player has time to see it
            const mateX = this.flag.x * 0.4;
            this.matePickups.push(new MatePickup(mateX, Config.groundSurface));
        }

        const intervalPx = Config.mateSpawnIntervalMeters / Config.metersPerPixel;
        // Start from 2x interval (so mate doesn't appear too early)
        for (let x = intervalPx * 2; x < this.flag.x; x += intervalPx) {
            if (Math.random() < Config.mateSpawnChance) {
                const y = Config.groundSurface; // on the ground (easy to grab)
                this.matePickups.push(new MatePickup(x, y));
            }
        }
    }

    /**
     * Shift hearts and ammo pickups so they don't overlap with tree/umbrella obstacles.
     */
    _shiftPickupsAwayFromTrees() {
        const treeObstacles = this.obstacles.filter(o =>
            o.type === 'tree' || o.type === 'beachUmbrella'
        );
        const treeHalfWidth = 90; // wider detection radius around tree/umbrella
        for (const pickup of [...this.heartPickups, ...this.ammoPickups, ...this.matePickups]) {
            for (const tree of treeObstacles) {
                if (Math.abs(pickup.x - tree.x) < treeHalfWidth) {
                    pickup.x = tree.x + treeHalfWidth + 50;
                    if (pickup.baseY !== undefined) pickup.baseY = pickup.y;
                }
            }
        }
    }

    /**
     * Generate dog marker positions at every 100m
     */
    _generateDogMarkers() {
        const markers = [];
        const intervalPixels = 100 / Config.metersPerPixel; // 100m in pixels

        for (let distance = 100; distance <= this.flagDistanceMeters; distance += 100) {
            const x = distance / Config.metersPerPixel;
            markers.push({
                x: x,
                meters: distance,
            });
        }
        return markers;
    }

    update(dt) {
        const input = this.game.input;

        // Pause with ESC
        if (input.consumeKey('Escape')) {
            if (!this.isLevelComplete && !this.isGameOver) {
                this.isPaused = !this.isPaused;
            }
        }
        if (this.isPaused) {
            // S = Sí, salir
            if (input.consumeKey('KeyS')) {
                this.game.state.totalMeters = 0;
                this.game.state.currentLevel = undefined;
                this.game.music.playTrack('menu');
                this.game.setScene('menu');
            }
            // N = No, continuar
            if (input.consumeKey('KeyN')) {
                this.isPaused = false;
            }
            return; // Don't update game while paused
        }

        // Handle end states
        if (this.isLevelComplete) {
            // Keep flag animating during level complete
            this.flag.update(dt);

            // Update beagle (runs to parents and sits)
            if (this.beagle) {
                this.beagle.update(dt, this.player.x, [], [], []);
            }

            // Keep existing projectiles flying during level complete
            for (const proj of this.projectiles) {
                proj.update(dt);
            }
            this.projectiles = this.projectiles.filter(p => p.alive);

            // Projectile vs obstacle collisions (so bullets can still destroy obstacles)
            for (const proj of this.projectiles) {
                for (const obstacle of this.obstacles) {
                    if (obstacle.destroyed) continue;
                    if (obstacle.type === 'pothole') continue;
                    if (obstacle.type === 'tree' || obstacle.type === 'beachUmbrella') continue;
                    if (obstacle.type === 'trashCan' && obstacle.knocked) continue;
                    if (aabbOverlap(proj.getAABB(), obstacle.getAABB())) {
                        obstacle.destroyed = true;
                        proj.destroy();
                        this.game.music.playDestroySound();
                        break;
                    }
                }
            }
            this.obstacles = this.obstacles.filter(o => !o.destroyed);

            if (this._levelCompletePhase === 'landing') {
                // Phase 1: If player is in the air, bring them down
                if (!this.player.isOnGround) {
                    // Apply gravity to bring player down
                    this.player.vy += Config.gravity * dt;
                    this.player.y += this.player.vy * dt;
                    this.player.vx = 0;
                    // Check ground
                    if (this.player.y <= Config.groundSurface) {
                        this.player.y = Config.groundSurface;
                        this.player.vy = 0;
                        this.player.isOnGround = true;
                    }
                }
                if (this.player.isOnGround) {
                    this.player.state = 'walking';
                    this._levelCompletePhase = 'walking';
                }
            }

            if (this._levelCompletePhase === 'walking') {
                // Phase 2: Player auto-walks toward parents center
                const targetX = this.parents.x;
                if (this.player.x < targetX) {
                    this.player.vx = Config.walkSpeed * 0.5;
                    this.player.x += this.player.vx * dt;
                    this.player.facingRight = true;
                    // Animate walk
                    this.player.walkTimer = (this.player.walkTimer || 0) + dt;
                    if (this.player.walkTimer >= 0.12) {
                        this.player.walkTimer -= 0.12;
                        this.player.walkFrame = ((this.player.walkFrame || 0) + 1) % 6;
                    }
                } else {
                    // Arrived — switch to hugging phase
                    this._levelCompletePhase = 'hugging';
                    this._familyHugStarted = true;
                    this._hugTimer = 0;
                    this._hugHearts = [];
                    this._heartSpawnTimer = 0;
                    this.player.vx = 0;
                    this.player.walkFrame = 0;
                    this.player.facingRight = true;
                    this.parents.startHug();
                }
            }

            if (this._levelCompletePhase === 'hugging') {
                // Phase 3: Hold hug with floating hearts for 2.5 seconds then transition
                this._hugTimer += dt;

                // Spawn floating hearts periodically
                this._heartSpawnTimer += dt;
                if (this._heartSpawnTimer >= 0.3) {
                    this._heartSpawnTimer -= 0.3;
                    // Spawn a heart at a random position around the family group
                    const px = this.parents.x + (Math.random() - 0.5) * 80;
                    const baseY = Config.sceneHeight - 16 * Config.pixelScale - 32 * Config.pixelScale;
                    this._hugHearts.push({
                        x: px,
                        y: baseY + Math.random() * 20 - 10,
                        vy: -40 - Math.random() * 30,  // float upward
                        vx: (Math.random() - 0.5) * 20, // slight horizontal drift
                        alpha: 1.0,
                        scale: 0.6 + Math.random() * 0.5,
                    });
                }

                // Update existing hearts
                for (let i = this._hugHearts.length - 1; i >= 0; i--) {
                    const h = this._hugHearts[i];
                    h.y += h.vy * dt;
                    h.x += h.vx * dt;
                    h.alpha -= dt * 0.5; // fade out over 2 seconds
                    if (h.alpha <= 0) {
                        this._hugHearts.splice(i, 1);
                    }
                }

                if (this._hugTimer >= 2.5) {
                    this.game.setScene('levelComplete');
                }
            }

            // Update camera to follow player during level complete
            this.camera.update(this.player.x);
            return;
        }

        if (this.isGameOver) {
            this.endTimer += dt;
            this.goBlinkTimer += dt;
            if (this.goBlinkTimer >= 0.3) {
                this.goBlinkTimer -= 0.3;
                this.goBlinkAlpha = this.goBlinkAlpha > 0.5 ? 0.3 : 1.0;
            }
            if (this.endTimer >= 3.0) {
                // Add current meters to total
                this.game.state.totalMeters += this.metersWalked;
                const totalMeters = this.game.state.totalMeters;
                const level = this.currentLevel;

                if (HallOfFame.isHighScore(level, totalMeters)) {
                    this.game.setScene('enterInitials');
                } else {
                    this.game.state.totalMeters = 0;
                    this.game.state.currentLevel = undefined;
                    this.game.music.playTrack('menu');
                    this.game.setScene('hallOfFame');
                }
            }
            return;
        }

        // Toggle music with M key
        if (input.consumeKey('KeyM')) {
            this.game.toggleMusic();
        }

        // Auto-shoot power-up: fire projectiles automatically when active (not while in pothole)
        if (this.autoShootActive && this.player.state !== 'fallingInHole') {
            this.autoShootTimer -= dt;
            this.autoShootCooldown -= dt;
            if (this.autoShootCooldown <= 0) {
                this._fireProjectile();
                this.autoShootCooldown = Config.autoShootInterval;
            }
            if (this.autoShootTimer <= 0) {
                this.autoShootActive = false;
            }
        }

        // Dog animation (tail wag / head tilt)
        this.dogAnimTimer += dt;
        if (this.dogAnimTimer >= 0.8) { // Faster animation cycle
            this.dogAnimTimer -= 0.8;
            this.dogFrame = 1 - this.dogFrame; // Toggle 0/1
        }

        // Bonfire animation + sparks
        for (const bf of this.bonfires) {
            bf.timer += dt;
            if (bf.timer >= 0.15) {
                bf.timer -= 0.15;
                bf.frame = (bf.frame + 1) % 4;
            }
            // Spawn sparks occasionally
            if (Math.random() < dt * 8) {
                bf.sparks.push({
                    x: bf.x + (Math.random() - 0.5) * 20,
                    y: 0,
                    vy: -40 - Math.random() * 60,
                    vx: (Math.random() - 0.5) * 20,
                    alpha: 1.0,
                    life: 0.5 + Math.random() * 0.5,
                });
            }
            // Update sparks
            for (let i = bf.sparks.length - 1; i >= 0; i--) {
                const sp = bf.sparks[i];
                sp.y += sp.vy * dt;
                sp.x += sp.vx * dt;
                sp.life -= dt;
                sp.alpha = Math.max(0, sp.life / 1.0);
                if (sp.life <= 0) bf.sparks.splice(i, 1);
            }
        }

        // Hippie animation
        for (const hp of this.hippies) {
            hp.timer += dt;
            if (hp.timer >= 0.5) {
                hp.timer -= 0.5;
                hp.frame = 1 - hp.frame;
            }
        }



        // Track previous state for jump sound
        const wasOnGround = this.player.isOnGround;

        // Update player (pass camera offset so player can't go behind screen)
        this.player.update(dt, input, this.camera.offset);

        // Play jump sound when player leaves ground
        if (wasOnGround && !this.player.isOnGround && this.player.vy > 0) {
            this.game.music.playJumpSound();
        }

        // Update camera
        this.camera.update(this.player.x);

        // Tutorial state machine
        if (this._tutorial && this._tutorial.phase < 2) {
            const tut = this._tutorial;
            tut.timer += dt;

            if (tut.phase === 0) {
                // Phase 0: Intro text — fade in, then fade out when player walks
                const distMoved = this.player.x - tut.startX;
                if (tut.fadeIn) {
                    tut.alpha = Math.min(1, tut.alpha + dt * 2);
                }
                // Player has walked ~150px from start → fade out
                if (distMoved > 150) {
                    tut.fadeIn = false;
                    tut.alpha = Math.max(0, tut.alpha - dt * 2);
                    if (tut.alpha <= 0) {
                        tut.phase = 1;
                        tut.alpha = 0;
                        tut.fadeIn = true;
                    }
                }
            } else if (tut.phase === 1) {
                // Phase 1: Jump hint — fade in well before first obstacle
                const dist = tut.firstObstacleX - this.player.x;
                if (dist < 550 && dist > -100) {
                    if (tut.fadeIn) {
                        tut.alpha = Math.min(1, tut.alpha + dt * 2);
                    }
                }
                // Past obstacle → fade out and finish
                if (this.player.x > tut.firstObstacleX + 150) {
                    tut.fadeIn = false;
                    tut.alpha = Math.max(0, tut.alpha - dt * 2);
                    if (tut.alpha <= 0) {
                        tut.phase = 2;
                        try { localStorage.setItem('emijo_tutorial_seen', '1'); } catch (e) {}
                    }
                }
            }
        }

        // Update parallax (sea animation)
        this.parallax.update(dt);

        // Update flag
        this.flag.update(dt);

        // Update obstacles (for trash can animations)
        for (const obstacle of this.obstacles) {
            obstacle.update(dt);
        }

        // Spawn birds
        this.birdSpawnTimer += dt;
        if (this.birdSpawnTimer >= Config.birdSpawnInterval) {
            this.birdSpawnTimer -= Config.birdSpawnInterval;
            this.birds.push(Bird.spawnRandom(this.camera.offset, this.timeOfDay));
        }

        // Update birds
        for (const bird of this.birds) {
            bird.update(dt);
        }
        this.birds = this.birds.filter(b => b.alive);

        // Update heart pickups (fixed positions, no random spawn)
        for (const heart of this.heartPickups) {
            heart.update(dt);
        }
        // Remove collected hearts only (keep off-screen ones for when player returns)
        this.heartPickups = this.heartPickups.filter(h => h.alive);

        // Update projectiles
        for (const proj of this.projectiles) {
            proj.update(dt);
        }
        this.projectiles = this.projectiles.filter(p => p.alive);

        // Collision: projectiles vs obstacles (skip trees and potholes)
        for (const proj of this.projectiles) {
            for (const obstacle of this.obstacles) {
                if (obstacle.destroyed) continue;
                if (obstacle.type === 'pothole') continue;
                if (obstacle.type === 'tree' || obstacle.type === 'beachUmbrella') continue;
                if (obstacle.type === 'trashCan' && obstacle.knocked) continue;
                if (aabbOverlap(proj.getAABB(), obstacle.getAABB())) {
                    obstacle.destroyed = true;
                    proj.destroy();
                    this.game.music.playDestroySound();
                    break;
                }
            }
        }
        // Collision: projectiles vs joggers
        for (const proj of this.projectiles) {
            if (!proj.alive) continue;
            for (const jogger of this.joggers) {
                if (jogger.knocked) continue;
                if (aabbOverlap(proj.getAABB(), jogger.getAABB())) {
                    jogger.knockDown();
                    proj.destroy();
                    this.game.music.playDestroySound();
                    break;
                }
            }
        }
        // Collision: projectiles vs skaters
        for (const proj of this.projectiles) {
            if (!proj.alive) continue;
            for (const skater of this.skaters) {
                if (skater.knocked) continue;
                if (aabbOverlap(proj.getAABB(), skater.getAABB())) {
                    skater.knockDown();
                    proj.destroy();
                    this.game.music.playDestroySound();
                    break;
                }
            }
        }
        // Collision: kicked beach balls vs joggers/skaters
        for (const obstacle of this.obstacles) {
            if (obstacle.type !== 'beachBall' || !obstacle.kicked) continue;
            const ballAABB = obstacle.getAABB();
            for (const jogger of this.joggers) {
                if (jogger.knocked) continue;
                if (aabbOverlap(ballAABB, jogger.getAABB())) {
                    jogger.knockDown();
                    this.game.music.playDestroySound();
                }
            }
            for (const skater of this.skaters) {
                if (skater.knocked) continue;
                if (aabbOverlap(ballAABB, skater.getAABB())) {
                    skater.knockDown();
                    this.game.music.playDestroySound();
                }
            }
        }

        // Remove destroyed obstacles
        this.obstacles = this.obstacles.filter(o => !o.destroyed);

        // Collision: player vs heart pickups
        const playerAABBForHeart = this.player.getAABB();
        for (const heart of this.heartPickups) {
            if (aabbOverlap(playerAABBForHeart, heart.getAABB())) {
                if (this.player.energy < Config.maxEnergy) {
                    if (heart.collect()) {
                        this.player.energy = Math.min(Config.maxEnergy, this.player.energy + 1);
                        this.game.music.playPickupSound();
                    }
                }
            }
        }

        // Update ammo pickups
        for (const ammo of this.ammoPickups) {
            ammo.update(dt);
        }
        this.ammoPickups = this.ammoPickups.filter(a => a.alive);

        // Collision: player vs ammo pickups → activate auto-shoot
        const playerAABBForAmmo = this.player.getAABB();
        for (const ammo of this.ammoPickups) {
            if (aabbOverlap(playerAABBForAmmo, ammo.getAABB())) {
                if (ammo.collect()) {
                    this.autoShootActive = true;
                    this.autoShootTimer = Config.autoShootDuration; // reset to 10s
                    this.autoShootCooldown = 0; // fire immediately
                    this.game.music.playPickupSound();
                }
            }
        }

        // Update mate pickups
        for (const mate of this.matePickups) {
            mate.update(dt);
        }
        this.matePickups = this.matePickups.filter(m => m.alive);

        // Collision: player vs mate pickups → activate Gaucho Power
        if (!this.player.gauchoPowerActive) {
            const playerAABBForMate = this.player.getAABB();
            for (const mate of this.matePickups) {
                if (!mate.alive) continue;
                if (aabbOverlap(playerAABBForMate, mate.getAABB())) {
                    if (mate.collect()) {
                        this.player.startDrinkingMate();
                        this.game.music.playGauchoPowerSound();
                        // Speed up music
                        this.game.music.setSpeedMultiplier(1.5);
                        // Remove remaining mates
                        for (const m of this.matePickups) m.alive = false;
                    }
                    break;
                }
            }
        }

        // Monitor Gaucho Power state for music speed and floating text
        if (this._gauchoPowerWasActive && !this.player.gauchoPowerActive) {
            // Power just ended — restore music speed
            this.game.music.setSpeedMultiplier(1.0);
            this._gauchoPowerWasActive = false;
            this._gauchoPowerPrevPhase = 'none';
        }
        if (this.player.gauchoPowerActive) {
            // Detect phase transition to 'active' → trigger floating text
            if (this._gauchoPowerPrevPhase === 'drinking' && this.player.gauchoPowerPhase === 'active') {
                this._gauchoPowerTextTimer = 2.0;
                this._gauchoPowerTextTex = TC.renderText('GAUCHO POWER');
            }
            this._gauchoPowerPrevPhase = this.player.gauchoPowerPhase;
            this._gauchoPowerWasActive = true;

            // Wind-down: gradually slow music back to normal
            if (this.player.gauchoPowerPhase === 'windDown') {
                const drinkDur = Config.gauchoPowerDrinkDuration;
                const totalDur = Config.gauchoPowerDuration + drinkDur;
                const windDownStart = totalDur - Config.gauchoPowerWindDown;
                const windProgress = (this.player.gauchoPowerTimer - windDownStart) / Config.gauchoPowerWindDown;
                const t = Math.min(1, windProgress);
                this.game.music.setSpeedMultiplier(1.5 - 0.5 * t);
            }
        }

        // Update "GAUCHO POWER" floating text timer
        if (this._gauchoPowerTextTimer > 0) {
            this._gauchoPowerTextTimer -= dt;
        }

        // Actualizar metros recorridos
        this.metersWalked = Math.floor(this.player.x * Config.metersPerPixel);

        // Cull objects that are far behind the camera (save memory)
        const cullX = this.camera.offset - 200;
        this.obstacles = this.obstacles.filter(o => o.alive !== false && o.x > cullX);
        this.heartPickups = this.heartPickups.filter(h => h.alive && h.x > cullX);
        this.ammoPickups = this.ammoPickups.filter(a => a.alive && a.x > cullX);
        this.matePickups = this.matePickups.filter(m => m.alive && m.x > cullX);
        this.dogMarkers = this.dogMarkers.filter(d => d.x > cullX);
        this.lightPoles = this.lightPoles.filter(p => p.x > cullX);
        this.joggers = this.joggers.filter(j => j.alive && j.x > cullX);
        this.skaters = this.skaters.filter(s => s.alive && s.x > cullX);

        // Spawn joggers/skaters (level 3+; skaters less frequent; no overlap before level 50)
        if (this.currentLevel >= Config.joggerMinLevel) {
            this.joggerSpawnTimer += dt;
            if (this.joggerSpawnTimer >= this.joggerNextSpawnAt) {
                // Check if any tree/umbrella is visible on screen — if so, skip spawn
                const treeOnScreen = this.obstacles.some(o =>
                    (o.type === 'tree' || o.type === 'beachUmbrella') &&
                    o.x > this.camera.offset - 100 &&
                    o.x < this.camera.offset + Config.sceneWidth + 100
                );
                if (treeOnScreen) {
                    // Don't spawn — keep timer just below threshold to retry next frame
                    this.joggerSpawnTimer = this.joggerNextSpawnAt - 0.01;
                } else {
                    this.joggerSpawnTimer = 0;
                    this.joggerNextSpawnAt = Config.joggerBaseSpawnInterval * (0.75 + Math.random() * 0.5);

                    // Decide jogger vs skater:
                    // Skaters: ~30% chance (less frequent than joggers), no beach
                    const wantsSkater = !this.isBeach && Math.random() < 0.3;

                    // Before level 50: no overlap — skip if the other type is on screen
                    if (this.currentLevel < 50) {
                        const joggerOnScreen = this.joggers.some(j =>
                            !j.knocked && j.x > this.camera.offset - 50 && j.x < this.camera.offset + Config.sceneWidth + 50
                        );
                        const skaterOnScreen = this.skaters.some(s =>
                            !s.knocked && s.x > this.camera.offset - 50 && s.x < this.camera.offset + Config.sceneWidth + 50
                        );

                        if (wantsSkater && !joggerOnScreen) {
                            this.skaters.push(Skater.spawnRandom(this.camera.offset, Config.groundSurface));
                        } else if (!wantsSkater && !skaterOnScreen) {
                            this.joggers.push(Jogger.spawnRandom(this.camera.offset, Config.groundSurface));
                        }
                        // If overlap would occur, skip this spawn entirely
                    } else {
                        // Level 50+: can coexist on screen
                        if (wantsSkater) {
                            this.skaters.push(Skater.spawnRandom(this.camera.offset, Config.groundSurface));
                        } else {
                            this.joggers.push(Jogger.spawnRandom(this.camera.offset, Config.groundSurface));
                        }
                    }
                }
            }
        }

        // Update joggers
        for (const jogger of this.joggers) {
            jogger.update(dt);
        }
        this.joggers = this.joggers.filter(j => j.alive);

        // Update skaters
        for (const skater of this.skaters) {
            skater.update(dt, this.camera.offset);
        }
        this.skaters = this.skaters.filter(s => s.alive);

        // Update beagle companion
        if (this.beagle) {
            this.beagle.update(dt, this.player.x, this.joggers, this.skaters, this.obstacles);

            // Beagle knocks down joggers/skaters while sprinting or chasing
            if (this.beagle.state === 'sprinting' || this.beagle.state === 'chasing') {
                const beagleAABB = this.beagle.getAABB();
                for (const jogger of this.joggers) {
                    if (!jogger.knocked && aabbOverlap(beagleAABB, jogger.getAABB())) {
                        jogger.knockDown();
                    }
                }
                for (const skater of this.skaters) {
                    if (!skater.knocked && aabbOverlap(beagleAABB, skater.getAABB())) {
                        skater.knockDown();
                    }
                }
            }
        }

        // Collision: player vs obstacles (type-specific)
        const playerAABB = this.player.getAABB();
        for (const obstacle of this.obstacles) {
            const obstAABB = obstacle.getAABB();
            if (!aabbOverlap(playerAABB, obstAABB)) continue;

            if (obstacle.type === 'tree' || obstacle.type === 'beachUmbrella') {
                // Tree/umbrella: only collides when jumping (canopy is above standing player)
                if (!this.player.isOnGround) {
                    // Stop upward movement immediately - player falls down
                    this.player.vy = 0;
                    if (this.player.tripAndFall()) {
                        obstacle.startShake();
                        this.game.music.playHitSound();
                    }
                    break;
                }
                // Standing player walks under — no collision
            } else if (obstacle.type === 'pothole') {
                // Pothole: special fall-in animation
                if (this.player.fallInHole(obstacle)) {
                    this.game.music.playPotholeSound();
                }
                break;
            } else if (obstacle.type === 'trashCan') {
                // Trash can: normal trip + knock over the can
                if (this.player.tripAndFall()) {
                    obstacle.knockOver();
                    this.game.music.playHitSound();
                }
                break;
            } else if (obstacle.type === 'beachBall') {
                // Kick the beach ball — no damage to player
                if (!obstacle.kicked) {
                    obstacle.kicked = true;
                    obstacle.kickVx = 400;
                    obstacle.kickVy = -250;
                    obstacle.kickY = 0;
                    obstacle.kickLifeTimer = 0;
                    this.game.music.playKickSound();
                }
                continue; // player keeps running, check other obstacles
            } else {
                // Rock, bench, cooler: normal trip
                if (this.player.tripAndFall()) {
                    this.game.music.playHitSound();
                }
                break;
            }
        }

        // Collision: player vs joggers
        for (const jogger of this.joggers) {
            if (jogger.knocked) continue;
            if (aabbOverlap(playerAABB, jogger.getAABB())) {
                if (this.player.tripAndFall()) {
                    jogger.knockDown();
                    this.game.music.playHitSound();
                }
                break;
            }
        }

        // Collision: player vs skaters
        for (const skater of this.skaters) {
            if (skater.knocked) continue;
            if (aabbOverlap(playerAABB, skater.getAABB())) {
                if (this.player.tripAndFall()) {
                    skater.knockDown();
                    this.game.music.playHitSound();
                }
                break;
            }
        }

        // Los pájaros son decorativos, no quitan vidas

        // Collision: player vs bonfires (trip and fall)
        for (const bf of this.bonfires) {
            const bfAABB = { x: bf.x, y: Config.groundSurface + 24, hw: 24, hh: 18 };
            if (aabbOverlap(playerAABB, bfAABB)) {
                if (this.player.tripAndFall()) {
                    this.game.music.playHitSound();
                }
                break;
            }
        }

        // Collision: player vs hippies (trip and fall)
        for (const hp of this.hippies) {
            const hpAABB = { x: hp.x, y: Config.groundSurface + 18, hw: 18, hh: 18 };
            if (aabbOverlap(playerAABB, hpAABB)) {
                if (this.player.tripAndFall()) {
                    this.game.music.playHitSound();
                }
                break;
            }
        }

        // Level complete: player passes the flag position
        if (this.player.x >= this.flag.x) {
            this._triggerLevelComplete();
        }

        // Check game over
        if (!this.player.isAlive && !this.isGameOver) {
            this._triggerGameOver();
        }
    }

    draw(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const camX = this.camera.offset;

        // Clear with dark background based on time of day
        ctx.fillStyle = this.timeOfDay === 'night' ? '#0a0a1a'
            : this.timeOfDay === 'sunset' ? '#1a0d1a' : '#1a1a33';
        ctx.fillRect(0, 0, W, H);

        // Draw parallax backgrounds
        this.parallax.draw(ctx, camX);

        // Draw light poles (decorative, between parallax and obstacles)
        this._drawLightPoles(ctx, camX);

        // Draw welcome signs (behind obstacles)
        this._drawWelcomeSigns(ctx, camX);

        // Draw obstacles
        for (const obstacle of this.obstacles) {
            obstacle.draw(ctx, camX);
        }

        // Draw dogs at every 100m marker (AFTER obstacles so dog appears in front of tree)
        this._drawDogMarkers(ctx, camX);

        // Draw joggers
        for (const jogger of this.joggers) {
            jogger.draw(ctx, camX);
        }

        // Draw skaters
        for (const skater of this.skaters) {
            skater.draw(ctx, camX);
        }

        // Draw bonfires (with glow and sparks)
        this._drawBonfires(ctx, camX);

        // Draw hippies
        this._drawHippies(ctx, camX);

        // Draw flag
        this.flag.draw(ctx, camX);

        // Draw parents next to flag
        this.parents.draw(ctx, camX);

        // Draw birds (behind player)
        for (const bird of this.birds) {
            bird.draw(ctx, camX);
        }

        // Draw mate pickups (before player, on ground level)
        for (const mate of this.matePickups) {
            mate.draw(ctx, camX);
        }

        // Draw beagle companion
        if (this.beagle) {
            this.beagle.draw(ctx, camX, this.timeOfDay);
        }

        // Draw player
        this.player.draw(ctx, camX, this.timeOfDay);

        // Draw "GAUCHO POWER" floating text above player
        if (this._gauchoPowerTextTimer > 0 && this._gauchoPowerTextTex) {
            const gpAlpha = Math.min(1, this._gauchoPowerTextTimer / 1.5);
            const floatY = (2 - this._gauchoPowerTextTimer) * 30; // rises 30px over 2s
            const textScale = Config.pixelScale * 0.8;
            const tw = this._gauchoPowerTextTex.width * textScale;
            const th = this._gauchoPowerTextTex.height * textScale;
            const px = this.player.x - camX - tw / 2;
            const scale = Config.pixelScale;
            const sidewalkH = 16 * scale;
            const playerTexture = this.player.getCurrentTexture();
            const spriteH = playerTexture.height * scale;
            const playerScreenY = H - sidewalkH - spriteH - (this.player.y - Config.groundSurface);
            const py = playerScreenY - 40 - floatY;

            ctx.save();
            ctx.globalAlpha = gpAlpha;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this._gauchoPowerTextTex, px, py, tw, th);

            // Add colored glow effect behind text
            ctx.globalCompositeOperation = 'source-atop';
            const hue = this.player.gauchoPowerHue || 0;
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.4)`;
            ctx.fillRect(px, py, tw, th);
            ctx.globalCompositeOperation = 'source-over';

            ctx.restore();
        }

        // Draw pothole speech bubble on top of everything (deferred for z-order)
        for (const obstacle of this.obstacles) {
            if (obstacle.drawSpeechBubbleDeferred) {
                obstacle.drawSpeechBubbleDeferred(ctx);
            }
        }

        // Draw floating hearts during family hug
        if (this._familyHugStarted && this._hugHearts && this._hugHearts.length > 0) {
            this._drawHugHearts(ctx, camX);
        }

        // Draw heart pickups
        for (const heart of this.heartPickups) {
            heart.draw(ctx, camX);
        }

        // Draw ammo pickups
        for (const ammo of this.ammoPickups) {
            ammo.draw(ctx, camX);
        }

        // Draw projectiles
        for (const proj of this.projectiles) {
            proj.draw(ctx, camX);
        }

        // Draw HUD
        this._drawHUD(ctx);

        // Draw tutorial overlay
        if (this._tutorial && this._tutorial.phase < 2 && this._tutorial.alpha > 0) {
            this._drawTutorial(ctx, camX);
        }

        // Draw Game Over text
        if (this.isGameOver) {
            this._drawGameOver(ctx);
        }

        // Draw pause overlay
        if (this.isPaused) {
            this._drawPause(ctx);
        }
    }

    _drawHUD(ctx) {
        const scale = Config.pixelScale;
        const margin = 10;

        // Draw 5 hearts
        const heartW = TC.heartFullTex.width * scale;
        const heartH = TC.heartFullTex.height * scale;
        const heartSpacing = 4;
        const currentHearts = this.player.energy; // 0-5

        ctx.imageSmoothingEnabled = false;

        for (let i = 0; i < Config.maxEnergy; i++) {
            const x = margin + i * (heartW + heartSpacing);
            const y = margin;

            if (i < currentHearts) {
                // Full heart (red)
                ctx.drawImage(TC.heartFullTex, x, y, heartW, heartH);
            } else {
                // Empty heart (gray)
                ctx.drawImage(TC.heartEmptyTex, x, y, heartW, heartH);
            }
        }

        // Draw level number below hearts
        const levelText = TC.renderText('NIVEL ' + this.currentLevel);
        const levelScale = scale * 0.6;
        const levelW = levelText.width * levelScale;
        const levelH = levelText.height * levelScale;
        const levelY = margin + heartH + 6;

        ctx.drawImage(levelText, margin, levelY, levelW, levelH);

        // Draw meters below level (padded to 3 digits)
        const paddedMeters = String(this.metersWalked).padStart(3, '0');
        const metersText = TC.renderText(paddedMeters + 'M/' + this.flagDistanceMeters + 'M');
        const metersScale = scale * 0.7;
        const metersW = metersText.width * metersScale;
        const metersH = metersText.height * metersScale;
        const metersY = levelY + levelH + 4;

        ctx.drawImage(metersText, margin, metersY, metersW, metersH);

        // Draw music toggle button (top-right corner)
        const W = Config.sceneWidth;
        const isMuted = this.game.state.musicMuted;
        const icon = isMuted ? TC.musicOffIcon : TC.musicOnIcon;
        const iconW = icon.width * scale;
        const iconH = icon.height * scale;
        const iconX = W - margin - iconW;
        const iconY = margin;

        ctx.drawImage(icon, iconX, iconY, iconW, iconH);

        // Store bounds for click detection
        this._musicBounds = { x: iconX, y: iconY, w: iconW, h: iconH };

        // Draw auto-shoot countdown (below music icon, top-right) — only when active
        if (this.autoShootActive) {
            const charType = this.game.state.selectedCharacter || 'emi';
            const ammoFrames = charType === 'jo' ? TC.arrowFrames : TC.soccerBallFrames;
            const ammoIcon = ammoFrames[0];
            const ammoIconScale = scale * 0.8;
            const ammoIconW = ammoIcon.width * ammoIconScale;
            const ammoIconH = ammoIcon.height * ammoIconScale;
            const ammoIconX = W - margin - ammoIconW;
            const ammoIconY = iconY + iconH + 10;

            // Weapon icon
            ctx.drawImage(ammoIcon, ammoIconX, ammoIconY, ammoIconW, ammoIconH);

            // Countdown text: "8S"
            const secs = Math.ceil(this.autoShootTimer);
            const countText = TC.renderText(secs + 'S');
            const countScale = scale * 0.6;
            const countW = countText.width * countScale;
            const countH = countText.height * countScale;
            const countX = ammoIconX - countW - 6;
            const countY = ammoIconY + (ammoIconH - countH) / 2;
            ctx.drawImage(countText, countX, countY, countW, countH);

            // Progress bar below icon
            const barW = ammoIconW + countW + 6;
            const barH = 4;
            const barX = countX;
            const barY = ammoIconY + ammoIconH + 4;
            const progress = this.autoShootTimer / Config.autoShootDuration;

            // Bar background (dark)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barW, barH);
            // Bar fill (gold → red as time runs out)
            const r = Math.round(255);
            const g = Math.round(215 * progress);
            ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
            ctx.fillRect(barX, barY, barW * progress, barH);
        }

        // Draw Gaucho Power countdown HUD (when active or winding down)
        const gpPhase = this.player.gauchoPowerPhase;
        if (gpPhase === 'active' || gpPhase === 'windDown' || gpPhase === 'drinking') {
            const drinkDur = Config.gauchoPowerDrinkDuration;
            const totalDur = Config.gauchoPowerDuration + drinkDur;
            const remaining = Math.max(0, totalDur - this.player.gauchoPowerTimer);
            const elapsed = this.player.gauchoPowerTimer;

            // Mate icon
            const mateIcon = TC.matePickupTex;
            const mateIconScale = scale * 0.8;
            const mateIconW = mateIcon.width * mateIconScale;
            const mateIconH = mateIcon.height * mateIconScale;

            // Position: below auto-shoot if active, or below music icon
            let gpBaseY;
            if (this.autoShootActive) {
                // Below auto-shoot bar
                const ammoIconY = iconY + iconH + 10;
                const ammoIconH2 = 10 * scale * 0.8; // approx ammo icon height
                gpBaseY = ammoIconY + ammoIconH2 + 14;
            } else {
                gpBaseY = iconY + iconH + 10;
            }

            const mateIconX = W - margin - mateIconW;
            const mateIconY = gpBaseY;

            // Mate icon with color cycling tint
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(mateIcon, mateIconX, mateIconY, mateIconW, mateIconH);

            if (gpPhase === 'active' || gpPhase === 'windDown') {
                ctx.globalCompositeOperation = 'source-atop';
                const hue = this.player.gauchoPowerHue || 0;
                ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.4)`;
                ctx.fillRect(mateIconX, mateIconY, mateIconW, mateIconH);
                ctx.globalCompositeOperation = 'source-over';
            }
            ctx.restore();

            // Countdown text
            const secs = Math.ceil(remaining);
            const gpCountText = TC.renderText(secs + 'S');
            const gpCountScale = scale * 0.6;
            const gpCountW = gpCountText.width * gpCountScale;
            const gpCountH = gpCountText.height * gpCountScale;
            const gpCountX = mateIconX - gpCountW - 6;
            const gpCountY = mateIconY + (mateIconH - gpCountH) / 2;
            ctx.drawImage(gpCountText, gpCountX, gpCountY, gpCountW, gpCountH);

            // Progress bar below
            const gpBarW = mateIconW + gpCountW + 6;
            const gpBarH = 4;
            const gpBarX = gpCountX;
            const gpBarY = mateIconY + mateIconH + 4;
            const gpProgress = remaining / totalDur;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(gpBarX, gpBarY, gpBarW, gpBarH);
            // Bar fill: green → yellow → red
            const gpR = Math.round(255 * (1 - gpProgress));
            const gpG = Math.round(255 * gpProgress);
            ctx.fillStyle = `rgb(${gpR}, ${gpG}, 0)`;
            ctx.fillRect(gpBarX, gpBarY, gpBarW * gpProgress, gpBarH);
        }
    }

    _drawGameOver(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);

        // "GAME OVER" text
        const goText = TC.renderText('GAME OVER');
        const goScale = Config.pixelScale * 2;
        const goW = goText.width * goScale;
        const goH = goText.height * goScale;

        ctx.save();
        ctx.globalAlpha = this.goBlinkAlpha;
        ctx.imageSmoothingEnabled = false;

        // Draw with red tint - draw the white text then overlay red
        ctx.drawImage(goText, (W - goW) / 2, H * 0.4 - goH / 2, goW, goH);

        // Red tint
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(200, 50, 50, 0.7)';
        ctx.fillRect((W - goW) / 2, H * 0.4 - goH / 2, goW, goH);
        ctx.globalCompositeOperation = 'source-over';

        ctx.restore();
    }

    _drawTutorial(ctx, camX) {
        const tut = this._tutorial;
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;
        const scale = Config.pixelScale;
        const bob = Math.sin(tut.timer * 2.5) * 5; // gentle floating

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (tut.phase === 0) {
            // --- Phase 0: Intro message + right arrow ---
            const baseAlpha = tut.alpha * 0.85;

            // Semi-transparent dark backdrop behind text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            const backdropY = H * 0.15;
            const backdropH = H * 0.38;
            ctx.globalAlpha = tut.alpha * 0.6;
            ctx.beginPath();
            const bx = W * 0.2, bw = W * 0.6;
            const br = 12;
            ctx.moveTo(bx + br, backdropY);
            ctx.lineTo(bx + bw - br, backdropY);
            ctx.quadraticCurveTo(bx + bw, backdropY, bx + bw, backdropY + br);
            ctx.lineTo(bx + bw, backdropY + backdropH - br);
            ctx.quadraticCurveTo(bx + bw, backdropY + backdropH, bx + bw - br, backdropY + backdropH);
            ctx.lineTo(bx + br, backdropY + backdropH);
            ctx.quadraticCurveTo(bx, backdropY + backdropH, bx, backdropY + backdropH - br);
            ctx.lineTo(bx, backdropY + br);
            ctx.quadraticCurveTo(bx, backdropY, bx + br, backdropY);
            ctx.fill();

            // Draw the 4 lines of text centered
            ctx.globalAlpha = baseAlpha;
            const textScale = scale * 0.8;
            const lineSpacing = 28;
            const lines = [tut.line1, tut.line2, tut.line3, tut.line4];
            const startY = H * 0.2 + bob;

            for (let i = 0; i < lines.length; i++) {
                const tex = lines[i];
                const tw = tex.width * textScale;
                const th = tex.height * textScale;
                ctx.drawImage(tex, (W - tw) / 2, startY + i * lineSpacing, tw, th);
            }

            // Up arrow with glow (floating, center of screen)
            const arrowPulse = 0.7 + Math.sin(tut.timer * 4) * 0.3;
            ctx.globalAlpha = baseAlpha * arrowPulse;
            const arrowX = W * 0.5;
            const arrowY = H * 0.58 + bob;

            // Arrow glow
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffffff';

            // Arrow triangle pointing up
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY - 20);
            ctx.lineTo(arrowX - 18, arrowY + 10);
            ctx.lineTo(arrowX + 18, arrowY + 10);
            ctx.closePath();
            ctx.fill();

            // Arrow stem (vertical)
            ctx.fillRect(arrowX - 6, arrowY + 8, 12, 20);

            ctx.shadowBlur = 0;

            // "TOCA PARA SALTAR" text below arrow
            ctx.globalAlpha = baseAlpha * 0.9;
            const walkScale = scale * 0.6;
            const walkW = tut.walkText.width * walkScale;
            const walkH = tut.walkText.height * walkScale;
            ctx.drawImage(tut.walkText, (W - walkW) / 2, arrowY + 40, walkW, walkH);

        } else if (tut.phase === 1) {
            // --- Phase 1: Jump hint above first obstacle ---
            const obstScreenX = tut.firstObstacleX - camX;

            // Only draw if obstacle is on screen
            if (obstScreenX > -50 && obstScreenX < W + 50) {
                const baseAlpha = tut.alpha * 0.9;
                const arrowPulse = 0.7 + Math.sin(tut.timer * 4) * 0.3;

                // Up arrow above obstacle with glow
                const arrowX = obstScreenX;
                const arrowY = H * 0.42 + bob;

                ctx.globalAlpha = baseAlpha * arrowPulse;
                ctx.shadowColor = '#ffdd44';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#ffdd44';

                // Arrow triangle pointing up
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY - 20);
                ctx.lineTo(arrowX - 18, arrowY + 10);
                ctx.lineTo(arrowX + 18, arrowY + 10);
                ctx.closePath();
                ctx.fill();

                // Arrow stem
                ctx.fillRect(arrowX - 6, arrowY + 8, 12, 20);

                ctx.shadowBlur = 0;

                // "SALTA EL OBSTACULO!" text above arrow
                ctx.globalAlpha = baseAlpha;
                const jumpScale = scale * 0.7;
                const jumpW = tut.jumpText.width * jumpScale;
                const jumpH = tut.jumpText.height * jumpScale;
                ctx.drawImage(tut.jumpText, arrowX - jumpW / 2, arrowY - 45, jumpW, jumpH);
            }
        }

        ctx.restore();
    }

    _drawHugHearts(ctx, cameraX) {
        const scale = Config.pixelScale;
        const tex = TC.heartFullTex;
        const baseW = tex.width;
        const baseH = tex.height;

        ctx.imageSmoothingEnabled = false;
        for (const h of this._hugHearts) {
            const screenX = h.x - cameraX;
            if (screenX < -50 || screenX > Config.sceneWidth + 50) continue;

            const w = baseW * scale * h.scale;
            const hh = baseH * scale * h.scale;

            ctx.save();
            ctx.globalAlpha = Math.max(0, h.alpha);
            ctx.drawImage(tex, screenX - w / 2, h.y - hh / 2, w, hh);
            ctx.restore();
        }
    }

    _drawPause(ctx) {
        const W = Config.sceneWidth;
        const H = Config.sceneHeight;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, W, H);

        // "PAUSA" text
        const pauseText = TC.renderText('PAUSA');
        const pauseScale = Config.pixelScale * 2;
        const pauseW = pauseText.width * pauseScale;
        const pauseH = pauseText.height * pauseScale;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pauseText, (W - pauseW) / 2, H * 0.35 - pauseH / 2, pauseW, pauseH);

        // "SALIR? S/N" text
        const exitText = TC.renderText('SALIR? S/N');
        const exitScale = Config.pixelScale * 1.2;
        const exitW = exitText.width * exitScale;
        const exitH = exitText.height * exitScale;

        ctx.drawImage(exitText, (W - exitW) / 2, H * 0.5 - exitH / 2, exitW, exitH);
    }

    /**
     * Draw animated dogs emerging from tree canopy at every 100m marker.
     * Dog appears in the upper-right quadrant of the tree canopy, holding a sign.
     */
    _drawDogMarkers(ctx, cameraX) {
        const scale = Config.pixelScale;
        const sidewalkH = 16 * scale;
        const H = Config.sceneHeight;

        // Get rabbit-in-canopy texture based on animation frame
        const rabbitTex = this.dogFrame === 0 ? TC.dogCanopy1Tex : TC.dogCanopy2Tex;

        ctx.imageSmoothingEnabled = false;

        for (const marker of this.dogMarkers) {
            // Only draw if visible on screen
            const screenX = marker.x - cameraX;
            if (screenX < -200 || screenX > Config.sceneWidth + 200) continue;

            // Tree dimensions (100 rows × 40 cols × scale 3)
            const treeH = 100 * scale; // 300px
            const treeW = 40 * scale;  // 120px
            const canopyH = 42 * scale; // 126px (rows 0-41)

            // Tree top position on screen
            const treeScreenTop = H - sidewalkH - treeH;
            const treeScreenLeft = screenX - treeW / 2;

            // Rabbit position: centered in canopy (half of previous 4.5)
            const rabbitScaleFactor = 2.25;
            const rabbitScale = scale * rabbitScaleFactor;
            const rabbitW = rabbitTex.width * rabbitScale;
            const rabbitH = rabbitTex.height * rabbitScale;

            // Center horizontally in canopy, near top
            const rabbitScreenX = treeScreenLeft + treeW * 0.5 - rabbitW * 0.5;
            const rabbitScreenY = treeScreenTop + canopyH * 0.02;

            ctx.drawImage(rabbitTex, rabbitScreenX, rabbitScreenY, rabbitW, rabbitH);

            // Draw meters text on the sign area (ABOVE the rabbit)
            const metersText = TC.renderTextBlack(marker.meters + 'M');
            const textScale = scale * 1.05;
            const textW = metersText.width * textScale;
            const textH = metersText.height * textScale;
            // Sign is the top 6 rows of 20 (30% height), centered horizontally
            const signCenterX = rabbitScreenX + rabbitW * 0.5;
            const signCenterY = rabbitScreenY + rabbitH * 0.15;
            const textX = signCenterX - textW / 2;
            const textY = signCenterY - textH / 2;

            ctx.drawImage(metersText, textX, textY, textW, textH);
        }
    }

    /**
     * Draw a dark shadow overlay on an entity if it's under a tree or umbrella canopy.
     * Entity must have .x (world coords) and either .getCurrentTexture() or sprite dimensions.
     */

    _drawWelcomeSigns(ctx, cameraX) {
        if (this.welcomeSigns.length === 0) return;

        const scale = Config.pixelScale;
        const sidewalkH = 16 * scale;

        ctx.imageSmoothingEnabled = false;

        for (const sign of this.welcomeSigns) {
            const screenX = sign.x - cameraX;
            if (screenX < -300 || screenX > Config.sceneWidth + 300) continue;

            // Draw sign board (60x32: top 16 rows = board, bottom 16 rows = posts)
            const signScale = scale * 1.5;
            const signW = TC.welcomeSign.width * signScale;
            const signH = TC.welcomeSign.height * signScale;
            const postSink = 6; // sink post bases into sidewalk
            const signScreenX = screenX - signW / 2;
            const signScreenY = Config.sceneHeight - sidewalkH - signH + postSink;

            // Night spotlight glow above sign
            if (this.timeOfDay === 'night') {
                const glowX = signScreenX + signW / 2;
                const glowY = signScreenY - 5;
                const glowR = 90;
                ctx.save();
                const glow = ctx.createRadialGradient(glowX, glowY, 5, glowX, glowY + 20, glowR);
                glow.addColorStop(0, 'rgba(255, 240, 200, 0.30)');
                glow.addColorStop(0.4, 'rgba(255, 220, 160, 0.12)');
                glow.addColorStop(1, 'rgba(255, 200, 120, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(glowX, glowY + 20, glowR, 0, Math.PI * 2);
                ctx.fill();
                // Light source indicator (small bright spot)
                ctx.fillStyle = 'rgba(255, 250, 220, 0.6)';
                ctx.beginPath();
                ctx.arc(glowX, glowY, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.drawImage(TC.welcomeSign, signScreenX, signScreenY, signW, signH);

            // Green board area is top 16 rows of 32 total (50%)
            const boardH = signH * (16 / 32);
            const textScale = scale * 0.6;

            // Line 1: centered in upper third of board (bold)
            const line1W = sign.line1Tex.width * textScale;
            const line1H = sign.line1Tex.height * textScale;
            const line1X = signScreenX + signW / 2 - line1W / 2;
            const line1Y = signScreenY + boardH * 0.15;

            ctx.drawImage(sign.line1Tex, line1X, line1Y, line1W, line1H);

            // Line 2: centered in lower third of board (bold)
            const line2W = sign.line2Tex.width * textScale;
            const line2H = sign.line2Tex.height * textScale;
            const line2X = signScreenX + signW / 2 - line2W / 2;
            const line2Y = signScreenY + boardH * 0.52;

            ctx.drawImage(sign.line2Tex, line2X, line2Y, line2W, line2H);
        }
    }

    /**
     * Draw decorative light poles (with glow at night)
     */
    _drawLightPoles(ctx, cameraX) {
        if (!TC.lightPoleTex) return;

        const scale = Config.pixelScale;
        const sidewalkH = 16 * scale;
        const H = Config.sceneHeight;
        const isNight = this.timeOfDay === 'night';
        const poleTex = isNight ? TC.lightPoleNightTex : TC.lightPoleTex;

        ctx.imageSmoothingEnabled = false;

        for (const pole of this.lightPoles) {
            const screenX = pole.x - cameraX;
            if (screenX < -100 || screenX > Config.sceneWidth + 100) continue;

            const poleW = poleTex.width * scale;
            const poleH = poleTex.height * scale;
            const poleScreenX = screenX - poleW / 2;
            const poleScreenY = H - sidewalkH - poleH;

            // Night glow effect around lantern
            if (isNight) {
                const lanternX = poleScreenX + poleW / 2;
                const lanternY = poleScreenY + 6; // Near top of pole (lantern area)
                const glowRadius = 80;

                ctx.save();
                const glow = ctx.createRadialGradient(
                    lanternX, lanternY, 4,
                    lanternX, lanternY, glowRadius
                );
                glow.addColorStop(0, 'rgba(255, 240, 180, 0.35)');
                glow.addColorStop(0.3, 'rgba(255, 220, 140, 0.15)');
                glow.addColorStop(1, 'rgba(255, 200, 100, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(lanternX, lanternY, glowRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.drawImage(poleTex, poleScreenX, poleScreenY, poleW, poleH);
        }
    }

    _drawBonfires(ctx, cameraX) {
        if (this.bonfires.length === 0) return;
        const scale = Config.pixelScale;
        const sidewalkH = 16 * scale;

        for (const bf of this.bonfires) {
            const tex = TC.bonfireFrames[bf.frame];
            const w = tex.width * scale;
            const h = tex.height * scale;
            const screenX = bf.x - cameraX - w / 2;
            const screenY = Config.sceneHeight - sidewalkH - h;

            // Only draw if on screen
            if (screenX > -w && screenX < Config.sceneWidth + w) {
                // Draw warm glow circle behind bonfire
                ctx.save();
                const glowCX = screenX + w / 2;
                const glowCY = screenY + h * 0.4;
                const glowR = 100;
                const glow = ctx.createRadialGradient(glowCX, glowCY, 10, glowCX, glowCY, glowR);
                glow.addColorStop(0, 'rgba(255,160,40,0.2)');
                glow.addColorStop(0.5, 'rgba(255,100,20,0.08)');
                glow.addColorStop(1, 'rgba(255,60,10,0)');
                ctx.fillStyle = glow;
                ctx.fillRect(glowCX - glowR, glowCY - glowR, glowR * 2, glowR * 2);
                ctx.restore();

                // Draw bonfire sprite
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(tex, screenX, screenY, w, h);

                // Draw sparks
                for (const sp of bf.sparks) {
                    ctx.save();
                    ctx.globalAlpha = sp.alpha;
                    ctx.fillStyle = Math.random() > 0.5 ? '#FFD700' : '#FF6600';
                    const spX = sp.x - cameraX;
                    const spY = screenY + sp.y;
                    ctx.fillRect(spX, spY, 2, 2);
                    ctx.restore();
                }
            }
        }
    }

    _drawHippies(ctx, cameraX) {
        if (this.hippies.length === 0) return;
        const scale = Config.pixelScale;
        const sidewalkH = 16 * scale;

        for (const hp of this.hippies) {
            const tex = TC.hippieFrames[hp.frame];
            const w = tex.width * scale;
            const h = tex.height * scale;
            const screenX = hp.x - cameraX - w / 2;
            const screenY = Config.sceneHeight - sidewalkH - h;

            if (screenX > -w && screenX < Config.sceneWidth + w) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(tex, screenX, screenY, w, h);
            }
        }
    }

    _triggerLevelComplete() {
        if (this.isLevelComplete) return;
        this.isLevelComplete = true;
        this._familyHugStarted = false;
        this._levelCompletePhase = 'landing'; // 'landing' → 'walking' → 'hugging'

        // Track total meters across levels
        this.game.state.totalMeters += this.metersWalked;

        // Stop auto-shoot (no new bullets)
        this.autoShootActive = false;

        // Stop gaucho power
        if (this.player.gauchoPowerActive) {
            this.player.gauchoPowerActive = false;
            this.player.gauchoPowerPhase = 'none';
            this.player.gauchoPowerColorTimer = 0;
            this.player.gauchoPowerHue = 0;
            this.player.levelSpeedMultiplier = this.player.baseSpeedMultiplier;
            this.game.music.setSpeedMultiplier(1.0);
            this._gauchoPowerWasActive = false;
            this._gauchoPowerTextTimer = 0;
        }

        // Start beagle running to parents
        if (this.beagle) {
            this.beagle.startLevelComplete(this.parents.x + 40);
        }

        // Clear invincibility / blinking
        this.player.isInvincible = false;
        this.player.invTimer = 0;
        this.player.blinkTimer = 0;
        this.player.alpha = 1.0;

        // If player is in a trip/pothole/drinking state, force back to walking
        if (this.player.state === 'tripping' || this.player.state === 'lying' ||
            this.player.state === 'gettingUp' || this.player.state === 'fallingInHole' ||
            this.player.state === 'drinkingMate') {
            this.player.state = 'walking';
            this.player.visible = true;
            this.player.vx = 0;
            this.player.tripTimer = 0;
            this.player.tripPhase = '';
            this.player.fallMomentum = 0;
            this.player.potholeTimer = 0;
            this.player.potholeObstacle = null;
        }

        // Parents open arms (frame 2)
        this.parents.startHug();
        // Play victory music
        this.game.music.playTrack('victory');
    }

    _triggerGameOver() {
        this.isGameOver = true;
        this.endTimer = 0;
        this.goBlinkTimer = 0;
        this.goBlinkAlpha = 1.0;
        this.player.vx = 0;
        // Play game over music
        this.game.music.playTrack('gameover');
    }

    _fireProjectile() {
        // Determine projectile type based on character
        const charType = this.game.state.selectedCharacter || 'emi';
        const projType = charType === 'jo' ? 'hockey' : 'soccer';

        // Create projectile at player position
        const proj = new Projectile(
            this.player.x + 30, // Slightly ahead of player
            this.player.y + 20, // At chest height
            projType
        );
        this.projectiles.push(proj);

        // Play sound
        if (projType === 'soccer') {
            this.game.music.playKickSound();
        } else {
            this.game.music.playShootSound();
        }
    }

    onClick(x, y) {
        // Check music button
        if (this._musicBounds && this._hitTest(x, y, this._musicBounds)) {
            this.game.toggleMusic();
            return;
        }
        // Tap to jump (auto-runner mode)
        if (!this.isLevelComplete && !this.isGameOver && !this.isPaused) {
            this.player.requestJump();
        }
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }
}
