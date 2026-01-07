// ==================== MAIN APPLICATION ====================

import { CONFIG, isMobile } from './config.js';
import { SceneManager } from './scene.js';
import { Car } from './car.js';
import { createControls } from './controls.js';
import { DustParticleSystem, DriftTrailSystem, FloatingObjectManager } from './effects.js';
import { UIManager } from './ui.js';
import { SoundManager } from './sound.js';

class Application {
    constructor() {
        this.sceneManager = null;
        this.car = null;
        this.controls = null;
        this.dustSystem = null;
        this.driftSystem = null;
        this.floatingObjects = null;
        this.uiManager = null;
        this.soundManager = null;
        this.lastFrameTime = performance.now();
        
        this.init();
    }

    init() {
        // Initialize scene
        this.sceneManager = new SceneManager();
        
        // Initialize car - pass sceneManager for camera shake
        this.car = new Car(
            this.sceneManager.scene, 
            this.sceneManager.camera,
            this.sceneManager
        );
        
        // Initialize controls
        this.controls = createControls(this.sceneManager.renderer);
        
        // Initialize effects
        this.dustSystem = new DustParticleSystem(this.sceneManager.scene);
        this.driftSystem = new DriftTrailSystem(this.sceneManager.scene);
        this.floatingObjects = new FloatingObjectManager(this.sceneManager.scene);
        
        // Initialize sound manager (skip on mobile for now)
        if (!isMobile) {
            this.soundManager = new SoundManager();
        }
        
        // Initialize UI - pass sceneManager for camera control and soundManager for interaction sounds
        this.uiManager = new UIManager(
            this.sceneManager.scene, 
            this.sceneManager.camera,
            this.sceneManager,
            this.soundManager
        );
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start animation after loading delay
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            this.animate();
        }, CONFIG.UI.LOADING_DELAY_MS);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.sceneManager.handleResize();
            
            // Reload if mobile status changes
            const newIsMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
            
            if (newIsMobile !== isMobile) {
                location.reload();
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (!this.car.isLoaded()) {
            this.sceneManager.render();
            return;
        }

        // Check if car is locked (panel is open)
        const carLocked = this.uiManager.isCarLocked();
        
        let moving = false;
        let turning = false;
        
        // Only update controls if car is not locked
        if (!carLocked) {
            const controlResult = this.controls.update(this.car);
            moving = controlResult.moving;
            turning = controlResult.turning;
        }
        
        // Update car physics (always, to handle deceleration even when locked)
        
        // Update sounds (skip on mobile and when panel is open)
        if (this.soundManager && !carLocked) {
            this.soundManager.update(this.car.isCurrentlyAccelerating());
        } else if (this.soundManager && carLocked) {
            // Stop engine sounds when panel is open
            this.soundManager.stopAll();
        }

        
        const carMoved = this.car.update();


        // Update camera - only follow car if not transitioning
        const carPos = this.car.getPosition();
        const carRot = this.car.getRotation();
        if (carPos && carRot && !this.uiManager.isCameraTransitioning && !carLocked) {
            this.sceneManager.updateCameraFollow(carPos, carRot);
        }
        
        // Update camera shake (only when panel is not open and not transitioning)
        if (!carLocked && !this.uiManager.isCameraTransitioning) {
            this.sceneManager.updateCameraShake();
        }
        
        // Create effects when moving (only if not locked)
        if (!carLocked) {
            const velocity = this.car.getVelocity();
            if (velocity.length() > 0.1) {
                this.dustSystem.create(carPos, velocity);
            }
            
            if (this.car.isDrifting && Math.random() > 0.5) {
                this.driftSystem.create(carPos);
            }
        }
        
        // Update effects
        this.dustSystem.update();
        this.driftSystem.update();
        this.floatingObjects.update(deltaTime);
        
        // Update UI with delta time
        if (carPos) {
            this.uiManager.update(carPos, deltaTime);
        }
        
        // Update scene (only if not camera transitioning)
        if (!this.uiManager.isCameraTransitioning) {
            this.sceneManager.update();
        }
        
        this.sceneManager.render();
    }
}

// Start the application
new Application();