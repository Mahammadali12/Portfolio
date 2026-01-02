// ==================== CONFIGURATION ====================

export const CONFIG = {
    // Physics
    PHYSICS: {
        CAR_ACCELERATION: 0.55,
        CAR_DECELERATION: 0.9,
        MAX_SPEED: 2.5,
        DRIFT_FACTOR: 0.85,
        TURN_SPEED: 0.05,
        BOUNCE_DAMPING: -0.3
    },

    // Camera
    CAMERA: {
        FOV: 45,
        NEAR: 0.1,
        FAR: 1000,
        INITIAL_POSITION: { x: 0, y: 80, z: 80 },
        MOBILE_OFFSET: { x: 45, y: 60, z: 45 },
        MOBILE_LERP_SPEED: 0.05,
        ORBIT_MIN_DISTANCE: 30,
        ORBIT_MAX_DISTANCE: 150,
        ORBIT_MIN_POLAR_ANGLE: Math.PI / 6,
        ORBIT_MAX_POLAR_ANGLE: Math.PI / 2.2,
        ORBIT_DAMPING_FACTOR: 0.05
    },

    // Scene
    SCENE: {
        GROUND_SIZE: 100,
        BOUNDARY: {
            minX: -50,
            maxX: 50,
            minZ: -50,
            maxZ: 50
        }
    },

    // Lighting
    LIGHTING: {
        AMBIENT_COLOR: 0xffedbf,
        AMBIENT_INTENSITY: 0.8,
        DIRECTIONAL_COLOR: 0xffedbf,
        DIRECTIONAL_INTENSITY: 1.2,
        DIRECTIONAL_POSITION: { x: 20, y: 40, z: 15 },
        SHADOW_CAMERA_SIZE: 40,
        SHADOW_MAP_SIZE: 2048
    },

    // Colors
    COLORS: {
        BACKGROUND: 0x000000,
        GROUND: 0xffedbf,
        GRID: 0x9b2948,
        BOUNDARY: 0xff7251,
        DUST: 0xffcd74,
        DRIFT_TRAIL: 0x333333
    },

    // Sections
    SECTIONS: {
        PROFILE: {
            position: { x: 0, y: 0, z: 0 },
            size: { x: 18, y: 18 },
            color: 0xff7251,
            title: "👤 Profile",
            icon: "👤",
            buildingType: "center"
        },
        EDUCATION: {
            position: { x: 30, y: 0, z: -30 },
            size: { x: 15, y: 15 },
            color: 0x9b2948,
            title: "🎓 Education",
            icon: "🎓",
            buildingType: "university"
        },
        EXPERIENCE: {
            position: { x: -30, y: 0, z: 30 },
            size: { x: 15, y: 15 },
            color: 0xffca7b,
            title: "💼 Experience",
            icon: "💼",
            buildingType: "office"
        },
        PROJECTS: {
            position: { x: 30, y: 0, z: 30 },
            size: { x: 15, y: 15 },
            color: 0xffcd74,
            title: "🚀 Projects",
            icon: "🚀",
            buildingType: "lab"
        },
        SKILLS: {
            position: { x: -30, y: 0, z: -30 },
            size: { x: 15, y: 15 },
            color: 0xffedbf,
            title: "⚡ Skills",
            icon: "⚡",
            buildingType: "tower"
        }
    },

    // Effects
    EFFECTS: {
        DUST_PARTICLE_COUNT: 3,
        DUST_LIFETIME_DECAY: 0.02,
        DUST_GRAVITY: 0.002,
        DRIFT_TRAIL_OPACITY: 0.6,
        DRIFT_TRAIL_DECAY: 0.03,
        BACKGROUND_PARTICLE_COUNT: 30
    },

    // Car
    CAR: {
        SCALE: { x: 1.5, y: 1.5, z: 1.5 },
        START_POSITION: { x: 15, y: 1, z: 15 },
        START_ROTATION: Math.PI,
        MODEL_PATH: 'assets/car.glb',
        FALLBACK_SIZE: { body: [2.5, 1, 4.5], wheel: [0.4, 0.4, 0.3] }
    },

    // Mobile - Updated for Smash Bandits style circular control
    MOBILE: {
        SWIPE_THRESHOLD: 30,
        HOLD_THRESHOLD: 100,
        TURN_INTENSITY_MAX: 1.5,
        HORIZONTAL_SWIPE_THRESHOLD: 0.7,
        DRIFT_SWIPE_MULTIPLIER: 1.5,
        CIRCULAR_CONTROL: {
            THUMB_SIZE: 55,            // Diameter of the joystick thumb (constant)
            SAFETY_PADDING: 10,        // Pixels from screen edge
            DEAD_ZONE: 0.1,            // Dead zone threshold
            STEERING_LERP: 0.15,       // How fast car follows joystick (0-1)
            RETURN_LERP: 0.1,          // How fast joystick returns to center
            RETURN_TO_CENTER: false    // Whether joystick returns when released
        }
    },

    // UI
    UI: {
        PANEL_COOLDOWN_MS: 1500,
        PANEL_ANIMATION_DELAY_MS: 300,
        PANEL_CONTENT_ANIMATION_MS: 800,
        PANEL_FADE_OUT_DELAY_MS: 200,
        PANEL_CLEAR_DELAY_MS: 500,
        LOADING_DELAY_MS: 1000
    }
};

// Device detection
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);