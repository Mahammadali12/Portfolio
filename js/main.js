// ==================== MAIN APPLICATION ====================

import { CONFIG, isMobile } from './config.js';
import { SceneManager } from './scene.js';
import { Car } from './car.js';
import { createControls } from './controls.js';
import { DustParticleSystem, DriftTrailSystem } from './effects.js';
import { UIManager } from './ui.js';

class Application {
    constructor() {
        this.sceneManager = null;
        this.car = null;
        this.controls = null;
        this.dustSystem = null;
        this.driftSystem = null;
        this.uiManager = null;
        
        this.init();
    }

    init() {
        // Initialize scene
        this.sceneManager = new SceneManager();
        
        // Initialize car
        this.car = new Car(this.sceneManager.scene, this.sceneManager.camera);
        
        // Initialize controls
        this.controls = createControls(this.sceneManager.renderer);
        
        // Initialize effects
        this.dustSystem = new DustParticleSystem(this.sceneManager.scene);
        this.driftSystem = new DriftTrailSystem(this.sceneManager.scene);
        
        // Initialize UI
        this.uiManager = new UIManager(this.sceneManager.scene, this.sceneManager.camera);
        
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
        
        if (!this.car.isLoaded()) {
            this.sceneManager.render();
            return;
        }

        // Update controls
        const { moving, turning } = this.controls.update(this.car);
        
        // Update car physics
        const carMoved = this.car.update();
        
        // Update camera to follow car (mobile AND desktop)
        const carPos = this.car.getPosition();
        const carRot = this.car.getRotation();
        if (carPos && carRot) {
            this.sceneManager.updateCameraFollow(carPos, carRot);
        }
        
        // Create effects when moving
        const velocity = this.car.getVelocity();
        if (velocity.length() > 0.1) {
            this.dustSystem.create(carPos, velocity);
        }
        
        // Create drift trails
        if (this.car.isDrifting && Math.random() > 0.5) {
            this.driftSystem.create(carPos);
        }
        
        // Update effects
        this.dustSystem.update();
        this.driftSystem.update();
        
        // Update UI
        if (carPos) {
            this.uiManager.update(carPos);
        }
        
        // Update scene
        this.sceneManager.update();
        this.sceneManager.render();
    }
}

// Start the application
new Application();