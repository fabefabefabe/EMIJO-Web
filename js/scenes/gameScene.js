// Game Scene - main gameplay with parallax, player, obstacles, birds, flag, HUD
import { Config, getTimeOfDay } from '../config.js';
import * as TC from '../textureCache.js';
import { Player } from '../entities/player.js';
import { Obstacle } from '../entities/obstacle.js';
import { Bird } from '../entities/bird.js';
import { Flag } from '../entities/flag.js';
import { Camera } from '../systems/camera.js';
import { ParallaxSystem } from '../systems/parallax.js';
import { generateObstacles } from '../systems/obstacleSpawner.js';
import { aabbOverlap } from '../systems/collision.js';
import { Skater } from '../entities/skater.js';
import { HeartPickup } from '../entities/heartPickup.js';
import { Projectile } from '../entities/projectile.js';
import { AmmoPickup } from '../entities/ammoPickup.js';
import { Parents } from '../entities/parents.js';
import { HallOfFame } from '../systems/hallOfFame.js';

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

        // Create player (pass level for speed multiplier)
        this.player = new Player(charType, this.currentLevel);

        // Create camera
        this.camera = new Camera();

        // Create parallax (pass level for sunset mode)
        this.parallax = new ParallaxSystem(this.currentLevel);

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
        const obstacleData = generateObstacles(levelSpawnWidth, groundSurface, exclusionZones);
        this.obstacles = obstacleData.map(o =>
            new Obstacle(o.type, o.x, o.groundSurface)
        );

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

        // Anti-idle skater
        this.idleTimer = 0;
        this.lastPlayerX = this.player.x;
        this.skater = null;

        // Game over text blink
        this.goBlinkTimer = 0;
        this.goBlinkAlpha = 1.0;

        // Track jump for sound effect
        this.wasJumping = false;

        // Heart pickups - spawn at fixed positions every 150m
        this.heartPickups = [];
        this._spawnFixedHearts();

        // Projectiles (superpowers)
        this.projectiles = [];
        this.canShoot = true; // Cooldown for shooting

        // Ammo system - persists across levels
        if (this.game.state.ammo === undefined) {
            this.game.state.ammo = Config.initialAmmo;
        }
        this.ammo = this.game.state.ammo;

        // Ammo pickups
        this.ammoPickups = [];
        this._spawnFixedAmmo();

        // Dogs at 100m markers
        this.dogMarkers = this._generateDogMarkers();
        this.dogAnimTimer = 0;
        this.dogFrame = 0; // 0=left, 1=right

        // Welcome signs at specific levels - 2 lines, near start
        this.welcomeSigns = [];
        const signX = 20 / Config.metersPerPixel; // 20m from start
        if (this.currentLevel === 1) {
            this.welcomeSigns.push({
                x: signX,
                line1Tex: TC.renderText('BIENVENIDOS A'),
                line2Tex: TC.renderText('MONTEVIDEO'),
            });
        } else if (this.currentLevel === 6) {
            this.welcomeSigns.push({
                x: signX,
                line1Tex: TC.renderText('BIENVENIDOS A'),
                line2Tex: TC.renderText('CIUDAD DE LA COSTA'),
            });
        } else if (this.currentLevel === 12) {
            this.welcomeSigns.push({
                x: signX,
                line1Tex: TC.renderText('BIENVENIDOS A LA'),
                line2Tex: TC.renderText('REPUBLICA DEL PINAR'),
            });
        } else if (this.currentLevel === 18) {
            this.welcomeSigns.push({
                x: signX,
                line1Tex: TC.renderText('BIENVENIDOS A'),
                line2Tex: TC.renderText('JAUREGUIBERRY'),
            });
        }

        // Time of day: 'day', 'sunset', or 'night'
        this.timeOfDay = getTimeOfDay(this.currentLevel);

        // Light poles (decorative, every ~600px)
        this.lightPoles = [];
        for (let x = 300; x < flagX; x += 600) {
            this.lightPoles.push({ x });
        }

        // Parents next to the flag
        this.parents = new Parents(flagX + 80, groundSurface);
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
                this.game.state.ammo = undefined;
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
            if (!this._familyHugStarted) {
                // Phase 1: Player auto-walks toward parents center
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
                    // Phase 2: Arrived — family hug, player disappears into group sprite
                    this._familyHugStarted = true;
                    this._hugTimer = 0;
                    this.player.visible = false;
                    this.player.vx = 0;
                    this.parents.startFamilyHug();
                }
            } else {
                // Phase 3: Hold family hug for 2.5 seconds then transition
                this._hugTimer += dt;
                if (this._hugTimer >= 2.5) {
                    this.game.setScene('levelComplete');
                }
            }
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
                    this.game.state.ammo = undefined;
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

        // Superpower: ENTER key shoots projectile
        if (input.consumeKey('Enter') && this.canShoot) {
            this._fireProjectile();
        }

        // Dog animation (tail wag / head tilt)
        this.dogAnimTimer += dt;
        if (this.dogAnimTimer >= 0.8) { // Faster animation cycle
            this.dogAnimTimer -= 0.8;
            this.dogFrame = 1 - this.dogFrame; // Toggle 0/1
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

        // Collision: projectiles vs obstacles
        for (const proj of this.projectiles) {
            for (const obstacle of this.obstacles) {
                if (!obstacle.destroyed && aabbOverlap(proj.getAABB(), obstacle.getAABB())) {
                    // Destroy obstacle and projectile
                    obstacle.destroyed = true;
                    proj.destroy();
                    this.game.music.playDestroySound();
                    break;
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

        // Collision: player vs ammo pickups
        const playerAABBForAmmo = this.player.getAABB();
        for (const ammo of this.ammoPickups) {
            if (aabbOverlap(playerAABBForAmmo, ammo.getAABB())) {
                if (this.ammo < Config.maxAmmo) {
                    if (ammo.collect()) {
                        this.ammo = Math.min(Config.maxAmmo, this.ammo + 1);
                        this.game.state.ammo = this.ammo; // Persist
                        this.game.music.playPickupSound();
                    }
                }
            }
        }

        // Actualizar metros recorridos
        this.metersWalked = Math.floor(this.player.x * Config.metersPerPixel);

        // Cull objects that are far behind the camera (save memory)
        const cullX = this.camera.offset - 200;
        this.obstacles = this.obstacles.filter(o => o.x > cullX);
        this.heartPickups = this.heartPickups.filter(h => h.alive && h.x > cullX);
        this.ammoPickups = this.ammoPickups.filter(a => a.alive && a.x > cullX);
        this.dogMarkers = this.dogMarkers.filter(d => d.x > cullX);
        this.lightPoles = this.lightPoles.filter(p => p.x > cullX);

        // Anti-idle skater detection
        if (Math.abs(this.player.x - this.lastPlayerX) < 1) {
            this.idleTimer += dt;
            if (this.idleTimer >= Config.idleTimeForSkater && !this.skater) {
                this._spawnSkater();
                this.idleTimer = 0;
            }
        } else {
            this.idleTimer = 0;
        }
        this.lastPlayerX = this.player.x;

        // Update skater
        if (this.skater) {
            this.skater.update(dt);
            const playerAABB = this.player.getAABB();
            if (aabbOverlap(playerAABB, this.skater.getAABB())) {
                if (this.player.tripAndFall()) {
                    this.game.music.playHitSound();
                }
            }
            if (!this.skater.alive) {
                this.skater = null;
            }
        }

        // Collision: player vs obstacles
        const playerAABB = this.player.getAABB();
        for (const obstacle of this.obstacles) {
            if (aabbOverlap(playerAABB, obstacle.getAABB())) {
                if (this.player.tripAndFall()) {
                    this.game.music.playHitSound();
                }
                break; // Only one hit per frame
            }
        }

        // Los pájaros son decorativos, no quitan vidas

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

        // Draw dogs at every 100m marker
        this._drawDogMarkers(ctx, camX);

        // Draw welcome signs (behind obstacles, after dogs)
        this._drawWelcomeSigns(ctx, camX);

        // Draw obstacles
        for (const obstacle of this.obstacles) {
            obstacle.draw(ctx, camX);
        }

        // Draw flag
        this.flag.draw(ctx, camX);

        // Draw parents next to flag
        this.parents.draw(ctx, camX);

        // Draw player
        this.player.draw(ctx, camX);

        // Draw birds
        for (const bird of this.birds) {
            bird.draw(ctx, camX);
        }

        // Draw heart pickups
        for (const heart of this.heartPickups) {
            heart.draw(ctx, camX);
        }

        // Draw ammo pickups
        for (const ammo of this.ammoPickups) {
            ammo.draw(ctx, camX);
        }

        // Draw skater
        if (this.skater) {
            this.skater.draw(ctx, camX);
        }

        // Draw projectiles
        for (const proj of this.projectiles) {
            proj.draw(ctx, camX);
        }

        // Draw HUD
        this._drawHUD(ctx);

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

        // Draw ammo counter (below music icon, top-right)
        const charType = this.game.state.selectedCharacter || 'emi';
        const ammoFrames = charType === 'jo' ? TC.hockeyStickFrames : TC.soccerBallFrames;
        const ammoIcon = ammoFrames[0];
        const ammoIconScale = scale * 0.8;
        const ammoIconW = ammoIcon.width * ammoIconScale;
        const ammoIconH = ammoIcon.height * ammoIconScale;
        const ammoIconX = W - margin - ammoIconW - 5;
        const ammoIconY = iconY + iconH + 10;

        // Draw ammo icons (up to 3 mini icons, then just show number)
        const maxDisplayIcons = 3;
        const displayCount = Math.min(this.ammo, maxDisplayIcons);
        for (let i = 0; i < displayCount; i++) {
            ctx.drawImage(ammoIcon, ammoIconX - i * (ammoIconW * 0.6), ammoIconY, ammoIconW, ammoIconH);
        }

        // Draw ammo count number
        const ammoText = TC.renderText('X' + this.ammo);
        const ammoTextScale = scale * 0.5;
        const ammoTextW = ammoText.width * ammoTextScale;
        const ammoTextH = ammoText.height * ammoTextScale;
        const ammoTextX = ammoIconX - maxDisplayIcons * (ammoIconW * 0.6) - ammoTextW - 5;
        const ammoTextY = ammoIconY + (ammoIconH - ammoTextH) / 2;

        ctx.drawImage(ammoText, ammoTextX, ammoTextY, ammoTextW, ammoTextH);
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
     * Draw animated sitting dogs at every 100m marker
     * Dog sits on sidewalk next to sign post, smaller scale
     */
    _drawDogMarkers(ctx, cameraX) {
        const scale = Config.pixelScale;
        const dogScaleFactor = 1.0; // Smaller dog (was 2.0)
        const dogScale = scale * dogScaleFactor;
        const sidewalkH = 16 * scale;
        const H = Config.sceneHeight;

        // Get dog texture based on animation frame
        const dogTex = this.dogFrame === 0 ? TC.dogSitting1Tex : TC.dogSitting2Tex;
        const signTex = TC.signPostTex;

        ctx.imageSmoothingEnabled = false;

        for (const marker of this.dogMarkers) {
            // Only draw if visible on screen
            const screenX = marker.x - cameraX;
            if (screenX < -100 || screenX > Config.sceneWidth + 100) continue;

            // Sign on sidewalk - base touches sidewalk surface
            const signW = signTex.width * dogScale;
            const signH = signTex.height * dogScale;
            const signScreenX = screenX - signW / 2;
            const signScreenY = H - sidewalkH - signH;

            ctx.drawImage(signTex, signScreenX, signScreenY, signW, signH);

            // Dog sitting next to sign, on sidewalk
            const dogW = dogTex.width * dogScale;
            const dogH = dogTex.height * dogScale;
            const dogScreenX = signScreenX - dogW - 2; // To the left of sign
            const dogScreenY = H - sidewalkH - dogH;

            ctx.drawImage(dogTex, dogScreenX, dogScreenY, dogW, dogH);

            // Draw meters text on sign (black on white sign area)
            const metersText = TC.renderTextBlack(marker.meters + 'M');
            const textScale = scale * 0.4;
            const textW = metersText.width * textScale;
            const textH = metersText.height * textScale;
            const textX = signScreenX + signW / 2 - textW / 2;
            const textY = signScreenY + 6; // Inside the white part of sign

            ctx.drawImage(metersText, textX, textY, textW, textH);
        }
    }

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

            ctx.drawImage(TC.welcomeSign, signScreenX, signScreenY, signW, signH);

            // Green board area is top 16 rows of 32 total (50%)
            const boardH = signH * (16 / 32);
            const textScale = scale * 0.45;

            // Line 1: centered in upper third of board
            const line1W = sign.line1Tex.width * textScale;
            const line1H = sign.line1Tex.height * textScale;
            const line1X = signScreenX + signW / 2 - line1W / 2;
            const line1Y = signScreenY + boardH * 0.2;

            ctx.drawImage(sign.line1Tex, line1X, line1Y, line1W, line1H);

            // Line 2: centered in lower third of board
            const line2W = sign.line2Tex.width * textScale;
            const line2H = sign.line2Tex.height * textScale;
            const line2X = signScreenX + signW / 2 - line2W / 2;
            const line2Y = signScreenY + boardH * 0.55;

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

    _triggerLevelComplete() {
        if (this.isLevelComplete) return;
        this.isLevelComplete = true;
        this._familyHugStarted = false;
        // Track total meters across levels
        this.game.state.totalMeters += this.metersWalked;
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

    _spawnSkater() {
        // Skater comes from behind the player
        const startX = this.player.x - Config.sceneWidth;
        this.skater = new Skater(startX, 1);
    }

    _fireProjectile() {
        // Check if we have ammo
        if (this.ammo <= 0) return;

        // Consume ammo
        this.ammo--;
        this.game.state.ammo = this.ammo; // Persist

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

        // Cooldown
        this.canShoot = false;
        setTimeout(() => {
            this.canShoot = true;
        }, 500); // 0.5 second cooldown
    }

    onClick(x, y) {
        // Check music button
        if (this._musicBounds && this._hitTest(x, y, this._musicBounds)) {
            this.game.toggleMusic();
            return;
        }
    }

    _hitTest(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.w &&
               y >= bounds.y && y <= bounds.y + bounds.h;
    }
}
