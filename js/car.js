// ==================== CAR SYSTEM ====================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG, isMobile } from './config.js';

export class Car {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        
        // === MOMENTUM-BASED PHYSICS PROPERTIES ===
        // Mass and inertia
        this.mass = CONFIG.PHYSICS.CAR_MASS;
        this.momentOfInertia = CONFIG.PHYSICS.MOMENT_OF_INERTIA;
        
        // Linear motion
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.forces = new THREE.Vector3(0, 0, 0);
        
        // Angular motion
        this.angularVelocity = 0;           // Current rotation speed (rad/frame)
        this.angularAcceleration = 0;        // Angular acceleration
        this.torque = 0;                     // Accumulated torque
        this.steeringAngle = 0;              // Current steering wheel angle
        
        // Traction and drift
        this.currentTraction = CONFIG.PHYSICS.TRACTION_COEFFICIENT;
        this.isDrifting = false;
        this.driftAngle = 0;
        this.lateralVelocity = new THREE.Vector3(0, 0, 0);
        
        // State flags
        this.isAccelerating = false;
        this.isBraking = false;
        this.isTurning = false;
        this.isReversing = false;          // NEW: track reverse state
        
        // Weight transfer (for realistic feel)
        this.weightTransfer = { front: 0.5, rear: 0.5, left: 0.5, right: 0.5 };
        
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

    // === HELPER METHODS ===
    
    getForwardDirection() {
        return new THREE.Vector3(
            -Math.sin(this.mesh.rotation.y),
            0,
            -Math.cos(this.mesh.rotation.y)
        );
    }

    getRightDirection() {
        return new THREE.Vector3(
            -Math.cos(this.mesh.rotation.y),
            0,
            Math.sin(this.mesh.rotation.y)
        );
    }

    getSpeed() {
        return this.velocity.length();
    }

    /**
     * Get speed in the forward direction (positive = forward, negative = reverse)
     */
    getForwardSpeed() {
        const forward = this.getForwardDirection();
        return -this.velocity.dot(forward); // Negative because forward is in -Z direction
    }

    // === FORCE APPLICATION METHODS ===
    
    /**
     * Apply a force to the car (accumulates until next physics update)
     * @param {THREE.Vector3} force - Force vector in Newtons
     */
    applyForce(force) {
        this.forces.add(force);
    }

    /**
     * Apply torque for rotation
     * @param {number} torqueAmount - Torque in N·m
     */
    applyTorque(torqueAmount) {
        this.torque += torqueAmount;
    }

    /**
     * Engine force - applies forward thrust
     * @param {number} intensity - 0 to 1 throttle intensity
     */
    accelerate(intensity = 1) {
        const forward = this.getForwardDirection();
        let engineForce = CONFIG.PHYSICS.ENGINE_FORCE * intensity;
        
        // Apply mobile multiplier for responsiveness
        if (isMobile) {
            engineForce *= CONFIG.MOBILE.ENGINE_FORCE_MULTIPLIER;
        }
        
        // Apply force in forward direction (negative because of coordinate system)
        const thrustForce = forward.clone().multiplyScalar(-engineForce);
        this.applyForce(thrustForce);
        
        // Weight transfer: accelerating shifts weight to rear
        this.weightTransfer.rear = 0.6;
        this.weightTransfer.front = 0.4;
        
        this.isAccelerating = true;
        this.isReversing = false;
    }

    /**
     * Brake/Reverse force - brakes if moving forward, reverses if stopped
     * @param {number} intensity - 0 to 1 brake intensity
     */
    brake(intensity = 1) {
        const forward = this.getForwardDirection();
        const forwardSpeed = this.getForwardSpeed();
        const speed = this.getSpeed();
        
        // If moving forward (forwardSpeed > 0), apply braking force
        if (forwardSpeed > 0.05) {
            // Apply brake force opposite to velocity
            let brakeForce = CONFIG.PHYSICS.BRAKE_FORCE * intensity;
            
            if (isMobile) {
                brakeForce *= CONFIG.MOBILE.ENGINE_FORCE_MULTIPLIER;
            }
            
            const brakeDirection = this.velocity.clone().normalize();
            const brakingForce = brakeDirection.multiplyScalar(-brakeForce);
            this.applyForce(brakingForce);
            
            // Weight transfer: braking shifts weight to front
            this.weightTransfer.front = 0.7;
            this.weightTransfer.rear = 0.3;
            
            this.isBraking = true;
            this.isReversing = false;
        } 
        // If nearly stopped or moving backward, allow reverse
        else {
            // Check if we're at max reverse speed
            const maxReverseSpeed = CONFIG.PHYSICS.MAX_REVERSE_SPEED;
            const reverseSpeed = Math.abs(Math.min(forwardSpeed, 0));
            
            if (reverseSpeed < maxReverseSpeed) {
                let reverseForce = CONFIG.PHYSICS.REVERSE_FORCE * intensity;
                
                if (isMobile) {
                    reverseForce *= CONFIG.MOBILE.ENGINE_FORCE_MULTIPLIER;
                }
                
                // Apply reverse force (positive in forward direction = backward movement)
                const reverseThrustForce = forward.clone().multiplyScalar(reverseForce);
                this.applyForce(reverseThrustForce);
            }
            
            // Weight transfer for reverse
            this.weightTransfer.front = 0.4;
            this.weightTransfer.rear = 0.6;
            
            this.isBraking = false;
            this.isReversing = true;
        }
    }

    /**
     * Apply steering torque to rotate the car
     * @param {number} direction - -1 (left) to 1 (right)
     * @param {number} intensity - 0 to 1 steering intensity
     */
    applySteeringTorque(direction, intensity = 1) {
        const speed = this.getSpeed();
        
        // Steering effectiveness depends on speed
        // At low speed: direct rotation
        // At high speed: lateral forces create rotation
        const speedFactor = Math.min(speed / 1.5, 1);
        const lowSpeedSteering = 1 - speedFactor;
        const highSpeedSteering = speedFactor;
        
        let steeringForce = CONFIG.PHYSICS.STEERING_FORCE * intensity;
        if (isMobile) {
            steeringForce *= CONFIG.MOBILE.STEERING_FORCE_MULTIPLIER;
        }
        
        // Reverse steering direction when reversing
        const forwardSpeed = this.getForwardSpeed();
        const steeringDirection = forwardSpeed < -0.1 ? -direction : direction;
        
        // Low speed: direct torque for tight turns
        if (lowSpeedSteering > 0.1) {
            const directTorque = steeringDirection * steeringForce * 0.5 * lowSpeedSteering;
            this.applyTorque(directTorque);
        }
        
        // High speed: lateral force creates natural rotation
        if (highSpeedSteering > 0.1 && speed > 0.1) {
            const rightDir = this.getRightDirection();
            const lateralForce = rightDir.clone().multiplyScalar(
                steeringDirection * steeringForce * highSpeedSteering * this.currentTraction
            );
            this.applyForce(lateralForce);
            
            // Also apply some torque for responsiveness
            const torqueFromLateral = steeringDirection * steeringForce * 0.3 * highSpeedSteering;
            this.applyTorque(torqueFromLateral);
        }
        
        // Weight transfer: turning shifts weight to outside wheels
        if (direction > 0) {
            this.weightTransfer.left = 0.6;
            this.weightTransfer.right = 0.4;
        } else if (direction < 0) {
            this.weightTransfer.left = 0.4;
            this.weightTransfer.right = 0.6;
        }
        
        this.steeringAngle = direction * intensity;
        this.isTurning = true;
    }

    /**
     * Legacy turn methods for desktop controls compatibility
     */
    turnLeft(intensity = 1) {
        this.applySteeringTorque(1, intensity);
    }

    turnRight(intensity = 1) {
        this.applySteeringTorque(-1, intensity);
    }

    /**
     * Direct rotation control for mobile (applies torque to reach target)
     * @param {number} targetRotation - Target rotation in radians
     * @param {number} lerpFactor - How fast to approach target
     */
    setTargetRotation(targetRotation, lerpFactor = 0.15) {
        if (!this.mesh) return;
        
        // Calculate angle difference
        let angleDiff = targetRotation - this.mesh.rotation.y;
        
        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Apply torque proportional to angle difference
        let torqueMultiplier = CONFIG.PHYSICS.STEERING_FORCE * 0.8;
        if (isMobile) {
            torqueMultiplier *= CONFIG.MOBILE.TORQUE_MULTIPLIER;
        }
        
        const torque = angleDiff * torqueMultiplier * lerpFactor;
        this.applyTorque(torque);
        
        // Determine turn direction for drift and tilt
        this.steeringAngle = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1);
        this.isTurning = Math.abs(angleDiff) > 0.05;
    }

    // === PHYSICS CALCULATION METHODS ===

    /**
     * Calculate current traction based on speed
     */
    calculateTraction() {
        const speed = this.getSpeed();
        const maxSpeed = CONFIG.PHYSICS.MAX_SPEED;
        const speedRatio = speed / maxSpeed;
        
        // Traction decreases with speed
        const tractionLoss = speedRatio * CONFIG.PHYSICS.TRACTION_SPEED_FALLOFF;
        this.currentTraction = Math.max(
            CONFIG.PHYSICS.MIN_TRACTION,
            CONFIG.PHYSICS.TRACTION_COEFFICIENT - tractionLoss
        );
        
        // Further reduce traction if drifting
        if (this.isDrifting) {
            this.currentTraction *= 0.7;
        }
        
        return this.currentTraction;
    }

    /**
     * Apply drag forces (air resistance + rolling resistance)
     */
    applyDragForces() {
        const speed = this.getSpeed();
        if (speed < 0.001) return;
        
        const velocityDir = this.velocity.clone().normalize();
        
        // Air drag: F = 0.5 * Cd * v²
        // Simplified: drag increases quadratically with speed
        const dragCoeff = CONFIG.PHYSICS.DRAG_COEFFICIENT;
        const dragMagnitude = dragCoeff * speed * speed * this.mass * 0.01;
        const dragForce = velocityDir.clone().multiplyScalar(-dragMagnitude);
        this.applyForce(dragForce);
        
        // Rolling resistance: constant force opposing motion
        const rollingResistance = CONFIG.PHYSICS.ROLLING_RESISTANCE;
        const rollingForce = velocityDir.clone().multiplyScalar(-rollingResistance);
        this.applyForce(rollingForce);
    }

    /**
     * Apply lateral friction (tire grip)
     */
    applyLateralFriction() {
        const speed = this.getSpeed();
        if (speed < 0.01) return;
        
        // Calculate lateral (sideways) velocity component
        const forward = this.getForwardDirection();
        const right = this.getRightDirection();
        
        // Project velocity onto right direction to get lateral component
        const lateralSpeed = this.velocity.dot(right);
        this.lateralVelocity.copy(right).multiplyScalar(lateralSpeed);
        
        // Apply friction force opposing lateral motion (tire grip)
        const lateralFriction = this.lateralVelocity.clone().multiplyScalar(
            -this.currentTraction * this.mass * 0.1
        );
        
        // In drift mode, reduce lateral friction for sliding
        if (this.isDrifting) {
            lateralFriction.multiplyScalar(CONFIG.PHYSICS.DRIFT_MOMENTUM_PRESERVATION);
        }
        
        this.applyForce(lateralFriction);
    }

    /**
     * Integrate forces into acceleration, then velocity
     * F = ma, therefore a = F/m
     */
    integrateForces() {
        // Linear: a = F / m
        this.acceleration.copy(this.forces).divideScalar(this.mass);
        
        // Add acceleration to velocity
        this.velocity.add(this.acceleration);
        
        // Angular: α = τ / I
        this.angularAcceleration = this.torque / this.momentOfInertia;
        
        // Add angular acceleration to angular velocity
        this.angularVelocity += this.angularAcceleration;
        
        // Apply angular drag
        this.angularVelocity *= CONFIG.PHYSICS.ANGULAR_DRAG;
        
        // Clamp angular velocity
        const maxAngular = CONFIG.PHYSICS.MAX_ANGULAR_VELOCITY;
        this.angularVelocity = Math.max(-maxAngular, Math.min(maxAngular, this.angularVelocity));
    }

    /**
     * Clear force accumulators for next frame
     */
    clearForces() {
        this.forces.set(0, 0, 0);
        this.torque = 0;
        this.acceleration.set(0, 0, 0);
        this.angularAcceleration = 0;
    }

    /**
     * Limit maximum speed (forward and reverse)
     */
    limitSpeed() {
        const forwardSpeed = this.getForwardSpeed();
        const speed = this.getSpeed();
        
        // Limit forward speed
        if (forwardSpeed > 0 && speed > CONFIG.PHYSICS.MAX_SPEED) {
            this.velocity.setLength(CONFIG.PHYSICS.MAX_SPEED);
        }
        
        // Limit reverse speed
        if (forwardSpeed < 0 && speed > CONFIG.PHYSICS.MAX_REVERSE_SPEED) {
            this.velocity.setLength(CONFIG.PHYSICS.MAX_REVERSE_SPEED);
        }
    }

    /**
     * Check and handle boundary collisions
     */
    checkBoundaries() {
        const { minX, maxX, minZ, maxZ } = CONFIG.SCENE.BOUNDARY;
        const newX = this.mesh.position.x + this.velocity.x;
        const newZ = this.mesh.position.z + this.velocity.z;
        
        let collided = false;
        
        // Check X boundaries
        if (newX <= minX || newX >= maxX) {
            this.velocity.x *= CONFIG.PHYSICS.BOUNCE_DAMPING;
            this.velocity.z *= CONFIG.PHYSICS.COLLISION_FRICTION;
            this.angularVelocity *= 0.5; // Reduce spin on collision
            collided = true;
        }
        
        // Check Z boundaries
        if (newZ <= minZ || newZ >= maxZ) {
            this.velocity.z *= CONFIG.PHYSICS.BOUNCE_DAMPING;
            this.velocity.x *= CONFIG.PHYSICS.COLLISION_FRICTION;
            this.angularVelocity *= 0.5;
            collided = true;
        }
        
        // Apply position with boundary clamping
        this.mesh.position.x = Math.max(minX + 0.5, Math.min(maxX - 0.5, newX));
        this.mesh.position.z = Math.max(minZ + 0.5, Math.min(maxZ - 0.5, newZ));
        
        return !collided;
    }

    /**
     * Apply rotation from angular velocity
     */
    applyRotation() {
        this.mesh.rotation.y += this.angularVelocity;
    }

    // === DRIFT PHYSICS ===

    /**
     * Update drift state based on current physics
     * @param {boolean} isTurning - Whether player is actively steering
     */
    updateDrift(isTurning) {
        const speed = this.getSpeed();
        const driftThreshold = CONFIG.PHYSICS.DRIFT_THRESHOLD;
        
        // Calculate angle between velocity and forward direction
        if (speed > 0.1) {
            const forward = this.getForwardDirection();
            const velocityDir = this.velocity.clone().normalize();
            const dot = forward.dot(velocityDir);
            const angleDiff = Math.acos(Math.max(-1, Math.min(1, dot)));
            
            // Enter drift if turning at speed with significant angle
            const shouldDrift = speed > driftThreshold && 
                               isTurning && 
                               angleDiff > CONFIG.PHYSICS.DRIFT_ANGLE_THRESHOLD;
            
            if (shouldDrift && !this.isDrifting) {
                this.isDrifting = true;
            } else if (!isTurning && this.isDrifting) {
                // Exit drift gradually when not turning
                this.isDrifting = false;
            }
        } else {
            this.isDrifting = false;
        }
    }

    /**
     * Update visual tilt based on turning
     * @param {number} turnDirection - -1 to 1 indicating turn direction/intensity
     */
    updateTilt(turnDirection) {
        const speed = this.getSpeed();
        const speedFactor = Math.min(speed / 1.5, 1);
        
        if (this.isDrifting) {
            // More dramatic tilt when drifting
            this.driftAngle = turnDirection * 0.4 * speedFactor;
        } else {
            // Subtle tilt based on lateral g-force
            this.driftAngle = turnDirection * 0.15 * speedFactor;
        }
        
        // Smoothly apply tilt
        const targetTilt = this.driftAngle * 0.3;
        this.mesh.rotation.z += (targetTilt - this.mesh.rotation.z) * 0.1;
    }

    // === CHECK BOUNDARY PROXIMITY ===
    
    isAtBoundary() {
        if (!this.mesh) return false;
        const { minX, maxX, minZ, maxZ } = CONFIG.SCENE.BOUNDARY;
        const pos = this.mesh.position;
        const threshold = 3;
        
        return pos.x <= minX + threshold || pos.x >= maxX - threshold ||
               pos.z <= minZ + threshold || pos.z >= maxZ - threshold;
    }

    // === MAIN UPDATE LOOP ===

    /**
     * Main physics update - called every frame
     * Implements: Force accumulation → Integration → Position update → Clear
     */
    update() {
        if (!this.mesh) return false;

        // 1. Calculate traction (affects all force applications)
        this.calculateTraction();
        
        // 2. Apply environmental forces
        this.applyDragForces();
        this.applyLateralFriction();
        
        // 3. Integrate forces into velocity (F = ma)
        this.integrateForces();
        
        // 4. Limit maximum speed
        this.limitSpeed();
        
        // 5. Apply rotation from angular velocity
        this.applyRotation();
        
        // 6. Apply position from velocity and check boundaries
        const moved = this.checkBoundaries();
        
        // 7. Clear force accumulators for next frame
        this.clearForces();
        
        // 8. Reset weight transfer gradually
        this.weightTransfer.front += (0.5 - this.weightTransfer.front) * 0.1;
        this.weightTransfer.rear += (0.5 - this.weightTransfer.rear) * 0.1;
        this.weightTransfer.left += (0.5 - this.weightTransfer.left) * 0.1;
        this.weightTransfer.right += (0.5 - this.weightTransfer.right) * 0.1;
        
        // 9. Reset state flags
        this.isAccelerating = false;
        this.isBraking = false;
        this.isTurning = false;
        this.isReversing = false;
        
        return moved;
    }

    // === GETTERS ===

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