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
            -Math.sin(this.mesh.rotation.y),
            0,
            -Math.cos(this.mesh.rotation.y)
        );
    }

    accelerate(intensity = 1) {
        const forward = this.getForwardDirection();
        this.velocity.add(forward.clone().multiplyScalar(-CONFIG.PHYSICS.CAR_ACCELERATION * 0.1 * intensity));
        this.isAccelerating = true;
    }

    brake(intensity = 1) {
        const forward = this.getForwardDirection();
        this.velocity.add(forward.clone().multiplyScalar(CONFIG.PHYSICS.CAR_ACCELERATION * 0.08 * intensity));
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
        
        // Check if trying to move outside boundaries
        let hitBoundary = false;
        let correctedX = newX;
        let correctedZ = newZ;
        
        if (newX <= minX) {
            correctedX = minX + 0.5; // Small buffer from wall
            hitBoundary = true;
        } else if (newX >= maxX) {
            correctedX = maxX - 0.5;
            hitBoundary = true;
        }
        
        if (newZ <= minZ) {
            correctedZ = minZ + 0.5;
            hitBoundary = true;
        } else if (newZ >= maxZ) {
            correctedZ = maxZ - 0.5;
            hitBoundary = true;
        }
        
        if (hitBoundary) {
            // Stop the car and position it slightly away from wall
            this.mesh.position.x = correctedX;
            this.mesh.position.z = correctedZ;
            // Zero out velocity to prevent pushing against wall
            this.velocity.set(0, 0, 0);
            return false;
        } else {
            // Normal movement
            this.mesh.position.x = newX;
            this.mesh.position.z = newZ;
            return true;
        }
    }
    
    isAtBoundary() {
        const { minX, maxX, minZ, maxZ } = CONFIG.SCENE.BOUNDARY;
        const pos = this.mesh.position;
        const threshold = 2; // Distance from wall to consider "at boundary"
        
        return pos.x <= minX + threshold || pos.x >= maxX - threshold ||
               pos.z <= minZ + threshold || pos.z >= maxZ - threshold;
    }

    updateDrift(isTurning) {
        const speed = this.velocity.length();
        this.isDrifting = speed > 0.5 && isTurning;

        if (this.isDrifting) {
            const velocityDir = this.velocity.clone().normalize();
            const forward = this.getForwardDirection();
            const blendedDir = velocityDir.lerp(forward, 0.08);
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