// ==================== SOUND MANAGEMENT ====================

import { CONFIG } from './config.js';

export class SoundManager {
    constructor() {
        // Audio elements
        this.engineSound = null;
        this.interactionSound = null;
        
        // State tracking
        this.isAccelerating = false;
        this.wasAccelerating = false;
        
        // Fade state
        this.fadeInterval = null;
        this.isFading = false;
        
        this.init();
    }

    init() {
        // Engine sound (loops while accelerating)
        this.engineSound = new Audio(CONFIG.SOUND.ENGINE_ACCELERATE);
        this.engineSound.loop = true;
        this.engineSound.volume = CONFIG.SOUND.ENGINE_VOLUME;
        
        // Interaction sound (panel open/close)
        this.interactionSound = new Audio(CONFIG.SOUND.INTERACTION);
        this.interactionSound.loop = false;
        this.interactionSound.volume = CONFIG.SOUND.INTERACTION_VOLUME;
        
        // Preload sounds
        this.preloadSounds();
    }

    preloadSounds() {
        [this.engineSound, this.interactionSound].forEach(audio => {
            if (audio) {
                audio.load();
            }
        });
    }

    /**
     * Update sound states based on car state
     * @param {boolean} isAccelerating - Is the car currently accelerating
     */
    update(isAccelerating) {
        // Started accelerating
        if (isAccelerating && !this.wasAccelerating) {
            this.playEngineSound();
        }
        // Stopped accelerating
        else if (!isAccelerating && this.wasAccelerating) {
            this.fadeOutEngineSound();
        }
        console.log("was", this.wasAccelerating);
        console.log("is", isAccelerating)
        
        this.wasAccelerating = isAccelerating;
    }

    playEngineSound() {
        if (!this.engineSound) return;
        
        // Cancel any ongoing fade
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
            this.isFading = false;
        }
        
        // Reset volume and play
        this.engineSound.volume = CONFIG.SOUND.ENGINE_VOLUME;
        this.engineSound.currentTime = 0;
        this.engineSound.play().catch(() => {
            console.log('Engine sound blocked by autoplay policy');
        });
    }

    fadeOutEngineSound() {
        if (!this.engineSound || this.engineSound.paused || this.isFading) return;
        
        this.isFading = true;
        
        const fadeDuration = CONFIG.SOUND.FADE_DURATION || 2000; // 2 seconds
        const fadeSteps = 40; // Number of steps for smooth fade
        const fadeInterval = fadeDuration / fadeSteps;
        const volumeStep = this.engineSound.volume / fadeSteps;
        
        this.fadeInterval = setInterval(() => {
            if (this.engineSound.volume > volumeStep) {
                this.engineSound.volume -= volumeStep;
            } else {
                // Fade complete
                this.engineSound.pause();
                this.engineSound.currentTime = 0;
                this.engineSound.volume = CONFIG.SOUND.ENGINE_VOLUME;
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                this.isFading = false;
            }
        }, fadeInterval);
    }

    playInteractionSound() {
        if (this.interactionSound) {
            this.interactionSound.currentTime = 0;
            this.interactionSound.play().catch(() => {
                console.log('Interaction sound blocked by autoplay policy');
            });
        }
    }

    /**
     * Stop all sounds (for cleanup or pause)
     */
    stopAll() {
        // Clear fade interval
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
            this.isFading = false;
        }
        
        // Stop engine sound
        if (this.engineSound && !this.engineSound.paused) {
            this.engineSound.pause();
            this.engineSound.currentTime = 0;
            this.engineSound.volume = CONFIG.SOUND.ENGINE_VOLUME;
        }
    }
}
