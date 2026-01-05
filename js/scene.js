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
        this.controls.enabled = !isMobile; // Keep enabled for desktop
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
        if (!carPosition) return;

        if (isMobile) {
            // Mobile: Fixed camera behind car
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
        } else {
            // Desktop: OrbitControls target follows car (hybrid mode)
            const targetPosition = new THREE.Vector3(carPosition.x, 0, carPosition.z);
            this.controls.target.lerp(targetPosition, CONFIG.CAMERA.DESKTOP_FOLLOW_LERP || 0.1);
        }
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        // Only update OrbitControls on desktop
        if (!isMobile) {
            this.controls.update();
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}