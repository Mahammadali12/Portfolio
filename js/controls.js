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

// ==================== MOBILE CONTROLS ====================
export class MobileControls {
    constructor(renderer) {
        this.renderer = renderer;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.isTouching = false;
        this.touchStartTime = 0;
        this.isReversing = false;
        
        this.touchIndicator = document.querySelector('.touch-circle');
        this.touchArrow = document.querySelector('.touch-arrow');
        
        this.init();
    }

    init() {
        // Show mobile UI
        document.getElementById('hint-mobile').style.display = 'inline';
        document.getElementById('hint-desktop').style.display = 'none';
        document.getElementById('mobile-controls').style.display = 'block';

        // Prevent default touch behaviors on canvas
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.renderer.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Touch start
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const target = e.target;
                
                if (target.closest('#section-info') || target.closest('.close-btn')) {
                    return;
                }

                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
                this.touchCurrentX = touch.clientX;
                this.touchCurrentY = touch.clientY;
                this.isTouching = true;
                this.touchStartTime = Date.now();

                if (this.touchIndicator) {
                    this.touchIndicator.classList.add('active');
                }
            }
        }, { passive: false });

        // Touch move
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isTouching) {
                const touch = e.touches[0];
                this.touchCurrentX = touch.clientX;
                this.touchCurrentY = touch.clientY;

                const deltaX = this.touchCurrentX - this.touchStartX;
                const deltaY = this.touchCurrentY - this.touchStartY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance > CONFIG.MOBILE.SWIPE_THRESHOLD && this.touchArrow) {
                    this.touchArrow.classList.add('show');
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        if (deltaX > 0) {
                            this.touchArrow.classList.remove('right');
                            this.touchArrow.classList.add('left');
                        } else {
                            this.touchArrow.classList.remove('left');
                            this.touchArrow.classList.add('right');
                        }
                    }
                } else if (this.touchArrow) {
                    this.touchArrow.classList.remove('show');
                }
            }
        }, { passive: false });

        // Touch end
        document.addEventListener('touchend', () => {
            this.isTouching = false;
            if (this.touchIndicator) {
                this.touchIndicator.classList.remove('active');
            }
            if (this.touchArrow) {
                this.touchArrow.classList.remove('show');
                this.touchArrow.classList.remove('left');
                this.touchArrow.classList.remove('right');
            }
        }, { passive: false });

        // Touch cancel
        document.addEventListener('touchcancel', () => {
            this.isTouching = false;
            if (this.touchIndicator) {
                this.touchIndicator.classList.remove('active');
            }
            if (this.touchArrow) {
                this.touchArrow.classList.remove('show');
            }
        }, { passive: false });
    }

    update(car) {
        if (!car.isLoaded()) return { moving: false, turning: false };

        let moving = false;
        let turning = false;

        if (this.isTouching) {
            const deltaX = this.touchCurrentX - this.touchStartX;
            const deltaY = this.touchCurrentY - this.touchStartY;
            const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Check if car is stuck at boundary
            const atBoundary = car.isAtBoundary();
            
            // Visual feedback for boundary
            if (atBoundary && this.touchIndicator) {
                this.touchIndicator.style.borderColor = '#ff5252'; // Red when at boundary
            } else if (this.touchIndicator) {
                this.touchIndicator.style.borderColor = ''; // Reset to default
            }
            
            // Detect swipe down for reverse when at boundary
            if (atBoundary && deltaY > CONFIG.MOBILE.SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
                // Swipe down = reverse
                car.brake(1.5); // Stronger reverse at boundary
                this.isReversing = true;
                moving = true;
            } else if (this.isReversing && atBoundary) {
                // Continue reversing if we were reversing
                car.brake(1.5);
                moving = true;
            } else {
                // Normal forward acceleration (only if not at boundary or moving away from it)
                if (!atBoundary || car.getVelocity().length() < 0.1) {
                    car.accelerate();
                    moving = true;
                }
                this.isReversing = false;
            }
            
            // Swipe detection for turning - works independently of movement
            if (swipeDistance > CONFIG.MOBILE.SWIPE_THRESHOLD) {
                const swipeAngle = Math.atan2(deltaY, deltaX);
                const horizontalSwipe = Math.abs(Math.cos(swipeAngle));
                
                // Allow turning even at boundaries
                if (horizontalSwipe > CONFIG.MOBILE.HORIZONTAL_SWIPE_THRESHOLD) {
                    const turnIntensity = Math.min(
                        swipeDistance / 100,
                        CONFIG.MOBILE.TURN_INTENSITY_MAX
                    );
                    
                    // Enhanced turning at boundaries
                    const turnMultiplier = atBoundary ? 1.8 : 1.0;
                    
                    if (deltaX > 0) {
                        car.turnLeft(turnIntensity * turnMultiplier);
                    } else {
                        car.turnRight(turnIntensity * turnMultiplier);
                    }
                    turning = true;
                }
            }
        } else {
            // Reset reverse mode when not touching
            this.isReversing = false;
            
            // Reset indicator color
            if (this.touchIndicator) {
                this.touchIndicator.style.borderColor = '';
            }
        }

        // Mobile drift detection
        const speed = car.getVelocity().length();
        const deltaX = this.touchCurrentX - this.touchStartX;
        const drifting = this.isTouching && 
                        speed > 0.5 && 
                        Math.abs(deltaX) > CONFIG.MOBILE.SWIPE_THRESHOLD * CONFIG.MOBILE.DRIFT_SWIPE_MULTIPLIER;
        
        car.updateDrift(drifting);
        
        const turnDirection = deltaX > 0 ? -1 : (deltaX < 0 ? 1 : 0);
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