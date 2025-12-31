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