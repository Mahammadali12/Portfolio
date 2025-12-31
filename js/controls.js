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