// Game Scene - main gameplay with parallax, player, obstacles, birds, flag, HUD
import { Config } from '../config.js';
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

export class GameScene {
    constructor(game) {
        this.game = game;
    }

    enter() {
        const charType = this.game.state.selectedCharacter || 'emi';

        // Create player
        this.player = new Player(charType);

        // Create camera
        this.camera = new Camera();

        // Create parallax
        this.parallax = new ParallaxSystem();

        // Generate obstacles
        const groundSurface = Config.groundSurface;
        const obstacleData = generateObstacles(Config.levelWidth, groundSurface);
        this.obstacles = obstacleData.map(o =>
            new Obstacle(o.type, o.x, o.groundSurface)
        );

        // Create flag
        this.flag = new Flag(Config.levelWidth - Config.endBuffer, groundSurface);

        // Birds
        this.birds = [];
        this.birdSpawnTimer = 0;

        // Game state
        this.isLevelComplete = false;
        this.isGameOver = false;
        this.endTimer = 0;

        // Timer countdown
        this.timeRemaining = Config.levelTimeLimit;

        // Anti-idle skater
        this.idleTimer = 0;
        this.lastPlayerX = this.player.x;
        this.skater = null;

        // Game over text blink
        this.goBlinkTimer = 0;
        this.goBlinkAlpha = 1.0;

        // Track jump for sound effect
        this.wasJumping = false;

        // Heart pickups
        this.heartPickups = [];
        this.heartSpawnTimer = 0;
    }

    update(dt) {
        const input = this.game.input;

        // Handle end states
        if (this.isLevelComplete) {
            this.endTimer += dt;
            if (this.endTimer >= 1.5) {
                // Victory scene will handle its own music/no music
                this.game.setScene('levelComplete');
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
                // Return to menu music
                this.game.music.playTrack('menu');
                this.game.setScene('menu');
            }
            return;
        }

        // Toggle music with M key
        if (input.consumeKey('KeyM')) {
            this.game.toggleMusic();
        }

        // Track previous state for jump sound
        const wasOnGround = this.player.isOnGround;

        // Update player
        this.player.update(dt, input);

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
            this.birds.push(Bird.spawnRandom(this.camera.offset));
        }

        // Update birds
        for (const bird of this.birds) {
            bird.update(dt);
        }
        this.birds = this.birds.filter(b => b.alive);

        // Spawn heart pickups (rare, every heartSpawnInterval with chance)
        this.heartSpawnTimer += dt;
        if (this.heartSpawnTimer >= Config.heartSpawnInterval) {
            this.heartSpawnTimer -= Config.heartSpawnInterval;
            if (Math.random() < Config.heartSpawnChance) {
                this.heartPickups.push(HeartPickup.spawnAhead(this.player.x, this.camera.offset));
            }
        }

        // Update heart pickups
        for (const heart of this.heartPickups) {
            heart.update(dt);
        }
        // Remove collected or off-screen hearts
        this.heartPickups = this.heartPickups.filter(h => h.alive && h.isOnScreen(this.camera.offset));

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

        // Timer countdown
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this._triggerGameOver();
            return;
        }

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

        // Collision: player vs birds
        for (const bird of this.birds) {
            if (aabbOverlap(playerAABB, bird.getAABB())) {
                if (this.player.tripAndFall()) {
                    this.game.music.playHitSound();
                }
                break;
            }
        }

        // Collision: player vs flag
        if (aabbOverlap(playerAABB, this.flag.getAABB())) {
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

        // Clear with dark background
        ctx.fillStyle = '#1a1a33';
        ctx.fillRect(0, 0, W, H);

        // Draw parallax backgrounds
        this.parallax.draw(ctx, camX);

        // Draw obstacles
        for (const obstacle of this.obstacles) {
            obstacle.draw(ctx, camX);
        }

        // Draw flag
        this.flag.draw(ctx, camX);

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

        // Draw skater
        if (this.skater) {
            this.skater.draw(ctx, camX);
        }

        // Draw HUD
        this._drawHUD(ctx);

        // Draw Game Over text
        if (this.isGameOver) {
            this._drawGameOver(ctx);
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

        // Draw timer below hearts
        const seconds = Math.ceil(this.timeRemaining);
        const timerText = TC.renderText(String(seconds).padStart(2, '0'));
        const timerScale = scale * 0.8;
        const timerW = timerText.width * timerScale;
        const timerH = timerText.height * timerScale;
        const timerY = margin + heartH + 8;

        // Red tint if low time
        if (seconds <= 10) {
            ctx.save();
            ctx.drawImage(timerText, margin, timerY, timerW, timerH);
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
            ctx.fillRect(margin, timerY, timerW, timerH);
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        } else {
            ctx.drawImage(timerText, margin, timerY, timerW, timerH);
        }

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

    _triggerLevelComplete() {
        if (this.isLevelComplete) return;
        this.isLevelComplete = true;
        this.endTimer = 0;
        this.player.vx = 0;
        this.player.vy = 0;
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
