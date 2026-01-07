// ==================== VISUAL EFFECTS ====================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

// ==================== FLOATING OBJECTS ====================
export class FloatingObjectManager {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.loader = new GLTFLoader();
        this.time = 0;
        
        this.initFloatingObjects();
    }

    initFloatingObjects() {
        Object.keys(CONFIG.SECTIONS).forEach((key, index) => {
            const sectionConfig = CONFIG.SECTIONS[key];
            this.createFloatingObject(key, sectionConfig, index);
        });
    }

    createFloatingObject(sectionKey, sectionConfig, index) {
        // Try to load the model, fall back to placeholder if it fails
        this.loader.load(
            sectionConfig.floatingModel,
            (gltf) => {
                console.log(`✓ Loaded model for ${sectionKey}:`, sectionConfig.floatingModel);
                const model = gltf.scene;
                this.setupFloatingObject(model, sectionKey, sectionConfig, index, true);
            },
            (progress) => {
                // Loading progress
            },
            (error) => {
                console.warn(`✗ Failed to load model for ${sectionKey}:`, error);
                console.log(`Using placeholder for ${sectionKey} floating object`);
                const placeholder = this.createPlaceholder(sectionKey, sectionConfig);
                this.setupFloatingObject(placeholder, sectionKey, sectionConfig, index, false);
            }
        );
    }

    createPlaceholder(sectionKey, sectionConfig) {
        const group = new THREE.Group();
        const color = sectionConfig.color;
        
        // Create different placeholder shapes based on section
        let geometry;
        switch(sectionKey) {
            case 'PROFILE':
                // Icosahedron for profile (person-like abstract)
                geometry = new THREE.IcosahedronGeometry(2, 0);
                break;
            case 'EDUCATION':
                // Octahedron for education (book/diamond shape)
                geometry = new THREE.OctahedronGeometry(2, 0);
                break;
            case 'EXPERIENCE':
                // Box for experience (briefcase-like)
                geometry = new THREE.BoxGeometry(3, 2, 2);
                break;
            case 'PROJECTS':
                // Cone for projects (rocket-like)
                geometry = new THREE.ConeGeometry(1.5, 4, 6);
                break;
            case 'SKILLS':
                // Torus for skills (interconnected ring)
                geometry = new THREE.TorusGeometry(1.5, 0.6, 8, 16);
                break;
            default:
                geometry = new THREE.SphereGeometry(2, 16, 16);
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: CONFIG.FLOATING_OBJECTS.EMISSIVE_INTENSITY,
            transparent: true,
            opacity: 0.9,
            shininess: 100
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = false; // Ghost object, no shadow
        mesh.receiveShadow = false;
        group.add(mesh);
        
        // Add wireframe overlay for extra visual interest
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new THREE.Mesh(geometry.clone(), wireframeMaterial);
        wireframe.scale.setScalar(1.05);
        group.add(wireframe);
        
        return group;
    }

    setupFloatingObject(object, sectionKey, sectionConfig, index, isLoadedModel = true) {
        const floatingConfig = CONFIG.FLOATING_OBJECTS;
        
        // Create a wrapper group for positioning in the world
        const wrapper = new THREE.Group();
        
        // Create a pivot group for centering the model (rotation happens here)
        const pivot = new THREE.Group();
        
        if (isLoadedModel) {
            // Reset any existing transforms on the object
            object.position.set(0, 0, 0);
            object.rotation.set(0, 0, 0);
            object.scale.set(1, 1, 1);
            object.updateMatrixWorld(true);
            
            // Calculate bounding box of the loaded model at scale 1
            const box = new THREE.Box3().setFromObject(object);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            
            console.log(`${sectionKey} model - Size:`, size, 'Center:', center);
            
            // Check for valid dimensions
            const maxDimension = Math.max(size.x, size.y, size.z);
            if (maxDimension === 0 || !isFinite(maxDimension)) {
                console.warn(`${sectionKey}: Invalid model dimensions, using default scale`);
                object.scale.setScalar(floatingConfig.SCALE);
            } else {
                // Calculate scale to fit target size
                const scaleFactor = floatingConfig.TARGET_SIZE / maxDimension;
                
                // First, offset the object so its center is at origin (BEFORE scaling)
                // This way, the pivot point becomes the center of the model
                object.position.set(-center.x, -center.y, -center.z);
                
                // Then apply scale to the pivot group (which contains the offset object)
                pivot.scale.setScalar(scaleFactor);
                
                console.log(`${sectionKey}: scaled to ${scaleFactor.toFixed(4)}x, centering offset: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
            }
        } else {
            // Use default scale for placeholders (already centered)
            pivot.scale.setScalar(floatingConfig.SCALE);
        }
        
        // Add object to pivot (pivot handles centering + scale)
        pivot.add(object);
        
        // Add pivot to wrapper (wrapper handles world position)
        wrapper.add(pivot);
        
        // Position the wrapper above the section plate
        wrapper.position.set(
            sectionConfig.position.x,
            floatingConfig.HEIGHT,
            sectionConfig.position.z
        );
        
        // Apply emissive glow to all meshes
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
                
                if (child.material) {
                    // Clone material to avoid affecting other instances
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(m => {
                            const cloned = m.clone();
                            cloned.emissive = new THREE.Color(sectionConfig.color);
                            cloned.emissiveIntensity = floatingConfig.EMISSIVE_INTENSITY;
                            return cloned;
                        });
                    } else {
                        child.material = child.material.clone();
                        child.material.emissive = new THREE.Color(sectionConfig.color);
                        child.material.emissiveIntensity = floatingConfig.EMISSIVE_INTENSITY;
                    }
                }
            }
        });
        
        // Store animation data on the wrapper
        // Store pivot reference for rotation animation
        wrapper.userData = {
            sectionKey: sectionKey,
            baseY: floatingConfig.HEIGHT,
            phaseOffset: index * Math.PI * 0.4,
            pivot: pivot, // Reference to pivot for rotation
            rotationOffset: {
                x: Math.random() * Math.PI * 2,
                y: Math.random() * Math.PI * 2,
                z: Math.random() * Math.PI * 2
            }
        };
        
        this.scene.add(wrapper);
        this.objects.push(wrapper);
        
        console.log(`${sectionKey}: Added to scene at position`, wrapper.position);
    }

    update(deltaTime) {
        const floatingConfig = CONFIG.FLOATING_OBJECTS;
        this.time += deltaTime * 0.001;
        
        this.objects.forEach((wrapper) => {
            const userData = wrapper.userData;
            const phase = this.time + userData.phaseOffset;
            
            // Bobbing motion on the wrapper
            wrapper.position.y = userData.baseY + 
                Math.sin(phase * floatingConfig.BOB_SPEED) * floatingConfig.BOB_AMPLITUDE;
            
            // Rotation animation on the pivot (so it rotates around its center)
            if (userData.pivot) {
                userData.pivot.rotation.y = userData.rotationOffset.y + 
                    this.time * floatingConfig.ROTATION_SPEED_Y;
            }
        });
    }
}