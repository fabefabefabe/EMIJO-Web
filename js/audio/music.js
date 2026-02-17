// 8-bit Music System - Chiptune music inspired by classic platformers
// Theory: C Major key, I-IV-V-vi progression, syncopated rhythms
// BPM 150 for energetic platformer feel

export class MusicSystem {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.currentTrack = null; // 'menu', 'game', 'gameover', 'victory'

        this.bpm = 150;
        this.beatDuration = 60 / this.bpm;
        this.currentBeat = 0;
        this.schedulerTimer = null;
        this.scheduleAheadTime = 0.1;
        this.nextNoteTime = 0;

        // Track oscillators for cleanup
        this.activeOscillators = [];

        // === MUSICAL THEORY ===
        // C Major scale frequencies (C4 = 261.63 Hz)
        // Using pentatonic for catchier melodies (C, D, E, G, A)
        this.notes = {
            // Octave 3
            C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
            // Octave 4
            C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
            // Octave 5
            C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
            // Octave 6
            C6: 1046.50,
        };

        // Rest symbol
        this.R = 0;

        // Generate patterns
        this._generateMenuMusic();
        this._generateGameMusic();
        this._generateGameOverMusic();
        this._generateVictoryMusic();
    }

    // ==========================================
    // MENU MUSIC - Calm, anticipatory (16 bars loop)
    // Key: C Major, Tempo: slower feel
    // ==========================================
    _generateMenuMusic() {
        const n = this.notes, R = this.R;

        // Gentle arpeggio-based melody (32 beats = ~13 seconds loop)
        this.menuMelody = [
            // Bar 1-2: C Major arpeggio
            n.C4, R, n.E4, R, n.G4, R, n.E4, R,
            n.C4, R, n.E4, R, n.G4, R, n.C5, R,
            // Bar 3-4: Am arpeggio
            n.A3, R, n.C4, R, n.E4, R, n.C4, R,
            n.A3, R, n.C4, R, n.E4, R, n.A4, R,
            // Bar 5-6: F Major
            n.F3, R, n.A3, R, n.C4, R, n.A3, R,
            n.F3, R, n.A3, R, n.C4, R, n.F4, R,
            // Bar 7-8: G Major (dominant, creates tension)
            n.G3, R, n.B3, R, n.D4, R, n.B3, R,
            n.G3, R, n.B3, R, n.D4, R, n.G4, R,
        ];

        this.menuBass = [
            // Simple root notes, half notes
            n.C3, R, R, R, n.C3, R, R, R,
            n.C3, R, R, R, n.C3, R, R, R,
            n.A3, R, R, R, n.A3, R, R, R,
            n.A3, R, R, R, n.A3, R, R, R,
            n.F3, R, R, R, n.F3, R, R, R,
            n.F3, R, R, R, n.F3, R, R, R,
            n.G3, R, R, R, n.G3, R, R, R,
            n.G3, R, R, R, n.G3, R, R, R,
        ];
    }

    // ==========================================
    // GAME MUSIC - Energetic, Super Mario Bros style
    // Key: C Major, syncopated, catchy hook
    // 128 beats = ~51 seconds at 150 BPM
    // ==========================================
    _generateGameMusic() {
        const n = this.notes, R = this.R;

        // === MAIN THEME - Catchy, memorable hook ===
        // Structure: Intro(8) + A(16) + A(16) + B(16) + A(16) + Bridge(16) + A(16) + C(16) + Outro(8)

        this.gameMelody = [
            // INTRO (8 beats) - Attention grabber
            n.C5, n.C5, R, n.C5, R, n.G4, n.C5, R,

            // SECTION A - Main Hook (16 beats) - Super catchy, syncopated
            // "Da da-da DA da, da-da DA!"
            n.E5, n.E5, R, n.E5, R, n.C5, n.E5, R,
            n.G5, R, R, R, n.G4, R, R, R,

            // SECTION A repeat with variation
            n.E5, n.E5, R, n.E5, R, n.C5, n.E5, R,
            n.G5, R, n.A5, R, n.G5, R, R, R,

            // SECTION B - Contrast/Response (16 beats)
            n.C5, R, n.G4, R, n.E4, R, R, R,
            n.A4, n.B4, n.A4, R, n.G4, R, R, R,
            n.C5, R, n.G4, R, n.E4, R, R, R,
            n.A4, R, n.B4, R, n.C5, R, R, R,

            // SECTION A return - Hook again!
            n.E5, n.E5, R, n.E5, R, n.C5, n.E5, R,
            n.G5, R, R, R, n.G4, R, R, R,

            // BRIDGE (16 beats) - Build tension
            n.F5, R, n.F5, R, n.F5, R, n.E5, R,
            n.E5, R, n.D5, R, n.C5, R, R, R,
            n.D5, R, n.D5, R, n.D5, R, n.C5, R,
            n.C5, R, n.B4, R, n.A4, R, R, R,

            // SECTION A - Hook returns triumphantly
            n.E5, n.E5, R, n.E5, R, n.C5, n.E5, R,
            n.G5, R, R, R, n.G4, R, R, R,

            // SECTION C - Climax/Variation (16 beats)
            n.G5, n.F5, n.E5, n.D5, n.C5, R, n.E5, R,
            n.G5, R, n.A5, R, n.G5, R, R, R,
            n.E5, n.D5, n.C5, n.D5, n.E5, R, n.G5, R,
            n.C6, R, R, R, n.G5, R, R, R,

            // OUTRO (8 beats) - Loop back smoothly
            n.E5, R, n.D5, R, n.C5, R, n.G4, R,
        ];

        // Bass line - Driving rhythm, root-fifth pattern
        this.gameBass = [
            // INTRO
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,

            // SECTION A (I chord - C)
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,

            // SECTION A repeat
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,

            // SECTION B (vi-IV progression: Am, F)
            n.A3, R, n.E3, R, n.A3, R, n.E3, R,
            n.F3, R, n.C3, R, n.F3, R, n.C3, R,
            n.A3, R, n.E3, R, n.A3, R, n.E3, R,
            n.G3, R, n.D3, R, n.G3, R, n.D3, R,

            // SECTION A (back to I)
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,

            // BRIDGE (IV-V pattern: F, G)
            n.F3, R, n.C3, R, n.F3, R, n.C3, R,
            n.F3, R, n.C3, R, n.F3, R, n.C3, R,
            n.G3, R, n.D3, R, n.G3, R, n.D3, R,
            n.G3, R, n.D3, R, n.G3, R, n.D3, R,

            // SECTION A
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,

            // SECTION C (I-IV-V-I)
            n.C3, R, n.G3, R, n.F3, R, n.C3, R,
            n.G3, R, n.D3, R, n.G3, R, n.D3, R,
            n.C3, R, n.G3, R, n.F3, R, n.C3, R,
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,

            // OUTRO
            n.C3, R, n.G3, R, n.C3, R, n.G3, R,
        ];

        // Drums - Classic 8-bit pattern
        // 0=none, 1=kick, 2=snare, 3=hihat, 4=kick+hihat, 5=snare+hihat
        const kickSnare = [4, 3, 5, 3, 4, 3, 5, 3];
        const fill = [4, 4, 5, 5, 4, 5, 4, 5];

        this.gameDrums = [
            ...kickSnare, // intro
            ...kickSnare, ...kickSnare, // A
            ...kickSnare, ...kickSnare, // A
            ...kickSnare, ...kickSnare, // B
            ...kickSnare, ...kickSnare, // B
            ...kickSnare, ...kickSnare, // A
            ...kickSnare, ...kickSnare, // Bridge
            ...kickSnare, ...kickSnare, // Bridge
            ...kickSnare, ...kickSnare, // A
            ...kickSnare, ...fill,      // C
            ...kickSnare, ...kickSnare, // C
            ...kickSnare, // outro
        ];

        // Counter melody / Harmony (plays on off-beats for richness)
        this.gameHarmony = [
            // INTRO
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,

            // SECTION A
            n.G4, R, n.G4, R, n.G4, R, n.G4, R,
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,
            n.G4, R, n.G4, R, n.G4, R, n.G4, R,
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,

            // SECTION B
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,
            n.F4, R, n.F4, R, n.F4, R, n.F4, R,
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,
            n.D4, R, n.D4, R, n.D4, R, n.D4, R,

            // SECTION A
            n.G4, R, n.G4, R, n.G4, R, n.G4, R,
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,

            // BRIDGE
            n.A4, R, n.A4, R, n.A4, R, n.A4, R,
            n.A4, R, n.A4, R, n.A4, R, n.A4, R,
            n.B4, R, n.B4, R, n.B4, R, n.B4, R,
            n.B4, R, n.B4, R, n.B4, R, n.B4, R,

            // SECTION A
            n.G4, R, n.G4, R, n.G4, R, n.G4, R,
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,

            // SECTION C
            n.E4, R, n.E4, R, n.A4, R, n.E4, R,
            n.D4, R, n.D4, R, n.D4, R, n.D4, R,
            n.G4, R, n.G4, R, n.A4, R, n.E4, R,
            n.E4, R, n.E4, R, n.E4, R, n.E4, R,

            // OUTRO
            n.G4, R, n.F4, R, n.E4, R, n.D4, R,
        ];
    }

    // ==========================================
    // GAME OVER - Sad, descending (5 seconds)
    // Minor key feel, descending line
    // ==========================================
    _generateGameOverMusic() {
        const n = this.notes, R = this.R;

        // 12 beats at 150 BPM = ~5 seconds
        // Descending chromatic feel, ends on low note
        this.gameOverMelody = [
            n.E5, R, n.D5, R, n.C5, R,
            n.B4, R, n.A4, R, n.G4, R,
        ];

        this.gameOverBass = [
            n.A3, R, R, R, n.G3, R,
            n.F3, R, R, R, n.E3, R,
        ];
    }

    // ==========================================
    // VICTORY - Triumphant fanfare (5 seconds)
    // Major key, ascending, ends on high note
    // ==========================================
    _generateVictoryMusic() {
        const n = this.notes, R = this.R;

        // 12 beats at 150 BPM = ~5 seconds
        // Classic victory fanfare pattern
        this.victoryMelody = [
            n.C5, n.C5, n.C5, n.C5, n.G5, R,
            n.A5, R, n.G5, R, n.C6, R,
        ];

        this.victoryBass = [
            n.C3, R, n.G3, R, n.C3, R,
            n.F3, R, n.G3, R, n.C3, R,
        ];
    }

    // ==========================================
    // SOUND EFFECTS
    // ==========================================

    playJumpSound() {
        if (!this.audioCtx || this.isMuted) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        // Rising pitch sweep
        osc.frequency.setValueAtTime(200, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    playHitSound() {
        if (!this.audioCtx || this.isMuted) return;

        // Noise burst - more audible with higher frequencies
        const bufferSize = this.audioCtx.sampleRate * 0.12;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
        }

        const noise = this.audioCtx.createBufferSource();
        const noiseGain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = 2500;  // Higher frequency, more audible
        filter.Q.value = 1.5;

        noiseGain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start();
        noise.stop(this.audioCtx.currentTime + 0.12);

        // Impact thud - higher pitch for clarity
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.08);

        oscGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    playPickupSound() {
        if (!this.audioCtx || this.isMuted) return;

        // Happy ascending arpeggio - coin/heart pickup sound
        const notes = [this.notes.C5, this.notes.E5, this.notes.G5, this.notes.C6];
        const noteDuration = 0.06;

        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;

            const startTime = this.audioCtx.currentTime + i * noteDuration;
            gain.gain.setValueAtTime(0.12, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 1.5);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + noteDuration * 1.5);
        });
    }

    playKickSound() {
        if (!this.audioCtx || this.isMuted) return;

        // Soccer ball kick - punchy "thwack" sound
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.12);

        // Add a higher "whoosh" for the ball flying
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.15);

        gain2.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        osc2.start();
        osc2.stop(this.audioCtx.currentTime + 0.15);
    }

    playShootSound() {
        if (!this.audioCtx || this.isMuted) return;

        // Hockey stick slap shot - sharper attack
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);

        // Swoosh effect
        const noise = this.audioCtx.createOscillator();
        const noiseGain = this.audioCtx.createGain();

        noise.type = 'square';
        noise.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        noise.frequency.exponentialRampToValueAtTime(1500, this.audioCtx.currentTime + 0.1);

        noiseGain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start();
        noise.stop(this.audioCtx.currentTime + 0.12);
    }

    playDestroySound() {
        if (!this.audioCtx || this.isMuted) return;

        // Obstacle destroyed - satisfying "crash" sound
        const bufferSize = this.audioCtx.sampleRate * 0.15;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }

        const noise = this.audioCtx.createBufferSource();
        const noiseGain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 3000;

        noiseGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start();
        noise.stop(this.audioCtx.currentTime + 0.15);

        // Add a descending tone for impact
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.12);

        oscGain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    playGauchoPowerSound() {
        if (!this.audioCtx || this.isMuted) return;

        // Epic ascending fanfare — longer and more dramatic than normal pickup
        // C4-E4-G4-C5-E5-G5-C6
        const notes = [
            this.notes.C4, this.notes.E4, this.notes.G4,
            this.notes.C5, this.notes.E5, this.notes.G5, this.notes.C6
        ];
        const dur = 0.05;

        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.value = freq;

            const startTime = this.audioCtx.currentTime + i * dur;
            gain.gain.setValueAtTime(0.15, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur * 2);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + dur * 2);
        });
    }

    /**
     * Change music playback speed by adjusting beatDuration.
     * @param {number} mult - Speed multiplier (1.0 = normal, 1.5 = 50% faster)
     */
    setSpeedMultiplier(mult) {
        this.beatDuration = (60 / this.bpm) / mult;
    }

    playPotholeSound() {
        if (!this.audioCtx || this.isMuted) return;

        // Falling-into-hole sound: dramatic descending tone + echo effect
        const time = this.audioCtx.currentTime;

        // Main descending oscillator (sine wave, 400Hz → 60Hz over 0.4s)
        const osc = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.exponentialRampToValueAtTime(60, time + 0.4);

        oscGain.gain.setValueAtTime(0.3, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.5);

        // Harmonic overtone (triangle wave, follows main but higher)
        const osc2 = this.audioCtx.createOscillator();
        const osc2Gain = this.audioCtx.createGain();

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(600, time);
        osc2.frequency.exponentialRampToValueAtTime(80, time + 0.35);

        osc2Gain.gain.setValueAtTime(0.12, time);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        osc2.connect(osc2Gain);
        osc2Gain.connect(this.masterGain);

        osc2.start(time);
        osc2.stop(time + 0.4);

        // Short noise burst at start (impact of falling)
        const bufferSize = this.audioCtx.sampleRate * 0.08;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
        }

        const noise = this.audioCtx.createBufferSource();
        const noiseGain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        noiseGain.gain.setValueAtTime(0.2, time + 0.05);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(time + 0.05);
        noise.stop(time + 0.15);
    }

    // ==========================================
    // PLAYBACK CONTROL
    // ==========================================

    init() {
        if (this.audioCtx) return Promise.resolve();

        return new Promise((resolve) => {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : 0.35;
            this.masterGain.connect(this.audioCtx.destination);

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume().then(resolve);
            } else {
                resolve();
            }
        });
    }

    playTrack(trackName) {
        // Stop current music first
        this.stop();

        this.init().then(() => {
            this.currentTrack = trackName;
            this.isPlaying = true;
            this.currentBeat = 0;
            this.nextNoteTime = this.audioCtx.currentTime;

            if (trackName === 'gameover' || trackName === 'victory') {
                // One-shot tracks
                this._playOneShotTrack(trackName);
            } else {
                // Looping tracks
                this._scheduler();
            }
        });
    }

    _playOneShotTrack(trackName) {
        const melody = trackName === 'gameover' ? this.gameOverMelody : this.victoryMelody;
        const bass = trackName === 'gameover' ? this.gameOverBass : this.victoryBass;

        const beatDur = this.beatDuration / 2; // 8th notes

        for (let i = 0; i < melody.length; i++) {
            const time = this.audioCtx.currentTime + i * beatDur;

            if (melody[i] > 0) {
                this._playSquareWave(melody[i], time, 0.2, 0.15);
            }
            if (bass[i] > 0) {
                this._playTriangleWave(bass[i], time, 0.3, 0.12);
            }
        }

        // Mark as not playing after track ends
        const duration = melody.length * beatDur;
        setTimeout(() => {
            this.isPlaying = false;
            this.currentTrack = null;
        }, duration * 1000);
    }

    stop() {
        this.isPlaying = false;
        this.currentTrack = null;

        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        for (const osc of this.activeOscillators) {
            try { osc.stop(); } catch (e) {}
        }
        this.activeOscillators = [];
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.35;
        }
        return this.isMuted;
    }

    setMuted(muted) {
        this.isMuted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : 0.35;
        }
    }

    // ==========================================
    // SCHEDULER (for looping tracks)
    // ==========================================

    _scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
            this._playBeat(this.currentBeat, this.nextNoteTime);
            this.nextNoteTime += this.beatDuration / 2; // 8th notes

            // Get pattern length based on current track
            const patternLength = this._getPatternLength();
            this.currentBeat = (this.currentBeat + 1) % patternLength;
        }

        this.schedulerTimer = setTimeout(() => this._scheduler(), 25);
    }

    _getPatternLength() {
        if (this.currentTrack === 'menu') {
            return this.menuMelody.length;
        } else if (this.currentTrack === 'game') {
            return this.gameMelody.length;
        }
        return 64;
    }

    _playBeat(beat, time) {
        if (this.currentTrack === 'menu') {
            this._playMenuBeat(beat, time);
        } else if (this.currentTrack === 'game') {
            this._playGameBeat(beat, time);
        }
    }

    _playMenuBeat(beat, time) {
        const idx = beat % this.menuMelody.length;

        // Melody - soft, gentle
        if (this.menuMelody[idx] > 0) {
            this._playTriangleWave(this.menuMelody[idx], time, 0.2, 0.08);
        }

        // Bass - very soft
        if (this.menuBass[idx] > 0) {
            this._playTriangleWave(this.menuBass[idx], time, 0.3, 0.06);
        }
    }

    _playGameBeat(beat, time) {
        const idx = beat % this.gameMelody.length;

        // Main melody - strong square wave
        if (this.gameMelody[idx] > 0) {
            this._playSquareWave(this.gameMelody[idx], time, 0.12, 0.12);
        }

        // Bass - triangle wave, full
        if (this.gameBass[idx] > 0) {
            this._playTriangleWave(this.gameBass[idx], time, 0.2, 0.15);
        }

        // Harmony - quieter, adds richness
        if (this.gameHarmony && this.gameHarmony[idx] > 0) {
            this._playPulseWave(this.gameHarmony[idx], time, 0.15, 0.06);
        }

        // Drums
        if (this.gameDrums && this.gameDrums[idx]) {
            const drum = this.gameDrums[idx];
            if (drum === 1 || drum === 4) this._playKick(time);
            if (drum === 2 || drum === 5) this._playSnare(time);
            if (drum === 3 || drum === 4 || drum === 5) this._playHihat(time);
        }
    }

    // ==========================================
    // SOUND SYNTHESIS
    // ==========================================

    _playSquareWave(freq, time, duration, volume) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, time);
        gain.gain.setValueAtTime(volume * 0.7, time + duration * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration);

        this._trackOscillator(osc, duration);
    }

    _playTriangleWave(freq, time, duration, volume) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + duration);

        this._trackOscillator(osc, duration);
    }

    _playPulseWave(freq, time, duration, volume) {
        // Simulate pulse wave with two oscillators
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 1.005; // Slight detune for richness

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);

        this._trackOscillator(osc1, duration);
        this._trackOscillator(osc2, duration);
    }

    _playKick(time) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.12);

        this._trackOscillator(osc, 0.12);
    }

    _playSnare(time) {
        const bufferSize = this.audioCtx.sampleRate * 0.08;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(time);
        noise.stop(time + 0.08);
    }

    _playHihat(time) {
        const bufferSize = this.audioCtx.sampleRate * 0.03;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(time);
        noise.stop(time + 0.03);
    }

    _trackOscillator(osc, duration) {
        this.activeOscillators.push(osc);
        setTimeout(() => {
            const idx = this.activeOscillators.indexOf(osc);
            if (idx > -1) this.activeOscillators.splice(idx, 1);
        }, (duration + 0.1) * 1000);
    }
}

// Singleton instance
export const music = new MusicSystem();
