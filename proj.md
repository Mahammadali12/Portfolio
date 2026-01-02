### Project strucutre
```
├── assets
│   ├── car.glb
│   ├── profile.jpg
│   └── resume.pdf
├── car.glb:Zone.Identifier
├── checklist.md
├── css
│   └── styles.css
├── index.html
├── js
│   ├── car.js
│   ├── config.js
│   ├── controls.js
│   ├── effects.js
│   ├── main.js
│   ├── scene.js
│   ├── sections.js
│   └── ui.js
└── profile.jpg:Zone.Identifier
```

**car.js**
```javascript
// ==================== CAR SYSTEM ====================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG, isMobile } from './config.js';

export class Car {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isDrifting = false;
        this.driftAngle = 0;
        this.isAccelerating = false;
        this.isBraking = false;
        
        this.load();
    }

    load() {
        const loader = new GLTFLoader();
        
        loader.load(
            CONFIG.CAR.MODEL_PATH,
            (gltf) => {
                this.mesh = gltf.scene;
                const { x, y, z } = CONFIG.CAR.SCALE;
                this.mesh.scale.set(x, y, z);
                
                const pos = CONFIG.CAR.START_POSITION;
                this.mesh.position.set(pos.x, pos.y, pos.z);
                this.mesh.rotation.y = CONFIG.CAR.START_ROTATION;
                
                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                this.scene.add(this.mesh);
                console.log('Car loaded successfully');
                
                // On mobile, position camera to follow car
                if (isMobile && this.mesh) {
                    this.updateMobileCameraInitial();
                }
            },
            (progress) => {
                console.log(`Loading car: ${Math.round(progress.loaded / progress.total * 100)}%`);
            },
            (error) => {
                console.error('Error loading car model:', error);
                this.createFallback();
            }
        );
    }

    createFallback() {
        this.mesh = new THREE.Group();
        
        // Main body
        const bodySize = CONFIG.CAR.FALLBACK_SIZE.body;
        const bodyGeometry = new THREE.BoxGeometry(...bodySize);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff7251,
            emissive: 0xff7251,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        this.mesh.add(body);

        // Front indicator
        const frontGeometry = new THREE.BoxGeometry(2.5, 0.4, 0.6);
        const frontMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffcd74,
            emissive: 0xffcd74,
            emissiveIntensity: 0.5
        });
        const front = new THREE.Mesh(frontGeometry, frontMaterial);
        front.position.z = 2.3;
        front.castShadow = true;
        this.mesh.add(front);

        // Back indicator
        const backGeometry = new THREE.BoxGeometry(2.5, 0.4, 0.6);
        const backMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x9b2948,
            emissive: 0x9b2948,
            emissiveIntensity: 0.3
        });
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.z = -2.3;
        back.castShadow = true;
        this.mesh.add(back);

        // Wheels
        const wheelSize = CONFIG.CAR.FALLBACK_SIZE.wheel;
        const wheelGeometry = new THREE.CylinderGeometry(...wheelSize, 12);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            emissive: 0x222222,
            emissiveIntensity: 0.1
        });
        
        const wheelPositions = [
            [0.9, -0.5, 1.5],
            [-0.9, -0.5, 1.5],
            [0.9, -0.5, -1.5],
            [-0.9, -0.5, -1.5]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            this.mesh.add(wheel);
        });

        const pos = CONFIG.CAR.START_POSITION;
        this.mesh.position.set(pos.x, pos.y, pos.z);
        this.mesh.rotation.y = CONFIG.CAR.START_ROTATION;
        this.scene.add(this.mesh);
        
        if (isMobile && this.mesh) {
            this.updateMobileCameraInitial();
        }
    }

    updateMobileCameraInitial() {
        const forward = new THREE.Vector3(
            -Math.sin(this.mesh.rotation.y),
            0,
            -Math.cos(this.mesh.rotation.y)
        );
        
        this.camera.position.copy(this.mesh.position);
        this.camera.position.sub(forward.clone().multiplyScalar(20));
        this.camera.position.y += 15;
        this.camera.lookAt(this.mesh.position);
    }

    getForwardDirection() {
        return new THREE.Vector3(
            Math.sin(this.mesh.rotation.y),
            0,
            Math.cos(this.mesh.rotation.y)
        );
    }

    accelerate(intensity = 1) {
        const forward = this.getForwardDirection();
        this.velocity.add(forward.clone().multiplyScalar(CONFIG.PHYSICS.CAR_ACCELERATION * 0.1 * intensity));
        this.isAccelerating = true;
    }

    brake(intensity = 1) {
        const forward = this.getForwardDirection();
        this.velocity.add(forward.clone().multiplyScalar(-CONFIG.PHYSICS.CAR_ACCELERATION * 0.08 * intensity));
        this.isBraking = true;
    }

    turnLeft(intensity = 1) {
        const speed = this.velocity.length();
        const turnAmount = CONFIG.PHYSICS.TURN_SPEED * intensity * (Math.min(speed, 0.5) / 0.5);
        this.mesh.rotation.y += turnAmount;
    }

    turnRight(intensity = 1) {
        const speed = this.velocity.length();
        const turnAmount = CONFIG.PHYSICS.TURN_SPEED * intensity * (Math.min(speed, 0.5) / 0.5);
        this.mesh.rotation.y -= turnAmount;
    }

    applyFriction() {
        this.velocity.multiplyScalar(CONFIG.PHYSICS.CAR_DECELERATION);
    }

    limitSpeed() {
        if (this.velocity.length() > CONFIG.PHYSICS.MAX_SPEED) {
            this.velocity.setLength(CONFIG.PHYSICS.MAX_SPEED);
        }
    }

    checkBoundaries() {
        const { minX, maxX, minZ, maxZ } = CONFIG.SCENE.BOUNDARY;
        const newX = this.mesh.position.x + this.velocity.x;
        const newZ = this.mesh.position.z + this.velocity.z;
        
        if (newX > minX && newX < maxX && newZ > minZ && newZ < maxZ) {
            this.mesh.position.x = newX;
            this.mesh.position.z = newZ;
            return true;
        } else {
            // Bounce off boundaries
            this.velocity.multiplyScalar(CONFIG.PHYSICS.BOUNCE_DAMPING);
            return false;
        }
    }

    // NEW METHOD: Check if car is near boundaries (for enhanced mobile turning)
    isAtBoundary() {
        if (!this.mesh) return false;
        const { minX, maxX, minZ, maxZ } = CONFIG.SCENE.BOUNDARY;
        const pos = this.mesh.position;
        const threshold = 3;
        
        return pos.x <= minX + threshold || pos.x >= maxX - threshold ||
               pos.z <= minZ + threshold || pos.z >= maxZ - threshold;
    }

    updateDrift(isTurning) {
        const speed = this.velocity.length();
        this.isDrifting = speed > 0.5 && isTurning;

        if (this.isDrifting) {
            const velocityDir = this.velocity.clone().normalize();
            const forward = this.getForwardDirection();
            const blendedDir = velocityDir.lerp(forward, 0.8);
            this.velocity.copy(blendedDir.multiplyScalar(speed));
        }
    }

    updateTilt(turnDirection) {
        if (this.isDrifting) {
            this.driftAngle = turnDirection * 0.3;
        } else {
            this.driftAngle = 0;
        }
        this.mesh.rotation.z = this.driftAngle * 0.3;
    }

    update() {
        if (!this.mesh) return false;

        this.applyFriction();
        this.limitSpeed();
        
        const moved = this.checkBoundaries();
        
        // Reset acceleration states
        this.isAccelerating = false;
        this.isBraking = false;
        
        return moved;
    }

    getPosition() {
        return this.mesh ? this.mesh.position : null;
    }

    getRotation() {
        return this.mesh ? this.mesh.rotation : null;
    }

    getVelocity() {
        return this.velocity;
    }

    isLoaded() {
        return this.mesh !== null;
    }
}


```

**config.js**
```javascript

// ==================== CONFIGURATION ====================

export const CONFIG = {
    // Physics
    PHYSICS: {
        CAR_ACCELERATION: 0.55,
        CAR_DECELERATION: 0.9,
        MAX_SPEED: 2.5,
        DRIFT_FACTOR: 0.85,
        TURN_SPEED: 0.05,
        BOUNCE_DAMPING: -0.3
    },

    // Camera
    CAMERA: {
        FOV: 45,
        NEAR: 0.1,
        FAR: 1000,
        INITIAL_POSITION: { x: 0, y: 80, z: 80 },
        MOBILE_OFFSET: { x: 45, y: 60, z: 45 },
        MOBILE_LERP_SPEED: 0.05,
        ORBIT_MIN_DISTANCE: 30,
        ORBIT_MAX_DISTANCE: 150,
        ORBIT_MIN_POLAR_ANGLE: Math.PI / 6,
        ORBIT_MAX_POLAR_ANGLE: Math.PI / 2.2,
        ORBIT_DAMPING_FACTOR: 0.05
    },

    // Scene
    SCENE: {
        GROUND_SIZE: 100,
        BOUNDARY: {
            minX: -50,
            maxX: 50,
            minZ: -50,
            maxZ: 50
        }
    },

    // Lighting
    LIGHTING: {
        AMBIENT_COLOR: 0xffedbf,
        AMBIENT_INTENSITY: 0.8,
        DIRECTIONAL_COLOR: 0xffedbf,
        DIRECTIONAL_INTENSITY: 1.2,
        DIRECTIONAL_POSITION: { x: 20, y: 40, z: 15 },
        SHADOW_CAMERA_SIZE: 40,
        SHADOW_MAP_SIZE: 2048
    },

    // Colors
    COLORS: {
        BACKGROUND: 0x000000,
        GROUND: 0xffedbf,
        GRID: 0x9b2948,
        BOUNDARY: 0xff7251,
        DUST: 0xffcd74,
        DRIFT_TRAIL: 0x333333
    },

    // Sections
    SECTIONS: {
        PROFILE: {
            position: { x: 0, y: 0, z: 0 },
            size: { x: 18, y: 18 },
            color: 0xff7251,
            title: "👤 Profile",
            icon: "👤",
            buildingType: "center"
        },
        EDUCATION: {
            position: { x: 30, y: 0, z: -30 },
            size: { x: 15, y: 15 },
            color: 0x9b2948,
            title: "🎓 Education",
            icon: "🎓",
            buildingType: "university"
        },
        EXPERIENCE: {
            position: { x: -30, y: 0, z: 30 },
            size: { x: 15, y: 15 },
            color: 0xffca7b,
            title: "💼 Experience",
            icon: "💼",
            buildingType: "office"
        },
        PROJECTS: {
            position: { x: 30, y: 0, z: 30 },
            size: { x: 15, y: 15 },
            color: 0xffcd74,
            title: "🚀 Projects",
            icon: "🚀",
            buildingType: "lab"
        },
        SKILLS: {
            position: { x: -30, y: 0, z: -30 },
            size: { x: 15, y: 15 },
            color: 0xffedbf,
            title: "⚡ Skills",
            icon: "⚡",
            buildingType: "tower"
        }
    },

    // Effects
    EFFECTS: {
        DUST_PARTICLE_COUNT: 3,
        DUST_LIFETIME_DECAY: 0.02,
        DUST_GRAVITY: 0.002,
        DRIFT_TRAIL_OPACITY: 0.6,
        DRIFT_TRAIL_DECAY: 0.03,
        BACKGROUND_PARTICLE_COUNT: 30
    },

    // Car
    CAR: {
        SCALE: { x: 1.5, y: 1.5, z: 1.5 },
        START_POSITION: { x: 15, y: 1, z: 15 },
        START_ROTATION: Math.PI,
        MODEL_PATH: 'assets/car.glb',
        FALLBACK_SIZE: { body: [2.5, 1, 4.5], wheel: [0.4, 0.4, 0.3] }
    },

    // Mobile
    MOBILE: {
        SWIPE_THRESHOLD: 30,
        HOLD_THRESHOLD: 100,
        TURN_INTENSITY_MAX: 1.5,
        HORIZONTAL_SWIPE_THRESHOLD: 0.7,
        DRIFT_SWIPE_MULTIPLIER: 1.5,
        JOYSTICK: {
            BASE_RADIUS: 60,
            KNOB_RADIUS: 30,
            MAX_DISTANCE: 40,
            DEAD_ZONE: 0.15
        }
    },

    // UI
    UI: {
        PANEL_COOLDOWN_MS: 1500,
        PANEL_ANIMATION_DELAY_MS: 300,
        PANEL_CONTENT_ANIMATION_MS: 800,
        PANEL_FADE_OUT_DELAY_MS: 200,
        PANEL_CLEAR_DELAY_MS: 500,
        LOADING_DELAY_MS: 1000
    }
};

// Device detection
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);

```

**controls.js**
```javascript
// ==================== INPUT CONTROLS ====================

import { CONFIG, isMobile } from './config.js';

// ==================== DESKTOP CONTROLS ====================
export class DesktopControls {
    constructor() {
        this.keyStates = {
            w: false,
            s: false,
            a: false,
            d: false
        };
        
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keyStates.hasOwnProperty(key)) {
                this.keyStates[key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keyStates.hasOwnProperty(key)) {
                this.keyStates[key] = false;
            }
        });
    }

    update(car) {
        if (!car.isLoaded()) return { moving: false, turning: false };

        let moving = false;
        let turning = false;

        if (this.keyStates.w) {
            car.accelerate();
            moving = true;
        } else if (this.keyStates.s) {
            car.brake();
            moving = true;
        }

        if (this.keyStates.a) {
            car.turnLeft();
            turning = true;
        }
        
        if (this.keyStates.d) {
            car.turnRight();
            turning = true;
        }

        car.updateDrift(turning);
        
        const turnDirection = this.keyStates.a ? 1 : (this.keyStates.d ? -1 : 0);
        car.updateTilt(turnDirection);

        return { moving, turning };
    }
}

// ==================== MOBILE CONTROLS (VIRTUAL JOYSTICK) ====================
export class MobileControls {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Virtual joystick elements
        this.joystickBase = null;
        this.joystickKnob = null;
        
        // Joystick state
        this.isActive = false;
        this.centerX = 0;
        this.centerY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.vectorX = 0;  // Normalized -1 to 1
        this.vectorY = 0;  // Normalized -1 to 1
        
        this.init();
    }

    init() {
        // Show mobile UI
        document.getElementById('hint-mobile').style.display = 'inline';
        document.getElementById('hint-desktop').style.display = 'none';
        document.getElementById('mobile-controls').style.display = 'block';

        // Initialize joystick
        this.initVirtualJoystick();
    }

    initVirtualJoystick() {
        // Get joystick elements
        this.joystickBase = document.querySelector('.joystick-base');
        this.joystickKnob = document.querySelector('.joystick-knob');
        
        if (!this.joystickBase || !this.joystickKnob) {
            console.error('Joystick elements not found!');
            return;
        }

        // Calculate center position
        this.updateJoystickCenter();
        window.addEventListener('resize', () => this.updateJoystickCenter());

        // Touch events on the knob
        this.joystickKnob.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.onJoystickStart(e);
        }, { passive: false });

        // Touch move - listen on document
        document.addEventListener('touchmove', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.onJoystickMove(e);
            }
        }, { passive: false });

        // Touch end - listen on document
        document.addEventListener('touchend', (e) => {
            if (this.isActive) {
                this.onJoystickEnd(e);
            }
        }, { passive: false });

        document.addEventListener('touchcancel', (e) => {
            if (this.isActive) {
                this.onJoystickEnd(e);
            }
        }, { passive: false });
    }

    updateJoystickCenter() {
        const rect = this.joystickBase.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
    }

    onJoystickStart(e) {
        this.isActive = true;
        this.joystickKnob.classList.add('active');
        this.updateJoystickCenter();
    }

    onJoystickMove(e) {
        if (!this.isActive || e.touches.length === 0) return;

        const touch = e.touches[0];
        
        // Calculate offset from center
        let deltaX = touch.clientX - this.centerX;
        let deltaY = touch.clientY - this.centerY;
        
        // Calculate distance and angle
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX);
        
        // Constrain to max distance
        const maxDistance = CONFIG.MOBILE.JOYSTICK.MAX_DISTANCE;
        const constrainedDistance = Math.min(distance, maxDistance);
        
        // Calculate constrained position
        this.currentX = Math.cos(angle) * constrainedDistance;
        this.currentY = Math.sin(angle) * constrainedDistance;
        
        // Update visual position
        this.joystickKnob.style.transform = 
            `translate(calc(-50% + ${this.currentX}px), calc(-50% + ${this.currentY}px))`;
        
        // Calculate normalized vector with dead zone
        const deadZone = CONFIG.MOBILE.JOYSTICK.DEAD_ZONE * maxDistance;
        if (distance > deadZone) {
            this.vectorX = this.currentX / maxDistance;
            this.vectorY = this.currentY / maxDistance;
        } else {
            this.vectorX = 0;
            this.vectorY = 0;
        }
    }

    onJoystickEnd(e) {
        this.isActive = false;
        this.joystickKnob.classList.remove('active');
        
        // Reset to center with animation
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        this.currentX = 0;
        this.currentY = 0;
        this.vectorX = 0;
        this.vectorY = 0;
    }

    update(car) {
        if (!car.isLoaded()) return { moving: false, turning: false };

        let moving = false;
        let turning = false;

        if (this.isActive && (Math.abs(this.vectorX) > 0 || Math.abs(this.vectorY) > 0)) {
            const atBoundary = car.isAtBoundary();
            
            // Y-axis controls forward/backward (negative Y is up)
            const forwardInput = -this.vectorY;
            
            // Determine if we should move forward
            let shouldMoveForward = false;
            let forwardIntensity = 0;
            
            if (forwardInput > 0.1) {
                // Explicit forward push
                shouldMoveForward = true;
                forwardIntensity = forwardInput;
            } else if (forwardInput < -0.1) {
                // Explicit reverse
                const reverseIntensity = Math.abs(forwardInput);
                car.brake(reverseIntensity * 1.5);
                moving = true;
            } else if (Math.abs(this.vectorX) > 0.2) {
                // RACING GAME BEHAVIOR: Auto-forward when steering
                // If joystick is pushed left/right without up/down,
                // automatically move forward to maintain momentum
                shouldMoveForward = true;
                forwardIntensity = Math.abs(this.vectorX); // Use turn intensity as speed
            }
            
            // Apply forward movement
            if (shouldMoveForward) {
                if (!atBoundary || car.getVelocity().length() < 0.1) {
                    car.accelerate(forwardIntensity);
                    moving = true;
                }
            }
            
            // X-axis controls turning
            const turnInput = this.vectorX;
            
            if (Math.abs(turnInput) > 0.1) {
                const turnMultiplier = atBoundary ? 1.8 : 1.0;
                const turnIntensity = Math.abs(turnInput) * turnMultiplier;
                
                if (turnInput > 0) {
                    car.turnRight(turnIntensity);
                } else {
                    car.turnLeft(turnIntensity);
                }
                turning = true;
            }
        }

        // Drift detection
        const speed = car.getVelocity().length();
        const drifting = this.isActive && speed > 0.5 && Math.abs(this.vectorX) > 0.6;
        car.updateDrift(drifting);
        
        // Tilt direction
        const turnDirection = this.vectorX > 0 ? -1 : (this.vectorX < 0 ? 1 : 0);
        car.updateTilt(turnDirection);

        return { moving, turning };
    }
}

// ==================== CONTROLS FACTORY ====================
export function createControls(renderer) {
    if (isMobile) {
        return new MobileControls(renderer);
    } else {
        return new DesktopControls();
    }
}


```

**effects.js**
```javascript
// ==================== VISUAL EFFECTS ====================

import * as THREE from 'three';
import { CONFIG } from './config.js';

// ==================== DUST PARTICLES ====================
export class DustParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.geometry = new THREE.SphereGeometry(0.1, 4, 4);
        this.material = new THREE.MeshBasicMaterial({ 
            color: CONFIG.COLORS.DUST,
            transparent: true,
            opacity: 0.7
        });
    }

    create(carPosition, carVelocity) {
        const particleCount = Math.floor(Math.random() * CONFIG.EFFECTS.DUST_PARTICLE_COUNT) + 1;

        for (let i = 0; i < particleCount; i++) {
            const dust = new THREE.Mesh(this.geometry, this.material);

            const offsetX = (Math.random() - 0.5) * 0.5;
            const offsetZ = (Math.random() - 0.5) * 0.5;

            dust.position.set(
                carPosition.x + offsetX,
                0.2,
                carPosition.z + offsetZ
            );

            dust.userData = {
                life: 1.0,
                velocity: new THREE.Vector3(
                    -carVelocity.x * 0.1 + (Math.random() - 0.5) * 0.05,
                    0.05 + Math.random() * 0.05,
                    -carVelocity.z * 0.1 + (Math.random() - 0.5) * 0.05
                ),
                rotationSpeed: (Math.random() - 0.5) * 0.1
            };

            this.scene.add(dust);
            this.particles.push(dust);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.userData.life -= CONFIG.EFFECTS.DUST_LIFETIME_DECAY;
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.y -= CONFIG.EFFECTS.DUST_GRAVITY;
            particle.rotation.x += particle.userData.rotationSpeed;
            particle.rotation.y += particle.userData.rotationSpeed;

            particle.material.opacity = particle.userData.life * 0.7;
            particle.scale.setScalar(0.5 + particle.userData.life * 0.5);

            if (particle.userData.life <= 0 || particle.position.y < 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }
}

// ==================== DRIFT TRAILS ====================
export class DriftTrailSystem {
    constructor(scene) {
        this.scene = scene;
        this.trails = [];
        this.geometry = new THREE.PlaneGeometry(0.3, 1.5);
        this.materialTemplate = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.DRIFT_TRAIL,
            transparent: true,
            opacity: CONFIG.EFFECTS.DRIFT_TRAIL_OPACITY,
            side: THREE.DoubleSide
        });
    }

    create(carPosition) {
        const trail = new THREE.Mesh(this.geometry, this.materialTemplate.clone());
        trail.position.set(carPosition.x, 0.1, carPosition.z);
        trail.rotation.y = Math.random() * Math.PI * 2;
        
        trail.userData = {
            life: 1.0,
            maxLife: 1.0
        };
        
        this.scene.add(trail);
        this.trails.push(trail);
    }

    update() {
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const trail = this.trails[i];
            trail.userData.life -= CONFIG.EFFECTS.DRIFT_TRAIL_DECAY;
            trail.material.opacity = CONFIG.EFFECTS.DRIFT_TRAIL_OPACITY * 
                                    (trail.userData.life / trail.userData.maxLife);
            
            if (trail.userData.life <= 0) {
                this.scene.remove(trail);
                this.trails.splice(i, 1);
            }
        }
    }
}

// ==================== SECTION BUILDINGS ====================
export class BuildingManager {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
    }

    createBuilding(type, color, position) {
        const buildingGroup = new THREE.Group();
        const baseColor = color;
        
        switch(type) {
            case 'center':
                this.createCenterBuilding(buildingGroup, baseColor);
                break;
            case 'university':
                this.createUniversityBuilding(buildingGroup, baseColor);
                break;
            case 'office':
                this.createOfficeBuilding(buildingGroup, baseColor);
                break;
            case 'lab':
                this.createLabBuilding(buildingGroup, baseColor);
                break;
            case 'tower':
                this.createTowerBuilding(buildingGroup, baseColor);
                break;
        }
        
        buildingGroup.position.set(position.x, 0, position.z);
        this.scene.add(buildingGroup);
        this.buildings.push(buildingGroup);
        
        return buildingGroup;
    }

    createCenterBuilding(group, color) {
        const baseGeometry = new THREE.BoxGeometry(5, 10, 5);
        const baseMaterial = new THREE.MeshPhongMaterial({ color, shininess: 30 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        const pyramidGeometry = new THREE.ConeGeometry(3.5, 4, 4);
        const pyramidMaterial = new THREE.MeshPhongMaterial({ color: 0x9b2948, shininess: 20 });
        const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
        pyramid.position.y = 12;
        pyramid.castShadow = true;
        group.add(pyramid);
        
        for(let i = 0; i < 4; i++) {
            const windowGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
            const windowMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffcd74,
                emissive: 0xffcd74,
                emissiveIntensity: 0.3
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(
                i % 2 === 0 ? -1.5 : 1.5,
                3 + Math.floor(i/2) * 3,
                2.6
            );
            group.add(window);
        }
    }

    createUniversityBuilding(group, color) {
        const baseGeometry = new THREE.BoxGeometry(7, 8, 7);
        const baseMaterial = new THREE.MeshPhongMaterial({ color, shininess: 30 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 4;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        const roofGeometry = new THREE.BoxGeometry(8, 0.5, 8);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x3a1c00 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 8.25;
        group.add(roof);
        
        for(let i = 0; i < 4; i++) {
            const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2);
            const columnMaterial = new THREE.MeshPhongMaterial({ color: 0xffcd74 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            const angle = (i / 4) * Math.PI * 2;
            column.position.set(Math.cos(angle) * 2.5, 5, Math.sin(angle) * 2.5);
            group.add(column);
        }
    }

    createOfficeBuilding(group, color) {
        const towerGeometry = new THREE.BoxGeometry(4, 14, 4);
        const towerMaterial = new THREE.MeshPhongMaterial({ color, shininess: 40 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 7;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);
        
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 4; j++) {
                const windowGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
                const windowMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x00a8ff,
                    emissive: 0x00a8ff,
                    emissiveIntensity: 0.4
                });
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(-1.2 + i * 1.2, 3 + j * 2.5, 2.1);
                group.add(window);
            }
        }
        
        const rooftopGeometry = new THREE.BoxGeometry(5, 2, 5);
        const rooftopMaterial = new THREE.MeshPhongMaterial({ color: 0x3a1c00 });
        const rooftop = new THREE.Mesh(rooftopGeometry, rooftopMaterial);
        rooftop.position.y = 15;
        group.add(rooftop);
    }

    createLabBuilding(group, color) {
        const baseGeometry = new THREE.BoxGeometry(6, 6, 6);
        const baseMaterial = new THREE.MeshPhongMaterial({ color, shininess: 35 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 3;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        const domeGeometry = new THREE.SphereGeometry(3.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00a8ff,
            transparent: true,
            opacity: 0.7
        });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 9;
        dome.rotation.x = Math.PI;
        group.add(dome);
        
        const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3);
        const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = 12.5;
        group.add(antenna);
    }

    createTowerBuilding(group, color) {
        const towerGeometry = new THREE.BoxGeometry(3, 16, 3);
        const towerMaterial = new THREE.MeshPhongMaterial({ color, shininess: 50 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 8;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);
        
        for(let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(2.2, 0.3, 8, 12);
            const ringMaterial = new THREE.MeshPhongMaterial({ color: 0xffcd74 });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = 3 + i * 5;
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
        
        const spireGeometry = new THREE.ConeGeometry(0.5, 4, 4);
        const spireMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.2
        });
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.y = 20;
        group.add(spire);
    }
}


```

**main.js**
```javascript
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
        
        // Update camera on mobile
        if (isMobile) {
            const carPos = this.car.getPosition();
            const carRot = this.car.getRotation();
            if (carPos && carRot) {
                this.sceneManager.updateCameraFollow(carPos, carRot);
            }
        }
        
        // Create effects when moving
        const velocity = this.car.getVelocity();
        if (velocity.length() > 0.1) {
            const carPos = this.car.getPosition();
            this.dustSystem.create(carPos, velocity);
        }
        
        // Create drift trails
        if (this.car.isDrifting && Math.random() > 0.5) {
            const carPos = this.car.getPosition();
            this.driftSystem.create(carPos);
        }
        
        // Update effects
        this.dustSystem.update();
        this.driftSystem.update();
        
        // Update UI
        const carPos = this.car.getPosition();
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


```

**scene.js**
```javascript
// ==================== SCENE SETUP ====================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG, isMobile } from './config.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.initLighting();
        this.initGround();
        this.addBoundaryMarkers();
        this.addDecorativeElements();
    }

    initCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.CAMERA.FOV,
            aspect,
            CONFIG.CAMERA.NEAR,
            CONFIG.CAMERA.FAR
        );
        
        const { x, y, z } = CONFIG.CAMERA.INITIAL_POSITION;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(CONFIG.COLORS.BACKGROUND, 1);
        
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.position = 'absolute';
        
        document.body.appendChild(this.renderer.domElement);

        // Mobile optimizations
        if (isMobile) {
            this.renderer.shadowMap.enabled = true;
            if (window.devicePixelRatio > 2) {
                this.renderer.setPixelRatio(2);
            }
        }
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = !isMobile;
        this.controls.dampingFactor = CONFIG.CAMERA.ORBIT_DAMPING_FACTOR;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.minDistance = CONFIG.CAMERA.ORBIT_MIN_DISTANCE;
        this.controls.maxDistance = CONFIG.CAMERA.ORBIT_MAX_DISTANCE;
        this.controls.maxPolarAngle = CONFIG.CAMERA.ORBIT_MAX_POLAR_ANGLE;
        this.controls.minPolarAngle = CONFIG.CAMERA.ORBIT_MIN_POLAR_ANGLE;
        this.controls.target.set(0, 0, 0);
        this.controls.enabled = !isMobile;
        this.controls.update();
    }

    initLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(
            CONFIG.LIGHTING.AMBIENT_COLOR,
            CONFIG.LIGHTING.AMBIENT_INTENSITY
        );
        this.scene.add(ambientLight);

        // Directional light with shadows
        const directionalLight = new THREE.DirectionalLight(
            CONFIG.LIGHTING.DIRECTIONAL_COLOR,
            CONFIG.LIGHTING.DIRECTIONAL_INTENSITY
        );
        
        const { x, y, z } = CONFIG.LIGHTING.DIRECTIONAL_POSITION;
        directionalLight.position.set(x, y, z);
        directionalLight.castShadow = true;
        
        const size = CONFIG.LIGHTING.SHADOW_CAMERA_SIZE;
        directionalLight.shadow.camera.left = -size;
        directionalLight.shadow.camera.right = size;
        directionalLight.shadow.camera.top = size;
        directionalLight.shadow.camera.bottom = -size;
        
        const mapSize = isMobile ? 1024 : CONFIG.LIGHTING.SHADOW_MAP_SIZE;
        directionalLight.shadow.mapSize.width = mapSize;
        directionalLight.shadow.mapSize.height = mapSize;
        
        this.scene.add(directionalLight);
    }

    initGround() {
        const size = CONFIG.SCENE.GROUND_SIZE;
        const groundGeometry = new THREE.PlaneGeometry(size, size);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.COLORS.GROUND,
            side: THREE.DoubleSide,
            shininess: 30
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(size, 20, CONFIG.COLORS.GRID, CONFIG.COLORS.GRID);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.15;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    addBoundaryMarkers() {
        const boundaryMaterial = new THREE.LineBasicMaterial({ 
            color: CONFIG.COLORS.BOUNDARY,
            transparent: true,
            opacity: 0.2,
            linewidth: 2
        });
        
        const { minX, maxX, minZ, maxZ } = CONFIG.SCENE.BOUNDARY;
        const boundaryPoints = [
            new THREE.Vector3(minX, 0.5, minZ),
            new THREE.Vector3(maxX, 0.5, minZ),
            new THREE.Vector3(maxX, 0.5, maxZ),
            new THREE.Vector3(minX, 0.5, maxZ),
            new THREE.Vector3(minX, 0.5, minZ)
        ];
        
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
        const boundaryLine = new THREE.Line(boundaryGeometry, boundaryMaterial);
        this.scene.add(boundaryLine);
    }

    addDecorativeElements() {
        const particleCount = CONFIG.EFFECTS.BACKGROUND_PARTICLE_COUNT;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 120;
            positions[i + 1] = Math.random() * 30 + 10;
            positions[i + 2] = (Math.random() - 0.5) * 120;
            
            colors[i] = 0.8 + Math.random() * 0.2;
            colors[i + 1] = 0.6 + Math.random() * 0.3;
            colors[i + 2] = 0.3 + Math.random() * 0.2;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
    }

    updateCameraFollow(carPosition, carRotation) {
        if (!isMobile) return;

        const offset = CONFIG.CAMERA.MOBILE_OFFSET;
        const targetPosition = new THREE.Vector3();
        targetPosition.x = carPosition.x + offset.x;
        targetPosition.y = offset.y;
        targetPosition.z = carPosition.z + offset.z;
        
        this.camera.position.lerp(targetPosition, CONFIG.CAMERA.MOBILE_LERP_SPEED);
        
        const lookAtPoint = new THREE.Vector3(carPosition.x, 0, carPosition.z);
        const currentTarget = new THREE.Vector3(0, 0, -1);
        currentTarget.applyQuaternion(this.camera.quaternion);
        currentTarget.multiplyScalar(50).add(this.camera.position);
        currentTarget.lerp(lookAtPoint, CONFIG.CAMERA.MOBILE_LERP_SPEED * 2);
        this.camera.lookAt(currentTarget);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        if (!isMobile) {
            this.controls.update();
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}


```

**sections.js**
```javascript

// ==================== RESUME SECTIONS DATA ====================

export const sectionsData = {
    profile: {
        content: `
            <h3 class="section-title">Mahammadali Zamani</h3>
            <img src="assets/profile.jpg" alt="Mahammadali Zamani" class="profile-photo" onerror="this.style.display='none'">
            <div class="project-item">
                <h4>Computer Science Student & Software Engineer</h4>
                <p>Passionate developer specializing in backend systems, physics simulations, and high-performance computing.</p>
            </div>
            <div class="contact-info">
                <div class="contact-icon">📱</div>
                <div class="contact-detail">+994-55-397-75-00</div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">📧</div>
                <div class="contact-detail"><a href="mailto:zamanli.mehemmedeli@gmail.com" style="color: #ffca7b; text-decoration: none; border-bottom: 1px dotted #ffca7b;">zamanli.mehemmedeli@gmail.com</a></div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">🔗</div>
                <div class="contact-detail"><a href="https://www.linkedin.com/in/mahammadali-zamanli-64931a282/" target="_blank" style="color: #ffca7b; text-decoration: none; border-bottom: 1px dotted #ffca7b;">LinkedIn</a></div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">💻</div>
                <div class="contact-detail"><a href="https://github.com/Mahammadali12" target="_blank" style="color: #ffca7b; text-decoration: none; border-bottom: 1px dotted #ffca7b;">GitHub</a></div>
            </div>
            <div class="contact-info">
                <div class="contact-icon">📍</div>
                <div class="contact-detail">Baku, Azerbaijan</div>
            </div>
            <div class="project-item" style="margin-top: 20px;">
                <p><strong>"Engineering elegant solutions to complex problems."</strong></p>
            </div>
        `
    },
    
    education: {
        content: `
            <h3 class="section-title">Education</h3>
            <div class="project-item">
                <h4>ADA University</h4>
                <p>Bachelor of Arts in Computer Science</p>
                <p><strong>Baku, Azerbaijan</strong> | Sep 2022 – May 2027</p>
            </div>
            <div class="project-item">
                <h4>Transport and Telecommunication Institute</h4>
                <p>Bachelor of Applied Science in Computer Science (Exchange Program)</p>
                <p><strong>Riga, Latvia</strong> | Feb 2025 – June 2025</p>
            </div>
            <div class="project-item">
                <h4>Relevant Coursework</h4>
                <p>Data Structures and Algorithms, Object-Oriented Programming (Java), Operating Systems, Computer Networks, Database Systems, Discrete Mathematics, Probability and Statistics, Software Engineering Principles</p>
            </div>
        `
    },
    
    experience: {
        content: `
            <h3 class="section-title">Work Experience</h3>
            <div class="project-item">
                <h4>Software Engineer Intern - AzSimX Azersilah</h4>
                <p><strong>Baku, Azerbaijan</strong> | July 2025 – Dec 2025</p>
                <p>• Engineered a high-fidelity physics simulation module in C# (Unity), increasing aerodynamic calculation accuracy by 15% and eliminating trajectory drift by 22% compared to engine defaults.</p>
                <p>• Optimized real-time rendering and calculation loops, maintaining a stable 90 FPS in VR and reducing average frame latency from 14ms to 9ms through profiling and bottleneck elimination.</p>
                <p>• Designed software interface for hardware integration, achieving sub-millisecond response times and improving hardware-to-software synchronization reliability by 30%.</p>
            </div>
        `
    },
    
    projects: {
        content: `
            <h3 class="section-title">Technical Projects</h3>
            <div class="project-item">
                <h4>HTTP Web Server | C, POSIX, Socket programming</h4>
                <p>• Architected a multithreaded HTTP server in C handling 1,000+ concurrent connections with average response times under 50ms.</p>
                <p>• Reduced memory overhead by 40% by implementing a custom thread-pool and request parser, ensuring stability under high-throughput conditions.</p>
                <p>• Implemented HTTP/1.1 persistent connections, resulting in a 25% reduction in TCP handshake overhead for multi-request sessions.</p>
            </div>
            <div class="project-item">
                <h4>Task Manager REST API | Go, net/http, JSON</h4>
                <p>• Developed a concurrent REST API in Go, utilizing Goroutines and Channels to increase request throughput by 4x compared to synchronous processing.</p>
                <p>• Improved maintainability and test coverage by 35% by implementing Hexagonal Architecture, decoupling domain logic for isolated unit testing.</p>
                <p>• Eliminated race conditions during high-concurrency tasks, ensuring 100% data integrity across 500+ automated stress tests.</p>
            </div>
            <div class="project-item">
                <h4>Web Scraper Application | Java, Jsony, Spring Boot, PostgreSQL, Docker</h4>
                <p>• Built a containerized data extraction pipeline that increased collection speed by 60%, parsing 200+ structured records per minute to PostgreSQL.</p>
                <p>• Designed an extensible API architecture for rapid onboarding of new scraping targets, reducing new model integration time by 50%.</p>
                <p>• Reduced deployment configuration time by 80% by orchestrating the full stack with Docker Compose for consistent environment parity.</p>
            </div>
        `
    },
    
    skills: {
        content: `
            <h3 class="section-title">Technical Skills</h3>
            <div class="skill-category">
                <h4>Programming Languages</h4>
                <div class="skill-list">
                    <span class="skill-tag">Java</span>
                    <span class="skill-tag">Go</span>
                    <span class="skill-tag">SQL (PostgreSQL)</span>
                    <span class="skill-tag">C#</span>
                    <span class="skill-tag">C</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Frameworks & Libraries</h4>
                <div class="skill-list">
                    <span class="skill-tag">Spring Boot</span>
                    <span class="skill-tag">Unity</span>
                    <span class="skill-tag">JUnit</span>
                    <span class="skill-tag">Jsony</span>
                    <span class="skill-tag">POSIX Sockets</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Tools & DevOps</h4>
                <div class="skill-list">
                    <span class="skill-tag">Git</span>
                    <span class="skill-tag">Docker</span>
                    <span class="skill-tag">Docker Compose</span>
                    <span class="skill-tag">Linux (Bash)</span>
                    <span class="skill-tag">Postman</span>
                    <span class="skill-tag">Maven</span>
                </div>
            </div>
            <div class="skill-category">
                <h4>Languages</h4>
                <div class="skill-list">
                    <span class="skill-tag">Azerbaijani (Native)</span>
                    <span class="skill-tag">English (Fluent)</span>
                    <span class="skill-tag">Russian (Working Proficiency)</span>
                </div>
            </div>
        `
    }
};

```

**ui.js**
```javascript
// ==================== UI MANAGEMENT ====================

import * as THREE from 'three';
import { CONFIG, isMobile } from './config.js';
import { sectionsData } from './sections.js';
import { BuildingManager } from './effects.js';

export class UIManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.buildingManager = new BuildingManager(scene);
        
        this.sectionMeshes = [];
        this.sectionLabels = [];
        this.currentSection = null;
        this.panelCooldown = false;
        this.panelCooldownTimeout = null;
        this.isPanelAnimating = false;
        this.currentPanelAnimation = null;
        
        this.mobilePendingSection = null;
        this.mobileSectionBtn = document.getElementById('mobile-section-btn');
        
        this.initSections();
        this.initMobileButton();
        
        // Expose close function globally
        window.hideSectionInfo = () => this.hideSectionInfo();
    }

    initSections() {
        Object.keys(CONFIG.SECTIONS).forEach(key => {
            const config = CONFIG.SECTIONS[key];
            const lowerKey = key.toLowerCase();
            
            // Create section ground plate
            this.createSectionPlate(lowerKey, config);
            
            // Create billboard label
            this.createBillboardLabel(config);
            
            // Create building
            this.buildingManager.createBuilding(
                config.buildingType,
                config.color,
                config.position
            );
        });
    }

    createSectionPlate(key, config) {
        const geometry = new THREE.BoxGeometry(config.size.x, 0.5, config.size.y);
        const material = new THREE.MeshPhongMaterial({ 
            color: config.color,
            transparent: true,
            opacity: 0.9,
            emissive: config.color,
            emissiveIntensity: key === 'profile' ? 0.6 : 0.4
        });
        
        const box = new THREE.Mesh(geometry, material);
        box.position.set(config.position.x, 0.25, config.position.z);
        box.userData = { type: 'section', id: key };
        box.castShadow = true;
        box.receiveShadow = true;
        
        // Add glow to center section
        if (key === 'profile') {
            const glowGeometry = new THREE.BoxGeometry(config.size.x + 1, 0.1, config.size.y + 1);
            const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: config.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.y = 0.05;
            box.add(glow);
        }
        
        this.scene.add(box);
        this.sectionMeshes.push(box);

        // Add border
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
            color: 0x3a1c00,
            linewidth: 2 
        }));
        box.add(line);
    }

    createBillboardLabel(config) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Background gradient
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        const r = config.color >> 16 & 255;
        const g = config.color >> 8 & 255;
        const b = config.color & 255;
        
        gradient.addColorStop(0, `rgba(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)}, 0.95)`);
        gradient.addColorStop(1, `rgba(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)}, 0.85)`);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        context.strokeStyle = '#3a1c00';
        context.lineWidth = 10;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Text
        context.font = 'bold 48px Arial';
        context.fillStyle = '#3a1c00';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = 'rgba(255, 237, 191, 0.8)';
        context.shadowBlur = 10;
        
        // Icon
        context.font = 'bold 64px Arial';
        context.fillText(config.icon, canvas.width/2 - 100, canvas.height/2);
        
        // Title
        context.font = 'bold 48px Arial';
        context.fillText(config.title, canvas.width/2 + 40, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(12, 6);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(config.position.x, 10, config.position.z);
        label.userData = { billboard: true };
        this.scene.add(label);
        this.sectionLabels.push(label);
    }

    initMobileButton() {
        if (!this.mobileSectionBtn) return;
        
        this.mobileSectionBtn.addEventListener('click', () => {
            if (this.mobilePendingSection) {
                this.mobileSectionBtn.classList.remove('show');
                setTimeout(() => {
                    this.mobileSectionBtn.style.display = 'none';
                }, 250);
                this.showSectionInfo(this.mobilePendingSection);
            }
        });
    }

    checkSectionCollision(carPosition) {
        if (!carPosition || this.panelCooldown || this.isPanelAnimating) return;
        
        let foundSection = false;
        let foundKey = null;
        
        for (const [key, config] of Object.entries(CONFIG.SECTIONS)) {
            const lowerKey = key.toLowerCase();
            const bounds = {
                x: {
                    min: config.position.x - config.size.x / 2,
                    max: config.position.x + config.size.x / 2
                },
                z: {
                    min: config.position.z - config.size.y / 2,
                    max: config.position.z + config.size.y / 2
                }
            };
            
            if (carPosition.x > bounds.x.min && carPosition.x < bounds.x.max &&
                carPosition.z > bounds.z.min && carPosition.z < bounds.z.max) {
                foundSection = true;
                foundKey = lowerKey;
                break;
            }
        }

        if (foundSection) {
            if (isMobile) {
                this.mobilePendingSection = foundKey;
                if (this.mobileSectionBtn) {
                    const title = CONFIG.SECTIONS[foundKey.toUpperCase()].title.replace(/^[^A-Za-z0-9]+/, '');
                    this.mobileSectionBtn.textContent = title;
                    this.mobileSectionBtn.style.display = 'block';
                    void this.mobileSectionBtn.offsetWidth;
                    this.mobileSectionBtn.classList.add('show');
                }
            } else {
                if (this.currentSection !== foundKey) {
                    this.showSectionInfo(foundKey);
                }
            }
            return;
        }

        // Car left all sections
        if (isMobile) {
            this.mobilePendingSection = null;
            if (this.mobileSectionBtn) {
                this.mobileSectionBtn.classList.remove('show');
                setTimeout(() => {
                    if (!this.mobilePendingSection) {
                        this.mobileSectionBtn.style.display = 'none';
                    }
                }, 250);
            }
        }

        if (this.currentSection !== null && !foundSection && !this.panelCooldown) {
            this.hideSectionInfo();
        }
    }

    showSectionInfo(sectionKey) {
        if (this.panelCooldown || this.currentSection === sectionKey || this.isPanelAnimating) return;

        if (isMobile && this.mobileSectionBtn) {
            this.mobileSectionBtn.classList.remove('show');
            setTimeout(() => {
                this.mobileSectionBtn.style.display = 'none';
            }, 250);
        }

        if (isMobile) {
            const sectionInfo = document.getElementById('section-info');
            sectionInfo.style.pointerEvents = 'auto';
        }

        this.isPanelAnimating = true;
        const sectionContent = document.getElementById('section-content');
        const sectionInfo = document.getElementById('section-info');

        sectionInfo.classList.remove('panel-show');
        sectionContent.classList.remove('section-content-animate');

        if (this.currentPanelAnimation) {
            clearTimeout(this.currentPanelAnimation);
            this.currentPanelAnimation = null;
        }

        if (this.panelCooldownTimeout) {
            clearTimeout(this.panelCooldownTimeout);
            this.panelCooldown = false;
        }

        sectionContent.innerHTML = sectionsData[sectionKey].content;
        void sectionInfo.offsetWidth;
        sectionInfo.classList.add('panel-show');

        this.currentPanelAnimation = setTimeout(() => {
            sectionContent.classList.add('section-content-animate');
            setTimeout(() => {
                this.isPanelAnimating = false;
                this.currentPanelAnimation = null;
            }, CONFIG.UI.PANEL_CONTENT_ANIMATION_MS);
        }, CONFIG.UI.PANEL_ANIMATION_DELAY_MS);

        this.highlightSection(sectionKey);
        this.currentSection = sectionKey;
    }

    hideSectionInfo() {
        this.isPanelAnimating = true;
        const sectionInfo = document.getElementById('section-info');
        const sectionContent = document.getElementById('section-content');

        if (!sectionInfo.classList.contains('panel-show')) {
            this.isPanelAnimating = false;
            return;
        }

        this.panelCooldown = true;
        if (this.panelCooldownTimeout) {
            clearTimeout(this.panelCooldownTimeout);
        }

        this.panelCooldownTimeout = setTimeout(() => {
            this.panelCooldown = false;
            this.panelCooldownTimeout = null;
        }, CONFIG.UI.PANEL_COOLDOWN_MS);

        sectionContent.style.opacity = '0';
        sectionContent.style.transform = 'translateY(10px)';

        setTimeout(() => {
            sectionInfo.classList.remove('panel-show');
            sectionContent.classList.remove('section-content-animate');
            this.currentSection = null;
            this.removeSectionHighlight();

            setTimeout(() => {
                if (!sectionInfo.classList.contains('panel-show')) {
                    sectionContent.innerHTML = '';
                    sectionContent.style.opacity = '1';
                    sectionContent.style.transform = 'translateY(0)';
                }
                this.isPanelAnimating = false;

                if (isMobile && this.mobilePendingSection && this.mobileSectionBtn) {
                    const title = CONFIG.SECTIONS[this.mobilePendingSection.toUpperCase()].title.replace(/^[^A-Za-z0-9]+/, '').trim();
                    this.mobileSectionBtn.textContent = title;
                    this.mobileSectionBtn.style.display = 'block';
                    void this.mobileSectionBtn.offsetWidth;
                    this.mobileSectionBtn.classList.add('show');
                }
            }, CONFIG.UI.PANEL_CLEAR_DELAY_MS);
        }, CONFIG.UI.PANEL_FADE_OUT_DELAY_MS);
    }

    highlightSection(sectionKey) {
        this.removeSectionHighlight();

        this.sectionMeshes.forEach(mesh => {
            if (mesh.userData.id === sectionKey) {
                mesh.userData.originalEmissive = mesh.material.emissive.getHex();
                mesh.userData.originalOpacity = mesh.material.opacity;
                mesh.material.emissive.setHex(0xffffff);
                mesh.material.emissiveIntensity = 0.8;
                mesh.material.opacity = 1.0;

                let pulseTime = 0;
                const pulseMaterial = mesh.material;

                function pulseAnimation() {
                    if (mesh.userData.isHighlighted) {
                        pulseTime += 0.05;
                        const pulse = Math.sin(pulseTime) * 0.2 + 0.8;
                        pulseMaterial.emissiveIntensity = 0.6 + pulse * 0.4;
                        requestAnimationFrame(pulseAnimation);
                    }
                }

                mesh.userData.isHighlighted = true;
                mesh.userData.pulseAnimation = pulseAnimation;
                pulseAnimation();
            }
        });
    }

    removeSectionHighlight() {
        this.sectionMeshes.forEach(mesh => {
            if (mesh.userData.originalEmissive !== undefined) {
                mesh.material.emissive.setHex(mesh.userData.originalEmissive);
                mesh.material.emissiveIntensity = 0.4;
                mesh.material.opacity = mesh.userData.originalOpacity;
                mesh.userData.isHighlighted = false;
                delete mesh.userData.pulseAnimation;
            }
        });
    }

    updateBillboards() {
        this.sectionLabels.forEach(label => {
            label.lookAt(this.camera.position);
        });
    }

    update(carPosition) {
        this.checkSectionCollision(carPosition);
        this.updateBillboards();
    }
}


```

**index.html**
```html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Mahammadali Zamani - 3D Resume Portfolio</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <!-- Hint Text -->
    <div id="hint">
        <span id="hint-desktop">⚡ Use WASD to drive into colored sections</span>
        <span id="hint-mobile" style="display: none;">🕹️ Use joystick to drive | Up=Forward | Down=Reverse</span>
    </div>

    <!-- Mobile Section Button -->
    <button id="mobile-section-btn" style="display:none;">
        Open section
    </button>

    <!-- Mobile Touch Controls -->
    <div id="mobile-controls" style="display: none;">
        <div id="virtual-joystick">
            <div class="joystick-base">
                <div class="joystick-knob"></div>
            </div>
        </div>
    </div>

    <!-- Section Info Panel -->
    <div id="section-info">
        <button class="close-btn" onclick="window.hideSectionInfo()" ontouchstart="window.hideSectionInfo()">✕</button>
        <div id="section-content"></div>
    </div>

    <!-- Desktop Controls Hint -->
    <div id="controls">
        use WASD
    </div>

    <!-- Loading Screen -->
    <div id="loading">
        <div class="loading-spinner"></div>
        <div>Loading 3D Environment...</div>
    </div>
    
    <!-- Three.js Import Map -->
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.159.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.159.0/examples/jsm/"
            }
        }
    </script>

    <!-- Main Application -->
    <script type="module" src="js/main.js"></script>
</body>
</html>
```


**styles.css**
```css

/* ==================== RESET & BASE ==================== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow: hidden;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #9b2948 0%, #ff7251 100%);
}

/* ==================== CANVAS ==================== */
canvas {
    position: absolute;
    z-index: 1 !important;
    pointer-events: auto;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
}

/* ==================== UI ELEMENTS ==================== */
#hint, #controls, #loading, #section-info {
    position: fixed !important;
    z-index: 9999 !important;
    pointer-events: auto !important;
}

#hint {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: #ffedbf;
    background: rgba(155, 41, 72, 0.85);
    padding: 10px 20px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 237, 191, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    text-align: center;
}

#controls {
    position: absolute;
    bottom: 20px;
    left: 20px;
    color: #ffedbf;
    z-index: 100;
    font-size: 20px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* ==================== DOWNLOAD RESUME BUTTON ==================== */
#download-resume-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #ff7251 0%, #ff5251 100%);
    color: #ffedbf;
    border: 2px solid rgba(255, 237, 191, 0.3);
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(255, 114, 81, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    gap: 8px;
}

#download-resume-btn:hover {
    background: linear-gradient(135deg, #ff5251 0%, #ff3251 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(255, 114, 81, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

#download-resume-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(255, 114, 81, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Download animation */
#download-resume-btn.downloading {
    background: linear-gradient(135deg, #ffcd74 0%, #ffca7b 100%);
    pointer-events: none;
}

#download-resume-btn.downloading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border: 3px solid rgba(155, 41, 72, 0.3);
    border-radius: 50%;
    border-top-color: #9b2948;
    animation: spin 0.8s linear infinite;
}

/* ==================== LOADING SCREEN ==================== */
#loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #9b2948 0%, #ff7251 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #ffedbf;
    font-size: 24px;
    z-index: 1000;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 237, 191, 0.3);
    border-radius: 50%;
    border-top-color: #ffcd74;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ==================== SECTION INFO PANEL ==================== */
#section-info {
    position: fixed;
    top: 20px;
    right: -400px;
    width: 350px;
    color: #ffedbf;
    background: rgba(155, 41, 72, 0.98);
    padding: 20px;
    border-radius: 12px;
    z-index: 9999;
    max-height: 80vh;
    overflow-y: auto;
    display: block;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 237, 191, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transition: right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    opacity: 1;
    pointer-events: auto;
}

#section-info.show,
#section-info.panel-show {
    right: 20px;
}

#section-content {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

#section-content > * {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.section-content-animate > * {
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
}

.section-content-animate > *:nth-child(1) { animation-delay: 0.1s; }
.section-content-animate > *:nth-child(2) { animation-delay: 0.2s; }
.section-content-animate > *:nth-child(3) { animation-delay: 0.3s; }
.section-content-animate > *:nth-child(4) { animation-delay: 0.4s; }
.section-content-animate > *:nth-child(5) { animation-delay: 0.5s; }
.section-content-animate > *:nth-child(6) { animation-delay: 0.6s; }

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #ff7251;
    color: #ffedbf;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 101;
    transition: background 0.2s ease, transform 0.2s ease;
}

.close-btn:hover {
    background: #ff5251;
    transform: scale(1.1);
}

/* ==================== SECTION CONTENT STYLES ==================== */
.section-title {
    color: #ffcd74;
    margin-bottom: 15px;
    font-size: 1.6em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.project-item {
    background: rgba(255, 114, 81, 0.4);
    padding: 12px 15px;
    margin: 12px 0;
    border-radius: 8px;
    border-left: 4px solid #ffcd74;
    transition: transform 0.3s ease, background 0.3s ease;
}

.project-item:hover {
    background: rgba(255, 114, 81, 0.6);
    transform: translateX(5px);
}

.project-item h4 {
    color: #ffedbf;
    margin-bottom: 5px;
}

.project-item p {
    color: #ffca7b;
    font-size: 0.95em;
    margin-bottom: 5px;
}

.project-item small {
    color: rgba(255, 237, 191, 0.7);
    font-size: 0.85em;
}

.contact-info {
    display: flex;
    align-items: center;
    margin: 10px 0;
    padding: 8px;
    background: rgba(255, 114, 81, 0.3);
    border-radius: 6px;
}

.contact-icon {
    font-size: 20px;
    margin-right: 10px;
    width: 30px;
    text-align: center;
}

.contact-detail {
    flex: 1;
}

.section-info a:hover {
    color: #ffedbf !important;
    border-bottom: 1px solid #ffedbf !important;
    transition: all 0.2s ease;
}

.skill-category {
    margin-bottom: 15px;
}

.skill-category h4 {
    color: #ffcd74;
    margin-bottom: 8px;
}

.skill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.skill-tag {
    background: rgba(255, 114, 81, 0.4);
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 0.9em;
    border: 1px solid rgba(255, 237, 191, 0.2);
}

.profile-photo {
    width: 100%;
    max-width: 250px;
    border-radius: 10px;
    margin: 15px auto;
    display: block;
    border: 3px solid #ffcd74;
}

/* ==================== MOBILE CONTROLS ==================== */
#mobile-controls {
    position: fixed;
    bottom: 40px;
    left: 40px;
    z-index: 100;
    pointer-events: none;
}

#virtual-joystick {
    pointer-events: auto;
}

.joystick-base {
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(255, 237, 191, 0.15) 0%, rgba(155, 41, 72, 0.25) 100%);
    border: 3px solid rgba(255, 237, 191, 0.4);
    border-radius: 50%;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3),
                inset 0 2px 10px rgba(255, 237, 191, 0.1);
    backdrop-filter: blur(10px);
}

.joystick-knob {
    width: 60px;
    height: 60px;
    background: radial-gradient(circle at 30% 30%, #ffcd74 0%, #ff7251 100%);
    border: 3px solid #ffedbf;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4),
                inset 0 2px 4px rgba(255, 255, 255, 0.3);
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    cursor: grab;
}

.joystick-knob.active {
    cursor: grabbing;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5),
                inset 0 2px 4px rgba(255, 255, 255, 0.4),
                0 0 20px rgba(255, 205, 116, 0.5);
    transform: translate(-50%, -50%) scale(1.05);
}

/* Direction indicators on joystick base */
.joystick-base::before,
.joystick-base::after {
    content: '';
    position: absolute;
    background: rgba(255, 237, 191, 0.2);
    border-radius: 2px;
}

.joystick-base::before {
    width: 2px;
    height: 60%;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
}

.joystick-base::after {
    width: 60%;
    height: 2px;
    top: 50%;
    left: 20%;
    transform: translateY(-50%);
}

#touch-indicator {
    width: 80px;
    height: 80px;
    position: relative;
}

.touch-circle {
    width: 60px;
    height: 60px;
    border: 3px solid rgba(255, 237, 191, 0.6);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.2s ease;
}

.touch-circle.active {
    border-color: #ffcd74;
    box-shadow: 0 0 20px rgba(255, 205, 116, 0.6);
    transform: translate(-50%, -50%) scale(1.2);
}

.touch-arrow {
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-bottom: 25px solid rgba(255, 205, 116, 0.7);
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: all 0.2s ease;
}

.touch-arrow.show {
    opacity: 1;
}

.touch-arrow.left {
    transform: translateX(-50%) rotate(-90deg);
}

.touch-arrow.right {
    transform: translateX(-50%) rotate(90deg);
}

#mobile-section-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 18px;
    border-radius: 999px;
    border: none;
    background: #ff7251;
    color: #ffedbf;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    z-index: 10000;
    display: none;
    opacity: 0;
    transform: translateY(10px) scale(0.9);
    transition: opacity 0.25s ease, transform 0.25s ease;
}

#mobile-section-btn.show {
    display: block;
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* ==================== ANIMATIONS ==================== */
.highlighted-section {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.8; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
}

/* ==================== MOBILE RESPONSIVE ==================== */
@media (max-width: 768px) {
    #section-info {
        width: 90%;
        max-width: 350px;
        right: -100%;
        top: 10px;
        max-height: 70vh;
        font-size: 14px;
    }

    #mobile-section-btn {
        right: 50%;
        transform: translateX(50%) translateY(10px) scale(0.9);
        bottom: 25px;
    }

    #mobile-section-btn.show {
        transform: translateX(50%) translateY(0) scale(1);
    }

    #section-info.panel-show {
        right: 5%;
    }

    .section-title {
        font-size: 1.3em;
    }

    .project-item {
        padding: 10px 12px;
        font-size: 0.9em;
    }

    #hint {
        font-size: 14px;
        padding: 8px 15px;
        top: 10px;
    }

    #controls {
        display: none;
    }

    .close-btn {
        width: 35px;
        height: 35px;
        font-size: 20px;
    }

    #download-resume-btn {
        top: 10px;
        right: 10px;
        padding: 10px 16px;
        font-size: 14px;
    }
}

/* Mobile full-screen panel */
@media (max-width: 768px) {
    #section-info {
        width: 100% !important;
        height: 100vh !important;
        max-height: 100vh !important;
        top: 0 !important;
        right: -100% !important;
        left: auto !important;
        bottom: auto !important;
        border-radius: 0 !important;
        padding-top: 60px !important;
        padding-bottom: 20px !important;
        padding-left: 20px !important;
        padding-right: 20px !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
    }
    
    #section-info.panel-show {
        right: 0 !important;
    }
    
    .close-btn {
        width: 50px !important;
        height: 50px !important;
        font-size: 24px !important;
        top: 15px !important;
        right: 15px !important;
        background: #ff7251 !important;
        border: 2px solid #ffedbf !important;
        z-index: 10002 !important;
    }
    
    #section-content {
        padding-top: 10px !important;
    }
    
    .section-title {
        font-size: 1.8em !important;
        margin-bottom: 20px !important;
    }
    
    .project-item {
        padding: 15px !important;
        margin: 15px 0 !important;
        font-size: 16px !important;
    }
    
    .contact-info {
        padding: 12px !important;
        margin: 12px 0 !important;
    }
    
    .skill-tag {
        padding: 8px 12px !important;
        font-size: 14px !important;
    }
}

/* Prevent text selection on mobile */
@media (hover: none) and (pointer: coarse) {
    body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
    }
}


```

