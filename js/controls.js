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

// ==================== MOBILE CONTROLS (SMASH BANDITS STYLE) ====================
export class MobileControls {
    constructor(renderer) {
        this.renderer = renderer;
        
        // Circular control elements
        this.controlContainer = null;
        this.controlRing = null;
        this.controlThumb = null;
        this.controlRingInner = null;
        this.directionIndicator = null;
        
        // Control state
        this.isActive = false;
        this.activeTouch = null;
        this.centerX = 0;
        this.centerY = 0;
        
        // Dynamic sizing - will be calculated on init
        this.outerDiameter = 0;
        this.innerDiameter = 0;
        this.thumbSize = CONFIG.MOBILE.CIRCULAR_CONTROL.THUMB_SIZE || 55;
        this.safetyPadding = CONFIG.MOBILE.CIRCULAR_CONTROL.SAFETY_PADDING || 10;
        
        // Path constraints (will be calculated dynamically)
        this.radiusX = 0;
        this.radiusY = 0;
        
        // Angle tracking
        this.currentAngle = -Math.PI / 2; // Start pointing up
        this.targetAngle = -Math.PI / 2;
        this.carTargetRotation = Math.PI; // Match car's initial rotation
        
        // Smooth steering
        this.steeringLerpSpeed = CONFIG.MOBILE.CIRCULAR_CONTROL.STEERING_LERP || 0.12;
        this.returnLerpSpeed = CONFIG.MOBILE.CIRCULAR_CONTROL.RETURN_LERP || 0.08;
        this.returnToCenter = CONFIG.MOBILE.CIRCULAR_CONTROL.RETURN_TO_CENTER !== false;
        
        // Previous angle for turn direction detection
        this.previousAngle = this.currentAngle;
        this.angularVelocity = 0;
        
        this.init();
    }

    init() {
        // Show mobile UI
        document.getElementById('hint-mobile').style.display = 'inline';
        document.getElementById('hint-desktop').style.display = 'none';
        document.getElementById('mobile-controls').style.display = 'flex';

        // Calculate dynamic sizes based on screen width
        this.calculateSizes();
        
        // Initialize circular control
        this.initCircularControl();
    }

    calculateSizes() {
        const screenWidth = window.innerWidth;
        
        // Outer diameter = screen width - safety padding on both sides
        this.outerDiameter = screenWidth - (this.safetyPadding * 2);
        
        // Inner diameter = outer diameter - 2 * (thumb size + small padding)
        const thumbPadding = 5; // Extra padding to prevent thumb overlapping edges
        this.innerDiameter = this.outerDiameter - 2 * (this.thumbSize + thumbPadding);
        
        // Calculate the path radius (where the thumb center travels)
        // Thumb travels on a circle between inner and outer rings
        // Path radius = (outer radius + inner radius) / 2, but we want thumb to stay on outer track
        // So path radius = outer radius - thumb radius - small padding
        this.radiusX = (this.outerDiameter / 2) - (this.thumbSize / 2) - thumbPadding;
        this.radiusY = this.radiusX; // Keep it circular, or make elliptical if needed
    }

    initCircularControl() {
        // Get control elements
        this.controlContainer = document.getElementById('circular-control-container');
        this.controlRing = document.querySelector('.control-ring');
        this.controlRingInner = document.querySelector('.control-ring-inner');
        this.controlThumb = document.querySelector('.control-thumb');
        this.directionIndicator = document.querySelector('.direction-indicator');
        
        if (!this.controlContainer || !this.controlRing || !this.controlThumb) {
            console.error('Circular control elements not found!');
            return;
        }

        // Apply dynamic sizes to elements
        this.applyDynamicSizes();

        // Calculate center position
        this.updateControlCenter();
        
        window.addEventListener('resize', () => {
            this.calculateSizes();
            this.applyDynamicSizes();
            this.updateControlCenter();
            this.updateThumbPosition(this.currentAngle);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.calculateSizes();
                this.applyDynamicSizes();
                this.updateControlCenter();
                this.updateThumbPosition(this.currentAngle);
            }, 100);
        });

        // Initialize thumb position (pointing up)
        this.updateThumbPosition(this.currentAngle);

        // Touch events on the control area
        this.controlContainer.addEventListener('touchstart', (e) => {
            this.onControlStart(e);
        }, { passive: false });

        // Touch move - listen on document for smooth dragging outside bounds
        document.addEventListener('touchmove', (e) => {
            if (this.isActive && this.activeTouch !== null) {
                this.onControlMove(e);
            }
        }, { passive: false });

        // Touch end - listen on document
        document.addEventListener('touchend', (e) => this.onControlEnd(e), { passive: false });
        document.addEventListener('touchcancel', (e) => this.onControlEnd(e), { passive: false });
    }

    applyDynamicSizes() {
        // Apply sizes to container
        this.controlContainer.style.width = `${this.outerDiameter}px`;
        this.controlContainer.style.height = `${this.outerDiameter}px`;
        
        // Apply sizes to outer ring
        this.controlRing.style.width = `${this.outerDiameter}px`;
        this.controlRing.style.height = `${this.outerDiameter}px`;
        
        // Apply sizes to inner ring
        if (this.controlRingInner) {
            this.controlRingInner.style.width = `${this.innerDiameter}px`;
            this.controlRingInner.style.height = `${this.innerDiameter}px`;
        }
        
        // Thumb size stays constant
        this.controlThumb.style.width = `${this.thumbSize}px`;
        this.controlThumb.style.height = `${this.thumbSize}px`;
        
        // Update the track indicator (dashed circle showing thumb path)
        const trackDiameter = this.radiusX * 2;
        this.controlRing.style.setProperty('--track-diameter', `${trackDiameter}px`);
    }

    updateControlCenter() {
        const rect = this.controlContainer.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
    }

    onControlStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.changedTouches[0];
        if (!touch) return;
        
        this.isActive = true;
        this.activeTouch = touch.identifier;
        this.controlThumb.classList.add('active');
        this.controlRing.classList.add('active');
        this.updateControlCenter();
        
        // Calculate initial angle from touch position
        this.updateAngleFromTouch(touch.clientX, touch.clientY);
        this.updateThumbPosition(this.currentAngle);
    }

    onControlMove(e) {
        if (!this.isActive) return;
        
        let touch = null;
        for (let t of e.touches) {
            if (t.identifier === this.activeTouch) {
                touch = t;
                break;
            }
        }
        
        if (!touch) return;
        
        e.preventDefault();
        
        // Store previous angle for velocity calculation
        this.previousAngle = this.currentAngle;
        
        // Update angle from touch
        this.updateAngleFromTouch(touch.clientX, touch.clientY);
        
        // Calculate angular velocity for drift detection
        this.angularVelocity = this.normalizeAngle(this.currentAngle - this.previousAngle);
        
        // Update visual position
        this.updateThumbPosition(this.currentAngle);
    }

    updateAngleFromTouch(touchX, touchY) {
        const deltaX = touchX - this.centerX;
        const deltaY = touchY - this.centerY;
        
        // Calculate angle (atan2 gives us the angle from center to touch)
        let angle = Math.atan2(deltaY, deltaX);
        
        this.currentAngle = angle;
        this.targetAngle = angle;
    }

    updateThumbPosition(angle) {
        // Calculate position on circular/elliptical path
        const thumbX = Math.cos(angle) * this.radiusX;
        const thumbY = Math.sin(angle) * this.radiusY;
        
        // Update thumb visual position (relative to center)
        this.controlThumb.style.transform = 
            `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
        
        // Update direction indicator rotation if it exists
        if (this.directionIndicator) {
            const indicatorAngle = angle + Math.PI / 2;
            this.directionIndicator.style.transform = `rotate(${indicatorAngle}rad)`;
        }
    }

    onControlEnd(e) {
        let touchEnded = false;
        for (let touch of e.changedTouches) {
            if (touch.identifier === this.activeTouch) {
                touchEnded = true;
                break;
            }
        }
        
        if (!touchEnded) return;
        
        this.isActive = false;
        this.activeTouch = null;
        this.angularVelocity = 0;
        this.controlThumb.classList.remove('active');
        this.controlRing.classList.remove('active');
        
        // Optionally return thumb to center (up position)
        if (this.returnToCenter) {
            this.targetAngle = -Math.PI / 2;
        }
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    lerpAngle(from, to, t) {
        let diff = this.normalizeAngle(to - from);
        return from + diff * t;
    }

    update(car) {
        if (!car.isLoaded()) return { moving: false, turning: false };

        let moving = false;
        let turning = false;

        // MODIFICATION 1: Accelerate when joystick is held (isActive)
        if (this.isActive) {
            car.accelerate(1.0);
            moving = true;
            
            // FIX: Reverse control - negate the angle to make clockwise joystick = clockwise car turn
            const targetCarRotation = -(this.currentAngle + Math.PI / 2);
            
            // Smoothly interpolate car rotation
            this.carTargetRotation = this.lerpAngle(
                this.carTargetRotation, 
                targetCarRotation, 
                this.steeringLerpSpeed
            );
            
            car.mesh.rotation.y = this.carTargetRotation;
            turning = true;
            
            // Calculate turn direction for visual tilt
            const turnDirection = Math.sign(this.angularVelocity);
            const turnIntensity = Math.min(Math.abs(this.angularVelocity) * 10, 1);
            car.updateTilt(turnDirection * turnIntensity);
            
        } else {
            // When not actively steering, optionally return joystick to center
            if (this.returnToCenter) {
                this.currentAngle = this.lerpAngle(
                    this.currentAngle, 
                    this.targetAngle, 
                    this.returnLerpSpeed
                );
                this.updateThumbPosition(this.currentAngle);
            }
            
            car.updateTilt(0);
        }

        // Update drift state based on speed and turning intensity
        const speed = car.getVelocity().length();
        const drifting = speed > 0.5 && turning && Math.abs(this.angularVelocity) > 0.02;
        car.updateDrift(drifting);

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