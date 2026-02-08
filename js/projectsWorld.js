
// ==================== PROJECTS WORLD MANAGER ====================

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { projectsData } from './projects.js';

export class ProjectsWorldManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.group = sceneManager.projectsWorldGroup;
        
        // Garage data
        this.garages = []; // { id, mesh, door, doorPivot, artifact, position, rotationY, doorState, doorProgress, artifactVisible, artifactProgress }
        this.exitPortal = null;
        this.exitPortalPosition = new THREE.Vector3();
        
        // Animation time
        this.time = 0;
        
        this.build();
    }

    build() {
        this.buildGround();
        this.buildGarages();
        this.buildExitPortal();
        this.buildLighting();
    }

    // ==================== GROUND ====================
    buildGround() {
        const size = CONFIG.PROJECTS_WORLD.GROUND_SIZE;
        
        // Main ground
        const groundGeometry = new THREE.PlaneGeometry(size, size);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a0a2e,
            side: THREE.DoubleSide,
            shininess: 30
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = Math.PI / 2;
        ground.receiveShadow = true;
        this.group.add(ground);

        // Grid for projects world (different color)
        const gridHelper = new THREE.GridHelper(size, 24, 0x9b2948, 0x9b2948);
        gridHelper.position.y = 0.01;
        gridHelper.material.opacity = 0.2;
        gridHelper.material.transparent = true;
        this.group.add(gridHelper);

        // Circular ring marker where garages sit
        const ringGeometry = new THREE.RingGeometry(
            CONFIG.PROJECTS_WORLD.RADIUS - 1,
            CONFIG.PROJECTS_WORLD.RADIUS + 1,
            64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff7251,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        this.group.add(ring);
    }

    // ==================== LIGHTING ====================
    buildLighting() {
        // Additional point lights for atmosphere
        const colors = [0xff7251, 0x9b2948, 0xffcd74, 0x00bfff];
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const light = new THREE.PointLight(colors[i], 0.5, 60);
            light.position.set(
                Math.cos(angle) * CONFIG.PROJECTS_WORLD.RADIUS * 0.6,
                12,
                Math.sin(angle) * CONFIG.PROJECTS_WORLD.RADIUS * 0.6
            );
            this.group.add(light);
        }

        // Central overhead light
        const centerLight = new THREE.PointLight(0xffedbf, 0.8, 80);
        centerLight.position.set(0, 20, 0);
        this.group.add(centerLight);
    }

    // ==================== GARAGES ====================
    buildGarages() {
        const pw = CONFIG.PROJECTS_WORLD;
        const center = pw.CENTER;
        const radius = pw.RADIUS;
        const count = projectsData.length;

        for (let i = 0; i < count; i++) {
            const project = projectsData[i];
            const angle = (i / count) * Math.PI * 2;
            const x = center.x + Math.cos(angle) * radius;
            const z = center.z + Math.sin(angle) * radius;
            const rotationY = angle + Math.PI; // Face center

            const garage = this.buildSingleGarage(project, x, z, rotationY);
            this.garages.push(garage);
        }
    }

    buildSingleGarage(project, x, z, rotationY) {
        const gs = CONFIG.PROJECTS_WORLD.GARAGE_SIZE;
        const garageGroup = new THREE.Group();
        garageGroup.position.set(x, 0, z);
        garageGroup.rotation.y = rotationY;

        const accentColor = project.accentColor || 0xff7251;

        // === WALLS (open front) ===
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a1040,
            emissive: 0x1a0830,
            emissiveIntensity: 0.2
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(gs.width, gs.height, 0.5),
            wallMaterial
        );
        backWall.position.set(0, gs.height / 2, -gs.depth / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        garageGroup.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, gs.height, gs.depth),
            wallMaterial
        );
        leftWall.position.set(-gs.width / 2, gs.height / 2, 0);
        leftWall.castShadow = true;
        garageGroup.add(leftWall);

        // Right wall
        const rightWall = leftWall.clone();
        rightWall.position.set(gs.width / 2, gs.height / 2, 0);
        garageGroup.add(rightWall);

        // Roof
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(gs.width + 1, 0.5, gs.depth + 1),
            new THREE.MeshPhongMaterial({
                color: 0x3a1c60,
                emissive: 0x1a0830,
                emissiveIntensity: 0.1
            })
        );
        roof.position.set(0, gs.height, 0);
        roof.castShadow = true;
        garageGroup.add(roof);

        // Floor
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(gs.width, 0.2, gs.depth),
            new THREE.MeshPhongMaterial({
                color: 0x1a0a2e,
                emissive: accentColor,
                emissiveIntensity: 0.05
            })
        );
        floor.position.set(0, 0.1, 0);
        floor.receiveShadow = true;
        garageGroup.add(floor);

        // === EMISSIVE TRIM STRIPS ===
        const trimMaterial = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.8
        });

        // Bottom trim on front face
        const bottomTrim = new THREE.Mesh(
            new THREE.BoxGeometry(gs.width + 0.5, 0.3, 0.3),
            trimMaterial
        );
        bottomTrim.position.set(0, 0.15, gs.depth / 2);
        garageGroup.add(bottomTrim);

        // Top trim on front face
        const topTrim = bottomTrim.clone();
        topTrim.position.set(0, gs.height, gs.depth / 2);
        garageGroup.add(topTrim);

        // Vertical trims on front edges
        const vertTrimLeft = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, gs.height, 0.3),
            trimMaterial
        );
        vertTrimLeft.position.set(-gs.width / 2, gs.height / 2, gs.depth / 2);
        garageGroup.add(vertTrimLeft);

        const vertTrimRight = vertTrimLeft.clone();
        vertTrimRight.position.set(gs.width / 2, gs.height / 2, gs.depth / 2);
        garageGroup.add(vertTrimRight);

        // === DOOR (pivot-based for hinge animation) ===
        const doorPivot = new THREE.Group();
        doorPivot.position.set(-gs.width / 2 + 0.25, 0, gs.depth / 2); // Hinge on left edge

        const door = new THREE.Mesh(
            new THREE.BoxGeometry(gs.width, gs.height - 0.5, 0.3),
            new THREE.MeshPhongMaterial({
                color: 0x4a2070,
                emissive: accentColor,
                emissiveIntensity: 0.15,
                transparent: true,
                opacity: 0.9
            })
        );
        // Position door relative to pivot (center of door offset from hinge)
        door.position.set(gs.width / 2 - 0.25, gs.height / 2, 0);
        doorPivot.add(door);
        garageGroup.add(doorPivot);

        // === PROJECT TITLE LABEL (above door) ===
        const labelCanvas = document.createElement('canvas');
        const ctx = labelCanvas.getContext('2d');
        labelCanvas.width = 512;
        labelCanvas.height = 128;
        ctx.fillStyle = 'transparent';
        ctx.clearRect(0, 0, 512, 128);
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#ffedbf';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = `#${accentColor.toString(16).padStart(6, '0')}`;
        ctx.shadowBlur = 15;
        ctx.fillText(project.title, 256, 50);
        ctx.font = '22px Arial';
        ctx.fillStyle = '#ffca7b';
        ctx.shadowBlur = 8;
        ctx.fillText(project.tagline, 256, 90);

        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(gs.width + 2, 3),
            new THREE.MeshBasicMaterial({
                map: labelTexture,
                transparent: true,
                side: THREE.DoubleSide,
                depthTest: false
            })
        );
        label.position.set(0, gs.height + 2, gs.depth / 2);
        garageGroup.add(label);

        // === ARTIFACT (hidden initially) ===
        const artifact = this.buildArtifact(project.artifactType, accentColor);
        artifact.position.set(0, 0, -gs.depth / 4);
        artifact.visible = false;
        artifact.scale.set(0, 0, 0);
        garageGroup.add(artifact);

        // === TROPHY PLAQUES (inside, on back wall) ===
        const trophies = this.buildTrophyPlaques(project.trophies, accentColor, gs);
        trophies.forEach(t => garageGroup.add(t));

        // Interior light
        const interiorLight = new THREE.PointLight(accentColor, 0.4, 20);
        interiorLight.position.set(0, gs.height - 1, 0);
        garageGroup.add(interiorLight);

        this.group.add(garageGroup);

        return {
            id: project.id,
            mesh: garageGroup,
            door: door,
            doorPivot: doorPivot,
            artifact: artifact,
            trophies: trophies,
            position: new THREE.Vector3(x, 0, z),
            rotationY: rotationY,
            doorState: 'closed', // closed | opening | open | closing
            doorProgress: 0,
            artifactVisible: false,
            artifactProgress: 0,
            accentColor: accentColor
        };
    }

    // ==================== ARTIFACTS ====================
    buildArtifact(type, color) {
        const group = new THREE.Group();
        const mat = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9
        });
        const darkMat = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: color,
            emissiveIntensity: 0.1
        });

        switch (type) {
            case 'serverRack': {
                // Tall box with LED strips
                const rack = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 2), darkMat);
                rack.position.y = 3;
                group.add(rack);
                // LED indicators
                for (let i = 0; i < 5; i++) {
                    const led = new THREE.Mesh(
                        new THREE.BoxGeometry(2.4, 0.2, 0.1),
                        new THREE.MeshBasicMaterial({ color: color })
                    );
                    led.position.set(0, 1 + i * 1.1, 1.05);
                    group.add(led);
                }
                break;
            }
            case 'apiNodes': {
                // Spheres connected by cylinders
                const nodePositions = [
                    [0, 3, 0], [-2, 1.5, 1], [2, 1.5, -1],
                    [0, 5, 0], [-1.5, 4, 1.5], [1.5, 4, -1.5]
                ];
                nodePositions.forEach(pos => {
                    const node = new THREE.Mesh(
                        new THREE.SphereGeometry(0.5, 12, 12),
                        mat
                    );
                    node.position.set(...pos);
                    group.add(node);
                });
                // Connect nodes with thin cylinders
                for (let i = 0; i < nodePositions.length - 1; i++) {
                    const a = new THREE.Vector3(...nodePositions[i]);
                    const b = new THREE.Vector3(...nodePositions[i + 1]);
                    const mid = a.clone().add(b).multiplyScalar(0.5);
                    const len = a.distanceTo(b);
                    const cyl = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.08, 0.08, len, 6),
                        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 })
                    );
                    cyl.position.copy(mid);
                    cyl.lookAt(b);
                    cyl.rotateX(Math.PI / 2);
                    group.add(cyl);
                }
                break;
            }
            case 'scraperBot': {
                // Capsule body + antenna + blinking light
                const body = new THREE.Mesh(
                    new THREE.CapsuleGeometry(1, 2, 8, 12),
                    darkMat
                );
                body.position.y = 2.5;
                group.add(body);
                // Antenna
                const antenna = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, 2, 6),
                    mat
                );
                antenna.position.set(0, 4.5, 0);
                group.add(antenna);
                // Tip light
                const tip = new THREE.Mesh(
                    new THREE.SphereGeometry(0.2, 8, 8),
                    new THREE.MeshBasicMaterial({ color: color })
                );
                tip.position.set(0, 5.5, 0);
                group.add(tip);
                // "Eyes"
                const eyeMat = new THREE.MeshBasicMaterial({ color: color });
                const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), eyeMat);
                eyeL.position.set(-0.4, 3, 1);
                group.add(eyeL);
                const eyeR = eyeL.clone();
                eyeR.position.set(0.4, 3, 1);
                group.add(eyeR);
                break;
            }
            case 'databaseCore': {
                // Cylinder + orbiting rings
                const core = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.2, 1.2, 4, 16),
                    darkMat
                );
                core.position.y = 3;
                group.add(core);
                // Orbiting rings
                for (let i = 0; i < 3; i++) {
                    const ring = new THREE.Mesh(
                        new THREE.TorusGeometry(2 + i * 0.4, 0.1, 8, 32),
                        mat
                    );
                    ring.position.y = 2 + i * 1.2;
                    ring.rotation.x = Math.PI / 2 + (i - 1) * 0.3;
                    group.add(ring);
                }
                break;
            }
            default: {
                // Generic glowing sphere
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(2, 16, 16),
                    mat
                );
                sphere.position.y = 3;
                group.add(sphere);
            }
        }

        return group;
    }

    // ==================== TROPHY PLAQUES ====================
    buildTrophyPlaques(trophies, color, gs) {
        const plaques = [];
        if (!trophies || trophies.length === 0) return plaques;

        const count = Math.min(trophies.length, 4);
        const spacing = (gs.width - 2) / count;

        for (let i = 0; i < count; i++) {
            const trophy = trophies[i];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;

            // Background
            ctx.fillStyle = 'rgba(26, 10, 46, 0.9)';
            ctx.fillRect(0, 0, 256, 128);

            // Border glow
            ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
            ctx.lineWidth = 4;
            ctx.shadowColor = `#${color.toString(16).padStart(6, '0')}`;
            ctx.shadowBlur = 10;
            ctx.strokeRect(4, 4, 248, 120);

            // Value (big)
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = '#ffedbf';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 8;
            ctx.fillText(trophy.value, 128, 55);

            // Label (small)
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ffca7b';
            ctx.shadowBlur = 4;
            ctx.fillText(trophy.label, 128, 95);

            const texture = new THREE.CanvasTexture(canvas);
            const plaque = new THREE.Mesh(
                new THREE.PlaneGeometry(spacing - 0.5, (spacing - 0.5) * 0.5),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                })
            );

            const xOffset = -((count - 1) * spacing) / 2 + i * spacing;
            plaque.position.set(xOffset, gs.height * 0.5, -gs.depth / 2 + 0.3);
            plaques.push(plaque);
        }

        return plaques;
    }

    // ==================== EXIT PORTAL ====================
    buildExitPortal() {
        const portalGroup = new THREE.Group();

        // Portal base ring
        const ringGeo = new THREE.TorusGeometry(3, 0.4, 8, 32);
        const ringMat = new THREE.MeshPhongMaterial({
            color: 0xff7251,
            emissive: 0xff7251,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.5;
        portalGroup.add(ring);

        // Inner glow disc
        const discGeo = new THREE.CircleGeometry(2.5, 32);
        const discMat = new THREE.MeshBasicMaterial({
            color: 0xff7251,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.rotation.x = -Math.PI / 2;
        disc.position.y = 0.3;
        portalGroup.add(disc);

        // Vertical pillar markers (2 pillars)
        const pillarMat = new THREE.MeshPhongMaterial({
            color: 0x9b2948,
            emissive: 0xff7251,
            emissiveIntensity: 0.3
        });
        for (let side = -1; side <= 1; side += 2) {
            const pillar = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 8, 0.8),
                pillarMat
            );
            pillar.position.set(side * 3.5, 4, 0);
            pillar.castShadow = true;
            portalGroup.add(pillar);
        }

        // "EXIT" label
        const labelCanvas = document.createElement('canvas');
        const ctx = labelCanvas.getContext('2d');
        labelCanvas.width = 256;
        labelCanvas.height = 128;
        ctx.clearRect(0, 0, 256, 128);
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ff7251';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff7251';
        ctx.shadowBlur = 20;
        ctx.fillText('EXIT', 128, 50);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffedbf';
        ctx.shadowBlur = 8;
        ctx.fillText('Press F to leave', 128, 95);

        const texture = new THREE.CanvasTexture(labelCanvas);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 3),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
                depthTest: false
            })
        );
        label.position.set(0, 9, 0);
        portalGroup.add(label);

        // Point light
        const portalLight = new THREE.PointLight(0xff7251, 0.8, 15);
        portalLight.position.set(0, 3, 0);
        portalGroup.add(portalLight);

        const pos = CONFIG.PROJECTS_WORLD.EXIT_PORTAL_POSITION;
        portalGroup.position.set(pos.x, pos.y, pos.z);
        this.exitPortalPosition.set(pos.x, pos.y, pos.z);
        this.exitPortal = portalGroup;
        this.group.add(portalGroup);
    }

    // ==================== INTERACTION DETECTION ====================
    /**
     * Get nearest interactable (garage or exit portal)
     * @param {THREE.Vector3} carPosition
     * @returns {{ type: 'garage'|'exit', projectId?: string }|null}
     */
    getNearestInteractable(carPosition) {
        if (!carPosition) return null;

        const pw = CONFIG.PROJECTS_WORLD;

        // Check exit portal first
        const distToExit = carPosition.distanceTo(this.exitPortalPosition);
        if (distToExit < pw.EXIT_PORTAL_RADIUS) {
            return { type: 'exit' };
        }

        // Check garages
        let nearest = null;
        let nearestDist = Infinity;

        for (const garage of this.garages) {
            const dist = carPosition.distanceTo(garage.position);
            if (dist < pw.GARAGE_INTERACTION_RADIUS && dist < nearestDist) {
                nearestDist = dist;
                nearest = { type: 'garage', projectId: garage.id };
            }
        }

        return nearest;
    }

    // ==================== GARAGE INTERACTION ====================
    /**
     * Trigger garage interaction (open door + reveal artifact)
     * @param {string} projectId
     */
    triggerGarageInteraction(projectId) {
        const garage = this.garages.find(g => g.id === projectId);
        if (!garage) return;

        if (garage.doorState === 'closed' || garage.doorState === 'closing') {
            garage.doorState = 'opening';
            garage.artifactVisible = true;
        }
    }

    /**
     * Close a garage's door and hide artifact
     * @param {string} projectId
     */
    closeGarage(projectId) {
        const garage = this.garages.find(g => g.id === projectId);
        if (!garage) return;

        if (garage.doorState === 'open' || garage.doorState === 'opening') {
            garage.doorState = 'closing';
        }
    }

    // ==================== RESET (when exiting projects world) ====================
    reset() {
        for (const garage of this.garages) {
            garage.doorState = 'closing';
        }
    }

    // ==================== ANIMATION UPDATE ====================
    update(deltaTime) {
        const dt = deltaTime * 0.001; // ms to seconds
        this.time += dt;
        const pw = CONFIG.PROJECTS_WORLD;

        for (const garage of this.garages) {
            // Door animation
            if (garage.doorState === 'opening') {
                garage.doorProgress += dt * pw.DOOR_OPEN_SPEED;
                if (garage.doorProgress >= 1) {
                    garage.doorProgress = 1;
                    garage.doorState = 'open';
                }
            } else if (garage.doorState === 'closing') {
                garage.doorProgress -= dt * pw.DOOR_OPEN_SPEED;
                if (garage.doorProgress <= 0) {
                    garage.doorProgress = 0;
                    garage.doorState = 'closed';
                    garage.artifactVisible = false;
                }
            }

            // Apply door rotation (hinge open to the left, 90 degrees)
            garage.doorPivot.rotation.y = -garage.doorProgress * (Math.PI / 2);

            // Artifact reveal animation
            if (garage.artifactVisible) {
                garage.artifactProgress = Math.min(garage.artifactProgress + dt * pw.ARTIFACT_REVEAL_SPEED, 1);
                garage.artifact.visible = true;
                const s = this.easeOutBack(garage.artifactProgress);
                garage.artifact.scale.set(s, s, s);
                // Gentle bob
                garage.artifact.position.y = Math.sin(this.time * 2) * 0.3 + 0.5;
            } else {
                garage.artifactProgress = Math.max(garage.artifactProgress - dt * pw.ARTIFACT_REVEAL_SPEED * 2, 0);
                if (garage.artifactProgress <= 0) {
                    garage.artifact.visible = false;
                    garage.artifact.scale.set(0, 0, 0);
                } else {
                    const s = garage.artifactProgress;
                    garage.artifact.scale.set(s, s, s);
                }
            }
        }

        // Exit portal animation (ring rotation + pulsing)
        if (this.exitPortal) {
            const ring = this.exitPortal.children[0]; // Torus ring
            if (ring) {
                ring.rotation.z = this.time * 0.5;
            }
            const disc = this.exitPortal.children[1]; // Inner disc
            if (disc && disc.material) {
                disc.material.opacity = 0.2 + Math.sin(this.time * 3) * 0.15;
            }
        }
    }

    // Easing helper
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
}
