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

        // Apply engine force when W is pressed
        if (this.keyStates.w) {
            car.accelerate(1.0);
            moving = true;
        }
        
        // Apply brake force when S is pressed
        if (this.keyStates.s) {
            car.brake(1.0);
            moving = true;
        }

        // Apply steering torque for turning
        if (this.keyStates.a) {
            car.turnLeft(1.0);
            turning = true;
        }
        
        if (this.keyStates.d) {
            car.turnRight(1.0);
            turning = true;
        }

        // Update drift state
        car.updateDrift(turning);
        
        // Update visual tilt based on turn direction
        const turnDirection = this.keyStates.a ? 1 : (this.keyStates.d ? -1 : 0);
        car.updateTilt(turnDirection);

        return { moving, turning };
    }
}

// ==================== MOBILE CONTROLS (STEERING WHEEL STYLE) ====================
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
        
        // Dynamic sizing
        this.outerDiameter = 0;
        this.innerDiameter = 0;
        this.thumbSize = CONFIG.MOBILE.CIRCULAR_CONTROL.THUMB_SIZE || 55;
        this.safetyPadding = CONFIG.MOBILE.CIRCULAR_CONTROL.SAFETY_PADDING || 10;
        
        // Path constraints
        this.radiusX = 0;
        this.radiusY = 0;
        
        // Angle tracking - START FROM BOTTOM (90° = π/2)
        this.currentAngle = Math.PI / 2;  // Bottom position
        this.targetAngle = Math.PI / 2;   // Bottom position
        this.carTargetRotation = Math.PI;
        
        // Cumulative angle for steering wheel behavior (no wrapping)
        this.cumulativeAngle = 0;  // Angle from starting position (bottom)
        this.previousRawAngle = Math.PI / 2;  // For calculating rotation delta
        this.maxSteeringRotation = Math.PI * 1.5;  // Max ±270° rotation
        
        // Smooth steering
        this.steeringLerpSpeed = CONFIG.MOBILE.CIRCULAR_CONTROL.STEERING_LERP || 0.12;
        this.returnLerpSpeed = CONFIG.MOBILE.CIRCULAR_CONTROL.RETURN_LERP || 0.08;
        this.returnToCenter = CONFIG.MOBILE.CIRCULAR_CONTROL.RETURN_TO_CENTER !== false;
        
        // Angular tracking for drift detection
        this.previousAngle = this.currentAngle;
        this.angularVelocity = 0;
        
        this.init();
    }

    init() {
        document.getElementById('hint-mobile').style.display = 'inline';
        document.getElementById('hint-desktop').style.display = 'none';
        document.getElementById('mobile-controls').style.display = 'flex';

        this.calculateSizes();
        this.initCircularControl();
    }

    calculateSizes() {
        const screenWidth = window.innerWidth;
        this.outerDiameter = screenWidth - (this.safetyPadding * 2);
        const thumbPadding = 5;
        this.innerDiameter = this.outerDiameter - 2 * (this.thumbSize + thumbPadding);
        this.radiusX = (this.outerDiameter / 2) - (this.thumbSize / 2) - thumbPadding;
        this.radiusY = this.radiusX;
    }

    initCircularControl() {
        this.controlContainer = document.getElementById('circular-control-container');
        this.controlRing = document.querySelector('.control-ring');
        this.controlRingInner = document.querySelector('.control-ring-inner');
        this.controlThumb = document.querySelector('.control-thumb');
        this.directionIndicator = document.querySelector('.direction-indicator');
        
        if (!this.controlContainer || !this.controlRing || !this.controlThumb) {
            console.error('Circular control elements not found!');
            return;
        }

        this.applyDynamicSizes();
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

        this.updateThumbPosition(this.currentAngle);

        this.controlContainer.addEventListener('touchstart', (e) => {
            this.onControlStart(e);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (this.isActive && this.activeTouch !== null) {
                this.onControlMove(e);
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => this.onControlEnd(e), { passive: false });
        document.addEventListener('touchcancel', (e) => this.onControlEnd(e), { passive: false });
    }

    applyDynamicSizes() {
        this.controlContainer.style.width = `${this.outerDiameter}px`;
        this.controlContainer.style.height = `${this.outerDiameter}px`;
        this.controlRing.style.width = `${this.outerDiameter}px`;
        this.controlRing.style.height = `${this.outerDiameter}px`;
        
        if (this.controlRingInner) {
            this.controlRingInner.style.width = `${this.innerDiameter}px`;
            this.controlRingInner.style.height = `${this.innerDiameter}px`;
        }
        
        this.controlThumb.style.width = `${this.thumbSize}px`;
        this.controlThumb.style.height = `${this.thumbSize}px`;
        
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
        
        this.updateAngleFromTouch(touch.clientX, touch.clientY);
        
        // Reset cumulative angle tracking for steering wheel behavior
        this.cumulativeAngle = 0;
        this.previousRawAngle = this.currentAngle;
        
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
        
        this.previousAngle = this.currentAngle;
        const oldRawAngle = this.previousRawAngle;
        
        this.updateAngleFromTouch(touch.clientX, touch.clientY);
        
        // Calculate shortest angular delta for cumulative tracking
        let delta = this.normalizeAngle(this.currentAngle - oldRawAngle);
        this.cumulativeAngle += delta;
        
        // Clamp cumulative angle to max steering rotation
        this.cumulativeAngle = Math.max(-this.maxSteeringRotation, 
                                       Math.min(this.maxSteeringRotation, this.cumulativeAngle));
        
        this.previousRawAngle = this.currentAngle;
        this.angularVelocity = delta;
        this.updateThumbPosition(this.currentAngle);
    }

    updateAngleFromTouch(touchX, touchY) {
        const deltaX = touchX - this.centerX;
        const deltaY = touchY - this.centerY;
        let angle = Math.atan2(deltaY, deltaX);
        this.currentAngle = angle;
        this.targetAngle = angle;
    }

    updateThumbPosition(angle) {
        const thumbX = Math.cos(angle) * this.radiusX;
        const thumbY = Math.sin(angle) * this.radiusY;
        
        this.controlThumb.style.transform = 
            `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
        
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
        
        // Reset cumulative angle when releasing
        this.cumulativeAngle = 0;
        
        if (this.returnToCenter) {
            this.targetAngle = Math.PI / 2; // Return to bottom
            this.previousRawAngle = Math.PI / 2;
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

        if (this.isActive) {
            // Apply engine force for acceleration
            car.accelerate(1.0);
            moving = true;
            
            // Calculate steering input from CUMULATIVE angle (steering wheel behavior)
            // Cumulative angle is relative to starting position (bottom)
            // When thumb moves clockwise (to left), cumulative angle becomes NEGATIVE
            // When thumb moves counter-clockwise (to right), cumulative angle becomes POSITIVE
            
            // For steering wheel feel:
            // Clockwise thumb movement (negative cumulative) = turn RIGHT (positive steering)
            // Counter-clockwise thumb movement (positive cumulative) = turn LEFT (negative steering)
            
            // Map cumulative rotation to steering input (negated for correct direction)
            const steeringInput = -Math.max(-1, Math.min(1, 
                -this.cumulativeAngle / (Math.PI / 2)
            ));
            
            // Apply continuous steering torque based on cumulative rotation
            car.applyContinuousSteering(steeringInput, 1.0);
            
            turning = Math.abs(steeringInput) > 0.1;
            
            // Calculate turn direction and intensity for visual tilt
            const turnDirection = -steeringInput;
            const turnIntensity = Math.abs(steeringInput);
            car.updateTilt(turnDirection * turnIntensity);
            
        } else {
            // When not actively steering, return joystick to center if configured
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
        const drifting = speed > 0.5 && turning;
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