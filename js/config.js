// ==================== CONFIGURATION ====================

export const CONFIG = {
    // Physics - Force-based system
    PHYSICS: {
        // Mass and inertia
        CAR_MASS: 1000,                    // kg (realistic car mass)
        MOMENT_OF_INERTIA: 1500,           // kg·m² (kept same - realistic for car dimensions)
        
        // Forces
        ENGINE_FORCE: 15,                  // N (forward thrust) - scaled 100x down
        BRAKE_FORCE: 60,                   // N (braking force) - scaled 100x down
        REVERSE_FORCE: 15,                 // N (reverse thrust) - scaled 100x down
        
        // Steering
        STEERING_FORCE: 10,                // N (lateral steering force) - scaled 100x down
        MIN_STEERING_SPEED: 0.05,          // Minimum speed required for steering to work
        HANDBRAKE_STEERING_MULTIPLIER: 0.25, // Steering effectiveness during handbrake (25%)
        
        // Resistance
        DRAG_COEFFICIENT: 0.4,             // Air resistance coefficient
        ROLLING_RESISTANCE: 0.5,           // N (constant rolling friction) - scaled 100x down
        ANGULAR_DRAG: 0.95,                // Angular velocity decay
        
        // Traction
        TRACTION_COEFFICIENT: 0.85,        // Base tire grip
        TRACTION_SPEED_FALLOFF: 0.3,       // How much traction decreases with speed
        MIN_TRACTION: 0.3,                 // Minimum traction at high speed
        
        // Limits
        MAX_SPEED: 2.5,                    // Maximum velocity magnitude
        MAX_REVERSE_SPEED: 1.0,            // Maximum reverse speed
        MAX_ANGULAR_VELOCITY: 0.05,        // Maximum rotation speed (rad/frame)
        
        // Drift
        DRIFT_THRESHOLD: 0.5,              // Speed threshold for drift
        DRIFT_ANGLE_THRESHOLD: 0.3,        // Angle difference to trigger drift
        DRIFT_MOMENTUM_PRESERVATION: 0.95, // How much momentum carries through drift
        
        // Collision
        BOUNCE_DAMPING: -0.3,              // Velocity multiplier on collision
        COLLISION_FRICTION: 0.7,           // Additional friction on collision
        
        // Time step (for consistent physics)
        FIXED_TIMESTEP: 1/60               // 60 FPS physics
    },

    // Camera
    CAMERA: {
        FOV: 45,
        NEAR: 0.1,
        FAR: 1000,
        INITIAL_POSITION: { x: 0, y: 80, z: 80 },
        MOBILE_OFFSET: { x: 45, y: 60, z: 45 },
        MOBILE_LERP_SPEED: 0.05,
        DESKTOP_FOLLOW_LERP: 0.1,          // NEW: Smooth following on desktop
        ORBIT_MIN_DISTANCE: 30,
        ORBIT_MAX_DISTANCE: 150,
        ORBIT_MIN_POLAR_ANGLE: Math.PI / 6,
        ORBIT_MAX_POLAR_ANGLE: Math.PI / 2.2,
        ORBIT_DAMPING_FACTOR: 0.05
    },

    // Scene
    SCENE: {
        GROUND_SIZE: 200,
        BOUNDARY: {
            minX: -100,
            maxX: 100,
            minZ: -100,
            maxZ: 100
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
            THUMB_SIZE: 55,
            SAFETY_PADDING: 25,
            DEAD_ZONE: 0.1,
            STEERING_LERP: 0.15,
            RETURN_LERP: 0.1,
            RETURN_TO_CENTER: false
        },
        // Mobile-specific physics multipliers for responsiveness
        ENGINE_FORCE_MULTIPLIER: 1.2,      // More responsive acceleration - REDUCED from 1.4
        STEERING_FORCE_MULTIPLIER: 1.5,    // More responsive steering
        TORQUE_MULTIPLIER: 1.3             // Faster rotation response
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