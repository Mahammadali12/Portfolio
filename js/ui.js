// ==================== UI MANAGEMENT ====================

import * as THREE from 'three';
import { CONFIG, isMobile } from './config.js';
import { sectionsData } from './sections.js';
import { BuildingManager } from './effects.js';

export class UIManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.buildingManager = new BuildingManager(scene);
        
        this.sectionMeshes = [];
        this.sectionLabels = [];
        this.currentSection = null;
        this.panelCooldown = false;
        this.panelCooldownTimeout = null;
        this.isPanelAnimating = false;
        this.currentPanelAnimation = null;
        
        this.mobilePendingSection = null;
        this.mobileSectionBtn = document.getElementById('mobile-section-btn');
        
        this.initSections();
        this.initMobileButton();
        
        // Expose close function globally
        window.hideSectionInfo = () => this.hideSectionInfo();
    }

    initSections() {
        Object.keys(CONFIG.SECTIONS).forEach(key => {
            const config = CONFIG.SECTIONS[key];
            const lowerKey = key.toLowerCase();
            
            // Create section ground plate
            this.createSectionPlate(lowerKey, config);
            
            // Create billboard label
            this.createBillboardLabel(config);
            
            // Create building
            this.buildingManager.createBuilding(
                config.buildingType,
                config.color,
                config.position
            );
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
        
        // Add glow to center section
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

        // Add border
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
        
        // Background gradient
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        const r = config.color >> 16 & 255;
        const g = config.color >> 8 & 255;
        const b = config.color & 255;
        
        gradient.addColorStop(0, `rgba(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)}, 0.95)`);
        gradient.addColorStop(1, `rgba(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)}, 0.85)`);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        context.strokeStyle = '#3a1c00';
        context.lineWidth = 10;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Text
        context.font = 'bold 48px Arial';
        context.fillStyle = '#3a1c00';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = 'rgba(255, 237, 191, 0.8)';
        context.shadowBlur = 10;
        
        // Icon
        context.font = 'bold 64px Arial';
        context.fillText(config.icon, canvas.width/2 - 100, canvas.height/2);
        
        // Title
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

    initMobileButton() {
        if (!this.mobileSectionBtn) return;
        
        this.mobileSectionBtn.addEventListener('click', () => {
            if (this.mobilePendingSection) {
                this.mobileSectionBtn.classList.remove('show');
                setTimeout(() => {
                    this.mobileSectionBtn.style.display = 'none';
                }, 250);
                this.showSectionInfo(this.mobilePendingSection);
            }
        });
    }

    checkSectionCollision(carPosition) {
        if (!carPosition || this.panelCooldown || this.isPanelAnimating) return;
        
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
                if (this.currentSection !== foundKey) {
                    this.showSectionInfo(foundKey);
                }
            }
            return;
        }

        // Car left all sections
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

        if (this.currentSection !== null && !foundSection && !this.panelCooldown) {
            this.hideSectionInfo();
        }
    }

    showSectionInfo(sectionKey) {
        if (this.panelCooldown || this.currentSection === sectionKey || this.isPanelAnimating) return;

        if (isMobile && this.mobileSectionBtn) {
            this.mobileSectionBtn.classList.remove('show');
            setTimeout(() => {
                this.mobileSectionBtn.style.display = 'none';
            }, 250);
        }

        if (isMobile) {
            const sectionInfo = document.getElementById('section-info');
            sectionInfo.style.pointerEvents = 'auto';
        }

        this.isPanelAnimating = true;
        const sectionContent = document.getElementById('section-content');
        const sectionInfo = document.getElementById('section-info');

        sectionInfo.classList.remove('panel-show');
        sectionContent.classList.remove('section-content-animate');

        if (this.currentPanelAnimation) {
            clearTimeout(this.currentPanelAnimation);
            this.currentPanelAnimation = null;
        }

        if (this.panelCooldownTimeout) {
            clearTimeout(this.panelCooldownTimeout);
            this.panelCooldown = false;
        }

        sectionContent.innerHTML = sectionsData[sectionKey].content;
        void sectionInfo.offsetWidth;
        sectionInfo.classList.add('panel-show');

        this.currentPanelAnimation = setTimeout(() => {
            sectionContent.classList.add('section-content-animate');
            setTimeout(() => {
                this.isPanelAnimating = false;
                this.currentPanelAnimation = null;
            }, CONFIG.UI.PANEL_CONTENT_ANIMATION_MS);
        }, CONFIG.UI.PANEL_ANIMATION_DELAY_MS);

        this.highlightSection(sectionKey);
        this.currentSection = sectionKey;
    }

    hideSectionInfo() {
        this.isPanelAnimating = true;
        const sectionInfo = document.getElementById('section-info');
        const sectionContent = document.getElementById('section-content');

        if (!sectionInfo.classList.contains('panel-show')) {
            this.isPanelAnimating = false;
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

        sectionContent.style.opacity = '0';
        sectionContent.style.transform = 'translateY(10px)';

        setTimeout(() => {
            sectionInfo.classList.remove('panel-show');
            sectionContent.classList.remove('section-content-animate');
            this.currentSection = null;
            this.removeSectionHighlight();

            setTimeout(() => {
                if (!sectionInfo.classList.contains('panel-show')) {
                    sectionContent.innerHTML = '';
                    sectionContent.style.opacity = '1';
                    sectionContent.style.transform = 'translateY(0)';
                }
                this.isPanelAnimating = false;

                if (isMobile && this.mobilePendingSection && this.mobileSectionBtn) {
                    const title = CONFIG.SECTIONS[this.mobilePendingSection.toUpperCase()].title.replace(/^[^A-Za-z0-9]+/, '').trim();
                    this.mobileSectionBtn.textContent = title;
                    this.mobileSectionBtn.style.display = 'block';
                    void this.mobileSectionBtn.offsetWidth;
                    this.mobileSectionBtn.classList.add('show');
                }
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

    update(carPosition) {
        this.checkSectionCollision(carPosition);
        this.updateBillboards();
    }
}