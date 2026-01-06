// ==================== UI MANAGEMENT ====================

import * as THREE from 'three';
import { CONFIG, isMobile } from './config.js';
import { sectionsData } from './sections.js';

export class UIManager {
    constructor(scene, camera, sceneManager) {
        this.scene = scene;
        this.camera = camera;
        this.sceneManager = sceneManager; // Reference to SceneManager for camera control
        
        this.sectionMeshes = [];
        this.sectionLabels = [];
        this.currentSection = null;
        this.panelCooldown = false;
        this.panelCooldownTimeout = null;
        this.isPanelAnimating = false;
        this.currentPanelAnimation = null;
        
        // Interaction state
        this.sectionInRange = null;          // Section car is currently in
        this.isInteracting = false;          // Whether panel is open (car locked)
        this.interactionIndicator = null;
        
        // Camera transition state
        this.isCameraTransitioning = false;
        this.cameraTransitionStart = null;
        this.cameraTransitionEnd = null;
        this.cameraTransitionProgress = 0;
        this.cameraTransitionDuration = 0;
        this.cameraReturnPosition = null;
        this.cameraReturnTarget = null;
        
        this.mobilePendingSection = null;
        this.mobileSectionBtn = document.getElementById('mobile-section-btn');
        
        this.initSections();
        this.initMobileButton();
        this.initInteractionIndicator();
        this.initKeyboardListener();
        
        // Expose close function globally
        window.hideSectionInfo = () => this.hideSectionInfo();
    }

    initSections() {
        Object.keys(CONFIG.SECTIONS).forEach(key => {
            const config = CONFIG.SECTIONS[key];
            const lowerKey = key.toLowerCase();
            
            this.createSectionPlate(lowerKey, config);
            this.createBillboardLabel(config);
        });
    }

    createSectionPlate(key, config) {
        const geometry = new THREE.BoxGeometry(config.size.x, 0.5, config.size.y);
        const material = new THREE.MeshPhongMaterial({ 
            color: config.color,
            transparent: true,
            opacity: 0.9,
            emissive: config.color,
            emissiveIntensity: key === 'profile' ? 0.6 : 0.4
        });
        
        const box = new THREE.Mesh(geometry, material);
        box.position.set(config.position.x, 0.25, config.position.z);
        box.userData = { type: 'section', id: key };
        box.castShadow = true;
        box.receiveShadow = true;
        
        if (key === 'profile') {
            const glowGeometry = new THREE.BoxGeometry(config.size.x + 1, 0.1, config.size.y + 1);
            const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: config.color,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.y = 0.05;
            box.add(glow);
        }
        
        this.scene.add(box);
        this.sectionMeshes.push(box);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
            color: 0x3a1c00,
            linewidth: 2 
        }));
        box.add(line);
    }

    createBillboardLabel(config) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        const r = config.color >> 16 & 255;
        const g = config.color >> 8 & 255;
        const b = config.color & 255;
        
        gradient.addColorStop(0, `rgba(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)}, 0.95)`);
        gradient.addColorStop(1, `rgba(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)}, 0.85)`);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.strokeStyle = '#3a1c00';
        context.lineWidth = 10;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        context.font = 'bold 48px Arial';
        context.fillStyle = '#3a1c00';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = 'rgba(255, 237, 191, 0.8)';
        context.shadowBlur = 10;
        
        context.font = 'bold 64px Arial';
        context.fillText(config.icon, canvas.width/2 - 100, canvas.height/2);
        
        context.font = 'bold 48px Arial';
        context.fillText(config.title, canvas.width/2 + 40, canvas.height/2);

        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(12, 6);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(config.position.x, 10, config.position.z);
        label.userData = { billboard: true };
        this.scene.add(label);
        this.sectionLabels.push(label);
    }

    initInteractionIndicator() {
        this.interactionIndicator = document.getElementById('interaction-indicator');
    }

    initKeyboardListener() {
        if (isMobile) return; // No keyboard on mobile
        
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f' && this.sectionInRange && !this.isInteracting) {
                this.triggerInteraction(this.sectionInRange);
            }
        });
    }

    initMobileButton() {
        if (!this.mobileSectionBtn) return;
        
        this.mobileSectionBtn.addEventListener('click', () => {
            if (this.mobilePendingSection && !this.isInteracting) {
                this.triggerInteraction(this.mobilePendingSection);
            }
        });
    }

    showInteractionIndicator(sectionKey) {
        if (isMobile || !this.interactionIndicator) return;
        
        const config = CONFIG.SECTIONS[sectionKey.toUpperCase()];
        if (config) {
            this.interactionIndicator.style.display = 'block';
        }
    }

    hideInteractionIndicator() {
        if (this.interactionIndicator) {
            this.interactionIndicator.style.display = 'none';
        }
    }

    checkSectionCollision(carPosition) {
        if (!carPosition || this.isInteracting) return;
        
        let foundSection = false;
        let foundKey = null;
        
        for (const [key, config] of Object.entries(CONFIG.SECTIONS)) {
            const lowerKey = key.toLowerCase();
            const bounds = {
                x: {
                    min: config.position.x - config.size.x / 2,
                    max: config.position.x + config.size.x / 2
                },
                z: {
                    min: config.position.z - config.size.y / 2,
                    max: config.position.z + config.size.y / 2
                }
            };
            
            if (carPosition.x > bounds.x.min && carPosition.x < bounds.x.max &&
                carPosition.z > bounds.z.min && carPosition.z < bounds.z.max) {
                foundSection = true;
                foundKey = lowerKey;
                break;
            }
        }

        if (foundSection) {
            if (this.sectionInRange !== foundKey) {
                this.sectionInRange = foundKey;
                
                if (isMobile) {
                    this.mobilePendingSection = foundKey;
                    if (this.mobileSectionBtn) {
                        const title = CONFIG.SECTIONS[foundKey.toUpperCase()].title.replace(/^[^A-Za-z0-9]+/, '');
                        this.mobileSectionBtn.textContent = title;
                        this.mobileSectionBtn.style.display = 'block';
                        void this.mobileSectionBtn.offsetWidth;
                        this.mobileSectionBtn.classList.add('show');
                    }
                } else {
                    this.showInteractionIndicator(foundKey);
                }
            }
            return;
        }

        // Car left all sections
        if (this.sectionInRange !== null) {
            this.sectionInRange = null;
            this.hideInteractionIndicator();
            
            if (isMobile) {
                this.mobilePendingSection = null;
                if (this.mobileSectionBtn) {
                    this.mobileSectionBtn.classList.remove('show');
                    setTimeout(() => {
                        if (!this.mobilePendingSection) {
                            this.mobileSectionBtn.style.display = 'none';
                        }
                    }, 250);
                }
            }
        }
    }

    triggerInteraction(sectionKey) {
        if (this.isInteracting || this.isPanelAnimating || this.panelCooldown) return;
        
        this.isInteracting = true;
        this.hideInteractionIndicator();
        
        // Hide mobile button
        if (isMobile && this.mobileSectionBtn) {
            this.mobileSectionBtn.classList.remove('show');
            setTimeout(() => {
                this.mobileSectionBtn.style.display = 'none';
            }, 250);
        }
        
        // Start camera transition to section
        this.animateCameraToSection(sectionKey, () => {
            // After camera arrives, show panel with fly-in animation
            this.showSectionInfoWithFlyIn(sectionKey);
        });
    }

    animateCameraToSection(sectionKey, onComplete) {
        const config = CONFIG.SECTIONS[sectionKey.toUpperCase()];
        if (!config || !this.sceneManager) {
            if (onComplete) onComplete();
            return;
        }
        
        // Store current camera state for return
        this.cameraReturnPosition = this.camera.position.clone();
        this.cameraReturnTarget = this.sceneManager.controls ? 
            this.sceneManager.controls.target.clone() : 
            new THREE.Vector3(0, 0, 0);
        
        // Calculate target camera position for section view
        const sectionPos = new THREE.Vector3(config.position.x, 0, config.position.z);
        const cameraOffset = new THREE.Vector3(
            Math.sin(CONFIG.CAMERA.SECTION_VIEW_ANGLE) * CONFIG.CAMERA.SECTION_VIEW_DISTANCE,
            CONFIG.CAMERA.SECTION_VIEW_HEIGHT,
            Math.cos(CONFIG.CAMERA.SECTION_VIEW_ANGLE) * CONFIG.CAMERA.SECTION_VIEW_DISTANCE
        );
        
        const targetCameraPos = sectionPos.clone().add(cameraOffset);
        const targetLookAt = sectionPos.clone();
        targetLookAt.y = 2; // Look slightly above ground
        
        this.isCameraTransitioning = true;
        this.cameraTransitionProgress = 0;
        this.cameraTransitionDuration = CONFIG.CAMERA.SECTION_TRANSITION_DURATION;
        this.cameraTransitionStart = {
            position: this.camera.position.clone(),
            target: this.sceneManager.controls ? this.sceneManager.controls.target.clone() : new THREE.Vector3()
        };
        this.cameraTransitionEnd = {
            position: targetCameraPos,
            target: targetLookAt
        };
        this.cameraTransitionCallback = onComplete;
    }

    animateCameraReturn(onComplete) {
        if (!this.cameraReturnPosition) {
            if (onComplete) onComplete();
            return;
        }
        
        this.isCameraTransitioning = true;
        this.cameraTransitionProgress = 0;
        this.cameraTransitionDuration = CONFIG.CAMERA.SECTION_RETURN_DURATION;
        this.cameraTransitionStart = {
            position: this.camera.position.clone(),
            target: this.sceneManager.controls ? this.sceneManager.controls.target.clone() : new THREE.Vector3()
        };
        this.cameraTransitionEnd = {
            position: this.cameraReturnPosition,
            target: this.cameraReturnTarget
        };
        this.cameraTransitionCallback = onComplete;
    }

    updateCameraTransition(deltaTime) {
        if (!this.isCameraTransitioning) return;
        
        this.cameraTransitionProgress += deltaTime / this.cameraTransitionDuration;
        
        if (this.cameraTransitionProgress >= 1) {
            this.cameraTransitionProgress = 1;
            this.isCameraTransitioning = false;
            
            // Apply final position
            this.camera.position.copy(this.cameraTransitionEnd.position);
            if (this.sceneManager.controls) {
                this.sceneManager.controls.target.copy(this.cameraTransitionEnd.target);
            }
            this.camera.lookAt(this.cameraTransitionEnd.target);
            
            if (this.cameraTransitionCallback) {
                this.cameraTransitionCallback();
                this.cameraTransitionCallback = null;
            }
            return;
        }
        
        // Easing function (ease-out cubic)
        const t = 1 - Math.pow(1 - this.cameraTransitionProgress, 3);
        
        // Interpolate position
        this.camera.position.lerpVectors(
            this.cameraTransitionStart.position,
            this.cameraTransitionEnd.position,
            t
        );
        
        // Interpolate look-at target
        if (this.sceneManager.controls) {
            this.sceneManager.controls.target.lerpVectors(
                this.cameraTransitionStart.target,
                this.cameraTransitionEnd.target,
                t
            );
        }
        
        this.camera.lookAt(
            new THREE.Vector3().lerpVectors(
                this.cameraTransitionStart.target,
                this.cameraTransitionEnd.target,
                t
            )
        );
    }

    getScreenPositionFromWorld(worldPos) {
        const vector = worldPos.clone();
        vector.project(this.camera);
        
        return {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: (-vector.y * 0.5 + 0.5) * window.innerHeight
        };
    }

    showSectionInfoWithFlyIn(sectionKey) {
        if (this.currentSection === sectionKey || this.isPanelAnimating) return;
        
        this.isPanelAnimating = true;
        const sectionContent = document.getElementById('section-content');
        const sectionInfo = document.getElementById('section-info');
        
        // Get section world position
        const config = CONFIG.SECTIONS[sectionKey.toUpperCase()];
        const worldPos = new THREE.Vector3(config.position.x, 5, config.position.z);
        const screenPos = this.getScreenPositionFromWorld(worldPos);
        
        // Set content
        sectionContent.innerHTML = sectionsData[sectionKey].content;
        sectionContent.classList.remove('section-content-animate');
        
        // Calculate final position
        const finalRight = 20;
        const finalTop = 20;
        const panelWidth = 350;
        
        // Start position (from world position)
        const startX = screenPos.x - panelWidth / 2;
        const startY = screenPos.y;
        
        // Apply starting transform
        sectionInfo.classList.add('panel-flying');
        sectionInfo.style.right = 'auto';
        sectionInfo.style.left = `${startX}px`;
        sectionInfo.style.top = `${startY}px`;
        sectionInfo.style.transform = 'scale(0.3)';
        sectionInfo.style.opacity = '0';
        
        // Force reflow
        void sectionInfo.offsetWidth;
        
        // Animate to final position
        const duration = CONFIG.UI.PANEL_FLY_DURATION;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic
            const t = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate position
            const currentX = startX + (window.innerWidth - panelWidth - finalRight - startX) * t;
            const currentY = startY + (finalTop - startY) * t;
            const currentScale = 0.3 + (1 - 0.3) * t;
            const currentOpacity = t;
            
            sectionInfo.style.left = `${currentX}px`;
            sectionInfo.style.top = `${currentY}px`;
            sectionInfo.style.transform = `scale(${currentScale})`;
            sectionInfo.style.opacity = `${currentOpacity}`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete - switch to final CSS positioning
                sectionInfo.classList.remove('panel-flying');
                sectionInfo.style.left = '';
                sectionInfo.style.top = '';
                sectionInfo.style.transform = '';
                sectionInfo.style.opacity = '';
                sectionInfo.style.right = `${finalRight}px`;
                sectionInfo.classList.add('panel-show');
                
                // Animate content
                setTimeout(() => {
                    sectionContent.classList.add('section-content-animate');
                    this.isPanelAnimating = false;
                }, 100);
            }
        };
        
        requestAnimationFrame(animate);
        
        this.highlightSection(sectionKey);
        this.currentSection = sectionKey;
    }

    hideSectionInfo() {
        this.isPanelAnimating = true;
        const sectionInfo = document.getElementById('section-info');
        const sectionContent = document.getElementById('section-content');

        if (!sectionInfo.classList.contains('panel-show')) {
            this.isPanelAnimating = false;
            this.isInteracting = false;
            return;
        }

        this.panelCooldown = true;
        if (this.panelCooldownTimeout) {
            clearTimeout(this.panelCooldownTimeout);
        }

        this.panelCooldownTimeout = setTimeout(() => {
            this.panelCooldown = false;
            this.panelCooldownTimeout = null;
        }, CONFIG.UI.PANEL_COOLDOWN_MS);

        // Fade out content first
        sectionContent.style.opacity = '0';
        sectionContent.style.transform = 'translateY(10px)';

        setTimeout(() => {
            // Remove panel-show class and reset all positioning styles
            sectionInfo.classList.remove('panel-show');
            sectionContent.classList.remove('section-content-animate');
            
            // Reset all inline styles that might have been set during fly-in animation
            sectionInfo.style.left = '';
            sectionInfo.style.top = '';
            sectionInfo.style.right = '';
            sectionInfo.style.transform = '';
            sectionInfo.style.opacity = '';
            
            this.currentSection = null;
            this.removeSectionHighlight();

            // Start camera return animation
            this.animateCameraReturn(() => {
                this.isInteracting = false;
                
                // Re-show interaction indicator if still in section
                if (this.sectionInRange) {
                    if (isMobile && this.mobileSectionBtn) {
                        const title = CONFIG.SECTIONS[this.sectionInRange.toUpperCase()].title.replace(/^[^A-Za-z0-9]+/, '');
                        this.mobileSectionBtn.textContent = title;
                        this.mobileSectionBtn.style.display = 'block';
                        void this.mobileSectionBtn.offsetWidth;
                        this.mobileSectionBtn.classList.add('show');
                        this.mobilePendingSection = this.sectionInRange;
                    } else {
                        this.showInteractionIndicator(this.sectionInRange);
                    }
                }
            });

            setTimeout(() => {
                if (!sectionInfo.classList.contains('panel-show')) {
                    sectionContent.innerHTML = '';
                    sectionContent.style.opacity = '1';
                    sectionContent.style.transform = 'translateY(0)';
                }
                this.isPanelAnimating = false;
            }, CONFIG.UI.PANEL_CLEAR_DELAY_MS);
        }, CONFIG.UI.PANEL_FADE_OUT_DELAY_MS);
    }

    highlightSection(sectionKey) {
        this.removeSectionHighlight();

        this.sectionMeshes.forEach(mesh => {
            if (mesh.userData.id === sectionKey) {
                mesh.userData.originalEmissive = mesh.material.emissive.getHex();
                mesh.userData.originalOpacity = mesh.material.opacity;
                mesh.material.emissive.setHex(0xffffff);
                mesh.material.emissiveIntensity = 0.8;
                mesh.material.opacity = 1.0;

                let pulseTime = 0;
                const pulseMaterial = mesh.material;

                function pulseAnimation() {
                    if (mesh.userData.isHighlighted) {
                        pulseTime += 0.05;
                        const pulse = Math.sin(pulseTime) * 0.2 + 0.8;
                        pulseMaterial.emissiveIntensity = 0.6 + pulse * 0.4;
                        requestAnimationFrame(pulseAnimation);
                    }
                }

                mesh.userData.isHighlighted = true;
                mesh.userData.pulseAnimation = pulseAnimation;
                pulseAnimation();
            }
        });
    }

    removeSectionHighlight() {
        this.sectionMeshes.forEach(mesh => {
            if (mesh.userData.originalEmissive !== undefined) {
                mesh.material.emissive.setHex(mesh.userData.originalEmissive);
                mesh.material.emissiveIntensity = 0.4;
                mesh.material.opacity = mesh.userData.originalOpacity;
                mesh.userData.isHighlighted = false;
                delete mesh.userData.pulseAnimation;
            }
        });
    }

    updateBillboards() {
        this.sectionLabels.forEach(label => {
            label.lookAt(this.camera.position);
        });
    }

    // Check if car controls should be locked
    isCarLocked() {
        return this.isInteracting;
    }

    update(carPosition, deltaTime = 16.67) {
        this.checkSectionCollision(carPosition);
        this.updateBillboards();
        this.updateCameraTransition(deltaTime);
    }
}